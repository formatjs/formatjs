//! Relative patterns and their internal number/plural data load as one owned pack.
mod data;
pub mod ffi;
pub mod registry;
pub use data::LocaleData;
use formatjs_intl_numberformat::NumberFormat;
use serde::{Deserialize, Serialize};
use std::{borrow::Cow, sync::Arc};

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Options {
    pub locale_matcher: Option<String>,
    pub numbering_system: Option<String>,
    pub style: Option<String>,
    pub numeric: Option<String>,
}
pub(crate) fn choice<'a>(
    value: Option<&'a str>,
    default: &'a str,
    allowed: &[&str],
    key: &'static str,
) -> Result<&'a str, Error> {
    let value = value.unwrap_or(default);
    if allowed.contains(&value) {
        Ok(value)
    } else {
        Err(Error::InvalidOption(key))
    }
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Resolution {
    locale: String,
    data_locale: String,
    numbering_system: String,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedOptions {
    pub locale: String,
    pub style: String,
    pub numeric: String,
    pub numbering_system: String,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct Part {
    #[serde(rename = "type")]
    pub kind: &'static str,
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unit: Option<&'static str>,
}
enum Piece<'a, N> {
    Literal(&'a str),
    Number(&'a mut N, &'static str, bool),
}
pub struct RelativeTimeFormat {
    data: Arc<LocaleData>,
    resolved: ResolvedOptions,
    number: Arc<NumberFormat>,
}
impl RelativeTimeFormat {
    pub(crate) fn new(
        data: Arc<LocaleData>,
        resolution: &Resolution,
        options: &Options,
    ) -> Result<Self, Error> {
        let style = choice(
            options.style.as_deref(),
            "long",
            &["long", "short", "narrow"],
            "style",
        )?;
        let numeric = choice(
            options.numeric.as_deref(),
            "always",
            &["always", "auto"],
            "numeric",
        )?;
        let number = data.number_format(resolution)?;
        let resolved = ResolvedOptions {
            locale: resolution.locale.clone(),
            style: style.into(),
            numeric: numeric.into(),
            numbering_system: resolution.numbering_system.clone(),
        };
        Ok(Self {
            data,
            resolved,
            number,
        })
    }
    pub fn resolved_options(&self) -> &ResolvedOptions {
        &self.resolved
    }
    pub fn format(&self, value: &str, unit: &str) -> Result<String, Error> {
        let numeric = value.parse::<f64>().map_err(|_| Error::InvalidNumber)?;
        self.format_with(numeric, unit, || {
            self.number.format_decimal_string_with_plural(
                value.strip_prefix('-').unwrap_or(value),
                &self.data.plurals,
            )
        })
    }
    /// Format a Number after host coercion, without reparsing its binary value.
    pub fn format_number(&self, value: f64, unit: &str) -> Result<String, Error> {
        self.format_with(value, unit, || {
            let mut buffer = ryu::Buffer::new();
            let text = buffer.format_finite(value.abs());
            let text = text.strip_suffix(".0").unwrap_or(text);
            self.number
                .format_decimal_string_with_plural(text, &self.data.plurals)
        })
    }
    fn format_with(
        &self,
        numeric: f64,
        unit: &str,
        format_number: impl FnOnce()
            -> Result<(String, &'static str), formatjs_intl_numberformat::Error>,
    ) -> Result<String, Error> {
        let mut result = String::with_capacity(32);
        self.visit_pattern(numeric, unit, format_number, |piece| match piece {
            Piece::Literal(value) => result.push_str(value),
            Piece::Number(text, _, _) => result.push_str(text),
        })?;
        Ok(result)
    }
    pub fn format_to_parts(&self, value: &str, unit: &str) -> Result<Vec<Part>, Error> {
        let numeric = value.parse::<f64>().map_err(|_| Error::InvalidNumber)?;
        self.parts_with(numeric, unit, || {
            self.number.format_decimal_with_plural(
                value.strip_prefix('-').unwrap_or(value),
                &self.data.plurals,
            )
        })
    }
    /// Retain the Number for validation and named forms; format decimal text lazily.
    pub fn format_to_parts_number(&self, value: f64, unit: &str) -> Result<Vec<Part>, Error> {
        self.parts_with(value, unit, || {
            let mut buffer = ryu::Buffer::new();
            let text = buffer.format_finite(value.abs());
            let text = text.strip_suffix(".0").unwrap_or(text);
            self.number
                .format_decimal_with_plural(text, &self.data.plurals)
        })
    }
    fn parts_with(
        &self,
        numeric: f64,
        unit: &str,
        format_number: impl FnOnce() -> Result<
            (Vec<formatjs_intl_numberformat::Part>, &'static str),
            formatjs_intl_numberformat::Error,
        >,
    ) -> Result<Vec<Part>, Error> {
        let mut result = Vec::new();
        self.visit_pattern(numeric, unit, format_number, |piece| match piece {
            Piece::Literal(value) => result.push(Part {
                kind: "literal",
                value: value.into(),
                unit: None,
            }),
            Piece::Number(parts, unit, last) => {
                let append = |part: formatjs_intl_numberformat::Part| Part {
                    kind: part.kind,
                    value: part.value,
                    unit: Some(unit),
                };
                if last {
                    let parts = std::mem::take(parts);
                    if result.is_empty() {
                        result = parts.into_iter().map(append).collect();
                    } else {
                        result.extend(parts.into_iter().map(append));
                    }
                } else {
                    result.extend(parts.iter().cloned().map(append));
                }
            }
        })?;
        Ok(result)
    }
    fn visit_pattern<N>(
        &self,
        numeric: f64,
        unit: &str,
        format_number: impl FnOnce() -> Result<(N, &'static str), formatjs_intl_numberformat::Error>,
        mut visit: impl FnMut(Piece<'_, N>),
    ) -> Result<(), Error> {
        if !numeric.is_finite() {
            return Err(Error::InvalidNumber);
        }
        let unit = data::UNITS
            .iter()
            .copied()
            .find(|known| unit == *known || unit.strip_suffix('s') == Some(*known))
            .ok_or(Error::InvalidUnit)?;
        let key = if self.resolved.style == "long" {
            Cow::Borrowed(unit)
        } else {
            Cow::Owned(format!("{unit}-{}", self.resolved.style))
        };
        let field = self
            .data
            .fields
            .get(key.as_ref())
            .or_else(|| self.data.fields.get(unit))
            .ok_or_else(|| Error::InvalidData("Missing relative field".into()))?;
        // Numeric auto uses ToString(-0) = "0" before choosing past/future.
        // https://tc39.es/ecma402/#sec-partitionrelativetimepattern
        if self.resolved.numeric == "auto" {
            let key = if numeric == 0.0 {
                "0".to_owned()
            } else {
                numeric.to_string()
            };
            if let Some(literal) = field.relative.get(&key) {
                visit(Piece::Literal(literal));
                return Ok(());
            }
        }
        let patterns = if numeric.is_sign_negative() {
            &field.past
        } else {
            &field.future
        };
        let (mut number, category) =
            format_number().map_err(|error| Error::InvalidData(error.to_string()))?;
        let pattern = patterns
            .get(category)
            .or_else(|| patterns.get("other"))
            .ok_or_else(|| Error::InvalidData("Missing relative plural pattern".into()))?;
        let mut chunks = pattern.split("{0}").enumerate().peekable();
        while let Some((index, literal)) = chunks.next() {
            if index > 0 {
                // Repeated slots borrow; the final slot can transfer its buffer.
                visit(Piece::Number(&mut number, unit, chunks.peek().is_none()));
            }
            if !literal.is_empty() {
                visit(Piece::Literal(literal));
            }
        }
        Ok(())
    }
}
#[derive(Debug)]
pub enum Error {
    InvalidData(String),
    InvalidLocale,
    MissingLocale,
    InvalidOption(&'static str),
    InvalidNumber,
    InvalidUnit,
}
impl std::fmt::Display for Error {
    fn fmt(&self, out: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(out, "{self:?}")
    }
}
impl std::error::Error for Error {}

#[cfg(feature = "compiled_data")]
mod compiled_data {
    include!(env!("FORMATJS_COMPILED_LOCALES"));
}

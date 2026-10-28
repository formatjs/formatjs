//! Relative patterns and their internal number/plural data load as one owned pack.
mod data;
pub mod ffi;
pub mod registry;
pub use data::LocaleData;
use formatjs_intl_numberformat::{NumberFormat, Options as NumberOptions};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

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
enum Piece<'a> {
    Literal(&'a str),
    Number(&'a [formatjs_intl_numberformat::Part], &'static str),
}
pub struct RelativeTimeFormat {
    data: Arc<LocaleData>,
    resolved: ResolvedOptions,
    number: NumberFormat,
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
        let number = data
            .numbers
            .create(
                std::slice::from_ref(&resolution.locale),
                &NumberOptions {
                    numbering_system: Some(resolution.numbering_system.clone()),
                    ..Default::default()
                },
            )
            .map_err(|error| Error::InvalidData(error.to_string()))?;
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
        let mut result = String::with_capacity(32);
        self.visit_pattern(value, unit, |piece| match piece {
            Piece::Literal(value) => result.push_str(value),
            Piece::Number(parts, _) => {
                for part in parts {
                    result.push_str(&part.value);
                }
            }
        })?;
        Ok(result)
    }
    pub fn format_to_parts(&self, value: &str, unit: &str) -> Result<Vec<Part>, Error> {
        let mut result = Vec::new();
        self.visit_pattern(value, unit, |piece| match piece {
            Piece::Literal(value) => result.push(Part {
                kind: "literal",
                value: value.into(),
                unit: None,
            }),
            Piece::Number(parts, unit) => result.extend(parts.iter().map(|part| Part {
                kind: part.kind,
                value: part.value.clone(),
                unit: Some(unit),
            })),
        })?;
        Ok(result)
    }
    fn visit_pattern(
        &self,
        value: &str,
        unit: &str,
        mut visit: impl FnMut(Piece<'_>),
    ) -> Result<(), Error> {
        let numeric = value.parse::<f64>().map_err(|_| Error::InvalidNumber)?;
        if !numeric.is_finite() {
            return Err(Error::InvalidNumber);
        }
        let unit = data::UNITS
            .iter()
            .copied()
            .find(|known| unit == *known || unit.strip_suffix('s') == Some(*known))
            .ok_or(Error::InvalidUnit)?;
        let key = if self.resolved.style == "long" {
            unit.into()
        } else {
            format!("{unit}-{}", self.resolved.style)
        };
        let field = self
            .data
            .fields
            .get(&key)
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
        let (number, category) = self
            .number
            .format_decimal_with_plural(
                value.strip_prefix('-').unwrap_or(value),
                &self.data.plurals,
            )
            .map_err(|error| Error::InvalidData(error.to_string()))?;
        let pattern = patterns
            .get(category)
            .or_else(|| patterns.get("other"))
            .ok_or_else(|| Error::InvalidData("Missing relative plural pattern".into()))?;
        for (index, literal) in pattern.split("{0}").enumerate() {
            if index > 0 {
                visit(Piece::Number(&number, unit));
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

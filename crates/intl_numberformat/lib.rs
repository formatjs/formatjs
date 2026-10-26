//! Number formatting with on-demand locale records, independent of host ICU data.
mod data;
pub mod ffi;
mod format;
mod metadata;
mod numeric;
mod options;
mod range;
pub mod registry;

pub use data::LocaleData;
use formatjs_intl_locale::{Locale, LocaleOptions};
use formatjs_intl_pluralrules::digits::{Digits, Options as DigitOptions};
pub use options::{Grouping, GroupingInput, Options, ResolvedOptions};
use serde::Serialize;
use std::sync::Arc;

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct Part {
    #[serde(rename = "type")]
    pub kind: &'static str,
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<&'static str>,
}
impl Part {
    fn new(kind: &'static str, value: impl Into<String>) -> Self {
        Self {
            kind,
            value: value.into(),
            source: None,
        }
    }
}

pub struct NumberFormat {
    data: Arc<LocaleData>,
    resolved: ResolvedOptions,
    system: String,
    plural_digits: Digits,
}
impl NumberFormat {
    pub(crate) fn new(
        data: Arc<LocaleData>,
        mut locale: String,
        requested: Option<&str>,
        options: &Options,
    ) -> Result<Self, Error> {
        let option_system = options
            .numbering_system
            .as_deref()
            .map(|value| {
                Locale::new(
                    "und",
                    &LocaleOptions {
                        numbering_system: Some(value.into()),
                        ..Default::default()
                    },
                )
                .map_err(|_| Error::Range("numberingSystem"))
                .map(|locale| locale.keyword("nu").unwrap_or("").to_owned())
            })
            .transpose()?;
        let request = requested
            .map(|tag| Locale::new(tag, &Default::default()))
            .transpose()
            .map_err(|_| Error::InvalidLocale)?;
        let mut system = data.nu[0].clone();
        let mut extension = false;
        if let Some(requested) = request.as_ref().and_then(|locale| locale.keyword("nu")) {
            if data.nu.iter().any(|value| value == requested) {
                system = requested.into();
                extension = true;
            }
        }
        if let Some(option) = option_system {
            if option != system && data.nu.contains(&option) {
                system = option;
                extension = false;
            }
        }
        if extension {
            locale.push_str("-u-nu-");
            locale.push_str(&system);
        }
        Self::with_locale(data, locale, system, options)
    }
    pub(crate) fn reconfigure(&self, options: &Options) -> Result<Self, Error> {
        Self::with_locale(
            self.data.clone(),
            self.resolved.locale.clone(),
            self.resolved.numbering_system.clone(),
            options,
        )
    }
    fn with_locale(
        data: Arc<LocaleData>,
        locale: String,
        system: String,
        options: &Options,
    ) -> Result<Self, Error> {
        let resolved = options::resolve(locale, system.clone(), options)?;
        let digit_values = serde_json::to_value(&resolved.digits)
            .map_err(|error| Error::InvalidData(error.to_string()))?;
        // TS's internal PluralRules receives active digit limits, but keeps its
        // own rounding defaults. Do not leak NumberFormat roundingMode into it.
        // https://github.com/formatjs/formatjs/blob/9e91be2686383ab389c90d1e6294de446aa0e6d0/packages/intl-numberformat/core.ts#L88-L96
        let plural_options = DigitOptions {
            minimum_integer_digits: digit_values["minimumIntegerDigits"].as_f64(),
            minimum_fraction_digits: digit_values["minimumFractionDigits"].as_f64(),
            maximum_fraction_digits: digit_values["maximumFractionDigits"].as_f64(),
            minimum_significant_digits: digit_values["minimumSignificantDigits"].as_f64(),
            maximum_significant_digits: digit_values["maximumSignificantDigits"].as_f64(),
            ..Default::default()
        };
        let plural_digits = Digits::new(&plural_options, false).map_err(options::digit_error)?;
        let system = data.numbers.system(&system)?.to_owned();
        Ok(Self {
            data,
            resolved,
            system,
            plural_digits,
        })
    }
    pub fn resolved_options(&self) -> &ResolvedOptions {
        &self.resolved
    }
    pub fn format(&self, value: &str) -> Result<String, Error> {
        Ok(self
            .format_to_parts(value)?
            .iter()
            .map(|part| part.value.as_str())
            .collect())
    }
    pub fn format_to_parts(&self, value: &str) -> Result<Vec<Part>, Error> {
        self.partition(&numeric::Numeric::parse(value)?, false)
    }
}

#[derive(Debug)]
pub enum Error {
    InvalidData(String),
    InvalidLocale,
    MissingLocale,
    Range(&'static str),
    Type(&'static str),
}

impl std::fmt::Display for Error {
    fn fmt(&self, output: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(output, "{self:?}")
    }
}
impl std::error::Error for Error {}

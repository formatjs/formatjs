use crate::{Error, fields::FractionalDigits};
use formatjs_intl_numberformat::{GroupingInput, NumberFormat, Options, registry::Registry};
use serde::{Deserialize, Deserializer};
use std::{
    collections::BTreeMap,
    sync::{Arc, Mutex},
};

pub struct NumberData {
    registry: Registry,
    cache: Mutex<BTreeMap<(String, String, u8), Arc<NumberFormat>>>,
}
impl std::fmt::Debug for NumberData {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter
            .debug_struct("NumberData")
            .field("locales", &self.registry.available_locales())
            .finish()
    }
}
impl<'de> Deserialize<'de> for NumberData {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let value = serde_json::Value::deserialize(deserializer)?;
        Self::from_json(&value.to_string()).map_err(serde::de::Error::custom)
    }
}
impl NumberData {
    pub fn from_json(json: &str) -> Result<Self, Error> {
        let mut registry = Registry::default();
        registry
            .add_locale_data(json)
            .map_err(|_| Error::InvalidLocaleData)?;
        Ok(Self {
            registry,
            cache: Mutex::new(BTreeMap::new()),
        })
    }

    fn formatter(
        &self,
        locale: &str,
        system: &str,
        minimum: u8,
    ) -> Result<Arc<NumberFormat>, Error> {
        let key = (locale.into(), system.into(), minimum);
        let mut cache = self.cache.lock().map_err(|_| Error::InvalidLocaleData)?;
        if let Some(formatter) = cache.get(&key) {
            return Ok(formatter.clone());
        }
        let mut options = Options {
            numbering_system: Some(system.into()),
            use_grouping: Some(GroupingInput::Boolean(false)),
            ..Default::default()
        };
        options.digits.minimum_integer_digits = Some(f64::from(minimum));
        let formatter = Arc::new(
            self.registry
                .create(&[locale.into()], &options)
                .map_err(|_| Error::InvalidLocaleData)?,
        );
        cache.insert(key, formatter.clone());
        Ok(formatter)
    }

    pub fn decimal(&self, locale: &str, system: &str) -> Result<String, Error> {
        self.formatter(locale, system, 1)?
            .format_to_parts("1.1")
            .map_err(|_| Error::InvalidLocaleData)?
            .into_iter()
            .find(|part| part.kind == "decimal")
            .map(|part| part.value)
            .ok_or(Error::InvalidLocaleData)
    }

    pub fn formatters(
        &self,
        locale: &str,
        system: &str,
        fractional: Option<FractionalDigits>,
    ) -> Result<NumberFormatters, Error> {
        Ok(NumberFormatters {
            numeric: self.formatter(locale, system, 1)?,
            two_digit: self.formatter(locale, system, 2)?,
            fractional: fractional
                .map(|digits| self.formatter(locale, system, u8::from(digits)))
                .transpose()?,
        })
    }
}

pub struct NumberFormatters {
    pub(crate) numeric: Arc<NumberFormat>,
    pub(crate) two_digit: Arc<NumberFormat>,
    pub(crate) fractional: Option<Arc<NumberFormat>>,
}
impl NumberFormatters {
    pub fn numeric(&self, value: i32) -> Result<String, Error> {
        self.numeric
            .format(&value.to_string())
            .map_err(|_| Error::InvalidLocaleData)
    }
    pub fn two_digit(&self, value: i32) -> Result<String, Error> {
        let result = self
            .two_digit
            .format(&value.to_string())
            .map_err(|_| Error::InvalidLocaleData)?;
        let count = result.chars().count();
        Ok(result.chars().skip(count.saturating_sub(2)).collect())
    }
    pub fn fractional(&self, value: u32) -> Result<String, Error> {
        self.fractional
            .as_ref()
            .ok_or(Error::InvalidPattern)?
            .format(&value.to_string())
            .map_err(|_| Error::InvalidLocaleData)
    }
}

use crate::{Error, Resolution};
use formatjs_intl_getcanonicallocales::canonicalize_locale;
use formatjs_intl_numberformat::registry::Registry as NumberRegistry;
use formatjs_intl_numberformat::{NumberFormat, Options as NumberOptions};
use serde::Deserialize;
use std::collections::BTreeMap;
use std::sync::{Arc, Mutex};

pub(crate) const UNITS: [&str; 8] = [
    "second", "minute", "hour", "day", "week", "month", "quarter", "year",
];
#[derive(Deserialize)]
pub(crate) struct Field {
    pub future: BTreeMap<String, String>,
    pub past: BTreeMap<String, String>,
    #[serde(flatten)]
    pub relative: BTreeMap<String, String>,
}
#[derive(Deserialize)]
struct Fields {
    nu: Vec<String>,
    #[serde(flatten)]
    fields: BTreeMap<String, Field>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Pack {
    format_version: u8,
    locale: String,
    #[serde(default)]
    aliases: Vec<String>,
    data: Fields,
    number: formatjs_intl_numberformat::LocaleData,
    plurals: formatjs_intl_pluralrules::LocaleRules,
}
pub struct LocaleData {
    pub(crate) locale: String,
    pub(crate) aliases: Vec<String>,
    pub(crate) nu: Vec<String>,
    pub(crate) fields: BTreeMap<String, Field>,
    numbers: NumberRegistry,
    number_formats: Mutex<Vec<NumberPlan>>,
    pub(crate) plurals: formatjs_intl_pluralrules::LocaleRules,
}
struct NumberPlan {
    locale: String,
    numbering_system: String,
    value: Arc<NumberFormat>,
}
impl LocaleData {
    pub(crate) fn number_format(
        &self,
        resolution: &Resolution,
    ) -> Result<Arc<NumberFormat>, Error> {
        let mut cache = self
            .number_formats
            .lock()
            .unwrap_or_else(|error| error.into_inner());
        if let Some(plan) = cache.iter().find(|plan| {
            plan.locale == resolution.locale && plan.numbering_system == resolution.numbering_system
        }) {
            return Ok(Arc::clone(&plan.value));
        }
        let value = Arc::new(
            self.numbers
                .create(
                    std::slice::from_ref(&resolution.locale),
                    &NumberOptions {
                        numbering_system: Some(resolution.numbering_system.clone()),
                        ..Default::default()
                    },
                )
                .map_err(|error| Error::InvalidData(error.to_string()))?,
        );
        // Plans belong to this immutable pack, so replacing locale data cannot
        // reuse old number symbols. Bound keys supplied through the owned ABI.
        if resolution.locale.len() + resolution.numbering_system.len() <= 128 {
            if cache.len() == 64 {
                cache.clear();
            }
            cache.push(NumberPlan {
                locale: resolution.locale.clone(),
                numbering_system: resolution.numbering_system.clone(),
                value: Arc::clone(&value),
            });
        }
        Ok(value)
    }
    pub fn from_json(json: &str) -> Result<Self, Error> {
        let pack: Pack =
            serde_json::from_str(json).map_err(|error| Error::InvalidData(error.to_string()))?;
        Self::from_pack(pack)
    }

    fn from_pack(pack: Pack) -> Result<Self, Error> {
        if pack.format_version != 1
            || pack.data.nu.is_empty()
            || UNITS
                .iter()
                .any(|unit| !pack.data.fields.contains_key(*unit))
        {
            return Err(Error::InvalidData(
                "Incomplete RelativeTimeFormat pack".into(),
            ));
        }
        for field in pack.data.fields.values() {
            for patterns in [&field.future, &field.past] {
                if !patterns.contains_key("other")
                    || patterns
                        .values()
                        .any(|pattern| pattern.replace("{0}", "").contains(['{', '}']))
                {
                    return Err(Error::InvalidData("Invalid relative pattern".into()));
                }
            }
        }
        let locale = canonicalize_locale(&pack.locale).map_err(|_| Error::InvalidLocale)?;
        let aliases = pack
            .aliases
            .iter()
            .map(|tag| canonicalize_locale(tag).map_err(|_| Error::InvalidLocale))
            .collect::<Result<_, _>>()?;
        let mut numbers = NumberRegistry::default();
        numbers
            .add_data(pack.number)
            .map_err(|error| Error::InvalidData(error.to_string()))?;
        Ok(Self {
            locale,
            aliases,
            nu: pack.data.nu,
            fields: pack.data.fields,
            numbers,
            number_formats: Mutex::new(Vec::new()),
            plurals: pack.plurals,
        })
    }
    pub fn locale(&self) -> &str {
        &self.locale
    }
}

impl<'de> serde::Deserialize<'de> for LocaleData {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let pack = Pack::deserialize(deserializer)?;
        Self::from_pack(pack).map_err(serde::de::Error::custom)
    }
}

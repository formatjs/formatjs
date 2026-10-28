use crate::Error;
use formatjs_intl_getcanonicallocales::canonicalize_locale;
use formatjs_intl_numberformat::registry::Registry as NumberRegistry;
use serde::Deserialize;
use std::collections::BTreeMap;

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
    pub(crate) numbers: NumberRegistry,
    pub(crate) plurals: formatjs_intl_pluralrules::LocaleRules,
}
impl LocaleData {
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

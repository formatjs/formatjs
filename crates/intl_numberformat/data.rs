use crate::Error;
use formatjs_intl_getcanonicallocales::canonicalize_locale;
use formatjs_intl_pluralrules::LocaleRules;
use serde::Deserialize;
use std::collections::BTreeMap;
use std::sync::{Arc, RwLock};

pub(crate) type Plurals = BTreeMap<String, String>;
pub(crate) type Compact = BTreeMap<String, Plurals>;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Pack {
    format_version: u8,
    locale: String,
    #[serde(default)]
    aliases: Vec<String>,
    data: RawData,
    plurals: LocaleRules,
}

#[derive(Deserialize)]
struct RawData {
    nu: Vec<String>,
    currencies: BTreeMap<String, Currency>,
    numbers: Numbers,
    units: Units,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Currency {
    pub display_name: Plurals,
    pub symbol: String,
    pub narrow: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Numbers {
    #[serde(default)]
    pub pattern_plans: Option<NumberPatterns>,
    #[serde(default)]
    pub aliases: BTreeMap<String, String>,
    #[serde(default = "one")]
    pub minimum_grouping_digits: usize,
    pub nu: Vec<String>,
    pub symbols: BTreeMap<String, Symbols>,
    pub decimal: BTreeMap<String, DecimalPatterns>,
    pub currency: BTreeMap<String, CurrencyPatterns>,
    pub percent: BTreeMap<String, String>,
}
fn one() -> usize {
    1
}

#[derive(Deserialize)]
pub(crate) struct NumberPatterns {
    pub version: u8,
    pub standard: BTreeMap<String, Vec<usize>>,
    pub compact: BTreeMap<String, Vec<usize>>,
    pub plans: Vec<PatternPlan>,
    pub tokens: Vec<(String, String)>,
}

pub(crate) type PatternPlan = Vec<usize>;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Symbols {
    pub decimal: String,
    pub group: String,
    pub percent_sign: String,
    pub plus_sign: String,
    pub minus_sign: String,
    pub exponential: String,
    pub infinity: String,
    pub nan: String,
    #[serde(default)]
    pub approximately_sign: String,
    pub range_sign: String,
    pub currency_group: Option<String>,
    pub currency_decimal: Option<String>,
}

#[derive(Deserialize)]
pub(crate) struct DecimalPatterns {
    pub standard: String,
    pub long: Compact,
    pub short: Compact,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CurrencyPatterns {
    pub standard: String,
    pub accounting: String,
    #[serde(default)]
    pub short: Compact,
    pub unit_pattern: String,
    pub currency_spacing: CurrencySpacing,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CurrencySpacing {
    pub before_insert_between: String,
    pub after_insert_between: String,
}

#[derive(Deserialize)]
pub(crate) struct Units {
    pub simple: BTreeMap<String, Unit>,
    pub compound: BTreeMap<String, BTreeMap<String, String>>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Unit {
    pub long: Plurals,
    pub short: Plurals,
    pub narrow: Plurals,
    #[serde(default)]
    pub per_unit: BTreeMap<String, String>,
}

pub(crate) struct PreparedPattern {
    pub plan: PatternPlan,
    pub tokens: Vec<(String, String)>,
}

type PatternCache = RwLock<BTreeMap<(String, i8, bool, bool), Arc<PreparedPattern>>>;

pub struct LocaleData {
    pub(crate) legacy_patterns: PatternCache,
    pub(crate) locale: String,
    pub(crate) aliases: Vec<String>,
    pub(crate) nu: Vec<String>,
    pub(crate) currencies: BTreeMap<String, Currency>,
    pub(crate) numbers: Numbers,
    pub(crate) units: RwLock<Units>,
    pub(crate) plurals: LocaleRules,
}

impl Numbers {
    pub fn system<'a>(&'a self, requested: &'a str) -> Result<&'a str, Error> {
        let mut selected = requested;
        for _ in 0..=self.aliases.len() {
            match self.aliases.get(selected) {
                Some(alias) => selected = alias,
                None => return Ok(selected),
            }
        }
        Err(Error::InvalidData("Cyclic numbering-system aliases".into()))
    }
}

impl LocaleData {
    pub fn from_json(json: &str) -> Result<Self, Error> {
        let pack: Pack =
            serde_json::from_str(json).map_err(|error| Error::InvalidData(error.to_string()))?;
        Self::from_pack(pack)
    }

    fn from_pack(pack: Pack) -> Result<Self, Error> {
        if pack.format_version != 1 || pack.data.nu.is_empty() || pack.data.numbers.nu.is_empty() {
            return Err(Error::InvalidData(
                "Invalid NumberFormat locale pack".into(),
            ));
        }
        let locale = canonicalize_locale(&pack.locale).map_err(|_| Error::InvalidLocale)?;
        let aliases = pack
            .aliases
            .iter()
            .map(|tag| canonicalize_locale(tag))
            .collect::<Result<Vec<_>, _>>()
            .map_err(|_| Error::InvalidLocale)?;
        for system in pack.data.nu.iter().chain(&pack.data.numbers.nu) {
            let system = pack.data.numbers.system(system)?;
            if !pack.data.numbers.symbols.contains_key(system)
                || !pack.data.numbers.decimal.contains_key(system)
                || !pack.data.numbers.currency.contains_key(system)
                || !pack.data.numbers.percent.contains_key(system)
            {
                return Err(Error::InvalidData(format!(
                    "Incomplete numbering system: {system}"
                )));
            }
        }
        if let Some(patterns) = &pack.data.numbers.pattern_plans {
            if patterns.version != 1
                || patterns
                    .standard
                    .values()
                    .chain(patterns.compact.values())
                    .any(|ids| ids.len() != 6 || ids.iter().any(|id| *id >= patterns.plans.len()))
                || patterns.plans.iter().any(|plan| {
                    plan.len() < 2
                        || plan[..2].contains(&0)
                        || plan[2..].iter().any(|id| *id >= patterns.tokens.len())
                })
                || patterns.tokens.iter().any(|(kind, _)| {
                    !matches!(
                        kind.as_str(),
                        "number"
                            | "literal"
                            | "compact"
                            | "currency"
                            | "minusSign"
                            | "plusSign"
                            | "percentSign"
                            | "approximatelySign"
                    )
                })
            {
                return Err(Error::InvalidData(
                    "Invalid compiled number patterns".into(),
                ));
            }
        }
        let plurals = pack.plurals;
        Ok(Self {
            legacy_patterns: RwLock::default(),
            locale,
            aliases,
            nu: pack.data.nu,
            currencies: pack.data.currencies,
            numbers: pack.data.numbers,
            units: RwLock::new(pack.data.units),
            plurals,
        })
    }

    pub fn locale(&self) -> &str {
        &self.locale
    }
    pub fn numbering_systems(&self) -> &[String] {
        &self.nu
    }

    pub fn add_unit_data(&self, json: &str) -> Result<(), Error> {
        let additional: Units =
            serde_json::from_str(json).map_err(|error| Error::InvalidData(error.to_string()))?;
        let mut units = self
            .units
            .write()
            .map_err(|_| Error::InvalidData("Unit data lock poisoned".into()))?;
        // __addUnitData extends existing instances as well as future ones.
        // https://github.com/formatjs/formatjs/blob/9e91be2686383ab389c90d1e6294de446aa0e6d0/packages/intl-numberformat/core.ts
        units.simple.extend(additional.simple);
        units.compound.extend(additional.compound);
        Ok(())
    }
}

impl<'de> serde::Deserialize<'de> for LocaleData {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let pack = Pack::deserialize(deserializer)?;
        Self::from_pack(pack).map_err(serde::de::Error::custom)
    }
}

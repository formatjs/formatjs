//! Locale rule packs loaded on demand. ICU4X compiles CLDR rule strings at load
//! time; selecting a category does not parse rules or require baked locale data.
//! Constructor options and ECMA-402 decimal rounding are added above this layer.

use std::collections::BTreeMap;
use std::fmt;
use std::str::FromStr;

use formatjs_intl_getcanonicallocales::canonicalize_locale;
use icu::decimal::input::Decimal;
use icu::plurals::provider::rules::runtime::ast::Rule;
use icu::plurals::provider::{PluralRulesData, PluralsCardinalV1, PluralsOrdinalV1};
use icu::plurals::{PluralCategory, PluralOperands, PluralRules, RawPluralOperands};
use icu_provider::prelude::*;
use serde::Deserialize;

#[derive(Debug)]
pub enum Error {
    InvalidData(String),
    InvalidNumber,
    InvalidRange,
}
impl fmt::Display for Error {
    fn fmt(&self, out: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidData(message) => write!(out, "Invalid plural data: {message}"),
            Self::InvalidNumber => out.write_str("Invalid formatted decimal"),
            Self::InvalidRange => out.write_str("Plural range endpoints cannot be NaN"),
        }
    }
}
impl std::error::Error for Error {}

#[derive(Deserialize)]
struct Pack<'data> {
    locale: String,
    #[serde(borrow)]
    cardinal: PluralRulesData<'data>,
    #[serde(borrow)]
    ordinal: PluralRulesData<'data>,
    #[serde(default)]
    ranges: BTreeMap<String, BTreeMap<String, String>>,
}

struct Provider {
    cardinal: DataPayload<PluralsCardinalV1>,
    ordinal: DataPayload<PluralsOrdinalV1>,
}
impl DataProvider<PluralsCardinalV1> for Provider {
    fn load(&self, _request: DataRequest) -> Result<DataResponse<PluralsCardinalV1>, DataError> {
        Ok(DataResponse {
            metadata: Default::default(),
            payload: self.cardinal.clone(),
        })
    }
}
impl DataProvider<PluralsOrdinalV1> for Provider {
    fn load(&self, _request: DataRequest) -> Result<DataResponse<PluralsOrdinalV1>, DataError> {
        Ok(DataResponse {
            metadata: Default::default(),
            payload: self.ordinal.clone(),
        })
    }
}

fn owned(data: PluralRulesData<'_>) -> PluralRulesData<'static> {
    fn rule(value: Option<Rule<'_>>) -> Option<Rule<'static>> {
        value.map(|value| Rule(value.0.into_owned()))
    }
    PluralRulesData {
        zero: rule(data.zero),
        one: rule(data.one),
        two: rule(data.two),
        few: rule(data.few),
        many: rule(data.many),
    }
}

fn name(category: PluralCategory) -> &'static str {
    match category {
        PluralCategory::Zero => "zero",
        PluralCategory::One => "one",
        PluralCategory::Two => "two",
        PluralCategory::Few => "few",
        PluralCategory::Many => "many",
        PluralCategory::Other => "other",
    }
}
fn category(value: &str) -> Option<PluralCategory> {
    match value {
        "zero" => Some(PluralCategory::Zero),
        "one" => Some(PluralCategory::One),
        "two" => Some(PluralCategory::Two),
        "few" => Some(PluralCategory::Few),
        "many" => Some(PluralCategory::Many),
        "other" => Some(PluralCategory::Other),
        _ => None,
    }
}

pub struct LocaleRules {
    locale: String,
    cardinal: PluralRules,
    ordinal: PluralRules,
    ranges: BTreeMap<String, BTreeMap<String, String>>,
}
impl LocaleRules {
    /// Load one locale. The resulting rules own their payloads; callers may
    /// release the JSON buffer immediately. No global available-locale set exists.
    pub fn from_json(json: &str) -> Result<Self, Error> {
        let pack: Pack<'_> =
            serde_json::from_str(json).map_err(|error| Error::InvalidData(error.to_string()))?;
        let locale = canonicalize_locale(&pack.locale)
            .map_err(|_| Error::InvalidData("locale".to_owned()))?;
        for (kind, ranges) in &pack.ranges {
            if !["cardinal", "ordinal"].contains(&kind.as_str()) {
                return Err(Error::InvalidData("range type".to_owned()));
            }
            for (key, value) in ranges {
                let Some((start, end)) = key.split_once('_') else {
                    return Err(Error::InvalidData("range key".to_owned()));
                };
                if category(start).is_none() || category(end).is_none() || category(value).is_none()
                {
                    return Err(Error::InvalidData("range category".to_owned()));
                }
            }
        }
        // The private provider serves this explicitly selected pack. Locale
        // negotiation happens outside it, before constructing ICU4X rules.
        let provider = Provider {
            cardinal: DataPayload::from_owned(owned(pack.cardinal)),
            ordinal: DataPayload::from_owned(owned(pack.ordinal)),
        };
        let cardinal = PluralRules::try_new_cardinal_unstable(&provider, Default::default())
            .map_err(|error| Error::InvalidData(error.to_string()))?;
        let ordinal = PluralRules::try_new_ordinal_unstable(&provider, Default::default())
            .map_err(|error| Error::InvalidData(error.to_string()))?;
        Ok(Self {
            locale,
            cardinal,
            ordinal,
            ranges: pack.ranges,
        })
    }
    pub fn locale(&self) -> &str {
        &self.locale
    }
    fn rules(&self, ordinal: bool) -> &PluralRules {
        if ordinal {
            &self.ordinal
        } else {
            &self.cardinal
        }
    }
    pub fn categories(&self, ordinal: bool) -> Vec<&'static str> {
        // resolvedOptions lists categories in ECMA-402 Table 31 order.
        [
            PluralCategory::Zero,
            PluralCategory::One,
            PluralCategory::Two,
            PluralCategory::Few,
            PluralCategory::Many,
            PluralCategory::Other,
        ]
        .into_iter()
        .filter(|category| {
            self.rules(ordinal)
                .categories()
                .any(|value| value == *category)
        })
        .map(name)
        .collect()
    }
    /// ResolvePlural's implementation-defined PluralRuleSelect consumes the
    /// rounded decimal string. Trailing zeros remain visible to ICU4X operands.
    /// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/pluralrules.html#L316-L321
    pub fn select_rounded(
        &self,
        decimal: &str,
        exponent: usize,
        ordinal: bool,
    ) -> Result<&'static str, Error> {
        if ["NaN", "Infinity", "-Infinity"].contains(&decimal) {
            return Ok("other");
        }
        let decimal = Decimal::from_str(decimal).map_err(|_| Error::InvalidNumber)?;
        let operands = PluralOperands::from(&decimal);
        let mut raw = RawPluralOperands::from(operands);
        raw.c = exponent;
        Ok(name(
            self.rules(ordinal).category_for(PluralOperands::from(raw)),
        ))
    }
    /// ResolvePluralRange 1–9 rejects NaN, permits infinities, then compares
    /// formatted strings before consulting the locale's range matrix.
    /// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/pluralrules.html#L356-L379
    pub fn select_range_rounded(
        &self,
        start: &str,
        end: &str,
        start_exponent: usize,
        end_exponent: usize,
        ordinal: bool,
    ) -> Result<&str, Error> {
        if start == "NaN" || end == "NaN" {
            return Err(Error::InvalidRange);
        }
        let first = self.select_rounded(start, start_exponent, ordinal)?;
        let last = self.select_rounded(end, end_exponent, ordinal)?;
        if start == end {
            return Ok(first);
        }
        let kind = if ordinal { "ordinal" } else { "cardinal" };
        Ok(self
            .ranges
            .get(kind)
            .and_then(|ranges| ranges.get(&format!("{first}_{last}")))
            .map(String::as_str)
            .unwrap_or(last))
    }
}

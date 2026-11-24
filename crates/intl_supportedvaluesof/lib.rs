//! Runtime-aware enumeration for `Intl.supportedValuesOf`.
//!
//! Candidate data comes from the same CLDR/IANA generators as the TypeScript
//! polyfill. The embedding supplies formatter observations, so enumeration
//! follows its actual data and capabilities rather than the build host's ICU.

pub mod ffi;
mod values_generated;

use std::collections::BTreeSet;
use std::fmt;
use std::str::FromStr;

use values_generated::*;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Key {
    Calendar = 0,
    Collation = 1,
    Currency = 2,
    NumberingSystem = 3,
    TimeZone = 4,
    Unit = 5,
}

impl Key {
    pub const ALL: [Self; 6] = [
        Self::Calendar,
        Self::Collation,
        Self::Currency,
        Self::NumberingSystem,
        Self::TimeZone,
        Self::Unit,
    ];

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Calendar => "calendar",
            Self::Collation => "collation",
            Self::Currency => "currency",
            Self::NumberingSystem => "numberingSystem",
            Self::TimeZone => "timeZone",
            Self::Unit => "unit",
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct InvalidKey;

impl fmt::Display for InvalidKey {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("Invalid supportedValuesOf key")
    }
}

impl std::error::Error for InvalidKey {}

impl FromStr for Key {
    type Err = InvalidKey;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        // ECMA-402 §8.3.2 steps 2–8 dispatch exact keys after JS coerces them.
        // https://tc39.es/ecma402/#sec-intl.supportedvaluesof
        Self::ALL
            .into_iter()
            .find(|key| key.as_str() == value)
            .ok_or(InvalidKey)
    }
}

/// Values observed from an embedding's formatter. A failed construction or
/// formatting call is represented by `None`, not a fabricated fallback value.
#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct Observation {
    /// Resolved identifier, including a currency confirmed by its currency part.
    pub resolved: Option<String>,
    pub formatted: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Candidate {
    pub value: String,
    pub locale: &'static str,
}

/// CLDR candidates and the locales where they may be supported.
pub fn candidates(key: Key) -> Vec<Candidate> {
    let values = match key {
        Key::Calendar => CALENDARS,
        Key::Collation => COLLATIONS,
        Key::Currency => CURRENCIES,
        Key::NumberingSystem => NUMBERING_SYSTEMS,
        Key::TimeZone => TIME_ZONES,
        Key::Unit => UNITS,
    };
    values
        .iter()
        .flat_map(|value| {
            let candidate_locales = match key {
                Key::Collation => COLLATION_LOCALES,
                Key::Currency => CURRENCY_LOCALES,
                Key::NumberingSystem => NUMBERING_SYSTEM_LOCALES,
                _ => &[],
            };
            let locales = candidate_locales
                .iter()
                .find(|(identifier, _)| identifier == value)
                .map_or(&["en"][..], |(_, locales)| *locales);
            let values = if key == Key::Currency {
                expand_currency(value)
            } else {
                vec![(*value).to_owned()]
            };
            values.into_iter().flat_map(move |value| {
                locales.iter().map(move |locale| Candidate {
                    value: value.clone(),
                    locale,
                })
            })
        })
        .collect()
}

/// Enumerate values supported by the embedding's formatter implementation.
/// `probe` receives the category, candidate and locale. The observation comes
/// from DateTimeFormat, NumberFormat or Collator, matching the TS polyfill.
pub fn supported_values_of(
    key: &str,
    mut probe: impl FnMut(Key, &str, &str) -> Option<Observation>,
) -> Result<Vec<String>, InvalidKey> {
    let key = Key::from_str(key)?;
    // ECMA-402 §6.6.3 lists all Table 2 units independently of the formatter.
    // https://tc39.es/ecma402/#sec-availablecanonicalunits
    if key == Key::Unit {
        let mut units: Vec<_> = UNITS.iter().map(|unit| (*unit).to_owned()).collect();
        units.sort_unstable();
        return Ok(units);
    }
    // ECMA-402 §8.3.2 steps 2–8 dispatch to sorted, unique lists. ASCII byte
    // order matches UTF-16 code unit order for these candidates.
    // https://tc39.es/ecma402/#sec-intl.supportedvaluesof
    // ECMA-402 §6.5.1 step 6 and §6.9.1 require UTC and ISO 8601.
    // https://tc39.es/ecma402/#sup-availablenamedtimezoneidentifiers
    // https://tc39.es/ecma402/#sec-availablecalendars
    // ECMA-402 §6.7.1 requires every Table 30 system.
    // https://tc39.es/ecma402/#sec-availablecanonicalnumberingsystems
    let required: &[&str] = match key {
        Key::TimeZone => &["UTC"],
        Key::Calendar => &["iso8601"],
        Key::NumberingSystem => REQUIRED_NUMBERING_SYSTEMS,
        _ => &[],
    };
    let mut supported: BTreeSet<_> = required.iter().map(|value| (*value).to_owned()).collect();
    for candidate in candidates(key) {
        if supported.contains(&candidate.value) {
            continue;
        }
        if let Some(observation) = probe(key, &candidate.value, candidate.locale)
            && accepted(key, &candidate.value, &observation)
        {
            supported.insert(candidate.value);
        }
    }
    // ECMA-402 §8.3.2 step 9: the JS boundary turns the owned list into an array.
    // https://tc39.es/ecma262/#sec-createarrayfromlist
    Ok(supported.into_iter().collect())
}

fn accepted(key: Key, value: &str, observation: &Observation) -> bool {
    match key {
        // Steps 2.b and 3 select canonical calendars and collations.
        // https://tc39.es/ecma402/#sec-intl.supportedvaluesof
        // https://tc39.es/ecma402/#sec-availablecanonicalcollations
        Key::Calendar | Key::Collation => observation.resolved.as_deref() == Some(value),
        // Step 6 / §6.5.3: the generator supplies primary IDs. Probe availability.
        // https://tc39.es/ecma402/#sec-availableprimarytimezoneidentifiers
        Key::TimeZone | Key::Unit => true,
        // Step 4 / AvailableCanonicalCurrencies: prefer the currency part probe.
        // Hosts with only formatted text use the legacy fallback check.
        // https://tc39.es/ecma402/#sec-availablecanonicalcurrencies
        Key::Currency => observation.formatted.as_deref().map_or_else(
            || observation.resolved.as_deref() == Some(value),
            |text| !text.starts_with(value) && !text.ends_with(value),
        ),
        // ECMA-402 §8.3.2 step 5 and §6.7.1: the formatter must select the requested system.
        // https://tc39.es/ecma402/#sec-availablecanonicalnumberingsystems
        Key::NumberingSystem => observation.resolved.as_deref() == Some(value),
    }
}

fn expand_currency(value: &str) -> Vec<String> {
    let bytes = value.as_bytes();
    if bytes.len() == 3 && bytes.iter().all(u8::is_ascii_uppercase) {
        return vec![value.to_owned()];
    }
    // Preserve CLDR compact currency ranges (e.g. XAA~C) without accepting
    // malformed or reversed ranges. Runtime support is still checked per code.
    if bytes.len() == 5
        && bytes[3] == b'~'
        && [bytes[0], bytes[1], bytes[2], bytes[4]]
            .iter()
            .all(u8::is_ascii_uppercase)
        && bytes[2] <= bytes[4]
    {
        return (bytes[2]..=bytes[4])
            .map(|last| {
                format!(
                    "{}{}{}",
                    char::from(bytes[0]),
                    char::from(bytes[1]),
                    char::from(last)
                )
            })
            .collect();
    }
    Vec::new()
}

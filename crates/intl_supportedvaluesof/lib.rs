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
        // Intl.supportedValuesOf steps 2–8: dispatch exact, case-sensitive keys;
        // the JS boundary performs ToString (step 1) before entering Rust.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/intl.html#L103-L122
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
    pub resolved: Option<String>,
    pub formatted: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Candidate {
    pub value: String,
    pub locale: &'static str,
}

/// CLDR candidates to probe. Collations include their non-English locales.
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
            let locales = if key == Key::Collation {
                COLLATION_LOCALES
                    .iter()
                    .find(|(collation, _)| collation == value)
                    .map_or(&["en"][..], |(_, locales)| *locales)
            } else {
                &["en"][..]
            };
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
    // Available* operations return sorted unique lists. All candidate strings
    // are ASCII, so Rust's byte order equals lexicographic UTF-16 code unit order.
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locales-currencies-tz.html#L143-L149
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locales-currencies-tz.html#L481-L534
    let mut supported = BTreeSet::new();
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
    // Intl.supportedValuesOf step 9: CreateArrayFromList is performed by the JS
    // boundary. Return an owned list so callers never share mutable results.
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/intl.html#L123
    Ok(supported.into_iter().collect())
}

fn accepted(key: Key, value: &str, observation: &Observation) -> bool {
    match key {
        // Steps 2.b.i–ii.1: a calendar alias resolves to its canonical name, so it
        // does not match its candidate spelling and cannot enter the result.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/intl.html#L104-L109
        Key::Calendar | Key::Collation | Key::TimeZone | Key::Unit => {
            observation.resolved.as_deref() == Some(value)
        }
        // Step 4 / AvailableCanonicalCurrencies: match the TS runtime's currency
        // name probe, excluding codes that only fall back to their own spelling.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/intl.html#L112-L113
        Key::Currency => observation
            .formatted
            .as_deref()
            .is_some_and(|text| !text.starts_with(value) && !text.ends_with(value)),
        // Step 5 / AvailableCanonicalNumberingSystems: latn is accepted by its
        // resolved option; other systems must change the formatted digits.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/intl.html#L114-L115
        Key::NumberingSystem => {
            (value == "latn" && observation.resolved.as_deref() == Some(value))
                || observation
                    .formatted
                    .as_deref()
                    .is_some_and(|text| text != "123")
        }
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

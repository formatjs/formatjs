//! ECMA-402 DisplayNames from caller-loaded CLDR maps. Host adapters perform
//! observable coercion; Rust validates/canonicalizes codes and resolves names.

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::sync::Arc;

pub mod ffi;
pub mod registry;

#[derive(Debug, PartialEq, Eq)]
pub enum Error {
    InvalidData(String),
    InvalidCode,
    InvalidOption(&'static str),
    MissingLocale,
}
impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{self:?}")
    }
}
impl std::error::Error for Error {}

#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum Type {
    #[default]
    Language,
    Region,
    Script,
    Currency,
    Calendar,
    DateTimeField,
}
#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Style {
    #[default]
    Long,
    Short,
    Narrow,
}
#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Fallback {
    #[default]
    Code,
    None,
}
#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum LanguageDisplay {
    #[default]
    Dialect,
    Standard,
}
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Options {
    #[serde(rename = "type")]
    pub kind: Type,
    #[serde(default)]
    pub style: Style,
    #[serde(default)]
    pub fallback: Fallback,
    #[serde(default)]
    pub language_display: LanguageDisplay,
}
#[derive(Deserialize)]
struct Styles {
    long: BTreeMap<String, String>,
    short: BTreeMap<String, String>,
    narrow: BTreeMap<String, String>,
}
impl Styles {
    fn name(&self, style: Style, code: &str) -> Option<&str> {
        let fields = match style {
            Style::Long => &self.long,
            Style::Short => &self.short,
            Style::Narrow => &self.narrow,
        };
        fields
            .get(code)
            .filter(|name| !name.is_empty())
            .or_else(|| self.long.get(code))
            .map(String::as_str)
    }
}
#[derive(Deserialize)]
struct LanguageStyles {
    dialect: Styles,
    standard: Styles,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Types {
    language: LanguageStyles,
    region: Styles,
    script: Styles,
    currency: Styles,
    calendar: Styles,
    date_time_field: Styles,
}
#[derive(Deserialize)]
struct Patterns {
    locale: String,
    #[serde(default = "default_separator")]
    separator: String,
}

fn default_separator() -> String {
    "{0}, {1}".to_owned()
}
#[derive(Deserialize)]
struct Data {
    types: Types,
    patterns: Patterns,
}
pub struct LocaleNames {
    locale: String,
    aliases: Vec<String>,
    data: Data,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Pack {
    format_version: u8,
    locale: String,
    #[serde(default)]
    aliases: Vec<String>,
    data: Data,
}
impl LocaleNames {
    pub fn from_json(json: &str) -> Result<Self, Error> {
        let pack: Pack =
            serde_json::from_str(json).map_err(|error| Error::InvalidData(error.to_string()))?;
        Self::from_pack(pack)
    }

    fn from_pack(pack: Pack) -> Result<Self, Error> {
        if pack.format_version != 1 {
            return Err(Error::InvalidData("unsupported pack version".into()));
        }
        let pattern = &pack.data.patterns.locale;
        if pattern.matches("{0}").count() != 1 || pattern.matches("{1}").count() != 1 {
            return Err(Error::InvalidData(
                "locale pattern needs {0} and {1} once".into(),
            ));
        }
        Ok(Self {
            locale: canonical(&pack.locale)?,
            aliases: pack
                .aliases
                .iter()
                .map(|tag| canonical(tag))
                .collect::<Result<_, _>>()?,
            data: pack.data,
        })
    }
    pub fn locale(&self) -> &str {
        &self.locale
    }
}
fn canonical(tag: &str) -> Result<String, Error> {
    formatjs_intl_getcanonicallocales::canonicalize_locale(tag)
        .map_err(|error| Error::InvalidData(error.to_string()))
}

fn letters(value: &str) -> bool {
    !value.is_empty() && value.bytes().all(|byte| byte.is_ascii_alphabetic())
}
fn region(value: &str) -> bool {
    (value.len() == 2 && letters(value))
        || (value.len() == 3 && value.bytes().all(|byte| byte.is_ascii_digit()))
}
fn language_id(code: &str) -> bool {
    let parts: Vec<_> = code.split('-').collect();
    if !letters(parts[0]) || !matches!(parts[0].len(), 2 | 3 | 5..=8) {
        return false;
    }
    let mut index = 1;
    if parts
        .get(index)
        .is_some_and(|part| part.len() == 4 && letters(part))
    {
        index += 1;
    }
    if parts.get(index).is_some_and(|part| region(part)) {
        index += 1;
    }
    parts[index..].iter().all(|part| {
        part.bytes().all(|byte| byte.is_ascii_alphanumeric())
            && (matches!(part.len(), 5..=8)
                || (part.len() == 4 && part.as_bytes()[0].is_ascii_digit()))
    })
}
pub const DATE_TIME_FIELDS: &[&str] = &[
    "era",
    "year",
    "quarter",
    "month",
    "weekOfYear",
    "weekday",
    "day",
    "dayPeriod",
    "hour",
    "minute",
    "second",
    "timeZoneName",
];

pub fn canonical_code(kind: Type, code: &str) -> Result<String, Error> {
    // CanonicalCodeForDisplayNames 1.a–c: Unicode language-id grammar excludes
    // extensions/private use; the shared canonicalizer checks duplicate variants
    // and applies aliases after grammar validation.
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/displaynames.html#L235-L238
    if kind == Type::Language {
        if !language_id(code) {
            return Err(Error::InvalidCode);
        }
        return formatjs_intl_getcanonicallocales::canonicalize_locale(code)
            .map_err(|_| Error::InvalidCode);
    }
    // Steps 2–6: ASCII case mapping only; validate the entire input, including
    // trailing line terminators, before indexing or changing case.
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/displaynames.html#L239-L257
    match kind {
        Type::Region if region(code) => Ok(code.to_ascii_uppercase()),
        Type::Script if code.len() == 4 && letters(code) => {
            Ok(code[..1].to_ascii_uppercase() + &code[1..].to_ascii_lowercase())
        }
        Type::Currency if code.len() == 3 && letters(code) => Ok(code.to_ascii_uppercase()),
        Type::Calendar
            if code.split('-').all(|part| {
                (3..=8).contains(&part.len())
                    && part.bytes().all(|byte| byte.is_ascii_alphanumeric())
            }) =>
        {
            Ok(code.to_ascii_lowercase())
        }
        // IsValidDateTimeFieldCode 1–2: table membership is case sensitive.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/displaynames.html#L272-L273
        Type::DateTimeField if DATE_TIME_FIELDS.contains(&code) => Ok(code.to_owned()),
        _ => Err(Error::InvalidCode),
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedOptions {
    pub locale: String,
    pub style: Style,
    #[serde(rename = "type")]
    pub kind: Type,
    pub fallback: Fallback,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub language_display: Option<LanguageDisplay>,
}
pub struct DisplayNames {
    data: Arc<LocaleNames>,
    locale: String,
    options: Options,
}
impl DisplayNames {
    pub fn new(data: Arc<LocaleNames>, options: Options) -> Self {
        Self {
            locale: data.locale.clone(),
            data,
            options,
        }
    }
    pub fn resolved_options(&self) -> ResolvedOptions {
        // Fresh record in table order; languageDisplay exists for language only.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/displaynames.html#L132-L170
        ResolvedOptions {
            locale: self.locale.clone(),
            style: self.options.style,
            kind: self.options.kind,
            fallback: self.options.fallback,
            language_display: (self.options.kind == Type::Language)
                .then_some(self.options.language_display),
        }
    }
    pub fn of(&self, code: &str) -> Result<Option<String>, Error> {
        // of 4–8: canonical code lookup, then code/undefined fallback. The host
        // performs RequireInternalSlot and ToString (steps 1–3) before this call.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/displaynames.html#L182-L189
        let code = canonical_code(self.options.kind, code)?;
        let data = &self.data.data.types;
        let fields = match self.options.kind {
            Type::Language => match self.options.language_display {
                LanguageDisplay::Dialect => &data.language.dialect,
                LanguageDisplay::Standard => &data.language.standard,
            },
            Type::Region => &data.region,
            Type::Script => &data.script,
            Type::Currency => &data.currency,
            Type::Calendar => &data.calendar,
            Type::DateTimeField => &data.date_time_field,
        };
        if let Some(name) = fields.name(self.options.style, &code) {
            return Ok(Some(name.to_owned()));
        }
        if self.options.kind == Type::Language {
            if let Some(name) = compose_language_name(&self.data.data, fields, &self.options, &code)
            {
                return Ok(Some(name));
            }
        }
        Ok((self.options.fallback == Fallback::Code).then_some(code))
    }
}

impl<'de> serde::Deserialize<'de> for LocaleNames {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let pack = Pack::deserialize(deserializer)?;
        Self::from_pack(pack).map_err(serde::de::Error::custom)
    }
}

#[cfg(feature = "compiled_data")]
mod compiled_data {
    include!(env!("FORMATJS_COMPILED_LOCALES"));
}

fn substitute_pattern(pattern: &str, first: &str, second: &str) -> String {
    let mut result = String::new();
    let mut rest = pattern;
    while let Some(index) = rest.find('{') {
        result.push_str(&rest[..index]);
        if rest[index..].starts_with("{0}") {
            result.push_str(first);
        } else if rest[index..].starts_with("{1}") {
            result.push_str(second);
        } else {
            result.push('{');
            rest = &rest[index + 1..];
            continue;
        }
        rest = &rest[index + 3..];
    }
    result.push_str(rest);
    result
}

fn compose_language_name(
    data: &Data,
    fields: &Styles,
    options: &Options,
    code: &str,
) -> Option<String> {
    let parts: Vec<_> = code.split('-').collect();
    let script_index = parts
        .get(1)
        .filter(|part| part.len() == 4 && letters(part))
        .map(|_| 1);
    let region_index = (1..parts.len()).find(|index| region(parts[*index]));
    let mut script = script_index.map(|index| parts[index]);
    let mut territory = region_index.map(|index| parts[index]);
    let without = |skip: Option<usize>, other: Option<usize>| {
        parts
            .iter()
            .enumerate()
            .filter(|(index, _)| Some(*index) != skip && Some(*index) != other)
            .map(|(_, part)| *part)
            .collect::<Vec<_>>()
            .join("-")
    };
    let mut name = None;
    if options.language_display == LanguageDisplay::Dialect
        && script.is_some()
        && territory.is_some()
    {
        name = fields.name(options.style, &without(region_index, None));
        if name.is_some() {
            script = None;
        } else {
            name = fields.name(options.style, &without(script_index, None));
            if name.is_some() {
                territory = None;
            }
        }
    }
    let name = name.or_else(|| fields.name(options.style, &without(script_index, region_index)))?;
    if script.is_none() && territory.is_none() {
        return None;
    }
    let pattern = &data.patterns.locale;
    let nested = |value: &str| -> String {
        value
            .chars()
            .map(|ch| match ch {
                '(' if pattern.contains('(') => '[',
                ')' if pattern.contains('(') => ']',
                '（' if pattern.contains('（') => '［',
                '）' if pattern.contains('（') => '］',
                _ => ch,
            })
            .collect()
    };
    let mut qualifiers = Vec::new();
    for (code, names) in [
        (script, &data.types.script),
        (territory, &data.types.region),
    ] {
        if let Some(code) = code {
            let display = names
                .name(options.style, code)
                .filter(|name| !name.is_empty());
            if display.is_none() && options.fallback == Fallback::None {
                return None;
            }
            qualifiers.push(nested(display.unwrap_or(code)));
        }
    }
    let qualifier = qualifiers
        .into_iter()
        .reduce(|first, second| substitute_pattern(&data.patterns.separator, &first, &second))?;
    Some(substitute_pattern(pattern, &nested(name), &qualifier))
}

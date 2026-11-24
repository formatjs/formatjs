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
    fn fields(&self, style: Style) -> &BTreeMap<String, String> {
        match style {
            Style::Long => &self.long,
            Style::Short => &self.short,
            Style::Narrow => &self.narrow,
        }
    }

    fn name(&self, style: Style, code: &str) -> Option<&str> {
        self.name_with_legacy_code(style, code, None)
    }

    fn name_with_legacy_code(
        &self,
        style: Style,
        code: &str,
        legacy_code: Option<&str>,
    ) -> Option<&str> {
        let fields = self.fields(style);
        // ECMA-402 §12.3.3 step 6 checks field presence, including empty names.
        // https://tc39.es/ecma402/#sec-Intl.DisplayNames.prototype.of
        fields
            .get(code)
            .or_else(|| legacy_code.and_then(|legacy| fields.get(legacy)))
            .or_else(|| self.long.get(code))
            .or_else(|| legacy_code.and_then(|legacy| self.long.get(legacy)))
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
    variant: Option<Styles>,
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
    formatjs_intl_locale::matcher::canonicalize_data_locale(tag)
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
    // ECMA-402 §12.5.1 step 1: Unicode language-id grammar excludes
    // extensions/private use; the shared canonicalizer checks duplicate variants
    // and applies aliases after grammar validation.
    // https://tc39.es/ecma402/#sec-canonicalcodefordisplaynames
    if kind == Type::Language {
        if !language_id(code) {
            return Err(Error::InvalidCode);
        }
        return formatjs_intl_getcanonicallocales::canonicalize_locale(code)
            .map_err(|_| Error::InvalidCode);
    }
    // Steps 2–8: ASCII case mapping only; validate the entire input, including
    // trailing line terminators, before indexing or changing case.
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
        // ECMA-402 §12.5.2: Table 19 membership is case sensitive.
        // https://tc39.es/ecma402/#sec-isvaliddatetimefieldcode
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
        // ECMA-402 §12.3.2 step 4: table order, with only defined slots.
        // https://tc39.es/ecma402/#sec-Intl.DisplayNames.prototype.resolvedOptions
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
        // ECMA-402 §12.3.3 steps 4–8: canonical code lookup, then fallback. The host
        // performs RequireInternalSlot and ToString (steps 1–3) before this call.
        // https://tc39.es/ecma402/#sec-Intl.DisplayNames.prototype.of
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
        // Preexisting packs may use the CLDR spelling for this Table 19 field.
        let legacy_code = (self.options.kind == Type::DateTimeField && code == "dayPeriod")
            .then_some("dayperiod");
        if let Some(name) = fields.name_with_legacy_code(self.options.style, &code, legacy_code) {
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

// UTS 35 Part 2, Locale Display Name Algorithm steps 2–4.
// https://unicode.org/reports/tr35/tr35-general.html#Locale_Display_Name_Algorithm
fn match_variant_language<'a>(
    fields: &'a Styles,
    style: Style,
    parts: &[&'a str],
) -> (&'a str, Vec<usize>) {
    let mut code = parts[0];
    let mut consumed = Vec::new();
    let prefix = format!("{}-", parts[0]);
    let tables = [fields.fields(style), &fields.long];
    let table_count = if style == Style::Long { 1 } else { 2 };
    for table in &tables[..table_count] {
        for (candidate, _) in table.range(prefix.clone()..) {
            let Some(suffix) = candidate.strip_prefix(&prefix) else {
                break;
            };
            let mut positions = Vec::new();
            let mut input = 1;
            for subtag in suffix.split('-') {
                let Some(offset) = parts[input..].iter().position(|part| *part == subtag) else {
                    positions.clear();
                    break;
                };
                let index = input + offset;
                positions.push(index);
                input = index + 1;
            }
            if positions.len() > consumed.len()
                || (positions.len() == consumed.len() && positions < consumed)
            {
                code = candidate;
                consumed = positions;
            }
        }
    }
    (code, consumed)
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
    let next = 1 + usize::from(script_index.is_some());
    let region_index = parts.get(next).filter(|part| region(part)).map(|_| next);
    let variant_start = next + usize::from(region_index.is_some());
    let mut name = fields.name(options.style, parts[0]);
    let mut consumed = Vec::new();
    if options.language_display == LanguageDisplay::Dialect {
        if variant_start < parts.len() {
            let (code, matched) = match_variant_language(fields, options.style, &parts);
            name = fields.name(options.style, code);
            consumed = matched;
        } else if let (Some(script), Some(region)) = (script_index, region_index) {
            for index in [script, region] {
                let code = format!("{}-{}", parts[0], parts[index]);
                if let Some(display) = fields.name(options.style, &code) {
                    name = Some(display);
                    consumed.push(index);
                    break;
                }
            }
        }
    }
    let name = name?;
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
    for (index, code) in parts.iter().enumerate().skip(1) {
        if consumed.binary_search(&index).is_ok() {
            continue;
        }
        let names = if Some(index) == script_index {
            &data.types.script
        } else if Some(index) == region_index {
            &data.types.region
        } else {
            // Older packs leave the whole-code fallback to of().
            data.types.variant.as_ref()?
        };
        let display = names.name(options.style, code);
        if display.is_none() && options.fallback == Fallback::None {
            return None;
        }
        qualifiers.push(nested(display.unwrap_or(code)));
    }
    let qualifier = qualifiers
        .into_iter()
        .reduce(|first, second| substitute_pattern(&data.patterns.separator, &first, &second));
    Some(match qualifier {
        Some(qualifier) => substitute_pattern(pattern, &nested(name), &qualifier),
        None => name.to_owned(),
    })
}

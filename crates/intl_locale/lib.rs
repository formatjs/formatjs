//! ECMA-402 Locale records. ICU4X-backed canonicalization is shared with the
//! canonical-locale crate; preference data uses the TS package's CLDR sources.
//! Observable JS coercion, option access order and brands belong at the boundary.

mod data_generated;
pub mod ffi;
pub mod matcher;

use std::collections::{BTreeMap, BTreeSet};
use std::fmt;

use formatjs_intl_getcanonicallocales::canonicalize_locale;
use serde::{Deserialize, Serialize};
use tinystr::TinyAsciiStr;

use data_generated::*;

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum LocaleError {
    InvalidTag,
    InvalidOption(String),
}

impl fmt::Display for LocaleError {
    fn fmt(&self, output: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidTag => output.write_str("Invalid language tag"),
            Self::InvalidOption(name) => write!(output, "Invalid Intl.Locale option: {name}"),
        }
    }
}

impl std::error::Error for LocaleError {}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct LocaleOptions {
    pub language: Option<String>,
    pub script: Option<String>,
    pub region: Option<String>,
    pub variants: Option<String>,
    pub calendar: Option<String>,
    pub collation: Option<String>,
    pub first_day_of_week: Option<String>,
    pub hour_cycle: Option<String>,
    pub case_first: Option<String>,
    pub numeric: Option<bool>,
    pub numbering_system: Option<String>,
}

fn ascii_letters(value: &str) -> bool {
    value.as_bytes().iter().all(u8::is_ascii_alphabetic)
}

fn variant(value: &str) -> bool {
    value.as_bytes().iter().all(u8::is_ascii_alphanumeric)
        && ((5..=8).contains(&value.len())
            || (value.len() == 4 && value.as_bytes()[0].is_ascii_digit()))
}

fn unicode_type(value: &str) -> bool {
    value.split('-').all(|part| {
        (3..=8).contains(&part.len()) && part.as_bytes().iter().all(u8::is_ascii_alphanumeric)
    })
}

fn weekday(value: &str) -> &str {
    // WeekdayToUValue 1–2 / Table 26: only exact numeric strings are mapped.
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L786-L790
    match value {
        "0" | "7" => "sun",
        "1" => "mon",
        "2" => "tue",
        "3" => "wed",
        "4" => "thu",
        "5" => "fri",
        "6" => "sat",
        _ => value,
    }
}

/// Validate immediately after each JS GetOption, before reading later options.
pub fn validate_option(name: &str, value: &str) -> Result<(), LocaleError> {
    // UpdateLanguageId 1–9 and Intl.Locale 16–35 validate syntax/allowed values.
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L89-L108
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L38-L61
    let valid = match name {
        "language" => {
            ((2..=3).contains(&value.len()) || (5..=8).contains(&value.len()))
                && ascii_letters(value)
        }
        "script" => value.len() == 4 && ascii_letters(value),
        "region" => {
            (value.len() == 2 && ascii_letters(value))
                || (value.len() == 3 && value.as_bytes().iter().all(u8::is_ascii_digit))
        }
        "variants" => {
            let lower = value.to_ascii_lowercase();
            let parts: Vec<_> = lower.split('-').collect();
            parts.iter().all(|part| variant(part))
                && parts.iter().collect::<BTreeSet<_>>().len() == parts.len()
        }
        "calendar" | "collation" | "numberingSystem" => unicode_type(value),
        "firstDayOfWeek" => unicode_type(weekday(value)),
        "hourCycle" => ["h11", "h12", "h23", "h24"].contains(&value),
        "caseFirst" => ["upper", "lower", "false"].contains(&value),
        _ => false,
    };
    if valid {
        Ok(())
    } else {
        Err(LocaleError::InvalidOption(name.to_owned()))
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct LanguageId {
    language: TinyAsciiStr<8>,
    script: Option<TinyAsciiStr<4>>,
    region: Option<TinyAsciiStr<3>>,
    variants: Vec<String>,
}

// Canonical grammar and validated overrides bound every ASCII subtag.
fn subtag<const N: usize>(value: &str) -> TinyAsciiStr<N> {
    TinyAsciiStr::try_from_str(value).expect("validated locale subtag")
}

impl LanguageId {
    // The shared canonicalizer has already validated the entire tag. Splitting
    // canonical subtags also preserves valid 5–8-letter languages, which ICU's
    // compact LanguageIdentifier cannot represent directly.
    fn parse(tag: &str) -> Self {
        let mut parts = tag.split('-').peekable();
        let language = subtag(parts.next().expect("validated language subtag"));
        let script = parts
            .next_if(|part| part.len() == 4 && ascii_letters(part))
            .map(subtag);
        let region = parts
            .next_if(|part| {
                part.len() == 2
                    || (part.len() == 3 && part.as_bytes().iter().all(u8::is_ascii_digit))
            })
            .map(subtag);
        Self {
            language,
            script,
            region,
            variants: parts.map(str::to_owned).collect(),
        }
    }

    fn emit(&self) -> String {
        let mut parts = vec![self.language.as_str()];
        parts.extend(self.script.as_deref());
        parts.extend(self.region.as_deref());
        parts.extend(self.variants.iter().map(String::as_str));
        parts.join("-")
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct Extension {
    singleton: u8,
    value: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Locale {
    tag: String,
    id: LanguageId,
    extensions: Vec<Extension>,
    keywords: BTreeMap<String, String>,
}

impl fmt::Display for Locale {
    fn fmt(&self, output: &mut fmt::Formatter<'_>) -> fmt::Result {
        output.write_str(&self.tag)
    }
}

fn lookup<'a, T>(table: &'a [(&str, T)], key: &str) -> Option<&'a T> {
    let index = table.binary_search_by_key(&key, |entry| entry.0).ok()?;
    Some(&table[index].1)
}

impl Locale {
    pub(crate) fn from_tag(tag: &str) -> Result<Self, LocaleError> {
        canonicalize_locale(tag)
            .map(Self::parse)
            .map_err(|_| LocaleError::InvalidTag)
    }

    pub fn new(tag: &str, options: &LocaleOptions) -> Result<Self, LocaleError> {
        // Intl.Locale 11–14: validate and canonicalize the original tag before
        // overrides, so alias resolution keeps its original language context.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L33-L36
        let mut locale = Self::from_tag(tag)?;
        for (name, value) in [
            ("language", &options.language),
            ("script", &options.script),
            ("region", &options.region),
            ("variants", &options.variants),
            ("calendar", &options.calendar),
            ("collation", &options.collation),
            ("firstDayOfWeek", &options.first_day_of_week),
            ("hourCycle", &options.hour_cycle),
            ("caseFirst", &options.case_first),
            ("numberingSystem", &options.numbering_system),
        ] {
            if let Some(value) = value {
                validate_option(name, value)?;
            }
        }
        if let Some(language) = &options.language {
            locale.id.language = subtag(language);
        }
        if let Some(script) = &options.script {
            locale.id.script = Some(subtag(script));
        }
        if let Some(region) = &options.region {
            locale.id.region = Some(subtag(region));
        }
        if let Some(variants) = &options.variants {
            locale.id.variants = variants.split('-').map(str::to_owned).collect();
        }
        // UpdateLanguageId 10–14 canonicalizes overrides before Unicode options;
        // an unchanged language ID is already canonical.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L109-L113
        if [
            &options.language,
            &options.script,
            &options.region,
            &options.variants,
        ]
        .iter()
        .any(|value| value.is_some())
        {
            locale = Self::parse(
                canonicalize_locale(&locale.emit_with_id(&locale.id))
                    .map_err(|_| LocaleError::InvalidTag)?,
            );
        }
        // Without Unicode overrides, the parsed extensions are already canonical.
        if options.numeric.is_none()
            && [
                &options.calendar,
                &options.collation,
                &options.first_day_of_week,
                &options.hour_cycle,
                &options.case_first,
                &options.numbering_system,
            ]
            .iter()
            .all(|value| value.is_none())
        {
            return Ok(locale);
        }
        let numeric = options.numeric.map(|value| value.to_string());
        let first_day = options
            .first_day_of_week
            .as_deref()
            .map(weekday)
            .map(str::to_owned);
        for (key, value) in [
            ("ca", options.calendar.as_deref()),
            ("co", options.collation.as_deref()),
            ("fw", first_day.as_deref()),
            ("hc", options.hour_cycle.as_deref()),
            ("kf", options.case_first.as_deref()),
            ("kn", numeric.as_deref()),
            ("nu", options.numbering_system.as_deref()),
        ] {
            if let Some(value) = value {
                locale
                    .keywords
                    .insert(key.to_owned(), value.to_ascii_lowercase());
            }
        }
        // MakeLocaleRecord 4.e–f canonicalizes option values and stores exactly
        // the canonical keywords serialized in [[Locale]], including empty kn.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L136-L156
        locale.rebuild_unicode();
        Ok(Self::parse(
            canonicalize_locale(&locale.emit_with_id(&locale.id))
                .map_err(|_| LocaleError::InvalidTag)?,
        ))
    }

    fn parse(tag: String) -> Self {
        let extension_start = |value: &str| {
            value
                .as_bytes()
                .windows(3)
                .position(|bytes| bytes[0] == b'-' && bytes[2] == b'-')
        };
        let end = extension_start(&tag).unwrap_or(tag.len());
        let id = LanguageId::parse(&tag[..end]);
        let mut extensions = Vec::new();
        let mut keywords = BTreeMap::new();
        let mut rest = &tag[end..];
        while !rest.is_empty() {
            let singleton = rest.as_bytes()[1];
            let values = &rest[3..];
            let end = if singleton == b'x' {
                values.len()
            } else {
                extension_start(values).unwrap_or(values.len())
            };
            rest = &values[end..];
            let values = &values[..end];
            if singleton == b'u' {
                let mut subtags = values.split('-').peekable();
                let mut offset = 0;
                while let Some(key) = subtags.next() {
                    offset += key.len() + 1;
                    if key.len() != 2 {
                        continue;
                    }
                    let start = offset;
                    while let Some(value) = subtags.next_if(|value| value.len() >= 3) {
                        offset += value.len() + 1;
                    }
                    let end = offset - 1;
                    keywords.insert(key.to_owned(), values[start.min(end)..end].to_owned());
                }
            }
            extensions.push(Extension {
                singleton,
                value: values.to_owned(),
            });
        }
        Self {
            tag,
            id,
            extensions,
            keywords,
        }
    }

    fn rebuild_unicode(&mut self) {
        let existing = self
            .extensions
            .iter()
            .position(|extension| extension.singleton == b'u');
        if existing.is_none() && self.keywords.is_empty() {
            return;
        }
        let index = existing.unwrap_or_else(|| {
            self.extensions.push(Extension {
                singleton: b'u',
                value: String::new(),
            });
            self.extensions.len() - 1
        });
        let mut attributes: Vec<_> = self.extensions[index]
            .value
            .split('-')
            .take_while(|part| part.len() >= 3)
            .map(str::to_owned)
            .collect();
        for (key, value) in &self.keywords {
            attributes.push(key.clone());
            if !value.is_empty() {
                attributes.extend(value.split('-').map(str::to_owned));
            }
        }
        self.extensions[index].value = attributes.join("-");
        // Private use consumes the remaining subtags, so it must stay last.
        self.extensions
            .sort_by_key(|extension| (extension.singleton == b'x', extension.singleton));
    }

    fn emit_with_id(&self, id: &LanguageId) -> String {
        let mut tag = id.emit();
        for extension in &self.extensions {
            tag.push('-');
            tag.push(extension.singleton as char);
            if !extension.value.is_empty() {
                tag.push('-');
                tag.push_str(&extension.value);
            }
        }
        tag
    }

    fn with_id(&self, id: LanguageId) -> Self {
        // Existing extensions are canonical; only language ID changes.
        let tag = self.emit_with_id(&id);
        Self {
            tag,
            id,
            extensions: self.extensions.clone(),
            keywords: self.keywords.clone(),
        }
    }

    pub fn as_str(&self) -> &str {
        &self.tag
    }
    pub fn base_name(&self) -> String {
        self.id.emit()
    }
    pub fn language(&self) -> &str {
        &self.id.language
    }
    pub fn script(&self) -> Option<&str> {
        self.id.script.as_deref()
    }
    pub fn region(&self) -> Option<&str> {
        self.id.region.as_deref()
    }
    pub fn variants(&self) -> Option<String> {
        (!self.id.variants.is_empty()).then(|| self.id.variants.join("-"))
    }
    pub fn keyword(&self, key: &str) -> Option<&str> {
        self.keywords.get(key).map(String::as_str)
    }
    pub fn numeric(&self) -> bool {
        matches!(self.keyword("kn"), Some("" | "true"))
    }

    fn maximized_id(id: &LanguageId) -> LanguageId {
        // UTS 35 Add Likely Subtags 1.2–3: discard unknown script/region only
        // for matching; keep supplied fields and report a genuine no-match.
        // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35.md#L2542-L2556
        let script = id.script.as_deref().filter(|value| *value != "Zzzz");
        let region = id.region.as_deref().filter(|value| *value != "ZZ");
        if id.language != "und" && script.is_some() && region.is_some() {
            return id.clone();
        }
        for (script_candidate, region_candidate) in [
            (script, region),
            (script, None),
            (None, region),
            (None, None),
        ] {
            let trial = LanguageId {
                language: id.language,
                script: script_candidate.map(subtag),
                region: region_candidate.map(subtag),
                variants: Vec::new(),
            };
            if let Some(found) = lookup(LIKELY_SUBTAGS, &trial.emit()) {
                let replacement = LanguageId::parse(found);
                return LanguageId {
                    language: if id.language == "und" {
                        replacement.language
                    } else {
                        id.language
                    },
                    script: script.map(subtag).or(replacement.script),
                    region: region.map(subtag).or(replacement.region),
                    variants: id.variants.clone(),
                };
            }
        }
        id.clone()
    }

    pub fn maximize(&self) -> Self {
        // Intl.Locale.prototype.maximize 3–4 preserves variants/extensions.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L284-L285
        self.with_id(Self::maximized_id(&self.id))
    }

    pub fn minimize(&self) -> Self {
        // Remove Likely Subtags 1–6: compare maximized trials in language,
        // language-region, language-script order, keeping variants/extensions.
        // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35.md#L2595-L2601
        let mut maximal = Self::maximized_id(&self.id);
        let variants = std::mem::take(&mut maximal.variants);
        for (script, region) in [(None, None), (None, maximal.region), (maximal.script, None)] {
            let mut trial = LanguageId {
                language: maximal.language,
                script,
                region,
                variants: Vec::new(),
            };
            if Self::maximized_id(&trial) == maximal {
                trial.variants = variants;
                return self.with_id(trial);
            }
        }
        maximal.variants = variants;
        self.with_id(maximal)
    }

    fn subdivision_region(&self, key: &str) -> Option<TinyAsciiStr<3>> {
        let value = self.keyword(key)?;
        let size = if value.len() >= 3 && value.as_bytes()[..2].iter().all(u8::is_ascii_alphabetic)
        {
            2
        } else if value.len() >= 4 && value.as_bytes()[..3].iter().all(u8::is_ascii_digit) {
            3
        } else {
            return None;
        };
        if !(1..=4).contains(&(value.len() - size))
            || !value.as_bytes()[size..]
                .iter()
                .all(u8::is_ascii_alphanumeric)
        {
            return None;
        }
        let region = Self::new(
            &format!("und-{}", &value[..size]),
            &LocaleOptions::default(),
        )
        .ok()?;
        region.id.region
    }

    fn region_preference(&self) -> (String, Option<String>) {
        // RegionPreference 1–4: explicit region, subdivision, likely region,
        // then world; the rg override is separate and only used with data.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L606-L616
        let region = self
            .id
            .region
            .or_else(|| self.subdivision_region("sd"))
            .or_else(|| Self::maximized_id(&self.id).region)
            .unwrap_or_else(|| subtag("001"));
        (
            region.to_string(),
            self.subdivision_region("rg").map(|value| value.to_string()),
        )
    }

    pub fn calendars(&self) -> Vec<String> {
        if let Some(value) = self.keyword("ca") {
            return vec![value.to_owned()];
        }
        let (region, region_override) = self.region_preference();
        // CalendarsOfLocale 2–9: override first, language-region before region.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L633-L648
        for candidate in region_override.iter().chain(std::iter::once(&region)) {
            let key = format!("{}-{candidate}", self.id.language);
            if let Some(values) = lookup(CALENDARS, &key).or_else(|| lookup(CALENDARS, candidate)) {
                return values
                    .iter()
                    .map(|value| {
                        if *value == "gregorian" {
                            "gregory"
                        } else {
                            value
                        }
                        .to_string()
                    })
                    .collect();
            }
        }
        vec!["gregory".to_owned()]
    }

    pub fn hour_cycles(&self) -> Vec<String> {
        if let Some(value) = self.keyword("hc") {
            return vec![value.to_owned()];
        }
        let (region, region_override) = self.region_preference();
        // HourCyclesOfLocale 2–7 uses the same region preference/data order.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L692-L702
        for candidate in region_override.iter().chain(std::iter::once(&region)) {
            let key = format!("{}-{candidate}", self.id.language);
            if let Some(values) =
                lookup(HOUR_CYCLES, &key).or_else(|| lookup(HOUR_CYCLES, candidate))
            {
                return values.iter().map(|value| (*value).to_owned()).collect();
            }
        }
        vec!["h23".to_owned()]
    }

    pub fn numbering_systems(&self, matched_default: Option<&str>) -> Vec<String> {
        // NumberingSystemsOfLocale 1–5: explicit nu, matched formatter default,
        // then latn. The embedding supplies its actual NumberFormat match.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L715-L727
        self.numbering_systems_with(|| matched_default.map(str::to_owned))
    }

    pub fn numbering_systems_with(
        &self,
        matched_default: impl FnOnce() -> Option<String>,
    ) -> Vec<String> {
        vec![
            self.keyword("nu")
                .map(str::to_owned)
                .or_else(matched_default)
                .unwrap_or_else(|| "latn".to_owned()),
        ]
    }

    /// CLDR metadata default for embeddings using the complete FormatJS data.
    pub fn cldr_default_numbering_system(&self) -> Option<&'static str> {
        let mut candidate = self.base_name();
        loop {
            if let Some(values) = lookup(NUMBERING_SYSTEMS, &candidate) {
                return values.first().copied();
            }
            let end = candidate.rfind('-')?;
            candidate.truncate(end);
        }
    }

    pub fn collations(
        &self,
        global: &[String],
        matched: bool,
        mut supported: impl FnMut(&str) -> bool,
    ) -> Vec<String> {
        if let Some(value) = self.keyword("co") {
            return vec![value.to_owned()];
        }
        // CollationsOfLocale 1–5: requested restriction, lookup match or the
        // prescribed emoji/eor fallback, then a fresh sorted unique list.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L661-L674
        if !matched {
            return vec!["emoji".to_owned(), "eor".to_owned()];
        }
        global
            .iter()
            .filter(|value| !["standard", "search"].contains(&value.as_str()) && supported(value))
            .cloned()
            .collect::<BTreeSet<_>>()
            .into_iter()
            .collect()
    }

    pub fn time_zones(&self) -> Option<Vec<String>> {
        // TimeZonesOfLocale 1–4: only an explicit region supplies time zones.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L739-L742
        let region = self.region()?.to_ascii_lowercase();
        let mut values: Vec<_> = lookup(TIME_ZONES, &region)
            .copied()
            .unwrap_or(&[])
            .iter()
            .map(|value| (*value).to_owned())
            .collect();
        values.sort();
        values.dedup();
        Some(values)
    }

    pub fn text_info(&self) -> TextInfo {
        // TextDirectionOfLocale 1–6: script metadata, independent of extensions;
        // no known/likely script or unknown direction produces undefined.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L758-L767
        let script = self
            .id
            .script
            .clone()
            .or_else(|| Self::maximized_id(&self.id).script);
        TextInfo {
            direction: script
                .as_deref()
                .and_then(|script| lookup(SCRIPT_DIRECTIONS, script))
                .map(|direction| (*direction).to_owned()),
        }
    }

    pub fn week_info(&self) -> WeekInfo {
        let (region, region_override) = self.region_preference();
        // WeekInfoOfLocale 1–9: available override, region, world, then fw.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L877-L890
        let fallback = (1, &[6, 7][..]);
        let (first_day, weekend) = *region_override
            .as_deref()
            .and_then(|region| lookup(WEEK_DATA, region))
            .or_else(|| lookup(WEEK_DATA, &region))
            .or_else(|| lookup(WEEK_DATA, "001"))
            .unwrap_or(&fallback);
        let day = self
            .keyword("fw")
            .and_then(|value| {
                ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
                    .iter()
                    .position(|day| *day == value)
            })
            .map(|index| index as u8 + 1);
        WeekInfo {
            first_day: day.unwrap_or(first_day),
            weekend: weekend.to_vec(),
        }
    }

    pub fn snapshot(&self, matched_numbering_system: Option<&str>) -> LocaleSnapshot {
        LocaleSnapshot {
            locale: self.tag.clone(),
            base_name: self.base_name(),
            language: self.id.language.to_string(),
            script: self.id.script.map(|value| value.to_string()),
            region: self.id.region.map(|value| value.to_string()),
            variants: self.variants(),
            calendar: self.keyword("ca").map(str::to_owned),
            collation: self.keyword("co").map(str::to_owned),
            hour_cycle: self.keyword("hc").map(str::to_owned),
            case_first: self.keyword("kf").map(str::to_owned),
            numeric: self.numeric(),
            numbering_system: self.keyword("nu").map(str::to_owned),
            first_day_of_week: self.keyword("fw").map(str::to_owned),
            maximized: self.maximize().to_string(),
            minimized: self.minimize().to_string(),
            calendars: self.calendars(),
            hour_cycles: self.hour_cycles(),
            numbering_systems: self.numbering_systems(matched_numbering_system),
            time_zones: self.time_zones(),
            text_info: self.text_info(),
            week_info: self.week_info(),
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
pub struct TextInfo {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub direction: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WeekInfo {
    pub first_day: u8,
    pub weekend: Vec<u8>,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LocaleSnapshot {
    pub locale: String,
    pub base_name: String,
    pub language: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub script: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub region: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variants: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub calendar: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub collation: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hour_cycle: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub case_first: Option<String>,
    pub numeric: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub numbering_system: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub first_day_of_week: Option<String>,
    pub maximized: String,
    pub minimized: String,
    pub calendars: Vec<String>,
    pub hour_cycles: Vec<String>,
    pub numbering_systems: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_zones: Option<Vec<String>>,
    pub text_info: TextInfo,
    pub week_info: WeekInfo,
}

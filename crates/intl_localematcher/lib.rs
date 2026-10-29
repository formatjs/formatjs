//! CLDR best-fit matching with ICU 78 defaults and ICU4X locale normalization.

mod matching_generated;

use icu_locale::{Locale, LocaleCanonicalizer, LocaleExpander};
use matching_generated as data;
use std::collections::{HashMap, HashSet};
use std::fmt;
use std::sync::RwLock;

/// CLDR version used to compile the distance tables.
pub const CLDR_VERSION: &str = data::CLDR_VERSION;

#[derive(Clone, Debug, Eq, PartialEq, Hash)]
struct Lsr {
    language: String,
    script: String,
    region: String,
    flags: u8,
}

struct ParsedLocale {
    locale: Locale,
    long_language: Option<String>,
}

fn parse(tag: &str) -> Result<ParsedLocale, InvalidLocale> {
    let language = tag.split('-').next().unwrap_or("");
    let long_language = (language.len() >= 5
        && language.len() <= 8
        && language.bytes().all(|b| b.is_ascii_alphabetic()))
    .then(|| language.to_ascii_lowercase());
    let mut locale: Locale = if long_language.is_some() {
        format!("qaa{}", &tag[language.len()..]).parse()
    } else {
        tag.parse()
    }
    .map_err(|_| InvalidLocale)?;
    LocaleCanonicalizer::new_extended().canonicalize(&mut locale);
    Ok(ParsedLocale {
        locale,
        long_language,
    })
}

fn maximize(parsed: &ParsedLocale) -> Lsr {
    let locale = &parsed.locale;
    let language = parsed
        .long_language
        .clone()
        .unwrap_or_else(|| locale.id.language.to_string());
    let script = locale.id.script.map(|s| s.to_string()).unwrap_or_default();
    let region = locale.id.region.map(|r| r.to_string()).unwrap_or_default();
    let tag = locale.to_string();
    if tag == "und" || tag.starts_with("und-x-") {
        return Lsr {
            language: tag,
            script: String::new(),
            region: String::new(),
            flags: 7,
        };
    }
    let pseudo = if ["XA", "XB", "XC"].contains(&region.as_str()) {
        Some(region.as_str())
    } else {
        locale.id.variants.iter().find_map(|v| match v.as_str() {
            "psaccent" => Some("XA"),
            "psbidi" => Some("XB"),
            "pscrack" => Some("XC"),
            _ => None,
        })
    };
    if let Some(pseudo) = pseudo {
        return Lsr {
            language: format!("{pseudo}:{language}"),
            script: format!("{pseudo}:{script}"),
            region: if region.is_empty() {
                pseudo.to_owned()
            } else {
                region.clone()
            },
            flags: if region.is_empty() { 6 } else { 7 },
        };
    }
    let mut flags = if language != "und" { 4 } else { 0 }
        | if !script.is_empty() && script != "Zzzz" {
            2
        } else {
            0
        }
        | if !region.is_empty() && region != "ZZ" {
            1
        } else {
            0
        };
    let mut id = locale.id.clone();
    LocaleExpander::new_extended().maximize(&mut id);
    let regional = lookup(data::LIKELY_REGIONS, region.as_str()).map(|tag| {
        let mut parts = tag.split('-');
        (
            parts.next().expect("generated language"),
            parts.next().expect("generated script"),
        )
    });
    // ICU inherits a region's language when its likely script matches the input.
    if language == "und"
        && let Some((regional_language, regional_script)) = regional
    {
        if !script.is_empty() && script == regional_script {
            id.language = regional_language.parse().expect("generated language");
        }
    }
    if data::MACRO_REGIONS.contains(&region.as_str()) {
        let no_script = script.is_empty() || script == "Zzzz";
        let mut probe: Locale = if parsed.long_language.is_some() {
            "qaa"
        } else {
            &language
        }
        .parse()
        .expect("parsed language");
        LocaleExpander::new_extended().maximize(&mut probe.id);
        if (language == "und" && (no_script || regional.is_some_and(|(_, s)| s == script)))
            || (no_script && probe.id.script.is_none())
        {
            flags &= !1;
        }
    }
    // ICU4X leaves unknown LSRs incomplete; ICU4C/J fall back through und.
    if id.language.is_unknown() || id.script.is_none() || id.region.is_none() {
        let mut fallback = id.clone();
        fallback.language = icu_locale::subtags::Language::UNKNOWN;
        LocaleExpander::new_extended().maximize(&mut fallback);
        let default: Locale = "en-Latn-US".parse().expect("default LSR");
        if id.language.is_unknown() {
            id.language = if fallback.language.is_unknown() {
                default.id.language
            } else {
                fallback.language
            };
        }
        id.script = id.script.or(fallback.script).or(default.id.script);
        id.region = id.region.or(fallback.region).or(default.id.region);
    }
    Lsr {
        language: parsed
            .long_language
            .clone()
            .unwrap_or_else(|| id.language.to_string()),
        script: id.script.map(|s| s.to_string()).unwrap_or_default(),
        region: id.region.map(|r| r.to_string()).unwrap_or_default(),
        flags,
    }
}

fn lookup<'a, T>(table: &'a [(&str, T)], key: &str) -> Option<&'a T> {
    table
        .binary_search_by(|(k, _)| k.cmp(&key))
        .ok()
        .map(|index| &table[index].1)
}

// Distances use ICU's three fractional bits for explicit-subtag ties.
fn distance(desired: &Lsr, supported: &Lsr) -> u16 {
    let languages = format!("{}|{}", desired.language, supported.language);
    let mut result = if desired.language == supported.language {
        0
    } else {
        *lookup(data::LANGUAGE, &languages).unwrap_or(&data::DEFAULTS[0])
    } as u16;
    let scripts = format!("{languages}|{}|{}", desired.script, supported.script);
    if desired.script != supported.script {
        result += *lookup(data::SCRIPT, &scripts).unwrap_or(&data::DEFAULTS[1]) as u16;
    }
    if desired.region != supported.region {
        let matrix = lookup(data::REGION, &scripts)
            .or_else(|| lookup(data::REGION, &format!("{languages}|*|*")));
        let mut regional = data::DEFAULTS[2];
        if let (Some(matrix), Some(dp), Some(sp)) = (
            matrix,
            lookup(data::REGIONS, &desired.region),
            lookup(data::REGIONS, &supported.region),
        ) {
            regional = 0;
            for &d in *dp {
                for &s in *sp {
                    regional =
                        regional.max(matrix[d as usize * data::PARTITION_COUNT + s as usize]);
                }
            }
        }
        result += regional as u16;
    }
    if result == 0 {
        (desired.flags ^ supported.flags) as u16
    } else {
        result * 8
    }
}

fn equivalent(a: &Lsr, b: &Lsr) -> bool {
    a.language == b.language && a.script == b.script && a.region == b.region
}

fn more_likely(candidate: &Lsr, previous: &Lsr) -> bool {
    if candidate.language != previous.language {
        return false;
    }
    let Ok(locale) = parse(&candidate.language) else {
        return false;
    };
    let likely = maximize(&locale);
    if candidate.script != previous.script {
        candidate.script == likely.script
    } else {
        candidate.region != previous.region && candidate.region == likely.region
    }
}

/// Invalid Unicode locale identifier.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct InvalidLocale;
impl fmt::Display for InvalidLocale {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("Invalid language tag")
    }
}
impl std::error::Error for InvalidLocale {}

/// Selected original supported tag and requested-list index; None means default fallback.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct MatchResult<'a> {
    pub locale: &'a str,
    pub desired_index: Option<usize>,
    pub supported_index: Option<usize>,
}

/// A validated, normalized request that can be reused without parsing or allocation.
#[derive(Clone, Debug)]
pub struct DesiredLocale {
    lsr: Lsr,
}

impl DesiredLocale {
    pub fn new(tag: &str) -> Result<Self, InvalidLocale> {
        Ok(Self {
            lsr: maximize(&parse(tag)?),
        })
    }
}

/// Reusable matcher. Supported locales are normalized and indexed once.
#[derive(Debug)]
pub struct LocaleMatcher {
    supported: Vec<String>,
    default_locale: String,
    lsrs: Vec<Lsr>,
    languages: HashSet<String>,
    exact: HashMap<Lsr, usize>,
    order: Vec<usize>,
    demotion: u16,
    best: RwLock<HashMap<Lsr, Option<(usize, u16)>>>,
}

impl LocaleMatcher {
    pub fn new<S: AsRef<str>>(
        supported: &[S],
        default_locale: &str,
    ) -> Result<Self, InvalidLocale> {
        let default_lsr = maximize(&parse(default_locale)?);
        let lsrs: Vec<_> = supported
            .iter()
            .map(|s| parse(s.as_ref()).map(|l| maximize(&l)))
            .collect::<Result<_, _>>()?;
        let mut exact = HashMap::new();
        for (index, lsr) in lsrs.iter().enumerate() {
            exact.entry(lsr.clone()).or_insert(index);
        }
        let paradigms: Vec<_> = data::PARADIGMS
            .iter()
            .map(|tag| maximize(&parse(tag).expect("generated paradigm locale")))
            .collect();
        let mut order: Vec<_> = (0..supported.len()).collect();
        order.sort_by_key(|&i| {
            if equivalent(&lsrs[i], &default_lsr) {
                0
            } else if paradigms.iter().any(|p| equivalent(p, &lsrs[i])) {
                1
            } else {
                2
            }
        });
        let demotion = distance(&maximize(&parse("en-US")?), &maximize(&parse("en-GB")?));
        Ok(Self {
            supported: supported.iter().map(|s| s.as_ref().to_owned()).collect(),
            default_locale: default_locale.to_owned(),
            languages: lsrs.iter().map(|lsr| lsr.language.clone()).collect(),
            lsrs,
            exact,
            order,
            demotion,
            best: RwLock::new(HashMap::new()),
        })
    }

    /// Match requested tags in preference order, with ICU's exclusive script threshold.
    pub fn best_match<S: AsRef<str>>(
        &self,
        requested: &[S],
    ) -> Result<MatchResult<'_>, InvalidLocale> {
        self.best_match_with_threshold(requested, data::DEFAULTS[1] as u16 * 8)
    }

    /// Match previously normalized requests, preserving their preference order.
    pub fn best_match_prepared(&self, requested: &[DesiredLocale]) -> MatchResult<'_> {
        self.match_lsrs(
            requested.iter().map(|request| &request.lsr),
            data::DEFAULTS[1] as u16 * 8,
        )
    }

    fn best_match_with_threshold<S: AsRef<str>>(
        &self,
        requested: &[S],
        threshold: u16,
    ) -> Result<MatchResult<'_>, InvalidLocale> {
        // Validate the full list even if an early locale matches.
        let desired: Vec<_> = requested
            .iter()
            .map(|s| parse(s.as_ref()).map(|l| maximize(&l)))
            .collect::<Result<_, _>>()?;
        Ok(self.match_lsrs(desired.iter(), threshold))
    }

    fn match_lsrs<'a>(
        &self,
        desired: impl Iterator<Item = &'a Lsr>,
        threshold: u16,
    ) -> MatchResult<'_> {
        let mut result = MatchResult {
            locale: &self.default_locale,
            desired_index: None,
            supported_index: None,
        };
        let mut threshold = threshold;
        for (desired_index, desired) in desired.enumerate() {
            if threshold == 0 {
                break;
            }
            if let Some(&index) = self.exact.get(desired) {
                return MatchResult {
                    locale: &self.supported[index],
                    desired_index: Some(desired_index),
                    supported_index: Some(index),
                };
            }
            if let Some((index, d)) = self.closest(desired) {
                if d < threshold {
                    threshold = d;
                    result = MatchResult {
                        locale: &self.supported[index],
                        desired_index: Some(desired_index),
                        supported_index: Some(index),
                    };
                }
            }
            threshold = threshold.saturating_sub(self.demotion);
        }
        result
    }

    fn closest(&self, desired: &Lsr) -> Option<(usize, u16)> {
        if let Some(result) = self
            .best
            .read()
            .unwrap_or_else(|e| e.into_inner())
            .get(desired)
        {
            return *result;
        }
        let mut best: Option<(usize, u16)> = None;
        let unreachable = data::DEFAULTS[0] >= data::DEFAULTS[1]
            && !self.languages.contains(&desired.language)
            && data::LANGUAGE_KEYS
                .binary_search(&desired.language.as_str())
                .is_err();
        for &index in if unreachable {
            &[][..]
        } else {
            &self.order[..]
        } {
            let d = distance(desired, &self.lsrs[index]);
            if best.is_none_or(|(previous, previous_distance)| {
                d < previous_distance
                    || (d == previous_distance
                        && d >= 8
                        && more_likely(&self.lsrs[index], &self.lsrs[previous]))
            }) {
                best = Some((index, d));
            }
        }
        let mut cache = self.best.write().unwrap_or_else(|e| e.into_inner());
        if cache.len() >= 256 {
            cache.clear();
        }
        cache.insert(desired.clone(), best);
        best
    }
}

/// ICU pair distance in CLDR units. Fractional values distinguish explicit subtags.
pub fn matching_distance(desired: &str, supported: &str) -> Result<f64, InvalidLocale> {
    Ok(distance(&maximize(&parse(desired)?), &maximize(&parse(supported)?)) as f64 / 8.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn invalid_tags_and_empty_lists() {
        assert!(LocaleMatcher::new(&["en_US"], "en").is_err());
        assert!(LocaleMatcher::new(&["abcd"], "en").is_err());
        let long = LocaleMatcher::new(&["fullwide-GB", "en"], "en").unwrap();
        assert_eq!(
            long.best_match(&["fullwide-AU"]).unwrap().locale,
            "fullwide-GB"
        );
        assert_eq!(long.best_match(&["otherlng"]).unwrap().locale, "en");
        let matcher = LocaleMatcher::new(&["en"], "fr").unwrap();
        assert!(matcher.best_match(&["en", "bad_tag"]).is_err());
        assert_eq!(matcher.best_match::<&str>(&[]).unwrap().locale, "fr");
        assert_eq!(
            LocaleMatcher::new::<&str>(&[], "fr")
                .unwrap()
                .best_match(&["en"])
                .unwrap()
                .locale,
            "fr"
        );
    }

    #[test]
    fn directional_distances_and_threshold() {
        assert!(matching_distance("br", "fr").unwrap() < 50.0);
        assert!(matching_distance("fr", "br").unwrap() >= 50.0);
        let matcher = LocaleMatcher::new(&["en"], "fr").unwrap();
        assert_eq!(
            matcher
                .best_match_with_threshold(&["en"], 0)
                .unwrap()
                .locale,
            "fr"
        );
    }
}

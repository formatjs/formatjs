//! Canonical-tag matching shared by native polyfills. Best fit follows the TS
//! matcher, including request-order penalties and CLDR paradigm tie breaking.

use crate::{
    Locale, LocaleError, LocaleOptions,
    data_generated::{MATCH_PARADIGMS, MATCH_RULES, MATCH_VARIABLES},
};
use std::collections::BTreeSet;
use std::sync::OnceLock;

/// Remove only the Unicode extension; a private-use subtag named u stays intact.
/// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L116-L118
pub fn without_unicode_extension(locale: &str) -> String {
    let parts: Vec<_> = locale.split('-').collect();
    for (index, part) in parts.iter().enumerate().skip(1) {
        if *part == "x" {
            break;
        }
        if *part != "u" {
            continue;
        }
        let end = (index + 1..parts.len())
            .find(|end| parts[*end].len() == 1)
            .unwrap_or(parts.len());
        return parts[..index]
            .iter()
            .chain(parts[end..].iter())
            .copied()
            .collect::<Vec<_>>()
            .join("-");
    }
    locale.to_owned()
}

fn prefix<'a>(available: &BTreeSet<&'a str>, requested: &str) -> Option<&'a str> {
    let mut candidate = requested;
    loop {
        if let Some(found) = available.get(candidate) {
            return Some(*found);
        }
        let mut end = candidate.rfind('-')?;
        while end >= 2 && candidate.as_bytes()[end - 2] == b'-' {
            end -= 2;
        }
        candidate = &candidate[..end];
    }
}

/// LookupMatchingLocaleByPrefix 1–3; caller supplies canonical requested tags.
/// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L113-L130
pub fn lookup(available: &[String], requested: &[String]) -> Option<String> {
    let set = available.iter().map(String::as_str).collect();
    requested
        .iter()
        .find_map(|tag| prefix(&set, &without_unicode_extension(tag)).map(str::to_owned))
}

/// FilterLocales preserves requested tags, including their Unicode extensions.
/// The TS implementation uses prefix support for both localeMatcher values.
/// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L334-L347
pub fn supported(available: &[String], requested: &[String]) -> Vec<String> {
    let set = available.iter().map(String::as_str).collect();
    requested
        .iter()
        .filter(|tag| prefix(&set, &without_unicode_extension(tag)).is_some())
        .cloned()
        .collect()
}

fn maximize(tag: &str) -> Result<Locale, LocaleError> {
    Ok(Locale::new(tag, &LocaleOptions::default())?.maximize())
}

#[derive(Clone, Copy)]
struct Lsr<'a> {
    language: &'a str,
    script: &'a str,
    region: &'a str,
}
impl<'a> Lsr<'a> {
    fn from(locale: &'a Locale) -> Self {
        Self {
            language: locale.language(),
            script: locale.script().unwrap_or(""),
            region: locale.region().unwrap_or(""),
        }
    }
    fn emit(self) -> String {
        [self.language, self.script, self.region]
            .into_iter()
            .filter(|part| !part.is_empty())
            .collect::<Vec<_>>()
            .join("-")
    }
}
fn matches(locale: Lsr<'_>, pattern: &str) -> bool {
    let mut parts = pattern.split('-');
    let language = parts.next().unwrap_or("");
    let script = parts.next().unwrap_or("");
    let region = parts.next().unwrap_or("");
    let region_matches = if let Some(variable) = region.strip_prefix('$') {
        let (include, variable) = variable
            .strip_prefix('!')
            .map(|value| (false, value))
            .unwrap_or((true, variable));
        let found = MATCH_VARIABLES
            .iter()
            .find(|(name, _)| *name == variable)
            .is_some_and(|(_, regions)| regions.contains(&locale.region));
        found == include
    } else {
        locale.region.is_empty() || region == "*" || region == locale.region
    };
    region_matches
        && (locale.script.is_empty() || script == "*" || script == locale.script)
        && (locale.language.is_empty() || language == "*" || language == locale.language)
}
fn paradigms() -> &'static BTreeSet<String> {
    static PARADIGMS: OnceLock<BTreeSet<String>> = OnceLock::new();
    PARADIGMS.get_or_init(|| {
        MATCH_PARADIGMS
            .iter()
            .flat_map(|tag| {
                std::iter::once((*tag).to_owned())
                    .chain(maximize(tag).ok().map(|locale| locale.as_str().to_owned()))
            })
            .collect()
    })
}
fn component_distance(desired: Lsr<'_>, supported: Lsr<'_>) -> i32 {
    for &(supported_pattern, desired_pattern, distance, oneway) in MATCH_RULES {
        if (matches(desired, desired_pattern) && matches(supported, supported_pattern))
            || (!oneway
                && matches(desired, supported_pattern)
                && matches(supported, desired_pattern))
        {
            let paradigm_bias =
                paradigms().contains(&desired.emit()) != paradigms().contains(&supported.emit());
            return distance * 10 - i32::from(paradigm_bias);
        }
    }
    // CLDR's final wildcard rule covers each component dimension.
    unreachable!("CLDR language matching table lacks a wildcard")
}
fn distance(desired: &Locale, supported: &Locale) -> i32 {
    let desired = Lsr::from(desired);
    let supported = Lsr::from(supported);
    let mut distance = 0;
    if desired.language != supported.language {
        distance += component_distance(
            Lsr {
                script: "",
                region: "",
                ..desired
            },
            Lsr {
                script: "",
                region: "",
                ..supported
            },
        );
    }
    if desired.script != supported.script {
        distance += component_distance(
            Lsr {
                region: "",
                ..desired
            },
            Lsr {
                region: "",
                ..supported
            },
        );
    }
    if desired.region != supported.region {
        distance += component_distance(desired, supported);
    }
    distance
}

/// Best fit is implementation-defined. Keep TS's exact/maximized fast paths,
/// then compare full CLDR distance independently of the fallback heuristic.
/// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L134-L144
pub fn best_fit(available: &[String], requested: &[String]) -> Result<Option<String>, LocaleError> {
    let requested: Vec<_> = requested
        .iter()
        .map(|tag| without_unicode_extension(tag))
        .collect();
    let set: BTreeSet<_> = available.iter().map(String::as_str).collect();
    let mut lowest = i32::MAX;
    let mut result = None;
    for (index, desired) in requested.iter().enumerate() {
        if set.contains(desired.as_str()) {
            let distance = index as i32 * 40;
            if distance < lowest {
                lowest = distance;
                result = Some(desired.clone());
            }
            if index == 0 {
                return Ok(result);
            }
        }
    }
    let desired_max: Vec<_> = requested
        .iter()
        .map(|tag| maximize(tag))
        .collect::<Result<_, _>>()?;
    for (index, (desired, maximal)) in requested.iter().zip(&desired_max).enumerate() {
        let mut candidate = maximal.as_str();
        if candidate == desired {
            continue;
        }
        let mut removed = 0;
        loop {
            if candidate != desired && set.contains(candidate) {
                let distance = if maximize(candidate)?.as_str() == maximal.as_str() {
                    index as i32 * 40
                } else {
                    removed * 10 + index as i32 * 40
                };
                if distance < lowest {
                    lowest = distance;
                    result = Some(candidate.to_owned());
                }
                break;
            }
            let Some(end) = candidate.rfind('-') else {
                break;
            };
            candidate = &candidate[..end];
            removed += 1;
        }
    }
    if lowest == 0 {
        return Ok(result);
    }
    // Tier 2's subtag counts are not CLDR distances. Reset before Tier 3.
    lowest = i32::MAX;
    let supported_max: Vec<_> = available
        .iter()
        .map(|tag| maximize(tag))
        .collect::<Result<_, _>>()?;
    for (index, desired) in desired_max.iter().enumerate() {
        for (supported_index, supported) in supported_max.iter().enumerate() {
            let distance = distance(desired, supported) + index as i32 * 40;
            if distance < lowest {
                lowest = distance;
                result = Some(available[supported_index].clone());
            }
        }
    }
    Ok(if lowest < 838 { result } else { None })
}

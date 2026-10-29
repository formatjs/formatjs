//! Canonical-tag matching shared by native polyfills. Best fit follows the TS
//! matcher through the shared ICU-compatible distance implementation.

use crate::LocaleError;
use formatjs_intl_localematcher::LocaleMatcher;
use std::{
    cell::RefCell,
    collections::{BTreeSet, HashMap},
    sync::{Arc, OnceLock},
};

thread_local! {
    static MATCHERS: RefCell<HashMap<Vec<String>, Arc<PreparedMatcher>>> = RefCell::new(HashMap::new());
}

/// Remove only the Unicode extension; a private-use subtag named u stays intact.
/// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L116-L118
pub fn without_unicode_extension(locale: &str) -> String {
    if !locale.contains("-u") {
        return locale.to_owned();
    }
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

/// Prefer the likely script when canonical packs share a scriptless alias.
pub fn is_likely_script(locale: &str, script: &str) -> bool {
    let id = crate::LanguageId::parse(&locale.split('-').collect::<Vec<_>>());
    crate::Locale::maximized_id(&id).script.as_deref() == Some(script)
}

// Canonical ordinary LSR fields preserve zero-distance ties without expansion.
fn raw_key(tag: &str) -> Option<&str> {
    let mut parts = tag.split('-');
    let language = parts.next()?;
    if language == "und"
        || tag
            .split('-')
            .any(|part| matches!(part, "psaccent" | "psbidi" | "pscrack"))
    {
        return None;
    }
    let mut end = language.len();
    let mut next = parts.next();
    if let Some(script) =
        next.filter(|p| p.len() == 4 && p.bytes().all(|b| b.is_ascii_alphabetic()))
    {
        if script == "Zzzz" {
            return None;
        }
        end += script.len() + 1;
        next = parts.next();
    }
    if let Some(region) = next.filter(|p| {
        (p.len() == 2 && p.bytes().all(|b| b.is_ascii_alphabetic()))
            || (p.len() == 3 && p.bytes().all(|b| b.is_ascii_digit()))
    }) {
        if region == "ZZ" || matches!(region, "XA" | "XB" | "XC") {
            return None;
        }
        end += region.len() + 1;
    }
    Some(&tag[..end])
}

/// Best fit shares ICU defaults with the TypeScript matcher.
/// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L134-L144
pub fn best_fit(available: &[String], requested: &[String]) -> Result<Option<String>, LocaleError> {
    Ok(best_fit_requested(available, requested)?.map(|(_, locale)| locale))
}

/// Return the winning request index as well as its data locale. ResolveLocale
/// needs that request's Unicode extensions, not the first requested tag's.
/// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L237-L246
pub fn best_fit_requested(
    available: &[String],
    requested: &[String],
) -> Result<Option<(usize, String)>, LocaleError> {
    if available.is_empty() {
        return Ok(None);
    }
    if requested.is_empty() {
        return Ok(None);
    }
    if let Some(result) = first_exact(available, requested) {
        return Ok(Some(result));
    }
    let matcher = shared_matcher(available)?;
    match_requested(&matcher.distance, requested)
}

fn shared_matcher(available: &[String]) -> Result<Arc<PreparedMatcher>, LocaleError> {
    MATCHERS.with(|cache| {
        let mut cache = cache.borrow_mut();
        if !cache.contains_key(available) {
            let matcher = LocaleMatcher::new(available, &available[0])
                .map_err(|_| LocaleError::InvalidTag)?;
            if cache.len() >= 16 {
                cache.clear();
            }
            cache.insert(
                available.to_vec(),
                Arc::new(PreparedMatcher {
                    distance: matcher,
                    exact: OnceLock::new(),
                }),
            );
        }
        Ok(Arc::clone(cache.get(available).unwrap()))
    })
}

fn first_exact(available: &[String], requested: &[String]) -> Option<(usize, String)> {
    let desired = without_unicode_extension(requested.first()?);
    if let Some(key) = raw_key(&desired) {
        let language = key.split('-').next().unwrap();
        for locale in available {
            if !locale
                .strip_prefix(language)
                .is_some_and(|tail| tail.is_empty() || tail.starts_with('-'))
            {
                continue;
            }
            // Special locales need the full matcher before skipping a possible tie.
            let Some(candidate) = raw_key(locale) else {
                break;
            };
            if candidate == key {
                return Some((0, locale.clone()));
            }
        }
    }
    None
}

fn match_requested(
    matcher: &LocaleMatcher,
    requested: &[String],
) -> Result<Option<(usize, String)>, LocaleError> {
    let requested: Vec<_> = requested
        .iter()
        .map(|tag| without_unicode_extension(tag))
        .collect();
    let result = matcher
        .best_match(&requested)
        .map_err(|_| LocaleError::InvalidTag)?;
    Ok(result
        .desired_index
        .map(|index| (index, result.locale.to_owned())))
}

struct PreparedMatcher {
    distance: LocaleMatcher,
    exact: OnceLock<HashMap<String, usize>>,
}

fn exact_index(available: &[String]) -> HashMap<String, usize> {
    let mut exact = HashMap::new();
    let mut blocked = BTreeSet::new();
    for (index, locale) in available.iter().enumerate() {
        let language = locale.split('-').next().unwrap();
        if blocked.contains(language) {
            continue;
        }
        if let Some(key) = raw_key(locale) {
            exact.entry(key.to_owned()).or_insert(index);
        } else {
            // Preserve the scan's special-locale barriers and first-match ties.
            blocked.insert(language.to_owned());
        }
    }
    exact
}

// Owning the snapshot avoids hashing every available tag on each match.
#[derive(Default)]
pub struct AvailableLocales {
    locales: Vec<String>,
    matcher: OnceLock<Result<Arc<PreparedMatcher>, LocaleError>>,
}

impl AvailableLocales {
    pub fn new(locales: Vec<String>) -> Self {
        Self {
            locales,
            matcher: OnceLock::new(),
        }
    }

    pub fn push(&mut self, locale: String) {
        self.matcher.take();
        self.locales.push(locale);
    }

    pub fn as_slice(&self) -> &[String] {
        &self.locales
    }

    pub fn best_fit(&self, requested: &[String]) -> Result<Option<String>, LocaleError> {
        Ok(self
            .best_fit_requested(requested)?
            .map(|(_, locale)| locale))
    }

    pub fn best_fit_requested(
        &self,
        requested: &[String],
    ) -> Result<Option<(usize, String)>, LocaleError> {
        if self.locales.is_empty() {
            return Ok(None);
        }
        if requested.is_empty() {
            return Ok(None);
        }
        let matcher = match self.matcher.get() {
            Some(Ok(matcher)) => matcher,
            _ => {
                if let Some(result) = first_exact(&self.locales, requested) {
                    return Ok(Some(result));
                }
                self.matcher
                    .get_or_init(|| shared_matcher(&self.locales))
                    .as_ref()
                    .map_err(Clone::clone)?
            }
        };
        let desired = without_unicode_extension(&requested[0]);
        if let Some(key) = raw_key(&desired) {
            if let Some(index) = matcher
                .exact
                .get_or_init(|| exact_index(&self.locales))
                .get(key)
            {
                return Ok(Some((0, self.locales[*index].clone())));
            }
        }
        match_requested(&matcher.distance, requested)
    }
}

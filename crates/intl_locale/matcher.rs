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

/// ECMA-402 §9.2.3 step 1.b removes the Unicode extension.
/// https://tc39.es/ecma402/#sec-lookupmatchinglocalebyprefix
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
    find_prefix(requested, |candidate| available.get(candidate).copied())
}

fn find_prefix<'a, T>(requested: &'a str, find: impl Fn(&'a str) -> Option<T>) -> Option<T> {
    let mut candidate = requested;
    loop {
        if let Some(found) = find(candidate) {
            return Some(found);
        }
        let mut end = candidate.rfind('-')?;
        while end >= 2 && candidate.as_bytes()[end - 2] == b'-' {
            end -= 2;
        }
        candidate = &candidate[..end];
    }
}

struct HostLocale {
    tag: String,
    region_tag: Option<String>,
}

// ECMA-402 §6.2.3. Capture the process's POSIX message locale.
// https://tc39.es/ecma402/#sec-defaultlocale
fn host_locale() -> Option<&'static HostLocale> {
    static HOST_LOCALE: OnceLock<Option<HostLocale>> = OnceLock::new();
    HOST_LOCALE
        .get_or_init(|| {
            let locale = ["LC_ALL", "LC_MESSAGES", "LANG"]
                .into_iter()
                .filter_map(std::env::var_os)
                .find(|value| !value.is_empty())?;
            let locale = locale.to_str()?.split(['.', '@']).next()?;
            if locale == "C" || locale == "POSIX" {
                return None;
            }
            let canonical =
                formatjs_intl_getcanonicallocales::canonicalize_locale(&locale.replace('_', "-"))
                    .ok()?;
            let id = crate::LanguageId::parse(&canonical);
            let region_tag = match (id.script, id.region) {
                (Some(_), Some(region)) => Some(format!("{}-{region}", id.language)),
                _ => None,
            };
            Some(HostLocale {
                tag: without_unicode_extension(&canonical),
                region_tag,
            })
        })
        .as_ref()
}

fn find_available_prefix<'a>(available: &'a [String], locale: &str) -> Option<&'a str> {
    find_prefix(locale, |candidate| {
        available
            .iter()
            .map(String::as_str)
            .find(|tag| *tag == candidate)
    })
}

/// ECMA-402 §9.1. Include the host tag and its scriptless region when supported.
/// https://tc39.es/ecma402/#sec-internal-slots
pub fn include_host_locale(available: &mut Vec<String>) -> usize {
    let Some(locale) = host_locale() else {
        return 0;
    };
    let Some(data_tag) = find_available_prefix(available, &locale.tag) else {
        return 0;
    };
    let original_len = available.len();
    if data_tag != locale.tag {
        available.push(locale.tag.clone());
    }
    if let Some(region) = &locale.region_tag {
        if !available.contains(region) {
            available.push(region.clone());
        }
    }
    available.len() - original_len
}

/// ECMA-402 §9.2.7 step 3 selects the host tag with an empty extension.
/// https://tc39.es/ecma402/#sec-resolvelocale
pub fn host_default(available: &[String]) -> Option<String> {
    let locale = &host_locale()?.tag;
    available
        .iter()
        .any(|tag| tag == locale)
        .then(|| locale.clone())
}

/// Data for an inferred host tag or its scriptless region.
pub fn host_locale_data(locale: &str, has_data: impl Fn(&str) -> bool) -> Option<&'static str> {
    let host = host_locale()?;
    if host.tag != locale && host.region_tag.as_deref() != Some(locale) {
        return None;
    }
    find_prefix(&host.tag, |candidate| {
        has_data(candidate).then_some(candidate)
    })
}

/// ECMA-402 §9.2.3 searches the requested tags in order; caller canonicalizes.
/// https://tc39.es/ecma402/#sec-lookupmatchinglocalebyprefix
pub fn lookup(available: &[String], requested: &[String]) -> Option<String> {
    let set = available.iter().map(String::as_str).collect();
    requested
        .iter()
        .find_map(|tag| prefix(&set, &without_unicode_extension(tag)).map(str::to_owned))
}

/// ECMA-402 §9.2.9 steps 3–5, prefix matching branch.
/// https://tc39.es/ecma402/#sec-filterlocales
pub fn supported(available: &[String], requested: &[String]) -> Vec<String> {
    let set = available.iter().map(String::as_str).collect();
    requested
        .iter()
        .filter(|tag| prefix(&set, &without_unicode_extension(tag)).is_some())
        .cloned()
        .collect()
}

/// ECMA-402 §9.2.9 steps 3–5 match each tag without a default.
/// https://tc39.es/ecma402/#sec-filterlocales
pub fn filter(
    available: &[String],
    requested: &[String],
    lookup: bool,
) -> Result<Vec<String>, LocaleError> {
    if lookup {
        return Ok(supported(available, requested));
    }
    if available.is_empty() || requested.is_empty() {
        return Ok(Vec::new());
    }
    let mut prepared = None;
    let mut subset = Vec::new();
    for tag in requested {
        let single = std::slice::from_ref(tag);
        if first_exact(available, single).is_some() {
            subset.push(tag.clone());
            continue;
        }
        let matcher = match &prepared {
            Some(matcher) => matcher,
            None => prepared.insert(shared_matcher(available)?),
        };
        // Keep ordinary prefix matches and preserve ICU pseudolocale isolation.
        if match_requested(&matcher.distance, single)?.is_some() || {
            let base = without_unicode_extension(tag);
            raw_key(&base).is_some() && find_available_prefix(available, &base).is_some()
        } {
            subset.push(tag.clone());
        }
    }
    Ok(subset)
}

// Accept the legacy array form for embeddings that used prefix filtering.
#[derive(serde::Deserialize)]
#[serde(untagged)]
pub enum FilterRequest {
    Locales(Vec<String>),
    WithMatcher {
        locales: Vec<String>,
        lookup: Option<bool>,
    },
}

impl FilterRequest {
    pub fn into_parts(self) -> (Vec<String>, bool) {
        match self {
            Self::Locales(locales) => (locales, true),
            Self::WithMatcher { locales, lookup } => (locales, lookup.unwrap_or(true)),
        }
    }
}

/// Prefer the likely script when canonical packs share a scriptless alias.
pub fn is_likely_script(locale: &str, script: &str) -> bool {
    let id = crate::LanguageId::parse(locale);
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

/// ECMA-402 §9.2.4 best fit shares ICU defaults with the TypeScript matcher.
/// https://tc39.es/ecma402/#sec-lookupmatchinglocalebybestfit
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
    host_aliases: usize,
    matcher: OnceLock<Result<Arc<PreparedMatcher>, LocaleError>>,
}

impl AvailableLocales {
    pub fn new(locales: Vec<String>) -> Self {
        Self {
            locales,
            host_aliases: 0,
            matcher: OnceLock::new(),
        }
    }

    pub fn with_host_locale(mut locales: Vec<String>) -> Self {
        let host_aliases = include_host_locale(&mut locales);
        Self {
            locales,
            host_aliases,
            matcher: OnceLock::new(),
        }
    }

    pub fn push(&mut self, locale: String) {
        self.matcher.take();
        self.locales
            .insert(self.locales.len() - self.host_aliases, locale);
    }

    pub fn push_service_locale(&mut self, locale: String) {
        self.locales
            .truncate(self.locales.len() - self.host_aliases);
        self.host_aliases = 0;
        self.push(locale);
        self.host_aliases = include_host_locale(&mut self.locales);
    }

    pub fn as_slice(&self) -> &[String] {
        &self.locales
    }

    pub fn data_locale<'a>(&'a self, locale: &'a str) -> &'a str {
        let (registered, aliases) = self
            .locales
            .split_at(self.locales.len() - self.host_aliases);
        if aliases.iter().any(|alias| alias == locale) {
            return host_locale_data(locale, |candidate| {
                registered.iter().any(|tag| tag == candidate)
            })
            .unwrap_or(locale);
        }
        locale
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

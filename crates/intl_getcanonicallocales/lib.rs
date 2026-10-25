//! ECMA-402 locale-tag canonicalization. JavaScript coercion belongs in the host adapter.
//! Algorithm/step mapping and pinned sources: see SPEC.md beside this file.
//! https://github.com/tc39/ecma402/blob/3691634ebc1794f2af74cb26e59824b21090c3ad/spec/locales-currencies-tz.html#L45-L96

mod aliases_generated;

use icu_locale::subtags::Variants;
use icu_locale::{Locale, LocaleCanonicalizer};
use std::collections::{BTreeMap, BTreeSet, HashSet};
use std::fmt;
#[cfg(feature = "compiled_data")]
use std::ptr;

/// Reusable locale canonicalizer backed by baked or caller-provided ICU4X data.
#[derive(Debug)]
pub struct Canonicalizer {
    inner: LocaleCanonicalizer,
}

impl Canonicalizer {
    #[cfg(feature = "compiled_data")]
    pub const fn new() -> Self {
        Self {
            inner: LocaleCanonicalizer::new_extended(),
        }
    }

    /// Loads global alias and likely-subtag metadata from `provider` once.
    /// Construct a new canonicalizer when replacing that base data pack.
    pub fn try_new_with_provider<P>(provider: &P) -> Result<Self, icu_provider::DataError>
    where
        P: icu_provider::buf::BufferProvider + Send + Sync + ?Sized,
    {
        Ok(Self {
            inner: LocaleCanonicalizer::try_new_extended_with_buffer_provider(provider)?,
        })
    }

    /// Canonicalizes one structurally valid Unicode locale identifier.
    pub fn canonicalize_locale(&self, tag: &str) -> Result<String, InvalidLocale> {
        canonicalize_with(&self.inner, tag)
    }

    /// Canonicalizes tags, removing duplicates while preserving first occurrence.
    pub fn get_canonical_locales<S: AsRef<str>>(
        &self,
        locales: &[S],
    ) -> Result<Vec<String>, InvalidLocale> {
        // CanonicalizeLocaleList 7.c.v–vii for already-coerced Rust strings.
        let mut seen = HashSet::with_capacity(locales.len());
        let mut result = Vec::with_capacity(locales.len());
        for locale in locales {
            let canonical = self.canonicalize_locale(locale.as_ref())?;
            if seen.insert(canonical.clone()) {
                result.push(canonical);
            }
        }
        Ok(result)
    }
}

#[cfg(feature = "compiled_data")]
impl Default for Canonicalizer {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct InvalidLocale;

impl fmt::Display for InvalidLocale {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("Invalid language tag")
    }
}

impl std::error::Error for InvalidLocale {}

struct LanguageAliasRule {
    script: &'static str,
    region: &'static str,
    variants: &'static [&'static str],
    replacement: &'static str,
    specificity: usize,
}

// CanonicalizeUnicodeLocaleId 1: UTS #35 alias matching; absent fields are wildcards.
fn matches_language_rule(locale: &Locale, rule: &LanguageAliasRule) -> bool {
    (rule.script.is_empty()
        || locale
            .id
            .script
            .is_some_and(|value| value.as_str() == rule.script))
        && (rule.region.is_empty()
            || locale
                .id
                .region
                .is_some_and(|value| value.as_str() == rule.region))
        && rule.variants.iter().all(|expected| {
            locale
                .id
                .variants
                .iter()
                .any(|value| value.as_str() == *expected)
        })
}

fn canonicalize_language_aliases(locale: &mut Locale) -> Result<(), InvalidLocale> {
    // CanonicalizeUnicodeLocaleId 1: prefer specific CLDR rules, then restart after replacement.
    loop {
        let language = locale.id.language.as_str();
        let specific = aliases_generated::language_aliases(language)
            .iter()
            .find(|rule| matches_language_rule(locale, rule));
        let independent = if language == "und" {
            None
        } else {
            aliases_generated::language_aliases("und")
                .iter()
                .find(|rule| matches_language_rule(locale, rule))
        };
        let (rule, independent) = match (specific, independent) {
            (Some(left), Some(right)) if right.specificity > left.specificity => (right, true),
            (Some(rule), _) => (rule, false),
            (None, Some(rule)) => (rule, true),
            (None, None) => break,
        };
        // UTS #35 replacement removes matched fields and preserves unrelated fields.
        let replacement: Locale = rule.replacement.parse().map_err(|_| InvalidLocale)?;
        let original = locale.id.clone();
        if !independent {
            locale.id.language = replacement.id.language;
        }
        if !rule.script.is_empty() || locale.id.script.is_none() {
            locale.id.script = replacement.id.script;
        }
        if !rule.region.is_empty() || locale.id.region.is_none() {
            locale.id.region = replacement.id.region;
        }
        let mut variants: Vec<_> = locale
            .id
            .variants
            .iter()
            .filter(|variant| !rule.variants.contains(&variant.as_str()))
            .copied()
            .collect();
        variants.extend(replacement.id.variants.iter().copied());
        variants.sort();
        variants.dedup();
        locale.id.variants = Variants::from_vec_unchecked(variants);
        if locale.id == original {
            break;
        }
    }
    Ok(())
}

fn alpha(value: &str) -> bool {
    value.bytes().all(|b| b.is_ascii_alphabetic())
}

fn alphanumeric(value: &str, min: usize, max: usize) -> bool {
    (min..=max).contains(&value.len()) && value.bytes().all(|b| b.is_ascii_alphanumeric())
}

fn language(value: &str) -> bool {
    matches!(value.len(), 2 | 3 | 5..=8) && alpha(value)
}

fn variant(value: &str) -> bool {
    alphanumeric(value, 5, 8) || (alphanumeric(value, 4, 4) && value.as_bytes()[0].is_ascii_digit())
}

// IsWellFormedLanguageTag 2–6 and 11.f–g: base/tlang grammar and variant uniqueness.
fn language_id(parts: &[&str], index: &mut usize) -> Result<(), InvalidLocale> {
    if !parts.get(*index).is_some_and(|part| language(part)) {
        return Err(InvalidLocale);
    }
    *index += 1;
    if parts
        .get(*index)
        .is_some_and(|part| part.len() == 4 && alpha(part))
    {
        *index += 1;
    }
    if parts.get(*index).is_some_and(|part| {
        (part.len() == 2 && alpha(part))
            || (part.len() == 3 && part.bytes().all(|b| b.is_ascii_digit()))
    }) {
        *index += 1;
    }
    let mut variants = Vec::<&str>::new();
    while let Some(part) = parts.get(*index).filter(|part| variant(part)) {
        // IsWellFormedLanguageTag 6.a / 11.g.i: duplicates are case-insensitive.
        if variants
            .iter()
            .any(|previous| previous.eq_ignore_ascii_case(part))
        {
            return Err(InvalidLocale);
        }
        variants.push(part);
        *index += 1;
    }
    Ok(())
}

fn unicode_key(value: &str) -> bool {
    alphanumeric(value, 2, 2) && value.as_bytes()[1].is_ascii_alphabetic()
}

fn transform_key(value: &str) -> bool {
    value.len() == 2
        && value.as_bytes()[0].is_ascii_alphabetic()
        && value.as_bytes()[1].is_ascii_digit()
}

fn validate(tag: &str) -> Result<(), InvalidLocale> {
    // IsWellFormedLanguageTag 1–3: ASCII case folding is built into comparisons;
    // parse Unicode locale grammar without backwards-compatibility syntax.
    let parts: Vec<_> = tag.split('-').collect();
    let mut index = 0;
    language_id(&parts, &mut index)?;
    let mut singletons = [false; 128];
    while index < parts.len() {
        let singleton = parts[index];
        if !alphanumeric(singleton, 1, 1) {
            return Err(InvalidLocale);
        }
        let singleton = singleton.as_bytes()[0].to_ascii_lowercase();
        // IsWellFormedLanguageTag 11.a: reject repeated extension singletons.
        if singletons[singleton as usize] {
            return Err(InvalidLocale);
        }
        singletons[singleton as usize] = true;
        index += 1;
        let start = index;
        match singleton {
            b'x' => {
                // IsWellFormedLanguageTag 2, 8–10: validate private use, then ignore
                // its contents for singleton and transformed-variant checks.
                if index == parts.len()
                    || !parts[index..].iter().all(|part| alphanumeric(part, 1, 8))
                {
                    return Err(InvalidLocale);
                }
                return Ok(());
            }
            b'u' => {
                while parts
                    .get(index)
                    .is_some_and(|part| alphanumeric(part, 3, 8))
                {
                    index += 1;
                }
                while parts.get(index).is_some_and(|part| unicode_key(part)) {
                    index += 1;
                    while parts
                        .get(index)
                        .is_some_and(|part| alphanumeric(part, 3, 8))
                    {
                        index += 1;
                    }
                }
            }
            b't' => {
                // IsWellFormedLanguageTag 11.b–g: optional tlang, then tfields.
                if parts.get(index).is_some_and(|part| language(part)) {
                    language_id(&parts, &mut index)?;
                }
                while parts.get(index).is_some_and(|part| transform_key(part)) {
                    index += 1;
                    let value_start = index;
                    while parts
                        .get(index)
                        .is_some_and(|part| alphanumeric(part, 3, 8))
                    {
                        index += 1;
                    }
                    if value_start == index {
                        return Err(InvalidLocale);
                    }
                }
            }
            _ => {
                while parts
                    .get(index)
                    .is_some_and(|part| alphanumeric(part, 2, 8))
                {
                    index += 1;
                }
            }
        }
        if start == index {
            return Err(InvalidLocale);
        }
    }
    // IsWellFormedLanguageTag 12: grammar and duplicate checks succeeded.
    Ok(())
}

fn canonicalize_language_id(
    canonicalizer: &LocaleCanonicalizer,
    tag: &str,
) -> Result<String, InvalidLocale> {
    let language_end = tag.find('-').unwrap_or(tag.len());
    let long_language = (language_end > 3).then(|| tag[..language_end].to_ascii_lowercase());
    // ICU4X only represents 2–3-letter languages; ECMA-402 also accepts 5–8.
    let temporary;
    let input = if long_language.is_some() {
        temporary = format!("und{}", &tag[language_end..]);
        temporary.as_str()
    } else {
        tag
    };
    let mut locale: Locale = input.parse().map_err(|_| InvalidLocale)?;
    // CanonicalizeUnicodeLocaleId 1: CLDR alias prepass preserves compound-rule order.
    canonicalize_language_aliases(&mut locale)?;
    if long_language.is_some() {
        if let Some(replacement) = locale
            .id
            .region
            .and_then(|region| aliases_generated::territory_alias(region.as_str()))
        {
            // Unregistered long languages have no likely-region entry. Do not infer
            // a region from the temporary `und` language or its script.
            locale.id.region = Some(replacement.parse().map_err(|_| InvalidLocale)?);
        }
    }
    // CanonicalizeUnicodeLocaleId 1: ICU4X supplies remaining UTS #35 case/alias processing.
    canonicalizer.canonicalize(&mut locale);
    let canonical = locale.to_string();
    if let Some(language) = long_language {
        let suffix = canonical.find('-').unwrap_or(canonical.len());
        Ok(format!("{language}{}", &canonical[suffix..]))
    } else {
        Ok(canonical)
    }
}

// ICU4X drops embedded "true" subtags; preserve ECMA-402 extension values here.
fn canonicalize_extensions(
    canonicalizer: &LocaleCanonicalizer,
    parts: &[&str],
) -> Result<String, InvalidLocale> {
    let mut extensions = Vec::new();
    let mut index = 0;
    while index < parts.len() {
        let part = parts[index];
        index += 1;
        let end = if part == "x" {
            parts.len()
        } else {
            (index..parts.len())
                .find(|&i| parts[i].len() == 1)
                .unwrap_or(parts.len())
        };
        let mut output = vec![part.to_owned()];
        if part != "u" && part != "t" {
            output.extend(parts[index..end].iter().map(|part| (*part).to_owned()));
            index = end;
            extensions.push((part, output.join("-")));
            continue;
        }
        if part == "u" {
            // CanonicalizeUnicodeLocaleId 1, 2.c–d; UnicodeExtensionComponents 8.f.i:
            // sort attributes, retaining each value once.
            let mut attributes = BTreeSet::new();
            while index < end && parts[index].len() >= 3 {
                attributes.insert(parts[index]);
                index += 1;
            }
            output.extend(attributes.into_iter().map(str::to_owned));
        } else {
            let start = index;
            while index < end && !transform_key(parts[index]) {
                index += 1;
            }
            if start != index {
                // CanonicalizeUnicodeLocaleId 1: canonicalize tlang, then lowercase it.
                output.push(
                    canonicalize_language_id(canonicalizer, &parts[start..index].join("-"))?
                        .to_ascii_lowercase(),
                );
            }
        }
        let mut keywords = BTreeMap::<&str, String>::new();
        while index < end {
            let key = parts[index];
            index += 1;
            let start = index;
            while index < end && parts[index].len() >= 3 {
                index += 1;
            }
            let value = parts[start..index].join("-");
            // UnicodeExtensionComponents 8.g.ii (via CanonicalizeUnicodeLocaleId 2.c):
            // retain the first ufield per key; UTS #35 applies the same rule to tfields.
            if keywords.contains_key(key) {
                continue;
            }
            // CanonicalizeUnicodeLocaleId 1: BCP 47 type aliases, then rg/sd subdivision aliases.
            let canonical = aliases_generated::extension_alias(part, key, &value).unwrap_or(&value);
            let canonical = if part == "u" && matches!(key, "rg" | "sd") {
                aliases_generated::subdivision_alias(canonical).unwrap_or(canonical)
            } else {
                canonical
            };
            keywords.insert(key, canonical.to_owned());
        }
        // CanonicalizeUnicodeLocaleId 2.e (u), UTS #35 (t): emit keys and nonempty values.
        // UTS #35 drops a whole Unicode "true" value; transformed values retain it.
        for (key, value) in keywords {
            output.push(key.to_owned());
            if !value.is_empty() && !(part == "u" && value == "true") {
                output.push(value);
            }
        }
        extensions.push((part, output.join("-")));
    }
    // CanonicalizeUnicodeLocaleId 1: order extensions; private use remains last.
    extensions.sort_by_key(|(singleton, _)| {
        if *singleton == "x" {
            u8::MAX
        } else {
            singleton.as_bytes()[0]
        }
    });
    Ok(extensions
        .into_iter()
        .map(|(_, value)| value)
        .collect::<Vec<_>>()
        .join("-"))
}

fn canonicalize_with(
    canonicalizer: &LocaleCanonicalizer,
    tag: &str,
) -> Result<String, InvalidLocale> {
    // CanonicalizeLocaleList 7.c.v: structural validation precedes canonicalization.
    validate(tag)?;
    // CanonicalizeLocaleList 7.c.vi / CanonicalizeUnicodeLocaleId 1–3.
    if !tag.split('-').any(|part| part.len() == 1) {
        return canonicalize_language_id(canonicalizer, tag);
    }
    let lower = tag.to_ascii_lowercase();
    let parts: Vec<_> = lower.split('-').collect();
    let extension_start = parts
        .iter()
        .position(|part| part.len() == 1)
        .unwrap_or(parts.len());
    if extension_start == parts.len() {
        return canonicalize_language_id(canonicalizer, tag);
    }
    let mut result = canonicalize_language_id(canonicalizer, &parts[..extension_start].join("-"))?;
    result.push('-');
    // CanonicalizeUnicodeLocaleId 2.g–3: replace the extension and return the tag.
    result.push_str(&canonicalize_extensions(
        canonicalizer,
        &parts[extension_start..],
    )?);
    Ok(result)
}

/// Canonicalizes one locale using baked ICU4X data.
#[cfg(feature = "compiled_data")]
pub fn canonicalize_locale(tag: &str) -> Result<String, InvalidLocale> {
    Canonicalizer::new().canonicalize_locale(tag)
}

/// Canonicalizes tags using baked ICU4X data, preserving first occurrence.
#[cfg(feature = "compiled_data")]
pub fn get_canonical_locales<S: AsRef<str>>(locales: &[S]) -> Result<Vec<String>, InvalidLocale> {
    Canonicalizer::new().get_canonical_locales(locales)
}

#[repr(C)]
pub struct FormatjsLocaleResult {
    pub data: *mut u8,
    pub len: usize,
}

/// # Safety
/// `out` must be writable; non-null `input` must point to `len` readable bytes.
#[unsafe(no_mangle)]
#[cfg(feature = "compiled_data")]
pub unsafe extern "C" fn formatjs_canonicalize_locale(
    input: *const u8,
    len: usize,
    out: *mut FormatjsLocaleResult,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(FormatjsLocaleResult {
            data: ptr::null_mut(),
            len: 0,
        })
    };
    if input.is_null() || len > isize::MAX as usize {
        return 2;
    }
    let bytes = unsafe { std::slice::from_raw_parts(input, len) };
    let Ok(tag) = std::str::from_utf8(bytes) else {
        return 2;
    };
    match std::panic::catch_unwind(|| canonicalize_locale(tag)) {
        Ok(Ok(value)) => {
            let bytes = value.into_bytes().into_boxed_slice();
            let len = bytes.len();
            let data = Box::into_raw(bytes) as *mut u8;
            unsafe { out.write(FormatjsLocaleResult { data, len }) };
            0
        }
        Ok(Err(_)) => 1,
        Err(_) => 3,
    }
}

/// # Safety
/// `result` must be an unfreed successful result returned by this library, or
/// have a null `data` pointer (as returned on error).
#[unsafe(no_mangle)]
#[cfg(feature = "compiled_data")]
pub unsafe extern "C" fn formatjs_locale_result_free(result: FormatjsLocaleResult) {
    if !result.data.is_null() {
        let bytes = ptr::slice_from_raw_parts_mut(result.data, result.len);
        unsafe { drop(Box::from_raw(bytes)) };
    }
}

#[cfg(all(test, feature = "compiled_data"))]
mod tests {
    use super::*;

    #[test]
    fn canonicalizes_aliases_and_extensions() {
        for (input, expected) in [
            ("EN-latn-us", "en-Latn-US"),
            ("iw-BU", "he-MM"),
            ("sh", "sr-Latn"),
            ("posix", "posix"),
            ("GERMAN", "german"),
            ("abcde-Latn-BU", "abcde-Latn-MM"),
            ("abcde-Armn-SU", "abcde-Armn-RU"),
            ("abcde-aaland", "abcde-AX"),
            ("abcde-GB-aaland", "abcde-GB"),
            ("en-t-GERMAN-latn-bu", "en-t-german-latn-mm"),
            ("hye-arevmda", "hyw"),
            ("ja-Latn-fonipa-hepburn-heploc", "ja-Latn-alalc97-fonipa"),
            ("en-aaland", "en-AX"),
            ("en-GB-aaland", "en-GB"),
            ("en-u-ca-islamicc", "en-u-ca-islamic-civil"),
            ("en-u-ks-primary", "en-u-ks-level1"),
            ("en-u-kn-true", "en-u-kn"),
            ("en-u-kn-yes", "en-u-kn"),
            ("en-u-xx-true-foo", "en-u-xx-true-foo"),
            ("en-u-foo-foo-ca-gregory-ca-buddhist", "en-u-foo-ca-gregory"),
            ("en-t-iw-bu-m0-names", "en-t-he-mm-m0-prprname"),
            ("en-t-m0-true", "en-t-m0-true"),
            ("en-t-m0-true-foo", "en-t-m0-true-foo"),
            ("en-t-m0-ungegn-m0-alaloc", "en-t-m0-ungegn"),
            ("en-u-sd-cn11", "en-u-sd-cnbj"),
            ("und-u-rg-no23", "und-u-rg-no50"),
            ("und-u-rg-lud", "und-u-rg-lucl"),
            ("und-u-rg-fi01", "und-u-rg-axzzzz"),
            ("en-b-FOO-a-BAR-x-PRIVATE", "en-a-bar-b-foo-x-private"),
        ] {
            assert_eq!(
                canonicalize_locale(input),
                Ok(expected.to_owned()),
                "{input}"
            );
        }
    }

    #[test]
    fn rejects_invalid_ecma402_tags() {
        for input in [
            "",
            "root",
            "en_US",
            "abcd",
            "x-private",
            "i-klingon",
            "en-a",
            "en-u",
            "en-t",
            "en-t-m0",
            "en-u-00-foo",
            "en-abc",
            "en-1901-1901",
            "de-1901-1901",
            "en-t-de-1901-1901",
            "en-a-foo-A-bar",
            "en-u-ca-gregory-U-nu-latn",
            "en--US",
            "en-x",
            "en-u-ca-123456789",
            "en-\u{00e9}a",
        ] {
            assert_eq!(canonicalize_locale(input), Err(InvalidLocale), "{input}");
        }
    }

    #[test]
    fn removes_duplicates_after_canonicalization() {
        assert_eq!(
            get_canonical_locales(&["iw", "fr", "he", "FR", "en"]),
            Ok(vec!["he".to_owned(), "fr".to_owned(), "en".to_owned()])
        );
        assert_eq!(get_canonical_locales::<&str>(&[]), Ok(vec![]));
    }

    #[test]
    fn ffi_owns_output_and_reports_errors() {
        unsafe {
            let mut result = FormatjsLocaleResult {
                data: ptr::null_mut(),
                len: 0,
            };
            assert_eq!(
                formatjs_canonicalize_locale(b"iw".as_ptr(), 2, &mut result),
                0
            );
            assert_eq!(std::slice::from_raw_parts(result.data, result.len), b"he");
            formatjs_locale_result_free(result);
            let mut result = FormatjsLocaleResult {
                data: ptr::null_mut(),
                len: 0,
            };
            assert_eq!(
                formatjs_canonicalize_locale(b"bad_tag".as_ptr(), 7, &mut result),
                1
            );
            assert!(result.data.is_null());
            assert_eq!(
                formatjs_canonicalize_locale([0xff].as_ptr(), 1, &mut result),
                2
            );
            assert_eq!(formatjs_canonicalize_locale(ptr::null(), 0, &mut result), 2);
            assert_eq!(
                formatjs_canonicalize_locale(b"en".as_ptr(), 2, ptr::null_mut()),
                2
            );
        }
    }
}

#[cfg(test)]
mod provider_tests;

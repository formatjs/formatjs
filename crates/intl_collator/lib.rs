//! ECMA-402 Collator records. Rust owns locale resolution and comparisons;
//! host adapters supply observable coercions, brands and the cached bound function.
use formatjs_intl_locale::{Locale, LocaleOptions, matcher};
use icu_locale_core::LanguageIdentifier;
use serde::{Deserialize, Serialize};
use std::{collections::BTreeSet, sync::Arc};
mod compare;
mod data;
pub mod ffi;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Error {
    InvalidLocale,
    InvalidOption(String),
    InvalidData(String),
}
impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{self:?}")
    }
}
impl std::error::Error for Error {}
#[derive(Debug, Clone, Copy, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Usage {
    #[default]
    Sort,
    Search,
}
#[derive(Debug, Clone, Copy, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Sensitivity {
    Base,
    Accent,
    Case,
    #[default]
    Variant,
}
#[derive(Debug, Clone, Copy, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum CaseFirst {
    Upper,
    Lower,
    #[default]
    False,
}
#[derive(Debug, Clone, Copy, Default, Deserialize, Serialize, PartialEq, Eq)]
pub enum LocaleMatcher {
    #[serde(rename = "best fit")]
    #[default]
    BestFit,
    #[serde(rename = "lookup")]
    Lookup,
}
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Options {
    pub usage: Usage,
    pub locale_matcher: LocaleMatcher,
    pub collation: Option<String>,
    pub numeric: Option<bool>,
    pub case_first: Option<CaseFirst>,
    pub sensitivity: Option<Sensitivity>,
    pub ignore_punctuation: Option<bool>,
}
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedOptions {
    pub locale: String,
    pub usage: Usage,
    pub sensitivity: Sensitivity,
    pub ignore_punctuation: bool,
    pub collation: String,
    pub numeric: bool,
    pub case_first: CaseFirst,
}
pub struct Collator {
    resolved: ResolvedOptions,
    language: LanguageIdentifier,
    data: &'static data::Data,
    tailoring: Arc<Vec<compare::Entry>>,
}
pub fn available_locales() -> Result<&'static [String], Error> {
    Ok(&data::load()?.available)
}
pub fn supported_locales(requested: &[String]) -> Result<Vec<String>, Error> {
    let requested = formatjs_intl_getcanonicallocales::get_canonical_locales(requested)
        .map_err(|_| Error::InvalidLocale)?;
    Ok(matcher::supported(available_locales()?, &requested))
}
fn case_name(value: CaseFirst) -> &'static str {
    match value {
        CaseFirst::Upper => "upper",
        CaseFirst::Lower => "lower",
        CaseFirst::False => "false",
    }
}
fn canonical_collation(value: &str) -> Result<String, Error> {
    let locale = Locale::new(
        "und",
        &LocaleOptions {
            collation: Some(value.into()),
            ..Default::default()
        },
    )
    .map_err(|_| Error::InvalidOption("collation".into()))?;
    Ok(locale.keyword("co").unwrap_or("").to_owned())
}
impl Collator {
    pub fn new(requested: &[String], options: &Options) -> Result<Self, Error> {
        // InitializeCollator: canonical list, usage, matcher, co/kn/kf options;
        // search has only the default collation even when sort co was requested.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/collator.html#L21-L42
        let requested = formatjs_intl_getcanonicallocales::get_canonical_locales(requested)
            .map_err(|_| Error::InvalidLocale)?;
        let collation = options
            .collation
            .as_deref()
            .map(canonical_collation)
            .transpose()?;
        let data = data::load()?;
        let matched = match options.locale_matcher {
            LocaleMatcher::Lookup => requested.iter().enumerate().find_map(|(index, tag)| {
                matcher::lookup(&data.available, std::slice::from_ref(tag))
                    .map(|locale| (index, locale))
            }),
            LocaleMatcher::BestFit => matcher::best_fit_requested(&data.available, &requested)
                .map_err(|_| Error::InvalidLocale)?,
        };
        let (index, data_locale) = matched
            .map(|(index, locale)| (Some(index), locale))
            .unwrap_or((None, "en".into()));
        let request = index
            .map(|mut index| {
                if options.locale_matcher == LocaleMatcher::BestFit {
                    // Keep the first matching request's Unicode
                    // extension when multiple requests share a base tag.
                    let base = matcher::without_unicode_extension(&requested[index]);
                    index = requested
                        .iter()
                        .position(|tag| matcher::without_unicode_extension(tag) == base)
                        .unwrap_or(index);
                }
                Locale::new(&requested[index], &Default::default())
                    .map_err(|_| Error::InvalidLocale)
            })
            .transpose()?;
        let metadata = data
            .locales
            .get(&data_locale)
            .ok_or_else(|| Error::InvalidData(data_locale.clone()))?;
        // ResolveLocale checks requested keywords, then supported option overrides.
        // Only extensions that actually contributed remain in the locale string.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L248-L284
        let mut keywords = Vec::new();
        let mut resolved_values = Vec::new();
        let numeric = options
            .numeric
            .map(|value| if value { "true" } else { "false" }.to_owned());
        let first = options.case_first.map(|value| case_name(value).to_owned());
        let search = vec!["default".to_owned()];
        // CLDR's default tailoring (for example Arabic compat) stays internal.
        // ECMA-402's default co slot is null, exposed as "default".
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/collator.html#L95-L98
        let sort: Vec<String> = std::iter::once("default".to_owned())
            .chain(
                metadata
                    .co
                    .iter()
                    .filter(|value| *value != "default")
                    .cloned(),
            )
            .collect();
        for (key, values, option) in [
            (
                "co",
                if options.usage == Usage::Search {
                    &search
                } else {
                    &sort
                },
                collation.as_deref(),
            ),
            ("kn", &metadata.kn, numeric.as_deref()),
            ("kf", &metadata.kf, first.as_deref()),
        ] {
            let mut value = values
                .first()
                .ok_or_else(|| Error::InvalidData(format!("empty {key} metadata")))?
                .as_str();
            let mut extension = false;
            if let Some(requested) = request.as_ref().and_then(|locale| locale.keyword(key)) {
                let requested = if requested.is_empty() {
                    "true"
                } else {
                    requested
                };
                // "default" encodes the null co default in generated data;
                // it is not an advertised Unicode extension value.
                // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/collator.html#L95-L98
                if !(key == "co" && requested == "default")
                    && values.iter().any(|value| value == requested)
                {
                    value = requested;
                    extension = true;
                }
            }
            if let Some(option) = option {
                if option != value && values.iter().any(|value| value == option) {
                    value = option;
                    extension = false;
                }
            }
            if extension {
                keywords.push((key, value.to_owned()));
            }
            resolved_values.push(value.to_owned());
        }
        let mut locale = data_locale.clone();
        if !keywords.is_empty() {
            locale.push_str("-u");
            for (key, value) in keywords {
                locale.push('-');
                locale.push_str(key);
                if value != "true" {
                    locale.push('-');
                    locale.push_str(&value);
                }
            }
            locale = formatjs_intl_getcanonicallocales::canonicalize_locale(&locale)
                .map_err(|_| Error::InvalidLocale)?;
        }
        let sensitivity = options
            .sensitivity
            .unwrap_or(if options.usage == Usage::Sort {
                Sensitivity::Variant
            } else {
                metadata.sensitivity
            });
        let resolved = ResolvedOptions {
            locale,
            usage: options.usage,
            sensitivity,
            ignore_punctuation: options
                .ignore_punctuation
                .unwrap_or(metadata.ignore_punctuation),
            collation: resolved_values[0].clone(),
            numeric: resolved_values[1] == "true",
            case_first: match resolved_values[2].as_str() {
                "upper" => CaseFirst::Upper,
                "lower" => CaseFirst::Lower,
                _ => CaseFirst::False,
            },
        };
        // The comparison profile uses CLDR's defaultCollation while the ECMA slot
        // still reports "default". Search selects independent LDML rules.
        // https://www.unicode.org/reports/tr35/tr35-collation.html#Collation_Type_Fallback
        let comparison_type = if options.usage == Usage::Search {
            "search"
        } else if resolved.collation == "default" {
            metadata.default_collation.as_deref().unwrap_or("default")
        } else {
            &resolved.collation
        };
        let tailoring =
            compare::tailoring(data, &data_locale, comparison_type, &mut BTreeSet::new());
        let language = data_locale.parse().map_err(|_| Error::InvalidLocale)?;
        Ok(Self {
            resolved,
            language,
            data,
            tailoring,
        })
    }
    pub fn resolved_options(&self) -> ResolvedOptions {
        self.resolved.clone()
    }
    pub fn compare(&self, left: &[u16], right: &[u16]) -> i8 {
        compare::compare(self, left, right)
    }
}

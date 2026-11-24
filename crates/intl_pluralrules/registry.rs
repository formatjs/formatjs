//! Per-runtime locale registration. Loading a pack never changes existing
//! instances or fetches another locale implicitly.

#[cfg(feature = "compiled_data")]
use formatjs_intl_data::Compiled;
use formatjs_intl_data::Data;

use crate::{
    Error, LocaleRules,
    instance::{Options, PluralRules},
};
use std::collections::{BTreeMap, BTreeSet};
use std::sync::Arc;

#[derive(Default)]
// ECMA-402 §17.2.3: locale matching uses registered rules and no Unicode keys.
// https://tc39.es/ecma402/#sec-intl.pluralrules-internal-slots
pub struct Registry {
    data: BTreeMap<String, Data<LocaleRules>>,
    explicit: BTreeSet<String>,
    available: formatjs_intl_locale::matcher::AvailableLocales,
    default: Option<String>,
}

impl Registry {
    pub(crate) fn initial() -> Self {
        #[cfg(feature = "compiled_data")]
        {
            Self::with_compiled_data()
        }
        #[cfg(not(feature = "compiled_data"))]
        {
            Self::default()
        }
    }

    /// Canonical requested tags come from the host's CanonicalizeLocaleList.
    pub fn negotiate(&self, requested: &[String], lookup: bool) -> Result<String, Error> {
        let matched = if lookup {
            formatjs_intl_locale::matcher::lookup(self.available.as_slice(), requested)
        } else {
            self.available
                .best_fit(requested)
                .map_err(|_| Error::InvalidOption("locales"))?
                .or_else(|| {
                    formatjs_intl_locale::matcher::lookup(self.available.as_slice(), requested)
                })
        };
        matched
            .or_else(|| formatjs_intl_locale::matcher::host_default(self.available.as_slice()))
            .or_else(|| self.default.clone())
            .ok_or(Error::MissingLocale)
    }

    /// Inputs are canonical tags from CanonicalizeLocaleList.
    pub fn supported_locales(&self, requested: &[String]) -> Vec<String> {
        formatjs_intl_locale::matcher::supported(self.available.as_slice(), requested)
    }

    fn insert(&mut self, tag: String, rules: Data<LocaleRules>, replace: bool) {
        let exists = self.data.contains_key(&tag);
        if !exists {
            self.available.push_service_locale(tag.clone());
        }
        if replace || !exists {
            self.data.insert(tag, rules);
        }
    }

    pub fn add_locale_data(&mut self, json: &str) -> Result<(), Error> {
        self.add_data(LocaleRules::from_json(json)?)
    }

    pub fn add_data(&mut self, data: LocaleRules) -> Result<(), Error> {
        let locale = data.locale().to_owned();
        let aliases = data.aliases.clone();
        self.register(locale, aliases, Data::Owned(Arc::new(data)));
        Ok(())
    }

    #[cfg(feature = "compiled_data")]
    pub fn with_compiled_data() -> Self {
        let mut registry = Self::default();
        crate::compiled_data::initialize(&mut registry);
        registry
    }

    #[cfg(feature = "compiled_data")]
    pub(crate) fn add_compiled(
        &mut self,
        locale: &str,
        aliases: &[&str],
        data: &'static Compiled<LocaleRules>,
    ) {
        self.register(
            locale.into(),
            aliases.iter().map(|tag| (*tag).into()).collect(),
            Data::compiled(data),
        );
    }

    fn register(&mut self, locale: String, aliases: Vec<String>, rules: Data<LocaleRules>) {
        if !self.explicit.insert(locale.clone()) {
            formatjs_intl_data::refresh_locale_data(&mut self.data, &locale, &rules);
        }
        let tags: Vec<_> = std::iter::once(locale.clone()).chain(aliases).collect();
        for tag in &tags {
            let replace = tag == &locale || !self.explicit.contains(tag);
            self.insert(tag.clone(), rules.clone(), replace);
        }
        // AvailableLocales includes parent and scriptless language-region tags.
        // Fill missing fallbacks; never overwrite an explicitly loaded payload.
        // https://tc39.es/ecma402/#sec-internal-slots
        for tag in tags {
            let selected = self.data[&tag].clone();
            let mut parts: Vec<_> = tag.split('-').collect();
            while parts.len() > 1 {
                if parts.len() > 2 && parts[1].len() == 4 {
                    let scriptless = std::iter::once(parts[0])
                        .chain(parts[2..].iter().copied())
                        .collect::<Vec<_>>()
                        .join("-");
                    let replace = !self.explicit.contains(&scriptless)
                        && formatjs_intl_locale::matcher::is_likely_script(&scriptless, parts[1]);
                    self.insert(scriptless, selected.clone(), replace);
                }
                parts.pop();
                self.insert(parts.join("-"), selected.clone(), false);
            }
        }
        if self.default.is_none() {
            self.default = Some(locale);
        }
    }

    /// Canonical tags, in registration order. Locale matching uses this snapshot.
    pub fn available_locales(&self) -> &[String] {
        self.available.as_slice()
    }

    pub fn default_locale(&self) -> Option<&str> {
        self.default.as_deref()
    }

    /// `locale` is the already negotiated AvailableLocales entry. No implicit
    /// fallback here: lookup/best-fit matching belongs before instance creation.
    pub fn create(&self, locale: &str, options: &Options) -> Result<PluralRules, Error> {
        let rules = self
            .data
            .get(self.available.data_locale(locale))
            .ok_or(Error::MissingLocale)?
            .get()
            .map_err(Error::InvalidData)?;
        PluralRules::with_locale(rules, locale.to_owned(), options)
    }
}

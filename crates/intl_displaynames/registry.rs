//! Per-runtime locale registration. Loading a pack never changes existing
//! instances or fetches another locale implicitly.

use crate::{DisplayNames, Error, LocaleNames, Options};
use std::collections::{BTreeMap, BTreeSet};
use std::sync::Arc;

#[derive(Default)]
pub struct Registry {
    data: BTreeMap<String, Arc<LocaleNames>>,
    explicit: BTreeSet<String>,
    available: Vec<String>,
    default: Option<String>,
}

impl Registry {
    /// Canonical requested tags come from the host's CanonicalizeLocaleList.
    pub fn negotiate(&self, requested: &[String], lookup: bool) -> Result<String, Error> {
        let matched = if lookup {
            formatjs_intl_locale::matcher::lookup(&self.available, requested)
        } else {
            formatjs_intl_locale::matcher::best_fit(&self.available, requested)
                .map_err(|_| Error::InvalidOption("locales"))?
        };
        matched
            .or_else(|| self.default.clone())
            .ok_or(Error::MissingLocale)
    }

    /// Inputs are canonical tags from CanonicalizeLocaleList.
    pub fn supported_locales(&self, requested: &[String]) -> Vec<String> {
        formatjs_intl_locale::matcher::supported(&self.available, requested)
    }

    fn insert(&mut self, tag: String, rules: Arc<LocaleNames>, replace: bool) {
        let exists = self.data.contains_key(&tag);
        if !exists {
            self.available.push(tag.clone());
        }
        if replace || !exists {
            self.data.insert(tag, rules);
        }
    }

    pub fn add_locale_data(&mut self, json: &str) -> Result<(), Error> {
        // Validate the complete pack before changing availability or defaults.
        let rules = Arc::new(LocaleNames::from_json(json)?);
        let locale = rules.locale().to_owned();
        self.explicit.insert(locale.clone());
        let tags: Vec<_> = std::iter::once(locale.clone())
            .chain(rules.aliases.iter().cloned())
            .collect();
        for tag in &tags {
            let replace = tag == &locale || !self.explicit.contains(tag);
            self.insert(tag.clone(), rules.clone(), replace);
        }
        // AvailableLocales includes parent and scriptless language-region tags.
        // Fill missing fallbacks; never overwrite an explicitly loaded payload.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L18-L26
        for tag in tags {
            let selected = self.data[&tag].clone();
            let mut parts: Vec<_> = tag.split('-').collect();
            while parts.len() > 1 {
                if parts.len() > 2 && parts[1].len() == 4 {
                    let scriptless = std::iter::once(parts[0])
                        .chain(parts[2..].iter().copied())
                        .collect::<Vec<_>>()
                        .join("-");
                    self.insert(scriptless, selected.clone(), false);
                }
                parts.pop();
                self.insert(parts.join("-"), selected.clone(), false);
            }
        }
        if self.default.is_none() {
            self.default = Some(locale);
        }
        Ok(())
    }

    /// Canonical tags, in registration order. Locale matching uses this snapshot.
    pub fn available_locales(&self) -> &[String] {
        &self.available
    }

    pub fn default_locale(&self) -> Option<&str> {
        self.default.as_deref()
    }

    /// `locale` is the already negotiated AvailableLocales entry. No implicit
    /// fallback here: lookup/best-fit matching belongs before instance creation.
    pub fn create(&self, locale: &str, options: &Options) -> Result<DisplayNames, Error> {
        let rules = self.data.get(locale).ok_or(Error::MissingLocale)?.clone();
        Ok(DisplayNames {
            data: rules,
            locale: locale.to_owned(),
            options: options.clone(),
        })
    }
}

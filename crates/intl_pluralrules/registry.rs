//! Per-runtime locale registration. Loading a pack never changes existing
//! instances or fetches another locale implicitly.

use crate::{
    Error, LocaleRules,
    instance::{Options, PluralRules},
};
use std::collections::{BTreeMap, BTreeSet};
use std::sync::Arc;

#[derive(Default)]
pub struct Registry {
    data: BTreeMap<String, Arc<LocaleRules>>,
    explicit: BTreeSet<String>,
    available: Vec<String>,
    default: Option<String>,
}

impl Registry {
    fn insert(&mut self, tag: String, rules: Arc<LocaleRules>, replace: bool) {
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
        let rules = Arc::new(LocaleRules::from_json(json)?);
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
    pub fn create(&self, locale: &str, options: &Options) -> Result<PluralRules, Error> {
        let rules = self.data.get(locale).ok_or(Error::MissingLocale)?.clone();
        PluralRules::with_locale(rules, locale.to_owned(), options)
    }
}

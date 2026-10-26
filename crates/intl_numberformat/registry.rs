use crate::{Error, LocaleData};
use std::collections::{BTreeMap, BTreeSet};
use std::sync::Arc;

#[derive(Default)]
pub struct Registry {
    data: BTreeMap<String, Arc<LocaleData>>,
    explicit: BTreeSet<String>,
    available: Vec<String>,
    default: Option<String>,
}

impl Registry {
    fn insert(&mut self, tag: String, data: Arc<LocaleData>, replace: bool) {
        if !self.data.contains_key(&tag) {
            self.available.push(tag.clone());
        }
        if replace || !self.data.contains_key(&tag) {
            self.data.insert(tag, data);
        }
    }

    pub fn add_locale_data(&mut self, json: &str) -> Result<(), Error> {
        let data = Arc::new(LocaleData::from_json(json)?);
        let locale = data.locale.clone();
        let tags: Vec<_> = std::iter::once(locale.clone())
            .chain(data.aliases.iter().cloned())
            .collect();
        self.explicit.insert(locale.clone());
        for tag in &tags {
            self.insert(
                tag.clone(),
                data.clone(),
                tag == &locale || !self.explicit.contains(tag),
            );
        }
        // Match TS AvailableLocales without replacing explicitly loaded parents.
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

    pub fn negotiate(&self, requested: &[String], lookup: bool) -> Result<String, Error> {
        let matched = if lookup {
            formatjs_intl_locale::matcher::lookup(&self.available, requested)
        } else {
            formatjs_intl_locale::matcher::best_fit(&self.available, requested)
                .map_err(|_| Error::InvalidLocale)?
        };
        matched
            .or_else(|| self.default.clone())
            .ok_or(Error::MissingLocale)
    }

    pub fn supported_locales(&self, requested: &[String]) -> Vec<String> {
        formatjs_intl_locale::matcher::supported(&self.available, requested)
    }
    pub fn available_locales(&self) -> &[String] {
        &self.available
    }
    pub fn default_locale(&self) -> Option<&str> {
        self.default.as_deref()
    }
    pub fn get(&self, locale: &str) -> Result<Arc<LocaleData>, Error> {
        self.data.get(locale).cloned().ok_or(Error::MissingLocale)
    }
    pub fn add_unit_data(&self, locale: &str, json: &str) -> Result<(), Error> {
        self.get(locale)?.add_unit_data(json)
    }
}

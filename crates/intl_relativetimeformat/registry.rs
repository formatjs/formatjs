use crate::{Error, LocaleData, Options, RelativeTimeFormat, Resolution, choice};
use formatjs_intl_locale::{Locale, LocaleOptions, matcher};
use std::{
    collections::{BTreeMap, BTreeSet},
    sync::Arc,
};
#[derive(Default)]
pub struct Registry {
    data: BTreeMap<String, Arc<LocaleData>>,
    explicit: BTreeSet<String>,
    available: Vec<String>,
    default: Option<String>,
}
impl Registry {
    pub fn resolve(&self, requested: &[String], options: &Options) -> Result<Resolution, Error> {
        let requested = formatjs_intl_getcanonicallocales::get_canonical_locales(requested)
            .map_err(|_| Error::InvalidLocale)?;
        let lookup = choice(
            options.locale_matcher.as_deref(),
            "best fit",
            &["lookup", "best fit"],
            "localeMatcher",
        )? == "lookup";
        let option = options
            .numbering_system
            .as_deref()
            .map(|value| {
                Locale::new(
                    "und",
                    &LocaleOptions {
                        numbering_system: Some(value.into()),
                        ..Default::default()
                    },
                )
                .map_err(|_| Error::InvalidOption("numberingSystem"))
                .map(|locale| locale.keyword("nu").unwrap_or("").to_owned())
            })
            .transpose()?;
        let matched = if lookup {
            requested.iter().enumerate().find_map(|(index, tag)| {
                matcher::lookup(&self.available, std::slice::from_ref(tag))
                    .map(|locale| (index, locale))
            })
        } else {
            matcher::best_fit_requested(&self.available, &requested)
                .map_err(|_| Error::InvalidLocale)?
        };
        let (index, data_locale) = matched
            .map(|(index, locale)| (Some(index), locale))
            .or_else(|| self.default.clone().map(|locale| (None, locale)))
            .ok_or(Error::MissingLocale)?;
        let data = self.get(&data_locale)?;
        let mut numbering_system = data.nu[0].clone();
        let mut extension = false;
        if let Some(index) = index {
            let index = if lookup {
                index
            } else {
                let base = matcher::without_unicode_extension(&requested[index]);
                requested
                    .iter()
                    .rposition(|tag| matcher::without_unicode_extension(tag) == base)
                    .unwrap_or(index)
            };
            let locale = Locale::new(&requested[index], &Default::default())
                .map_err(|_| Error::InvalidLocale)?;
            if let Some(requested) = locale.keyword("nu") {
                if data.nu.iter().any(|system| system == requested) {
                    numbering_system = requested.into();
                    extension = true;
                }
            }
        }
        if let Some(option) = option {
            if option != numbering_system && data.nu.contains(&option) {
                numbering_system = option;
                extension = false;
            }
        }
        let locale = if extension {
            format!("{data_locale}-u-nu-{numbering_system}")
        } else {
            data_locale.clone()
        };
        Ok(Resolution {
            locale,
            data_locale,
            numbering_system,
        })
    }
    pub fn create(
        &self,
        requested: &[String],
        options: &Options,
    ) -> Result<RelativeTimeFormat, Error> {
        let resolution = self.resolve(requested, options)?;
        self.create_resolved(&resolution, options)
    }
    pub fn create_resolved(
        &self,
        resolution: &Resolution,
        options: &Options,
    ) -> Result<RelativeTimeFormat, Error> {
        // TS reads fields after style/numeric getters, so fetch the current record
        // using the already resolved data locale instead of retaining an early snapshot.
        RelativeTimeFormat::new(self.get(&resolution.data_locale)?, resolution, options)
    }
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

    pub fn supported_locales(&self, requested: &[String]) -> Vec<String> {
        matcher::supported(&self.available, requested)
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
}

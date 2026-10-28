use crate::{Error, LocaleData};
#[cfg(feature = "compiled_data")]
use formatjs_intl_data::Compiled;
use formatjs_intl_data::Data;
use std::collections::{BTreeMap, BTreeSet};
use std::sync::Arc;

#[derive(Default)]
pub struct Registry {
    data: BTreeMap<String, Data<LocaleData>>,
    explicit: BTreeSet<String>,
    available: Vec<String>,
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

    pub fn create(
        &self,
        requested: &[String],
        options: &crate::Options,
    ) -> Result<crate::NumberFormat, Error> {
        use formatjs_intl_locale::matcher;
        let requested = formatjs_intl_getcanonicallocales::get_canonical_locales(requested)
            .map_err(|_| Error::InvalidLocale)?;
        let lookup = crate::options::choice(
            options.locale_matcher.as_deref(),
            "best fit",
            &["lookup", "best fit"],
            "localeMatcher",
        )? == "lookup";
        let matched = if lookup {
            requested.iter().enumerate().find_map(|(index, tag)| {
                matcher::lookup(&self.available, std::slice::from_ref(tag))
                    .map(|locale| (index, locale))
            })
        } else {
            matcher::best_fit_requested(&self.available, &requested)
                .map_err(|_| Error::InvalidLocale)?
        };
        let (index, locale) = matched
            .map(|(index, locale)| (Some(index), locale))
            .or_else(|| self.default.clone().map(|locale| (None, locale)))
            .ok_or(Error::MissingLocale)?;
        let request = index.map(|index| {
            let index = if lookup {
                index
            } else {
                let base = matcher::without_unicode_extension(&requested[index]);
                requested
                    .iter()
                    .rposition(|tag| matcher::without_unicode_extension(tag) == base)
                    .unwrap_or(index)
            };
            requested[index].as_str()
        });
        crate::NumberFormat::new(self.get(&locale)?, locale, request, options)
    }
    fn insert(&mut self, tag: String, data: Data<LocaleData>, replace: bool) {
        if !self.data.contains_key(&tag) {
            self.available.push(tag.clone());
        }
        if replace || !self.data.contains_key(&tag) {
            self.data.insert(tag, data);
        }
    }

    pub fn add_locale_data(&mut self, json: &str) -> Result<(), Error> {
        self.add_data(LocaleData::from_json(json)?)
    }

    pub fn add_data(&mut self, data: LocaleData) -> Result<(), Error> {
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
        data: &'static Compiled<LocaleData>,
    ) {
        self.register(
            locale.into(),
            aliases.iter().map(|tag| (*tag).into()).collect(),
            Data::compiled(data),
        );
    }

    fn register(&mut self, locale: String, aliases: Vec<String>, data: Data<LocaleData>) {
        let tags: Vec<_> = std::iter::once(locale.clone()).chain(aliases).collect();
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
        self.data
            .get(locale)
            .ok_or(Error::MissingLocale)?
            .get()
            .map_err(Error::InvalidData)
    }
    pub fn add_unit_data(&self, locale: &str, json: &str) -> Result<(), Error> {
        self.get(locale)?.add_unit_data(json)
    }
}

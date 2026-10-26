use crate::{
    Error,
    calendar::{CalendarProvider, CalendarRegistry},
    data::{CalendarPatch, HourCycle, LocaleData, RawLocale},
};
use formatjs_intl_getcanonicallocales::get_canonical_locales;
use formatjs_intl_locale::{Locale, LocaleOptions, matcher};
use serde::{Deserialize, Serialize};
use std::{
    collections::{BTreeMap, BTreeSet},
    sync::{Arc, OnceLock},
};

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct ResolutionOptions {
    pub locale_matcher: Option<String>,
    pub calendar: Option<String>,
    pub numbering_system: Option<String>,
    pub hour_cycle: Option<String>,
    pub hour12: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Resolution {
    pub locale: String,
    pub data_locale: String,
    pub calendar: String,
    pub numbering_system: String,
    pub hour_cycle: Option<HourCycle>,
}

#[derive(Default)]
pub struct Registry {
    raw: BTreeMap<String, Arc<RawLocale>>,
    patches: BTreeMap<String, Vec<Arc<CalendarPatch>>>,
    processed: BTreeMap<String, Arc<LocaleData>>,
    data: BTreeMap<String, Arc<LocaleData>>,
    explicit: BTreeSet<String>,
    available: Vec<String>,
    default: Option<String>,
    providers: CalendarRegistry,
}

fn aliases() -> &'static BTreeMap<String, Vec<String>> {
    static ALIASES: OnceLock<BTreeMap<String, Vec<String>>> = OnceLock::new();
    ALIASES.get_or_init(|| {
        serde_json::from_str(include_str!(env!("FORMATJS_DATETIME_LOCALE_ALIASES")))
            .expect("generated default-content locales")
    })
}

fn lookup_matcher(value: Option<&str>) -> Result<bool, Error> {
    match value {
        None | Some("best fit") => Ok(false),
        Some("lookup") => Ok(true),
        _ => Err(Error::InvalidOption("localeMatcher")),
    }
}

fn cycle(value: &str) -> Result<HourCycle, Error> {
    match value {
        "h11" => Ok(HourCycle::H11),
        "h12" => Ok(HourCycle::H12),
        "h23" => Ok(HourCycle::H23),
        "h24" => Ok(HourCycle::H24),
        _ => Err(Error::InvalidOption("hourCycle")),
    }
}

fn cycle_name(value: HourCycle) -> &'static str {
    match value {
        HourCycle::H11 => "h11",
        HourCycle::H12 => "h12",
        HourCycle::H23 => "h23",
        HourCycle::H24 => "h24",
    }
}

fn normalized(value: Option<&str>, calendar: bool) -> Result<Option<String>, Error> {
    value
        .map(|value| {
            let options = if calendar {
                LocaleOptions {
                    calendar: Some(value.into()),
                    ..Default::default()
                }
            } else {
                LocaleOptions {
                    numbering_system: Some(value.into()),
                    ..Default::default()
                }
            };
            let locale = Locale::new("und", &options).map_err(|_| {
                Error::InvalidOption(if calendar {
                    "calendar"
                } else {
                    "numberingSystem"
                })
            })?;
            let value = locale
                .keyword(if calendar { "ca" } else { "nu" })
                .unwrap_or("");
            Ok(if value.is_empty() {
                "true".into()
            } else {
                value.into()
            })
        })
        .transpose()
}

fn keyword(
    supported: &[String],
    requested: Option<&str>,
    option: Option<&str>,
) -> Result<(String, bool), Error> {
    let mut value = supported.first().cloned().ok_or(Error::InvalidLocaleData)?;
    let mut retained = false;
    if let Some(requested) = requested {
        let requested = if requested.is_empty() {
            "true"
        } else {
            requested
        };
        if supported.iter().any(|value| value == requested) {
            value = requested.into();
            retained = true;
        }
    }
    if let Some(option) = option {
        if option != value && supported.iter().any(|value| value == option) {
            value = option.into();
            retained = false;
        }
    }
    Ok((value, retained))
}

impl Registry {
    fn prepare(raw: &RawLocale, patches: &[Arc<CalendarPatch>]) -> Result<Arc<LocaleData>, Error> {
        let mut raw = raw.clone();
        for patch in patches {
            raw.apply(patch);
        }
        Ok(Arc::new(LocaleData::from_raw(raw)?))
    }

    fn insert(&mut self, tag: String, data: Arc<LocaleData>, replace: bool) {
        if !self.data.contains_key(&tag) {
            self.available.push(tag.clone());
        }
        if replace || !self.data.contains_key(&tag) {
            self.data.insert(tag, data);
        }
    }

    fn publish(&mut self, locale: &str, data: Arc<LocaleData>) {
        // Reload inferred parents only while they still share the previous record.
        if let Some(previous) = self.processed.get(locale) {
            for value in self.data.values_mut() {
                if Arc::ptr_eq(value, previous) {
                    *value = data.clone();
                }
            }
        }
        self.processed.insert(locale.into(), data.clone());
        self.explicit.insert(locale.into());
        let tags: Vec<_> = std::iter::once(locale.to_owned())
            .chain(aliases().get(locale).into_iter().flatten().cloned())
            .collect();
        for tag in &tags {
            self.insert(
                tag.clone(),
                data.clone(),
                tag == locale || !self.explicit.contains(tag),
            );
        }
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
            self.default = Some(locale.into());
        }
    }

    pub fn add_locale_data(&mut self, json: &str) -> Result<(), Error> {
        let raw: RawLocale = serde_json::from_str(json).map_err(|_| Error::InvalidLocaleData)?;
        let data = Self::prepare(
            &raw,
            self.patches
                .get(&raw.locale)
                .map(Vec::as_slice)
                .unwrap_or(&[]),
        )?;
        let locale = raw.locale.clone();
        self.raw.insert(locale.clone(), Arc::new(raw));
        self.publish(&locale, data);
        Ok(())
    }

    pub fn add_calendar_locale_data(&mut self, json: &str) -> Result<(), Error> {
        let patch: CalendarPatch =
            serde_json::from_str(json).map_err(|_| Error::InvalidLocaleData)?;
        let locale = patch.locale.clone();
        let mut patches = self.patches.get(&locale).cloned().unwrap_or_default();
        if let Some(previous) = patches
            .iter_mut()
            .find(|previous| previous.calendar == patch.calendar)
        {
            *previous = Arc::new(patch);
        } else {
            patches.push(Arc::new(patch));
        }
        let data = self
            .raw
            .get(&locale)
            .map(|raw| Self::prepare(raw, &patches))
            .transpose()?;
        self.patches.insert(locale.clone(), patches);
        if let Some(data) = data {
            self.publish(&locale, data);
        }
        Ok(())
    }

    pub fn register_calendar(&mut self, calendar: String, provider: Arc<dyn CalendarProvider>) {
        self.providers.register(calendar, provider);
    }

    pub(crate) fn replace_calendar(
        &mut self,
        calendar: String,
        provider: Arc<dyn CalendarProvider>,
    ) -> Option<Arc<dyn CalendarProvider>> {
        self.providers.replace(calendar, provider)
    }

    pub fn calendar_provider(&self, calendar: &str) -> Result<Arc<dyn CalendarProvider>, Error> {
        self.providers.provider(calendar)
    }

    pub fn get(&self, locale: &str) -> Result<Arc<LocaleData>, Error> {
        self.data.get(locale).cloned().ok_or(Error::MissingLocale)
    }

    pub fn available_locales(&self) -> &[String] {
        &self.available
    }
    pub fn default_locale(&self) -> Option<&str> {
        self.default.as_deref()
    }
    pub fn available_calendars(&self, locale: &str) -> Result<Vec<String>, Error> {
        Ok(self.get(locale)?.available_calendars(&self.providers))
    }

    pub fn supported_locales(
        &self,
        requested: &[String],
        locale_matcher: Option<&str>,
    ) -> Result<Vec<String>, Error> {
        let requested = get_canonical_locales(requested).map_err(|_| Error::InvalidLocale)?;
        lookup_matcher(locale_matcher)?;
        Ok(matcher::supported(&self.available, &requested))
    }

    pub fn resolve(
        &self,
        requested: &[String],
        options: &ResolutionOptions,
    ) -> Result<Resolution, Error> {
        let requested = get_canonical_locales(requested).map_err(|_| Error::InvalidLocale)?;
        let lookup = lookup_matcher(options.locale_matcher.as_deref())?;
        let calendar = normalized(options.calendar.as_deref(), true)?;
        let numbering = normalized(options.numbering_system.as_deref(), false)?;
        let hour_cycle = options.hour_cycle.as_deref().map(cycle).transpose()?;
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
        let request = index
            .map(|index| {
                let index = if lookup {
                    index
                } else {
                    let base = matcher::without_unicode_extension(&requested[index]);
                    requested
                        .iter()
                        .rposition(|tag| matcher::without_unicode_extension(tag) == base)
                        .unwrap_or(index)
                };
                Locale::new(&requested[index], &Default::default())
                    .map_err(|_| Error::InvalidLocale)
            })
            .transpose()?;
        let data = self.get(&data_locale)?;
        let ca = data.available_calendars(&self.providers);
        let (calendar, keep_ca) = keyword(
            &ca,
            request.as_ref().and_then(|value| value.keyword("ca")),
            calendar.as_deref(),
        )?;
        let (numbering_system, keep_nu) = keyword(
            &data.metadata.numbering_systems,
            request.as_ref().and_then(|value| value.keyword("nu")),
            numbering.as_deref(),
        )?;
        let supported = &data.metadata.hour_cycles;
        let mut selected = *supported.first().ok_or(Error::InvalidLocaleData)?;
        let mut keep_hc = false;
        if let Some(cycle) = request
            .as_ref()
            .and_then(|value| value.keyword("hc"))
            .and_then(|value| cycle(value).ok())
        {
            if supported.contains(&Some(cycle)) {
                selected = Some(cycle);
                keep_hc = true;
            }
        }
        let hour_cycle = if options.hour12.is_some() {
            Some(None)
        } else {
            hour_cycle.map(Some)
        };
        if let Some(cycle) = hour_cycle {
            if cycle != selected && supported.contains(&cycle) {
                selected = cycle;
                keep_hc = false;
            }
        }
        let locale = if keep_ca || keep_nu || keep_hc {
            Locale::new(
                &data_locale,
                &LocaleOptions {
                    calendar: keep_ca.then(|| calendar.clone()),
                    numbering_system: keep_nu.then(|| numbering_system.clone()),
                    hour_cycle: if keep_hc {
                        selected.map(|cycle| cycle_name(cycle).into())
                    } else {
                        None
                    },
                    ..Default::default()
                },
            )
            .map_err(|_| Error::InvalidLocale)?
            .as_str()
            .to_owned()
        } else {
            data_locale.clone()
        };
        Ok(Resolution {
            locale,
            data_locale,
            calendar,
            numbering_system,
            hour_cycle: selected,
        })
    }
}

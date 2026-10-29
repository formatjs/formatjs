use crate::{Configuration, Duration, Error, Options, Part, RenderError, Renderer, metadata};
use formatjs_intl_getcanonicallocales::get_canonical_locales;
use formatjs_intl_locale::{Locale, LocaleOptions, matcher};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct ResolutionOptions {
    pub locale_matcher: Option<String>,
    pub numbering_system: Option<String>,
}
fn lookup(options: &ResolutionOptions) -> Result<bool, Error> {
    match options.locale_matcher.as_deref().unwrap_or("best fit") {
        "lookup" => Ok(true),
        "best fit" => Ok(false),
        _ => Err(Error::InvalidOption),
    }
}
pub fn available_locales() -> Result<&'static [String], Error> {
    Ok(&metadata::load()?.available)
}
pub fn supported_locales(
    requested: &[String],
    options: &ResolutionOptions,
) -> Result<Vec<String>, Error> {
    let requested = get_canonical_locales(requested).map_err(|_| Error::InvalidLocale)?;
    lookup(options)?;
    Ok(matcher::supported(available_locales()?, &requested))
}
#[derive(Debug, Clone)]
pub struct LocaleResolution {
    locale: String,
    data_locale: String,
    numbering_system: String,
}
impl LocaleResolution {
    pub fn locale(&self) -> &str {
        &self.locale
    }
    pub fn data_locale(&self) -> &str {
        &self.data_locale
    }
    pub fn numbering_system(&self) -> &str {
        &self.numbering_system
    }
}
impl Renderer {
    /// Resolve before reading style/display options at an observable host boundary.
    pub fn resolve_locale(
        &mut self,
        requested: &[String],
        options: &ResolutionOptions,
    ) -> Result<LocaleResolution, Error> {
        let requested = get_canonical_locales(requested).map_err(|_| Error::InvalidLocale)?;
        let lookup = lookup(options)?;
        let option_system = options
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
                .map(|locale| locale.keyword("nu").unwrap_or("").to_owned())
                .map_err(|_| Error::InvalidOption)
            })
            .transpose()?;
        let data = metadata::load()?;
        let matched = if lookup {
            requested.iter().enumerate().find_map(|(index, tag)| {
                matcher::lookup(&data.available, std::slice::from_ref(tag))
                    .map(|locale| (index, locale))
            })
        } else {
            matcher::best_fit_requested(&data.available, &requested)
                .map_err(|_| Error::InvalidLocale)?
        };
        let (index, data_locale) = matched
            .map(|(index, locale)| (Some(index), locale))
            .unwrap_or((None, "en".into()));
        let locale_data = data
            .locales
            .get(&data_locale)
            .ok_or_else(|| Error::InvalidData(data_locale.clone()))?;
        let systems = self.supported_numbering_systems(&data.numbering_systems);
        let supported = |system: &str| {
            locale_data.nu.iter().any(|value| value == system)
                || systems.iter().any(|value| value == system)
        };
        let mut numbering_system = locale_data
            .nu
            .first()
            .cloned()
            .ok_or_else(|| Error::InvalidData(data_locale.clone()))?;
        let request = index
            .map(|index| {
                if lookup {
                    &requested[index]
                } else {
                    let base = matcher::without_unicode_extension(&requested[index]);
                    &requested[requested
                        .iter()
                        .position(|tag| matcher::without_unicode_extension(tag) == base)
                        .unwrap_or(index)]
                }
            })
            .map(|tag| Locale::new(tag, &Default::default()))
            .transpose()
            .map_err(|_| Error::InvalidLocale)?;
        let mut extension = false;
        if let Some(system) = request.as_ref().and_then(|locale| locale.keyword("nu")) {
            if supported(system) {
                numbering_system = system.into();
                extension = true;
            }
        }
        if let Some(system) = option_system {
            if system != numbering_system && supported(&system) {
                numbering_system = system;
                extension = false;
            }
        }
        let locale = if extension {
            Locale::new(
                &data_locale,
                &LocaleOptions {
                    numbering_system: Some(numbering_system.clone()),
                    ..Default::default()
                },
            )
            .map_err(|_| Error::InvalidLocale)?
            .as_str()
            .to_owned()
        } else {
            data_locale.clone()
        };
        Ok(LocaleResolution {
            locale,
            data_locale,
            numbering_system,
        })
    }
}
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedOptions {
    pub locale: String,
    pub numbering_system: String,
    #[serde(flatten)]
    pub configuration: Configuration,
}
pub struct DurationFormat {
    resolved: ResolvedOptions,
    separator: &'static str,
}
impl DurationFormat {
    pub fn new(
        renderer: &mut Renderer,
        requested: &[String],
        resolution_options: &ResolutionOptions,
        options: &Options,
    ) -> Result<Self, Error> {
        Self::from_resolution(
            renderer.resolve_locale(requested, resolution_options)?,
            Configuration::new(options)?,
        )
    }
    pub fn from_resolution(
        resolution: LocaleResolution,
        configuration: Configuration,
    ) -> Result<Self, Error> {
        let data = metadata::load()?;
        let locale = data
            .locales
            .get(&resolution.data_locale)
            .ok_or_else(|| Error::InvalidData(resolution.data_locale.clone()))?;
        let separator = locale
            .separator
            .get(&resolution.numbering_system)
            .unwrap_or(&data.default_separator);
        Ok(Self {
            separator,
            resolved: ResolvedOptions {
                locale: resolution.locale,
                numbering_system: resolution.numbering_system,
                configuration,
            },
        })
    }
    pub fn resolved_options(&self) -> &ResolvedOptions {
        &self.resolved
    }
    pub fn format_to_parts(
        &self,
        renderer: &mut Renderer,
        duration: &Duration,
    ) -> Result<Vec<Part>, RenderError> {
        renderer.format_to_parts(
            &self.resolved.configuration,
            &self.resolved.locale,
            &self.resolved.numbering_system,
            self.separator,
            duration,
        )
    }
    pub fn format(
        &self,
        renderer: &mut Renderer,
        duration: &Duration,
    ) -> Result<String, RenderError> {
        Ok(self
            .format_to_parts(renderer, duration)?
            .into_iter()
            .map(|part| part.value)
            .collect())
    }
}

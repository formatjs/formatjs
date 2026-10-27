use crate::{
    Error,
    calendar::CalendarProvider,
    civil::time_clip,
    data::HourCycle,
    fields::Components,
    matching::Style,
    registry::{Registry, Resolution, ResolutionOptions},
    render::{Part, RangeSnapshot, RenderData},
    selection::{Configuration, Kind, Profile, Snapshot},
    timezone::{TimeZone, TimeZoneRegistry, TimeZoneSnapshot},
};
use serde::Serialize;
use std::{cell::RefCell, rc::Rc, sync::Arc};

#[derive(Clone, Default)]
pub struct Runtime {
    registry: Rc<RefCell<Registry>>,
    zones: TimeZoneRegistry,
}
impl Runtime {
    pub(crate) fn initial() -> Self {
        Self {
            registry: Rc::new(RefCell::new(Registry::initial())),
            zones: TimeZoneRegistry::default(),
        }
    }
    #[cfg(feature = "compiled_data")]
    pub fn with_compiled_data() -> Self {
        Self::initial()
    }

    pub fn add_locale_data(&self, json: &str) -> Result<(), Error> {
        self.registry.borrow_mut().add_locale_data(json)
    }
    pub fn add_calendar_locale_data(&self, json: &str) -> Result<(), Error> {
        self.registry.borrow_mut().add_calendar_locale_data(json)
    }
    pub fn register_calendar(&self, calendar: String, provider: Arc<dyn CalendarProvider>) {
        let previous = self
            .registry
            .borrow_mut()
            .replace_calendar(calendar, provider);
        drop(previous);
    }
    pub fn info(&self) -> Result<RuntimeInfo, Error> {
        let registry = self.registry.borrow();
        let default_locale = registry.default_locale().map(str::to_owned);
        let calendars = default_locale
            .as_deref()
            .map(|locale| registry.available_calendars(locale))
            .transpose()?
            .unwrap_or_default();
        Ok(RuntimeInfo {
            available: registry.available_locales().to_vec(),
            default_locale,
            time_zone: self.zones.default_time_zone().identifier().into(),
            calendars,
        })
    }
    pub fn time_zones(&self) -> &TimeZoneRegistry {
        &self.zones
    }
    pub fn supported_locales(
        &self,
        locales: &[String],
        matcher: Option<&str>,
    ) -> Result<Vec<String>, Error> {
        self.registry.borrow().supported_locales(locales, matcher)
    }
    pub fn begin(&self) -> Construction {
        Construction {
            runtime: self.clone(),
            zones: self.zones.snapshot(),
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeInfo {
    pub available: Vec<String>,
    #[serde(rename = "default")]
    pub default_locale: Option<String>,
    pub time_zone: String,
    pub calendars: Vec<String>,
}

pub struct Construction {
    runtime: Runtime,
    zones: TimeZoneSnapshot,
}
impl Construction {
    pub fn resolve(
        &self,
        locales: &[String],
        options: &ResolutionOptions,
    ) -> Result<Resolution, Error> {
        self.runtime.registry.borrow().resolve(locales, options)
    }
    pub fn time_zone(&self, explicit: Option<&str>) -> Result<TimeZone, Error> {
        explicit
            .map(|value| self.zones.resolve(value))
            .unwrap_or_else(|| Ok(self.runtime.zones.default_time_zone()))
    }
    pub fn capture(
        &self,
        resolution: Resolution,
        components: Components,
    ) -> Result<Snapshot, Error> {
        Snapshot::capture(&self.runtime.registry.borrow(), resolution, components)
    }
    pub fn finish(self, configuration: Configuration, zone: TimeZone) -> DateTimeFormat {
        let main = Arc::new(configuration.profile().clone());
        DateTimeFormat {
            runtime: self.runtime,
            configuration,
            zone,
            main,
        }
    }
}

#[derive(Debug, Clone)]
pub enum DateTimeValue {
    Number(f64),
    Temporal {
        kind: Kind,
        calendar: Option<String>,
        epoch_nanoseconds: i128,
    },
    ZonedDateTime,
}
struct PreparedValue {
    profile: Arc<Profile>,
    epoch_nanoseconds: i128,
    plain: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedOptions {
    pub locale: String,
    pub calendar: String,
    pub numbering_system: String,
    pub time_zone: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hour_cycle: Option<HourCycle>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hour12: Option<bool>,
    #[serde(flatten)]
    pub components: Components,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub date_style: Option<Style>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_style: Option<Style>,
}

pub struct DateTimeFormat {
    runtime: Runtime,
    configuration: Configuration,
    zone: TimeZone,
    main: Arc<Profile>,
}
impl DateTimeFormat {
    pub fn resolved_options(&self) -> ResolvedOptions {
        let resolution = &self.configuration.snapshot.resolution;
        ResolvedOptions {
            locale: resolution.locale.clone(),
            calendar: resolution.calendar.clone(),
            numbering_system: resolution.numbering_system.clone(),
            time_zone: self.zone.identifier().into(),
            hour_cycle: self.main.hour_cycle,
            hour12: self
                .main
                .hour_cycle
                .map(|cycle| matches!(cycle, HourCycle::H11 | HourCycle::H12)),
            components: if self.configuration.date_style.is_some()
                || self.configuration.time_style.is_some()
            {
                Components::default()
            } else {
                self.main.components
            },
            date_style: self.configuration.date_style,
            time_style: self.configuration.time_style,
        }
    }
    fn prepare(&self, value: &DateTimeValue) -> Result<PreparedValue, Error> {
        match value {
            DateTimeValue::Number(number) => Ok(PreparedValue {
                profile: self.main.clone(),
                epoch_nanoseconds: i128::from(time_clip(*number)?) * 1_000_000,
                plain: false,
            }),
            DateTimeValue::ZonedDateTime => Err(Error::UnsupportedTemporal),
            DateTimeValue::Temporal {
                kind,
                calendar,
                epoch_nanoseconds,
            } => {
                if calendar.as_deref().is_some_and(|calendar| {
                    calendar != self.configuration.snapshot.resolution.calendar
                        && (calendar != "iso8601"
                            || matches!(kind, Kind::PlainYearMonth | Kind::PlainMonthDay))
                }) {
                    return Err(Error::TemporalCalendarMismatch);
                }
                Ok(PreparedValue {
                    profile: self.configuration.temporal(*kind)?,
                    epoch_nanoseconds: *epoch_nanoseconds,
                    plain: *kind != Kind::Instant,
                })
            }
        }
    }
    pub fn format_to_parts(&self, value: &DateTimeValue) -> Result<Vec<Part>, Error> {
        let value = self.prepare(value)?;
        let render = RenderData::capture(
            &self.runtime.registry.borrow(),
            &self.configuration,
            &value.profile,
        )?;
        // No registry borrow crosses a user calendar callback.
        render.format(
            &self.configuration,
            &value.profile,
            &self.runtime.zones.snapshot(),
            &self.zone,
            value.epoch_nanoseconds,
            value.plain,
        )
    }
    pub fn format(&self, value: &DateTimeValue) -> Result<String, Error> {
        Ok(self
            .format_to_parts(value)?
            .into_iter()
            .map(|part| part.value)
            .collect())
    }
    pub fn format_range_to_parts(
        &self,
        first: &DateTimeValue,
        second: &DateTimeValue,
    ) -> Result<Vec<Part>, Error> {
        match (first, second) {
            (DateTimeValue::Number(_), DateTimeValue::Number(_))
            | (DateTimeValue::ZonedDateTime, DateTimeValue::ZonedDateTime) => {}
            (
                DateTimeValue::Temporal { kind: first, .. },
                DateTimeValue::Temporal { kind: second, .. },
            ) if first == second => {}
            _ => return Err(Error::TemporalTypeMismatch),
        }
        let first = self.prepare(first)?;
        let second = self.prepare(second)?;
        let snapshot =
            RangeSnapshot::capture(&self.runtime.registry.borrow(), &self.configuration)?;
        let zones = self.runtime.zones.snapshot();
        let convert = |value: &PreparedValue| {
            let render = RenderData::capture(
                &self.runtime.registry.borrow(),
                &self.configuration,
                &first.profile,
            )?;
            render.local_time(&zones, &self.zone, value.epoch_nanoseconds, value.plain)
        };
        let local_first = convert(&first)?;
        let local_second = convert(&second)?;
        let render = RenderData::capture(
            &self.runtime.registry.borrow(),
            &self.configuration,
            &first.profile,
        )?;
        snapshot.format(
            &render,
            &self.configuration,
            &first.profile,
            &self.zone,
            &local_first,
            &local_second,
        )
    }
    pub fn format_range(
        &self,
        first: &DateTimeValue,
        second: &DateTimeValue,
    ) -> Result<String, Error> {
        Ok(self
            .format_range_to_parts(first, second)?
            .into_iter()
            .map(|part| part.value)
            .collect())
    }
}

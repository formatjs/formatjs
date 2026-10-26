use crate::{
    Error,
    calendar::CalendarRegistry,
    fields::TextWidth,
    locale_patterns::{CalendarPatterns, IntervalFormats},
    matching::{StyleData, Styles},
    numbers::NumberData,
    pattern::{Format, RawPatterns},
};
use serde::{Deserialize, Serialize};
use std::{
    collections::BTreeMap,
    sync::{Arc, OnceLock},
};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Widths<T> {
    pub narrow: T,
    pub short: T,
    pub long: T,
}
impl<T> Widths<T> {
    pub fn get(&self, width: TextWidth) -> &T {
        match width {
            TextWidth::Narrow => &self.narrow,
            TextWidth::Short => &self.short,
            TextWidth::Long => &self.long,
        }
    }
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum HourCycle {
    H11,
    H12,
    H23,
    H24,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct LeapMonthPatterns {
    pub numeric: String,
    pub format: Widths<String>,
    pub standalone: Widths<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarNames {
    pub era: Widths<BTreeMap<String, String>>,
    pub month: Widths<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub month_standalone: Option<Widths<Vec<String>>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub year_names: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub leap_month_patterns: Option<LeapMonthPatterns>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct TimeZoneNames {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub long: Option<[String; 2]>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub short: Option<[String; 2]>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct DayPeriodRule {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub at: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub from: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub before: Option<u32>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Metadata {
    pub am: String,
    pub pm: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub day_periods: Option<Widths<BTreeMap<String, String>>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub day_period_rules: Option<Vec<DayPeriodRule>>,
    pub weekday: Widths<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub weekday_standalone: Option<Widths<Vec<String>>>,
    pub time_zone_name: BTreeMap<String, TimeZoneNames>,
    pub gmt_format: String,
    pub hour_format: String,
    pub hour_cycle: HourCycle,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hour_cycle12: Option<HourCycle>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hour_cycle24: Option<HourCycle>,
    #[serde(rename = "nu")]
    pub numbering_systems: Vec<String>,
    #[serde(rename = "ca")]
    pub calendar_preferences: Vec<String>,
    #[serde(rename = "hc")]
    pub hour_cycles: Vec<Option<HourCycle>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawCalendar {
    #[serde(flatten)]
    names: CalendarNames,
    date_format: Styles<String>,
    time_format: Styles<String>,
    date_time_format: Styles<String>,
    interval_formats: IntervalFormats,
}

impl RawCalendar {
    fn inherit_names(&mut self, base: &CalendarNames) {
        self.names.month_standalone = self
            .names
            .month_standalone
            .take()
            .or_else(|| base.month_standalone.clone());
        self.names.year_names = self
            .names
            .year_names
            .take()
            .or_else(|| base.year_names.clone());
        self.names.leap_month_patterns = self
            .names
            .leap_month_patterns
            .take()
            .or_else(|| base.leap_month_patterns.clone());
    }

    fn with_formats(self, formats: RawPatterns) -> CalendarLocale {
        CalendarLocale {
            names: self.names,
            raw: CalendarPatterns {
                formats,
                date_format: self.date_format,
                time_format: self.time_format,
                date_time_format: self.date_time_format,
                interval_formats: self.interval_formats,
            },
            formats: OnceLock::new(),
            formats_from: None,
            styles: OnceLock::new(),
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawData {
    #[serde(flatten)]
    metadata: Metadata,
    #[serde(flatten)]
    gregory: RawCalendar,
    formats: RawPatterns<RawPatterns>,
    #[serde(default)]
    calendar_data: BTreeMap<String, RawCalendar>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(transparent)]
struct ArcNumberData(#[serde(deserialize_with = "deserialize_numbers")] Arc<NumberData>);
fn deserialize_numbers<'de, D: serde::Deserializer<'de>>(
    deserializer: D,
) -> Result<Arc<NumberData>, D::Error> {
    NumberData::deserialize(deserializer).map(Arc::new)
}

#[derive(Clone, Deserialize)]
pub(crate) struct RawLocale {
    pub locale: String,
    data: RawData,
    number: Option<ArcNumberData>,
}

#[derive(Clone, Deserialize)]
pub(crate) struct CalendarPatch {
    pub locale: String,
    pub calendar: String,
    data: RawCalendar,
    formats: RawPatterns,
}

impl RawLocale {
    pub(crate) fn apply(&mut self, patch: &CalendarPatch) {
        if !self
            .data
            .metadata
            .calendar_preferences
            .contains(&patch.calendar)
        {
            self.data
                .metadata
                .calendar_preferences
                .push(patch.calendar.clone());
        }
        if let Some((_, formats)) = self
            .data
            .formats
            .0
            .iter_mut()
            .find(|(calendar, _)| calendar == &patch.calendar)
        {
            *formats = patch.formats.clone();
        } else {
            self.data
                .formats
                .0
                .push((patch.calendar.clone(), patch.formats.clone()));
        }
        self.data
            .calendar_data
            .insert(patch.calendar.clone(), patch.data.clone());
    }
}

#[derive(Debug)]
pub struct CalendarLocale {
    pub names: CalendarNames,
    raw: CalendarPatterns,
    formats: OnceLock<Result<Vec<Format>, Error>>,
    // ISO shares format lists even when localized names/styles differ.
    formats_from: Option<Arc<CalendarLocale>>,
    styles: OnceLock<Result<StyleData, Error>>,
}

impl CalendarLocale {
    pub fn formats(&self) -> Result<&[Format], Error> {
        if let Some(source) = &self.formats_from {
            return source.formats();
        }
        self.formats
            .get_or_init(|| self.raw.formats())
            .as_ref()
            .map(Vec::as_slice)
            .map_err(|error| *error)
    }
    pub fn styles(&self) -> Result<&StyleData, Error> {
        self.styles
            .get_or_init(|| self.raw.styles())
            .as_ref()
            .map_err(|error| *error)
    }
}

#[derive(Debug)]
pub struct LocaleData {
    pub locale: String,
    pub metadata: Metadata,
    pub(crate) number: Option<Arc<NumberData>>,
    calendars: BTreeMap<String, Arc<CalendarLocale>>,
}

impl LocaleData {
    pub fn from_json(json: &str) -> Result<Self, Error> {
        Self::from_raw(serde_json::from_str(json).map_err(|_| Error::InvalidLocaleData)?)
    }

    pub(crate) fn from_raw(raw: RawLocale) -> Result<Self, Error> {
        let RawLocale {
            locale,
            data,
            number,
        } = raw;
        let gregory_override = data.calendar_data.contains_key("gregory");
        if gregory_override {
            data.gregory
                .clone()
                .with_formats(RawPatterns::default())
                .styles()?;
        }
        let mut calendars = BTreeMap::new();
        for (calendar, formats) in data.formats.0 {
            if calendar == "iso8601" {
                continue;
            }
            let mut raw = data
                .calendar_data
                .get(&calendar)
                .unwrap_or(&data.gregory)
                .clone();
            raw.inherit_names(&data.gregory.names);
            calendars.insert(calendar, Arc::new(raw.with_formats(formats)));
        }
        let gregory = calendars
            .get("gregory")
            .cloned()
            .ok_or(Error::InvalidLocaleData)?;
        if !gregory_override {
            gregory.styles()?;
        }
        let iso = if gregory_override || data.calendar_data.contains_key("iso8601") {
            let mut raw = data
                .calendar_data
                .get("iso8601")
                .unwrap_or(&data.gregory)
                .clone();
            raw.inherit_names(&data.gregory.names);
            let mut iso = raw.with_formats(RawPatterns::default());
            iso.formats_from = Some(gregory);
            Arc::new(iso)
        } else {
            gregory
        };
        calendars.insert("iso8601".into(), iso);
        Ok(Self {
            locale,
            metadata: data.metadata,
            number: number.map(|number| number.0),
            calendars,
        })
    }

    pub fn numbers(&self) -> Result<&Arc<NumberData>, Error> {
        self.number.as_ref().ok_or(Error::MissingNumberData)
    }

    pub fn calendar_names(&self) -> impl Iterator<Item = &str> {
        self.calendars.keys().map(String::as_str)
    }

    pub fn calendar(&self, calendar: &str) -> Result<Arc<CalendarLocale>, Error> {
        let calendar = self
            .calendars
            .get(calendar)
            .cloned()
            .ok_or(Error::MissingCalendar)?;
        calendar.styles()?;
        Ok(calendar)
    }

    pub fn available_calendars(&self, providers: &CalendarRegistry) -> Vec<String> {
        self.metadata
            .calendar_preferences
            .iter()
            .filter(|calendar| {
                self.calendars.contains_key(*calendar) && providers.contains(calendar)
            })
            .cloned()
            .collect()
    }
}

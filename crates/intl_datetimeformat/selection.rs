use crate::{
    Error,
    data::{CalendarLocale, HourCycle, LocaleData, Metadata},
    fields::{Components, Field, NumericWidth, Value, Width, ZoneWidth},
    matching::{self, Style},
    pattern::{Format, RangePattern},
    registry::{Registry, Resolution},
};
use serde::{Deserialize, Serialize};
use std::{
    collections::BTreeMap,
    sync::{Arc, OnceLock},
};

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Options {
    pub format_matcher: Option<String>,
    pub date_style: Option<String>,
    pub time_style: Option<String>,
}
#[derive(Clone, Copy, Deserialize)]
#[serde(rename_all = "lowercase")]
pub(crate) enum DateLocaleMode {
    All,
    Date,
    Time,
}
#[derive(Debug, Clone, Copy, Default)]
enum Matcher {
    Basic,
    #[default]
    BestFit,
}
#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq)]
pub enum Kind {
    Instant,
    PlainDateTime,
    PlainDate,
    PlainTime,
    PlainYearMonth,
    PlainMonthDay,
}
impl Kind {
    fn index(self) -> usize {
        match self {
            Self::Instant => 0,
            Self::PlainDateTime => 1,
            Self::PlainDate => 2,
            Self::PlainTime => 3,
            Self::PlainYearMonth => 4,
            Self::PlainMonthDay => 5,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Profile {
    #[serde(flatten)]
    pub components: Components,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hour_cycle: Option<HourCycle>,
    pub pattern: String,
    pub range_patterns: BTreeMap<String, RangePattern>,
    pub format: Format,
}

pub struct Snapshot {
    pub locale: Arc<LocaleData>,
    pub calendar: Arc<CalendarLocale>,
    pub resolution: Resolution,
    components: Components,
    hour12: Option<bool>,
}

fn style(value: Option<&str>, name: &'static str) -> Result<Option<Style>, Error> {
    value
        .map(|value| match value {
            "full" => Ok(Style::Full),
            "long" => Ok(Style::Long),
            "medium" => Ok(Style::Medium),
            "short" => Ok(Style::Short),
            _ => Err(Error::InvalidOption(name)),
        })
        .transpose()
}
fn twelve(cycle: HourCycle) -> bool {
    matches!(cycle, HourCycle::H11 | HourCycle::H12)
}
// ECMA-402 §11.1.2 steps 15–17 use the retained locale-wide preferences.
// https://tc39.es/ecma402/#sec-createdatetimeformat
fn hour_cycle(resolved: Option<HourCycle>, data: &Metadata, hour12: Option<bool>) -> HourCycle {
    match hour12 {
        Some(true) => data
            .hour_cycle12
            .or_else(|| {
                data.hour_cycles
                    .iter()
                    .flatten()
                    .copied()
                    .find(|cycle| twelve(*cycle))
            })
            .unwrap_or(HourCycle::H12),
        Some(false) => data
            .hour_cycle24
            .or_else(|| {
                data.hour_cycles
                    .iter()
                    .flatten()
                    .copied()
                    .find(|cycle| !twelve(*cycle))
            })
            .unwrap_or(HourCycle::H23),
        None => resolved.unwrap_or(data.hour_cycle),
    }
}

impl Snapshot {
    pub fn capture(
        registry: &Registry,
        resolution: Resolution,
        components: Components,
    ) -> Result<Self, Error> {
        let locale = registry.get(&resolution.data_locale)?;
        Self::from_locale(locale, resolution, components)
    }

    pub(crate) fn from_locale(
        locale: Arc<LocaleData>,
        resolution: Resolution,
        mut components: Components,
    ) -> Result<Self, Error> {
        let calendar = locale.calendar(&resolution.calendar)?;
        calendar.formats()?;
        let hour12 = components.hour12.take();
        Ok(Self {
            locale,
            calendar,
            resolution,
            components,
            hour12,
        })
    }

    pub fn select(self, options: &Options) -> Result<Configuration, Error> {
        self.select_with_date_locale(options, None)
    }

    pub(crate) fn select_with_date_locale(
        self,
        options: &Options,
        date_locale: Option<DateLocaleMode>,
    ) -> Result<Configuration, Error> {
        let matcher = match options.format_matcher.as_deref() {
            None | Some("best fit") => Matcher::BestFit,
            Some("basic") => Matcher::Basic,
            _ => return Err(Error::InvalidOption("formatMatcher")),
        };
        let date_style = style(options.date_style.as_deref(), "dateStyle")?;
        let time_style = style(options.time_style.as_deref(), "timeStyle")?;
        let cycle = hour_cycle(
            self.resolution.hour_cycle,
            &self.locale.metadata,
            self.hour12,
        );
        let mut requested = self.components;
        let styled = date_style.is_some() || time_style.is_some();
        let format = if styled {
            if Field::ALL
                .into_iter()
                .any(|field| requested.get(field).is_some())
            {
                return Err(Error::StyleComponents);
            }
            matching::style(
                date_style,
                time_style,
                self.calendar.styles()?,
                self.calendar.formats()?,
                time_style.map(|_| twelve(cycle)),
            )?
        } else {
            // ECMA-402 §11.1.2 step 32 checks required fields before adding defaults.
            // https://tc39.es/ecma402/#sec-createdatetimeformat
            let has_date = [Field::Weekday, Field::Year, Field::Month, Field::Day]
                .into_iter()
                .any(|field| requested.get(field).is_some());
            let has_time = [
                Field::DayPeriod,
                Field::Hour,
                Field::Minute,
                Field::Second,
                Field::FractionalSecondDigits,
            ]
            .into_iter()
            .any(|field| requested.get(field).is_some());
            let needs_defaults = match date_locale {
                Some(DateLocaleMode::Date) => !has_date,
                Some(DateLocaleMode::Time) => !has_time,
                Some(DateLocaleMode::All) | None => !has_date && !has_time,
            };
            if needs_defaults {
                if !matches!(date_locale, Some(DateLocaleMode::Time)) {
                    requested.year = Some(NumericWidth::Numeric);
                    requested.month = Some(Width::Numeric);
                    requested.day = Some(NumericWidth::Numeric);
                }
                if matches!(
                    date_locale,
                    Some(DateLocaleMode::Time | DateLocaleMode::All)
                ) {
                    requested.hour = Some(NumericWidth::Numeric);
                    requested.minute = Some(NumericWidth::Numeric);
                    requested.second = Some(NumericWidth::Numeric);
                }
            }
            if requested.hour.is_some() || requested.minute.is_some() || requested.second.is_some()
            {
                requested.hour12 = Some(twelve(cycle));
            }
            choose(matcher, requested, &self.calendar)?
        };
        let profile = make_profile(&self, format, requested, cycle, false)?;
        Ok(Configuration {
            snapshot: self,
            matcher,
            date_style,
            time_style,
            cycle,
            main: profile,
            zoned_locale: false,
            temporal: std::array::from_fn(|_| OnceLock::new()),
        })
    }
}

fn choose(
    matcher: Matcher,
    options: Components,
    calendar: &CalendarLocale,
) -> Result<Format, Error> {
    matching::match_components(
        options,
        calendar.formats()?,
        calendar,
        matches!(matcher, Matcher::BestFit),
    )
}

fn make_profile(
    snapshot: &Snapshot,
    format: Format,
    requested: Components,
    cycle: HourCycle,
    temporal: bool,
) -> Result<Profile, Error> {
    let mut components = format.components;
    components.hour12 = None;
    let use12 = components.hour.is_some() && twelve(cycle);
    let mut pattern = if use12 {
        format.pattern12.clone()
    } else {
        format.pattern.clone()
    };
    if requested.fractional_second_digits.is_some()
        && pattern.contains("{second}")
        && !pattern.contains("{fractionalSecondDigits}")
    {
        let separator = snapshot.locale.numbers()?.decimal(
            &snapshot.resolution.locale,
            &snapshot.resolution.numbering_system,
        )?;
        pattern = pattern.replacen(
            "{second}",
            &format!("{{second}}{separator}{{fractionalSecondDigits}}"),
            1,
        );
    }
    if requested.day_period.is_some() {
        pattern = pattern.replacen("{ampm}", "{dayPeriod}", 1);
    }
    // ECMA-402 §11.2.3.1 Table 5 ties period and precision fields to the pattern.
    // https://tc39.es/ecma402/#sec-datetimeformat-format-record
    if pattern.contains("{dayPeriod}") {
        components.day_period = requested.day_period.or(components.day_period);
    }
    if pattern.contains("{fractionalSecondDigits}") {
        components.fractional_second_digits = requested
            .fractional_second_digits
            .or(components.fractional_second_digits);
    }
    let hour_cycle = if temporal || components.hour.is_some() {
        Some(cycle)
    } else {
        None
    };
    let mut range_patterns = if use12 {
        format.range_patterns12.clone()
    } else {
        format.range_patterns.clone()
    };
    // CLDR matching adjusts textual date fields; interval time widths stay independent.
    for (field, range) in &mut range_patterns {
        if let (Some(requested), Some(selected)) =
            (components.time_zone_name, range.components.time_zone_name)
        {
            use ZoneWidth::*;
            let long = matches!(selected, Long | LongGeneric | LongOffset);
            range.components.time_zone_name = Some(match (requested, long) {
                (ShortGeneric | LongGeneric, true) => LongGeneric,
                (ShortGeneric | LongGeneric, false) => ShortGeneric,
                (ShortOffset | LongOffset, true) => LongOffset,
                (ShortOffset | LongOffset, false) => ShortOffset,
                (_, true) => Long,
                (_, false) => Short,
            });
        }
        if matches!(field.as_str(), "era" | "year" | "month" | "day") {
            range.components.time_zone_name = components.time_zone_name;
        }
        if let Some(digits) = requested.fractional_second_digits {
            range.components.fractional_second_digits = Some(digits);
            let separator = snapshot.locale.numbers()?.decimal(
                &snapshot.resolution.locale,
                &snapshot.resolution.numbering_system,
            )?;
            for part in &mut range.pattern_parts {
                if !part.pattern.contains("{fractionalSecondDigits}") {
                    part.pattern = part.pattern.replace(
                        "{second}",
                        &format!("{{second}}{separator}{{fractionalSecondDigits}}"),
                    );
                }
            }
        }
        if requested.day_period.is_some() {
            range.components.day_period = range.components.day_period.or(requested.day_period);
            for part in &mut range.pattern_parts {
                part.pattern = part.pattern.replace("{ampm}", "{dayPeriod}");
            }
        }
        if components.era == Some(crate::fields::TextWidth::Narrow) {
            range.components.era = components.era;
        }
        for field in [Field::Weekday, Field::Month] {
            // Keep the interval's width when its weekday form differs from the single pattern.
            // https://unicode.org/reports/tr35/tr35-dates.html#Matching_Skeletons
            if field == Field::Weekday
                && range.components.weekday_standalone == Some(true)
                && components.weekday_standalone != Some(true)
            {
                continue;
            }
            if field == Field::Month
                && range
                    .components
                    .month
                    .map(Value::Width)
                    .is_some_and(Value::numeric)
            {
                continue;
            }
            if matches!(
                components.get(field),
                Some(Value::Width(Width::Narrow | Width::Short | Width::Long))
            ) {
                range.components.set_from(field, components);
            }
        }
    }
    Ok(Profile {
        components,
        hour_cycle,
        pattern,
        range_patterns,
        format,
    })
}

pub struct Configuration {
    pub snapshot: Snapshot,
    matcher: Matcher,
    pub date_style: Option<Style>,
    pub time_style: Option<Style>,
    cycle: HourCycle,
    main: Profile,
    zoned_locale: bool,
    temporal: [OnceLock<Arc<Profile>>; 6],
}
impl Configuration {
    pub(crate) fn with_zoned_locale(mut self, value: bool) -> Self {
        self.zoned_locale = value;
        self
    }

    pub fn profile(&self) -> &Profile {
        &self.main
    }

    pub fn temporal(&self, kind: Kind) -> Result<Arc<Profile>, Error> {
        let cache = &self.temporal[kind.index()];
        if let Some(profile) = cache.get() {
            return Ok(profile.clone());
        }
        use Field::*;
        let date = &[Weekday, Year, Month, Day][..];
        let time = &[DayPeriod, Hour, Minute, Second, FractionalSecondDigits][..];
        let all = &[
            Weekday,
            Year,
            Month,
            Day,
            DayPeriod,
            Hour,
            Minute,
            Second,
            FractionalSecondDigits,
        ][..];
        let required = match kind {
            Kind::PlainDate => date,
            Kind::PlainTime => time,
            Kind::PlainYearMonth => &[Year, Month],
            Kind::PlainMonthDay => &[Month, Day],
            _ => all,
        };
        let defaults = match kind {
            Kind::PlainDate => &[Year, Month, Day][..],
            Kind::PlainTime => &[Hour, Minute, Second][..],
            Kind::PlainYearMonth | Kind::PlainMonthDay => required,
            _ => &[Year, Month, Day, Hour, Minute, Second][..],
        };
        let mut allowed = required.to_vec();
        if !matches!(kind, Kind::PlainTime | Kind::PlainMonthDay) {
            allowed.push(Era);
        }
        if kind == Kind::Instant {
            allowed.push(TimeZoneName);
        }
        let mut selected = Components::default();
        let format = if self.date_style.is_some() || self.time_style.is_some() {
            if (kind == Kind::PlainTime && self.time_style.is_none())
                || (matches!(
                    kind,
                    Kind::PlainDate | Kind::PlainYearMonth | Kind::PlainMonthDay
                ) && self.date_style.is_none())
            {
                return Err(Error::TemporalMismatch);
            }
            for field in &allowed {
                selected.set_from(*field, self.main.format.components);
            }
            selected.hour12 = Some(twelve(self.cycle));
            let conflict = Field::ALL.into_iter().any(|field| {
                self.main.format.components.get(field).is_some() && !allowed.contains(&field)
            });
            if conflict {
                choose(self.matcher, selected, &self.snapshot.calendar)?
            } else {
                self.main.format.clone()
            }
        } else {
            let original = self.snapshot.components;
            for field in &allowed {
                selected.set_from(*field, original);
            }
            if required.iter().all(|field| original.get(*field).is_none()) {
                if kind != Kind::Instant && all.iter().any(|field| original.get(*field).is_some()) {
                    return Err(Error::TemporalMismatch);
                }
                for field in defaults {
                    match field {
                        Year => selected.year = Some(NumericWidth::Numeric),
                        Month => selected.month = Some(Width::Numeric),
                        Day => selected.day = Some(NumericWidth::Numeric),
                        Hour => selected.hour = Some(NumericWidth::Numeric),
                        Minute => selected.minute = Some(NumericWidth::Numeric),
                        Second => selected.second = Some(NumericWidth::Numeric),
                        _ => {}
                    }
                }
                if kind == Kind::Instant && self.zoned_locale && selected.time_zone_name.is_none() {
                    selected.time_zone_name = Some(ZoneWidth::Short);
                }
            }
            selected.hour12 = Some(twelve(self.cycle));
            choose(self.matcher, selected, &self.snapshot.calendar)?
        };
        let profile = Arc::new(make_profile(
            &self.snapshot,
            format,
            selected,
            self.cycle,
            true,
        )?);
        let _ = cache.set(profile.clone());
        Ok(cache.get().cloned().unwrap_or(profile))
    }
}

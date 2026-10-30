use crate::{
    Error,
    data::{CalendarLocale, HourCycle, LocaleData, Metadata},
    fields::{Components, Field, NumericWidth, Width},
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
        mut components: Components,
    ) -> Result<Self, Error> {
        let locale = registry.get(&resolution.data_locale)?;
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
            if [
                Field::Weekday,
                Field::Year,
                Field::Month,
                Field::Day,
                Field::DayPeriod,
                Field::Hour,
                Field::Minute,
                Field::Second,
                Field::FractionalSecondDigits,
            ]
            .into_iter()
            .all(|field| requested.get(field).is_none())
            {
                requested.year = Some(NumericWidth::Numeric);
                requested.month = Some(Width::Numeric);
                requested.day = Some(NumericWidth::Numeric);
            }
            if matches!(matcher, Matcher::BestFit)
                && (requested.hour.is_some()
                    || requested.minute.is_some()
                    || requested.second.is_some())
            {
                requested.hour12 = Some(twelve(cycle));
            }
            choose(matcher, requested, self.calendar.formats()?)?
        };
        let profile = make_profile(&self, format, requested, cycle, false)?;
        Ok(Configuration {
            snapshot: self,
            matcher,
            date_style,
            time_style,
            cycle,
            main: profile,
            temporal: std::array::from_fn(|_| OnceLock::new()),
        })
    }
}

fn choose(matcher: Matcher, options: Components, formats: &[Format]) -> Result<Format, Error> {
    match matcher {
        Matcher::Basic => matching::basic(options, formats),
        Matcher::BestFit => matching::best_fit(options, formats),
    }
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
    if requested.day_period.is_some() {
        components.day_period = requested.day_period;
    }
    if requested.fractional_second_digits.is_some() {
        components.fractional_second_digits = requested.fractional_second_digits;
    }
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
    let hour_cycle = if temporal || components.hour.is_some() {
        Some(cycle)
    } else {
        None
    };
    let range_patterns = if use12 {
        format.range_patterns12.clone()
    } else {
        format.range_patterns.clone()
    };
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
    temporal: [OnceLock<Arc<Profile>>; 6],
}
impl Configuration {
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
                choose(self.matcher, selected, self.snapshot.calendar.formats()?)?
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
            }
            selected.hour12 = Some(twelve(self.cycle));
            choose(self.matcher, selected, self.snapshot.calendar.formats()?)?
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

use crate::{
    Error,
    calendar::{CalendarFields, CalendarProvider},
    civil::CivilDateTime,
    data::{CalendarLocale, LocaleData, Metadata},
    fields::{Components, Field, TextWidth, Value, Width, ZoneWidth},
    numbers::NumberFormatters,
    pattern::{self, Source},
    registry::Registry,
    selection::{Configuration, Profile},
    timezone::{TimeZone, TimeZoneOffset, TimeZoneSnapshot},
};
use serde::Serialize;
use std::sync::{Arc, OnceLock};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum PartKind {
    Literal,
    Weekday,
    Era,
    Year,
    Month,
    Day,
    DayPeriod,
    Hour,
    Minute,
    Second,
    FractionalSecond,
    TimeZoneName,
    RelatedYear,
    YearName,
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Part {
    #[serde(rename = "type")]
    pub kind: PartKind,
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<Source>,
}
enum Token<'a> {
    Literal(&'a str),
    Field(&'a str),
}
fn partition(pattern: &str) -> Result<Vec<Token<'_>>, Error> {
    let mut result = Vec::new();
    let mut next = 0;
    while let Some(open) = pattern[next..].find('{').map(|offset| next + offset) {
        let close = pattern[open..]
            .find('}')
            .map(|offset| open + offset)
            .ok_or(Error::InvalidPattern)?;
        if open > next {
            result.push(Token::Literal(&pattern[next..open]));
        }
        result.push(Token::Field(&pattern[open + 1..close]));
        next = close + 1;
    }
    if next < pattern.len() {
        result.push(Token::Literal(&pattern[next..]));
    }
    Ok(result)
}

pub struct RenderData {
    locale: Arc<LocaleData>,
    calendar: Arc<CalendarLocale>,
    provider: Arc<dyn CalendarProvider>,
    numbers: Arc<NumberFormatters>,
}
impl RenderData {
    // Retain records, then release registry borrows before invoking user providers.
    pub fn capture(
        registry: &Registry,
        config: &Configuration,
        profile: &Profile,
    ) -> Result<Self, Error> {
        Self::capture_cached(registry, config, profile, &OnceLock::new())
    }

    pub(crate) fn capture_cached(
        registry: &Registry,
        config: &Configuration,
        profile: &Profile,
        cache: &OnceLock<Arc<NumberFormatters>>,
    ) -> Result<Self, Error> {
        let locale = registry.get(&config.snapshot.resolution.data_locale)?;
        let calendar = locale.calendar(&config.snapshot.resolution.calendar)?;
        let provider = registry.calendar_provider(&config.snapshot.resolution.calendar)?;
        let numbers = if let Some(numbers) = cache.get() {
            numbers.clone()
        } else {
            let numbers = Arc::new(config.snapshot.locale.numbers()?.formatters(
                &config.snapshot.resolution.locale,
                &config.snapshot.resolution.numbering_system,
                profile.components.fractional_second_digits,
            )?);
            let _ = cache.set(numbers.clone());
            numbers
        };
        Ok(Self {
            locale,
            calendar,
            provider,
            numbers,
        })
    }

    pub fn format(
        &self,
        config: &Configuration,
        profile: &Profile,
        zones: &TimeZoneSnapshot,
        zone: &TimeZone,
        epoch_nanoseconds: i128,
        plain: bool,
    ) -> Result<Vec<Part>, Error> {
        let local = self.local_time(zones, zone, epoch_nanoseconds, plain)?;
        self.pattern(
            config,
            profile,
            &profile.pattern,
            &profile.pattern,
            &local,
            zone.data_identifier(),
            profile.components,
        )
    }

    pub fn local_time(
        &self,
        zones: &TimeZoneSnapshot,
        zone: &TimeZone,
        epoch_nanoseconds: i128,
        plain: bool,
    ) -> Result<LocalTime, Error> {
        let plain_zone = if plain {
            Some(zones.resolve("+00:00")?)
        } else {
            None
        };
        let (civil, offset) =
            zones.local_time(plain_zone.as_ref().unwrap_or(zone), epoch_nanoseconds)?;
        let milliseconds = epoch_nanoseconds
            .checked_add(i128::from(offset.seconds) * 1_000_000_000)
            .ok_or(Error::InvalidDate)?
            .div_euclid(1_000_000);
        let fields = self
            .provider
            .date_from_time(i64::try_from(milliseconds).map_err(|_| Error::InvalidDate)?)?;
        Ok(LocalTime {
            civil,
            fields,
            offset,
        })
    }

    pub fn pattern(
        &self,
        _config: &Configuration,
        profile: &Profile,
        pattern: &str,
        context: &str,
        local: &LocalTime,
        zone: &str,
        format: Components,
    ) -> Result<Vec<Part>, Error> {
        let civil = local.civil;
        let fields = &local.fields;
        let TimeZoneOffset {
            seconds: offset_seconds,
            in_dst,
        } = local.offset;
        let parts = partition(pattern)?;
        let context_parts = (pattern != context)
            .then(|| partition(context))
            .transpose()?;
        let context = context_parts.as_ref().unwrap_or(&parts);
        let has = |name: &str| {
            context
                .iter()
                .any(|part| matches!(part,Token::Field(field) if *field==name))
        };
        let other_date = ["day", "year", "relatedYear", "yearName", "weekday", "era"]
            .into_iter()
            .any(has);
        let standalone_month = format
            .month_standalone
            .unwrap_or(has("month") && !other_date);
        let standalone_weekday = format.weekday_standalone.unwrap_or(
            has("weekday")
                && context
                    .iter()
                    .all(|part| matches!(part, Token::Literal(_) | Token::Field("weekday"))),
        );
        let mut result = Vec::new();
        for part in parts {
            let (kind, value) = match part {
                Token::Literal(value) => (PartKind::Literal, value.into()),
                Token::Field("fractionalSecondDigits") => {
                    let digits = format
                        .fractional_second_digits
                        .ok_or(Error::InvalidPattern)?;
                    let value =
                        (civil.nanosecond / 1_000_000) / 10u32.pow(3 - u32::from(u8::from(digits)));
                    (PartKind::FractionalSecond, self.numbers.fractional(value)?)
                }
                Token::Field("dayPeriod") => (
                    PartKind::DayPeriod,
                    day_period(
                        &self.locale.metadata,
                        civil,
                        format.day_period.unwrap_or(TextWidth::Short),
                        format,
                    ),
                ),
                Token::Field("ampm") => (
                    PartKind::DayPeriod,
                    if civil.hour < 12 {
                        self.locale.metadata.am.clone()
                    } else {
                        self.locale.metadata.pm.clone()
                    },
                ),
                Token::Field("timeZoneName") => {
                    let width = format.time_zone_name.unwrap_or(ZoneWidth::Short);
                    let generic =
                        self.locale.metadata.time_zone_name.get(zone).and_then(
                            |names| match width {
                                ZoneWidth::ShortGeneric => names.short_generic.as_ref(),
                                ZoneWidth::LongGeneric => names.long_generic.as_ref(),
                                _ => None,
                            },
                        );
                    let names =
                        self.locale.metadata.time_zone_name.get(zone).and_then(
                            |names| match width {
                                ZoneWidth::Short => names.short.as_ref(),
                                ZoneWidth::Long => names.long.as_ref(),
                                _ => None,
                            },
                        );
                    let value = if let Some(generic) = generic {
                        generic.clone()
                    } else {
                        match names {
                            Some(names) if !(in_dst && names[0] == names[1]) => {
                                names[usize::from(in_dst)].clone()
                            }
                            _ => self.offset_name(
                                offset_seconds,
                                matches!(
                                    width,
                                    ZoneWidth::Long
                                        | ZoneWidth::LongGeneric
                                        | ZoneWidth::LongOffset
                                ),
                            )?,
                        }
                    };
                    (PartKind::TimeZoneName, value)
                }
                Token::Field("relatedYear") => (
                    PartKind::RelatedYear,
                    match fields.related_year {
                        Some(year) => self.numbers.numeric(year)?,
                        None => self
                            .numbers
                            .numeric
                            .format("NaN")
                            .map_err(|_| Error::InvalidLocaleData)?,
                    },
                ),
                Token::Field("yearName") => (
                    PartKind::YearName,
                    self.calendar
                        .names
                        .year_names
                        .as_ref()
                        .and_then(|names| {
                            fields
                                .year_name
                                .and_then(|index| names.get(usize::from(index)))
                        })
                        .cloned()
                        .ok_or(Error::InvalidLocaleData)?,
                ),
                Token::Field(name) => {
                    let (field, kind, value) = match name {
                        "weekday" => (Field::Weekday, PartKind::Weekday, i32::from(civil.weekday)),
                        "era" => (Field::Era, PartKind::Era, 0),
                        "year" => (Field::Year, PartKind::Year, fields.year),
                        "month" => (
                            Field::Month,
                            PartKind::Month,
                            i32::from(fields.month_number.unwrap_or(fields.month)) + 1,
                        ),
                        "day" => (Field::Day, PartKind::Day, i32::from(fields.day)),
                        "hour" => {
                            let mut hour = civil.hour;
                            match profile.hour_cycle {
                                Some(crate::data::HourCycle::H11) => hour %= 12,
                                Some(crate::data::HourCycle::H12) => {
                                    hour %= 12;
                                    if hour == 0 {
                                        hour = 12;
                                    }
                                }
                                Some(crate::data::HourCycle::H24) if hour == 0 => hour = 24,
                                _ => {}
                            }
                            (Field::Hour, PartKind::Hour, i32::from(hour))
                        }
                        "minute" => (Field::Minute, PartKind::Minute, i32::from(civil.minute)),
                        "second" => (Field::Second, PartKind::Second, i32::from(civil.second)),
                        _ => continue,
                    };
                    let width = format.get(field);
                    let mut text = match width {
                        Some(Value::Width(Width::Numeric)) => self.numbers.numeric(value)?,
                        Some(Value::Width(Width::TwoDigit)) => self.numbers.two_digit(value)?,
                        Some(Value::Width(width)) => {
                            let width = match width {
                                Width::Narrow => TextWidth::Narrow,
                                Width::Short => TextWidth::Short,
                                _ => TextWidth::Long,
                            };
                            match field {
                                Field::Era => self.calendar.names.era.get(width).get(&fields.era),
                                Field::Month => {
                                    let names = if standalone_month {
                                        self.calendar
                                            .names
                                            .month_standalone
                                            .as_ref()
                                            .unwrap_or(&self.calendar.names.month)
                                    } else {
                                        &self.calendar.names.month
                                    };
                                    names.get(width).get(
                                        fields
                                            .month_name_index
                                            .map(usize::from)
                                            .unwrap_or_else(|| (value - 1) as usize),
                                    )
                                }
                                _ => {
                                    let names = if standalone_weekday {
                                        self.locale
                                            .metadata
                                            .weekday_standalone
                                            .as_ref()
                                            .unwrap_or(&self.locale.metadata.weekday)
                                    } else {
                                        &self.locale.metadata.weekday
                                    };
                                    names.get(width).get(value as usize)
                                }
                            }
                            .cloned()
                            .ok_or(Error::InvalidLocaleData)?
                        }
                        _ => String::new(),
                    };
                    if field == Field::Month && fields.leap_month == Some(true) {
                        if let Some(patterns) = &self.calendar.names.leap_month_patterns {
                            let pattern = match width {
                                Some(Value::Width(Width::Numeric | Width::TwoDigit)) => {
                                    &patterns.numeric
                                }
                                Some(Value::Width(width)) => {
                                    let width = match width {
                                        Width::Narrow => TextWidth::Narrow,
                                        Width::Short => TextWidth::Short,
                                        _ => TextWidth::Long,
                                    };
                                    if standalone_month {
                                        patterns.standalone.get(width)
                                    } else {
                                        patterns.format.get(width)
                                    }
                                }
                                _ => return Err(Error::InvalidPattern),
                            };
                            text = pattern.replacen("{0}", &text, 1);
                        }
                    }
                    (kind, text)
                }
            };
            result.push(Part {
                kind,
                value,
                source: None,
            });
        }
        Ok(result)
    }

    fn offset_name(&self, seconds: i32, long: bool) -> Result<String, Error> {
        let minutes = seconds.div_euclid(60);
        let absolute = minutes.unsigned_abs();
        let hours = absolute / 60;
        let minute = absolute % 60;
        let (positive, negative) = self
            .locale
            .metadata
            .hour_format
            .split_once(';')
            .ok_or(Error::InvalidLocaleData)?;
        let mut pattern = if seconds < 0 {
            negative.to_owned()
        } else {
            positive.to_owned()
        };
        let value = if long {
            pattern
                .replacen("HH", &format!("{hours:02}"), 1)
                .replacen('H', &hours.to_string(), 1)
                .replacen("mm", &format!("{minute:02}"), 1)
                .replacen('m', &minute.to_string(), 1)
        } else {
            if minute == 0 {
                if let Some(start) = pattern.find('m') {
                    let begin = pattern[..start]
                        .rfind('H')
                        .map(|index| index + 1)
                        .unwrap_or(start);
                    let end = start
                        + pattern[start..]
                            .chars()
                            .take_while(|character| *character == 'm')
                            .count();
                    pattern.replace_range(begin..end, "");
                }
            }
            replace_run(
                &replace_run(&pattern, 'H', &hours.to_string()),
                'm',
                &format!("{minute:02}"),
            )
        };
        Ok(self
            .locale
            .metadata
            .gmt_format
            .replacen("{0}", &value, 1)
            .replace("\u{200e}\u{200e}", "\u{200e}")
            .replace("\u{200f}\u{200f}", "\u{200f}"))
    }
}
fn replace_run(pattern: &str, character: char, value: &str) -> String {
    let mut result = pattern.to_owned();
    if let Some(start) = pattern.find(character) {
        let length = pattern[start..]
            .chars()
            .take_while(|item| *item == character)
            .count();
        result.replace_range(start..start + length, value);
    }
    result
}

fn day_period(
    metadata: &Metadata,
    mut civil: CivilDateTime,
    width: TextWidth,
    format: Components,
) -> String {
    if format.hour.is_some() {
        if format.minute.is_none() {
            civil.minute = 0;
        }
        if format.second.is_none() {
            civil.second = 0;
        }
        if format.fractional_second_digits.is_none() {
            civil.nanosecond = 0;
        }
    }
    let value = ((u32::from(civil.hour) * 60 + u32::from(civil.minute)) * 60
        + u32::from(civil.second))
        * 1000
        + civil.nanosecond / 1_000_000;
    let rules = metadata.day_period_rules.as_deref().unwrap_or(&[]);
    let rule = rules
        .iter()
        .find(|rule| rule.at == Some(value))
        .or_else(|| {
            rules.iter().find(|rule| match (rule.from, rule.before) {
                (Some(from), Some(before)) => {
                    if from < before {
                        value >= from && value < before
                    } else {
                        value >= from || value < before
                    }
                }
                _ => false,
            })
        });
    rule.and_then(|rule| {
        metadata
            .day_periods
            .as_ref()
            .and_then(|names| names.get(width).get(&rule.name))
    })
    .filter(|name| !name.is_empty())
    .cloned()
    .unwrap_or_else(|| {
        if civil.hour < 12 {
            metadata.am.clone()
        } else {
            metadata.pm.clone()
        }
    })
}

pub struct LocalTime {
    pub civil: CivilDateTime,
    pub fields: CalendarFields,
    pub offset: TimeZoneOffset,
}

pub struct RangeSnapshot {
    locale: Arc<LocaleData>,
    calendar: Arc<CalendarLocale>,
}
impl RangeSnapshot {
    pub fn capture(registry: &Registry, config: &Configuration) -> Result<Self, Error> {
        let locale = registry.get(&config.snapshot.resolution.data_locale)?;
        let calendar = locale.calendar(&config.snapshot.resolution.calendar)?;
        Ok(Self { locale, calendar })
    }

    // Capture before endpoint callbacks; acquire rendering data after both conversions.
    pub fn format(
        &self,
        render: &RenderData,
        config: &Configuration,
        profile: &Profile,
        zone: &TimeZone,
        first: &LocalTime,
        second: &LocalTime,
    ) -> Result<Vec<Part>, Error> {
        const FIELDS: [&str; 10] = [
            "era",
            "year",
            "month",
            "day",
            "ampm",
            "dayPeriod",
            "hour",
            "minute",
            "second",
            "fractionalSecondDigits",
        ];
        let parts = partition(&profile.pattern)?;
        let last = parts
            .iter()
            .filter_map(|part| {
                let Token::Field(name) = part else {
                    return None;
                };
                let name = match *name {
                    "weekday" => "day",
                    "relatedYear" | "yearName" => "year",
                    name => name,
                };
                FIELDS.iter().position(|field| *field == name)
            })
            .max();
        let different = last.and_then(|last| {
            (0..=last).find(|index| {
                let field = FIELDS[*index];
                // Hidden day periods must not override an hour or minute interval.
                if matches!(field, "ampm" | "dayPeriod")
                    && !parts
                        .iter()
                        .any(|part| matches!(part, Token::Field(name) if *name == field))
                {
                    return false;
                }
                let equal = match FIELDS[*index] {
                    "era" => first.fields.era == second.fields.era,
                    "year" => first.fields.year == second.fields.year,
                    "month" => first.fields.month == second.fields.month,
                    "day" => first.fields.day == second.fields.day,
                    "ampm" => (first.civil.hour < 12) == (second.civil.hour < 12),
                    "dayPeriod" => {
                        let width = profile.components.day_period.unwrap_or(TextWidth::Short);
                        day_period(
                            &self.locale.metadata,
                            first.civil,
                            width,
                            profile.components,
                        ) == day_period(
                            &self.locale.metadata,
                            second.civil,
                            width,
                            profile.components,
                        )
                    }
                    "hour" => first.civil.hour == second.civil.hour,
                    "minute" => first.civil.minute == second.civil.minute,
                    "second" => first.civil.second == second.civil.second,
                    _ => {
                        let divisor = 10u32.pow(
                            9 - u32::from(
                                profile
                                    .components
                                    .fractional_second_digits
                                    .map(u8::from)
                                    .unwrap_or(3),
                            ),
                        );
                        first.civil.nanosecond / divisor == second.civil.nanosecond / divisor
                    }
                };
                !equal
            })
        });
        let Some(index) = different else {
            let mut parts = render.pattern(
                config,
                profile,
                &profile.pattern,
                &profile.pattern,
                first,
                zone.data_identifier(),
                profile.components,
            )?;
            for part in &mut parts {
                part.source = Some(Source::Shared);
            }
            return Ok(parts);
        };
        let field = FIELDS[index];
        let selected = profile
            .range_patterns
            .get(field)
            .filter(|selected| {
                // Some combined-style intervals contain only the time pattern.
                ![
                    "{era}",
                    "{year}",
                    "{relatedYear}",
                    "{yearName}",
                    "{month}",
                    "{day}",
                    "{weekday}",
                ]
                .iter()
                .any(|field| {
                    profile.pattern.contains(field)
                        && !selected.pattern_parts.iter().any(|part| {
                            matches!(part.pattern.as_str(), "{0}" | "{1}")
                                || part.pattern.contains(field)
                        })
                })
            })
            .or_else(|| profile.range_patterns.get("default"));
        let fallback;
        let patterns = if let Some(selected) = selected {
            &selected.pattern_parts
        } else {
            fallback = pattern::split_fallback(self.calendar.interval_fallback());
            &fallback
        };
        let expand = |pattern: &str| {
            if matches!(pattern, "{0}" | "{1}") {
                profile.pattern.clone()
            } else {
                pattern.to_owned()
            }
        };
        let context = patterns
            .iter()
            .map(|part| expand(&part.pattern))
            .collect::<String>();
        let expanded;
        let patterns = if let Some(first) = patterns
            .iter()
            .find(|part| matches!(part.pattern.as_str(), "{0}" | "{1}"))
        {
            let mut parts = pattern::split_range(&context);
            if first.source == Source::EndRange {
                for part in &mut parts {
                    part.source = match part.source {
                        Source::StartRange => Source::EndRange,
                        Source::EndRange => Source::StartRange,
                        Source::Shared => Source::Shared,
                    };
                }
            }
            expanded = parts;
            &expanded
        } else {
            patterns
        };
        let mut format = profile.components;
        if let Some(selected) = selected {
            format.month_standalone = selected
                .components
                .month_standalone
                .or(format.month_standalone);
            format.weekday_standalone = selected
                .components
                .weekday_standalone
                .or(format.weekday_standalone);
            for field in Field::ALL {
                if selected.components.get(field).is_some() {
                    format.set_from(field, selected.components);
                }
            }
        }
        let mut result = Vec::new();
        for part in patterns {
            let pattern = expand(&part.pattern);
            if !pattern.contains('{') {
                result.push(Part {
                    kind: PartKind::Literal,
                    value: pattern,
                    source: Some(part.source),
                });
                continue;
            }
            let local = if part.source == Source::EndRange {
                second
            } else {
                first
            };
            let mut parts = render.pattern(
                config,
                profile,
                &pattern,
                &context,
                local,
                zone.data_identifier(),
                format,
            )?;
            for item in &mut parts {
                item.source = Some(part.source);
            }
            result.extend(parts);
        }
        Ok(result)
    }
}

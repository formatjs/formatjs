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
    Unknown,
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
// ECMA-402 §§6.10 and 9.2.15 split pattern strings into literal and field parts.
// https://tc39.es/ecma402/#sec-pattern-string-types
// https://tc39.es/ecma402/#sec-partitionpattern
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

// ECMA-402 §11.5.4 step 15.f.iv applies to every calendar.
// https://tc39.es/ecma402/#sec-formatdatetimepattern
fn display_year(year: i32) -> Result<i32, Error> {
    if year <= 0 {
        1_i32.checked_sub(year).ok_or(Error::InvalidDate)
    } else {
        Ok(year)
    }
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
            zone,
            profile.components,
        )
    }

    // ECMA-402 §11.5.11. https://tc39.es/ecma402/#sec-tolocaltime
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
            epoch_nanoseconds,
            civil,
            fields,
            offset,
        })
    }

    // ECMA-402 §11.5.4. https://tc39.es/ecma402/#sec-formatdatetimepattern
    pub fn pattern(
        &self,
        _config: &Configuration,
        profile: &Profile,
        pattern: &str,
        context: &str,
        local: &LocalTime,
        zone: &TimeZone,
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
                // ECMA-402 §11.5.4 step 15.b preserves the CLDR literal verbatim.
                // The pinned hanidec test expects ASCII space before AM. CLDR uses U+202F.
                // https://github.com/tc39/test262/issues/3711
                Token::Literal(value) => (PartKind::Literal, value.into()),
                Token::Field("fractionalSecondDigits") => {
                    // ECMA-402 §11.5.4 step 15.c truncates local milliseconds.
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
                    let data_zone = zone.data_identifier();
                    let width = format.time_zone_name.unwrap_or(ZoneWidth::Short);
                    let zone_names = if local.epoch_nanoseconds >= 0 || data_zone == "UTC" {
                        self.locale.metadata.time_zone_name.get(data_zone)
                    } else {
                        None
                    };
                    let generic = zone_names.and_then(|names| match width {
                        ZoneWidth::ShortGeneric => names.short_generic.as_ref(),
                        ZoneWidth::LongGeneric => names.long_generic.as_ref(),
                        _ => None,
                    });
                    let names = zone_names.and_then(|names| match width {
                        ZoneWidth::Short => names.short.as_ref(),
                        ZoneWidth::Long => names.long.as_ref(),
                        _ => None,
                    });
                    let specific = self.locale.metadata.time_zone_name.get(data_zone).and_then(
                        |names| match (width, in_dst) {
                            (ZoneWidth::Long, false) => names.long_standard.as_ref(),
                            (ZoneWidth::Long, true) => names.long_daylight.as_ref(),
                            (ZoneWidth::Short, false) => names.short_standard.as_ref(),
                            (ZoneWidth::Short, true) => names.short_daylight.as_ref(),
                            _ => None,
                        },
                    );
                    let name = specific
                        .filter(|name| !name.is_empty())
                        .or_else(|| generic.filter(|name| !name.is_empty()))
                        .or_else(|| {
                            let names = names?;
                            let name = &names[usize::from(in_dst)];
                            (!(name.is_empty() || in_dst && names[0] == names[1])).then_some(name)
                        });
                    let value = if let Some(name) = name {
                        name.clone()
                    } else {
                        // ECMA-402 §11.5.4 step 15.e.iv falls back to [[TimeZone]].
                        // https://tc39.es/ecma402/#sec-formatdatetimepattern
                        self.offset_name(
                            offset_seconds,
                            matches!(
                                width,
                                ZoneWidth::Long | ZoneWidth::LongGeneric | ZoneWidth::LongOffset
                            ),
                        )?
                        .unwrap_or_else(|| zone.identifier().to_owned())
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
                Token::Field("yearName") => {
                    // ECMA-402 §11.5.4 step 15.i requires a string. LDML uses
                    // the numeric year when the cyclic label is missing.
                    // https://tc39.es/ecma402/#sec-formatdatetimepattern
                    // https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
                    let name = self.calendar.names.year_names.as_ref().and_then(|names| {
                        fields
                            .year_name
                            .and_then(|index| names.get(usize::from(index)))
                    });
                    let value = match name {
                        Some(name) => name.clone(),
                        None => self.numbers.numeric(display_year(fields.year)?)?,
                    };
                    (PartKind::YearName, value)
                }
                Token::Field(name) => {
                    let (field, kind, value) = match name {
                        "weekday" => (Field::Weekday, PartKind::Weekday, i32::from(civil.weekday)),
                        "era" => (Field::Era, PartKind::Era, 0),
                        "year" => (Field::Year, PartKind::Year, display_year(fields.year)?),
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
                        _ => {
                            // ECMA-402 §11.5.4, step 15.j.
                            result.push(Part {
                                kind: PartKind::Unknown,
                                value: format!("{name}:{}", local.epoch_nanoseconds),
                                source: None,
                            });
                            continue;
                        }
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
                            // ECMA-402 §11.5.4 step 15.f.x.i uses the field value
                            // when its localized representation is missing.
                            // https://tc39.es/ecma402/#sec-formatdatetimepattern
                            .unwrap_or_else(|| {
                                if field == Field::Era {
                                    fields.era.clone()
                                } else {
                                    value.to_string()
                                }
                            })
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

    // ECMA-402 §11.5.4 step 15.e.iv uses the localized time-zone representation.
    // Reuse the selected decimal digits and apply LDML short/long GMT widths.
    // https://tc39.es/ecma402/#sec-formatdatetimepattern
    // https://unicode.org/reports/tr35/tr35-dates.html#Time_Zone_Format_Terminology
    fn offset_name(&self, seconds: i32, long: bool) -> Result<Option<String>, Error> {
        let absolute = seconds.unsigned_abs();
        let hours = absolute / 3600;
        let minute = absolute / 60 % 60;
        let second = absolute % 60;
        let gmt_format = &self.locale.metadata.gmt_format;
        let Some(pattern) = self
            .locale
            .metadata
            .hour_format
            .split(';')
            .nth(usize::from(seconds < 0))
        else {
            return Ok(None);
        };
        let Some(hour_end) = pattern.rfind('H').map(|index| index + 1) else {
            return Ok(None);
        };
        let minute_start = pattern.find('m');
        if !gmt_format.contains("{0}")
            || (long || minute != 0 || second != 0) && minute_start.is_none()
            || minute_start.is_some_and(|start| start < hour_end)
        {
            return Ok(None);
        }
        let mut pattern = pattern.to_owned();
        if let Some(start) = minute_start {
            let end = start
                + pattern[start..]
                    .bytes()
                    .take_while(|value| *value == b'm')
                    .count();
            if second != 0 {
                let seconds_pattern = format!("{}ss", &pattern[hour_end..start]);
                pattern.insert_str(end, &seconds_pattern);
            } else if !long && minute == 0 {
                pattern.replace_range(hour_end..end, "");
            }
        }
        let formatted_hours = if long {
            self.numbers.two_digit(hours as i32)?
        } else {
            self.numbers.numeric(hours as i32)?
        };
        let mut value = replace_run(&pattern, 'H', &formatted_hours);
        if long || minute != 0 || second != 0 {
            value = replace_run(&value, 'm', &self.numbers.two_digit(minute as i32)?);
        }
        if second != 0 {
            value = replace_run(&value, 's', &self.numbers.two_digit(second as i32)?);
        }
        Ok(Some(
            gmt_format
                .replacen("{0}", &value, 1)
                .replace("\u{200e}\u{200e}", "\u{200e}")
                .replace("\u{200f}\u{200f}", "\u{200f}"),
        ))
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

// ECMA-402 §11.5.12: calendar fields and civil time from the resolved offset.
// https://tc39.es/ecma402/#sec-datetimeformat-tolocaltime-records
pub struct LocalTime {
    pub epoch_nanoseconds: i128,
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

    // ECMA-402 §11.5.8 compares the local endpoints, then expands a range pattern.
    // https://tc39.es/ecma402/#sec-partitiondatetimerangepattern
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
        // ECMA-402 §11.5.8 step 15 follows Table 6. The default row is fallback only.
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
                        // Step 15.d.iii compares localized stand-alone periods too.
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
        // ECMA-402 §11.5.8 step 16 collapses equal ranges into shared parts.
        let Some(index) = different else {
            let mut parts = render.pattern(
                config,
                profile,
                &profile.pattern,
                &profile.pattern,
                first,
                zone,
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
        // Step 18.a uses the default only when no field interval applies.
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
        // ECMA-402 §11.5.8 steps 19.b–f preserve the fallback records' sources.
        // https://tc39.es/ecma402/#sec-partitiondatetimerangepattern
        let patterns = if let Some(first) = selected.and_then(|interval| {
            interval
                .pattern_parts
                .iter()
                .find(|part| matches!(part.pattern.as_str(), "{0}" | "{1}"))
        }) {
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
            let mut parts =
                render.pattern(config, profile, &pattern, &context, local, zone, format)?;
            for item in &mut parts {
                item.source = Some(part.source);
            }
            result.extend(parts);
        }
        Ok(result)
    }
}

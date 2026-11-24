use crate::{
    Error,
    data::CalendarLocale,
    fields::{Components, Field, Value, Width, ZoneWidth},
    pattern::{self, Format, RangePattern, Source},
};
use serde::{Deserialize, Serialize};

// ECMA-402 §11.5.2 steps 10.b.vii.5–9 clamp and score the width delta.
// https://tc39.es/ecma402/#sec-basicformatmatcher
fn delta_penalty(delta: i32) -> i32 {
    match delta.clamp(-2, 2) {
        2 => 6,
        1 => 3,
        -1 => 6,
        -2 => 8,
        _ => 0,
    }
}
// ECMA-402 §11.5.2 step 10.b.vi scores zone names and offsets separately.
// https://tc39.es/ecma402/#sec-basicformatmatcher
fn zone_penalty(requested: ZoneWidth, actual: ZoneWidth) -> i32 {
    use ZoneWidth::*;
    match (requested, actual) {
        (Short | ShortGeneric, ShortOffset) => 1,
        (Short | ShortGeneric, LongOffset) => 4,
        (Short, Long) | (ShortGeneric, LongGeneric) | (ShortOffset, LongOffset) => 3,
        (Long | LongGeneric, LongOffset) => 1,
        (Long | LongGeneric, ShortOffset) => 9,
        (Long, Short) | (LongGeneric, ShortGeneric) | (LongOffset, ShortOffset) => 8,
        (a, b) if a == b => 0,
        _ => 120,
    }
}
// LDML matching skeletons allow adding precision to a seconds pattern.
// https://unicode.org/reports/tr35/tr35-dates.html#Matching_Skeletons
fn with_requested_precision(options: Components, mut format: Components) -> Components {
    if format.second.is_some() && format.fractional_second_digits.is_none() {
        format.fractional_second_digits = options.fractional_second_digits;
    }
    format
}

// ECMA-402 §11.5.2 steps 1–7 and 10.a–b set the penalties and score Table 16 fields.
// https://tc39.es/ecma402/#sec-basicformatmatcher
pub fn basic_score(options: Components, format: Components) -> i32 {
    let format = with_requested_precision(options, format);
    let mut score = 0;
    for field in Field::ALL {
        match (options.get(field), format.get(field)) {
            (None, Some(_)) => score -= 20,
            (Some(_), None) => score -= 120,
            (Some(Value::Zone(requested)), Some(Value::Zone(actual))) => {
                score -= zone_penalty(requested, actual)
            }
            (Some(requested), Some(actual)) if requested != actual => {
                let delta = if let (Value::Fraction(requested), Value::Fraction(actual)) =
                    (requested, actual)
                {
                    i32::from(u8::from(actual)) - i32::from(u8::from(requested))
                } else {
                    actual.index() - requested.index()
                };
                score -= delta_penalty(delta);
            }
            _ => {}
        }
    }
    score
}
pub fn best_fit_score(options: Components, format: Components) -> i32 {
    let format = with_requested_precision(options, format);
    let mut score = 0;
    if options.hour.is_some() {
        if options.hour12 == Some(true) && format.hour12 != Some(true) {
            score -= 120;
        } else if options.hour12 != Some(true) && format.hour12 == Some(true) {
            score -= 20;
        }
    }
    for field in Field::ALL {
        match (options.get(field), format.get(field)) {
            (None, Some(_)) => score -= 20,
            (Some(_), None) => score -= 120,
            (Some(requested), Some(actual)) if requested != actual => {
                score -= if requested.numeric() != actual.numeric() {
                    15
                } else {
                    delta_penalty(actual.index() - requested.index())
                };
            }
            _ => {}
        }
    }
    score
}
fn best<'a, I>(
    options: Components,
    formats: I,
    score: fn(Components, Components) -> i32,
    best_fit: bool,
) -> Result<&'a Format, Error>
where
    I: IntoIterator<Item = &'a Format>,
    I::IntoIter: Clone,
{
    let formats = formats.into_iter();
    // ECMA-402 §11.5.5 steps 5–6 select the layout for the resolved hour cycle.
    // CLDR stores the 12-hour and 24-hour layouts as separate candidates.
    // https://tc39.es/ecma402/#sec-partitiondatetimepattern
    let hour_cycle_matches =
        |fields: Components| (fields.hour12 == Some(true)) == (options.hour12 == Some(true));
    let select_hour_cycle = options.hour.is_some()
        && options.hour12.is_some()
        && formats.clone().any(|format| {
            format.pattern_fields.hour.is_some() && hour_cycle_matches(format.pattern_fields)
        });
    // ECMA-402 §11.5.2 steps 8–10 initialize scores and visit formats in order.
    // https://tc39.es/ecma402/#sec-basicformatmatcher
    let mut best = None;
    let mut best_score = i32::MIN;
    for format in formats {
        if select_hour_cycle
            && format.pattern_fields.hour.is_some()
            && !hour_cycle_matches(format.pattern_fields)
        {
            continue;
        }
        // ECMA-402 §11.5.2 step 10.b.iii reads the format record's actual widths.
        // https://tc39.es/ecma402/#sec-basicformatmatcher
        let fields = if best_fit {
            format.components
        } else {
            format.pattern_fields
        };
        // Step 10.c keeps the first format on a tie. Best fit can prefer a month width.
        let score = score(options, fields);
        if score > best_score
            || (best_fit
                && score == best_score
                && options.month.is_some()
                && format.components.month == options.month
                && best.is_some_and(|best: &Format| best.components.month != options.month))
        {
            best = Some(format);
            best_score = score;
        }
    }
    best.ok_or(Error::MissingFormats)
}
// ECMA-402 §11.5.2. https://tc39.es/ecma402/#sec-basicformatmatcher
pub fn basic(options: Components, formats: &[Format]) -> Result<Format, Error> {
    Ok(with_pattern_fields(best(
        options,
        formats,
        basic_score,
        false,
    )?))
}
// ECMA-402 §11.5.3. https://tc39.es/ecma402/#sec-bestfitformatmatcher
pub fn best_fit(options: Components, formats: &[Format]) -> Result<Format, Error> {
    let selected = best(options, formats, best_fit_score, true)?;
    adjust_best_fit(options, selected)
}
fn with_pattern_fields(selected: &Format) -> Format {
    let mut result = selected.clone();
    result.components = selected.pattern_fields;
    result.fields_mask = selected.pattern_fields_mask;
    result
}

fn adjust_best_fit(options: Components, selected: &Format) -> Result<Format, Error> {
    let mut result = with_pattern_fields(selected);
    for field in Field::ALL {
        if matches!(field, Field::Minute | Field::Second) {
            continue;
        }
        let Some(requested) = options.get(field) else {
            continue;
        };
        let skeleton = selected.components.get(field);
        let pattern = selected.pattern_fields.get(field);
        if field == Field::Month
            && skeleton.is_some_and(Value::numeric)
            && requested.numeric()
            && !pattern.is_some_and(Value::numeric)
        {
            continue;
        }
        if pattern.is_some_and(Value::numeric) && !requested.numeric() {
            continue;
        }
        if skeleton == Some(requested) {
            continue;
        }
        // Adjust only fields present in the selected skeleton, matching for-in.
        if selected.fields_mask & field.bit() != 0 {
            result.components.set_from(field, options);
            result.fields_mask |= field.bit();
        }
    }
    if selected.components.hour12.is_some()
        && options.hour12 == Some(true)
        && selected.components.hour12 != options.hour12
    {
        result.components.hour12 = Some(true);
    }
    Ok(result)
}
#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Style {
    Full,
    Long,
    Medium,
    Short,
}
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Styles<T> {
    pub full: T,
    pub long: T,
    pub medium: T,
    pub short: T,
}
impl<T> Styles<T> {
    pub fn get(&self, style: Style) -> &T {
        match style {
            Style::Full => &self.full,
            Style::Long => &self.long,
            Style::Medium => &self.medium,
            Style::Short => &self.short,
        }
    }
}
#[derive(Debug, Clone, Serialize)]
// ECMA-402 §§11.2.3.5–7: date/time style records and connector strings.
// https://tc39.es/ecma402/#sec-datetimeformat-styles-record
// https://tc39.es/ecma402/#sec-datetimeformat-style-record
// https://tc39.es/ecma402/#sec-datetimeformat-connector-record
pub struct StyleData {
    pub date: Styles<Format>,
    pub time: Styles<Format>,
    pub connector: Styles<String>,
    #[serde(rename = "rangeConnector")]
    pub range_connector: Styles<String>,
}

// LDML combines missing skeleton fields with a locale connector. A zone can
// supply the time side without introducing clock fields.
// https://unicode.org/reports/tr35/tr35-dates.html#Missing_Skeleton_Fields
// https://github.com/formatjs/formatjs/issues/8039
fn date_with_time_zone(
    options: Components,
    formats: &[Format],
    calendar: &CalendarLocale,
    best_fit: bool,
) -> Result<Option<Format>, Error> {
    let Some(zone) = options.time_zone_name else {
        return Ok(None);
    };
    let has_clock = |fields: Components| {
        fields.hour.is_some()
            || fields.minute.is_some()
            || fields.second.is_some()
            || fields.day_period.is_some()
            || fields.fractional_second_digits.is_some()
    };
    if has_clock(options) {
        return Ok(None);
    }
    let dates = formats
        .iter()
        .filter(|f| !has_clock(f.components) && f.components.time_zone_name.is_none());
    let score = if best_fit {
        best_fit_score
    } else {
        basic_score
    };
    let Ok(selected) = best(options, dates, score, best_fit) else {
        return Ok(None);
    };
    let mut format = if best_fit {
        adjust_best_fit(options, selected)?
    } else {
        with_pattern_fields(selected)
    };
    let style = match format.components.month {
        Some(Width::Long) if format.components.weekday.is_some() => Style::Full,
        Some(Width::Long) => Style::Long,
        Some(Width::Short) => Style::Medium,
        _ => Style::Short,
    };
    format.pattern = calendar
        .styles()?
        .connector
        .get(style)
        .replacen("{0}", "{timeZoneName}", 1)
        .replacen("{1}", &format.pattern, 1);
    format.pattern12 = format.pattern.clone();
    format.components.time_zone_name = Some(zone);
    format.fields_mask |= Field::TimeZoneName.bit();
    // The synthesized pattern uses the widths already selected for the date.
    // https://tc39.es/ecma402/#sec-bestfitformatmatcher
    format.pattern_fields = format.components;
    format.pattern_fields_mask = format.fields_mask;
    // Date-only interval records do not include the zone.
    format.range_patterns.clear();
    format.range_patterns12.clear();
    Ok(Some(format))
}

pub(crate) fn match_components(
    options: Components,
    formats: &[Format],
    calendar: &CalendarLocale,
    best_fit: bool,
) -> Result<Format, Error> {
    let Some(supplemental) = date_with_time_zone(options, formats, calendar, best_fit)? else {
        return if best_fit {
            self::best_fit(options, formats)
        } else {
            basic(options, formats)
        };
    };
    // ECMA-402 §11.5.2 step 10.c keeps the first format on a tie.
    // https://tc39.es/ecma402/#sec-basicformatmatcher
    let candidates = formats.iter().chain(std::iter::once(&supplemental));
    if best_fit {
        adjust_best_fit(options, best(options, candidates, best_fit_score, true)?)
    } else {
        Ok(with_pattern_fields(best(
            options,
            candidates,
            basic_score,
            false,
        )?))
    }
}
// ECMA-402 §11.5.1. https://tc39.es/ecma402/#sec-date-time-style-format
pub fn style(
    date: Option<Style>,
    time: Option<Style>,
    data: &StyleData,
    formats: &[Format],
    hour12: Option<bool>,
) -> Result<Format, Error> {
    let time_format = time
        .map(|style| {
            let format = data.time.get(style);
            if hour12.is_none()
                || (hour12 == Some(true)) == (format.components.hour12 == Some(true))
            {
                Ok(format.clone())
            } else {
                let mut options = format.components;
                options.hour12 = hour12;
                best_fit(options, formats)
            }
        })
        .transpose()?;
    match (date, time_format) {
        (Some(date), Some(time)) => {
            let mut result = data.date.get(date).clone();
            for field in Field::ALL {
                if time.fields_mask & field.bit() != 0 {
                    result.components.set_from(field, time.components);
                }
            }
            if time.components.hour12.is_some() {
                result.components.hour12 = time.components.hour12;
            }
            result.fields_mask |= time.fields_mask;
            result.raw_pattern = time.raw_pattern;
            result.skeleton = time.skeleton;
            result.pattern_fields = time.pattern_fields;
            result.pattern_fields_mask = time.pattern_fields_mask;
            result.pattern = data
                .connector
                .get(date)
                .replacen("{0}", &time.pattern, 1)
                .replacen("{1}", &result.pattern, 1);
            result.pattern12 = data
                .connector
                .get(date)
                .replacen("{0}", &time.pattern12, 1)
                .replacen("{1}", &data.date.get(date).pattern, 1);
            let date_format = data.date.get(date);
            let mut range_date = date_format.clone();
            if date == Style::Medium
                && date_format
                    .components
                    .month
                    .map(Value::Width)
                    .is_some_and(Value::numeric)
            {
                if let Some(format) = formats.iter().find(|format| format.skeleton == "yMd") {
                    range_date.pattern = format.pattern.clone();
                }
            }
            // ECMA-402 §§11.2.3.8–10: combine date and time style intervals and their fields.
            // https://tc39.es/ecma402/#sec-datetimeformat-date-range-record
            // https://tc39.es/ecma402/#sec-datetimeformat-time-range-record
            // https://tc39.es/ecma402/#sec-datetimeformat-style-range-record
            let combine = |ranges: std::collections::BTreeMap<String, RangePattern>,
                           time_pattern: &str| {
                ranges
                    .into_iter()
                    .filter(|(field, _)| {
                        !matches!(field.as_str(), "era" | "year" | "month" | "day")
                    })
                    .map(|(field, mut range)| {
                        let reversed = range
                            .pattern_parts
                            .iter()
                            .find(|part| part.source != Source::Shared)
                            .is_some_and(|part| part.source == Source::EndRange);
                        if field == "default" {
                            let endpoint = data
                                .connector
                                .get(date)
                                .replace("{0}", time_pattern)
                                .replace("{1}", &range_date.pattern);
                            let combined = range
                                .pattern_parts
                                .iter()
                                .map(|part| {
                                    if part.pattern == "{0}" || part.pattern == "{1}" {
                                        endpoint.as_str()
                                    } else {
                                        part.pattern.as_str()
                                    }
                                })
                                .collect::<String>();
                            range.pattern_parts = pattern::split_range(&combined);
                        } else {
                            let time_pattern = range
                                .pattern_parts
                                .iter()
                                .map(|part| part.pattern.as_str())
                                .collect::<String>();
                            let combined = data
                                .range_connector
                                .get(date)
                                .replacen("{0}", &time_pattern, 1)
                                .replacen("{1}", &range_date.pattern, 1);
                            range.pattern_parts = pattern::split_range(&combined);
                        }
                        if reversed {
                            for part in &mut range.pattern_parts {
                                part.source = match part.source {
                                    Source::StartRange => Source::EndRange,
                                    Source::EndRange => Source::StartRange,
                                    Source::Shared => Source::Shared,
                                };
                            }
                        }
                        for date_field in Field::ALL {
                            if range.components.get(date_field).is_none() {
                                range.components.set_from(date_field, range_date.components);
                            }
                        }
                        range.components.month_standalone = range
                            .components
                            .month_standalone
                            .or(range_date.components.month_standalone);
                        range.components.weekday_standalone = range
                            .components
                            .weekday_standalone
                            .or(range_date.components.weekday_standalone);
                        (field, range)
                    })
                    .collect()
            };
            result.range_patterns = combine(time.range_patterns, &time.pattern);
            result.range_patterns12 = combine(time.range_patterns12, &time.pattern12);
            Ok(result)
        }
        (Some(date), None) => Ok(data.date.get(date).clone()),
        (None, Some(time)) => Ok(time),
        _ => Err(Error::MissingFormats),
    }
}

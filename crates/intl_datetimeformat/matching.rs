use crate::{
    Error,
    fields::{Components, Field, Value, ZoneWidth},
    pattern::{self, Format, RangePattern, Source},
};
use serde::{Deserialize, Serialize};

fn delta_penalty(delta: i32) -> i32 {
    match delta.clamp(-2, 2) {
        2 => 6,
        1 => 3,
        -1 => 6,
        -2 => 8,
        _ => 0,
    }
}
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
pub fn basic_score(options: Components, format: Components) -> i32 {
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
fn best<'a>(
    options: Components,
    formats: &'a [Format],
    score: fn(Components, Components) -> i32,
    prefer_month: bool,
) -> Result<&'a Format, Error> {
    let mut best = None;
    let mut best_score = i32::MIN;
    for format in formats {
        let score = score(options, format.components);
        if score > best_score
            || (prefer_month
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
pub fn basic(options: Components, formats: &[Format]) -> Result<Format, Error> {
    Ok(best(options, formats, basic_score, false)?.clone())
}
pub fn best_fit(options: Components, formats: &[Format]) -> Result<Format, Error> {
    let selected = best(options, formats, best_fit_score, true)?;
    let mut result = selected.clone();
    result.components = selected.pattern_fields;
    result.fields_mask = selected.pattern_fields_mask;
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
pub struct StyleData {
    pub date: Styles<Format>,
    pub time: Styles<Format>,
    pub connector: Styles<String>,
    #[serde(rename = "rangeConnector")]
    pub range_connector: Styles<String>,
}
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

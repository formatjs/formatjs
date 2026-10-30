use crate::{
    Error,
    fields::{Field, Value},
    matching::{StyleData, Styles},
    pattern::{self, Format, RawPatterns},
};
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IntervalFormats {
    pub interval_format_fallback: String,
    #[serde(flatten)]
    pub patterns: RawPatterns<RawPatterns>,
}

impl IntervalFormats {
    fn exact(&self, skeleton: &str) -> Option<&RawPatterns> {
        self.patterns
            .0
            .iter()
            .find(|(key, _)| key == skeleton)
            .map(|(_, value)| value)
    }

    pub fn find(&self, skeleton: &str) -> Result<Option<&RawPatterns>, Error> {
        if let Some((date, time)) = skeleton.split_once(", ") {
            let mut canonical = String::new();
            for character in time.chars() {
                if character.is_ascii_alphabetic()
                    && !matches!(character, 'a' | 'b' | 'B')
                    && !canonical.ends_with(character)
                {
                    canonical.push(character);
                }
            }
            if let Some(value) = self.exact(&format!("{date}, {canonical}")) {
                return Ok(Some(value));
            }
        }
        let target = pattern::process(skeleton)?.fields;
        if target.hour.is_some()
            || target.minute.is_some()
            || target.second.is_some()
            || target.day_period.is_some()
            || target.time_zone_name.is_some()
        {
            return Ok(None);
        }
        for (key, value) in &self.patterns.0 {
            let candidate = pattern::process(key)?.fields;
            if target.month.map(Value::Width).is_some_and(Value::numeric)
                != candidate
                    .month
                    .map(Value::Width)
                    .is_some_and(Value::numeric)
            {
                continue;
            }
            if Field::ALL
                .into_iter()
                .all(|field| target.get(field).is_some() == candidate.get(field).is_some())
            {
                return Ok(Some(value));
            }
        }
        Ok(None)
    }

    fn parse(&self, skeleton: &str, raw: &str, exact: bool) -> Result<Format, Error> {
        let ranges = if exact { self.exact(skeleton) } else { None };
        let ranges = match ranges {
            Some(value) => Some(value),
            None => self.find(skeleton)?,
        };
        pattern::parse(
            skeleton,
            raw,
            ranges.unwrap_or(&RawPatterns::default()),
            Some(&self.interval_format_fallback),
        )
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarPatterns {
    pub formats: RawPatterns,
    pub date_format: Styles<String>,
    pub time_format: Styles<String>,
    pub date_time_format: Styles<String>,
    pub interval_formats: IntervalFormats,
}

impl CalendarPatterns {
    pub fn formats(&self) -> Result<Vec<Format>, Error> {
        self.formats
            .0
            .iter()
            .map(|(skeleton, raw)| self.interval_formats.parse(skeleton, raw, true))
            .collect()
    }

    pub fn styles(&self) -> Result<StyleData, Error> {
        let parse = |raw: &Styles<String>| -> Result<Styles<Format>, Error> {
            Ok(Styles {
                full: self.interval_formats.parse(&raw.full, &raw.full, false)?,
                long: self.interval_formats.parse(&raw.long, &raw.long, false)?,
                medium: self
                    .interval_formats
                    .parse(&raw.medium, &raw.medium, false)?,
                short: self.interval_formats.parse(&raw.short, &raw.short, false)?,
            })
        };
        let connector = &self.date_time_format;
        Ok(StyleData {
            date: parse(&self.date_format)?,
            time: parse(&self.time_format)?,
            connector: Styles {
                full: pattern::process(&connector.full)?.pattern,
                long: pattern::process(&connector.long)?.pattern,
                medium: pattern::process(&connector.medium)?.pattern,
                short: pattern::process(&connector.short)?.pattern,
            },
        })
    }
}

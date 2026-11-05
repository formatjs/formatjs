use crate::{
    Error,
    fields::{Components, Field, Value},
    matching::{StyleData, Styles},
    pattern::{self, Format, RawPatterns},
};
use serde::Deserialize;
use std::{
    collections::{HashMap, HashSet},
    sync::OnceLock,
};

#[derive(Debug, Clone, Default, Deserialize)]
pub struct IntervalFormatTemplates {
    pub dates: Vec<(String, String, String, String)>,
    pub times: Vec<(String, String, RawPatterns)>,
}

#[derive(Debug, Clone)]
struct IntervalCandidate {
    index: usize,
    fields: Components,
    context: Components,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IntervalFormats {
    pub interval_format_fallback: String,
    #[serde(flatten)]
    pub patterns: RawPatterns<RawPatterns>,
    #[serde(skip)]
    lookup: OnceLock<HashMap<String, usize>>,
    #[serde(skip)]
    candidates: OnceLock<Result<Vec<IntervalCandidate>, Error>>,
    #[serde(skip)]
    groups: OnceLock<HashMap<u16, Vec<usize>>>,
}

fn interval_signature(fields: Components) -> u16 {
    let mask = Field::ALL.into_iter().fold(0, |mask, field| {
        mask | if fields.get(field).is_some() {
            field.bit()
        } else {
            0
        }
    });
    mask | if fields.hour12 == Some(true) {
        1 << 14
    } else {
        0
    } | if fields.month.map(Value::Width).is_some_and(Value::numeric) {
        1 << 15
    } else {
        0
    }
}

impl IntervalFormats {
    fn expand_templates(&self, templates: &IntervalFormatTemplates) -> Self {
        let mut patterns = self.patterns.0.clone();
        let mut keys: HashSet<_> = patterns.iter().map(|(key, _)| key.clone()).collect();
        for (time_key, time, time_ranges) in &templates.times {
            for (date_key, date, connector, fallback_connector) in &templates.dates {
                let key = connector
                    .replacen("{0}", time_key, 1)
                    .replacen("{1}", date_key, 1);
                if !keys.insert(key.clone()) {
                    continue;
                }
                let mut ranges = Vec::new();
                for (field, raw) in &time_ranges.0 {
                    let (pattern, reversed) = pattern::range_pattern_info(raw);
                    let combined = connector
                        .replacen("{0}", pattern, 1)
                        .replacen("{1}", date, 1);
                    let value = match reversed {
                        Some(true) => format!("latestFirst:{combined}"),
                        Some(false) => format!("earliestFirst:{combined}"),
                        None => combined,
                    };
                    ranges.push((field.clone(), value));
                }
                let endpoint = fallback_connector
                    .replacen("{0}", time, 1)
                    .replacen("{1}", date, 1);
                ranges.push((
                    "date".into(),
                    self.interval_format_fallback
                        .replacen("{0}", &endpoint, 1)
                        .replacen("{1}", &endpoint, 1),
                ));
                patterns.push((key, RawPatterns(ranges)));
            }
        }
        Self {
            interval_format_fallback: self.interval_format_fallback.clone(),
            patterns: RawPatterns(patterns),
            lookup: OnceLock::new(),
            candidates: OnceLock::new(),
            groups: OnceLock::new(),
        }
    }
    fn exact(&self, skeleton: &str) -> Option<&RawPatterns> {
        let lookup = self.lookup.get_or_init(|| {
            self.patterns
                .0
                .iter()
                .enumerate()
                .map(|(index, (key, _))| (key.clone(), index))
                .collect()
        });
        lookup.get(skeleton).map(|index| &self.patterns.0[*index].1)
    }

    pub fn find(&self, skeleton: &str, raw: &str) -> Result<Option<&RawPatterns>, Error> {
        if let Some((date, time)) = skeleton.split_once(", ") {
            let mut canonical = String::new();
            for character in time.chars() {
                if character.is_ascii_alphabetic()
                    && !matches!(character, 'a' | 'b')
                    && !canonical.ends_with(character)
                {
                    canonical.push(character);
                }
            }
            if let Some(value) = self.exact(&format!("{date}, {canonical}")) {
                return Ok(Some(value));
            }
        }
        let target = pattern::process(raw)?.fields;
        let mut best = None;
        let mut best_score = usize::MAX;
        let candidates = self
            .candidates
            .get_or_init(|| {
                self.patterns
                    .0
                    .iter()
                    .enumerate()
                    .filter(|(_, (_, value))| !value.0.is_empty())
                    .map(|(index, (key, value))| {
                        Ok(IntervalCandidate {
                            index,
                            fields: pattern::process(key)?.fields,
                            context: pattern::process(
                                pattern::range_pattern_info(&value.0[0].1).0,
                            )?
                            .fields,
                        })
                    })
                    .collect()
            })
            .as_ref()
            .map_err(|error| *error)?;
        let groups = self.groups.get_or_init(|| {
            let mut groups: HashMap<u16, Vec<usize>> = HashMap::new();
            for (index, entry) in candidates.iter().enumerate() {
                groups
                    .entry(interval_signature(entry.fields))
                    .or_default()
                    .push(index);
            }
            groups
        });
        for index in groups
            .get(&interval_signature(target))
            .into_iter()
            .flatten()
        {
            let entry = &candidates[*index];
            let candidate = entry.fields;
            let value = &self.patterns.0[entry.index].1;
            if target.weekday_standalone == Some(true)
                && entry.context.weekday_standalone == Some(false)
            {
                continue;
            }
            if (target.hour12 == Some(true)) != (candidate.hour12 == Some(true)) {
                continue;
            }
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
                let score = Field::ALL
                    .into_iter()
                    .map(|field| {
                        if field == Field::TimeZoneName || target.get(field) == candidate.get(field)
                        {
                            0
                        } else if field == Field::Month {
                            2
                        } else {
                            1
                        }
                    })
                    .sum();
                if score < best_score {
                    best = Some(value);
                    best_score = score;
                }
            }
        }
        Ok(best)
    }

    fn parse(&self, skeleton: &str, raw: &str, exact: bool) -> Result<Format, Error> {
        let ranges = self.find(skeleton, raw)?;
        let mut format = pattern::parse(
            skeleton,
            raw,
            ranges.unwrap_or(&RawPatterns::default()),
            Some(&self.interval_format_fallback),
        )?;
        if !exact {
            for ranges in [&mut format.range_patterns, &mut format.range_patterns12] {
                for (key, range) in ranges.iter_mut() {
                    if key != "default" {
                        continue;
                    }
                    for field in Field::ALL {
                        if format.components.get(field).is_some() {
                            range.components.set_from(field, format.components);
                        }
                    }
                }
            }
        }
        Ok(format)
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarPatterns {
    pub formats: RawPatterns,
    pub date_format: Styles<String>,
    pub time_format: Styles<String>,
    pub date_time_format: Styles<String>,
    pub date_time_format_at_time: Option<Styles<String>>,
    pub interval_formats: IntervalFormats,
    #[serde(default)]
    pub interval_format_templates: IntervalFormatTemplates,
    #[serde(skip)]
    pub(crate) expanded: OnceLock<IntervalFormats>,
}

impl CalendarPatterns {
    fn intervals(&self) -> &IntervalFormats {
        if self.interval_format_templates.dates.is_empty() {
            return &self.interval_formats;
        }
        self.expanded.get_or_init(|| {
            self.interval_formats
                .expand_templates(&self.interval_format_templates)
        })
    }
    pub fn formats(&self) -> Result<Vec<Format>, Error> {
        self.formats
            .0
            .iter()
            .map(|(skeleton, raw)| self.intervals().parse(skeleton, raw, true))
            .collect()
    }

    pub fn styles(&self) -> Result<StyleData, Error> {
        let parse = |raw: &Styles<String>| -> Result<Styles<Format>, Error> {
            Ok(Styles {
                full: self.intervals().parse(&raw.full, &raw.full, false)?,
                long: self.intervals().parse(&raw.long, &raw.long, false)?,
                medium: self.intervals().parse(&raw.medium, &raw.medium, false)?,
                short: self.intervals().parse(&raw.short, &raw.short, false)?,
            })
        };
        let connectors = |connector: &Styles<String>| -> Result<Styles<String>, Error> {
            Ok(Styles {
                full: pattern::process(&connector.full)?.pattern,
                long: pattern::process(&connector.long)?.pattern,
                medium: pattern::process(&connector.medium)?.pattern,
                short: pattern::process(&connector.short)?.pattern,
            })
        };
        Ok(StyleData {
            date: parse(&self.date_format)?,
            time: parse(&self.time_format)?,
            connector: connectors(
                self.date_time_format_at_time
                    .as_ref()
                    .unwrap_or(&self.date_time_format),
            )?,
            range_connector: connectors(&self.date_time_format)?,
        })
    }
}

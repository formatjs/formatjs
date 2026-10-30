use crate::{
    Error,
    fields::{Components, NumericWidth, TextWidth, Width, ZoneWidth},
};
use serde::{
    Deserialize, Serialize,
    de::{MapAccess, Visitor},
    ser::SerializeMap,
};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum Source {
    StartRange,
    Shared,
    EndRange,
}
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct PatternPart {
    pub source: Source,
    pub pattern: String,
}
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RangePattern {
    #[serde(flatten)]
    pub components: Components,
    pub pattern_parts: Vec<PatternPart>,
}
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Format {
    pub pattern: String,
    pub pattern12: String,
    pub skeleton: String,
    pub raw_pattern: String,
    pub range_patterns: BTreeMap<String, RangePattern>,
    pub range_patterns12: BTreeMap<String, RangePattern>,
    #[serde(flatten)]
    pub components: Components,
    #[serde(skip)]
    pub pattern_fields: Components,
    #[serde(skip)]
    pub(crate) fields_mask: u16,
    #[serde(skip)]
    pub(crate) pattern_fields_mask: u16,
}
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ProcessedPattern {
    pub pattern: String,
    pub pattern12: String,
    pub fields: Components,
    #[serde(skip)]
    pub(crate) fields_mask: u16,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RawPatterns<T = String>(pub Vec<(String, T)>);
impl<'de, T: Deserialize<'de>> Deserialize<'de> for RawPatterns<T> {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        struct PatternsVisitor<T>(std::marker::PhantomData<T>);
        impl<'de, T: Deserialize<'de>> Visitor<'de> for PatternsVisitor<T> {
            type Value = RawPatterns<T>;
            fn expecting(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                f.write_str("ordered pattern map")
            }
            fn visit_map<A: MapAccess<'de>>(self, mut map: A) -> Result<Self::Value, A::Error> {
                let mut entries = Vec::new();
                while let Some((key, value)) = map.next_entry::<String, T>()? {
                    if let Some((_, previous)) = entries.iter_mut().find(|(name, _)| name == &key) {
                        *previous = value;
                    } else {
                        entries.push((key, value));
                    }
                }
                Ok(RawPatterns(entries))
            }
        }
        deserializer.deserialize_map(PatternsVisitor(std::marker::PhantomData))
    }
}
impl<T: Serialize> Serialize for RawPatterns<T> {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut map = serializer.serialize_map(Some(self.0.len()))?;
        for (key, value) in &self.0 {
            map.serialize_entry(key, value)?;
        }
        map.end()
    }
}
fn numeric(length: usize) -> NumericWidth {
    if length == 2 {
        NumericWidth::TwoDigit
    } else {
        NumericWidth::Numeric
    }
}
fn text(length: usize) -> TextWidth {
    match length {
        4 => TextWidth::Long,
        5 => TextWidth::Narrow,
        _ => TextWidth::Short,
    }
}
fn token(character: char, length: usize, fields: &mut Components) -> Result<&'static str, Error> {
    match character {
        'G' => {
            fields.era = Some(text(length));
            Ok("{era}")
        }
        'y' | 'Y' | 'u' => {
            fields.year = Some(numeric(length));
            Ok("{year}")
        }
        'U' => {
            fields.year = Some(NumericWidth::Numeric);
            Ok("{yearName}")
        }
        'r' => {
            fields.year = Some(NumericWidth::Numeric);
            Ok("{relatedYear}")
        }
        'q' | 'Q' | 'w' | 'W' => Err(Error::InvalidPattern),
        'M' | 'L' => {
            fields.month = Some(match length {
                1 => Width::Numeric,
                2 => Width::TwoDigit,
                3 => Width::Short,
                4 => Width::Long,
                _ => Width::Narrow,
            });
            Ok("{month}")
        }
        'd' => {
            fields.day = Some(numeric(length));
            Ok("{day}")
        }
        'D' | 'F' | 'g' => {
            fields.day = Some(NumericWidth::Numeric);
            Ok("{day}")
        }
        'E' => {
            fields.weekday = Some(text(length));
            Ok("{weekday}")
        }
        'e' | 'c' => {
            fields.weekday = match length {
                3 | 6 => Some(TextWidth::Short),
                4 => Some(TextWidth::Long),
                5 => Some(TextWidth::Narrow),
                _ => None,
            };
            Ok("{weekday}")
        }
        'a' | 'b' => {
            fields.hour12 = Some(true);
            Ok("{ampm}")
        }
        'B' => {
            fields.day_period = Some(text(length));
            Ok("{dayPeriod}")
        }
        'h' | 'K' => {
            fields.hour = Some(numeric(length));
            fields.hour12 = Some(true);
            Ok("{hour}")
        }
        'H' | 'k' => {
            fields.hour = Some(numeric(length));
            Ok("{hour}")
        }
        'j' | 'J' | 'C' => Err(Error::InvalidPattern),
        'm' => {
            fields.minute = Some(numeric(length));
            Ok("{minute}")
        }
        's' => {
            fields.second = Some(numeric(length));
            Ok("{second}")
        }
        'S' | 'A' => {
            fields.second = Some(NumericWidth::Numeric);
            Ok("{second}")
        }
        'z' | 'Z' | 'O' | 'v' | 'V' | 'X' | 'x' => {
            fields.time_zone_name = Some(if length < 4 {
                ZoneWidth::Short
            } else {
                ZoneWidth::Long
            });
            Ok("{timeZoneName}")
        }
        _ => Ok(""),
    }
}
fn maximum(character: char) -> usize {
    match character {
        'E' | 'e' | 'c' => 6,
        'G' | 'Q' | 'q' | 'U' | 'M' | 'L' | 'a' | 'b' | 'B' => 5,
        'z' | 'Z' | 'O' | 'v' | 'V' | 'x' | 'X' => 4,
        'D' => 3,
        'd' | 'h' | 'k' | 'H' | 'K' | 'w' | 'm' | 's' => 2,
        'F' | 'W' => 1,
        'y' | 'Y' | 'u' | 'r' => usize::MAX,
        _ => 0,
    }
}
fn replace_tokens(pattern: &str, fields: &mut Components) -> Result<(String, u16), Error> {
    use crate::fields::Field;
    let mut mask = 0;
    let mut result = String::new();
    let mut quoted = false;
    let mut chars = pattern.chars().peekable();
    while let Some(character) = chars.next() {
        if character == '\'' {
            if chars.peek() == Some(&'\'') {
                chars.next();
                result.push('\'');
            } else {
                quoted = !quoted;
            }
            continue;
        }
        let maximum = maximum(character);
        if quoted || maximum == 0 {
            result.push(character);
            continue;
        }
        let mut length = 1;
        while length < maximum && chars.peek() == Some(&character) {
            chars.next();
            length += 1;
        }
        result.push_str(token(character, length, fields)?);
        let field = match character {
            'G' => Some(Field::Era),
            'y' | 'Y' | 'u' | 'U' | 'r' => Some(Field::Year),
            'M' | 'L' => Some(Field::Month),
            'd' | 'D' | 'F' | 'g' => Some(Field::Day),
            'E' | 'e' | 'c' => Some(Field::Weekday),
            'B' => Some(Field::DayPeriod),
            'h' | 'H' | 'K' | 'k' => Some(Field::Hour),
            'm' => Some(Field::Minute),
            's' | 'S' | 'A' => Some(Field::Second),
            'z' | 'Z' | 'O' | 'v' | 'V' | 'X' | 'x' => Some(Field::TimeZoneName),
            _ => None,
        };
        if let Some(field) = field {
            mask |= field.bit();
        }
    }
    Ok((result, mask))
}
fn space(character: char) -> bool {
    matches!(
        character,
        '\u{0009}'
            | '\u{000a}'
            | '\u{000b}'
            | '\u{000c}'
            | '\u{000d}'
            | '\u{0020}'
            | '\u{00a0}'
            | '\u{1680}'
            | '\u{2000}'
            ..='\u{200a}'
                | '\u{2028}'
                | '\u{2029}'
                | '\u{202f}'
                | '\u{205f}'
                | '\u{3000}'
                | '\u{feff}'
    )
}
pub fn process(pattern: &str) -> Result<ProcessedPattern, Error> {
    let mut fields = Components::default();
    let (pattern12, fields_mask) = replace_tokens(pattern, &mut fields)?;
    let mut without = pattern12.clone();
    if let Some(period) = pattern12.find("{ampm}") {
        let after = period + "{ampm}".len();
        let left = pattern12[..period].chars().next_back();
        let right = pattern12[after..].chars().next();
        let extra = if left.is_some_and(space) && right.is_some_and(space) {
            right.unwrap().len_utf8()
        } else {
            0
        };
        without.replace_range(period..after + extra, "");
    }
    Ok(ProcessedPattern {
        pattern: without.trim_matches(space).into(),
        pattern12,
        fields,
        fields_mask,
    })
}
fn range_key(key: &str) -> Result<&'static str, Error> {
    match key {
        "G" => Ok("era"),
        "y" | "Y" | "u" | "U" | "r" => Ok("year"),
        "M" | "L" => Ok("month"),
        "d" | "D" | "F" | "g" => Ok("day"),
        "a" | "b" => Ok("ampm"),
        "B" => Ok("dayPeriod"),
        "h" | "H" | "K" | "k" => Ok("hour"),
        "m" => Ok("minute"),
        "s" | "S" | "A" => Ok("second"),
        _ => Err(Error::InvalidPattern),
    }
}
pub fn split_fallback(pattern: &str) -> Vec<PatternPart> {
    let mut parts = Vec::new();
    let mut start = 0;
    let mut index = 0;
    while index < pattern.len() {
        let token = if pattern[index..].starts_with("{0}") {
            Some(Source::StartRange)
        } else if pattern[index..].starts_with("{1}") {
            Some(Source::EndRange)
        } else {
            None
        };
        if let Some(source) = token {
            append(&mut parts, pattern, start, index, Source::Shared);
            append(&mut parts, pattern, index, index + 3, source);
            index += 3;
            start = index;
        } else {
            index += pattern[index..].chars().next().unwrap().len_utf8();
        }
    }
    append(&mut parts, pattern, start, pattern.len(), Source::Shared);
    parts
}
fn append(parts: &mut Vec<PatternPart>, pattern: &str, start: usize, end: usize, source: Source) {
    if start < end {
        parts.push(PatternPart {
            source,
            pattern: pattern[start..end].into(),
        });
    }
}
pub fn split_range(pattern: &str) -> Vec<PatternPart> {
    let mut fields = BTreeMap::<&str, (usize, usize)>::new();
    let (mut start_begin, mut start_end, mut end_begin, mut end_end) =
        (pattern.len(), 0, pattern.len(), 0);
    let mut index = 0;
    while let Some(open) = pattern[index..].find('{').map(|offset| index + offset) {
        let Some(close) = pattern[open..].find('}').map(|offset| open + offset) else {
            break;
        };
        let key = &pattern[open + 1..close];
        let end = close + 1;
        if let Some((first_start, first_end)) = fields.get(key) {
            start_begin = start_begin.min(*first_start);
            start_end = start_end.max(*first_end);
            end_begin = end_begin.min(open);
            end_end = end_end.max(end);
        } else {
            fields.insert(key, (open, end));
        }
        index = end;
    }
    if start_end == 0 {
        return vec![PatternPart {
            source: Source::Shared,
            pattern: pattern.into(),
        }];
    }
    let mut parts = Vec::new();
    append(&mut parts, pattern, 0, start_begin, Source::Shared);
    append(
        &mut parts,
        pattern,
        start_begin,
        start_end,
        Source::StartRange,
    );
    append(&mut parts, pattern, start_end, end_begin, Source::Shared);
    append(&mut parts, pattern, end_begin, end_end, Source::EndRange);
    append(&mut parts, pattern, end_end, pattern.len(), Source::Shared);
    parts
}
pub fn parse(
    skeleton: &str,
    raw_pattern: &str,
    ranges: &RawPatterns,
    fallback: Option<&str>,
) -> Result<Format, Error> {
    let mut range_patterns = BTreeMap::new();
    let mut range_patterns12 = BTreeMap::new();
    for (key, value) in &ranges.0 {
        let key = range_key(key)?.to_owned();
        let parsed = process(value)?;
        range_patterns.insert(
            key.clone(),
            RangePattern {
                components: parsed.fields,
                pattern_parts: split_range(&parsed.pattern),
            },
        );
        range_patterns12.insert(
            key,
            RangePattern {
                components: parsed.fields,
                pattern_parts: split_range(&parsed.pattern12),
            },
        );
    }
    if let Some(fallback) = fallback.filter(|value| !value.is_empty()) {
        let range = RangePattern {
            components: Components::default(),
            pattern_parts: split_fallback(fallback),
        };
        range_patterns.insert("default".into(), range.clone());
        range_patterns12.insert("default".into(), range);
    }
    let mut components = Components::default();
    let (_, fields_mask) = replace_tokens(skeleton, &mut components)?;
    let processed = process(raw_pattern)?;
    let year_fields: Vec<&str> = ["{relatedYear}", "{yearName}"]
        .into_iter()
        .filter(|field| processed.pattern.contains(field))
        .collect();
    for patterns in [&mut range_patterns, &mut range_patterns12] {
        patterns.retain(|key, value| {
            key == "default"
                || year_fields.iter().all(|field| {
                    value
                        .pattern_parts
                        .iter()
                        .any(|part| part.pattern.contains(field))
                })
        });
    }
    Ok(Format {
        pattern: processed.pattern,
        pattern12: processed.pattern12,
        skeleton: skeleton.into(),
        raw_pattern: raw_pattern.into(),
        range_patterns,
        range_patterns12,
        components,
        pattern_fields: processed.fields,
        fields_mask,
        pattern_fields_mask: processed.fields_mask,
    })
}

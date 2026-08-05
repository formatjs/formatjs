use crate::error::{Error, Result};
use std::fmt;
use std::sync::Arc;

#[derive(Debug, Clone, PartialEq)]
pub enum Part<T> {
    Literal(String),
    Object(T),
}

impl<T> Part<T> {
    pub fn as_literal(&self) -> Option<&str> {
        match self {
            Self::Literal(value) => Some(value),
            Self::Object(_) => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub enum FormattedMessage<T> {
    Literal(String),
    Object(T),
    Parts(Vec<Part<T>>),
}

impl<T> FormattedMessage<T> {
    pub fn into_parts(self) -> Vec<Part<T>> {
        match self {
            Self::Literal(value) => vec![Part::Literal(value)],
            Self::Object(value) => vec![Part::Object(value)],
            Self::Parts(parts) => parts,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DateTimeValue {
    pub year: i32,
    pub month: u8,
    pub day: u8,
    pub hour: u8,
    pub minute: u8,
    pub second: u8,
    pub nanosecond: u32,
}

impl DateTimeValue {
    pub fn try_new(
        year: i32,
        month: u8,
        day: u8,
        hour: u8,
        minute: u8,
        second: u8,
        nanosecond: u32,
    ) -> Result<Self> {
        if !(-9999..=9999).contains(&year)
            || !(1..=12).contains(&month)
            || !(1..=31).contains(&day)
            || hour > 23
            || minute > 59
            || second > 60
            || nanosecond > 999_999_999
        {
            return Err(Error::new(
                crate::ErrorCode::InvalidValue,
                "Invalid date/time fields",
            ));
        }
        Ok(Self {
            year,
            month,
            day,
            hour,
            minute,
            second,
            nanosecond,
        })
    }

    /// Converts Unix epoch milliseconds to UTC date/time fields.
    pub fn from_unix_millis(milliseconds: i64) -> Self {
        const MILLIS_PER_DAY: i64 = 86_400_000;
        let days = milliseconds.div_euclid(MILLIS_PER_DAY);
        let millis = milliseconds.rem_euclid(MILLIS_PER_DAY);

        // Howard Hinnant's civil-from-days algorithm.
        let z = days + 719_468;
        let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
        let day_of_era = z - era * 146_097;
        let year_of_era =
            (day_of_era - day_of_era / 1_460 + day_of_era / 36_524 - day_of_era / 146_096)
                / 365;
        let mut year = year_of_era + era * 400;
        let day_of_year = day_of_era - (365 * year_of_era + year_of_era / 4 - year_of_era / 100);
        let month_prime = (5 * day_of_year + 2) / 153;
        let day = day_of_year - (153 * month_prime + 2) / 5 + 1;
        let month = month_prime + if month_prime < 10 { 3 } else { -9 };
        year += i64::from(month <= 2);

        let seconds = millis / 1_000;
        Self {
            year: year as i32,
            month: month as u8,
            day: day as u8,
            hour: (seconds / 3_600) as u8,
            minute: ((seconds % 3_600) / 60) as u8,
            second: (seconds % 60) as u8,
            nanosecond: ((millis % 1_000) * 1_000_000) as u32,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum NumericValue {
    Float(f64),
    Integer(i64),
    Unsigned(u64),
}

impl NumericValue {
    pub fn as_f64(self) -> f64 {
        match self {
            Self::Float(value) => value,
            Self::Integer(value) => value as f64,
            Self::Unsigned(value) => value as f64,
        }
    }

    pub fn scaled(self, scale: f64) -> Self {
        if scale == 1.0 {
            self
        } else {
            Self::Float(self.as_f64() * scale)
        }
    }

    pub fn decimal_string(self) -> Result<String> {
        match self {
            Self::Float(value) if value.is_finite() => Ok(value.to_string()),
            Self::Float(_) => Err(Error::new(
                crate::ErrorCode::InvalidValue,
                "Number must be finite",
            )),
            Self::Integer(value) => Ok(value.to_string()),
            Self::Unsigned(value) => Ok(value.to_string()),
        }
    }
}

pub type TagFunction<T> =
    Arc<dyn Fn(Vec<Part<T>>) -> Result<Vec<Part<T>>> + Send + Sync + 'static>;

#[derive(Clone)]
pub enum Value<T = String> {
    String(String),
    Number(f64),
    Integer(i64),
    Unsigned(u64),
    Boolean(bool),
    Null,
    DateTime(DateTimeValue),
    Object(T),
    Tag(TagFunction<T>),
}

impl<T: fmt::Debug> fmt::Debug for Value<T> {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::String(value) => formatter.debug_tuple("String").field(value).finish(),
            Self::Number(value) => formatter.debug_tuple("Number").field(value).finish(),
            Self::Integer(value) => formatter.debug_tuple("Integer").field(value).finish(),
            Self::Unsigned(value) => formatter.debug_tuple("Unsigned").field(value).finish(),
            Self::Boolean(value) => formatter.debug_tuple("Boolean").field(value).finish(),
            Self::Null => formatter.write_str("Null"),
            Self::DateTime(value) => formatter.debug_tuple("DateTime").field(value).finish(),
            Self::Object(value) => formatter.debug_tuple("Object").field(value).finish(),
            Self::Tag(_) => formatter.write_str("Tag(<function>)"),
        }
    }
}

impl<T> Value<T> {
    pub fn tag(
        function: impl Fn(Vec<Part<T>>) -> Result<Vec<Part<T>>> + Send + Sync + 'static,
    ) -> Self {
        Self::Tag(Arc::new(function))
    }

    pub(crate) fn numeric(&self) -> Option<NumericValue> {
        match self {
            Self::Number(value) => Some(NumericValue::Float(*value)),
            Self::Integer(value) => Some(NumericValue::Integer(*value)),
            Self::Unsigned(value) => Some(NumericValue::Unsigned(*value)),
            _ => None,
        }
    }

    pub(crate) fn selector(&self) -> Option<String> {
        match self {
            Self::String(value) => Some(value.clone()),
            Self::Number(value) => Some(value.to_string()),
            Self::Integer(value) => Some(value.to_string()),
            Self::Unsigned(value) => Some(value.to_string()),
            Self::Boolean(value) => Some(value.to_string()),
            Self::Null => Some("null".to_owned()),
            _ => None,
        }
    }

    pub(crate) fn datetime(&self) -> Option<DateTimeValue> {
        match self {
            Self::DateTime(value) => Some(*value),
            Self::Integer(value) => Some(DateTimeValue::from_unix_millis(*value)),
            Self::Unsigned(value) => i64::try_from(*value)
                .ok()
                .map(DateTimeValue::from_unix_millis),
            Self::Number(value) if value.is_finite() => {
                Some(DateTimeValue::from_unix_millis(*value as i64))
            }
            _ => None,
        }
    }
}

impl<T> From<String> for Value<T> {
    fn from(value: String) -> Self {
        Self::String(value)
    }
}

impl<T> From<&str> for Value<T> {
    fn from(value: &str) -> Self {
        Self::String(value.to_owned())
    }
}

impl<T> From<f64> for Value<T> {
    fn from(value: f64) -> Self {
        Self::Number(value)
    }
}

impl<T> From<i64> for Value<T> {
    fn from(value: i64) -> Self {
        Self::Integer(value)
    }
}

impl<T> From<u64> for Value<T> {
    fn from(value: u64) -> Self {
        Self::Unsigned(value)
    }
}

impl<T> From<bool> for Value<T> {
    fn from(value: bool) -> Self {
        Self::Boolean(value)
    }
}

impl<T> From<DateTimeValue> for Value<T> {
    fn from(value: DateTimeValue) -> Self {
        Self::DateTime(value)
    }
}

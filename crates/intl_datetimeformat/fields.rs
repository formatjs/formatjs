use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum NumericWidth {
    Numeric,
    #[serde(rename = "2-digit")]
    TwoDigit,
}
#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum TextWidth {
    Narrow,
    Short,
    Long,
}
#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Width {
    Numeric,
    #[serde(rename = "2-digit")]
    TwoDigit,
    Narrow,
    Short,
    Long,
}
impl Width {
    pub fn is_numeric(self) -> bool {
        matches!(self, Self::Numeric | Self::TwoDigit)
    }
}
impl From<NumericWidth> for Width {
    fn from(value: NumericWidth) -> Self {
        match value {
            NumericWidth::Numeric => Self::Numeric,
            NumericWidth::TwoDigit => Self::TwoDigit,
        }
    }
}
impl From<TextWidth> for Width {
    fn from(value: TextWidth) -> Self {
        match value {
            TextWidth::Narrow => Self::Narrow,
            TextWidth::Short => Self::Short,
            TextWidth::Long => Self::Long,
        }
    }
}
#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum ZoneWidth {
    Short,
    Long,
    ShortOffset,
    LongOffset,
    ShortGeneric,
    LongGeneric,
}
#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(try_from = "u8", into = "u8")]
pub struct FractionalDigits(u8);
impl TryFrom<u8> for FractionalDigits {
    type Error = &'static str;
    fn try_from(value: u8) -> Result<Self, Self::Error> {
        if (1..=3).contains(&value) {
            Ok(Self(value))
        } else {
            Err("fractionalSecondDigits must be 1, 2 or 3")
        }
    }
}
impl From<FractionalDigits> for u8 {
    fn from(value: FractionalDigits) -> Self {
        value.0
    }
}
#[derive(Debug, Clone, Copy, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(default, rename_all = "camelCase")]
pub struct Components {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub weekday: Option<TextWidth>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub era: Option<TextWidth>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub year: Option<NumericWidth>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub month: Option<Width>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub day: Option<NumericWidth>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub day_period: Option<TextWidth>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hour: Option<NumericWidth>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub minute: Option<NumericWidth>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub second: Option<NumericWidth>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fractional_second_digits: Option<FractionalDigits>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_zone_name: Option<ZoneWidth>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hour12: Option<bool>,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Field {
    Weekday,
    Era,
    Year,
    Month,
    Day,
    DayPeriod,
    Hour,
    Minute,
    Second,
    FractionalSecondDigits,
    TimeZoneName,
}
impl Field {
    pub(crate) fn bit(self) -> u16 {
        1 << (self as u16)
    }
    pub const ALL: [Self; 11] = [
        Self::Weekday,
        Self::Era,
        Self::Year,
        Self::Month,
        Self::Day,
        Self::DayPeriod,
        Self::Hour,
        Self::Minute,
        Self::Second,
        Self::FractionalSecondDigits,
        Self::TimeZoneName,
    ];
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum Value {
    Width(Width),
    Fraction(FractionalDigits),
    Zone(ZoneWidth),
}
impl Value {
    pub fn numeric(self) -> bool {
        matches!(self,Self::Width(width) if width.is_numeric())
    }
    pub fn index(self) -> i32 {
        match self {
            Self::Width(Width::TwoDigit) => 0,
            Self::Width(Width::Numeric) => 1,
            Self::Width(Width::Narrow) => 2,
            Self::Width(Width::Short) | Self::Zone(ZoneWidth::Short) => 3,
            Self::Width(Width::Long) | Self::Zone(ZoneWidth::Long) => 4,
            _ => -1,
        }
    }
}
impl Components {
    pub(crate) fn get(self, field: Field) -> Option<Value> {
        match field {
            Field::Weekday => self.weekday.map(|v| Value::Width(v.into())),
            Field::Era => self.era.map(|v| Value::Width(v.into())),
            Field::Year => self.year.map(|v| Value::Width(v.into())),
            Field::Month => self.month.map(Value::Width),
            Field::Day => self.day.map(|v| Value::Width(v.into())),
            Field::DayPeriod => self.day_period.map(|v| Value::Width(v.into())),
            Field::Hour => self.hour.map(|v| Value::Width(v.into())),
            Field::Minute => self.minute.map(|v| Value::Width(v.into())),
            Field::Second => self.second.map(|v| Value::Width(v.into())),
            Field::FractionalSecondDigits => self.fractional_second_digits.map(Value::Fraction),
            Field::TimeZoneName => self.time_zone_name.map(Value::Zone),
        }
    }
    pub(crate) fn set_from(&mut self, field: Field, source: Self) {
        match field {
            Field::Weekday => self.weekday = source.weekday,
            Field::Era => self.era = source.era,
            Field::Year => self.year = source.year,
            Field::Month => self.month = source.month,
            Field::Day => self.day = source.day,
            Field::DayPeriod => self.day_period = source.day_period,
            Field::Hour => self.hour = source.hour,
            Field::Minute => self.minute = source.minute,
            Field::Second => self.second = source.second,
            Field::FractionalSecondDigits => {
                self.fractional_second_digits = source.fractional_second_digits
            }
            Field::TimeZoneName => self.time_zone_name = source.time_zone_name,
        }
    }
}

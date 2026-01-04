use serde::{Deserialize, Serialize};

/// Represents the era format in date-time formatting
/// Corresponds to Intl.DateTimeFormatOptions.era
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DateTimeFormatEra {
    Long,
    Short,
    Narrow,
}

/// Represents the year format in date-time formatting
/// Corresponds to Intl.DateTimeFormatOptions.year
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum DateTimeFormatYear {
    Numeric,
    #[serde(rename = "2-digit")]
    TwoDigit,
}

/// Represents the month format in date-time formatting
/// Corresponds to Intl.DateTimeFormatOptions.month
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DateTimeFormatMonth {
    Numeric,
    #[serde(rename = "2-digit")]
    TwoDigit,
    Short,
    Long,
    Narrow,
}

/// Represents the day format in date-time formatting
/// Corresponds to Intl.DateTimeFormatOptions.day
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DateTimeFormatDay {
    Numeric,
    #[serde(rename = "2-digit")]
    TwoDigit,
}

/// Represents the weekday format in date-time formatting
/// Corresponds to Intl.DateTimeFormatOptions.weekday
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DateTimeFormatWeekday {
    Long,
    Short,
    Narrow,
}

/// Represents the hour format in date-time formatting
/// Corresponds to Intl.DateTimeFormatOptions.hour
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DateTimeFormatHour {
    Numeric,
    #[serde(rename = "2-digit")]
    TwoDigit,
}

/// Represents the hour cycle format in date-time formatting
/// Corresponds to Intl.DateTimeFormatOptions.hourCycle
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DateTimeFormatHourCycle {
    H11,
    H12,
    H23,
    H24,
}

/// Represents the minute format in date-time formatting
/// Corresponds to Intl.DateTimeFormatOptions.minute
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DateTimeFormatMinute {
    Numeric,
    #[serde(rename = "2-digit")]
    TwoDigit,
}

/// Represents the second format in date-time formatting
/// Corresponds to Intl.DateTimeFormatOptions.second
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DateTimeFormatSecond {
    Numeric,
    #[serde(rename = "2-digit")]
    TwoDigit,
}

/// Represents the time zone name format in date-time formatting
/// Corresponds to Intl.DateTimeFormatOptions.timeZoneName
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DateTimeFormatTimeZoneName {
    Short,
    Long,
}

/// Represents the date-time format options
/// Corresponds to Intl.DateTimeFormatOptions
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DateTimeFormatOptions {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub era: Option<DateTimeFormatEra>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub year: Option<DateTimeFormatYear>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub month: Option<DateTimeFormatMonth>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub day: Option<DateTimeFormatDay>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub weekday: Option<DateTimeFormatWeekday>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub hour: Option<DateTimeFormatHour>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub hour12: Option<bool>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub hour_cycle: Option<DateTimeFormatHourCycle>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub minute: Option<DateTimeFormatMinute>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub second: Option<DateTimeFormatSecond>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_zone_name: Option<DateTimeFormatTimeZoneName>,
}

impl DateTimeFormatOptions {
    /// Create a new DateTimeFormatOptions with default values
    pub fn new() -> Self {
        Self::default()
    }

    // Getters
    pub fn era(&self) -> Option<&DateTimeFormatEra> {
        self.era.as_ref()
    }

    pub fn year(&self) -> Option<&DateTimeFormatYear> {
        self.year.as_ref()
    }

    pub fn month(&self) -> Option<&DateTimeFormatMonth> {
        self.month.as_ref()
    }

    pub fn day(&self) -> Option<&DateTimeFormatDay> {
        self.day.as_ref()
    }

    pub fn weekday(&self) -> Option<&DateTimeFormatWeekday> {
        self.weekday.as_ref()
    }

    pub fn hour(&self) -> Option<&DateTimeFormatHour> {
        self.hour.as_ref()
    }

    pub fn hour12(&self) -> Option<bool> {
        self.hour12
    }

    pub fn hour_cycle(&self) -> Option<&DateTimeFormatHourCycle> {
        self.hour_cycle.as_ref()
    }

    pub fn minute(&self) -> Option<&DateTimeFormatMinute> {
        self.minute.as_ref()
    }

    pub fn second(&self) -> Option<&DateTimeFormatSecond> {
        self.second.as_ref()
    }

    pub fn time_zone_name(&self) -> Option<&DateTimeFormatTimeZoneName> {
        self.time_zone_name.as_ref()
    }

    // Setters (builder pattern)
    pub fn with_era(mut self, era: DateTimeFormatEra) -> Self {
        self.era = Some(era);
        self
    }

    pub fn with_year(mut self, year: DateTimeFormatYear) -> Self {
        self.year = Some(year);
        self
    }

    pub fn with_month(mut self, month: DateTimeFormatMonth) -> Self {
        self.month = Some(month);
        self
    }

    pub fn with_day(mut self, day: DateTimeFormatDay) -> Self {
        self.day = Some(day);
        self
    }

    pub fn with_weekday(mut self, weekday: DateTimeFormatWeekday) -> Self {
        self.weekday = Some(weekday);
        self
    }

    pub fn with_hour(mut self, hour: DateTimeFormatHour) -> Self {
        self.hour = Some(hour);
        self
    }

    pub fn with_hour12(mut self, hour12: bool) -> Self {
        self.hour12 = Some(hour12);
        self
    }

    pub fn with_hour_cycle(mut self, hour_cycle: DateTimeFormatHourCycle) -> Self {
        self.hour_cycle = Some(hour_cycle);
        self
    }

    pub fn with_minute(mut self, minute: DateTimeFormatMinute) -> Self {
        self.minute = Some(minute);
        self
    }

    pub fn with_second(mut self, second: DateTimeFormatSecond) -> Self {
        self.second = Some(second);
        self
    }

    pub fn with_time_zone_name(mut self, time_zone_name: DateTimeFormatTimeZoneName) -> Self {
        self.time_zone_name = Some(time_zone_name);
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_datetime_format_options_creation() {
        let options = DateTimeFormatOptions::new()
            .with_year(DateTimeFormatYear::Numeric)
            .with_month(DateTimeFormatMonth::Long)
            .with_day(DateTimeFormatDay::TwoDigit);

        assert_eq!(options.year(), Some(&DateTimeFormatYear::Numeric));
        assert_eq!(options.month(), Some(&DateTimeFormatMonth::Long));
        assert_eq!(options.day(), Some(&DateTimeFormatDay::TwoDigit));
    }

    #[test]
    fn test_datetime_format_options_serialization() {
        let options = DateTimeFormatOptions::new()
            .with_year(DateTimeFormatYear::Numeric)
            .with_month(DateTimeFormatMonth::Short)
            .with_hour(DateTimeFormatHour::TwoDigit)
            .with_hour_cycle(DateTimeFormatHourCycle::H23);

        let json = serde_json::to_string(&options).unwrap();
        assert!(json.contains("\"year\":\"numeric\""));
        assert!(json.contains("\"month\":\"short\""));
        assert!(json.contains("\"hour\":\"2-digit\""));
        assert!(json.contains("\"hourCycle\":\"h23\""));
    }

    #[test]
    fn test_datetime_format_options_deserialization() {
        let json = r#"{"year":"2-digit","month":"long","day":"numeric"}"#;
        let options: DateTimeFormatOptions = serde_json::from_str(json).unwrap();

        assert_eq!(options.year(), Some(&DateTimeFormatYear::TwoDigit));
        assert_eq!(options.month(), Some(&DateTimeFormatMonth::Long));
        assert_eq!(options.day(), Some(&DateTimeFormatDay::Numeric));
    }

    #[test]
    fn test_hour12_boolean() {
        let options = DateTimeFormatOptions::new()
            .with_hour12(true)
            .with_hour(DateTimeFormatHour::Numeric);

        assert_eq!(options.hour12(), Some(true));

        let json = serde_json::to_string(&options).unwrap();
        assert!(json.contains("\"hour12\":true"));
    }

    #[test]
    fn test_hour_cycle_values() {
        let h11 = DateTimeFormatOptions::new().with_hour_cycle(DateTimeFormatHourCycle::H11);
        let h12 = DateTimeFormatOptions::new().with_hour_cycle(DateTimeFormatHourCycle::H12);
        let h23 = DateTimeFormatOptions::new().with_hour_cycle(DateTimeFormatHourCycle::H23);
        let h24 = DateTimeFormatOptions::new().with_hour_cycle(DateTimeFormatHourCycle::H24);

        assert_eq!(h11.hour_cycle(), Some(&DateTimeFormatHourCycle::H11));
        assert_eq!(h12.hour_cycle(), Some(&DateTimeFormatHourCycle::H12));
        assert_eq!(h23.hour_cycle(), Some(&DateTimeFormatHourCycle::H23));
        assert_eq!(h24.hour_cycle(), Some(&DateTimeFormatHourCycle::H24));
    }

    #[test]
    fn test_weekday_values() {
        let json_long = r#"{"weekday":"long"}"#;
        let json_short = r#"{"weekday":"short"}"#;
        let json_narrow = r#"{"weekday":"narrow"}"#;

        let opts_long: DateTimeFormatOptions = serde_json::from_str(json_long).unwrap();
        let opts_short: DateTimeFormatOptions = serde_json::from_str(json_short).unwrap();
        let opts_narrow: DateTimeFormatOptions = serde_json::from_str(json_narrow).unwrap();

        assert_eq!(opts_long.weekday(), Some(&DateTimeFormatWeekday::Long));
        assert_eq!(opts_short.weekday(), Some(&DateTimeFormatWeekday::Short));
        assert_eq!(opts_narrow.weekday(), Some(&DateTimeFormatWeekday::Narrow));
    }

    #[test]
    fn test_time_zone_name() {
        let options =
            DateTimeFormatOptions::new().with_time_zone_name(DateTimeFormatTimeZoneName::Long);

        assert_eq!(
            options.time_zone_name(),
            Some(&DateTimeFormatTimeZoneName::Long)
        );

        let json = serde_json::to_string(&options).unwrap();
        assert!(json.contains("\"timeZoneName\":\"long\""));
    }

    #[test]
    fn test_era_values() {
        let options = DateTimeFormatOptions::new().with_era(DateTimeFormatEra::Short);

        assert_eq!(options.era(), Some(&DateTimeFormatEra::Short));
    }

    #[test]
    fn test_default_empty() {
        let options = DateTimeFormatOptions::default();

        assert_eq!(options.era(), None);
        assert_eq!(options.year(), None);
        assert_eq!(options.month(), None);
        assert_eq!(options.day(), None);
        assert_eq!(options.weekday(), None);
        assert_eq!(options.hour(), None);
        assert_eq!(options.hour12(), None);
        assert_eq!(options.hour_cycle(), None);
        assert_eq!(options.minute(), None);
        assert_eq!(options.second(), None);
        assert_eq!(options.time_zone_name(), None);
    }

    #[test]
    fn test_skip_serializing_none_fields() {
        let options = DateTimeFormatOptions::new().with_year(DateTimeFormatYear::Numeric);

        let json = serde_json::to_string(&options).unwrap();

        // Should only contain year, not other None fields
        assert!(json.contains("\"year\":\"numeric\""));
        assert!(!json.contains("\"month\""));
        assert!(!json.contains("\"day\""));
        assert!(!json.contains("\"era\""));
    }
}

use formatjs_icu_skeleton_parser::datetime_format_options::*;

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

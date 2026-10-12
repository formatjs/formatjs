use formatjs_icu_skeleton_parser::DateTimeFormatDay;
use formatjs_icu_skeleton_parser::DateTimeFormatEra;
use formatjs_icu_skeleton_parser::DateTimeFormatHour;
use formatjs_icu_skeleton_parser::DateTimeFormatHourCycle;
use formatjs_icu_skeleton_parser::DateTimeFormatMinute;
use formatjs_icu_skeleton_parser::DateTimeFormatMonth;
use formatjs_icu_skeleton_parser::DateTimeFormatSecond;
use formatjs_icu_skeleton_parser::DateTimeFormatTimeZoneName;
use formatjs_icu_skeleton_parser::DateTimeFormatWeekday;
use formatjs_icu_skeleton_parser::DateTimeFormatYear;
use formatjs_icu_skeleton_parser::datetime_parser::*;

#[test]
fn test_parse_year_numeric() {
    let result = parse_date_time_skeleton("y").unwrap();
    assert_eq!(result.year(), Some(&DateTimeFormatYear::Numeric));
}

#[test]
fn test_parse_year_two_digit() {
    let result = parse_date_time_skeleton("yy").unwrap();
    assert_eq!(result.year(), Some(&DateTimeFormatYear::TwoDigit));
}

#[test]
fn test_parse_month_formats() {
    let numeric = parse_date_time_skeleton("M").unwrap();
    assert_eq!(numeric.month(), Some(&DateTimeFormatMonth::Numeric));

    let two_digit = parse_date_time_skeleton("MM").unwrap();
    assert_eq!(two_digit.month(), Some(&DateTimeFormatMonth::TwoDigit));

    let short = parse_date_time_skeleton("MMM").unwrap();
    assert_eq!(short.month(), Some(&DateTimeFormatMonth::Short));

    let long = parse_date_time_skeleton("MMMM").unwrap();
    assert_eq!(long.month(), Some(&DateTimeFormatMonth::Long));

    let narrow = parse_date_time_skeleton("MMMMM").unwrap();
    assert_eq!(narrow.month(), Some(&DateTimeFormatMonth::Narrow));
}

#[test]
fn test_parse_day_formats() {
    let numeric = parse_date_time_skeleton("d").unwrap();
    assert_eq!(numeric.day(), Some(&DateTimeFormatDay::Numeric));

    let two_digit = parse_date_time_skeleton("dd").unwrap();
    assert_eq!(two_digit.day(), Some(&DateTimeFormatDay::TwoDigit));
}

#[test]
fn test_parse_weekday_e() {
    let short = parse_date_time_skeleton("eeee").unwrap();
    assert_eq!(short.weekday(), Some(&DateTimeFormatWeekday::Short));

    let long = parse_date_time_skeleton("eeeee").unwrap();
    assert_eq!(long.weekday(), Some(&DateTimeFormatWeekday::Long));

    let narrow = parse_date_time_skeleton("eeeeee").unwrap();
    assert_eq!(narrow.weekday(), Some(&DateTimeFormatWeekday::Narrow));
}

#[test]
fn test_parse_weekday_e_short_error() {
    let result = parse_date_time_skeleton("e");
    assert!(result.is_err());
    assert!(
        result
            .unwrap_err()
            .contains("`e..eee` (weekday) patterns are not supported")
    );
}

#[test]
fn test_parse_weekday_capital_e() {
    let short = parse_date_time_skeleton("E").unwrap();
    assert_eq!(short.weekday(), Some(&DateTimeFormatWeekday::Short));

    let long = parse_date_time_skeleton("EEEE").unwrap();
    assert_eq!(long.weekday(), Some(&DateTimeFormatWeekday::Long));

    let narrow = parse_date_time_skeleton("EEEEE").unwrap();
    assert_eq!(narrow.weekday(), Some(&DateTimeFormatWeekday::Narrow));
}

#[test]
fn test_parse_era() {
    let short = parse_date_time_skeleton("G").unwrap();
    assert_eq!(short.era(), Some(&DateTimeFormatEra::Short));

    let long = parse_date_time_skeleton("GGGG").unwrap();
    assert_eq!(long.era(), Some(&DateTimeFormatEra::Long));

    let narrow = parse_date_time_skeleton("GGGGG").unwrap();
    assert_eq!(narrow.era(), Some(&DateTimeFormatEra::Narrow));
}

#[test]
fn test_parse_hour_cycles() {
    let h12 = parse_date_time_skeleton("h").unwrap();
    assert_eq!(h12.hour_cycle(), Some(&DateTimeFormatHourCycle::H12));
    assert_eq!(h12.hour(), Some(&DateTimeFormatHour::Numeric));

    let h23 = parse_date_time_skeleton("HH").unwrap();
    assert_eq!(h23.hour_cycle(), Some(&DateTimeFormatHourCycle::H23));
    assert_eq!(h23.hour(), Some(&DateTimeFormatHour::TwoDigit));

    let h11 = parse_date_time_skeleton("K").unwrap();
    assert_eq!(h11.hour_cycle(), Some(&DateTimeFormatHourCycle::H11));

    let h24 = parse_date_time_skeleton("kk").unwrap();
    assert_eq!(h24.hour_cycle(), Some(&DateTimeFormatHourCycle::H24));
}

#[test]
fn test_parse_hour12_with_period() {
    let result = parse_date_time_skeleton("ha").unwrap();
    assert_eq!(result.hour12(), Some(true));
    assert_eq!(result.hour(), Some(&DateTimeFormatHour::Numeric));
}

#[test]
fn test_parse_minute_second() {
    let result = parse_date_time_skeleton("m").unwrap();
    assert_eq!(result.minute(), Some(&DateTimeFormatMinute::Numeric));

    let result = parse_date_time_skeleton("mm").unwrap();
    assert_eq!(result.minute(), Some(&DateTimeFormatMinute::TwoDigit));

    let result = parse_date_time_skeleton("s").unwrap();
    assert_eq!(result.second(), Some(&DateTimeFormatSecond::Numeric));

    let result = parse_date_time_skeleton("ss").unwrap();
    assert_eq!(result.second(), Some(&DateTimeFormatSecond::TwoDigit));
}

#[test]
fn test_parse_timezone() {
    let short = parse_date_time_skeleton("z").unwrap();
    assert_eq!(
        short.time_zone_name(),
        Some(&DateTimeFormatTimeZoneName::Short)
    );

    let long = parse_date_time_skeleton("zzzz").unwrap();
    assert_eq!(
        long.time_zone_name(),
        Some(&DateTimeFormatTimeZoneName::Long)
    );
}

#[test]
fn test_parse_complex_skeleton() {
    let result = parse_date_time_skeleton("yMMMdHms").unwrap();
    assert_eq!(result.year(), Some(&DateTimeFormatYear::Numeric));
    assert_eq!(result.month(), Some(&DateTimeFormatMonth::Short));
    assert_eq!(result.day(), Some(&DateTimeFormatDay::Numeric));
    assert_eq!(result.hour(), Some(&DateTimeFormatHour::Numeric));
    assert_eq!(result.minute(), Some(&DateTimeFormatMinute::Numeric));
    assert_eq!(result.second(), Some(&DateTimeFormatSecond::Numeric));
}

#[test]
fn test_parse_full_datetime() {
    let result = parse_date_time_skeleton("yyyyMMddHHmmss").unwrap();
    assert_eq!(result.year(), Some(&DateTimeFormatYear::Numeric));
    assert_eq!(result.month(), Some(&DateTimeFormatMonth::TwoDigit));
    assert_eq!(result.day(), Some(&DateTimeFormatDay::TwoDigit));
    assert_eq!(result.hour(), Some(&DateTimeFormatHour::TwoDigit));
    assert_eq!(result.hour_cycle(), Some(&DateTimeFormatHourCycle::H23));
    assert_eq!(result.minute(), Some(&DateTimeFormatMinute::TwoDigit));
    assert_eq!(result.second(), Some(&DateTimeFormatSecond::TwoDigit));
}

#[test]
fn test_unsupported_year_pattern() {
    let result = parse_date_time_skeleton("Y");
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Y/u/U/r"));
}

#[test]
fn test_unsupported_quarter_pattern() {
    let result = parse_date_time_skeleton("Q");
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("q/Q"));
}

#[test]
fn test_unsupported_week_pattern() {
    let result = parse_date_time_skeleton("w");
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("w/W"));
}

#[test]
fn test_unsupported_day_pattern() {
    let result = parse_date_time_skeleton("D");
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("D/F/g"));
}

#[test]
fn test_unsupported_period_pattern() {
    let result = parse_date_time_skeleton("b");
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("b/B"));
}

#[test]
fn test_unsupported_hour_pattern() {
    let result = parse_date_time_skeleton("j");
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("j/J/C"));
}

#[test]
fn test_unsupported_second_pattern() {
    let result = parse_date_time_skeleton("S");
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("S/A"));
}

#[test]
fn test_unsupported_timezone_pattern() {
    let result = parse_date_time_skeleton("Z");
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Z/O/v/V/X/x"));
}

#[test]
fn test_empty_skeleton() {
    let result = parse_date_time_skeleton("").unwrap();
    assert_eq!(result.year(), None);
    assert_eq!(result.month(), None);
    assert_eq!(result.day(), None);
}

#[test]
fn test_month_standalone_l() {
    // L is standalone month (same behavior as M)
    let result = parse_date_time_skeleton("LLL").unwrap();
    assert_eq!(result.month(), Some(&DateTimeFormatMonth::Short));
}

#[test]
fn test_weekday_c() {
    let short = parse_date_time_skeleton("cccc").unwrap();
    assert_eq!(short.weekday(), Some(&DateTimeFormatWeekday::Short));

    let result = parse_date_time_skeleton("c");
    assert!(result.is_err());
}

// Integration tests from TypeScript test suite
#[test]
fn test_integration_complex_skeleton_1() {
    // "yyyy.MM.dd G 'at' HH:mm:ss zzzz"
    // Note: Quoted text is not supported in Rust version, testing without it
    let result = parse_date_time_skeleton("yyyy.MM.dd G HH:mm:ss zzzz").unwrap();
    assert_eq!(result.year(), Some(&DateTimeFormatYear::Numeric));
    assert_eq!(result.month(), Some(&DateTimeFormatMonth::TwoDigit));
    assert_eq!(result.day(), Some(&DateTimeFormatDay::TwoDigit));
    assert_eq!(result.era(), Some(&DateTimeFormatEra::Short));
    assert_eq!(result.hour(), Some(&DateTimeFormatHour::TwoDigit));
    assert_eq!(result.hour_cycle(), Some(&DateTimeFormatHourCycle::H23));
    assert_eq!(result.minute(), Some(&DateTimeFormatMinute::TwoDigit));
    assert_eq!(result.second(), Some(&DateTimeFormatSecond::TwoDigit));
    assert_eq!(
        result.time_zone_name(),
        Some(&DateTimeFormatTimeZoneName::Long)
    );
}

#[test]
fn test_integration_skeleton_2() {
    // "EEE, MMM d, ''yy"
    let result = parse_date_time_skeleton("EEE, MMM d, yy").unwrap();
    assert_eq!(result.weekday(), Some(&DateTimeFormatWeekday::Short));
    assert_eq!(result.month(), Some(&DateTimeFormatMonth::Short));
    assert_eq!(result.day(), Some(&DateTimeFormatDay::Numeric));
    assert_eq!(result.year(), Some(&DateTimeFormatYear::TwoDigit));
}

#[test]
fn test_integration_skeleton_3() {
    // "EEEE, d MMMM yyyy"
    let result = parse_date_time_skeleton("EEEE, d MMMM yyyy").unwrap();
    assert_eq!(result.weekday(), Some(&DateTimeFormatWeekday::Long));
    assert_eq!(result.day(), Some(&DateTimeFormatDay::Numeric));
    assert_eq!(result.month(), Some(&DateTimeFormatMonth::Long));
    assert_eq!(result.year(), Some(&DateTimeFormatYear::Numeric));
}

#[test]
fn test_integration_skeleton_4() {
    // "h:mm a"
    let result = parse_date_time_skeleton("h:mm a").unwrap();
    assert_eq!(result.hour(), Some(&DateTimeFormatHour::Numeric));
    assert_eq!(result.hour12(), Some(true));
    assert_eq!(result.hour_cycle(), Some(&DateTimeFormatHourCycle::H12));
    assert_eq!(result.minute(), Some(&DateTimeFormatMinute::TwoDigit));
}

#[test]
fn test_integration_empty_skeleton() {
    let result = parse_date_time_skeleton("").unwrap();
    assert_eq!(result.year(), None);
    assert_eq!(result.month(), None);
    assert_eq!(result.day(), None);
    assert_eq!(result.hour(), None);
    assert_eq!(result.minute(), None);
    assert_eq!(result.second(), None);
}

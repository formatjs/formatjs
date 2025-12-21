use once_cell::sync::Lazy;

use crate::DateTimeFormatDay;
use crate::DateTimeFormatEra;
use crate::DateTimeFormatHour;
use crate::DateTimeFormatHourCycle;
use crate::DateTimeFormatMinute;
use crate::DateTimeFormatMonth;
use crate::DateTimeFormatOptions;
use crate::DateTimeFormatSecond;
use crate::DateTimeFormatTimeZoneName;
use crate::DateTimeFormatWeekday;
use crate::DateTimeFormatYear;

/// Regex pattern for matching date-time skeleton tokens
/// Based on Unicode TR35 Date Field Symbol Table
/// https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
///
/// Note: The original TypeScript regex includes a lookahead pattern to handle quoted strings,
/// but for simplicity in Rust, we match the basic patterns without the lookahead.
/// This should work fine for standard skeleton strings that don't contain quoted text.
///
/// We also include unsupported patterns (j, J, C, S, A) to explicitly error on them.
static DATE_TIME_REGEX: Lazy<regex::Regex> = Lazy::new(|| {
    regex::Regex::new(
        r"[Eec]{1,6}|G{1,5}|[Qq]{1,5}|[yYur]+|U{1,5}|[ML]{1,5}|d{1,2}|D{1,3}|F{1}|[abB]{1,5}|[hkHKjJC]{1,2}|w{1,2}|W{1}|m{1,2}|[sSA]{1,2}|[zZOvVxX]{1,4}"
    ).unwrap()
});

/// Parse a date-time skeleton string into DateTimeFormatOptions
///
/// Converts ICU date-time skeleton patterns to ECMA-402 DateTimeFormat options.
/// Reference: https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
///
/// # Arguments
/// * `skeleton` - The ICU date-time skeleton string to parse
///
/// # Returns
/// `Ok(DateTimeFormatOptions)` with the parsed settings,
/// or `Err(String)` if the skeleton contains unsupported patterns
///
/// # Supported Patterns
/// - `G` - Era (1-3: short, 4: long, 5: narrow)
/// - `y` - Year (1+: numeric, 2: 2-digit)
/// - `M`/`L` - Month (1: numeric, 2: 2-digit, 3: short, 4: long, 5: narrow)
/// - `d` - Day (1: numeric, 2: 2-digit)
/// - `E` - Weekday (1-3: short, 4: long, 5-6: narrow)
/// - `e`/`c` - Weekday (4: short, 5: long, 6: narrow)
/// - `a` - Period (sets hour12 to true)
/// - `h` - Hour 1-12 (hourCycle: h12)
/// - `H` - Hour 0-23 (hourCycle: h23)
/// - `K` - Hour 0-11 (hourCycle: h11)
/// - `k` - Hour 1-24 (hourCycle: h24)
/// - `m` - Minute (1: numeric, 2: 2-digit)
/// - `s` - Second (1: numeric, 2: 2-digit)
/// - `z` - Time zone name (1-3: short, 4: long)
///
/// # Unsupported Patterns (will return error)
/// - `Y`, `u`, `U`, `r` - Alternative year patterns
/// - `q`, `Q` - Quarter patterns
/// - `w`, `W` - Week patterns
/// - `D`, `F`, `g` - Alternative day patterns
/// - `b`, `B` - Alternative period patterns
/// - `j`, `J`, `C` - Alternative hour patterns
/// - `S`, `A` - Alternative second patterns
/// - `Z`, `O`, `v`, `V`, `X`, `x` - Alternative timezone patterns
///
/// # Examples
/// ```
/// use icu_skeleton_parser::parse_date_time_skeleton;
///
/// // Parse a simple date skeleton
/// let opts = parse_date_time_skeleton("yMMMd").unwrap();
/// assert!(opts.year().is_some());
/// assert!(opts.month().is_some());
/// assert!(opts.day().is_some());
///
/// // Parse a time skeleton
/// let opts = parse_date_time_skeleton("Hms").unwrap();
/// assert!(opts.hour().is_some());
/// assert!(opts.minute().is_some());
/// assert!(opts.second().is_some());
/// ```
pub fn parse_date_time_skeleton(skeleton: &str) -> Result<DateTimeFormatOptions, String> {
    let mut result = DateTimeFormatOptions::default();

    for capture in DATE_TIME_REGEX.captures_iter(skeleton) {
        if let Some(matched) = capture.get(0) {
            let match_str = matched.as_str();
            let len = match_str.len();
            let first_char = match_str.chars().next().unwrap();

            match first_char {
                // Era
                'G' => {
                    result.era = Some(match len {
                        4 => DateTimeFormatEra::Long,
                        5 => DateTimeFormatEra::Narrow,
                        _ => DateTimeFormatEra::Short,
                    });
                }
                // Year
                'y' => {
                    result.year = Some(if len == 2 {
                        DateTimeFormatYear::TwoDigit
                    } else {
                        DateTimeFormatYear::Numeric
                    });
                }
                'Y' | 'u' | 'U' | 'r' => {
                    return Err(
                        "`Y/u/U/r` (year) patterns are not supported, use `y` instead".to_string(),
                    );
                }
                // Quarter
                'q' | 'Q' => {
                    return Err("`q/Q` (quarter) patterns are not supported".to_string());
                }
                // Month
                'M' | 'L' => {
                    result.month = Some(match len {
                        1 => DateTimeFormatMonth::Numeric,
                        2 => DateTimeFormatMonth::TwoDigit,
                        3 => DateTimeFormatMonth::Short,
                        4 => DateTimeFormatMonth::Long,
                        _ => DateTimeFormatMonth::Narrow, // 5+
                    });
                }
                // Week
                'w' | 'W' => {
                    return Err("`w/W` (week) patterns are not supported".to_string());
                }
                // Day
                'd' => {
                    result.day = Some(if len == 1 {
                        DateTimeFormatDay::Numeric
                    } else {
                        DateTimeFormatDay::TwoDigit
                    });
                }
                'D' | 'F' | 'g' => {
                    return Err(
                        "`D/F/g` (day) patterns are not supported, use `d` instead".to_string()
                    );
                }
                // Weekday
                'E' => {
                    result.weekday = Some(match len {
                        4 => DateTimeFormatWeekday::Long,
                        5..=6 => DateTimeFormatWeekday::Narrow,
                        _ => DateTimeFormatWeekday::Short,
                    });
                }
                'e' => {
                    if len < 4 {
                        return Err("`e..eee` (weekday) patterns are not supported".to_string());
                    }
                    result.weekday = Some(match len {
                        4 => DateTimeFormatWeekday::Short,
                        5 => DateTimeFormatWeekday::Long,
                        6 => DateTimeFormatWeekday::Narrow,
                        _ => DateTimeFormatWeekday::Short,
                    });
                }
                'c' => {
                    if len < 4 {
                        return Err("`c..ccc` (weekday) patterns are not supported".to_string());
                    }
                    result.weekday = Some(match len {
                        4 => DateTimeFormatWeekday::Short,
                        5 => DateTimeFormatWeekday::Long,
                        6 => DateTimeFormatWeekday::Narrow,
                        _ => DateTimeFormatWeekday::Short,
                    });
                }
                // Period
                'a' => {
                    // AM, PM
                    result.hour12 = Some(true);
                }
                'b' | 'B' => {
                    return Err(
                        "`b/B` (period) patterns are not supported, use `a` instead".to_string()
                    );
                }
                // Hour
                'h' => {
                    result.hour_cycle = Some(DateTimeFormatHourCycle::H12);
                    result.hour = Some(if len == 1 {
                        DateTimeFormatHour::Numeric
                    } else {
                        DateTimeFormatHour::TwoDigit
                    });
                }
                'H' => {
                    result.hour_cycle = Some(DateTimeFormatHourCycle::H23);
                    result.hour = Some(if len == 1 {
                        DateTimeFormatHour::Numeric
                    } else {
                        DateTimeFormatHour::TwoDigit
                    });
                }
                'K' => {
                    result.hour_cycle = Some(DateTimeFormatHourCycle::H11);
                    result.hour = Some(if len == 1 {
                        DateTimeFormatHour::Numeric
                    } else {
                        DateTimeFormatHour::TwoDigit
                    });
                }
                'k' => {
                    result.hour_cycle = Some(DateTimeFormatHourCycle::H24);
                    result.hour = Some(if len == 1 {
                        DateTimeFormatHour::Numeric
                    } else {
                        DateTimeFormatHour::TwoDigit
                    });
                }
                'j' | 'J' | 'C' => {
                    return Err(
                        "`j/J/C` (hour) patterns are not supported, use `h/H/K/k` instead"
                            .to_string(),
                    );
                }
                // Minute
                'm' => {
                    result.minute = Some(if len == 1 {
                        DateTimeFormatMinute::Numeric
                    } else {
                        DateTimeFormatMinute::TwoDigit
                    });
                }
                // Second
                's' => {
                    result.second = Some(if len == 1 {
                        DateTimeFormatSecond::Numeric
                    } else {
                        DateTimeFormatSecond::TwoDigit
                    });
                }
                'S' | 'A' => {
                    return Err(
                        "`S/A` (second) patterns are not supported, use `s` instead".to_string()
                    );
                }
                // Zone
                'z' => {
                    result.time_zone_name = Some(if len < 4 {
                        DateTimeFormatTimeZoneName::Short
                    } else {
                        DateTimeFormatTimeZoneName::Long
                    });
                }
                'Z' | 'O' | 'v' | 'V' | 'X' | 'x' => {
                    return Err(
                        "`Z/O/v/V/X/x` (timeZone) patterns are not supported, use `z` instead"
                            .to_string(),
                    );
                }
                _ => {
                    // Ignore unrecognized patterns
                }
            }
        }
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

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
        assert!(result
            .unwrap_err()
            .contains("`e..eee` (weekday) patterns are not supported"));
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
}

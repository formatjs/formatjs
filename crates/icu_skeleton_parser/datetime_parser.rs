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

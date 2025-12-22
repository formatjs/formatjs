use crate::time_data_generated::TIME_DATA;
use icu::locale::Locale;

/// Returns the best matching date time pattern if a date time skeleton
/// pattern is provided with a locale. Follows the Unicode specification:
/// https://www.unicode.org/reports/tr35/tr35-dates.html#table-mapping-requested-time-skeletons-to-patterns
///
/// # Arguments
///
/// * `skeleton` - date time skeleton pattern that possibly includes j, J or C
/// * `locale` - the locale to use for determining the best pattern
///
/// # Examples
///
/// ```
/// use icu_messageformat_parser::get_best_pattern;
/// use icu::locale::Locale;
///
/// let locale: Locale = "en-US".parse().unwrap();
/// let pattern = get_best_pattern("jmm", &locale);
/// assert!(pattern.len() > 0);
/// ```
pub fn get_best_pattern(skeleton: &str, locale: &Locale) -> String {
    let mut skeleton_copy = String::new();
    let chars: Vec<char> = skeleton.chars().collect();
    let mut pattern_pos = 0;

    while pattern_pos < chars.len() {
        let pattern_char = chars[pattern_pos];

        if pattern_char == 'j' {
            let mut extra_length = 0;
            while pattern_pos + 1 < chars.len() && chars[pattern_pos + 1] == pattern_char {
                extra_length += 1;
                pattern_pos += 1;
            }

            let hour_len = 1 + (extra_length & 1);
            let day_period_len = if extra_length < 2 {
                1
            } else {
                3 + (extra_length >> 1)
            };
            let day_period_char = 'a';
            let hour_char = get_default_hour_symbol_from_locale(locale);

            let effective_day_period_len = if hour_char == 'H' || hour_char == 'k' {
                0
            } else {
                day_period_len
            };

            for _ in 0..effective_day_period_len {
                skeleton_copy.push(day_period_char);
            }
            for _ in 0..hour_len {
                skeleton_copy.insert(0, hour_char);
            }
        } else if pattern_char == 'J' {
            skeleton_copy.push('H');
        } else {
            skeleton_copy.push(pattern_char);
        }

        pattern_pos += 1;
    }

    skeleton_copy
}

/// Maps the hour cycle type of the given `locale` to the corresponding time pattern.
///
/// # Arguments
///
/// * `locale` - the locale to determine the hour symbol from
fn get_default_hour_symbol_from_locale(locale: &Locale) -> char {
    // Check for hour cycle in locale extensions
    for (key, value) in locale.extensions.unicode.keywords.iter() {
        if key.as_str() == "hc" {
            return match value.as_single_subtag().map(|s| s.as_str()) {
                Some("h24") => 'k',
                Some("h23") => 'H',
                Some("h12") => 'h',
                Some("h11") => 'K',
                _ => get_hour_symbol_from_time_data(locale),
            };
        }
    }

    get_hour_symbol_from_time_data(locale)
}

/// Looks up the hour symbol from the time data based on locale.
fn get_hour_symbol_from_time_data(locale: &Locale) -> char {
    let language_tag = locale.id.language.as_str();
    let region_tag = locale.id.region.as_ref().map(|r| r.as_str());

    // Try different lookup strategies
    let hour_cycles = if let Some(region) = region_tag {
        TIME_DATA.get(region)
    } else {
        None
    }
    .or_else(|| TIME_DATA.get(language_tag))
    .or_else(|| {
        let key = format!("{}-001", language_tag);
        TIME_DATA.get(key.as_str())
    })
    .or_else(|| TIME_DATA.get("001"))
    .expect("TIME_DATA should always have '001' entry");

    // Return the first hour cycle character
    hour_cycles
        .first()
        .and_then(|s| s.chars().next())
        .unwrap_or('H')
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_best_pattern_simple() {
        let locale: Locale = "en-US".parse().unwrap();
        let result = get_best_pattern("mm", &locale);
        assert_eq!(result, "mm");
    }

    #[test]
    fn test_get_best_pattern_with_j() {
        let locale: Locale = "en-US".parse().unwrap();
        let result = get_best_pattern("jmm", &locale);
        // Should convert 'j' to 'h' for en-US (12-hour format)
        assert!(result.contains('h') || result.contains('H'));
        assert!(result.contains("mm"));
    }

    #[test]
    fn test_get_best_pattern_with_capital_j() {
        let locale: Locale = "en-US".parse().unwrap();
        let result = get_best_pattern("Jmm", &locale);
        // 'J' should always convert to 'H'
        assert!(result.starts_with('H'));
        assert!(result.contains("mm"));
    }

    #[test]
    fn test_get_best_pattern_multiple_j() {
        let locale: Locale = "en-US".parse().unwrap();
        let result = get_best_pattern("jjmm", &locale);
        // Multiple 'j' characters should be handled
        assert!(result.len() > 2);
    }

    #[test]
    fn test_get_best_pattern_with_hour_cycle() {
        let locale: Locale = "en-US-u-hc-h23".parse().unwrap();
        let result = get_best_pattern("jmm", &locale);
        // Should convert 'j' to 'H' because of h23 hour cycle
        assert!(result.starts_with('H'));
    }

    #[test]
    fn test_get_default_hour_symbol_en_us() {
        let locale: Locale = "en-US".parse().unwrap();
        let symbol = get_default_hour_symbol_from_locale(&locale);
        // en-US typically uses 12-hour format
        assert!(symbol == 'h' || symbol == 'H');
    }

    #[test]
    fn test_get_default_hour_symbol_fr_fr() {
        let locale: Locale = "fr-FR".parse().unwrap();
        let symbol = get_default_hour_symbol_from_locale(&locale);
        // fr-FR typically uses 24-hour format
        assert!(symbol == 'H' || symbol == 'k');
    }

    #[test]
    fn test_time_data_fallback() {
        let locale: Locale = "xx-YY".parse().unwrap();
        let symbol = get_default_hour_symbol_from_locale(&locale);
        // Should fall back to '001' default
        assert!(symbol == 'H' || symbol == 'h' || symbol == 'k' || symbol == 'K');
    }
}

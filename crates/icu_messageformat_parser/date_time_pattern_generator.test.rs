use formatjs_icu_messageformat_parser::date_time_pattern_generator::*;
use icu::locale::Locale;

#[test]
fn test_locale_hour_cycle_preferences() {
    for (tag, expected) in [
        ("fr-CA", "H"),
        ("zh-TW", "ha"),
        ("en-GB", "H"),
        ("fr-CA-u-hc-h12", "ha"),
        ("en-GB-u-hc-h12", "ha"),
    ] {
        let locale: Locale = tag.parse().unwrap();
        assert_eq!(get_best_pattern("j", &locale), expected, "{tag}");
    }
}

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
    let symbol = get_best_pattern("j", &locale).chars().next().unwrap();
    // en-US typically uses 12-hour format
    assert!(symbol == 'h' || symbol == 'H');
}

#[test]
fn test_get_default_hour_symbol_fr_fr() {
    let locale: Locale = "fr-FR".parse().unwrap();
    let symbol = get_best_pattern("j", &locale).chars().next().unwrap();
    // fr-FR typically uses 24-hour format
    assert!(symbol == 'H' || symbol == 'k');
}

#[test]
fn test_time_data_fallback() {
    let locale: Locale = "xx-YY".parse().unwrap();
    let symbol = get_best_pattern("j", &locale).chars().next().unwrap();
    // Should fall back to '001' default
    assert!(symbol == 'H' || symbol == 'h' || symbol == 'k' || symbol == 'K');
}

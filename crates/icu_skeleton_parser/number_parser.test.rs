use formatjs_icu_skeleton_parser::ExtendedNumberFormatOptions;
use formatjs_icu_skeleton_parser::NumberFormatNotation;
use formatjs_icu_skeleton_parser::NumberFormatOptionsCompactDisplay;
use formatjs_icu_skeleton_parser::NumberFormatOptionsCurrencyDisplay;
use formatjs_icu_skeleton_parser::NumberFormatOptionsCurrencySign;
use formatjs_icu_skeleton_parser::NumberFormatOptionsSignDisplay;
use formatjs_icu_skeleton_parser::NumberFormatOptionsStyle;
use formatjs_icu_skeleton_parser::NumberFormatOptionsUnitDisplay;
use formatjs_icu_skeleton_parser::NumberSkeletonToken;
use formatjs_icu_skeleton_parser::RoundingModeType;
use formatjs_icu_skeleton_parser::RoundingPriorityType;
use formatjs_icu_skeleton_parser::TrailingZeroDisplay;
use formatjs_icu_skeleton_parser::number_parser::*;

#[test]
fn test_icu_unit_with_prefix() {
    assert_eq!(unit_from_skeleton("measure-area"), "area");
}

#[test]
fn test_icu_unit_length_meter() {
    assert_eq!(unit_from_skeleton("length-meter"), "meter");
}

#[test]
fn test_icu_unit_volume_liter() {
    assert_eq!(unit_from_skeleton("volume-liter"), "liter");
}

#[test]
fn test_icu_unit_temperature_celsius() {
    assert_eq!(unit_from_skeleton("temperature-celsius"), "celsius");
}

#[test]
fn test_icu_unit_without_hyphen() {
    assert_eq!(unit_from_skeleton("percent"), "percent");
}

#[test]
fn test_icu_unit_multiple_hyphens() {
    // Should only split on first hyphen
    assert_eq!(unit_from_skeleton("speed-mile-per-hour"), "mile-per-hour");
}

#[test]
fn test_icu_unit_empty_string() {
    assert_eq!(unit_from_skeleton(""), "");
}

#[test]
fn test_icu_unit_only_hyphen() {
    assert_eq!(unit_from_skeleton("-"), "");
}

#[test]
fn test_icu_unit_hyphen_at_end() {
    assert_eq!(unit_from_skeleton("measure-"), "");
}

#[test]
fn test_icu_unit_hyphen_at_start() {
    assert_eq!(unit_from_skeleton("-meter"), "meter");
}

#[test]
fn test_parse_significant_precision_exact() {
    // @@ case - exact 2 significant digits
    let opts = number_options("@@");
    assert_eq!(opts.minimum_significant_digits(), Some(2));
    assert_eq!(opts.maximum_significant_digits(), Some(2));
}

#[test]
fn test_parse_significant_precision_exact_three() {
    // @@@ case - exact 3 significant digits
    let opts = number_options("@@@");
    assert_eq!(opts.minimum_significant_digits(), Some(3));
    assert_eq!(opts.maximum_significant_digits(), Some(3));
}

#[test]
fn test_parse_significant_precision_minimum_with_trailing() {
    // @@@+ case - minimum 3 significant digits with trailing zeros
    let opts = number_options("@@@+");
    assert_eq!(opts.minimum_significant_digits(), Some(3));
    assert_eq!(opts.maximum_significant_digits(), None);
}

#[test]
fn test_parse_significant_precision_maximum_only() {
    // ### case - maximum 3 significant digits
    let opts = number_options("###");
    assert_eq!(opts.minimum_significant_digits(), None);
    assert_eq!(opts.maximum_significant_digits(), Some(3));
}

#[test]
fn test_parse_significant_precision_min_max() {
    // @@## case - min 2, max 4 significant digits
    let opts = number_options("@@##");
    assert_eq!(opts.minimum_significant_digits(), Some(2));
    assert_eq!(opts.maximum_significant_digits(), Some(4));
}

#[test]
fn test_parse_significant_precision_min_max_complex() {
    // @@@### case - min 3, max 6 significant digits
    let opts = number_options("@@@###");
    assert_eq!(opts.minimum_significant_digits(), Some(3));
    assert_eq!(opts.maximum_significant_digits(), Some(6));
}

#[test]
fn test_parse_significant_precision_with_more_precision() {
    // @@r case - exact 2 digits with morePrecision rounding
    let opts = number_options("@@r");
    assert_eq!(opts.minimum_significant_digits(), Some(2));
    assert_eq!(opts.maximum_significant_digits(), Some(2));
    assert_eq!(
        opts.rounding_priority(),
        Some(&RoundingPriorityType::MorePrecision)
    );
}

#[test]
fn test_parse_significant_precision_with_less_precision() {
    // @@@s case - exact 3 digits with lessPrecision rounding
    let opts = number_options("@@@s");
    assert_eq!(opts.minimum_significant_digits(), Some(3));
    assert_eq!(opts.maximum_significant_digits(), Some(3));
    assert_eq!(
        opts.rounding_priority(),
        Some(&RoundingPriorityType::LessPrecision)
    );
}

#[test]
fn test_parse_significant_precision_complex_with_rounding() {
    // @@##r case - min 2, max 4 with morePrecision rounding
    let opts = number_options("@@##r");
    assert_eq!(opts.minimum_significant_digits(), Some(2));
    assert_eq!(opts.maximum_significant_digits(), Some(4));
    assert_eq!(
        opts.rounding_priority(),
        Some(&RoundingPriorityType::MorePrecision)
    );
}

#[test]
fn test_parse_significant_precision_plus_with_rounding() {
    // @@+s case - min 2 with lessPrecision rounding
    let opts = number_options("@@+s");
    assert_eq!(opts.minimum_significant_digits(), Some(2));
    assert_eq!(opts.maximum_significant_digits(), None);
    assert_eq!(
        opts.rounding_priority(),
        Some(&RoundingPriorityType::LessPrecision)
    );
}

#[test]
fn test_parse_significant_precision_empty() {
    // Empty string should return default options
    let opts = number_options("");
    assert_eq!(opts.minimum_significant_digits(), None);
    assert_eq!(opts.maximum_significant_digits(), None);
    assert_eq!(opts.rounding_priority(), None);
}

#[test]
fn test_parse_significant_precision_single_at() {
    // @ case - exact 1 significant digit
    let opts = number_options("@");
    assert_eq!(opts.minimum_significant_digits(), Some(1));
    assert_eq!(opts.maximum_significant_digits(), Some(1));
}

#[test]
fn test_parse_significant_precision_single_hash() {
    // # case - maximum 1 significant digit
    let opts = number_options("#");
    assert_eq!(opts.minimum_significant_digits(), None);
    assert_eq!(opts.maximum_significant_digits(), Some(1));
}

#[test]
fn test_parse_sign_auto() {
    let opts = parse_skeleton_options("sign-auto").unwrap();
    assert_eq!(
        opts.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Auto)
    );
    assert_eq!(opts.currency_sign(), None);
}

#[test]
fn test_parse_sign_accounting() {
    let opts = parse_skeleton_options("sign-accounting").unwrap();
    assert_eq!(
        opts.currency_sign(),
        Some(&NumberFormatOptionsCurrencySign::Accounting)
    );
    assert_eq!(opts.sign_display(), None);
}

#[test]
fn test_parse_sign_accounting_shorthand() {
    // () is shorthand for sign-accounting
    let opts = parse_skeleton_options("()").unwrap();
    assert_eq!(
        opts.currency_sign(),
        Some(&NumberFormatOptionsCurrencySign::Accounting)
    );
    assert_eq!(opts.sign_display(), None);
}

#[test]
fn test_parse_sign_always() {
    let opts = parse_skeleton_options("sign-always").unwrap();
    assert_eq!(
        opts.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Always)
    );
    assert_eq!(opts.currency_sign(), None);
}

#[test]
fn test_parse_sign_always_shorthand() {
    // +! is shorthand for sign-always
    let opts = parse_skeleton_options("+!").unwrap();
    assert_eq!(
        opts.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Always)
    );
    assert_eq!(opts.currency_sign(), None);
}

#[test]
fn test_parse_sign_accounting_always() {
    let opts = parse_skeleton_options("sign-accounting-always").unwrap();
    assert_eq!(
        opts.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Always)
    );
    assert_eq!(
        opts.currency_sign(),
        Some(&NumberFormatOptionsCurrencySign::Accounting)
    );
}

#[test]
fn test_parse_sign_accounting_always_shorthand() {
    // ()! is shorthand for sign-accounting-always
    let opts = parse_skeleton_options("()!").unwrap();
    assert_eq!(
        opts.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Always)
    );
    assert_eq!(
        opts.currency_sign(),
        Some(&NumberFormatOptionsCurrencySign::Accounting)
    );
}

#[test]
fn test_parse_sign_except_zero() {
    let opts = parse_skeleton_options("sign-except-zero").unwrap();
    assert_eq!(
        opts.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::ExceptZero)
    );
    assert_eq!(opts.currency_sign(), None);
}

#[test]
fn test_parse_sign_except_zero_shorthand() {
    // +? is shorthand for sign-except-zero
    let opts = parse_skeleton_options("+?").unwrap();
    assert_eq!(
        opts.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::ExceptZero)
    );
    assert_eq!(opts.currency_sign(), None);
}

#[test]
fn test_parse_sign_accounting_except_zero() {
    let opts = parse_skeleton_options("sign-accounting-except-zero").unwrap();
    assert_eq!(
        opts.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::ExceptZero)
    );
    assert_eq!(
        opts.currency_sign(),
        Some(&NumberFormatOptionsCurrencySign::Accounting)
    );
}

#[test]
fn test_parse_sign_accounting_except_zero_shorthand() {
    // ()? is shorthand for sign-accounting-except-zero
    let opts = parse_skeleton_options("()?").unwrap();
    assert_eq!(
        opts.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::ExceptZero)
    );
    assert_eq!(
        opts.currency_sign(),
        Some(&NumberFormatOptionsCurrencySign::Accounting)
    );
}

#[test]
fn test_parse_sign_never() {
    let opts = parse_skeleton_options("sign-never").unwrap();
    assert_eq!(
        opts.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Never)
    );
    assert_eq!(opts.currency_sign(), None);
}

#[test]
fn test_parse_sign_never_shorthand() {
    // +_ is shorthand for sign-never
    let opts = parse_skeleton_options("+_").unwrap();
    assert_eq!(
        opts.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Never)
    );
    assert_eq!(opts.currency_sign(), None);
}

#[test]
fn test_parse_sign_unknown() {
    // Unknown patterns should return None
    let opts = parse_skeleton_options("unknown-sign").unwrap();
    assert_eq!(opts, ExtendedNumberFormatOptions::default());
}

#[test]
fn test_parse_sign_empty() {
    // Empty skeleton stems retain default options.
    let opts = parse_skeleton_options("").unwrap();
    assert_eq!(opts, ExtendedNumberFormatOptions::default());
}

#[test]
fn test_parse_concise_scientific() {
    let opts = parse_skeleton_options("E").unwrap();
    assert_eq!(opts.notation(), Some(&NumberFormatNotation::Scientific));
    assert_eq!(opts.minimum_integer_digits(), None);
}

#[test]
fn test_parse_concise_engineering() {
    let opts = parse_skeleton_options("EE").unwrap();
    assert_eq!(opts.notation(), Some(&NumberFormatNotation::Engineering));
    assert_eq!(opts.minimum_integer_digits(), None);
}

#[test]
fn test_parse_concise_scientific_with_integer_width() {
    let opts = parse_skeleton_options("E0").unwrap();
    assert_eq!(opts.notation(), Some(&NumberFormatNotation::Scientific));
    assert_eq!(opts.minimum_integer_digits(), Some(1));
}

#[test]
fn test_parse_concise_scientific_with_integer_width_three() {
    let opts = parse_skeleton_options("E000").unwrap();
    assert_eq!(opts.notation(), Some(&NumberFormatNotation::Scientific));
    assert_eq!(opts.minimum_integer_digits(), Some(3));
}

#[test]
fn test_parse_concise_engineering_with_integer_width() {
    let opts = parse_skeleton_options("EE00").unwrap();
    assert_eq!(opts.notation(), Some(&NumberFormatNotation::Engineering));
    assert_eq!(opts.minimum_integer_digits(), Some(2));
}

#[test]
fn test_parse_concise_scientific_with_sign_always() {
    let opts = parse_skeleton_options("E+!").unwrap();
    assert_eq!(opts.notation(), Some(&NumberFormatNotation::Scientific));
    assert_eq!(
        opts.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Always)
    );
    assert_eq!(opts.minimum_integer_digits(), None);
}

#[test]
fn test_parse_concise_scientific_with_sign_except_zero() {
    let opts = parse_skeleton_options("E+?").unwrap();
    assert_eq!(opts.notation(), Some(&NumberFormatNotation::Scientific));
    assert_eq!(
        opts.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::ExceptZero)
    );
    assert_eq!(opts.minimum_integer_digits(), None);
}

#[test]
fn test_parse_concise_engineering_with_sign_always() {
    let opts = parse_skeleton_options("EE+!").unwrap();
    assert_eq!(opts.notation(), Some(&NumberFormatNotation::Engineering));
    assert_eq!(
        opts.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Always)
    );
}

#[test]
fn test_parse_concise_scientific_with_sign_and_width() {
    let opts = parse_skeleton_options("E+!0").unwrap();
    assert_eq!(opts.notation(), Some(&NumberFormatNotation::Scientific));
    assert_eq!(
        opts.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Always)
    );
    assert_eq!(opts.minimum_integer_digits(), Some(1));
}

#[test]
fn test_parse_concise_engineering_with_sign_and_width() {
    let opts = parse_skeleton_options("EE+?000").unwrap();
    assert_eq!(opts.notation(), Some(&NumberFormatNotation::Engineering));
    assert_eq!(
        opts.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::ExceptZero)
    );
    assert_eq!(opts.minimum_integer_digits(), Some(3));
}

#[test]
fn test_parse_concise_scientific_not_recognized() {
    // Patterns that don't start with E should return None
    let result = parse_skeleton_options("compact").unwrap();
    assert_eq!(result, ExtendedNumberFormatOptions::default());
}

#[test]
fn test_parse_concise_scientific_malformed() {
    let options = parse_skeleton_options("E123").unwrap();
    assert_eq!(options, ExtendedNumberFormatOptions::default());
}

#[test]
fn test_parse_concise_scientific_malformed_with_letters() {
    let options = parse_skeleton_options("Eabc").unwrap();
    assert_eq!(options, ExtendedNumberFormatOptions::default());
}

#[test]
fn test_parse_concise_engineering_malformed() {
    let options = parse_skeleton_options("EE+!abc").unwrap();
    assert_eq!(options, ExtendedNumberFormatOptions::default());
}

#[test]
fn test_parse_concise_scientific_empty() {
    // Empty skeleton stems retain default options.
    let result = parse_skeleton_options("").unwrap();
    assert_eq!(result, ExtendedNumberFormatOptions::default());
}

#[test]
fn test_parse_number_skeleton_percent() {
    let tokens = NumberSkeletonToken::parse_from_string("percent").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.style(), Some(&NumberFormatOptionsStyle::Percent));
}

#[test]
fn test_parse_number_skeleton_percent_shorthand() {
    let tokens = NumberSkeletonToken::parse_from_string("%").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.style(), Some(&NumberFormatOptionsStyle::Percent));
}

#[test]
fn test_parse_number_skeleton_percent_scaled() {
    let tokens = NumberSkeletonToken::parse_from_string("%x100").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.style(), Some(&NumberFormatOptionsStyle::Percent));
    assert_eq!(result.scale(), Some(100.0));
}

#[test]
fn test_parse_number_skeleton_currency() {
    let tokens = NumberSkeletonToken::parse_from_string("currency/USD").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.style(), Some(&NumberFormatOptionsStyle::Currency));
    assert_eq!(result.currency(), Some("USD"));
}

#[test]
fn test_parse_number_skeleton_unit() {
    let tokens = NumberSkeletonToken::parse_from_string("unit/length-meter").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.style(), Some(&NumberFormatOptionsStyle::Unit));
    assert_eq!(result.unit(), Some("meter"));
}

#[test]
fn test_parse_number_skeleton_compact_short() {
    let tokens = NumberSkeletonToken::parse_from_string("compact-short").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.notation(), Some(&NumberFormatNotation::Compact));
    assert_eq!(
        result.compact_display(),
        Some(&NumberFormatOptionsCompactDisplay::Short)
    );
}

#[test]
fn test_parse_number_skeleton_compact_short_k() {
    let tokens = NumberSkeletonToken::parse_from_string("K").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.notation(), Some(&NumberFormatNotation::Compact));
    assert_eq!(
        result.compact_display(),
        Some(&NumberFormatOptionsCompactDisplay::Short)
    );
}

#[test]
fn test_parse_number_skeleton_scientific() {
    let tokens = NumberSkeletonToken::parse_from_string("scientific").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.notation(), Some(&NumberFormatNotation::Scientific));
}

#[test]
fn test_parse_number_skeleton_scientific_with_sign() {
    let tokens = NumberSkeletonToken::parse_from_string("scientific/sign-always").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.notation(), Some(&NumberFormatNotation::Scientific));
    assert_eq!(
        result.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Always)
    );
}

#[test]
fn test_parse_number_skeleton_fraction_precision() {
    let tokens = NumberSkeletonToken::parse_from_string(".00").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.minimum_fraction_digits(), Some(2));
    assert_eq!(result.maximum_fraction_digits(), Some(2));
}

#[test]
fn test_parse_number_skeleton_fraction_precision_max_only() {
    let tokens = NumberSkeletonToken::parse_from_string(".###").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.minimum_fraction_digits(), None);
    assert_eq!(result.maximum_fraction_digits(), Some(3));
}

#[test]
fn test_parse_number_skeleton_integer_width() {
    let tokens = NumberSkeletonToken::parse_from_string("000").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.minimum_integer_digits(), Some(3));
}

#[test]
fn test_parse_number_skeleton_significant_digits() {
    let tokens = NumberSkeletonToken::parse_from_string("@@").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.minimum_significant_digits(), Some(2));
    assert_eq!(result.maximum_significant_digits(), Some(2));
}

#[test]
fn test_parse_number_skeleton_scale() {
    let tokens = NumberSkeletonToken::parse_from_string("scale/100").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.scale(), Some(100.0));
}

#[test]
fn test_parse_number_skeleton_rounding_mode() {
    let tokens = NumberSkeletonToken::parse_from_string("rounding-mode-half-even").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.rounding_mode(), Some(&RoundingModeType::HalfEven));
}

#[test]
fn test_parse_number_skeleton_group_off() {
    let tokens = NumberSkeletonToken::parse_from_string("group-off").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(
        result.use_grouping(),
        Some(&formatjs_icu_skeleton_parser::UseGroupingType::Bool(false))
    );
}

#[test]
fn test_parse_number_skeleton_complex() {
    let tokens =
        NumberSkeletonToken::parse_from_string("currency/EUR compact-short sign-always").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.style(), Some(&NumberFormatOptionsStyle::Currency));
    assert_eq!(result.currency(), Some("EUR"));
    assert_eq!(result.notation(), Some(&NumberFormatNotation::Compact));
    assert_eq!(
        result.compact_display(),
        Some(&NumberFormatOptionsCompactDisplay::Short)
    );
    assert_eq!(
        result.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Always)
    );
}

#[test]
fn test_parse_number_skeleton_concise_scientific() {
    let tokens = NumberSkeletonToken::parse_from_string("E+!00").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.notation(), Some(&NumberFormatNotation::Scientific));
    assert_eq!(
        result.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Always)
    );
    assert_eq!(result.minimum_integer_digits(), Some(2));
}

// Integration tests from TypeScript test suite
#[test]
fn test_integration_percent_max_fraction() {
    // "percent .##"
    let tokens = NumberSkeletonToken::parse_from_string("percent .##").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.style(), Some(&NumberFormatOptionsStyle::Percent));
    assert_eq!(result.maximum_fraction_digits(), Some(2));
}

#[test]
fn test_integration_max_fraction_only() {
    // ".##"
    let tokens = NumberSkeletonToken::parse_from_string(".##").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.maximum_fraction_digits(), Some(2));
}

#[test]
fn test_integration_trailing_zero_display() {
    // ".##/w"
    let tokens = NumberSkeletonToken::parse_from_string(".##/w").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.maximum_fraction_digits(), Some(2));
    assert_eq!(
        result.trailing_zero_display(),
        Some(&TrailingZeroDisplay::StripIfInteger)
    );
}

#[test]
fn test_integration_precision_integer() {
    // "."
    let tokens = NumberSkeletonToken::parse_from_string(".").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.maximum_fraction_digits(), Some(0));
}

#[test]
fn test_integration_percent_shorthand() {
    // "% .##"
    let tokens = NumberSkeletonToken::parse_from_string("% .##").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.style(), Some(&NumberFormatOptionsStyle::Percent));
    assert_eq!(result.maximum_fraction_digits(), Some(2));
}

#[test]
fn test_integration_rounding_priority_more() {
    // ".##/@##r"
    let tokens = NumberSkeletonToken::parse_from_string(".##/@##r").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.maximum_fraction_digits(), Some(2));
    assert_eq!(result.minimum_significant_digits(), Some(1));
    assert_eq!(result.maximum_significant_digits(), Some(3));
    assert_eq!(
        result.rounding_priority(),
        Some(&RoundingPriorityType::MorePrecision)
    );
}

#[test]
fn test_integration_rounding_priority_less() {
    // ".##/@##s"
    let tokens = NumberSkeletonToken::parse_from_string(".##/@##s").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.maximum_fraction_digits(), Some(2));
    assert_eq!(result.minimum_significant_digits(), Some(1));
    assert_eq!(result.maximum_significant_digits(), Some(3));
    assert_eq!(
        result.rounding_priority(),
        Some(&RoundingPriorityType::LessPrecision)
    );
}

#[test]
fn test_integration_single_sig_digit_rounding_floor() {
    // "@ rounding-mode-floor"
    let tokens = NumberSkeletonToken::parse_from_string("@ rounding-mode-floor").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.minimum_significant_digits(), Some(1));
    assert_eq!(result.maximum_significant_digits(), Some(1));
    assert_eq!(result.rounding_mode(), Some(&RoundingModeType::Floor));
}

#[test]
fn test_integration_percent_min_fraction() {
    // "percent .000*"
    let tokens = NumberSkeletonToken::parse_from_string("percent .000*").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.style(), Some(&NumberFormatOptionsStyle::Percent));
    assert_eq!(result.minimum_fraction_digits(), Some(3));
}

#[test]
fn test_integration_percent_min_max_fraction() {
    // "percent .0###"
    let tokens = NumberSkeletonToken::parse_from_string("percent .0###").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.style(), Some(&NumberFormatOptionsStyle::Percent));
    assert_eq!(result.minimum_fraction_digits(), Some(1));
    assert_eq!(result.maximum_fraction_digits(), Some(4));
}

#[test]
fn test_integration_percent_fraction_sig_digits_1() {
    // "percent .00/@##"
    let tokens = NumberSkeletonToken::parse_from_string("percent .00/@##").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.style(), Some(&NumberFormatOptionsStyle::Percent));
    assert_eq!(result.minimum_fraction_digits(), Some(2));
    assert_eq!(result.maximum_fraction_digits(), Some(2));
    assert_eq!(result.minimum_significant_digits(), Some(1));
    assert_eq!(result.maximum_significant_digits(), Some(3));
}

#[test]
fn test_integration_percent_fraction_sig_digits_2() {
    // "percent .00/@@@"
    let tokens = NumberSkeletonToken::parse_from_string("percent .00/@@@").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.style(), Some(&NumberFormatOptionsStyle::Percent));
    assert_eq!(result.minimum_fraction_digits(), Some(2));
    assert_eq!(result.maximum_fraction_digits(), Some(2));
    assert_eq!(result.minimum_significant_digits(), Some(3));
    assert_eq!(result.maximum_significant_digits(), Some(3));
}

#[test]
fn test_integration_percent_scale() {
    // "percent scale/0.01"
    let tokens = NumberSkeletonToken::parse_from_string("percent scale/0.01").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.style(), Some(&NumberFormatOptionsStyle::Percent));
    assert_eq!(result.scale(), Some(0.01));
}

#[test]
fn test_integration_currency_precision_integer() {
    // "currency/CAD ."
    let tokens = NumberSkeletonToken::parse_from_string("currency/CAD .").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.style(), Some(&NumberFormatOptionsStyle::Currency));
    assert_eq!(result.currency(), Some("CAD"));
    assert_eq!(result.maximum_fraction_digits(), Some(0));
}

#[test]
fn test_integration_currency_trailing_zero() {
    // ".00/w currency/CAD"
    let tokens = NumberSkeletonToken::parse_from_string(".00/w currency/CAD").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.style(), Some(&NumberFormatOptionsStyle::Currency));
    assert_eq!(result.currency(), Some("CAD"));
    assert_eq!(result.minimum_fraction_digits(), Some(2));
    assert_eq!(result.maximum_fraction_digits(), Some(2));
    assert_eq!(
        result.trailing_zero_display(),
        Some(&TrailingZeroDisplay::StripIfInteger)
    );
}

#[test]
fn test_integration_currency_sig_digits_1() {
    // "currency/GBP .0*/@@@"
    let tokens = NumberSkeletonToken::parse_from_string("currency/GBP .0*/@@@").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.style(), Some(&NumberFormatOptionsStyle::Currency));
    assert_eq!(result.currency(), Some("GBP"));
    assert_eq!(result.minimum_fraction_digits(), Some(1));
    assert_eq!(result.minimum_significant_digits(), Some(3));
    assert_eq!(result.maximum_significant_digits(), Some(3));
}

#[test]
fn test_integration_currency_sig_digits_2() {
    // "currency/GBP .00##/@@@"
    let tokens = NumberSkeletonToken::parse_from_string("currency/GBP .00##/@@@").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.style(), Some(&NumberFormatOptionsStyle::Currency));
    assert_eq!(result.currency(), Some("GBP"));
    assert_eq!(result.minimum_fraction_digits(), Some(2));
    assert_eq!(result.maximum_fraction_digits(), Some(4));
    assert_eq!(result.minimum_significant_digits(), Some(3));
    assert_eq!(result.maximum_significant_digits(), Some(3));
}

#[test]
fn test_integration_currency_full_name() {
    // "currency/GBP .00##/@@@ unit-width-full-name"
    let tokens =
        NumberSkeletonToken::parse_from_string("currency/GBP .00##/@@@ unit-width-full-name")
            .unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.style(), Some(&NumberFormatOptionsStyle::Currency));
    assert_eq!(result.currency(), Some("GBP"));
    assert_eq!(
        result.currency_display(),
        Some(&NumberFormatOptionsCurrencyDisplay::Name)
    );
    assert_eq!(result.minimum_fraction_digits(), Some(2));
    assert_eq!(result.maximum_fraction_digits(), Some(4));
    assert_eq!(result.minimum_significant_digits(), Some(3));
    assert_eq!(result.maximum_significant_digits(), Some(3));
    assert_eq!(
        result.unit_display(),
        Some(&NumberFormatOptionsUnitDisplay::Long)
    );
}

#[test]
fn test_integration_unit_meter() {
    // "measure-unit/length-meter .00##/@@@"
    let tokens =
        NumberSkeletonToken::parse_from_string("measure-unit/length-meter .00##/@@@").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.style(), Some(&NumberFormatOptionsStyle::Unit));
    assert_eq!(result.unit(), Some("meter"));
    assert_eq!(result.minimum_fraction_digits(), Some(2));
    assert_eq!(result.maximum_fraction_digits(), Some(4));
    assert_eq!(result.minimum_significant_digits(), Some(3));
    assert_eq!(result.maximum_significant_digits(), Some(3));
}

#[test]
fn test_integration_unit_meter_full_name() {
    // "measure-unit/length-meter .00##/@@@ unit-width-full-name"
    let tokens = NumberSkeletonToken::parse_from_string(
        "measure-unit/length-meter .00##/@@@ unit-width-full-name",
    )
    .unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.style(), Some(&NumberFormatOptionsStyle::Unit));
    assert_eq!(result.unit(), Some("meter"));
    assert_eq!(
        result.currency_display(),
        Some(&NumberFormatOptionsCurrencyDisplay::Name)
    );
    assert_eq!(result.minimum_fraction_digits(), Some(2));
    assert_eq!(result.maximum_fraction_digits(), Some(4));
    assert_eq!(result.minimum_significant_digits(), Some(3));
    assert_eq!(result.maximum_significant_digits(), Some(3));
    assert_eq!(
        result.unit_display(),
        Some(&NumberFormatOptionsUnitDisplay::Long)
    );
}

#[test]
fn test_integration_compact_short() {
    // "compact-short"
    let tokens = NumberSkeletonToken::parse_from_string("compact-short").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.notation(), Some(&NumberFormatNotation::Compact));
    assert_eq!(
        result.compact_display(),
        Some(&NumberFormatOptionsCompactDisplay::Short)
    );
}

#[test]
fn test_integration_compact_long() {
    // "compact-long"
    let tokens = NumberSkeletonToken::parse_from_string("compact-long").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.notation(), Some(&NumberFormatNotation::Compact));
    assert_eq!(
        result.compact_display(),
        Some(&NumberFormatOptionsCompactDisplay::Long)
    );
}

#[test]
fn test_integration_scientific_notation() {
    // "scientific"
    let tokens = NumberSkeletonToken::parse_from_string("scientific").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.notation(), Some(&NumberFormatNotation::Scientific));
}

#[test]
fn test_integration_scientific_sign_always() {
    // "scientific/sign-always"
    let tokens = NumberSkeletonToken::parse_from_string("scientific/sign-always").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.notation(), Some(&NumberFormatNotation::Scientific));
    assert_eq!(
        result.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Always)
    );
}

#[test]
fn test_integration_scientific_sign_always_alternative() {
    // "scientific/+ee/sign-always"
    let tokens = NumberSkeletonToken::parse_from_string("scientific/+ee/sign-always").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.notation(), Some(&NumberFormatNotation::Scientific));
    assert_eq!(
        result.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Always)
    );
}

#[test]
fn test_integration_engineering_notation() {
    // "engineering"
    let tokens = NumberSkeletonToken::parse_from_string("engineering").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.notation(), Some(&NumberFormatNotation::Engineering));
}

#[test]
fn test_integration_engineering_except_zero() {
    // "engineering/sign-except-zero"
    let tokens = NumberSkeletonToken::parse_from_string("engineering/sign-except-zero").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.notation(), Some(&NumberFormatNotation::Engineering));
    assert_eq!(
        result.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::ExceptZero)
    );
}

#[test]
fn test_integration_notation_simple() {
    // "notation-simple"
    let tokens = NumberSkeletonToken::parse_from_string("notation-simple").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.notation(), Some(&NumberFormatNotation::Standard));
}

#[test]
fn test_integration_sign_auto() {
    // "sign-auto"
    let tokens = NumberSkeletonToken::parse_from_string("sign-auto").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(
        result.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Auto)
    );
}

#[test]
fn test_integration_sign_always_long() {
    // "sign-always"
    let tokens = NumberSkeletonToken::parse_from_string("sign-always").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(
        result.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Always)
    );
}

#[test]
fn test_integration_sign_always_shorthand() {
    // "+!"
    let tokens = NumberSkeletonToken::parse_from_string("+!").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(
        result.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Always)
    );
}

#[test]
fn test_integration_sign_never_long() {
    // "sign-never"
    let tokens = NumberSkeletonToken::parse_from_string("sign-never").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(
        result.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Never)
    );
}

#[test]
fn test_integration_sign_never_shorthand() {
    // "+_"
    let tokens = NumberSkeletonToken::parse_from_string("+_").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(
        result.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Never)
    );
}

#[test]
fn test_integration_sign_accounting_long() {
    // "sign-accounting"
    let tokens = NumberSkeletonToken::parse_from_string("sign-accounting").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(
        result.currency_sign(),
        Some(&NumberFormatOptionsCurrencySign::Accounting)
    );
}

#[test]
fn test_integration_sign_accounting_shorthand() {
    // "()"
    let tokens = NumberSkeletonToken::parse_from_string("()").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(
        result.currency_sign(),
        Some(&NumberFormatOptionsCurrencySign::Accounting)
    );
}

#[test]
fn test_integration_sign_accounting_always_long() {
    // "sign-accounting-always"
    let tokens = NumberSkeletonToken::parse_from_string("sign-accounting-always").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(
        result.currency_sign(),
        Some(&NumberFormatOptionsCurrencySign::Accounting)
    );
    assert_eq!(
        result.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Always)
    );
}

#[test]
fn test_integration_sign_accounting_always_shorthand() {
    // "()!"
    let tokens = NumberSkeletonToken::parse_from_string("()!").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(
        result.currency_sign(),
        Some(&NumberFormatOptionsCurrencySign::Accounting)
    );
    assert_eq!(
        result.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Always)
    );
}

#[test]
fn test_integration_sign_except_zero_long() {
    // "sign-except-zero"
    let tokens = NumberSkeletonToken::parse_from_string("sign-except-zero").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(
        result.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::ExceptZero)
    );
}

#[test]
fn test_integration_sign_except_zero_shorthand() {
    // "+?"
    let tokens = NumberSkeletonToken::parse_from_string("+?").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(
        result.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::ExceptZero)
    );
}

#[test]
fn test_integration_sign_accounting_except_zero_long() {
    // "sign-accounting-except-zero"
    let tokens = NumberSkeletonToken::parse_from_string("sign-accounting-except-zero").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(
        result.currency_sign(),
        Some(&NumberFormatOptionsCurrencySign::Accounting)
    );
    assert_eq!(
        result.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::ExceptZero)
    );
}

#[test]
fn test_integration_sign_accounting_except_zero_shorthand() {
    // "()?
    let tokens = NumberSkeletonToken::parse_from_string("()?").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(
        result.currency_sign(),
        Some(&NumberFormatOptionsCurrencySign::Accounting)
    );
    assert_eq!(
        result.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::ExceptZero)
    );
}

#[test]
fn test_integration_min_integer_digits_concise() {
    // "000"
    let tokens = NumberSkeletonToken::parse_from_string("000").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.minimum_integer_digits(), Some(3));
}

#[test]
fn test_integration_min_integer_digits_long() {
    // "integer-width/*000"
    let tokens = NumberSkeletonToken::parse_from_string("integer-width/*000").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.minimum_integer_digits(), Some(3));
}

#[test]
fn test_integration_scientific_concise_e0() {
    // "E0"
    let tokens = NumberSkeletonToken::parse_from_string("E0").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.notation(), Some(&NumberFormatNotation::Scientific));
    assert_eq!(result.minimum_integer_digits(), Some(1));
}

#[test]
fn test_integration_scientific_concise_sign_width() {
    // "E+!00"
    let tokens = NumberSkeletonToken::parse_from_string("E+!00").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.notation(), Some(&NumberFormatNotation::Scientific));
    assert_eq!(
        result.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Always)
    );
    assert_eq!(result.minimum_integer_digits(), Some(2));
}

#[test]
fn test_integration_engineering_concise_sign_width() {
    // "EE+?000"
    let tokens = NumberSkeletonToken::parse_from_string("EE+?000").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.notation(), Some(&NumberFormatNotation::Engineering));
    assert_eq!(
        result.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::ExceptZero)
    );
    assert_eq!(result.minimum_integer_digits(), Some(3));
}

#[test]
fn test_integration_percent_scaled() {
    // "%x100"
    let tokens = NumberSkeletonToken::parse_from_string("%x100").unwrap();
    let result = parse_number_skeleton(&tokens).unwrap();
    assert_eq!(result.style(), Some(&NumberFormatOptionsStyle::Percent));
    assert_eq!(result.scale(), Some(100.0));
}

fn parse_skeleton_options(stem: &str) -> Result<ExtendedNumberFormatOptions, String> {
    parse_number_skeleton(&[NumberSkeletonToken::new(stem.to_owned(), vec![])])
}

fn number_options(stem: &str) -> ExtendedNumberFormatOptions {
    parse_skeleton_options(stem).unwrap()
}

fn unit_from_skeleton(unit: &str) -> String {
    let token = NumberSkeletonToken::new("measure-unit".to_owned(), vec![unit.to_owned()]);
    parse_number_skeleton(&[token])
        .unwrap()
        .unit()
        .unwrap()
        .to_owned()
}

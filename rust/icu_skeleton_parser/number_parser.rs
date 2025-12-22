use once_cell::sync::Lazy;

use crate::ExtendedNumberFormatOptions;
use crate::NumberFormatNotation;
use crate::NumberFormatOptionsCompactDisplay;
use crate::NumberFormatOptionsCurrencyDisplay;
use crate::NumberFormatOptionsCurrencySign;
use crate::NumberFormatOptionsSignDisplay;
use crate::NumberFormatOptionsStyle;
use crate::NumberFormatOptionsUnitDisplay;
use crate::NumberSkeletonToken;
use crate::RoundingModeType;
use crate::RoundingPriorityType;
use crate::TrailingZeroDisplay;

static SIGNIFICANT_PRECISION_REGEX: Lazy<regex::Regex> =
    Lazy::new(|| regex::Regex::new(r"^(@+)?(\+|#+)?[rs]?$").unwrap());

static CONCISE_INTEGER_WIDTH_REGEX: Lazy<regex::Regex> =
    Lazy::new(|| regex::Regex::new(r"^(0+)$").unwrap());

static FRACTION_PRECISION_REGEX: Lazy<regex::Regex> =
    Lazy::new(|| regex::Regex::new(r"^\.(?:(0+)(\*)?|(#+)|(0+)(#+))$").unwrap());

static INTEGER_WIDTH_REGEX: Lazy<regex::Regex> =
    Lazy::new(|| regex::Regex::new(r"(\*)(0+)|(#+)(0+)|(0+)").unwrap());

/// Convert ICU unit format to ECMA format
///
/// Removes the prefix before the first hyphen from ICU unit strings.
/// For example: "measure-area" -> "area", "length-meter" -> "meter"
///
/// # Arguments
/// * `unit` - The ICU unit string to convert
///
/// # Returns
/// The ECMA-formatted unit string (everything after the first hyphen),
/// or the original string if no hyphen is found
///
/// # Examples
/// ```
/// use icu_skeleton_parser::icu_unit_to_ecma;
///
/// assert_eq!(icu_unit_to_ecma("measure-area"), "area");
/// assert_eq!(icu_unit_to_ecma("length-meter"), "meter");
/// assert_eq!(icu_unit_to_ecma("percent"), "percent");
/// ```
fn icu_unit_to_ecma(unit: &str) -> &str {
    unit.split_once('-').map(|(_, after)| after).unwrap_or(unit)
}

/// Parse significant precision patterns from ICU skeleton strings
///
/// Handles patterns like:
/// - `@@` or `@@@` - exact significant digits (min = max)
/// - `@@@+` - minimum significant digits with trailing zeros
/// - `###` - maximum significant digits
/// - `@@##` - minimum @ symbols, maximum includes # symbols
/// - Suffix `r` - morePrecision rounding priority
/// - Suffix `s` - lessPrecision rounding priority
///
/// # Arguments
/// * `str` - The precision pattern string
///
/// # Returns
/// ExtendedNumberFormatOptions with the parsed precision settings
///
/// # Examples
/// ```
/// use icu_skeleton_parser::utils::parse_significant_precision;
///
/// let opts = parse_significant_precision("@@");
/// assert_eq!(opts.minimum_significant_digits(), Some(2));
/// assert_eq!(opts.maximum_significant_digits(), Some(2));
///
/// let opts = parse_significant_precision("@@@+");
/// assert_eq!(opts.minimum_significant_digits(), Some(3));
///
/// let opts = parse_significant_precision("@@##r");
/// assert_eq!(opts.minimum_significant_digits(), Some(2));
/// assert_eq!(opts.maximum_significant_digits(), Some(4));
/// ```
fn parse_significant_precision(str: &str) -> ExtendedNumberFormatOptions {
    let mut options = ExtendedNumberFormatOptions::default();

    // Handle rounding priority suffix
    if str.ends_with('r') {
        options = options.with_rounding_priority(RoundingPriorityType::MorePrecision);
    } else if str.ends_with('s') {
        options = options.with_rounding_priority(RoundingPriorityType::LessPrecision);
    }

    // Parse significant precision patterns
    if let Some(caps) = SIGNIFICANT_PRECISION_REGEX.captures(str) {
        let g1 = caps.get(1).map(|m| m.as_str());
        let g2 = caps.get(2).map(|m| m.as_str());

        if let Some(g1_str) = g1 {
            match g2 {
                // @@@ case - exact significant digits (no g2 or g2 is empty)
                None => {
                    let len = g1_str.len() as u32;
                    options = options
                        .with_minimum_significant_digits(len)
                        .with_maximum_significant_digits(len);
                }
                // @@@+ case - minimum significant digits with trailing zeros
                Some("+") => {
                    options = options.with_minimum_significant_digits(g1_str.len() as u32);
                }
                // @@### case - g1 has @ symbols, g2 has # symbols
                Some(g2_str) if g2_str.starts_with('#') => {
                    let min_digits = g1_str.len() as u32;
                    let max_digits = min_digits + g2_str.len() as u32;
                    options = options
                        .with_minimum_significant_digits(min_digits)
                        .with_maximum_significant_digits(max_digits);
                }
                // Other cases
                _ => {}
            }
        } else if let Some(g2_str) = g2 {
            // ### case - only g2, starting with #
            if g2_str.starts_with('#') {
                options = options.with_maximum_significant_digits(g2_str.len() as u32);
            }
        }
    }

    options
}

/// Parse sign display patterns from ICU skeleton strings
///
/// Handles various sign display patterns from the ICU skeleton format
/// and converts them to ECMA-402 number format options.
///
/// # Arguments
/// * `str` - The sign pattern string
///
/// # Returns
/// `Some(ExtendedNumberFormatOptions)` with the parsed sign display settings,
/// or `None` if the pattern is not recognized
///
/// # Examples
/// ```
/// use icu_skeleton_parser::utils::parse_sign;
///
/// let opts = parse_sign("sign-always").unwrap();
/// assert!(opts.sign_display().is_some());
///
/// let opts = parse_sign("+!").unwrap();
/// assert!(opts.sign_display().is_some());
///
/// let opts = parse_sign("()").unwrap();
/// assert!(opts.currency_sign().is_some());
/// ```
fn parse_sign(str: &str) -> Option<ExtendedNumberFormatOptions> {
    match str {
        "sign-auto" => Some(
            ExtendedNumberFormatOptions::default()
                .with_sign_display(NumberFormatOptionsSignDisplay::Auto),
        ),
        "sign-accounting" | "()" => Some(
            ExtendedNumberFormatOptions::default()
                .with_currency_sign(NumberFormatOptionsCurrencySign::Accounting),
        ),
        "sign-always" | "+!" => Some(
            ExtendedNumberFormatOptions::default()
                .with_sign_display(NumberFormatOptionsSignDisplay::Always),
        ),
        "sign-accounting-always" | "()!" => Some(
            ExtendedNumberFormatOptions::default()
                .with_sign_display(NumberFormatOptionsSignDisplay::Always)
                .with_currency_sign(NumberFormatOptionsCurrencySign::Accounting),
        ),
        "sign-except-zero" | "+?" => Some(
            ExtendedNumberFormatOptions::default()
                .with_sign_display(NumberFormatOptionsSignDisplay::ExceptZero),
        ),
        "sign-accounting-except-zero" | "()?" => Some(
            ExtendedNumberFormatOptions::default()
                .with_sign_display(NumberFormatOptionsSignDisplay::ExceptZero)
                .with_currency_sign(NumberFormatOptionsCurrencySign::Accounting),
        ),
        "sign-never" | "+_" => Some(
            ExtendedNumberFormatOptions::default()
                .with_sign_display(NumberFormatOptionsSignDisplay::Never),
        ),
        _ => None,
    }
}

/// Parse concise scientific and engineering notation stems from ICU skeleton strings
///
/// Handles patterns like:
/// - `E` - scientific notation
/// - `EE` - engineering notation
/// - `E+!` - scientific with always sign display
/// - `EE+?` - engineering with except-zero sign display
/// - `E0`, `E00`, etc. - scientific with minimum integer digits
///
/// # Arguments
/// * `stem` - The stem pattern string
///
/// # Returns
/// `Ok(Some(ExtendedNumberFormatOptions))` with the parsed notation settings,
/// `Ok(None)` if the pattern is not recognized as scientific/engineering notation,
/// or `Err(String)` if the pattern is malformed
///
/// # Examples
/// ```
/// use icu_skeleton_parser::utils::parse_concise_scientific_and_engineering_stem;
///
/// let opts = parse_concise_scientific_and_engineering_stem("E").unwrap().unwrap();
/// // scientific notation
///
/// let opts = parse_concise_scientific_and_engineering_stem("EE").unwrap().unwrap();
/// // engineering notation
///
/// let opts = parse_concise_scientific_and_engineering_stem("E+!0").unwrap().unwrap();
/// // scientific with always sign and min 1 integer digit
/// ```
fn parse_concise_scientific_and_engineering_stem(
    stem: &str,
) -> Result<Option<ExtendedNumberFormatOptions>, String> {
    let mut stem = stem;
    let mut result: Option<ExtendedNumberFormatOptions> = None;

    // Check for engineering (EE) or scientific (E) notation
    if stem.starts_with("EE") {
        result = Some(
            ExtendedNumberFormatOptions::default().with_notation(NumberFormatNotation::Engineering),
        );
        stem = &stem[2..];
    } else if stem.starts_with('E') {
        result = Some(
            ExtendedNumberFormatOptions::default().with_notation(NumberFormatNotation::Scientific),
        );
        stem = &stem[1..];
    }

    if let Some(mut opts) = result {
        // Check for sign display (+! or +?)
        if stem.len() >= 2 {
            let sign_display = &stem[..2];
            if sign_display == "+!" {
                opts = opts.with_sign_display(NumberFormatOptionsSignDisplay::Always);
                stem = &stem[2..];
            } else if sign_display == "+?" {
                opts = opts.with_sign_display(NumberFormatOptionsSignDisplay::ExceptZero);
                stem = &stem[2..];
            }
        }

        // Validate the remaining stem is a valid integer width pattern (e.g., "0", "00", "000")
        if !stem.is_empty() {
            if !CONCISE_INTEGER_WIDTH_REGEX.is_match(stem) {
                return Err("Malformed concise eng/scientific notation".to_string());
            }
            opts = opts.with_minimum_integer_digits(stem.len() as u32);
        }

        Ok(Some(opts))
    } else {
        Ok(None)
    }
}

/// Parse notation options (currently just delegates to parse_sign)
fn parse_notation_options(opt: &str) -> ExtendedNumberFormatOptions {
    parse_sign(opt).unwrap_or_default()
}

/// Parse a number skeleton from tokens
///
/// Converts ICU number skeleton tokens to ECMA-402 number format options.
///
/// # Arguments
/// * `tokens` - Vector of NumberSkeletonToken to parse
///
/// # Returns
/// `Ok(ExtendedNumberFormatOptions)` with the parsed settings,
/// or `Err(String)` if parsing fails
///
/// # Examples
/// ```
/// use icu_skeleton_parser::{NumberSkeletonToken, utils::parse_number_skeleton};
///
/// let tokens = NumberSkeletonToken::parse_from_string("percent").unwrap();
/// let opts = parse_number_skeleton(&tokens).unwrap();
/// ```
pub fn parse_number_skeleton(
    tokens: &[NumberSkeletonToken],
) -> Result<ExtendedNumberFormatOptions, String> {
    let mut result = ExtendedNumberFormatOptions::default();

    for token in tokens {
        let stem = token.stem();

        match stem {
            "percent" | "%" => {
                result = result.with_style(NumberFormatOptionsStyle::Percent);
                continue;
            }
            "%x100" => {
                result = result
                    .with_style(NumberFormatOptionsStyle::Percent)
                    .with_scale(100.0);
                continue;
            }
            "currency" => {
                result = result.with_style(NumberFormatOptionsStyle::Currency);
                if let Some(currency) = token.options().first() {
                    result = result.with_currency(currency.as_str());
                }
                continue;
            }
            "group-off" | ",_" => {
                result = result.with_use_grouping(false);
                continue;
            }
            "precision-integer" | "." => {
                result = result.with_maximum_fraction_digits(0);
                continue;
            }
            "measure-unit" | "unit" => {
                result = result.with_style(NumberFormatOptionsStyle::Unit);
                if let Some(unit) = token.options().first() {
                    result = result.with_unit(icu_unit_to_ecma(unit));
                }
                continue;
            }
            "compact-short" | "K" => {
                result = result
                    .with_notation(NumberFormatNotation::Compact)
                    .with_compact_display(NumberFormatOptionsCompactDisplay::Short);
                continue;
            }
            "compact-long" | "KK" => {
                result = result
                    .with_notation(NumberFormatNotation::Compact)
                    .with_compact_display(NumberFormatOptionsCompactDisplay::Long);
                continue;
            }
            "scientific" => {
                result = result.with_notation(NumberFormatNotation::Scientific);
                for opt in token.options() {
                    let opt_result = parse_notation_options(opt);
                    result = result.merge(opt_result);
                }
                continue;
            }
            "engineering" => {
                result = result.with_notation(NumberFormatNotation::Engineering);
                for opt in token.options() {
                    let opt_result = parse_notation_options(opt);
                    result = result.merge(opt_result);
                }
                continue;
            }
            "notation-simple" => {
                result = result.with_notation(NumberFormatNotation::Standard);
                continue;
            }
            "unit-width-narrow" => {
                result = result
                    .with_currency_display(NumberFormatOptionsCurrencyDisplay::NarrowSymbol)
                    .with_unit_display(NumberFormatOptionsUnitDisplay::Narrow);
                continue;
            }
            "unit-width-short" => {
                result = result
                    .with_currency_display(NumberFormatOptionsCurrencyDisplay::Code)
                    .with_unit_display(NumberFormatOptionsUnitDisplay::Short);
                continue;
            }
            "unit-width-full-name" => {
                result = result
                    .with_currency_display(NumberFormatOptionsCurrencyDisplay::Name)
                    .with_unit_display(NumberFormatOptionsUnitDisplay::Long);
                continue;
            }
            "unit-width-iso-code" => {
                result = result.with_currency_display(NumberFormatOptionsCurrencyDisplay::Symbol);
                continue;
            }
            "scale" => {
                if let Some(scale_str) = token.options().first() {
                    if let Ok(scale) = scale_str.parse::<f64>() {
                        result = result.with_scale(scale);
                    }
                }
                continue;
            }
            "rounding-mode-floor" => {
                result = result.with_rounding_mode(RoundingModeType::Floor);
                continue;
            }
            "rounding-mode-ceiling" => {
                result = result.with_rounding_mode(RoundingModeType::Ceil);
                continue;
            }
            "rounding-mode-down" => {
                result = result.with_rounding_mode(RoundingModeType::Trunc);
                continue;
            }
            "rounding-mode-up" => {
                result = result.with_rounding_mode(RoundingModeType::Expand);
                continue;
            }
            "rounding-mode-half-even" => {
                result = result.with_rounding_mode(RoundingModeType::HalfEven);
                continue;
            }
            "rounding-mode-half-down" => {
                result = result.with_rounding_mode(RoundingModeType::HalfTrunc);
                continue;
            }
            "rounding-mode-half-up" => {
                result = result.with_rounding_mode(RoundingModeType::HalfExpand);
                continue;
            }
            "integer-width" => {
                if token.options().len() > 1 {
                    return Err(
                        "integer-width stems only accept a single optional option".to_string()
                    );
                }
                if let Some(opt) = token.options().first() {
                    if let Some(caps) = INTEGER_WIDTH_REGEX.captures(opt) {
                        if caps.get(1).is_some() {
                            // g1 and g2: *0+ pattern
                            if let Some(g2) = caps.get(2) {
                                result =
                                    result.with_minimum_integer_digits(g2.as_str().len() as u32);
                            }
                        } else if caps.get(3).is_some() && caps.get(4).is_some() {
                            // g3 and g4: #+0+ pattern
                            return Err(
                                "We currently do not support maximum integer digits".to_string()
                            );
                        } else if caps.get(5).is_some() {
                            // g5: 0+ pattern (exact)
                            return Err(
                                "We currently do not support exact integer digits".to_string()
                            );
                        }
                    }
                }
                continue;
            }
            _ => {}
        }

        // Check for concise integer width (e.g., "0", "00", "000")
        if CONCISE_INTEGER_WIDTH_REGEX.is_match(stem) {
            result = result.with_minimum_integer_digits(stem.len() as u32);
            continue;
        }

        // Check for fraction precision (e.g., ".00", ".##", ".00##")
        if FRACTION_PRECISION_REGEX.is_match(stem) {
            if token.options().len() > 1 {
                return Err(
                    "Fraction-precision stems only accept a single optional option".to_string(),
                );
            }

            if let Some(caps) = FRACTION_PRECISION_REGEX.captures(stem) {
                if let Some(g2) = caps.get(2) {
                    // .000* case
                    if g2.as_str() == "*" {
                        if let Some(g1) = caps.get(1) {
                            result = result.with_minimum_fraction_digits(g1.as_str().len() as u32);
                        }
                    }
                } else if let Some(g3) = caps.get(3) {
                    // .### case
                    if g3.as_str().starts_with('#') {
                        result = result.with_maximum_fraction_digits(g3.as_str().len() as u32);
                    }
                } else if let Some(g4) = caps.get(4) {
                    // .00## case
                    if let Some(g5) = caps.get(5) {
                        result = result
                            .with_minimum_fraction_digits(g4.as_str().len() as u32)
                            .with_maximum_fraction_digits(
                                (g4.as_str().len() + g5.as_str().len()) as u32,
                            );
                    }
                } else if let Some(g1) = caps.get(1) {
                    // .000 case
                    let len = g1.as_str().len() as u32;
                    result = result
                        .with_minimum_fraction_digits(len)
                        .with_maximum_fraction_digits(len);
                }
            }

            // Check for trailing zero display option
            if let Some(opt) = token.options().first() {
                if opt == "w" {
                    result = result.with_trailing_zero_display(TrailingZeroDisplay::StripIfInteger);
                } else {
                    let opt_result = parse_significant_precision(opt);
                    result = result.merge(opt_result);
                }
            }
            continue;
        }

        // Check for significant precision (e.g., "@@", "@@@+", "##")
        if SIGNIFICANT_PRECISION_REGEX.is_match(stem) {
            let sig_result = parse_significant_precision(stem);
            result = result.merge(sig_result);
            continue;
        }

        // Check for sign options
        if let Some(sign_result) = parse_sign(stem) {
            result = result.merge(sign_result);
        }

        // Check for concise scientific/engineering notation
        if let Ok(Some(sci_result)) = parse_concise_scientific_and_engineering_stem(stem) {
            result = result.merge(sci_result);
        }
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_icu_unit_with_prefix() {
        assert_eq!(icu_unit_to_ecma("measure-area"), "area");
    }

    #[test]
    fn test_icu_unit_length_meter() {
        assert_eq!(icu_unit_to_ecma("length-meter"), "meter");
    }

    #[test]
    fn test_icu_unit_volume_liter() {
        assert_eq!(icu_unit_to_ecma("volume-liter"), "liter");
    }

    #[test]
    fn test_icu_unit_temperature_celsius() {
        assert_eq!(icu_unit_to_ecma("temperature-celsius"), "celsius");
    }

    #[test]
    fn test_icu_unit_without_hyphen() {
        assert_eq!(icu_unit_to_ecma("percent"), "percent");
    }

    #[test]
    fn test_icu_unit_multiple_hyphens() {
        // Should only split on first hyphen
        assert_eq!(icu_unit_to_ecma("speed-mile-per-hour"), "mile-per-hour");
    }

    #[test]
    fn test_icu_unit_empty_string() {
        assert_eq!(icu_unit_to_ecma(""), "");
    }

    #[test]
    fn test_icu_unit_only_hyphen() {
        assert_eq!(icu_unit_to_ecma("-"), "");
    }

    #[test]
    fn test_icu_unit_hyphen_at_end() {
        assert_eq!(icu_unit_to_ecma("measure-"), "");
    }

    #[test]
    fn test_icu_unit_hyphen_at_start() {
        assert_eq!(icu_unit_to_ecma("-meter"), "meter");
    }

    #[test]
    fn test_parse_significant_precision_exact() {
        // @@ case - exact 2 significant digits
        let opts = parse_significant_precision("@@");
        assert_eq!(opts.minimum_significant_digits(), Some(2));
        assert_eq!(opts.maximum_significant_digits(), Some(2));
    }

    #[test]
    fn test_parse_significant_precision_exact_three() {
        // @@@ case - exact 3 significant digits
        let opts = parse_significant_precision("@@@");
        assert_eq!(opts.minimum_significant_digits(), Some(3));
        assert_eq!(opts.maximum_significant_digits(), Some(3));
    }

    #[test]
    fn test_parse_significant_precision_minimum_with_trailing() {
        // @@@+ case - minimum 3 significant digits with trailing zeros
        let opts = parse_significant_precision("@@@+");
        assert_eq!(opts.minimum_significant_digits(), Some(3));
        assert_eq!(opts.maximum_significant_digits(), None);
    }

    #[test]
    fn test_parse_significant_precision_maximum_only() {
        // ### case - maximum 3 significant digits
        let opts = parse_significant_precision("###");
        assert_eq!(opts.minimum_significant_digits(), None);
        assert_eq!(opts.maximum_significant_digits(), Some(3));
    }

    #[test]
    fn test_parse_significant_precision_min_max() {
        // @@## case - min 2, max 4 significant digits
        let opts = parse_significant_precision("@@##");
        assert_eq!(opts.minimum_significant_digits(), Some(2));
        assert_eq!(opts.maximum_significant_digits(), Some(4));
    }

    #[test]
    fn test_parse_significant_precision_min_max_complex() {
        // @@@### case - min 3, max 6 significant digits
        let opts = parse_significant_precision("@@@###");
        assert_eq!(opts.minimum_significant_digits(), Some(3));
        assert_eq!(opts.maximum_significant_digits(), Some(6));
    }

    #[test]
    fn test_parse_significant_precision_with_more_precision() {
        // @@r case - exact 2 digits with morePrecision rounding
        let opts = parse_significant_precision("@@r");
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
        let opts = parse_significant_precision("@@@s");
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
        let opts = parse_significant_precision("@@##r");
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
        let opts = parse_significant_precision("@@+s");
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
        let opts = parse_significant_precision("");
        assert_eq!(opts.minimum_significant_digits(), None);
        assert_eq!(opts.maximum_significant_digits(), None);
        assert_eq!(opts.rounding_priority(), None);
    }

    #[test]
    fn test_parse_significant_precision_single_at() {
        // @ case - exact 1 significant digit
        let opts = parse_significant_precision("@");
        assert_eq!(opts.minimum_significant_digits(), Some(1));
        assert_eq!(opts.maximum_significant_digits(), Some(1));
    }

    #[test]
    fn test_parse_significant_precision_single_hash() {
        // # case - maximum 1 significant digit
        let opts = parse_significant_precision("#");
        assert_eq!(opts.minimum_significant_digits(), None);
        assert_eq!(opts.maximum_significant_digits(), Some(1));
    }

    #[test]
    fn test_parse_sign_auto() {
        let opts = parse_sign("sign-auto").unwrap();
        assert_eq!(
            opts.sign_display(),
            Some(&NumberFormatOptionsSignDisplay::Auto)
        );
        assert_eq!(opts.currency_sign(), None);
    }

    #[test]
    fn test_parse_sign_accounting() {
        let opts = parse_sign("sign-accounting").unwrap();
        assert_eq!(
            opts.currency_sign(),
            Some(&NumberFormatOptionsCurrencySign::Accounting)
        );
        assert_eq!(opts.sign_display(), None);
    }

    #[test]
    fn test_parse_sign_accounting_shorthand() {
        // () is shorthand for sign-accounting
        let opts = parse_sign("()").unwrap();
        assert_eq!(
            opts.currency_sign(),
            Some(&NumberFormatOptionsCurrencySign::Accounting)
        );
        assert_eq!(opts.sign_display(), None);
    }

    #[test]
    fn test_parse_sign_always() {
        let opts = parse_sign("sign-always").unwrap();
        assert_eq!(
            opts.sign_display(),
            Some(&NumberFormatOptionsSignDisplay::Always)
        );
        assert_eq!(opts.currency_sign(), None);
    }

    #[test]
    fn test_parse_sign_always_shorthand() {
        // +! is shorthand for sign-always
        let opts = parse_sign("+!").unwrap();
        assert_eq!(
            opts.sign_display(),
            Some(&NumberFormatOptionsSignDisplay::Always)
        );
        assert_eq!(opts.currency_sign(), None);
    }

    #[test]
    fn test_parse_sign_accounting_always() {
        let opts = parse_sign("sign-accounting-always").unwrap();
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
        let opts = parse_sign("()!").unwrap();
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
        let opts = parse_sign("sign-except-zero").unwrap();
        assert_eq!(
            opts.sign_display(),
            Some(&NumberFormatOptionsSignDisplay::ExceptZero)
        );
        assert_eq!(opts.currency_sign(), None);
    }

    #[test]
    fn test_parse_sign_except_zero_shorthand() {
        // +? is shorthand for sign-except-zero
        let opts = parse_sign("+?").unwrap();
        assert_eq!(
            opts.sign_display(),
            Some(&NumberFormatOptionsSignDisplay::ExceptZero)
        );
        assert_eq!(opts.currency_sign(), None);
    }

    #[test]
    fn test_parse_sign_accounting_except_zero() {
        let opts = parse_sign("sign-accounting-except-zero").unwrap();
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
        let opts = parse_sign("()?").unwrap();
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
        let opts = parse_sign("sign-never").unwrap();
        assert_eq!(
            opts.sign_display(),
            Some(&NumberFormatOptionsSignDisplay::Never)
        );
        assert_eq!(opts.currency_sign(), None);
    }

    #[test]
    fn test_parse_sign_never_shorthand() {
        // +_ is shorthand for sign-never
        let opts = parse_sign("+_").unwrap();
        assert_eq!(
            opts.sign_display(),
            Some(&NumberFormatOptionsSignDisplay::Never)
        );
        assert_eq!(opts.currency_sign(), None);
    }

    #[test]
    fn test_parse_sign_unknown() {
        // Unknown patterns should return None
        let opts = parse_sign("unknown-sign");
        assert!(opts.is_none());
    }

    #[test]
    fn test_parse_sign_empty() {
        // Empty string should return None
        let opts = parse_sign("");
        assert!(opts.is_none());
    }

    #[test]
    fn test_parse_concise_scientific() {
        let opts = parse_concise_scientific_and_engineering_stem("E")
            .unwrap()
            .unwrap();
        assert_eq!(opts.notation(), Some(&NumberFormatNotation::Scientific));
        assert_eq!(opts.minimum_integer_digits(), None);
    }

    #[test]
    fn test_parse_concise_engineering() {
        let opts = parse_concise_scientific_and_engineering_stem("EE")
            .unwrap()
            .unwrap();
        assert_eq!(opts.notation(), Some(&NumberFormatNotation::Engineering));
        assert_eq!(opts.minimum_integer_digits(), None);
    }

    #[test]
    fn test_parse_concise_scientific_with_integer_width() {
        let opts = parse_concise_scientific_and_engineering_stem("E0")
            .unwrap()
            .unwrap();
        assert_eq!(opts.notation(), Some(&NumberFormatNotation::Scientific));
        assert_eq!(opts.minimum_integer_digits(), Some(1));
    }

    #[test]
    fn test_parse_concise_scientific_with_integer_width_three() {
        let opts = parse_concise_scientific_and_engineering_stem("E000")
            .unwrap()
            .unwrap();
        assert_eq!(opts.notation(), Some(&NumberFormatNotation::Scientific));
        assert_eq!(opts.minimum_integer_digits(), Some(3));
    }

    #[test]
    fn test_parse_concise_engineering_with_integer_width() {
        let opts = parse_concise_scientific_and_engineering_stem("EE00")
            .unwrap()
            .unwrap();
        assert_eq!(opts.notation(), Some(&NumberFormatNotation::Engineering));
        assert_eq!(opts.minimum_integer_digits(), Some(2));
    }

    #[test]
    fn test_parse_concise_scientific_with_sign_always() {
        let opts = parse_concise_scientific_and_engineering_stem("E+!")
            .unwrap()
            .unwrap();
        assert_eq!(opts.notation(), Some(&NumberFormatNotation::Scientific));
        assert_eq!(
            opts.sign_display(),
            Some(&NumberFormatOptionsSignDisplay::Always)
        );
        assert_eq!(opts.minimum_integer_digits(), None);
    }

    #[test]
    fn test_parse_concise_scientific_with_sign_except_zero() {
        let opts = parse_concise_scientific_and_engineering_stem("E+?")
            .unwrap()
            .unwrap();
        assert_eq!(opts.notation(), Some(&NumberFormatNotation::Scientific));
        assert_eq!(
            opts.sign_display(),
            Some(&NumberFormatOptionsSignDisplay::ExceptZero)
        );
        assert_eq!(opts.minimum_integer_digits(), None);
    }

    #[test]
    fn test_parse_concise_engineering_with_sign_always() {
        let opts = parse_concise_scientific_and_engineering_stem("EE+!")
            .unwrap()
            .unwrap();
        assert_eq!(opts.notation(), Some(&NumberFormatNotation::Engineering));
        assert_eq!(
            opts.sign_display(),
            Some(&NumberFormatOptionsSignDisplay::Always)
        );
    }

    #[test]
    fn test_parse_concise_scientific_with_sign_and_width() {
        let opts = parse_concise_scientific_and_engineering_stem("E+!0")
            .unwrap()
            .unwrap();
        assert_eq!(opts.notation(), Some(&NumberFormatNotation::Scientific));
        assert_eq!(
            opts.sign_display(),
            Some(&NumberFormatOptionsSignDisplay::Always)
        );
        assert_eq!(opts.minimum_integer_digits(), Some(1));
    }

    #[test]
    fn test_parse_concise_engineering_with_sign_and_width() {
        let opts = parse_concise_scientific_and_engineering_stem("EE+?000")
            .unwrap()
            .unwrap();
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
        let result = parse_concise_scientific_and_engineering_stem("compact").unwrap();
        assert!(result.is_none());
    }

    #[test]
    fn test_parse_concise_scientific_malformed() {
        // Invalid integer width pattern should return error
        let result = parse_concise_scientific_and_engineering_stem("E123");
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            "Malformed concise eng/scientific notation"
        );
    }

    #[test]
    fn test_parse_concise_scientific_malformed_with_letters() {
        // Invalid characters after E should return error
        let result = parse_concise_scientific_and_engineering_stem("Eabc");
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_concise_engineering_malformed() {
        // Invalid integer width pattern for engineering notation
        let result = parse_concise_scientific_and_engineering_stem("EE+!abc");
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_concise_scientific_empty() {
        // Empty string should return None
        let result = parse_concise_scientific_and_engineering_stem("").unwrap();
        assert!(result.is_none());
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
            Some(&crate::UseGroupingType::Bool(false))
        );
    }

    #[test]
    fn test_parse_number_skeleton_complex() {
        let tokens =
            NumberSkeletonToken::parse_from_string("currency/EUR compact-short sign-always")
                .unwrap();
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
        let tokens =
            NumberSkeletonToken::parse_from_string("engineering/sign-except-zero").unwrap();
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
        let tokens =
            NumberSkeletonToken::parse_from_string("sign-accounting-except-zero").unwrap();
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
}

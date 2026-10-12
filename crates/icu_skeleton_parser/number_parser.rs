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

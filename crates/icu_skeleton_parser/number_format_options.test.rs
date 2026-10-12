use formatjs_icu_skeleton_parser::number_format_options::*;

#[test]
fn test_extended_number_format_options_creation() {
    let options = ExtendedNumberFormatOptions::new()
        .with_scale(100.0)
        .with_style(NumberFormatOptionsStyle::Percent)
        .with_currency("USD");

    assert_eq!(options.scale(), Some(100.0));
    assert_eq!(options.style(), Some(&NumberFormatOptionsStyle::Percent));
    assert_eq!(options.currency(), Some("USD"));
}

#[test]
fn test_serialization() {
    let options = ExtendedNumberFormatOptions::new()
        .with_scale(100.0)
        .with_style(NumberFormatOptionsStyle::Percent);

    let json = serde_json::to_string(&options).unwrap();
    assert!(json.contains("\"scale\":100"));
    assert!(json.contains("\"style\":\"percent\""));
}

#[test]
fn test_deserialization() {
    let json = r#"{"scale":100.0,"style":"percent"}"#;
    let options: ExtendedNumberFormatOptions = serde_json::from_str(json).unwrap();

    assert_eq!(options.scale(), Some(100.0));
    assert_eq!(options.style(), Some(&NumberFormatOptionsStyle::Percent));
}

#[test]
fn test_use_grouping_bool_conversion() {
    let options = ExtendedNumberFormatOptions::new().with_use_grouping(true);

    assert_eq!(options.use_grouping(), Some(&UseGroupingType::Bool(true)));

    let json = serde_json::to_string(&options).unwrap();
    assert!(json.contains("\"useGrouping\":true"));
}

#[test]
fn test_use_grouping_string_values() {
    // Test with string value
    let json = r#"{"useGrouping":"min2"}"#;
    let options: ExtendedNumberFormatOptions = serde_json::from_str(json).unwrap();
    assert_eq!(
        options.use_grouping(),
        Some(&UseGroupingType::String(UseGroupingString::Min2))
    );

    // Test with boolean value
    let json_bool = r#"{"useGrouping":false}"#;
    let options_bool: ExtendedNumberFormatOptions = serde_json::from_str(json_bool).unwrap();
    assert_eq!(
        options_bool.use_grouping(),
        Some(&UseGroupingType::Bool(false))
    );
}

#[test]
fn test_all_enums() {
    let options = ExtendedNumberFormatOptions::new()
        .with_style(NumberFormatOptionsStyle::Currency)
        .with_notation(NumberFormatNotation::Compact)
        .with_compact_display(NumberFormatOptionsCompactDisplay::Long)
        .with_currency_display(NumberFormatOptionsCurrencyDisplay::NarrowSymbol)
        .with_currency_sign(NumberFormatOptionsCurrencySign::Accounting)
        .with_sign_display(NumberFormatOptionsSignDisplay::Always)
        .with_unit_display(NumberFormatOptionsUnitDisplay::Short)
        .with_rounding_mode(RoundingModeType::HalfEven)
        .with_rounding_priority(RoundingPriorityType::MorePrecision)
        .with_trailing_zero_display(TrailingZeroDisplay::StripIfInteger);

    assert_eq!(options.style(), Some(&NumberFormatOptionsStyle::Currency));
    assert_eq!(options.notation(), Some(&NumberFormatNotation::Compact));
    assert_eq!(
        options.compact_display(),
        Some(&NumberFormatOptionsCompactDisplay::Long)
    );
    assert_eq!(
        options.currency_display(),
        Some(&NumberFormatOptionsCurrencyDisplay::NarrowSymbol)
    );
    assert_eq!(
        options.currency_sign(),
        Some(&NumberFormatOptionsCurrencySign::Accounting)
    );
    assert_eq!(
        options.sign_display(),
        Some(&NumberFormatOptionsSignDisplay::Always)
    );
    assert_eq!(
        options.unit_display(),
        Some(&NumberFormatOptionsUnitDisplay::Short)
    );
    assert_eq!(options.rounding_mode(), Some(&RoundingModeType::HalfEven));
    assert_eq!(
        options.rounding_priority(),
        Some(&RoundingPriorityType::MorePrecision)
    );
    assert_eq!(
        options.trailing_zero_display(),
        Some(&TrailingZeroDisplay::StripIfInteger)
    );
}

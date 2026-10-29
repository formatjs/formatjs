use formatjs_intl_pluralrules::{
    Error, LocaleRules,
    instance::{Options, PluralRules},
};
use std::sync::Arc;

#[test]
fn instances_share_owned_payloads_but_keep_independent_rounding() {
    let payload = Arc::new(
        LocaleRules::from_json(
            r#"{"locale":"en","cardinal":{"one":"i = 1 and v = 0"},"ordinal":{}}"#,
        )
        .unwrap(),
    );
    let standard = PluralRules::new(payload.clone(), &Options::default()).unwrap();
    let padded = PluralRules::new(
        payload.clone(),
        &serde_json::from_str(r#"{"minimumFractionDigits":2}"#).unwrap(),
    )
    .unwrap();
    drop(payload);
    assert_eq!(standard.select("1").unwrap(), "one");
    assert_eq!(padded.select("1").unwrap(), "other");
    assert_eq!(standard.select_range("1.0001", "1.0002").unwrap(), "one");
    assert!(matches!(
        standard.select_range("NaN", "invalid"),
        Err(Error::InvalidRange)
    ));
    assert_eq!(standard.select("Infinity").unwrap(), "other");
}

#[test]
fn constructor_validation_precedes_digit_resolution() {
    let payload =
        Arc::new(LocaleRules::from_json(r#"{"locale":"en","cardinal":{},"ordinal":{}}"#).unwrap());
    for (options, name) in [
        (
            r#"{"type":"invalid","notation":"invalid","minimumIntegerDigits":0}"#,
            "type",
        ),
        (
            r#"{"notation":"invalid","compactDisplay":"invalid","minimumIntegerDigits":0}"#,
            "notation",
        ),
        (
            r#"{"compactDisplay":"invalid","minimumIntegerDigits":0}"#,
            "compactDisplay",
        ),
    ] {
        assert!(
            matches!(PluralRules::new(payload.clone(), &serde_json::from_str(options).unwrap()), Err(Error::InvalidOption(value)) if value == name)
        );
    }
    let compact = PluralRules::new(
        payload,
        &serde_json::from_str(r#"{"notation":"compact","compactDisplay":"long"}"#).unwrap(),
    )
    .unwrap();
    let mut first = compact.resolved_options();
    first.plural_categories.clear();
    assert_eq!(compact.resolved_options().plural_categories, ["other"]);
    assert_eq!(compact.resolved_options().compact_display, Some("long"));
}

#[test]
fn primitive_text_normalization_preserves_exact_values_and_number_range() {
    let payload = Arc::new(LocaleRules::from_json(r#"{"locale":"en","cardinal":{"one":"i = 1 and v = 0"},"ordinal":{"one":"n % 10 = 1 and n % 100 != 11","two":"n % 10 = 2 and n % 100 != 12","few":"n % 10 = 3 and n % 100 != 13"}}"#).unwrap());
    let rules = PluralRules::new(payload.clone(), &Options::default()).unwrap();
    for value in [
        "1.",
        "+1",
        "1e+0",
        "1e-0",
        "0x1",
        "0O1",
        "0b1",
        "\u{FEFF}1\u{A0}",
    ] {
        assert_eq!(
            rules.select_mathematical(value, false).unwrap(),
            "one",
            "{value}"
        );
    }
    for value in [
        ".",
        "--1",
        "+0x1",
        "1e3junk",
        "\u{85}1",
        "NaN",
        "1e9999",
        "0e9999999999999999999999",
    ] {
        assert_eq!(
            rules.select_mathematical(value, false).unwrap(),
            "other",
            "{value}"
        );
    }
    assert_eq!(
        rules
            .select_mathematical(&format!("1{}e-40000", "0".repeat(40_000)), false)
            .unwrap(),
        "one"
    );
    let ceil = PluralRules::new(
        payload.clone(),
        &serde_json::from_str(r#"{"roundingMode":"ceil","maximumFractionDigits":0}"#).unwrap(),
    )
    .unwrap();
    assert_eq!(ceil.select_mathematical("1e-9999", false).unwrap(), "other");
    let ordinal = PluralRules::new(
        payload.clone(),
        &serde_json::from_str(r#"{"type":"ordinal"}"#).unwrap(),
    )
    .unwrap();
    assert_eq!(
        ordinal
            .select_mathematical("0x20000000000001", false)
            .unwrap(),
        "few"
    );
    let huge = format!("1{}3", "0".repeat(39_998));
    assert_eq!(ordinal.select_mathematical(&huge, true).unwrap(), "few");
    assert_eq!(ordinal.select_mathematical(&huge, false).unwrap(), "other");
    let half_trunc = PluralRules::new(
        payload,
        &serde_json::from_str(
            r#"{"type":"ordinal","roundingMode":"halfTrunc","maximumFractionDigits":0}"#,
        )
        .unwrap(),
    )
    .unwrap();
    assert_eq!(
        half_trunc
            .select_mathematical(&format!("1.5{}1", "0".repeat(40_000)), false)
            .unwrap(),
        "two"
    );
    assert_eq!(
        half_trunc
            .select_mathematical(&format!("1.5{}", "0".repeat(40_000)), false)
            .unwrap(),
        "one"
    );
}

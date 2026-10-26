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

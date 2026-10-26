use formatjs_intl_numberformat::{Error, Options, registry::Registry};
use serde_json::{Value, json};

fn registry() -> Registry {
    let mut registry = Registry::default();
    registry
        .add_locale_data(include_str!(env!("FORMATJS_NUMBER_EN")))
        .unwrap();
    registry
}
fn options(value: Value) -> Options {
    serde_json::from_value(value).unwrap()
}

#[test]
fn huge_integer_rounding_retains_sticky_digits_and_directed_sign() {
    let registry = registry();
    let input = format!("1{}1", "0".repeat(40_000));
    let expected = format!("101{}", "0".repeat(39_999));
    let positive = registry
        .create(
            &["en".into()],
            &options(
                json!({"maximumSignificantDigits":3,"roundingMode":"ceil","useGrouping":false}),
            ),
        )
        .unwrap();
    assert_eq!(positive.format(&input).unwrap(), expected);
    let negative = registry
        .create(
            &["en".into()],
            &options(
                json!({"maximumSignificantDigits":3,"roundingMode":"floor","useGrouping":false}),
            ),
        )
        .unwrap();
    assert_eq!(
        negative.format(&format!("-{input}")).unwrap(),
        format!("-{expected}")
    );
    let scientific = registry
        .create(
            &["en".into()],
            &options(
                json!({"maximumSignificantDigits":3,"roundingMode":"ceil","notation":"scientific"}),
            ),
        )
        .unwrap();
    assert_eq!(scientific.format(&input).unwrap(), "1.01E40001");
}

#[test]
fn tiny_values_and_far_fractional_tails_keep_their_rounding_position() {
    let registry = registry();
    let significant = registry
        .create(
            &["en".into()],
            &options(json!({"maximumSignificantDigits":3})),
        )
        .unwrap();
    assert_eq!(
        significant.format("1e-300").unwrap(),
        format!("0.{}1", "0".repeat(299))
    );
    let fraction = registry
        .create(
            &["en".into()],
            &options(json!({"maximumFractionDigits":100,"roundingMode":"halfEven"})),
        )
        .unwrap();
    assert_eq!(
        fraction.format(&format!("1.{}25", "0".repeat(99))).unwrap(),
        format!("1.{}2", "0".repeat(99))
    );
    assert_eq!(
        fraction
            .format(&format!("1.{}25{}1", "0".repeat(99), "0".repeat(1000)))
            .unwrap(),
        format!("1.{}3", "0".repeat(99))
    );
}

#[test]
fn replacement_keeps_existing_formatters_while_unit_extension_updates_them() {
    let mut registry = registry();
    let decimal = registry
        .create(&["en".into()], &Options::default())
        .unwrap();
    let mut replacement: Value =
        serde_json::from_str(include_str!(env!("FORMATJS_NUMBER_EN"))).unwrap();
    replacement["data"]["numbers"]["symbols"]["latn"]["decimal"] = json!(",");
    registry.add_locale_data(&replacement.to_string()).unwrap();
    assert_eq!(decimal.format("1.5").unwrap(), "1.5");
    assert_eq!(
        registry
            .create(&["en".into()], &Options::default())
            .unwrap()
            .format("1.5")
            .unwrap(),
        "1,5"
    );
    let unit = registry
        .create(
            &["en".into()],
            &options(json!({"style":"unit","unit":"meter","unitDisplay":"long"})),
        )
        .unwrap();
    assert_eq!(unit.format("2").unwrap(), "2 meters");
    registry.add_unit_data("en", &json!({"simple":{"meter":{"long":{"one":"{0} rod","other":"{0} rods"},"short":{"other":"{0} r"},"narrow":{"other":"{0}r"}}},"compound":{}}).to_string()).unwrap();
    assert_eq!(unit.format("2").unwrap(), "2 rods");
}

#[test]
fn option_validation_ignores_only_inactive_digit_limits() {
    let registry = registry();
    assert!(matches!(
        registry.create(&["en".into()], &options(json!({"style":"currency"}))),
        Err(Error::Type("currency"))
    ));
    for value in [
        json!({"currency":"US\n"}),
        json!({"unit":"MILE"}),
        json!({"roundingIncrement":3}),
        json!({"maximumSignificantDigits":0}),
    ] {
        assert!(matches!(
            registry.create(&["en".into()], &options(value)),
            Err(Error::Range(_))
        ));
    }
    let mut inactive = options(json!({"maximumSignificantDigits":2}));
    inactive.digits.minimum_fraction_digits = Some(f64::NAN);
    assert_eq!(
        registry
            .create(&["en".into()], &inactive)
            .unwrap()
            .format("1.234")
            .unwrap(),
        "1.2"
    );
    inactive.digits.maximum_significant_digits = None;
    assert!(matches!(
        registry.create(&["en".into()], &inactive),
        Err(Error::Range(_))
    ));
}

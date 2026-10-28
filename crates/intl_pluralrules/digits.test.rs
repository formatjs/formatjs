use formatjs_intl_pluralrules::digits::{Digits, Error, Options};
use serde_json::json;

fn digits(value: serde_json::Value) -> Digits {
    Digits::new(&serde_json::from_value::<Options>(value).unwrap(), false).unwrap()
}

#[test]
fn all_signed_rounding_modes_preserve_exact_ties() {
    for (mode, positive, negative) in [
        ("ceil", "3", "-2"),
        ("floor", "2", "-3"),
        ("expand", "3", "-3"),
        ("trunc", "2", "-2"),
        ("halfCeil", "3", "-2"),
        ("halfFloor", "2", "-3"),
        ("halfExpand", "3", "-3"),
        ("halfTrunc", "2", "-2"),
        ("halfEven", "2", "-2"),
    ] {
        let value = digits(json!({"roundingMode":mode,"maximumFractionDigits":0}));
        assert_eq!(
            value.format("2.5").unwrap().number.to_string(),
            positive,
            "{mode}"
        );
        assert_eq!(
            value.format("-2.5").unwrap().number.to_string(),
            negative,
            "{mode}"
        );
    }
}

#[test]
fn arbitrary_length_integer_rounding_preserves_carries_and_half_even() {
    let nines = "9".repeat(40_000);
    let significant = digits(json!({"maximumSignificantDigits":1}));
    assert_eq!(
        significant.format_string(&nines).unwrap(),
        format!("1{}", "0".repeat(40_000))
    );
    let even = digits(json!({"maximumSignificantDigits":1,"roundingMode":"halfEven"}));
    assert_eq!(
        even.format_string(&format!("25{}", "0".repeat(39_998)))
            .unwrap(),
        format!("2{}", "0".repeat(39_999))
    );
    assert_eq!(
        even.format_string(&format!("35{}", "0".repeat(39_998)))
            .unwrap(),
        format!("4{}", "0".repeat(39_999))
    );
    let fixed = digits(
        json!({"minimumFractionDigits":0,"maximumFractionDigits":0,"roundingIncrement":5000,"roundingMode":"halfEven"}),
    );
    assert_eq!(
        fixed
            .format_string(&format!("1{}2500", "0".repeat(39_995)))
            .unwrap(),
        format!("1{}", "0".repeat(39_999))
    );
    assert_eq!(
        fixed.format_string(&nines).unwrap(),
        format!("1{}", "0".repeat(40_000))
    );
    let quarter =
        digits(json!({"minimumFractionDigits":1,"maximumFractionDigits":1,"roundingIncrement":25}));
    let prefix = "7".repeat(39_988);
    assert_eq!(
        quarter
            .format_string(&format!("{prefix}000000000002"))
            .unwrap(),
        format!("{prefix}000000000002.5")
    );
}

#[test]
fn increments_keep_requested_fraction_width_and_even_quotient() {
    let value = digits(
        json!({"minimumFractionDigits":2,"maximumFractionDigits":2,"roundingIncrement":25,"roundingMode":"halfEven"}),
    );
    assert_eq!(value.format("1.125").unwrap().formatted_string, "1.00");
    assert_eq!(value.format("1.375").unwrap().formatted_string, "1.50");
    let value = digits(
        json!({"minimumFractionDigits":3,"maximumFractionDigits":3,"roundingIncrement":5000}),
    );
    let result = value.format("7.5").unwrap();
    assert_eq!(result.formatted_string, "10.000");
    assert_eq!(result.rounding_magnitude, -3);
}

#[test]
fn precision_priority_compares_magnitudes_after_carry() {
    for (priority, input, expected) in [
        ("morePrecision", "1.234", "1.23"),
        ("lessPrecision", "1.234", "1.2"),
    ] {
        let value = digits(
            json!({"maximumSignificantDigits":2,"maximumFractionDigits":2,"roundingPriority":priority}),
        );
        assert_eq!(value.format(input).unwrap().formatted_string, expected);
    }
    for (priority, expected) in [("morePrecision", "999"), ("lessPrecision", "1000")] {
        let value = digits(
            json!({"maximumSignificantDigits":2,"maximumFractionDigits":0,"roundingPriority":priority}),
        );
        assert_eq!(value.format("999").unwrap().formatted_string, expected);
    }
    let value = digits(json!({"maximumSignificantDigits":2}));
    assert_eq!(value.format("999").unwrap().rounding_magnitude, 2);
}

#[test]
fn zeros_padding_and_big_integers() {
    assert_eq!(
        digits(json!({"minimumSignificantDigits":3,"maximumSignificantDigits":4}))
            .format("0.0012")
            .unwrap()
            .formatted_string,
        "0.00120"
    );
    assert_eq!(
        digits(json!({"minimumFractionDigits":2}))
            .format("1.0000")
            .unwrap()
            .formatted_string,
        "1.00"
    );
    assert_eq!(
        digits(json!({"minimumFractionDigits":2,"trailingZeroDisplay":"stripIfInteger"}))
            .format("1.0000")
            .unwrap()
            .formatted_string,
        "1"
    );
    assert_eq!(
        digits(json!({"minimumIntegerDigits":5}))
            .format("-1")
            .unwrap()
            .formatted_string,
        "00001"
    );
    assert_eq!(
        digits(json!({"maximumFractionDigits":0}))
            .format("-9007199254740993")
            .unwrap()
            .number
            .to_string(),
        "-9007199254740993"
    );
    assert_eq!(
        digits(json!({"minimumSignificantDigits":3}))
            .format("0")
            .unwrap()
            .formatted_string,
        "0.00"
    );
    assert_eq!(
        digits(json!({})).format("-0").unwrap().formatted_string,
        "0"
    );
}

#[test]
fn options_validate_only_active_digit_limits() {
    let ignored = Options {
        maximum_significant_digits: Some(2.0),
        maximum_fraction_digits: Some(f64::NAN),
        ..Options::default()
    };
    let value = Digits::new(&ignored, false).unwrap();
    assert_eq!(value.format("1.234").unwrap().formatted_string, "1.2");
    assert!(
        serde_json::to_value(value)
            .unwrap()
            .get("maximumFractionDigits")
            .is_none()
    );
    for input in [
        json!({"roundingIncrement":3}),
        json!({"minimumFractionDigits":5,"maximumFractionDigits":2}),
        json!({"maximumSignificantDigits":22}),
        json!({"roundingMode":"HALFEVEN"}),
    ] {
        assert!(Digits::new(&serde_json::from_value(input).unwrap(), false).is_err());
    }
    let input: Options =
        serde_json::from_value(json!({"roundingIncrement":5,"maximumSignificantDigits":2}))
            .unwrap();
    assert!(matches!(
        Digits::new(&input, false),
        Err(Error::Type("roundingIncrement"))
    ));
    let compact = Digits::new(&Options::default(), true).unwrap();
    let value = serde_json::to_value(compact).unwrap();
    assert_eq!(value["roundingPriority"], "morePrecision");
    assert_eq!(value["maximumSignificantDigits"], 2);
    assert_eq!(value["maximumFractionDigits"], 0);
}

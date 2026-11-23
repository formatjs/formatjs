use formatjs_intl_pluralrules::digits::{Digits, Error, Options};
use serde_json::json;

fn digits(value: serde_json::Value) -> Digits {
    Digits::new(&serde_json::from_value::<Options>(value).unwrap(), false).unwrap()
}

#[test]
fn plain_text_matches_rounding_engine_across_digit_options() {
    for settings in [
        json!({}),
        json!({"maximumFractionDigits":0}),
        json!({"maximumFractionDigits":1}),
        json!({"minimumFractionDigits":2}),
        json!({"minimumIntegerDigits":3}),
        json!({"maximumSignificantDigits":2}),
        json!({"minimumSignificantDigits":3}),
        json!({"maximumSignificantDigits":2,"maximumFractionDigits":2,"roundingPriority":"morePrecision"}),
        json!({"maximumSignificantDigits":2,"maximumFractionDigits":2,"roundingPriority":"lessPrecision"}),
        json!({"minimumFractionDigits":0,"maximumFractionDigits":0,"roundingIncrement":2}),
        json!({"trailingZeroDisplay":"stripIfInteger"}),
        json!({"roundingMode":"floor"}),
        json!({"roundingMode":"halfEven"}),
    ] {
        let value = digits(settings.clone());
        for input in [
            "0",
            "3",
            "1234.5",
            "0.025",
            "0.001",
            "0.0001",
            "1.9996",
            "999999.9995",
            "-0",
            "-3",
            "+3",
            "00",
            "01.5",
            "1.0",
            "1.",
            ".5",
            "1e3",
            "NaN",
            "Infinity",
            "3..5",
            "",
            "12٣",
        ] {
            assert_eq!(
                value.format_string(input),
                value
                    .format(input)
                    .map(|formatted| formatted.formatted_string),
                "{settings}: {input}"
            );
        }
    }
    let value = digits(json!({}));
    for (input, expected) in [
        ("0", "0"),
        ("0.025", "0.025"),
        ("1234.5", "1234.5"),
        ("1.9996", "2"),
    ] {
        assert_eq!(value.format_string(input).unwrap(), expected);
    }
    assert_eq!(
        value.format_string(&format!("{}.5", "7".repeat(40_000))),
        Err(Error::InvalidNumber)
    );
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

#[test]
fn source_precision_retains_zeros_within_rounding_limits() {
    for (input, digit_count, fraction_count, maximum, expected) in [
        ("1", 3, 2, 3, "1.00"),
        ("0", 3, 2, 3, "0.00"),
        ("0", 1, 400, 3, "0.000"),
        ("1", 0, 0, 3, "1"),
        ("12", 3, 1, 3, "12.0"),
        ("0.0012", 4, 6, 5, "0.00120"),
        ("1.2", 4, 0, 5, "1.200"),
        ("1", 3, 4, 3, "1.00"),
        ("9.995", 4, 3, 2, "10.00"),
        ("0.009995", 4, 6, 3, "0.010"),
        ("0.0001", 1, 4, 3, "0.000"),
    ] {
        let value = digits(json!({"maximumFractionDigits":maximum}));
        let result = value
            .format_with_precision(input, digit_count, fraction_count)
            .unwrap();
        assert_eq!(
            result.formatted_string, expected,
            "{input}: {digit_count}, {fraction_count}"
        );
        assert_eq!(result.rounding_magnitude, -maximum);
        assert_eq!(result.number.to_string(), expected);
    }
    for (input, digit_count, fraction_count, maximum, expected, magnitude) in [
        ("1", 3, 2, 5, "1.00", -4),
        ("0", 3, 2, 5, "0.00", -4),
        ("0", 1, 400, 3, "0.00", -2),
        ("1", 0, 0, 5, "1", -4),
        ("0.0012", 4, 6, 5, "0.001200", -7),
        ("1.2", 4, 0, 5, "1.200", -4),
        ("9.995", 4, 3, 3, "10.0", -1),
        ("99.95", 4, 2, 3, "100", 0),
        ("0.0001", 1, 4, 3, "0.0001", -6),
    ] {
        let value = digits(json!({"maximumSignificantDigits":maximum}));
        let result = value
            .format_with_precision(input, digit_count, fraction_count)
            .unwrap();
        assert_eq!(
            result.formatted_string, expected,
            "{input}: {digit_count}, {fraction_count}"
        );
        assert_eq!(result.rounding_magnitude, magnitude);
    }
}

#[test]
fn source_precision_respects_rounding_mode_minima_and_integer_stripping() {
    for (settings, input, expected) in [
        (
            json!({"maximumFractionDigits":2,"roundingMode":"halfEven"}),
            "1.005",
            "1.00",
        ),
        (
            json!({"minimumFractionDigits":2,"maximumFractionDigits":2,"roundingIncrement":5,"roundingMode":"halfEven"}),
            "1.025",
            "1.00",
        ),
        (json!({"minimumFractionDigits":4}), "1", "1.0000"),
        (json!({"minimumSignificantDigits":5}), "1", "1.0000"),
        (json!({"trailingZeroDisplay":"stripIfInteger"}), "1", "1"),
        (
            json!({"maximumSignificantDigits":3,"roundingMode":"floor"}),
            "-9.995",
            "10.0",
        ),
        (
            json!({"maximumSignificantDigits":3,"roundingMode":"ceil"}),
            "-9.995",
            "9.99",
        ),
    ] {
        let value = digits(settings);
        let result = value.format_with_precision(input, 4, 3).unwrap();
        assert_eq!(result.formatted_string, expected, "{input}");
    }
    let value = digits(json!({"maximumFractionDigits":100}));
    assert_eq!(
        value
            .format_with_precision("0", usize::MAX, usize::MAX)
            .unwrap()
            .formatted_string,
        format!("0.{}", "0".repeat(100))
    );
    assert_eq!(
        value
            .format_with_precision("1", usize::MAX, 0)
            .unwrap()
            .formatted_string,
        format!("1.{}", "0".repeat(100))
    );
    let value = digits(json!({"maximumSignificantDigits":21}));
    assert_eq!(
        value
            .format_with_precision("0", usize::MAX, usize::MAX)
            .unwrap()
            .formatted_string,
        format!("0.{}", "0".repeat(20))
    );
}

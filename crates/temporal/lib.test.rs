use formatjs_temporal::{Instant, IsoDateTime, MAX_EPOCH_NANOSECONDS, NANOSECONDS_PER_DAY};

#[test]
fn exact_range_and_negative_millisecond_floor() {
    for value in [-MAX_EPOCH_NANOSECONDS, -1, 0, 1, MAX_EPOCH_NANOSECONDS] {
        let instant = Instant::from_epoch_nanoseconds(value).unwrap();
        assert_eq!(instant.epoch_nanoseconds(), value);
        assert_eq!(
            instant.epoch_milliseconds(),
            value.div_euclid(1_000_000) as i64
        );
        assert_eq!(instant.to_iso().to_epoch_nanoseconds().unwrap(), value);
    }
    for value in [
        i128::MIN,
        -MAX_EPOCH_NANOSECONDS - 1,
        MAX_EPOCH_NANOSECONDS + 1,
        i128::MAX,
    ] {
        assert!(Instant::from_epoch_nanoseconds(value).is_err());
    }
    assert!(Instant::from_epoch_milliseconds(i64::MAX).is_err());
    assert_eq!(
        Instant::from_epoch_milliseconds(-1)
            .unwrap()
            .epoch_nanoseconds(),
        -1_000_000
    );
    for value in [
        -MAX_EPOCH_NANOSECONDS - NANOSECONDS_PER_DAY,
        MAX_EPOCH_NANOSECONDS + NANOSECONDS_PER_DAY,
        i128::MIN,
        i128::MAX,
    ] {
        assert!(IsoDateTime::from_epoch_nanoseconds(value).is_err());
    }
}

#[test]
fn parser_cases_shared_with_typescript() {
    let fixtures: serde_json::Value =
        serde_json::from_str(include_str!(env!("FORMATJS_TEMPORAL_STRINGS"))).unwrap();
    for case in fixtures["valid"].as_array().unwrap() {
        let input = case["input"].as_str().unwrap();
        let expected: i128 = case["epochNanoseconds"].as_str().unwrap().parse().unwrap();
        assert_eq!(
            input.parse::<Instant>().unwrap().epoch_nanoseconds(),
            expected,
            "{input}"
        );
    }
    for case in fixtures["invalid"].as_array().unwrap() {
        let input = case.as_str().unwrap();
        assert!(input.parse::<Instant>().is_err(), "{input}");
    }
}

#[test]
fn independent_icu_gregorian_fields_across_full_range() {
    let mut count = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_ISO"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let values: Vec<i64> = line
            .split('\t')
            .map(|value| value.parse().unwrap())
            .collect();
        let expected = IsoDateTime {
            year: values[1] as i32,
            month: values[2] as u8,
            day: values[3] as u8,
            hour: values[4] as u8,
            minute: values[5] as u8,
            second: values[6] as u8,
            nanosecond: values[7] as u32 * 1_000_000,
        };
        let epoch = i128::from(values[0]) * 1_000_000;
        assert_eq!(
            IsoDateTime::from_epoch_nanoseconds(epoch).unwrap(),
            expected,
            "{line}"
        );
        assert_eq!(expected.to_epoch_nanoseconds().unwrap(), epoch, "{line}");
        count += 1;
    }
    assert!(count > 25000);
    println!("{count} independent ICU Gregorian samples, both directions");
}

#[test]
fn independent_icu_rounding_all_modes_and_epoch_signs() {
    let mut count = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_ROUNDING"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let fields: Vec<_> = line.split('\t').collect();
        let instant = Instant::from_epoch_nanoseconds(fields[0].parse().unwrap()).unwrap();
        let unit = fields[1].parse().unwrap();
        let increment = fields[2].parse().unwrap();
        let mode = fields[3].parse().unwrap();
        let expected: i128 = fields[4].parse().unwrap();
        assert_eq!(
            instant
                .round(unit, increment, mode)
                .unwrap()
                .epoch_nanoseconds(),
            expected,
            "{line}"
        );
        count += 1;
    }
    assert!(count > 1500);
    println!("{count} independent ICU decimal rounding cases");
}

#[test]
fn formatting_precision_offsets_and_range_edges() {
    use formatjs_temporal::{Precision, RoundingMode, TimeUnit};
    for value in [-MAX_EPOCH_NANOSECONDS, -1, 0, 1, MAX_EPOCH_NANOSECONDS] {
        let instant = Instant::from_epoch_nanoseconds(value).unwrap();
        assert_eq!(instant.to_string().parse::<Instant>().unwrap(), instant);
    }
    let instant = Instant::from_epoch_nanoseconds(-1).unwrap();
    assert_eq!(instant.to_string(), "1969-12-31T23:59:59.999999999Z");
    assert_eq!(
        instant
            .format(Precision::Digits(3), RoundingMode::Trunc, None)
            .unwrap()
            .to_string(),
        "1969-12-31T23:59:59.999Z"
    );
    assert_eq!(
        instant
            .format(
                Precision::Minute,
                RoundingMode::Ceil,
                Some(3_600_000_000_000)
            )
            .unwrap()
            .to_string(),
        "1970-01-01T01:00+01:00"
    );
    assert_eq!(
        Instant::from_epoch_nanoseconds(0)
            .unwrap()
            .format(Precision::Auto, RoundingMode::Trunc, Some(-1_000_000_000))
            .unwrap()
            .to_string(),
        "1969-12-31T23:59:59+00:00"
    );
    assert!(
        instant
            .format(Precision::Digits(10), RoundingMode::Trunc, None)
            .is_err()
    );
    for offset in [i64::MIN, -86_400_000_000_000, 86_400_000_000_000, i64::MAX] {
        assert!(
            instant
                .format(Precision::Auto, RoundingMode::Trunc, Some(offset))
                .is_err()
        );
    }
    for increment in [0, 7, 25, u32::MAX] {
        assert!(
            instant
                .round(TimeUnit::Hour, increment, RoundingMode::Trunc)
                .is_err()
        );
    }
}

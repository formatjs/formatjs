use formatjs_temporal::{Instant, IsoDateTime, MAX_EPOCH_NANOSECONDS, NANOSECONDS_PER_DAY};

#[test]
fn independent_icu_clock_rounding() {
    use formatjs_temporal::PlainTime;
    let mut count = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_TIME"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let fields: Vec<&str> = line.split('\t').collect();
        let value = PlainTime::from_nanoseconds(fields[0].parse().unwrap()).unwrap();
        let rounded = value
            .round(
                fields[1].parse().unwrap(),
                fields[2].parse().unwrap(),
                fields[3].parse().unwrap(),
            )
            .unwrap();
        assert_eq!(
            rounded.nanoseconds(),
            fields[4].parse::<i128>().unwrap(),
            "{line}"
        );
        count += 1;
    }
    assert!(count > 3000);
    println!("{count} independent ICU field-relative clock rounding cases");
}

#[test]
fn plain_time_parsing_wrapping_and_signed_differences() {
    use formatjs_temporal::{PlainTime, Precision, RoundingMode, TimeUnit};
    let strings: serde_json::Value =
        serde_json::from_str(include_str!(env!("FORMATJS_TEMPORAL_TIME_STRINGS"))).unwrap();
    for case in strings["valid"].as_array().unwrap() {
        let text = case[0].as_str().unwrap();
        assert_eq!(
            text.parse::<PlainTime>().unwrap().to_string(),
            case[1].as_str().unwrap(),
            "{text}"
        );
    }
    for case in strings["invalid"].as_array().unwrap() {
        let text = case.as_str().unwrap();
        assert!(text.parse::<PlainTime>().is_err(), "{text}");
    }
    let midnight = PlainTime::new(0, 0, 0, 0).unwrap();
    let last: PlainTime = "23:59:59.999999999".parse().unwrap();
    assert_eq!(
        last.format(Precision::Digits(0), RoundingMode::Ceil)
            .unwrap()
            .to_string(),
        "00:00:00"
    );
    assert_eq!(
        midnight
            .format(Precision::Digits(9), RoundingMode::Trunc)
            .unwrap()
            .to_string(),
        "00:00:00.000000000"
    );
    assert_eq!(
        last.format(Precision::Minute, RoundingMode::Trunc)
            .unwrap()
            .to_string(),
        "23:59"
    );
    assert_eq!(
        midnight
            .checked_subtract("P1Y2M3W4DT0.000000001S".parse().unwrap())
            .unwrap()
            .to_string(),
        "23:59:59.999999999"
    );
    let end = "12:18".parse().unwrap();
    let start: PlainTime = "01:06".parse().unwrap();
    assert_eq!(
        start
            .until(
                end,
                TimeUnit::Hour,
                TimeUnit::Minute,
                12,
                RoundingMode::HalfEven
            )
            .unwrap()
            .to_string(),
        "PT11H12M"
    );
    assert_eq!(
        start
            .since(
                end,
                TimeUnit::Hour,
                TimeUnit::Minute,
                12,
                RoundingMode::HalfEven
            )
            .unwrap()
            .to_string(),
        "-PT11H12M"
    );
    assert!(
        start
            .round(TimeUnit::Minute, 60, RoundingMode::Trunc)
            .is_err()
    );
}

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

#[test]
fn duration_fields_parser_float64_slots_and_instant_arithmetic() {
    use formatjs_temporal::{Duration, RoundingMode, TimeUnit};
    for text in [
        "P1Y2M3W4DT5H66M71.50040904S",
        "-PT1.000000001H",
        "PT0.000000001M",
        "PT60S",
        "-P1DT0.123456789S",
    ] {
        let value: Duration = text.parse().unwrap();
        assert_eq!(value.to_string().parse::<Duration>().unwrap(), value);
        assert_eq!(value.negated().negated(), value);
        assert!(value.abs().sign() >= 0);
    }
    for text in [
        "P",
        "PT",
        "P1DT",
        "P1H",
        "PT1.5H0M",
        "PT1.1234567890S",
        "P1Y\n",
        "P4294967296Y",
        "PT9007199254740992S",
    ] {
        assert!(text.parse::<Duration>().is_err(), "{text}");
    }
    let zero = Instant::from_epoch_nanoseconds(0).unwrap();
    let one = zero.checked_add("PT0.000000001S".parse().unwrap()).unwrap();
    assert_eq!(one.epoch_nanoseconds(), 1);
    assert_eq!(
        one.checked_subtract("PT0.000000001S".parse().unwrap())
            .unwrap(),
        zero
    );
    assert_eq!(
        zero.until(
            one,
            TimeUnit::Second,
            TimeUnit::Nanosecond,
            1,
            RoundingMode::Trunc
        )
        .unwrap()
        .to_string(),
        "PT0.000000001S"
    );
    assert!(zero.checked_add("P1D".parse().unwrap()).is_err());
    assert!(
        zero.until(
            one,
            TimeUnit::Second,
            TimeUnit::Minute,
            1,
            RoundingMode::Trunc
        )
        .is_err()
    );
    let lossy =
        Duration::from_time_nanoseconds(9_007_199_254_740_993, TimeUnit::Nanosecond).unwrap();
    assert_eq!(lossy.fields()[9], 9_007_199_254_740_992);
}

#[test]
fn independent_icu_signed_duration_rounding_and_totals() {
    use formatjs_temporal::{Duration, MAX_DURATION_NANOSECONDS, TimeUnit};
    let mut count = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_DURATION"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let fields: Vec<_> = line.split('\t').collect();
        let value: i128 = fields[1].parse().unwrap();
        let mut record = [0; 10];
        record[6] = value / 1_000_000_000;
        record[9] = value % 1_000_000_000;
        let duration = Duration::new(record).unwrap();
        if fields[0] == "total" {
            let actual = if fields[2] == "day" {
                duration.total_days().unwrap()
            } else {
                duration.total(fields[2].parse().unwrap()).unwrap()
            };
            let expected: f64 = fields[4].parse().unwrap();
            assert_eq!(actual.to_bits(), expected.to_bits(), "{line}");
        } else {
            let quantum = if fields[2] == "day" {
                NANOSECONDS_PER_DAY
            } else {
                fields[2].parse::<TimeUnit>().unwrap().nanoseconds()
            };
            let expected: i128 = fields[4].parse().unwrap();
            // Instant's typed difference accepts only valid time increments; use the shared signed core here.
            let actual = formatjs_temporal::round_duration_nanoseconds(
                value,
                quantum,
                fields[3].parse().unwrap(),
            );
            if expected.unsigned_abs() >= MAX_DURATION_NANOSECONDS as u128 {
                assert!(actual.is_err(), "{line}");
            } else {
                assert_eq!(actual.unwrap(), expected, "{line}");
            }
        }
        count += 1;
    }
    assert!(count > 3000);
    println!("{count} independent ICU signed duration rounding/total cases");
}

#[test]
fn duration_precision_preserves_unbalanced_units_and_rounds_signed_time() {
    use formatjs_temporal::{Duration, Precision, RoundingMode};
    let value: Duration = "P1Y2M3W4DT5H66M71.50040904S".parse().unwrap();
    assert_eq!(
        value
            .format(Precision::Digits(9), RoundingMode::Trunc)
            .unwrap()
            .to_string(),
        "P1Y2M3W4DT5H66M71.500409040S"
    );
    assert_eq!(
        value
            .format(Precision::Digits(0), RoundingMode::HalfExpand)
            .unwrap()
            .to_string(),
        "P1Y2M3W4DT6H7M12S"
    );
    let value: Duration = "-PT0.000000001S".parse().unwrap();
    assert_eq!(
        value
            .format(Precision::Digits(6), RoundingMode::Floor)
            .unwrap()
            .to_string(),
        "-PT0.000001S"
    );
    assert_eq!(
        value
            .format(Precision::Digits(6), RoundingMode::Ceil)
            .unwrap()
            .to_string(),
        "PT0.000000S"
    );
    assert!(
        value
            .format(Precision::Minute, RoundingMode::Trunc)
            .is_err()
    );
}

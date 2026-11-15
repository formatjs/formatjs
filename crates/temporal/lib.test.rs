use formatjs_temporal::{Instant, IsoDateTime, MAX_EPOCH_NANOSECONDS, NANOSECONDS_PER_DAY};

#[test]
fn independent_icu_short_dates() {
    use formatjs_temporal::{Duration, Overflow, PlainMonthDay, PlainYearMonth, YearMonthUnit};
    let mut count = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_SHORT_DATES"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let fields: Vec<&str> = line.split('\t').collect();
        let number = |index: usize| fields[index].parse::<i128>().unwrap();
        match fields[0] {
            "ym" => {
                let start = PlainYearMonth::new(number(1) as i32, number(2) as u8, number(3) as u8)
                    .unwrap();
                let duration =
                    Duration::new([number(4), number(5), 0, 0, 0, 0, 0, 0, 0, 0]).unwrap();
                let result = start.checked_add(duration, Overflow::Constrain);
                if fields[10] == "false" {
                    assert!(result.is_err(), "{line}");
                } else {
                    let result = result.unwrap();
                    assert_eq!(
                        result.fields(),
                        (number(6) as i32, number(7) as u8, 1),
                        "{line}"
                    );
                    assert_eq!(result.days_in_month(), number(8) as u8, "{line}");
                    assert_eq!(result.days_in_year(), number(9) as u16, "{line}");
                }
            }
            "md" => {
                let start =
                    PlainMonthDay::new(number(1) as u8, number(2) as u8, number(3) as i32).unwrap();
                let result = start.to_plain_date(number(4) as i32, Overflow::Constrain);
                if fields[6] == "false" {
                    assert!(result.is_err(), "{line}");
                } else {
                    assert_eq!(
                        result.unwrap().fields(),
                        (number(4) as i32, number(1) as u8, number(5) as u8),
                        "{line}"
                    );
                }
            }
            _ => {
                let start = PlainYearMonth::new(number(1) as i32, number(2) as u8, 1).unwrap();
                let end = PlainYearMonth::new(number(3) as i32, number(4) as u8, 1).unwrap();
                let unit = if fields[5] == "year" {
                    YearMonthUnit::Year
                } else {
                    YearMonthUnit::Month
                };
                let mode = fields[7].parse().unwrap();
                let until = start
                    .until(end, unit, unit, number(6) as u32, mode)
                    .unwrap()
                    .fields();
                let since = start
                    .since(end, unit, unit, number(6) as u32, mode)
                    .unwrap()
                    .fields();
                assert_eq!(until[0] * 12 + until[1], number(8), "{line}");
                assert_eq!(since[0] * 12 + since[1], number(9), "{line}");
            }
        }
        count += 1;
    }
    assert!(count > 2000);
    println!("{count} independent ICU short-date cases");
}

#[test]
fn short_date_reference_fields_and_parser_limits() {
    use formatjs_temporal::{Overflow, PlainMonthDay, PlainYearMonth};
    assert!(PlainYearMonth::new(-271821, 4, 1).is_ok());
    assert!(PlainYearMonth::new(-271821, 3, 31).is_err());
    assert!(PlainYearMonth::new(275760, 9, 30).is_ok());
    assert!(PlainYearMonth::new(275760, 10, 1).is_err());
    assert_eq!(
        "2020-02-29T12:34+05:30"
            .parse::<PlainYearMonth>()
            .unwrap()
            .fields(),
        (2020, 2, 1)
    );
    assert_eq!(
        "+999999-10-01".parse::<PlainMonthDay>().unwrap().fields(),
        (10, 1, 1972)
    );
    assert_eq!(
        "-999999-10-01".parse::<PlainMonthDay>().unwrap().fields(),
        (10, 1, 1972)
    );
    assert_eq!(
        "--0229"
            .parse::<PlainMonthDay>()
            .unwrap()
            .to_plain_date(1900, Overflow::Constrain)
            .unwrap()
            .to_string(),
        "1900-02-28"
    );
    assert!("2019-02-29".parse::<PlainMonthDay>().is_err());
    assert_ne!(
        PlainYearMonth::new(2020, 2, 2).unwrap(),
        PlainYearMonth::new(2020, 2, 1).unwrap()
    );
    assert_ne!(
        PlainMonthDay::new(2, 29, 2000).unwrap(),
        PlainMonthDay::new(2, 29, 1972).unwrap()
    );
}

#[test]
fn independent_icu_date_arithmetic() {
    use formatjs_temporal::{Duration, Overflow, PlainDateTime};
    let mut count = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_DATE_ARITHMETIC"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let values: Vec<i128> = line.split('\t').map(|x| x.parse().unwrap()).collect();
        let input = PlainDateTime::from_epoch_nanoseconds(values[0]).unwrap();
        let duration = Duration::new([
            values[1], values[2], values[3], values[4], 0, 0, 0, 0, 0, values[5],
        ])
        .unwrap();
        let actual = input.checked_add(duration, Overflow::Constrain);
        let limit = MAX_EPOCH_NANOSECONDS + NANOSECONDS_PER_DAY;
        if values[6] <= -limit || values[6] >= limit {
            assert!(actual.is_err(), "{line}");
        } else {
            assert_eq!(actual.unwrap().epoch_nanoseconds(), values[6], "{line}");
        }
        count += 1;
    }
    assert_eq!(count, 840);
}

#[test]
fn iso_date_types_parse_round_and_validate() {
    use formatjs_temporal::{Overflow, PlainDate, PlainDateTime, RoundingMode, TimeUnit};
    assert_eq!(
        "2020-02-29"
            .parse::<PlainDate>()
            .unwrap()
            .checked_add("P1Y1M".parse().unwrap(), Overflow::Constrain)
            .unwrap()
            .to_string(),
        "2021-03-29"
    );
    let value: PlainDateTime = "2020-02-29T23:59:59.999999999+05:30".parse().unwrap();
    assert_eq!(
        value
            .round(TimeUnit::Second, 1, RoundingMode::HalfExpand)
            .unwrap()
            .to_string(),
        "2020-03-01T00:00:00"
    );
    assert_eq!(
        "2020-01-01T01:01"
            .parse::<PlainDateTime>()
            .unwrap()
            .round(TimeUnit::Hour, 1, RoundingMode::HalfExpand)
            .unwrap()
            .to_string(),
        "2020-01-01T01:00:00"
    );
    for text in ["2020-02-30", "-000000-01-01T12", "2020-01-01T12Z"] {
        assert!(text.parse::<PlainDateTime>().is_err(), "{text}");
    }
    assert!("-271821-04-19".parse::<PlainDate>().is_ok());
    assert!("-271821-04-19".parse::<PlainDateTime>().is_err());
}

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
    let mut date_count = 0;
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
        let instant = Instant::from_epoch_milliseconds(values[0]);
        if (-MAX_EPOCH_NANOSECONDS..=MAX_EPOCH_NANOSECONDS).contains(&epoch) {
            assert_eq!(instant.unwrap().to_iso(), expected, "{line}");
            date_count += 1;
        } else {
            assert!(instant.is_err(), "{line}");
        }
        count += 1;
    }
    assert!(count > 25000);
    assert_eq!(date_count, 25265);
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

#[test]
fn independent_icu_zoned_fields_and_disambiguation() {
    use formatjs_temporal::{Disambiguation, TimeZone, TransitionZone, ZonedDateTime};
    let zones = owned_iana_zones();
    let mut count = 0;
    let mut transitions = 0;
    let mut previous: Option<(&str, i128, i128)> = None;
    for line in include_str!(env!("FORMATJS_TEMPORAL_TIMEZONE"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let fields: Vec<&str> = line.split('\t').collect();
        let name = fields[0];
        let value = fields[1].parse::<i128>().unwrap() * 1_000_000;
        let offset = fields[2].parse::<i128>().unwrap() * 1_000_000_000;
        let Some((initial, events, future)) = zones.get(name) else {
            continue;
        };
        let zone = TransitionZone::new(*initial, events, *future).unwrap();
        let instant = Instant::from_epoch_nanoseconds(value).unwrap();
        assert_eq!(zone.offset_nanoseconds(instant), offset, "{line}");
        let zoned = ZonedDateTime::new(instant, zone);
        assert_eq!(
            zoned.local().unwrap().epoch_nanoseconds(),
            value + offset,
            "{line}"
        );
        if let Some((old_name, old_value, old_offset)) = previous {
            if old_name == name && value == old_value + 1_000_000 && offset != old_offset {
                let local = value + (offset + old_offset) / 2 + 123;
                let fields = IsoDateTime::from_epoch_nanoseconds(local).unwrap();
                let earlier = local - offset.max(old_offset);
                let later = local - offset.min(old_offset);
                assert_eq!(
                    ZonedDateTime::from_local(fields, zone, Disambiguation::Earlier)
                        .unwrap()
                        .instant()
                        .epoch_nanoseconds(),
                    earlier,
                    "{line}"
                );
                assert_eq!(
                    ZonedDateTime::from_local(fields, zone, Disambiguation::Later)
                        .unwrap()
                        .instant()
                        .epoch_nanoseconds(),
                    later,
                    "{line}"
                );
                assert_eq!(
                    ZonedDateTime::from_local(fields, zone, Disambiguation::Compatible)
                        .unwrap()
                        .instant()
                        .epoch_nanoseconds(),
                    if offset > old_offset { later } else { earlier },
                    "{line}"
                );
                assert!(
                    ZonedDateTime::from_local(fields, zone, Disambiguation::Reject).is_err(),
                    "{line}"
                );
                let start =
                    Instant::from_epoch_nanoseconds(value - NANOSECONDS_PER_DAY / 2).unwrap();
                let zoned = ZonedDateTime::new(start, zone);
                let day = formatjs_temporal::Duration::new([0, 0, 0, 1, 0, 0, 0, 0, 0, 0]).unwrap();
                let hours =
                    formatjs_temporal::Duration::new([0, 0, 0, 0, 24, 0, 0, 0, 0, 0]).unwrap();
                assert_eq!(
                    zoned
                        .checked_add(day, formatjs_temporal::Overflow::Constrain)
                        .unwrap()
                        .instant()
                        .epoch_nanoseconds(),
                    start.epoch_nanoseconds() + NANOSECONDS_PER_DAY + old_offset - offset,
                    "{line}"
                );
                assert_eq!(
                    zoned
                        .checked_add(hours, formatjs_temporal::Overflow::Constrain)
                        .unwrap()
                        .instant()
                        .epoch_nanoseconds(),
                    start.epoch_nanoseconds() + NANOSECONDS_PER_DAY,
                    "{line}"
                );
                assert_eq!(
                    zoned.compare_durations(day, hours).unwrap(),
                    (old_offset - offset).cmp(&0),
                    "{line}"
                );
                transitions += 1;
            }
        }
        previous = Some((name, value, offset));
        count += 1;
    }
    assert_eq!(count, 13160);
    assert_eq!(transitions, 1340);
}

fn owned_iana_zones() -> std::collections::BTreeMap<
    String,
    (
        i32,
        Vec<formatjs_temporal::OffsetTransition>,
        Option<formatjs_temporal::FutureRule>,
    ),
> {
    use formatjs_temporal::{FutureRule, OffsetTransition, TransitionRule};
    use std::collections::BTreeMap;
    fn rule(value: &serde_json::Value) -> TransitionRule {
        let number = |name: &str| value[name].as_i64().unwrap();
        match value["kind"].as_str().unwrap() {
            "month" => TransitionRule::Month {
                month: number("month") as u8,
                week: number("week") as u8,
                weekday: number("weekday") as u8,
                seconds: number("seconds") as i32,
            },
            "day" => TransitionRule::Day {
                day: number("day") as u16,
                seconds: number("seconds") as i32,
            },
            "julian" => TransitionRule::Julian {
                day: number("day") as u16,
                seconds: number("seconds") as i32,
            },
            _ => panic!("unknown rule"),
        }
    }
    let packed: serde_json::Value =
        serde_json::from_str(include_str!(env!("FORMATJS_TEMPORAL_TZ_DATA"))).unwrap();
    let offsets: Vec<i32> = packed["offsets"]
        .as_str()
        .unwrap()
        .split('|')
        .map(|value| i32::from_str_radix(value, 36).unwrap())
        .collect();
    let mut zones = BTreeMap::new();
    for row in packed["zones"].as_array().unwrap() {
        let mut parts = row.as_str().unwrap().split('|');
        let name = parts.next().unwrap();
        let mut initial = 0;
        let mut transitions = Vec::new();
        for part in parts {
            let fields: Vec<&str> = part.split(',').collect();
            let offset = offsets[fields[2].parse::<usize>().unwrap()];
            if fields[0].is_empty() {
                initial = offset;
            } else {
                transitions.push(OffsetTransition {
                    epoch_seconds: i64::from_str_radix(fields[0], 36).unwrap(),
                    offset_seconds: offset,
                });
            }
        }
        let value = &packed["future"][name];
        let future = if value.is_null() {
            None
        } else {
            let daylight = value["daylightOffset"]
                .as_i64()
                .map(|offset| (offset as i32, rule(&value["start"]), rule(&value["end"])));
            Some(
                FutureRule::new(value["standardOffset"].as_i64().unwrap() as i32, daylight)
                    .unwrap(),
            )
        };
        zones.insert(name.to_owned(), (initial, transitions, future));
    }
    zones
}

#[test]
fn owned_iana_transitions_match_icu() {
    use formatjs_temporal::{TimeZone, TransitionDirection, TransitionZone};
    let zones = owned_iana_zones();
    let mut count = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_TRANSITIONS"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let fields: Vec<&str> = line.split('\t').collect();
        let Some((initial, events, future)) = zones.get(fields[0]) else {
            continue;
        };
        let zone = TransitionZone::new(*initial, events, *future).unwrap();
        let instant =
            Instant::from_epoch_nanoseconds(fields[1].parse::<i128>().unwrap() * 1_000_000)
                .unwrap();
        for (index, direction) in [
            (2, TransitionDirection::Next),
            (3, TransitionDirection::Previous),
        ] {
            let expected = if fields[index] == "null" {
                None
            } else {
                Some(fields[index].parse::<i128>().unwrap() * 1_000_000)
            };
            let actual = zone.transition(instant, direction);
            assert_eq!(
                actual.map(Instant::epoch_nanoseconds),
                expected,
                "{line} {direction:?}"
            );
            if let Some(event) = actual {
                let adjacent = Instant::from_epoch_nanoseconds(
                    event.epoch_nanoseconds()
                        + if direction == TransitionDirection::Next {
                            -1
                        } else {
                            1
                        },
                )
                .unwrap();
                assert_eq!(zone.transition(adjacent, direction), Some(event), "{line}");
                let other = zone.transition(event, direction);
                assert!(
                    other.is_none_or(|value| if direction == TransitionDirection::Next {
                        value > event
                    } else {
                        value < event
                    }),
                    "{line}"
                );
            }
        }
        count += 1;
    }
    assert!(count > 10000);
    eprintln!(
        "{count} owned IANA/ICU transition queries, both directions and nanosecond boundaries"
    );
}

#[test]
fn recurring_leap_only_changes_and_adjacent_gaps() {
    use formatjs_temporal::{
        Disambiguation, FutureRule, OffsetTransition, Overflow, TimeZone, TransitionDirection,
        TransitionRule, TransitionZone, ZonedDateTime,
    };
    let future = FutureRule::new(
        0,
        Some((
            3600,
            TransitionRule::Julian {
                day: 60,
                seconds: 0,
            },
            TransitionRule::Day {
                day: 59,
                seconds: 3600,
            },
        )),
    )
    .unwrap();
    let zone = TransitionZone::new(3600, &[], Some(future)).unwrap();
    let query: Instant = "2100-06-01T00:00Z".parse().unwrap();
    assert_eq!(
        zone.transition(query, TransitionDirection::Next),
        Some("2104-02-29T00:00Z".parse().unwrap())
    );
    assert_eq!(
        zone.transition(query, TransitionDirection::Previous),
        Some("2096-03-01T00:00Z".parse().unwrap())
    );
    let events = [
        OffsetTransition {
            epoch_seconds: 0,
            offset_seconds: 0,
        },
        OffsetTransition {
            epoch_seconds: 3600,
            offset_seconds: 3600,
        },
        OffsetTransition {
            epoch_seconds: 7200,
            offset_seconds: 7200,
        },
    ];
    let zone = TransitionZone::new(0, &events, None).unwrap();
    assert_eq!(
        zone.transition(
            Instant::from_epoch_nanoseconds(-1).unwrap(),
            TransitionDirection::Next
        ),
        Some(Instant::from_epoch_nanoseconds(3600_000_000_000).unwrap())
    );
    let local = IsoDateTime {
        year: 1970,
        month: 1,
        day: 1,
        hour: 1,
        minute: 30,
        second: 0,
        nanosecond: 0,
    };
    let later = ZonedDateTime::from_local(local, zone, Disambiguation::Compatible).unwrap();
    let earlier = ZonedDateTime::from_local(local, zone, Disambiguation::Earlier).unwrap();
    assert_eq!(later.instant().epoch_nanoseconds(), 5400_000_000_000);
    assert_eq!(earlier.instant().epoch_nanoseconds(), 1800_000_000_000);
    let duration = formatjs_temporal::Duration::new([0, 0, 0, 0, 1, 0, 0, 0, 0, 0]).unwrap();
    assert_eq!(
        later
            .checked_add(duration, Overflow::Constrain)
            .unwrap()
            .instant()
            .epoch_nanoseconds(),
        9000_000_000_000
    );
}

#[test]
fn independent_icu_zoned_calendar_rounding() {
    use formatjs_temporal::{FixedOffset, TransitionZone, ZonedDateTime, ZonedUnit};
    let zones = owned_iana_zones();
    let mut count = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_ZONED_DIFFERENCE"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let fields: Vec<&str> = line.split('\t').collect();
        let start = Instant::from_epoch_nanoseconds(fields[1].parse().unwrap()).unwrap();
        let end = Instant::from_epoch_nanoseconds(fields[2].parse().unwrap()).unwrap();
        let unit: ZonedUnit = fields[3].parse().unwrap();
        let increment = fields[4].parse().unwrap();
        let mode = fields[5].parse().unwrap();
        let mut expected_until = [0; 10];
        expected_until[unit as usize] = fields[6].parse().unwrap();
        let mut expected_since = [0; 10];
        expected_since[unit as usize] = fields[7].parse().unwrap();
        if fields[0] == "UTC" {
            let zone = FixedOffset::new(0).unwrap();
            let a = ZonedDateTime::new(start, zone);
            let b = ZonedDateTime::new(end, zone);
            assert_eq!(
                a.until(&b, unit, unit, increment, mode).unwrap().fields(),
                expected_until,
                "{line}"
            );
            assert_eq!(
                a.since(&b, unit, unit, increment, mode).unwrap().fields(),
                expected_since,
                "{line}"
            );
        } else {
            let (initial, events, future) = zones.get(fields[0]).unwrap();
            let zone = TransitionZone::new(*initial, events, *future).unwrap();
            let a = ZonedDateTime::new(start, zone);
            let b = ZonedDateTime::new(end, zone);
            assert_eq!(
                a.until(&b, unit, unit, increment, mode).unwrap().fields(),
                expected_until,
                "{line}"
            );
            assert_eq!(
                a.since(&b, unit, unit, increment, mode).unwrap().fields(),
                expected_since,
                "{line}"
            );
        }
        count += 1;
    }
    assert_eq!(count, 19440);
}

#[test]
fn zoned_differences_at_instant_limits() {
    use formatjs_temporal::{FixedOffset, RoundingMode, ZonedDateTime, ZonedUnit};
    for seconds in [0, 7200, -25200, 1080, -29520] {
        let zone = FixedOffset::new(seconds * 1_000_000_000).unwrap();
        for extreme in [-MAX_EPOCH_NANOSECONDS, MAX_EPOCH_NANOSECONDS] {
            let limit = ZonedDateTime::new(Instant::from_epoch_nanoseconds(extreme).unwrap(), zone);
            let ordinary = ZonedDateTime::new("1970-09-01T15:47:32Z".parse().unwrap(), zone);
            ordinary
                .until(
                    &limit,
                    ZonedUnit::Year,
                    ZonedUnit::Nanosecond,
                    1,
                    RoundingMode::Trunc,
                )
                .unwrap_or_else(|error| panic!("ordinary to limit {seconds} {extreme}: {error:?}"));
            limit
                .until(
                    &ordinary,
                    ZonedUnit::Year,
                    ZonedUnit::Nanosecond,
                    1,
                    RoundingMode::Trunc,
                )
                .unwrap_or_else(|error| panic!("limit to ordinary {seconds} {extreme}: {error:?}"));
            let a = ordinary
                .until(
                    &limit,
                    ZonedUnit::Second,
                    ZonedUnit::Nanosecond,
                    1,
                    RoundingMode::Trunc,
                )
                .unwrap();
            let b = limit
                .until(
                    &ordinary,
                    ZonedUnit::Second,
                    ZonedUnit::Nanosecond,
                    1,
                    RoundingMode::Trunc,
                )
                .unwrap();
            assert_eq!(a, b.negated());
        }
    }
}

#[test]
fn independent_icu_relative_duration_operations() {
    use formatjs_temporal::{Duration, RoundingMode, TransitionZone, ZonedDateTime, ZonedUnit};
    let zones = owned_iana_zones();
    let mut rounds = 0;
    let mut totals = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_ZONED_DIFFERENCE"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let fields: Vec<&str> = line.split('\t').collect();
        let zone = if fields[0] == "UTC" {
            TransitionZone::new(0, &[], None).unwrap()
        } else {
            let (initial, events, future) = zones.get(fields[0]).unwrap();
            TransitionZone::new(*initial, events, *future).unwrap()
        };
        let a = ZonedDateTime::new(
            Instant::from_epoch_nanoseconds(fields[1].parse().unwrap()).unwrap(),
            zone,
        );
        let b = ZonedDateTime::new(
            Instant::from_epoch_nanoseconds(fields[2].parse().unwrap()).unwrap(),
            zone,
        );
        let unit: ZonedUnit = fields[3].parse().unwrap();
        let increment = fields[4].parse().unwrap();
        let mode = fields[5].parse().unwrap();
        let duration = a
            .until(&b, unit, ZonedUnit::Nanosecond, 1, RoundingMode::Trunc)
            .unwrap();
        let mut expected = [0; 10];
        expected[unit as usize] = fields[6].parse().unwrap();
        assert_eq!(
            a.round_duration(duration, unit, unit, increment, mode)
                .unwrap(),
            Duration::new(expected).unwrap(),
            "{line}"
        );
        rounds += 1;
        if fields[8] != "null" {
            assert_eq!(
                a.total_duration(duration, unit).unwrap(),
                fields[8].parse::<f64>().unwrap(),
                "{line}"
            );
            totals += 1;
        }
    }
    assert_eq!(rounds, 19440);
    assert_eq!(totals, 6480);
}

#[test]
fn relative_duration_prefixes_and_day_boundaries() {
    use formatjs_temporal::{Duration, FixedOffset, RoundingMode, ZonedDateTime, ZonedUnit};
    let zone = FixedOffset::new(0).unwrap();
    let start = ZonedDateTime::new("2020-01-31T00:00Z".parse().unwrap(), zone);
    let days = Duration::new([0, 0, 0, 59, 0, 0, 0, 0, 0, 0]).unwrap();
    assert_eq!(
        start
            .round_duration(
                days,
                ZonedUnit::Year,
                ZonedUnit::Week,
                1,
                RoundingMode::Ceil
            )
            .unwrap()
            .fields(),
        [0, 1, 5, 0, 0, 0, 0, 0, 0, 0]
    );
    let blank = Duration::new([0; 10]).unwrap();
    let edge = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(MAX_EPOCH_NANOSECONDS).unwrap(),
        zone,
    );
    assert!(
        edge.round_duration(
            blank,
            ZonedUnit::Day,
            ZonedUnit::Minute,
            1,
            RoundingMode::Trunc
        )
        .is_err()
    );
    let before = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(
            MAX_EPOCH_NANOSECONDS - NANOSECONDS_PER_DAY + 1_000_000_000,
        )
        .unwrap(),
        zone,
    );
    assert!(before.total_duration(blank, ZonedUnit::Day).is_err());
    let close = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(MAX_EPOCH_NANOSECONDS - 1_000_000_000).unwrap(),
        zone,
    );
    assert_eq!(
        close
            .round_duration(
                blank,
                ZonedUnit::Year,
                ZonedUnit::Nanosecond,
                1,
                RoundingMode::HalfExpand
            )
            .unwrap(),
        blank
    );
}

#[test]
fn now_uses_host_clock_and_owned_iana_with_icu_controls() {
    use formatjs_temporal::{Now, SystemClock, TransitionZone};
    struct Clock(i128);
    impl SystemClock for Clock {
        fn epoch_nanoseconds(&self) -> i128 {
            self.0
        }
    }
    let zones = owned_iana_zones();
    let mut count = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_TIMEZONE"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let fields: Vec<&str> = line.split('\t').collect();
        let Some((initial, events, future)) = zones.get(fields[0]) else {
            continue;
        };
        let value = fields[1].parse::<i128>().unwrap() * 1_000_000 + 123;
        let offset = fields[2].parse::<i128>().unwrap() * 1_000_000_000;
        let zone = TransitionZone::new(*initial, events, *future).unwrap();
        let now = Now::new(Clock(value));
        let local = now.plain_date_time_iso(zone).unwrap();
        assert_eq!(now.instant().epoch_nanoseconds(), value, "{line}");
        assert_eq!(
            now.zoned_date_time_iso(zone).instant().epoch_nanoseconds(),
            value,
            "{line}"
        );
        assert_eq!(local.epoch_nanoseconds(), value + offset, "{line}");
        assert_eq!(now.plain_date_iso(zone).unwrap(), local.date(), "{line}");
        assert_eq!(now.plain_time_iso(zone).unwrap(), local.time(), "{line}");
        count += 1;
    }
    assert_eq!(count, 13160);
    for sign in [-1, 1] {
        let now = Now::new(Clock(sign * (MAX_EPOCH_NANOSECONDS + 1)));
        assert_eq!(
            now.instant().epoch_nanoseconds(),
            sign * MAX_EPOCH_NANOSECONDS
        );
    }
}

#[test]
fn independent_icu_named_zone_identities() {
    use formatjs_temporal::{
        NamedTimeZone, RoundingMode, TransitionZone, ZonedDateTime, ZonedUnit,
        named_time_zone_identifier,
    };
    let zones = owned_iana_zones();
    let named = |id: &str| {
        let record = named_time_zone_identifier(id).unwrap();
        let provider = if record.primary == "UTC" {
            TransitionZone::new(0, &[], None).unwrap()
        } else {
            let (initial, transitions, future) = zones.get(record.primary).unwrap();
            TransitionZone::new(*initial, transitions, *future).unwrap()
        };
        NamedTimeZone::new(id, provider).unwrap()
    };
    let mut count = 0;
    let mut controls = Vec::new();
    for line in include_str!(env!("FORMATJS_TEMPORAL_TZ_IDENTITIES"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let (id, expected) = line.split_once('\t').unwrap();
        let Some(record) = named_time_zone_identifier(id) else {
            continue;
        };
        assert_eq!(record.primary, expected, "{line}");
        assert_eq!(
            named_time_zone_identifier(&id.to_ascii_lowercase()),
            Some(record)
        );
        controls.push((named(id), expected));
        count += 1;
    }
    assert_eq!(count, 597);
    let mut pairs = 0;
    for (i, (one, expected_one)) in controls.iter().enumerate() {
        for (two, expected_two) in &controls[..=i] {
            assert_eq!(one == two, expected_one == expected_two);
            pairs += 1;
        }
    }
    assert_eq!(pairs, 178503);
    for invalid in [
        "Not/AZone",
        "america/new_york ",
        "AMERİCA/NEW_YORK",
        "+00:00",
        "Etc/Unknown",
    ] {
        assert!(named_time_zone_identifier(invalid).is_none());
    }
    let accra = named("aFRICA/aCCRA");
    let abidjan = named("Africa/Abidjan");
    assert_eq!(accra.identifier(), "Africa/Accra");
    assert_ne!(accra, abidjan);
    let epoch = Instant::from_epoch_nanoseconds(0).unwrap();
    let first = ZonedDateTime::new(epoch, accra);
    let second = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(NANOSECONDS_PER_DAY).unwrap(),
        abidjan,
    );
    assert!(
        first
            .until(
                &second,
                ZonedUnit::Day,
                ZonedUnit::Nanosecond,
                1,
                RoundingMode::Trunc
            )
            .is_err()
    );
    assert_eq!(
        first
            .until(
                &second,
                ZonedUnit::Hour,
                ZonedUnit::Nanosecond,
                1,
                RoundingMode::Trunc
            )
            .unwrap()
            .fields()[4],
        24
    );
    for (alias, primary) in [
        ("US/Eastern", "America/New_York"),
        ("Pacific/Truk", "Pacific/Chuuk"),
        ("Atlantic/Jan_Mayen", "Arctic/Longyearbyen"),
        ("Etc/UTC", "UTC"),
    ] {
        assert_eq!(named(alias), named(primary));
    }
}

#[test]
fn independent_icu_plain_relative_operations() {
    use formatjs_temporal::{DateTimeUnit, Duration, PlainDateTime, TimeUnit};
    let mut rounds = 0;
    let mut totals = 0;
    let mut dates = 0;
    let mut comparisons = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_PLAIN_RELATIVE"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let fields: Vec<&str> = line.split('\t').collect();
        let start = PlainDateTime::from_epoch_nanoseconds(fields[1].parse().unwrap()).unwrap();
        let date = start.date();
        if fields[0] == "C" {
            let one = fields[2].parse().unwrap();
            let two = fields[3].parse().unwrap();
            assert_eq!(
                date.compare_durations(one, two).unwrap() as i8,
                fields[4].parse::<i8>().unwrap(),
                "{line}"
            );
            comparisons += 1;
            continue;
        }
        let end = PlainDateTime::from_epoch_nanoseconds(fields[2].parse().unwrap()).unwrap();
        let unit: DateTimeUnit = fields[3].parse().unwrap();
        let increment = fields[4].parse().unwrap();
        let mode = fields[5].parse().unwrap();
        let mut until = [0; 10];
        until[unit as usize] = fields[6].parse().unwrap();
        let mut since = [0; 10];
        since[unit as usize] = fields[7].parse().unwrap();
        if fields[0] == "D" {
            assert_eq!(
                date.until(end.date(), unit, unit, increment, mode)
                    .unwrap()
                    .fields(),
                until,
                "{line}"
            );
            assert_eq!(
                date.since(end.date(), unit, unit, increment, mode)
                    .unwrap()
                    .fields(),
                since,
                "{line}"
            );
            dates += 1;
            continue;
        }
        assert_eq!(
            start
                .until(end, unit, unit, increment, mode)
                .unwrap()
                .fields(),
            until,
            "{line}"
        );
        assert_eq!(
            start
                .since(end, unit, unit, increment, mode)
                .unwrap()
                .fields(),
            since,
            "{line}"
        );
        let duration = Duration::from_time_nanoseconds(
            end.epoch_nanoseconds() - start.epoch_nanoseconds(),
            TimeUnit::Hour,
        )
        .unwrap();
        assert_eq!(
            date.round_duration(duration, unit, unit, increment, mode)
                .unwrap()
                .fields(),
            until,
            "{line}"
        );
        rounds += 1;
        if fields[8] != "null" {
            assert_eq!(
                date.total_duration(duration, unit).unwrap(),
                fields[8].parse::<f64>().unwrap(),
                "{line}"
            );
            totals += 1;
        }
    }
    assert_eq!(rounds, 51840);
    assert_eq!(totals, 17280);
    assert_eq!(dates, 20736);
    assert_eq!(comparisons, 4224);
}

#[test]
fn plain_relative_test262_range_and_prefix_cases() {
    use formatjs_temporal::{
        DateTimeUnit as U, Duration, PlainDate, PlainDateTime, RoundingMode as R,
    };
    let zero = Duration::new([0; 10]).unwrap();
    let earliest: PlainDate = "-271821-04-19".parse().unwrap();
    let latest: PlainDate = "+275760-09-13".parse().unwrap();
    for date in [earliest, latest] {
        assert_eq!(date.total_duration(zero, U::Day).unwrap(), 0.0);
        assert_eq!(
            date.round_duration(zero, U::Year, U::Nanosecond, 1, R::HalfExpand)
                .unwrap(),
            zero
        );
    }
    for (date, nanosecond, mode) in [
        (latest, 1, R::Ceil),
        ("-271821-04-20".parse().unwrap(), -1, R::Floor),
    ] {
        let duration = Duration::new([0, 0, 0, 0, 0, 0, 0, 0, 0, nanosecond]).unwrap();
        assert_eq!(
            date.round_duration(duration, U::Day, U::Day, 1_000_000_000, mode)
                .unwrap()
                .fields(),
            [0, 0, 0, nanosecond * 1_000_000_000, 0, 0, 0, 0, 0, 0]
        );
    }
    let near_min: PlainDate = "-271821-05-19".parse().unwrap();
    assert_eq!(
        near_min
            .round_duration("-PT23H".parse().unwrap(), U::Year, U::Day, 1, R::Expand)
            .unwrap()
            .to_string(),
        "-P1D"
    );
    let start: PlainDate = "2020-01-31".parse().unwrap();
    assert_eq!(
        start
            .round_duration("P59D".parse().unwrap(), U::Year, U::Week, 1, R::Ceil)
            .unwrap()
            .to_string(),
        "P1M5W"
    );
    let start: PlainDate = "2020-01-01".parse().unwrap();
    for sign in [-1, 1] {
        let long =
            Duration::new([0, 0, 0, 0, 0, 0, sign * 9_007_199_254_740_991, 0, 0, 0]).unwrap();
        for unit in [U::Year, U::Month, U::Week] {
            assert!(start.total_duration(long, unit).is_err());
            assert!(
                start
                    .round_duration(long, unit, unit, 1, R::HalfExpand)
                    .is_err()
            );
        }
        for unit in [U::Day, U::Hour, U::Second] {
            assert!(start.total_duration(long, unit).is_err());
            assert!(
                start
                    .round_duration(long, unit, U::Nanosecond, 1, R::Trunc)
                    .is_err()
            );
        }
        let overflow =
            Duration::new([sign, 0, 0, 0, 0, 0, sign * 9_007_199_254_740_991, 0, 0, 0]).unwrap();
        assert!(start.compare_durations(overflow, zero).is_err());
        assert!(start.compare_durations(zero, overflow).is_err());
    }
    assert_eq!(
        earliest
            .until(latest, U::Day, U::Day, 1, R::Trunc)
            .unwrap()
            .fields()[3],
        200_000_001
    );
    assert!(
        start
            .round_duration(zero, U::Year, U::Week, 2, R::Trunc)
            .is_err()
    );
    assert!(start.until(start, U::Day, U::Hour, 1, R::Trunc).is_err());
    let first: PlainDateTime = "2020-01-31T23:30".parse().unwrap();
    let last: PlainDateTime = "2020-03-01T00:15".parse().unwrap();
    assert_eq!(
        first
            .until(last, U::Year, U::Nanosecond, 1, R::Trunc)
            .unwrap()
            .to_string(),
        "P1MT45M"
    );
    let first: PlainDateTime = "2020-01-31T00:00".parse().unwrap();
    let last: PlainDateTime = "2020-02-29T00:00".parse().unwrap();
    assert_eq!(
        first
            .until(last, U::Month, U::Day, 1, R::Trunc)
            .unwrap()
            .to_string(),
        "P1M"
    );
    assert_eq!(
        first
            .since(last, U::Month, U::Day, 1, R::Trunc)
            .unwrap()
            .to_string(),
        "-P1M"
    );
    assert_eq!(
        last.until(first, U::Month, U::Day, 1, R::Trunc)
            .unwrap()
            .to_string(),
        "-P29D"
    );
    let bound = MAX_EPOCH_NANOSECONDS + NANOSECONDS_PER_DAY;
    for edge in [-bound + 1, bound - 1] {
        let edge = PlainDateTime::from_epoch_nanoseconds(edge).unwrap();
        first
            .until(edge, U::Year, U::Nanosecond, 1, R::Trunc)
            .unwrap();
        edge.until(first, U::Year, U::Nanosecond, 1, R::Trunc)
            .unwrap();
    }
}

#[test]
fn plain_date_time_rounding_crosses_public_date_limits() {
    use formatjs_temporal::{DateTimeUnit as U, PlainDateTime, RoundingMode as R};
    let first: PlainDateTime = "2000-01-31T12:34:56".parse().unwrap();
    for (last, mode, expected) in [
        (
            "+275760-09-13T23:59:59.999999999",
            R::Ceil,
            [
                "P273760Y7M13DT12H",
                "P3285127M13DT12H",
                "P14284144W5DT12H",
                "P99989013DT12H",
            ],
        ),
        (
            "-271821-04-19T00:00:00.000000001",
            R::Floor,
            [
                "-P273820Y9M11DT13H",
                "-P3285849M11DT13H",
                "-P14287284WT13H",
                "-P100010988DT13H",
            ],
        ),
    ] {
        let last = last.parse().unwrap();
        for (largest, expected) in [U::Year, U::Month, U::Week, U::Day]
            .into_iter()
            .zip(expected)
        {
            assert_eq!(
                first
                    .until(last, largest, U::Hour, 1, mode)
                    .unwrap()
                    .to_string(),
                expected
            );
        }
    }
}

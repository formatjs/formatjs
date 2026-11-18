use formatjs_temporal::{
    binary,
    ffi::{TemporalBytes, formatjs_temporal_bytes_free, formatjs_temporal_query},
};

fn opcode(name: &str) -> u8 {
    let request = br#"{"op":"info"}"#;
    let mut response = TemporalBytes {
        data: core::ptr::null_mut(),
        len: 0,
    };
    unsafe {
        assert_eq!(
            formatjs_temporal_query(request.as_ptr(), request.len(), &mut response),
            0
        );
        let value: serde_json::Value =
            serde_json::from_slice(core::slice::from_raw_parts(response.data, response.len))
                .unwrap();
        formatjs_temporal_bytes_free(response);
        value["operations"]
            .as_array()
            .unwrap()
            .iter()
            .position(|v| v == name)
            .unwrap() as u8
    }
}
fn text(output: &mut Vec<u8>, value: &str) {
    output.extend_from_slice(&(value.len() as u32).to_le_bytes());
    output.extend_from_slice(value.as_bytes());
}
fn parse_request(value: &str) -> Vec<u8> {
    let mut request = vec![opcode("parseInstant"), 6, 1, 0, 0, 0];
    request.extend_from_slice(&u16::MAX.to_le_bytes());
    text(&mut request, "text");
    request.push(4);
    text(&mut request, value);
    request
}
fn integer_record(value: i128) -> Vec<u8> {
    if let Ok(value) = i64::try_from(value) {
        [vec![15], value.to_le_bytes().to_vec()].concat()
    } else {
        [vec![10], value.to_le_bytes().to_vec()].concat()
    }
}
fn call(bytes: &[u8]) -> (u32, Vec<u8>) {
    unsafe {
        let info = binary::input(bytes.len()) as *const usize;
        assert!(!info.is_null());
        let pointer = info.read() as *mut u8;
        core::ptr::copy_nonoverlapping(bytes.as_ptr(), pointer, bytes.len());
        let result = binary::exchange(bytes.len());
        let status = u32::from_le_bytes(core::slice::from_raw_parts(result, 4).try_into().unwrap());
        let length = u32::from_le_bytes(
            core::slice::from_raw_parts(result.add(4), 4)
                .try_into()
                .unwrap(),
        ) as usize;
        (
            status,
            core::slice::from_raw_parts(result.add(8), length).to_vec(),
        )
    }
}
#[test]
fn reusable_records_preserve_nanoseconds_and_recover_after_errors() {
    let request = parse_request("2020-02-21T23:59:59.123456789+05:45");
    let mut expected = vec![4];
    text(&mut expected, "1582308899123456789");
    assert_eq!(call(&request), (0, expected.clone()));
    let mut trailing = request.clone();
    trailing.push(0);
    let mut duplicate = request.clone();
    duplicate[2] = 2;
    duplicate.extend_from_slice(&request[6..]);
    for invalid in [
        trailing,
        duplicate,
        vec![],
        vec![255],
        request[..request.len() - 1].to_vec(),
        vec![opcode("parseInstant"), 255],
    ] {
        assert_eq!(call(&invalid).0, 2);
        assert_eq!(call(&request), (0, expected.clone()));
    }
    assert_eq!(call(&parse_request("invalid")).0, 1);
    assert_eq!(call(&request), (0, expected));
}
#[test]
fn allocation_failure_and_invalid_lengths_leave_storage_usable() {
    let request = parse_request("1970-01-01T00:00Z");
    let before = call(&request);
    assert!(binary::input(usize::MAX).is_null());
    unsafe {
        let result = binary::exchange(usize::MAX);
        assert_eq!(
            u32::from_le_bytes(core::slice::from_raw_parts(result, 4).try_into().unwrap()),
            2
        );
    }
    assert_eq!(call(&request), before);
}

#[test]
fn typed_instant_records_preserve_signed_nanoseconds_and_reject_trailing_bytes() {
    for (input, nanoseconds) in [
        ("1969-12-31T23:59:59.123456789Z", -876_543_211i128),
        (
            "2020-02-21T23:59:59.123456789+05:45",
            1_582_308_899_123_456_789,
        ),
        ("+275760-09-13T00:00Z", 8_640_000_000_000_000_000_000),
        ("-271821-04-20T00:00Z", -8_640_000_000_000_000_000_000),
    ] {
        let mut request = vec![opcode("parseInstant"), 10];
        text(&mut request, input);
        let expected = integer_record(nanoseconds);
        assert_eq!(call(&request), (0, expected.clone()));
        let mut trailing = request.clone();
        trailing.push(0);
        assert_eq!(call(&trailing).0, 2);
        assert_eq!(call(&request[..request.len() - 1]).0, 2);
        assert_eq!(call(&request), (0, expected));
    }
}

#[test]
fn typed_dates_balance_leap_days_and_recover_after_invalid_records() {
    let parse = |value: &str| {
        let mut request = vec![opcode("parsePlainDate"), 10];
        text(&mut request, value);
        request
    };
    let origin = parse("2020-02-21");
    let expected = call(&parse("2020-03-21"));
    assert_eq!(expected.0, 0);
    let mut add = vec![opcode("addPlainDate"), 10];
    add.extend_from_slice(&18313f64.to_le_bytes());
    for field in [0f64, 0., 0., 29., 0., 0., 0., 0., 0., 0.] {
        add.extend_from_slice(&field.to_le_bytes());
    }
    add.extend_from_slice(&[0, 0]);
    text(&mut add, "iso8601");
    assert_eq!(call(&add), expected);
    let mut invalid_flag = add.clone();
    invalid_flag[90] = 2;
    let mut trailing = origin.clone();
    trailing.push(0);
    for invalid in [invalid_flag, trailing, origin[..origin.len() - 1].to_vec()] {
        assert_eq!(call(&invalid).0, 2);
        assert_eq!(call(&add), expected);
    }
    let mut invalid_duration = add.clone();
    invalid_duration[10..18].copy_from_slice(&f64::INFINITY.to_le_bytes());
    assert_eq!(call(&invalid_duration).0, 1);
    assert_eq!(call(&add), expected);
}

#[test]
fn typed_rounding_preserves_modes_and_recovers_after_invalid_requests() {
    use formatjs_temporal::{Instant, RoundingMode, TimeUnit};
    let modes = [
        RoundingMode::Ceil,
        RoundingMode::Floor,
        RoundingMode::Expand,
        RoundingMode::Trunc,
        RoundingMode::HalfCeil,
        RoundingMode::HalfFloor,
        RoundingMode::HalfExpand,
        RoundingMode::HalfTrunc,
        RoundingMode::HalfEven,
    ];
    let request = |value: i128, mode: u8| {
        let mut bytes = vec![opcode("roundInstant"), 10];
        bytes.extend_from_slice(&value.to_le_bytes());
        bytes.push(3);
        bytes.extend_from_slice(&125u32.to_le_bytes());
        bytes.push(mode);
        bytes
    };
    for value in [-187_500_000, -62_500_000, -1, 0, 62_500_000, 187_500_000] {
        for (index, mode) in modes.iter().enumerate() {
            let expected = Instant::from_epoch_nanoseconds(value)
                .unwrap()
                .round(TimeUnit::Millisecond, 125, *mode)
                .unwrap()
                .epoch_nanoseconds();
            let output = integer_record(expected);
            assert_eq!(call(&request(value, index as u8)), (0, output));
        }
    }
    let valid = request(-1, 0);
    let expected = call(&valid);
    let mut invalid_unit = valid.clone();
    invalid_unit[18] = 6;
    let mut invalid_mode = valid.clone();
    invalid_mode[23] = 9;
    let mut trailing = valid.clone();
    trailing.push(0);
    for invalid in [invalid_unit, invalid_mode, trailing, valid[..23].to_vec()] {
        assert_eq!(call(&invalid).0, 2);
        assert_eq!(call(&valid), expected);
    }
    for increment in [0u32, 7, 1_000_000_001] {
        let mut invalid = valid.clone();
        invalid[19..23].copy_from_slice(&increment.to_le_bytes());
        assert_eq!(call(&invalid).0, 1);
        assert_eq!(call(&valid), expected);
    }
}

#[test]
fn typed_date_time_records_preserve_fractional_seconds_and_recover_after_errors() {
    for (source, clock) in [
        (
            "1969-12-31T23:59:59.999999999",
            (23, 59, 59, 999u16, 999u16, 999u16),
        ),
        ("2000-02-29T12:34:56.123456789", (12, 34, 56, 123, 456, 789)),
        ("+010000-01-01T00:00:00.000001002", (0, 0, 0, 0, 1, 2)),
    ] {
        let mut request = vec![opcode("parsePlainDateTime"), 10];
        text(&mut request, source);
        let (status, result) = call(&request);
        assert_eq!(status, 0);
        assert_eq!(result.len(), 48);
        assert_eq!(result[0], 12);
        let expected: formatjs_temporal::PlainDateTime = source.parse().unwrap();
        assert_eq!(
            i128::from_le_bytes(result[1..17].try_into().unwrap()),
            expected.epoch_nanoseconds()
        );
        assert_eq!(result[17], 11);
        assert_eq!(&result[39..42], &[clock.0, clock.1, clock.2]);
        for (offset, value) in [(42, clock.3), (44, clock.4), (46, clock.5)] {
            assert_eq!(
                u16::from_le_bytes(result[offset..offset + 2].try_into().unwrap()),
                value
            );
        }
        assert_eq!(call(&request[..request.len() - 1]).0, 2);
        request.push(0);
        assert_eq!(call(&request).0, 2);
        request.pop();
        assert_eq!(call(&request).0, 0);
    }
}

#[test]
fn typed_clocks_preserve_last_nanosecond_wrap_midnight_and_recover() {
    let mut request = vec![opcode("parsePlainTime"), 10];
    text(&mut request, "23:59:59.999999999");
    let (status, result) = call(&request);
    assert_eq!(status, 0);
    assert_eq!(result.len(), 18);
    assert_eq!(result[0], 13);
    assert_eq!(
        f64::from_le_bytes(result[1..9].try_into().unwrap()),
        86_399_999_999_999.0
    );
    assert_eq!(&result[9..12], &[23, 59, 59]);
    for offset in [12, 14, 16] {
        assert_eq!(
            u16::from_le_bytes(result[offset..offset + 2].try_into().unwrap()),
            999
        );
    }
    let mut rounding = vec![opcode("roundPlainTime"), 10];
    rounding.extend_from_slice(&86_399_999_999_999.0f64.to_le_bytes());
    rounding.push(0);
    rounding.extend_from_slice(&1u32.to_le_bytes());
    rounding.push(0);
    let (status, result) = call(&rounding);
    assert_eq!(status, 0);
    assert_eq!(result, [vec![13], vec![0; 17]].concat());
    let valid = rounding.clone();
    for value in [f64::NAN, f64::INFINITY, -1.0, 86_400_000_000_000.0, 0.5] {
        rounding[2..10].copy_from_slice(&value.to_le_bytes());
        assert_eq!(call(&rounding).0, 1);
        assert_eq!(call(&valid).0, 0);
    }
    assert_eq!(call(&valid[..15]).0, 2);
    let mut trailing = valid.clone();
    trailing.push(0);
    assert_eq!(call(&trailing).0, 2);
    assert_eq!(call(&valid).0, 0);
}

#[test]
fn scalar_rounding_requests_fallback_for_wide_results_and_errors() {
    use formatjs_temporal::{Instant, RoundingMode, TimeUnit};
    let scalar = binary::round_instant_i64;
    assert_eq!(scalar(i64::MIN, 5, 1, 3), i64::MIN);
    for value in [i64::MIN, i64::MIN + 3, -1, 0, 1, i64::MAX - 2, i64::MAX] {
        for (mode, kind) in [
            (0, RoundingMode::Ceil),
            (1, RoundingMode::Floor),
            (8, RoundingMode::HalfEven),
        ] {
            let expected = Instant::from_epoch_nanoseconds(i128::from(value))
                .unwrap()
                .round(TimeUnit::Nanosecond, 10, kind)
                .unwrap()
                .epoch_nanoseconds();
            assert_eq!(
                scalar(value, 5, 10, mode),
                i64::try_from(expected).unwrap_or(i64::MIN)
            );
        }
    }
    for (unit, increment, mode) in [(6, 1, 0), (5, 1, 9), (5, 0, 0), (5, 7, 0)] {
        assert_eq!(scalar(1, unit, increment, mode), i64::MIN);
        assert_eq!(scalar(1, 5, 1, 0), 1);
    }
}

#[test]
fn typed_zone_transitions_preserve_boundaries_nulls_and_errors() {
    use formatjs_temporal::{Instant, TimeZone, TimeZoneRegistry, TransitionDirection};
    let request = |identifier: &str, value: i128, direction: u8| {
        let mut bytes = vec![opcode("timeZoneTransition"), 10];
        bytes.extend_from_slice(&value.to_le_bytes());
        bytes.push(direction);
        text(&mut bytes, identifier);
        bytes
    };
    for identifier in ["America/New_York", "Europe/Paris", "UTC", "+05:45"] {
        let zone = TimeZoneRegistry::compiled().resolve(identifier).unwrap();
        for text in [
            "2024-03-10T06:59:59.999999999Z",
            "2024-03-10T07:00Z",
            "2024-03-10T07:00:00.000000001Z",
            "2400-01-01T00:00Z",
            "-271821-04-20T00:00Z",
            "+275760-09-13T00:00Z",
        ] {
            let instant: Instant = text.parse().unwrap();
            for (code, direction) in [
                (0, TransitionDirection::Next),
                (1, TransitionDirection::Previous),
            ] {
                let expected = zone
                    .transition(instant, direction)
                    .map_or(vec![0], |value| integer_record(value.epoch_nanoseconds()));
                let mut bytes = request(identifier, instant.epoch_nanoseconds(), code);
                assert_eq!(call(&bytes), (0, expected));
                bytes.push(0);
                assert_eq!(call(&bytes).0, 2);
            }
        }
    }
    assert_eq!(call(&request("UTC", 0, 2)).0, 2);
    assert_eq!(call(&request("Invalid/Zone", 0, 0)).0, 1);
    assert_eq!(call(&request("UTC", 8_640_000_000_000_000_000_001, 0)).0, 1);
    assert_eq!(call(&request("UTC", 0, 0)), (0, vec![0]));
}

#[test]
fn typed_zoned_parsing_preserves_fields_identity_and_optional_offsets() {
    let request = |value: &str| {
        let mut bytes = vec![opcode("parseZonedFields"), 10];
        text(&mut bytes, value);
        bytes
    };
    for (input, local, zone, identity, offset, calendar) in [
        (
            "1970-01-01T00:00[utc]",
            0i128,
            "utc",
            "UTC",
            None,
            "iso8601",
        ),
        (
            "1969-12-31T23:59:59.123456789-05:00[us/eastern][u-ca=gregory]",
            -876_543_211,
            "us/eastern",
            "US/Eastern",
            Some("-05:00"),
            "gregory",
        ),
        (
            "1970-01-01T00:00+05:41:16.123456789[Asia/Kathmandu]",
            0,
            "Asia/Kathmandu",
            "Asia/Kathmandu",
            Some("+05:41:16.123456789"),
            "iso8601",
        ),
        (
            "-271821-04-20T00:00Z[UTC]",
            -8_640_000_000_000_000_000_000,
            "UTC",
            "UTC",
            Some("Z"),
            "iso8601",
        ),
        (
            "+275760-09-13T00:00Z[UTC]",
            8_640_000_000_000_000_000_000,
            "UTC",
            "UTC",
            Some("Z"),
            "iso8601",
        ),
        (
            "1970-01-01T00:00[Invalid/Zone]",
            0,
            "Invalid/Zone",
            "",
            None,
            "iso8601",
        ),
    ] {
        let (status, result) = call(&request(input));
        assert_eq!(status, 0, "{input}");
        assert_eq!(result[0], 18);
        assert_eq!(
            i128::from_le_bytes(result[1..17].try_into().unwrap()),
            local
        );
        let fields = formatjs_temporal::IsoDateTime::from_epoch_nanoseconds(local).unwrap();
        assert_eq!(
            i32::from_le_bytes(result[17..21].try_into().unwrap()),
            fields.year
        );
        assert_eq!(
            &result[21..26],
            &[
                fields.month,
                fields.day,
                fields.hour,
                fields.minute,
                fields.second
            ]
        );
        for (index, expected) in [
            fields.nanosecond / 1_000_000,
            fields.nanosecond / 1000 % 1000,
            fields.nanosecond % 1000,
        ]
        .into_iter()
        .enumerate()
        {
            let start = 26 + index * 2;
            assert_eq!(
                u16::from_le_bytes(result[start..start + 2].try_into().unwrap()),
                expected as u16
            );
        }
        assert_eq!(result[32], u8::from(offset.is_some()));
        let mut cursor = 33;
        for expected in [calendar, zone, offset.unwrap_or(""), identity] {
            let length =
                u32::from_le_bytes(result[cursor..cursor + 4].try_into().unwrap()) as usize;
            cursor += 4;
            assert_eq!(&result[cursor..cursor + length], expected.as_bytes());
            cursor += length;
        }
        assert_eq!(cursor, result.len());
    }
    let valid = request("1970-01-01T00:00[UTC]");
    let before = call(&valid);
    let mut trailing = valid.clone();
    trailing.push(0);
    let mut invalid_utf8 = valid.clone();
    invalid_utf8[6] = 255;
    for invalid in [trailing, invalid_utf8, valid[..valid.len() - 1].to_vec()] {
        assert_eq!(call(&invalid).0, 2);
        assert_eq!(call(&valid), before);
    }
    assert_eq!(call(&request("invalid")).0, 1);
    assert_eq!(call(&valid), before);
}

#[test]
fn typed_zoned_resolution_preserves_offsets_and_recovers_from_bad_modes() {
    let request = |zone: &str, offset: &str, flags: u8| {
        let mut bytes = vec![opcode("resolveZonedDateTime"), 10];
        bytes.extend_from_slice(&0i128.to_le_bytes());
        bytes.extend_from_slice(&[0, 3, flags]);
        for value in [zone, "iso8601", offset] {
            text(&mut bytes, value);
        }
        bytes
    };
    for (zone, offset, flags, expected, expected_offset) in [
        ("UTC", "", 0, 0i128, 0i64),
        (
            "+05:45",
            "+05:45",
            4,
            -20_700_000_000_000,
            20_700_000_000_000,
        ),
        ("UTC", "Z", 4, 0, 0),
        ("UTC", "", 1, 0, 0),
    ] {
        let (status, result) = call(&request(zone, offset, flags));
        assert_eq!(status, 0);
        assert_eq!(result[0], 17);
        assert_eq!(
            i128::from_le_bytes(result[1..17].try_into().unwrap()),
            expected
        );
        assert_eq!(
            f64::from_le_bytes(result[17..25].try_into().unwrap()),
            expected_offset as f64
        );
        assert_eq!(f64::from_le_bytes(result[25..33].try_into().unwrap()), 24.0);
        let length = u32::from_le_bytes(result[33..37].try_into().unwrap()) as usize;
        assert_eq!(result[37 + length], 12);
        assert_eq!(
            i128::from_le_bytes(result[38 + length..54 + length].try_into().unwrap()),
            0
        );
        assert_eq!(result.len(), 85 + length);
    }
    let valid = request("UTC", "", 0);
    let before = call(&valid);
    for (index, value) in [(18, 4), (19, 4), (20, 8)] {
        let mut invalid = valid.clone();
        invalid[index] = value;
        assert_eq!(call(&invalid).0, 2);
        assert_eq!(call(&valid), before);
    }
    assert_eq!(call(&request("UTC", "+01:00", 0)).0, 2);
    assert_eq!(call(&request("UTC", "", 4)).0, 1);
    assert_eq!(call(&request("Invalid/Zone", "", 0)).0, 1);
    let mut trailing = valid.clone();
    trailing.push(0);
    assert_eq!(call(&trailing).0, 2);
    assert_eq!(call(&valid), before);
}

#[test]
fn typed_zoned_rounding_keeps_complete_results_and_error_recovery() {
    use formatjs_temporal::{Instant, RoundingMode, TimeZoneRegistry, ZonedDateTime, ZonedUnit};
    let request = |ns: i128, unit: u8, increment: u32, mode: u8, zone: &str, calendar: &str| {
        let mut bytes = vec![opcode("roundZonedDateTime"), 10];
        bytes.extend_from_slice(&ns.to_le_bytes());
        bytes.push(unit);
        bytes.extend_from_slice(&increment.to_le_bytes());
        bytes.push(mode);
        text(&mut bytes, zone);
        text(&mut bytes, calendar);
        bytes
    };
    for (zone, input) in [
        ("America/New_York", "2020-11-01T05:30Z"),
        ("Australia/Lord_Howe", "2020-10-03T15:45Z"),
        ("Pacific/Apia", "2011-12-30T10:30Z"),
        ("UTC", "-271821-04-20T00:00Z"),
        ("UTC", "+275760-09-13T00:00Z"),
    ] {
        let instant: Instant = input.parse().unwrap();
        let provider = TimeZoneRegistry::compiled().resolve(zone).unwrap();
        for (code, unit) in [(0, ZonedUnit::Hour), (6, ZonedUnit::Day)] {
            for (mode_code, mode) in [
                RoundingMode::Ceil,
                RoundingMode::Floor,
                RoundingMode::Expand,
                RoundingMode::Trunc,
                RoundingMode::HalfCeil,
                RoundingMode::HalfFloor,
                RoundingMode::HalfExpand,
                RoundingMode::HalfTrunc,
                RoundingMode::HalfEven,
            ]
            .into_iter()
            .enumerate()
            {
                for calendar in ["iso8601", "gregory"] {
                    let expected = ZonedDateTime::new(instant, provider).round(unit, 1, mode);
                    let (status, result) = call(&request(
                        instant.epoch_nanoseconds(),
                        code,
                        1,
                        mode_code as u8,
                        zone,
                        calendar,
                    ));
                    match expected {
                        Ok(value) => {
                            assert_eq!(status, 0, "{input} {mode:?}");
                            assert!(matches!(result[0], 16 | 17));
                            assert_eq!(
                                i128::from_le_bytes(result[1..17].try_into().unwrap()),
                                value.instant().epoch_nanoseconds()
                            );
                            assert!(result.len() > 17);
                        }
                        Err(_) => assert_eq!(status, 1),
                    }
                }
            }
        }
    }
    let valid = request(0, 0, 1, 6, "UTC", "iso8601");
    let before = call(&valid);
    for (index, value) in [(18, 7), (23, 9), (28, 255)] {
        let mut invalid = valid.clone();
        invalid[index] = value;
        assert_eq!(call(&invalid).0, 2);
        assert_eq!(call(&valid), before);
    }
    assert_eq!(call(&request(0, 0, 0, 6, "UTC", "iso8601")).0, 1);
    let mut trailing = valid.clone();
    trailing.push(0);
    assert_eq!(call(&trailing).0, 2);
    assert_eq!(call(&valid), before);
}

#[test]
fn typed_zoned_addition_and_day_start_preserve_boundaries_and_recovery() {
    use formatjs_temporal::{
        Duration, Instant, Overflow, PlainDate, TimeZoneRegistry, ZonedDateTime,
    };
    let addition = |ns: i128, fields: [f64; 10], subtract: u8| {
        let mut bytes = vec![opcode("addZonedDateTime"), 10];
        bytes.extend_from_slice(&ns.to_le_bytes());
        for value in fields {
            bytes.extend_from_slice(&value.to_le_bytes());
        }
        bytes.extend_from_slice(&[subtract, 0]);
        text(&mut bytes, "America/New_York");
        text(&mut bytes, "iso8601");
        bytes
    };
    let day_start = |ns: i128, day: Option<f64>| {
        let mut bytes = vec![opcode("startOfZonedDay"), 10];
        bytes.extend_from_slice(&ns.to_le_bytes());
        bytes.push(u8::from(day.is_some()));
        bytes.extend_from_slice(&day.unwrap_or(0.0).to_le_bytes());
        text(&mut bytes, "America/New_York");
        text(&mut bytes, "iso8601");
        bytes
    };
    let provider = TimeZoneRegistry::compiled()
        .resolve("America/New_York")
        .unwrap();
    for input in [
        "2024-03-10T16:30:00.123456789Z",
        "2024-11-03T06:30:00.123456789Z",
        "-271821-04-20T00:00Z",
        "+275760-09-13T00:00Z",
    ] {
        let instant: Instant = input.parse().unwrap();
        let value = ZonedDateTime::new(instant, provider);
        for fields in [
            [0, 1, 0, 1, 1, 0, 0, 0, 0, 1],
            [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, (1i128 << 70) + 1],
        ] {
            let duration = Duration::new(fields).unwrap();
            for subtract in [false, true] {
                let expected = if subtract {
                    value.checked_subtract(duration, Overflow::Constrain)
                } else {
                    value.checked_add(duration, Overflow::Constrain)
                };
                let actual = call(&addition(
                    instant.epoch_nanoseconds(),
                    fields.map(|v| v as f64),
                    u8::from(subtract),
                ));
                check(actual, expected.map(|v| v.instant()));
            }
        }
        for day in [None, Some(0), Some(19792)] {
            let expected = if let Some(day) = day {
                PlainDate::from_epoch_day(day)
                    .unwrap()
                    .to_zoned_date_time(provider, None)
            } else {
                value.start_of_day()
            };
            check(
                call(&day_start(
                    instant.epoch_nanoseconds(),
                    day.map(|v| v as f64),
                )),
                expected.map(|v| v.instant()),
            );
        }
    }
    let valid = addition(0, [0.0; 10], 0);
    let before = call(&valid);
    for (index, value) in [(98, 2), (99, 2), (104, 255)] {
        let mut invalid = valid.clone();
        invalid[index] = value;
        assert_eq!(call(&invalid).0, 2);
        assert_eq!(call(&valid), before);
    }
    assert_eq!(call(&addition(0, [f64::NAN; 10], 0)).0, 1);
    let mut bad_flag = day_start(0, None);
    bad_flag[18] = 2;
    assert_eq!(call(&bad_flag).0, 2);
    for day in [f64::NAN, 0.5, 1e30] {
        assert_eq!(call(&day_start(0, Some(day))).0, 1);
    }
    let mut trailing = day_start(0, None);
    trailing.push(0);
    assert_eq!(call(&trailing).0, 2);
    assert_eq!(call(&valid), before);
    fn check(
        (status, result): (u32, Vec<u8>),
        expected: Result<Instant, formatjs_temporal::Error>,
    ) {
        match expected {
            Ok(value) => {
                assert_eq!(status, 0);
                assert!(matches!(result[0], 16 | 17));
                assert_eq!(
                    i128::from_le_bytes(result[1..17].try_into().unwrap()),
                    value.epoch_nanoseconds()
                );
                assert!(result.len() > 17);
            }
            Err(_) => assert_eq!(status, 1),
        }
    }
}

#[test]
fn typed_duration_records_preserve_fields_number_rounding_and_recover() {
    use formatjs_temporal::Duration;
    let parse = |value: &str| {
        let mut bytes = vec![opcode("parseDuration"), 10];
        text(&mut bytes, value);
        bytes
    };
    for input in [
        "P0D",
        "-PT0S",
        "PT24H",
        "PT1.5H",
        "-PT0.000000001S",
        "P1Y2M3W4DT5H6M7.123456789S",
        "PT9007199254740991S",
    ] {
        check_duration(call(&parse(input)), input.parse::<Duration>());
    }
    let fields = [0, 0, 0, 1, 25, 0, 0, 0, 0, (1i128 << 70) + 1];
    let other = [0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    let one = Duration::new(fields).unwrap();
    let two = Duration::new(other).unwrap();
    let mut add = vec![opcode("addDuration"), 10];
    for value in fields.into_iter().chain(other) {
        add.extend_from_slice(&(value as f64).to_le_bytes());
    }
    add.push(0);
    check_duration(call(&add), one.checked_add(two));
    add[162] = 1;
    check_duration(call(&add), one.checked_subtract(two));
    add[162] = 2;
    assert_eq!(call(&add).0, 2);
    for input in [
        fields,
        fields.map(|v| -v),
        [0; 10],
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    ] {
        let value = Duration::new(input).unwrap();
        let mut bytes = vec![opcode("transformDuration"), 10];
        for field in input {
            bytes.extend_from_slice(&(field as f64).to_le_bytes());
        }
        bytes.push(0);
        check_duration(call(&bytes), Ok(value.negated()));
        bytes[82] = 1;
        check_duration(call(&bytes), Ok(value.abs()));
        bytes[82] = 2;
        assert_eq!(call(&bytes).0, 2);
    }
    let valid = parse("PT1.123456789S");
    let expected = call(&valid);
    let mut trailing = valid.clone();
    trailing.push(0);
    let mut invalid_utf8 = valid.clone();
    invalid_utf8[6] = 255;
    for invalid in [trailing, invalid_utf8, valid[..valid.len() - 1].to_vec()] {
        assert_eq!(call(&invalid).0, 2);
        assert_eq!(call(&valid), expected);
    }
    for invalid in ["PT", "P4294967296Y", "PT9007199254740992S", "PT1.5H1M"] {
        assert_eq!(call(&parse(invalid)).0, 1, "{invalid}");
        assert_eq!(call(&valid), expected);
    }
    let mut nonfinite = vec![opcode("transformDuration"), 10];
    for _ in 0..10 {
        nonfinite.extend_from_slice(&f64::NAN.to_le_bytes());
    }
    nonfinite.push(0);
    assert_eq!(call(&nonfinite).0, 1);
    assert_eq!(call(&valid), expected);
}
fn check_duration(
    (status, result): (u32, Vec<u8>),
    expected: Result<formatjs_temporal::Duration, formatjs_temporal::Error>,
) {
    let expected = expected.unwrap();
    assert_eq!(status, 0);
    assert_eq!(result.len(), 81);
    assert_eq!(result[0], 14);
    for (index, value) in expected.fields().into_iter().enumerate() {
        let start = 1 + index * 8;
        let actual = f64::from_le_bytes(result[start..start + 8].try_into().unwrap());
        assert_eq!(actual.to_bits(), (value as f64).to_bits());
    }
}

#[test]
fn typed_differences_match_public_rounding_and_recover() {
    use formatjs_temporal::{
        DateTimeUnit as U, Instant, PlainDate, PlainDateTime, PlainYearMonth, RoundingMode as R,
        TimeUnit, YearMonthUnit,
    };
    let units = [
        U::Year,
        U::Month,
        U::Week,
        U::Day,
        U::Hour,
        U::Minute,
        U::Second,
        U::Millisecond,
        U::Microsecond,
        U::Nanosecond,
    ];
    let modes = [
        R::Ceil,
        R::Floor,
        R::Expand,
        R::Trunc,
        R::HalfCeil,
        R::HalfFloor,
        R::HalfExpand,
        R::HalfTrunc,
        R::HalfEven,
    ];
    for operation in [
        "differencePlainYearMonth",
        "differencePlainDate",
        "differencePlainDateTime",
        "differenceInstant",
    ] {
        let days = operation == "differencePlainYearMonth" || operation == "differencePlainDate";
        let pairs: &[(usize, usize)] = match operation {
            "differencePlainYearMonth" => &[(0, 1), (1, 1)],
            "differencePlainDate" => &[(0, 3), (1, 3), (2, 3), (3, 3)],
            "differencePlainDateTime" => &[(0, 9), (3, 8), (4, 6)],
            _ => &[(4, 9), (6, 8), (9, 9)],
        };
        for &(largest, smallest) in pairs {
            for (mode, kind) in modes.into_iter().enumerate() {
                for since in [false, true] {
                    for reverse in [false, true] {
                        let (one, other) = if days {
                            (11016i128, 20148i128)
                        } else {
                            (-86_400_000_000_001, 86_400_000_000_001)
                        };
                        let (one, other) = if reverse { (other, one) } else { (one, other) };
                        let mut bytes = vec![opcode(operation), 10];
                        for value in [one, other] {
                            if days {
                                bytes.extend_from_slice(&(value as f64).to_le_bytes());
                            } else {
                                bytes.extend_from_slice(&value.to_le_bytes());
                            }
                        }
                        bytes.extend_from_slice(&[largest as u8, smallest as u8]);
                        bytes.extend_from_slice(&1u32.to_le_bytes());
                        bytes.extend_from_slice(&[mode as u8, u8::from(since)]);
                        if operation != "differenceInstant" {
                            text(&mut bytes, "iso8601");
                        }
                        if operation == "differencePlainYearMonth" {
                            text(&mut bytes, "iso8601");
                        }
                        let expected = match operation {
                            "differencePlainYearMonth" => {
                                let one = PlainYearMonth::from_epoch_day_in(
                                    one as i64,
                                    formatjs_temporal::calendar::Calendar::Iso8601,
                                )
                                .unwrap();
                                let other = PlainYearMonth::from_epoch_day_in(
                                    other as i64,
                                    formatjs_temporal::calendar::Calendar::Iso8601,
                                )
                                .unwrap();
                                let largest = if largest == 0 {
                                    YearMonthUnit::Year
                                } else {
                                    YearMonthUnit::Month
                                };
                                if since {
                                    one.since(other, largest, YearMonthUnit::Month, 1, kind)
                                } else {
                                    one.until(other, largest, YearMonthUnit::Month, 1, kind)
                                }
                            }
                            "differencePlainDate" => {
                                let one = PlainDate::from_epoch_day(one as i64).unwrap();
                                let other = PlainDate::from_epoch_day(other as i64).unwrap();
                                if since {
                                    one.since(other, units[largest], units[smallest], 1, kind)
                                } else {
                                    one.until(other, units[largest], units[smallest], 1, kind)
                                }
                            }
                            "differencePlainDateTime" => {
                                let one = PlainDateTime::from_epoch_nanoseconds(one).unwrap();
                                let other = PlainDateTime::from_epoch_nanoseconds(other).unwrap();
                                if since {
                                    one.since(other, units[largest], units[smallest], 1, kind)
                                } else {
                                    one.until(other, units[largest], units[smallest], 1, kind)
                                }
                            }
                            _ => {
                                let time = [
                                    TimeUnit::Hour,
                                    TimeUnit::Minute,
                                    TimeUnit::Second,
                                    TimeUnit::Millisecond,
                                    TimeUnit::Microsecond,
                                    TimeUnit::Nanosecond,
                                ];
                                let one = Instant::from_epoch_nanoseconds(one).unwrap();
                                let other = Instant::from_epoch_nanoseconds(other).unwrap();
                                if since {
                                    one.since(other, time[largest - 4], time[smallest - 4], 1, kind)
                                } else {
                                    one.until(other, time[largest - 4], time[smallest - 4], 1, kind)
                                }
                            }
                        };
                        check_duration(call(&bytes), expected);
                        let valid = call(&bytes);
                        if days {
                            for value in [f64::NAN, f64::INFINITY, 0.5, f64::MAX] {
                                let mut bad = bytes.clone();
                                bad[2..10].copy_from_slice(&value.to_le_bytes());
                                assert_eq!(call(&bad).0, 1);
                            }
                        } else {
                            let mut bad = bytes.clone();
                            bad[2..18].copy_from_slice(&i128::MIN.to_le_bytes());
                            assert_eq!(call(&bad).0, 1);
                        }
                        if operation != "differenceInstant" {
                            let calendar = if days { 30 } else { 46 };
                            let mut bad = bytes.clone();
                            bad[calendar] = 255;
                            assert_eq!(call(&bad).0, 2);
                            bad[calendar] = b'x';
                            assert_eq!(call(&bad).0, 1);
                        }
                        assert_eq!(call(&bytes), valid);
                        let options = if days { 18 } else { 34 };
                        for (offset, invalid) in [(options, 10), (options + 6, 9), (options + 7, 2)]
                        {
                            let mut bad = bytes.clone();
                            bad[offset] = invalid;
                            assert_eq!(call(&bad).0, 2);
                            assert_eq!(call(&bytes), valid);
                        }
                        assert_eq!(call(&bytes[..bytes.len() - 1]).0, 2);
                        let mut trailing = bytes.clone();
                        trailing.push(0);
                        assert_eq!(call(&trailing).0, 2);
                        let mut increment = bytes.clone();
                        increment[options + 2..options + 6].copy_from_slice(&0u32.to_le_bytes());
                        assert_eq!(call(&increment).0, 1);
                        assert_eq!(call(&bytes), valid);
                    }
                }
            }
        }
    }
}

#[test]
fn typed_zoned_formatting_matches_public_options_and_recovers() {
    use formatjs_temporal::{
        CalendarName as C, Precision as P, RoundingMode as R, TimeZoneName as Z, TimeZoneRegistry,
        ZonedDateTime, ZonedFormatOptions, ZonedParseOptions,
    };
    let modes = [
        R::Ceil,
        R::Floor,
        R::Expand,
        R::Trunc,
        R::HalfCeil,
        R::HalfFloor,
        R::HalfExpand,
        R::HalfTrunc,
        R::HalfEven,
    ];
    let calendars = [C::Auto, C::Always, C::Never, C::Critical];
    let names = [Z::Auto, Z::Never, Z::Critical];
    let request = |ns: i128,
                   precision: u8,
                   mode: u8,
                   name: u8,
                   offset: bool,
                   zone_name: u8,
                   zone: &str,
                   calendar: &str| {
        let mut bytes = vec![opcode("formatZonedDateTime"), 10];
        bytes.extend_from_slice(&ns.to_le_bytes());
        bytes.extend_from_slice(&[precision, mode, name, u8::from(offset), zone_name]);
        text(&mut bytes, zone);
        text(&mut bytes, calendar);
        bytes
    };
    for source in [
        "2020-03-08T06:59:59.999999999Z[America/New_York]",
        "2020-11-01T05:59:59.999999999Z[America/New_York]",
        "1900-01-01T00:00Z[Europe/Paris]",
        "1969-12-31T23:59:59.999999999Z[UTC]",
        "2020-01-01T12:34:56.123456789+05:30[+05:30]",
        "2020-01-01T12:34:56.123456789+01:00[Europe/Paris][u-ca=hebrew]",
        "+275760-09-13T00:00Z[UTC]",
        "-271821-04-20T00:00Z[UTC]",
    ] {
        let value = ZonedDateTime::parse(
            source,
            TimeZoneRegistry::compiled(),
            ZonedParseOptions::default(),
        )
        .unwrap();
        for precision in [255, 254, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9] {
            let kind = match precision {
                255 => P::Auto,
                254 => P::Minute,
                n => P::Digits(n),
            };
            for (mode, rounding_mode) in modes.into_iter().enumerate() {
                for (name, calendar_name) in calendars.into_iter().enumerate() {
                    for (zone_name, time_zone_name) in names.into_iter().enumerate() {
                        for offset in [false, true] {
                            let bytes = request(
                                value.instant().epoch_nanoseconds(),
                                precision,
                                mode as u8,
                                name as u8,
                                offset,
                                zone_name as u8,
                                value.time_zone().identifier(),
                                value.calendar_id(),
                            );
                            let (status, result) = call(&bytes);
                            match value.format(ZonedFormatOptions {
                                precision: kind,
                                rounding_mode,
                                calendar_name,
                                offset,
                                time_zone_name,
                            }) {
                                Ok(expected) => {
                                    let expected = expected.to_string();
                                    assert_eq!(status, 0);
                                    assert_eq!(result[0], 4);
                                    assert_eq!(
                                        u32::from_le_bytes(result[1..5].try_into().unwrap())
                                            as usize,
                                        expected.len()
                                    );
                                    assert_eq!(&result[5..], expected.as_bytes());
                                }
                                Err(_) => assert_eq!(status, 1),
                            }
                        }
                    }
                }
            }
        }
    }
    let valid = request(-1, 255, 3, 0, true, 0, "UTC", "iso8601");
    let expected = call(&valid);
    for (offset, byte) in [(19, 9), (20, 4), (21, 2), (22, 3), (27, 255)] {
        let mut bad = valid.clone();
        bad[offset] = byte;
        assert_eq!(call(&bad).0, 2);
        assert_eq!(call(&valid), expected);
    }
    let mut bad_precision = valid.clone();
    bad_precision[18] = 10;
    let mut bad_zone = valid.clone();
    bad_zone[27] = b'X';
    let mut bad_calendar = valid.clone();
    bad_calendar[34] = b'X';
    let mut bad_ns = valid.clone();
    bad_ns[2..18].copy_from_slice(&i128::MIN.to_le_bytes());
    for bad in [bad_precision, bad_zone, bad_calendar, bad_ns] {
        assert_eq!(call(&bad).0, 1);
        assert_eq!(call(&valid), expected);
    }
    let mut trailing = valid.clone();
    trailing.push(0);
    for bad in [trailing, valid[..valid.len() - 1].to_vec()] {
        assert_eq!(call(&bad).0, 2);
        assert_eq!(call(&valid), expected);
    }
}

#[test]
fn typed_calendar_formats_accept_interned_and_utf8_ids() {
    use formatjs_temporal::{
        CalendarName, CalendarProvider, CalendarRegistry, PlainDate, PlainDateTime, PlainMonthDay,
        PlainYearMonth, Precision, RoundingMode,
    };
    let registry = CalendarRegistry::compiled().unwrap();
    for calendar in registry.calendars() {
        let identifier = calendar.id();
        let code = binary::STRINGS
            .iter()
            .position(|id| *id == identifier)
            .unwrap() as u16;
        for epoch in [-1i64, 0, 19792] {
            for (name, calendar_name) in [
                CalendarName::Auto,
                CalendarName::Always,
                CalendarName::Never,
                CalendarName::Critical,
            ]
            .into_iter()
            .enumerate()
            {
                for operation in [
                    "formatPlainDate",
                    "formatPlainYearMonth",
                    "formatPlainMonthDay",
                    "formatPlainDateTime",
                ] {
                    let mut bytes = vec![opcode(operation), 10];
                    let expected = if operation == "formatPlainDateTime" {
                        let ns = i128::from(epoch) * 86_400_000_000_000 + 45_296_123_456_789;
                        bytes.extend_from_slice(&ns.to_le_bytes());
                        bytes.extend_from_slice(&[6, 3, name as u8]);
                        PlainDateTime::from_epoch_nanoseconds_in(ns, calendar)
                            .unwrap()
                            .format(Precision::Digits(6), RoundingMode::Trunc)
                            .unwrap()
                            .with_calendar_name(calendar_name)
                            .to_string()
                    } else {
                        bytes.extend_from_slice(&(epoch as f64).to_le_bytes());
                        bytes.push(name as u8);
                        match operation {
                            "formatPlainDate" => PlainDate::from_epoch_day_in(epoch, calendar)
                                .unwrap()
                                .format(calendar_name)
                                .to_string(),
                            "formatPlainYearMonth" => {
                                PlainYearMonth::from_epoch_day_in(epoch, calendar)
                                    .unwrap()
                                    .format(calendar_name)
                                    .to_string()
                            }
                            _ => PlainMonthDay::from_epoch_day_in(epoch, calendar)
                                .unwrap()
                                .format(calendar_name)
                                .to_string(),
                        }
                    };
                    let mut utf8 = bytes.clone();
                    utf8.extend_from_slice(&u16::MAX.to_le_bytes());
                    text(&mut utf8, identifier);
                    let mut interned = bytes.clone();
                    interned.extend_from_slice(&code.to_le_bytes());
                    assert_eq!(call(&interned), call(&utf8));
                    let (status, result) = call(&interned);
                    assert_eq!(status, 0);
                    assert_eq!(result[0], 4);
                    assert_eq!(
                        u32::from_le_bytes(result[1..5].try_into().unwrap()) as usize,
                        expected.len()
                    );
                    assert_eq!(&result[5..], expected.as_bytes());
                    for bad_code in [65534u16, 0] {
                        let mut bad = bytes.clone();
                        bad.extend_from_slice(&bad_code.to_le_bytes());
                        assert_eq!(call(&bad).0, if bad_code == 0 { 1 } else { 2 });
                    }
                    let mut malformed = bytes.clone();
                    malformed.extend_from_slice(&u16::MAX.to_le_bytes());
                    malformed.extend_from_slice(&1u32.to_le_bytes());
                    malformed.push(255);
                    assert_eq!(call(&malformed).0, 2);
                    let mut unknown = bytes.clone();
                    unknown.extend_from_slice(&u16::MAX.to_le_bytes());
                    text(&mut unknown, "unknown");
                    assert_eq!(call(&unknown).0, 1);
                    assert_eq!(call(&interned).0, 0);
                    assert_eq!(call(&interned[..interned.len() - 1]).0, 2);
                }
            }
        }
    }
}

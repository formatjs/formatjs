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
        let mut expected = vec![10];
        expected.extend_from_slice(&nanoseconds.to_le_bytes());
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
            let mut output = vec![10];
            output.extend_from_slice(&expected.to_le_bytes());
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

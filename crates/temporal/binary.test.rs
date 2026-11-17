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

use formatjs_temporal::ffi::{
    TemporalBytes, formatjs_temporal_bytes_free, formatjs_temporal_query,
};
use serde_json::{Value, json};
use std::{ptr, slice};

fn query(source: &[u8]) -> Result<Value, i32> {
    let mut output = TemporalBytes {
        data: ptr::null_mut(),
        len: 0,
    };
    let status = unsafe { formatjs_temporal_query(source.as_ptr(), source.len(), &mut output) };
    if status != 0 {
        assert!(output.data.is_null());
        assert_eq!(output.len, 0);
        return Err(status);
    }
    let value =
        serde_json::from_slice(unsafe { slice::from_raw_parts(output.data, output.len) }).unwrap();
    unsafe { formatjs_temporal_bytes_free(output) };
    Ok(value)
}

#[test]
fn errors_leave_no_owned_output() {
    for input in [&b"\xff"[..], b"{", b"{}", br#"{"op":"unknown"}"#] {
        assert_eq!(query(input), Err(2));
    }
    for input in [
        json!({"op":"isoToEpochNanoseconds","fields":{"year":2021,"month":2,"day":29}}),
        json!({"op":"isoToEpochNanoseconds","fields":{"year":1970,"month":1,"day":1,"nanosecond":1000}}),
        json!({"op":"epochNanosecondsToISO","nanoseconds":"170141183460469231731687303715884105728"}),
        json!({"op":"addISODays","fields":{"year":1970,"month":1,"day":1},"days":0.5}),
        json!({"op":"parseInstant","text":"2021-02-29T00:00Z"}),
        json!({"op":"formatInstant","nanoseconds":"0","precision":10}),
        json!({"op":"formatInstant","nanoseconds":"0","precision":"auto","offset":"86400000000000"}),
        json!({"op":"roundInstant","nanoseconds":"0","quantum":"0","mode":"ceil"}),
        json!({"op":"roundInstant","nanoseconds":"0","quantum":"7","mode":"ceil"}),
        json!({"op":"roundInstant","nanoseconds":"0","quantum":"1","mode":"invalid"}),
        json!({"op":"differenceInstant","nanoseconds":"0","other":"1","largest":"second","smallest":"hour","increment":1,"mode":"trunc"}),
        json!({"op":"addInstant","nanoseconds":"0","duration":{},"subtract":false}),
    ] {
        assert_eq!(query(input.to_string().as_bytes()), Err(1));
    }
    unsafe {
        assert_eq!(formatjs_temporal_query(ptr::null(), 1, ptr::null_mut()), 2);
        let mut output = TemporalBytes {
            data: ptr::dangling_mut(),
            len: 42,
        };
        assert_eq!(formatjs_temporal_query(ptr::null(), 1, &mut output), 2);
        assert!(output.data.is_null());
        assert_eq!(output.len, 0);
        formatjs_temporal_bytes_free(output);
    }
}

#[test]
fn independent_icu_fields_cross_ffi_in_both_directions() {
    let mut count = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_ISO"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let row: Vec<i64> = line
            .split('\t')
            .map(|value| value.parse().unwrap())
            .collect();
        let epoch = (i128::from(row[0]) * 1_000_000).to_string();
        let fields = json!({"year":row[1],"month":row[2],"day":row[3],"hour":row[4],"minute":row[5],"second":row[6],"millisecond":row[7],"microsecond":0,"nanosecond":0});
        assert_eq!(
            query(
                json!({"op":"epochNanosecondsToISO","nanoseconds":epoch})
                    .to_string()
                    .as_bytes()
            ),
            Ok(fields.clone()),
            "{line}"
        );
        assert_eq!(
            query(
                json!({"op":"isoToEpochNanoseconds","fields":fields})
                    .to_string()
                    .as_bytes()
            ),
            Ok(json!(epoch)),
            "{line}"
        );
        count += 1;
    }
    assert!(count > 25_000);
}

#[test]
fn day_arithmetic_preserves_fraction_and_crosses_year_zero() {
    assert_eq!(query(br#"{"op":"addISODays","fields":{"year":0,"month":1,"day":1,"nanosecond":1},"days":-1}"#),Ok(json!({"year":-1,"month":12,"day":31,"hour":0,"minute":0,"second":0,"millisecond":0,"microsecond":0,"nanosecond":1})));
}

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
        json!({"op":"parsePlainTime","text":"24:00"}),
        json!({"op":"formatPlainTime","nanoseconds":"86400000000000","precision":"auto","mode":"trunc"}),
        json!({"op":"roundPlainTime","nanoseconds":"0","unit":"hour","increment":24,"mode":"halfExpand"}),
        json!({"op":"regulatePlainTime","fields":{"hour":1e100,"minute":0,"second":0,"millisecond":0,"microsecond":0,"nanosecond":0},"constrain":false}),
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
fn time_rounding_preserves_carry_and_regulation_clamps_before_narrowing() {
    assert_eq!(query(br#"{"op":"roundPlainTime","nanoseconds":"86399999999999","unit":"hour","increment":1,"mode":"ceil"}"#),Ok(json!("86400000000000")));
    assert_eq!(query(br#"{"op":"regulatePlainTime","fields":{"hour":1e100,"minute":-1e100,"second":0,"millisecond":0,"microsecond":0,"nanosecond":0},"constrain":true}"#),Ok(json!("82800000000000")));
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

#[test]
fn calendar_fields_keep_extended_coordinates_and_clamp_before_narrowing() {
    let request = |value: Value| query(value.to_string().as_bytes());
    let extreme = json!({"op":"calendarFromEpochDay","calendar":"chinese","epoch":-110000000});
    let fields = request(extreme).unwrap();
    assert_eq!(
        request(
            json!({"op":"calendarToEpochDay","calendar":"chinese","fields":fields,"overflow":"reject"})
        ),
        Ok(json!(-110000000))
    );
    assert_eq!(
        request(
            json!({"op":"calendarToEpochDay","calendar":"iso8601","fields":{"year":2024,"month":9007199254740991i64,"day":9007199254740991i64},"overflow":"constrain"})
        ),
        Ok(json!(20088))
    );
    assert_eq!(
        request(
            json!({"op":"calendarToEpochDay","calendar":"hebrew","fields":{"year":5784,"monthCode":"M05L","day":1},"overflow":"reject"})
        ),
        Ok(json!(19763))
    );
    for value in [
        json!({"op":"calendarToEpochDay","calendar":"hebrew","fields":{"year":5783,"monthCode":"M05L","day":1},"overflow":"reject"}),
        json!({"op":"calendarToEpochDay","calendar":"hebrew","fields":{"year":5784,"month":6,"monthCode":"M06","day":1},"overflow":"reject"}),
        json!({"op":"calendarToEpochDay","calendar":"iso8601","fields":{"year":2024,"monthCode":"M00","day":1},"overflow":"reject"}),
        json!({"op":"calendarToEpochDay","calendar":"iso8601","fields":{"year":2024,"monthCode":"M1","day":1},"overflow":"reject"}),
        json!({"op":"calendarToEpochDay","calendar":"iso8601","fields":{"year":2024,"month":1,"day":1},"overflow":"bad"}),
        json!({"op":"calendarAdd","calendar":"iso8601","fields":{"year":2024,"month":1,"day":1},"duration":{"years":1,"days":-1},"overflow":"constrain"}),
        json!({"op":"calendarFromEpochDay","calendar":"iso8601","epoch":110000001}),
    ] {
        assert_eq!(request(value), Err(1));
    }
}

#[test]
fn named_zones_keep_identity_candidates_and_strict_transition_boundaries() {
    let request = |value: Value| query(value.to_string().as_bytes());
    assert_eq!(
        request(json!({"op":"timeZoneIdentity","identifier":"us/eastern"})),
        Ok(json!({"identifier":"US/Eastern","primary":"America/New_York"}))
    );
    let fields = json!({"year":2020,"month":11,"day":1,"hour":1,"minute":30,"nanosecond":123});
    assert_eq!(
        request(
            json!({"op":"timeZonePossibleInstants","identifier":"America/New_York","fields":fields})
        ),
        Ok(json!(["1604208600000000123", "1604212200000000123"]))
    );
    let gap = json!({"year":2020,"month":3,"day":8,"hour":2,"minute":30});
    assert_eq!(
        request(
            json!({"op":"timeZonePossibleInstants","identifier":"America/New_York","fields":gap})
        ),
        Ok(json!([]))
    );
    for (mode, expected) in [
        ("earlier", "1583649000000000000"),
        ("later", "1583652600000000000"),
        ("compatible", "1583652600000000000"),
    ] {
        assert_eq!(
            request(
                json!({"op":"timeZoneResolve","identifier":"America/New_York","fields":gap,"disambiguation":mode})
            ),
            Ok(json!(expected))
        );
    }
    assert_eq!(
        request(
            json!({"op":"timeZoneTransition","identifier":"America/New_York","nanoseconds":"1604210400000000000","direction":"previous"})
        ),
        Ok(json!("1583650800000000000"))
    );
    assert_eq!(
        request(
            json!({"op":"timeZoneTransition","identifier":"America/New_York","nanoseconds":"1604210400000000000","direction":"next"})
        ),
        Ok(json!("1615705200000000000"))
    );
    assert_eq!(
        request(json!({"op":"timeZoneOffset","identifier":"+05:45","nanoseconds":"0"})),
        Ok(json!("20700000000000"))
    );
    assert_eq!(
        request(
            json!({"op":"timeZonePossibleInstants","identifier":"UTC","fields":{"year":1970,"month":1,"day":1}})
        ),
        Ok(json!(["0"]))
    );
    for value in [
        json!({"op":"timeZoneResolve","identifier":"America/New_York","fields":gap,"disambiguation":"reject"}),
        json!({"op":"timeZoneResolve","identifier":"UTC","fields":fields,"disambiguation":"bad"}),
        json!({"op":"timeZoneTransition","identifier":"UTC","nanoseconds":"0","direction":"bad"}),
        json!({"op":"timeZoneOffset","identifier":"UTC","nanoseconds":"8640000000000000000001"}),
        json!({"op":"timeZoneIdentity","identifier":"+24:00"}),
        json!({"op":"timeZoneIdentity","identifier":"Missing/Zone"}),
    ] {
        assert_eq!(request(value), Err(1));
    }
}

#[test]
fn duration_day_rounding_has_no_instant_anchor_limit() {
    let fields = |days: &str| json!({"years":"0","months":"0","weeks":"0","days":days,"hours":"0","minutes":"0","seconds":"0","milliseconds":"0","microseconds":"0","nanoseconds":"0"});
    let request = |value: Value| query(value.to_string().as_bytes());
    for (days, expected) in [
        ("5", 4),
        ("7", 8),
        ("-5", -4),
        ("-7", -8),
        ("1000000000", 1000000000),
    ] {
        let result = request(json!({"op":"roundDuration","duration":fields(days),"largest":"day","smallest":"day","increment":2,"mode":"halfEven"})).unwrap();
        assert_eq!(result["days"].as_f64(), Some(f64::from(expected)));
    }
    assert_eq!(
        request(
            json!({"op":"formatDuration","duration":fields("1000000000"),"precision":"auto","mode":"trunc"})
        ),
        Ok(json!("P1000000000D"))
    );
    assert_eq!(
        request(json!({"op":"totalDuration","duration":fields("1000000000"),"unit":"day"})),
        Ok(json!(1000000000.0))
    );
    assert_eq!(
        request(
            json!({"op":"totalDuration","duration":fields("1000000000"),"unit":"day","relative":{"kind":"date","epochDay":0,"calendar":"iso8601"}})
        ),
        Err(1)
    );
    for value in [
        json!({"op":"roundDuration","duration":fields("1"),"largest":"day","smallest":"day","increment":0,"mode":"trunc"}),
        json!({"op":"roundDuration","duration":fields("1"),"largest":"day","smallest":"month","increment":1,"mode":"trunc"}),
        json!({"op":"totalDuration","duration":fields("1"),"unit":"year"}),
        json!({"op":"totalDuration","duration":fields("1"),"unit":"day","relative":{"kind":"date","epochDay":0,"calendar":"unknown"}}),
        json!({"op":"totalDuration","duration":fields("1"),"unit":"day","relative":{"kind":"zoned","nanoseconds":"0","calendar":"iso8601","identifier":"Unknown/Zone"}}),
    ] {
        assert_eq!(request(value), Err(1));
    }
}

#[test]
fn plain_arithmetic_preserves_date_bounds_clock_carry_and_rejects_invalid_options() {
    let request = |value: Value| query(value.to_string().as_bytes());
    let duration = |nanoseconds: &str| json!({"years":"0","months":"0","weeks":"0","days":"0","hours":"0","minutes":"0","seconds":"0","milliseconds":"0","microseconds":"0","nanoseconds":nanoseconds});
    assert_eq!(
        request(
            json!({"op":"addPlainDate","epochDay":-100000001,"calendar":"iso8601","duration":duration("0"),"subtract":false,"overflow":"reject"})
        ),
        Ok(json!(-100000001))
    );
    let difference = request(json!({"op":"differencePlainDate","epochDay":-100000001,"other":-100000000,"calendar":"iso8601","largest":"day","smallest":"day","increment":1,"mode":"trunc","since":false})).unwrap();
    assert_eq!(difference["days"].as_f64(), Some(1.0));
    assert_eq!(
        request(
            json!({"op":"addPlainDateTime","nanoseconds":"0","calendar":"iso8601","duration":duration("1"),"subtract":true,"overflow":"reject"})
        ),
        Ok(json!("-1"))
    );
    assert_eq!(
        request(
            json!({"op":"roundPlainDateTime","nanoseconds":"-1","calendar":"iso8601","unit":"second","increment":1,"mode":"ceil"})
        ),
        Ok(json!("0"))
    );
    for input in [
        json!({"op":"addPlainDate","epochDay":-100000001,"calendar":"iso8601","duration":duration("86400000000000"),"subtract":true,"overflow":"reject"}),
        json!({"op":"addPlainDateTime","nanoseconds":"-8640000086400000000000","calendar":"iso8601","duration":duration("0"),"subtract":false,"overflow":"reject"}),
        json!({"op":"roundPlainDateTime","nanoseconds":"0","calendar":"iso8601","unit":"day","increment":2,"mode":"ceil"}),
        json!({"op":"roundPlainDateTime","nanoseconds":"0","calendar":"iso8601","unit":"hour","increment":24,"mode":"ceil"}),
        json!({"op":"differencePlainDate","epochDay":0,"other":1,"calendar":"iso8601","largest":"hour","smallest":"hour","increment":1,"mode":"trunc","since":false}),
        json!({"op":"differencePlainDateTime","nanoseconds":"0","other":"1","calendar":"iso8601","largest":"second","smallest":"hour","increment":1,"mode":"trunc","since":false}),
        json!({"op":"addPlainDateTime","nanoseconds":"0","calendar":"unknown","duration":duration("1"),"subtract":false,"overflow":"reject"}),
    ] {
        assert_eq!(request(input), Err(1));
    }
}

#[test]
fn zoned_arithmetic_uses_alias_identity_dst_days_and_strict_day_boundaries() {
    let request = |value: Value| query(value.to_string().as_bytes());
    let value = json!({"nanoseconds":"1583600400000000000","identifier":"America/New_York","calendar":"iso8601"});
    let next =
        json!({"nanoseconds":"1583683200000000000","identifier":"US/Eastern","calendar":"iso8601"});
    let duration = json!({"years":"0","months":"0","weeks":"0","days":"1","hours":"0","minutes":"0","seconds":"0","milliseconds":"0","microseconds":"0","nanoseconds":"0"});
    assert_eq!(
        request(
            json!({"op":"addZonedDateTime","value":value,"duration":duration,"subtract":false,"overflow":"reject"})
        ),
        Ok(json!("1583683200000000000"))
    );
    let difference = request(json!({"op":"differenceZonedDateTime","value":value,"other":next,"largest":"day","smallest":"day","increment":1,"mode":"trunc","since":false})).unwrap();
    assert_eq!(difference["days"].as_f64(), Some(1.0));
    assert_eq!(
        request(json!({"op":"hoursInZonedDay","value":next}))
            .unwrap()
            .as_f64(),
        Some(23.0)
    );
    assert_eq!(
        request(json!({"op":"startOfZonedDay","value":next})),
        Ok(json!("1583643600000000000"))
    );
    assert_eq!(
        request(json!({"op":"startOfZonedDay","value":value,"day":18329})),
        Ok(json!("1583643600000000000"))
    );
    assert_eq!(
        request(
            json!({"op":"roundZonedDateTime","value":value,"unit":"day","increment":1,"mode":"ceil"})
        ),
        Ok(json!("1583643600000000000"))
    );
    let other =
        json!({"nanoseconds":"1583683200000000000","identifier":"UTC","calendar":"iso8601"});
    let elapsed = request(json!({"op":"differenceZonedDateTime","value":value,"other":other,"largest":"hour","smallest":"hour","increment":1,"mode":"trunc","since":false})).unwrap();
    assert_eq!(elapsed["hours"].as_f64(), Some(23.0));
    for input in [
        json!({"op":"differenceZonedDateTime","value":value,"other":other,"largest":"day","smallest":"day","increment":1,"mode":"trunc","since":false}),
        json!({"op":"roundZonedDateTime","value":value,"unit":"day","increment":2,"mode":"ceil"}),
        json!({"op":"roundZonedDateTime","value":value,"unit":"hour","increment":24,"mode":"ceil"}),
        json!({"op":"startOfZonedDay","value":value,"day":100000001}),
        json!({"op":"hoursInZonedDay","value":{"nanoseconds":"0","identifier":"Unknown/Zone","calendar":"iso8601"}}),
    ] {
        assert_eq!(request(input), Err(1));
    }
}

#[test]
fn string_parsers_preserve_short_date_bounds_and_offset_precision() {
    let request = |value: Value| query(value.to_string().as_bytes());
    let date = request(json!({"op":"parsePlainDate","text":"-271821-04-19T23:59:59"})).unwrap();
    assert_eq!(date["epochDay"].as_i64(), Some(-100000001));
    assert_eq!(
        request(json!({"op":"parsePlainDateTime","text":"1970-01-01T00:00+05:45"})).unwrap()["epochNanoseconds"],
        json!("0")
    );
    assert_eq!(
        request(json!({"op":"parsePlainYearMonth","text":"-271821-04"})).unwrap()["epochDay"]
            .as_i64(),
        Some(-100000019)
    );
    assert_eq!(
        request(json!({"op":"parsePlainMonthDay","text":"-999999-02-28"})).unwrap()["epochDay"]
            .as_i64(),
        Some(788)
    );
    assert_eq!(
        request(json!({"op":"parseZonedFields","text":"1900-01-01T00:00+00:09[Europe/Paris]"}))
            .unwrap()["offset"],
        json!("+00:09")
    );
    assert_eq!(
        request(json!({"op":"parseZonedFields","text":"1900-01-01T00:00+00:09:00[Europe/Paris]"}))
            .unwrap()["offset"],
        json!("+00:09:00.000000000")
    );
    assert_eq!(
        request(json!({"op":"parseZonedFields","text":"1970-01-01T00:00[UTC]"})).unwrap()["offset"],
        Value::Null
    );
    let mut resolve = json!({"op":"resolveZonedDateTime","nanoseconds":"-2208988800000000000","identifier":"Europe/Paris","calendar":"iso8601","offset":"+00:09","behavior":"reject","disambiguation":"compatible","matchMinute":true,"dateOnly":false});
    assert_eq!(request(resolve.clone()), Ok(json!("-2208989361000000000")));
    resolve["matchMinute"] = json!(false);
    assert_eq!(request(resolve.clone()), Err(1));
    resolve["behavior"] = json!("use");
    assert_eq!(request(resolve.clone()), Ok(json!("-2208989340000000000")));
    for (op, text) in [
        ("parsePlainDate", "2021-02-29"),
        ("parsePlainDateTime", "2020-01-01T00:00Z"),
        ("parsePlainYearMonth", "2020-01[u-ca=hebrew]"),
        ("parsePlainMonthDay", "2021-02-29"),
        ("parseZonedFields", "2020-01-01T00:00[foo=bar]"),
    ] {
        assert_eq!(request(json!({"op":op,"text":text})), Err(1));
    }
}

#[test]
fn date_output_validates_options_and_constrains_before_narrowing() {
    let request = |value: Value| query(value.to_string().as_bytes());
    let value = request(json!({"op":"parsePlainYearMonth","text":"2020-02"})).unwrap();
    let day = request(json!({"op":"yearMonthToDate","value":value,"day":1e100})).unwrap();
    assert_eq!(
        request(
            json!({"op":"formatPlainDate","value":{"epochDay":day,"calendar":"iso8601"},"calendarName":"critical"})
        ),
        Ok(json!("2020-02-29[!u-ca=iso8601]"))
    );
    for input in [
        json!({"op":"yearMonthToDate","value":value,"day":0}),
        json!({"op":"yearMonthToDate","value":value,"day":1.5}),
        json!({"op":"formatPlainYearMonth","value":value,"calendarName":"invalid"}),
        json!({"op":"formatPlainDateTime","nanoseconds":"0","calendar":"iso8601","calendarName":"auto","precision":10,"mode":"trunc"}),
        json!({"op":"differencePlainYearMonth","value":value,"other":value,"largest":"month","smallest":"year","increment":1,"mode":"trunc","since":false}),
    ] {
        assert_eq!(request(input), Err(1));
    }
}

#[test]
fn complete_clock_requests_keep_legacy_rounding_responses_unchanged() {
    let legacy = json!({"op":"roundPlainTime","nanoseconds":"86399999999999","unit":"hour","increment":1,"mode":"ceil"});
    assert_eq!(
        query(legacy.to_string().as_bytes()),
        Ok(json!("86400000000000"))
    );
    let mut complete = legacy;
    complete["clockSnapshot"] = json!(true);
    assert_eq!(
        query(complete.to_string().as_bytes()),
        Ok(json!({"nanoseconds":"0","fields":[0,0,0,0,0,0]}))
    );
    let request = json!({"op":"parsePlainTime","text":"23:59:59.999999999","clockSnapshot":true});
    assert_eq!(
        query(request.to_string().as_bytes()),
        Ok(json!({"nanoseconds":"86399999999999","fields":[23,59,59,999,999,999]}))
    );
}

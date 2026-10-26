use formatjs_intl_datetimeformat::{
    Error,
    timezone::{TimeZoneOffset, TimeZoneRegistry},
};

const PACK: &str = r#"{"abbrvs":"EST|EDT","offsets":"-dw0|-b40","zones":["America/New_York|,0,0,0|2s,1,1,1|5k,0,0,0"]}"#;
#[test]
fn loaded_transitions_switch_exactly_at_instant_and_keep_historical_seconds() {
    let registry = TimeZoneRegistry::default();
    registry.load_json(PACK).unwrap();
    let zone = registry.resolve("us/eastern").unwrap();
    assert_eq!(zone.identifier(), "America/New_York");
    for (instant, seconds, in_dst) in [
        (0, -18000, false),
        (99_999_999_999, -18000, false),
        (100_000_000_000, -14400, true),
        (199_999_999_999, -14400, true),
        (200_000_000_000, -18000, false),
    ] {
        assert_eq!(
            registry.offset_at(&zone, instant),
            TimeZoneOffset { seconds, in_dst }
        );
    }
    let (local, offset) = registry.local_time(&zone, -1).unwrap();
    assert_eq!(
        (
            local.year,
            local.month,
            local.day,
            local.hour,
            local.minute,
            local.second,
            local.nanosecond
        ),
        (1969, 12, 31, 18, 59, 59, 999_999_999)
    );
    assert_eq!(offset.seconds, -18000);
}
#[test]
fn replacement_reaches_existing_zone_records_and_invalid_pack_is_atomic() {
    let registry = TimeZoneRegistry::default();
    registry.load_json(PACK).unwrap();
    let zone = registry.resolve("America/New_York").unwrap();
    for bad in [
        PACK.replace("2s,1,1,1", "2s,1,99,1"),
        PACK.replace("5k,0,0,0", "1,0,0,0"),
        PACK.replace("|,0,0,0", "|1,0,0,0"),
    ] {
        assert_eq!(registry.load_json(&bad), Err(Error::InvalidTimeZoneData));
        assert_eq!(registry.offset_at(&zone, 0).seconds, -18000);
    }
    let replacement = PACK.replace("-dw0", "-b40");
    registry.clone().load_json(&replacement).unwrap();
    assert_eq!(registry.offset_at(&zone, 0).seconds, -14400);
    registry
        .load_json(r#"{"abbrvs":"","offsets":"","zones":[]}"#)
        .unwrap();
    assert_eq!(
        registry.offset_at(&zone, 0),
        TimeZoneOffset {
            seconds: 0,
            in_dst: false
        }
    );
}
#[test]
fn offsets_and_default_zone_preserve_validation_and_ascii_matching() {
    let registry = TimeZoneRegistry::default();
    for (input, name, offset) in [
        ("-00", "+00:00", 0),
        ("+0530", "+05:30", 19800),
        ("-23:59", "-23:59", -86340),
    ] {
        let zone = registry.resolve(input).unwrap();
        assert_eq!(zone.identifier(), name);
        assert_eq!(
            registry.offset_at(&zone, 0),
            TimeZoneOffset {
                seconds: offset,
                in_dst: false
            }
        );
    }
    for bad in [
        "+24",
        "+01:00:00",
        "-01:00:00.0",
        "+0",
        "+00:60",
        "+٠١:00",
        "Aſia/Tokyo",
        "No/Such_Zone",
    ] {
        assert_eq!(registry.resolve(bad), Err(Error::InvalidTimeZone));
    }
    registry.set_default_time_zone(Some("+0530")).unwrap();
    assert_eq!(registry.default_time_zone().identifier(), "+05:30");
    assert_eq!(
        registry.set_default_time_zone(Some("+24")),
        Err(Error::InvalidTimeZone)
    );
    assert_eq!(registry.default_time_zone().identifier(), "+05:30");
    registry.set_default_time_zone(None).unwrap();
    assert_eq!(registry.default_time_zone().identifier(), "UTC");
    assert_eq!(registry.resolve("gmt0").unwrap().identifier(), "UTC");
}

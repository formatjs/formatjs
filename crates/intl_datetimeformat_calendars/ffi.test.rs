use formatjs_intl_datetimeformat::ffi::*;
use formatjs_intl_datetimeformat_calendars::ffi::formatjs_datetime_calendar_load;
use serde_json::Value;
use std::ptr;
const EN: &str = include_str!(env!("FORMATJS_DATETIME_EN"));
const HEBREW: &str = include_str!(env!("FORMATJS_HEBREW_EN"));

#[test]
fn nonpositive_calendar_display_years_follow_the_pattern_rule() {
    use formatjs_intl_datetimeformat::{
        DateTimeValue, Runtime,
        fields::{Components, NumericWidth},
        registry::ResolutionOptions,
        selection::Options,
    };
    use formatjs_intl_datetimeformat_calendars::{
        Provider,
        calendar::{Calendar, Overflow},
    };
    let runtime = Runtime::default();
    runtime.add_locale_data(EN).unwrap();
    runtime
        .add_calendar_locale_data(include_str!(env!("FORMATJS_BUDDHIST_EN")))
        .unwrap();
    Provider::arithmetic("buddhist").unwrap().register(&runtime);
    let calendar = Calendar::from_name("buddhist").unwrap();
    for width in [NumericWidth::Numeric, NumericWidth::TwoDigit] {
        let construction = runtime.begin();
        let resolution = construction
            .resolve(
                &["en".into()],
                &ResolutionOptions {
                    calendar: Some("buddhist".into()),
                    ..ResolutionOptions::default()
                },
            )
            .unwrap();
        assert_eq!(resolution.calendar, "buddhist");
        let zone = construction.time_zone(Some("UTC")).unwrap();
        let config = construction
            .capture(
                resolution,
                Components {
                    year: Some(width),
                    ..Components::default()
                },
            )
            .unwrap()
            .select(&Options::default())
            .unwrap();
        let formatter = construction.finish(config, zone);
        for (year, numeric, two_digit) in [(-1, "2", "02"), (0, "1", "01"), (1, "1", "01")] {
            let value = DateTimeValue::Number(
                (calendar.to_epoch_day(year, 1, 1, Overflow::Reject).unwrap() * 86_400_000) as f64,
            );
            let expected = match width {
                NumericWidth::Numeric => numeric,
                NumericWidth::TwoDigit => two_digit,
            };
            let parts = serde_json::to_value(formatter.format_to_parts(&value).unwrap()).unwrap();
            assert!(
                parts
                    .as_array()
                    .unwrap()
                    .contains(&serde_json::json!({"type":"year","value":expected})),
                "year={year}, parts={parts}"
            );
        }
    }
}

unsafe fn info(registry: *const DateTimeRegistry) -> Value {
    let mut bytes = DateTimeBytes {
        data: ptr::null_mut(),
        len: 0,
    };
    assert_eq!(
        unsafe { formatjs_datetime_registry_info(registry, &mut bytes) },
        0
    );
    let value =
        unsafe { serde_json::from_slice(std::slice::from_raw_parts(bytes.data, bytes.len)) }
            .unwrap();
    unsafe { formatjs_datetime_bytes_free(bytes) };
    value
}
#[test]
fn optional_abi_keeps_patterns_and_arithmetic_independent_and_failed_loads_atomic() {
    unsafe {
        let mut registry = ptr::null_mut();
        assert_eq!(formatjs_datetime_registry_create(&mut registry), 0);
        assert_eq!(
            formatjs_datetime_registry_load(registry, 0, EN.as_ptr(), EN.len()),
            0
        );
        let pack = r#"{"calendar":"hebrew"}"#;
        assert_eq!(
            formatjs_datetime_calendar_load(registry, pack.as_ptr(), pack.len()),
            0
        );
        assert!(
            !info(registry)["calendars"]
                .as_array()
                .unwrap()
                .iter()
                .any(|value| value == "hebrew")
        );
        assert_eq!(
            formatjs_datetime_registry_load(registry, 1, HEBREW.as_ptr(), HEBREW.len()),
            0
        );
        assert!(
            info(registry)["calendars"]
                .as_array()
                .unwrap()
                .iter()
                .any(|value| value == "hebrew")
        );
        let invalid = r#"{"calendar":"hebrew","data":{}}"#;
        assert_eq!(
            formatjs_datetime_calendar_load(registry, invalid.as_ptr(), invalid.len()),
            1
        );
        let mut construction = ptr::null_mut();
        assert_eq!(formatjs_datetime_begin(registry, &mut construction), 0);
        let early = r#"{"locales":["en"],"options":{"calendar":"hebrew"}}"#;
        assert_eq!(
            formatjs_datetime_resolve(construction, early.as_ptr(), early.len()),
            0
        );
        assert_eq!(formatjs_datetime_zone(construction, b"null".as_ptr(), 4), 0);
        let fields = r#"{"year":"numeric"}"#;
        assert_eq!(
            formatjs_datetime_capture(construction, fields.as_ptr(), fields.len()),
            0
        );
        let mut handle = ptr::null_mut();
        assert_eq!(
            formatjs_datetime_create(construction, b"{}".as_ptr(), 2, &mut handle),
            0
        );
        formatjs_datetime_construction_destroy(construction);
        formatjs_datetime_registry_destroy(registry);
        let request = r#"{"op":"format","value":{"type":"number","value":"1704067200000"}}"#;
        let mut bytes = DateTimeBytes {
            data: ptr::null_mut(),
            len: 0,
        };
        assert_eq!(
            formatjs_datetime_query(handle, request.as_ptr(), request.len(), &mut bytes),
            0
        );
        let value: Value =
            serde_json::from_slice(std::slice::from_raw_parts(bytes.data, bytes.len)).unwrap();
        assert_eq!(value, "5784");
        formatjs_datetime_bytes_free(bytes);
        formatjs_datetime_destroy(handle);
    }
}

#[test]
fn arithmetic_providers_preserve_existing_calendar_date_bounds() {
    use formatjs_intl_datetimeformat::calendar::CalendarProvider;
    use formatjs_intl_datetimeformat_calendars::Provider;
    for name in [
        "buddhist",
        "japanese",
        "roc",
        "coptic",
        "ethiopic",
        "ethioaa",
        "hebrew",
        "indian",
        "islamic-civil",
        "islamic-tbla",
        "persian",
    ] {
        let provider = Provider::arithmetic(name).unwrap();
        for time in [
            -100_000_001_i64 * 86_400_000,
            -100_000_000 * 86_400_000,
            100_000_000 * 86_400_000,
            100_000_001 * 86_400_000 - 1,
        ] {
            assert!(provider.date_from_time(time).is_ok(), "{name} {time}");
        }
        for time in [-100_000_001_i64 * 86_400_000 - 1, 100_000_001 * 86_400_000] {
            assert!(provider.date_from_time(time).is_err(), "{name} {time}");
        }
    }
}

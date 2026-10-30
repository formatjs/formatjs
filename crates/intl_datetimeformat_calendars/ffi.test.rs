use formatjs_intl_datetimeformat::ffi::*;
use formatjs_intl_datetimeformat_calendars::ffi::formatjs_datetime_calendar_load;
use serde_json::Value;
use std::ptr;
const EN: &str = include_str!(env!("FORMATJS_DATETIME_EN"));
const HEBREW: &str = include_str!(env!("FORMATJS_HEBREW_EN"));
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

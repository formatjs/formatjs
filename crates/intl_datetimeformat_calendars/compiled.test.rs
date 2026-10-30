use formatjs_intl_datetimeformat::ffi::{
    DateTimeBytes, formatjs_datetime_bytes_free, formatjs_datetime_registry_create,
    formatjs_datetime_registry_destroy, formatjs_datetime_registry_info,
};
use formatjs_intl_datetimeformat_calendars::ffi::formatjs_datetime_calendar_load_compiled;
use std::ptr;

#[test]
fn compiled_calendars_are_available_to_datetimeformat() {
    unsafe {
        let mut registry = ptr::null_mut();
        assert_eq!(formatjs_datetime_registry_create(&mut registry), 0);
        assert_eq!(formatjs_datetime_calendar_load_compiled(registry), 0);
        let mut bytes = DateTimeBytes {
            data: ptr::null_mut(),
            len: 0,
        };
        assert_eq!(formatjs_datetime_registry_info(registry, &mut bytes), 0);
        let info: serde_json::Value =
            serde_json::from_slice(std::slice::from_raw_parts(bytes.data, bytes.len)).unwrap();
        let calendars = info["calendars"].as_array().unwrap();
        assert_eq!(calendars.len(), 16);
        for calendar in ["chinese", "dangi", "hebrew", "islamic-umalqura"] {
            assert!(calendars.iter().any(|value| value == calendar));
        }
        formatjs_datetime_bytes_free(bytes);
        formatjs_datetime_registry_destroy(registry);
    }
}

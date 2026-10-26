use formatjs_intl_durationformat::ffi::*;
use serde_json::{Value, json};
use std::{ptr, slice};
const NUMBER: &str = include_str!(env!("FORMATJS_DURATION_NUMBER_EN"));
const LIST: &str = include_str!(env!("FORMATJS_DURATION_LIST_EN"));
struct Registry(*mut DurationRegistry);
impl Registry {
    fn new() -> Self {
        let mut out = ptr::null_mut();
        assert_eq!(unsafe { formatjs_duration_registry_create(&mut out) }, 0);
        Self(out)
    }
    fn load(&self, kind: u32, data: &str) -> i32 {
        unsafe { formatjs_duration_registry_load(self.0, kind, data.as_ptr(), data.len()) }
    }
    fn begin(&self, request: Value) -> Result<Construction, i32> {
        let request = request.to_string();
        let mut out = ptr::dangling_mut();
        let status =
            unsafe { formatjs_duration_begin(self.0, request.as_ptr(), request.len(), &mut out) };
        if status != 0 {
            assert!(out.is_null());
            return Err(status);
        }
        Ok(Construction(out))
    }
}
impl Drop for Registry {
    fn drop(&mut self) {
        unsafe {
            formatjs_duration_registry_destroy(self.0);
        }
    }
}
struct Construction(*mut DurationConstruction);
impl Drop for Construction {
    fn drop(&mut self) {
        unsafe {
            formatjs_duration_construction_destroy(self.0);
        }
    }
}
impl Construction {
    fn style(&self, value: Value) -> i32 {
        let value = value.to_string();
        unsafe { formatjs_duration_style(self.0, value.as_ptr(), value.len()) }
    }
    fn unit_style(&self, index: u32, value: Value) -> i32 {
        let value = value.to_string();
        unsafe { formatjs_duration_unit_style(self.0, index, value.as_ptr(), value.len()) }
    }
    fn display(&self, index: u32, value: Value) -> i32 {
        let value = value.to_string();
        unsafe { formatjs_duration_unit_display(self.0, index, value.as_ptr(), value.len()) }
    }
    fn finish(&self, has: u8, value: f64) -> Result<Handle, i32> {
        let mut out = ptr::dangling_mut();
        let status = unsafe { formatjs_duration_finish(self.0, has, value, &mut out) };
        if status != 0 {
            assert!(out.is_null());
            return Err(status);
        }
        Ok(Handle(out))
    }
    fn defaults(&self, start: u32) {
        for index in start..10 {
            assert_eq!(self.unit_style(index, Value::Null), 0);
            assert_eq!(self.display(index, Value::Null), 0);
        }
    }
}
struct Handle(*mut DurationHandle);
impl Drop for Handle {
    fn drop(&mut self) {
        unsafe {
            formatjs_duration_destroy(self.0);
        }
    }
}
fn result(status: i32, bytes: DurationBytes) -> Result<Value, i32> {
    if status != 0 {
        assert!(bytes.data.is_null());
        assert_eq!(bytes.len, 0);
        return Err(status);
    }
    let value =
        serde_json::from_slice(unsafe { slice::from_raw_parts(bytes.data, bytes.len) }).unwrap();
    unsafe {
        formatjs_duration_bytes_free(bytes);
    }
    Ok(value)
}
impl Handle {
    fn resolved(&self) -> Value {
        let mut out = DurationBytes {
            data: ptr::dangling_mut(),
            len: 999,
        };
        let status = unsafe { formatjs_duration_resolved(self.0, &mut out) };
        result(status, out).unwrap()
    }
    fn query(&self, value: &DurationValue, mode: u32) -> Result<Value, i32> {
        let mut out = DurationBytes {
            data: ptr::dangling_mut(),
            len: 999,
        };
        let status = unsafe { formatjs_duration_format(self.0, value, mode, &mut out) };
        result(status, out)
    }
}
fn value(seconds: f64, milliseconds: f64) -> DurationValue {
    DurationValue {
        values: [
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            seconds,
            milliseconds,
            0.0,
            0.0,
        ],
        defined: (1 << 6) | (1 << 7),
    }
}
fn digital(registry: &Registry) -> Handle {
    let construction = registry.begin(json!({"locales":["en"]})).unwrap();
    assert_eq!(construction.style(json!("digital")), 0);
    construction.defaults(0);
    construction.finish(0, f64::NAN).unwrap()
}
#[test]
fn construction_retains_context_after_registry_and_construction_destroy() {
    let registry = Registry::new();
    assert_eq!(registry.load(0, NUMBER), 0);
    assert_eq!(registry.load(1, LIST), 0);
    let construction = registry.begin(json!({"locales":["en-u-nu-deva"]})).unwrap();
    drop(registry);
    assert_eq!(construction.style(json!("digital")), 0);
    construction.defaults(0);
    let handle = construction.finish(1, 2.9).unwrap();
    drop(construction);
    assert_eq!(handle.resolved()["locale"], "en-u-nu-deva");
    assert_eq!(handle.resolved()["fractionalDigits"], 2);
    assert_eq!(
        handle.query(&value(-1.0, -473.0), 0).unwrap(),
        "-०:००:०१.४७"
    );
    let parts = handle.query(&value(-1.0, -473.0), 1).unwrap();
    assert_eq!(
        parts[0],
        json!({"type":"minusSign", "value":"-", "unit":"hour"})
    );
    assert_eq!(parts[2], json!({"type":"literal", "value":":"}));
    let owned = unsafe { Box::from_raw(handle.0) };
    std::mem::forget(handle);
    let rendered = std::thread::spawn(move || {
        let mut out = DurationBytes {
            data: ptr::null_mut(),
            len: 0,
        };
        let status = unsafe { formatjs_duration_format(&*owned, &value(1.0, 473.0), 0, &mut out) };
        let output = result(status, out).unwrap();
        // Drop the final context owner on the worker, as a native finalizer may.
        drop(owned);
        output
    })
    .join()
    .unwrap();
    assert_eq!(rendered, "०:००:०१.४७");
}
#[test]
fn phases_reject_skipped_repeated_and_invalid_getters_without_advancing() {
    let registry = Registry::new();
    assert!(matches!(
        registry.begin(json!({"locales":["en"], "options":{"numberingSystem":"latn\n"}})),
        Err(1)
    ));
    let construction = registry.begin(json!({"locales":["en"]})).unwrap();
    assert_eq!(construction.unit_style(0, Value::Null), 2);
    assert_eq!(construction.style(json!("invalid")), 1);
    assert_eq!(construction.style(json!(true)), 2);
    assert_eq!(construction.style(json!("digital")), 0);
    assert_eq!(construction.style(Value::Null), 2);
    assert_eq!(construction.display(0, Value::Null), 2);
    assert_eq!(construction.unit_style(1, Value::Null), 2);
    assert_eq!(construction.unit_style(0, json!("numeric")), 1);
    assert_eq!(construction.unit_style(0, Value::Null), 0);
    assert_eq!(construction.unit_style(0, Value::Null), 2);
    assert_eq!(construction.display(0, json!("invalid")), 1);
    assert_eq!(construction.display(0, Value::Null), 0);
    assert!(matches!(construction.finish(0, 0.0), Err(2)));
    construction.defaults(1);
    assert_eq!(construction.unit_style(10, Value::Null), 2);
    assert!(matches!(construction.finish(2, 0.0), Err(2)));
    assert!(matches!(construction.finish(1, f64::NAN), Err(1)));
    assert!(matches!(construction.finish(1, 9.1), Err(1)));
    let handle = construction.finish(1, 9.0).unwrap();
    assert_eq!(handle.resolved()["seconds"], "2-digit");
    assert_eq!(handle.resolved()["milliseconds"], "numeric");
    assert!(matches!(construction.finish(0, 0.0), Err(2)));
}
#[test]
fn typed_values_keep_ieee_integers_and_classify_empty_invalid_and_missing_data() {
    let registry = Registry::new();
    let handle = digital(&registry);
    assert_eq!(handle.query(&value(1.0, 473.0), 0), Err(5));
    assert_eq!(registry.load(0, NUMBER), 0);
    assert_eq!(handle.query(&value(1.0, 473.0), 0), Err(5));
    assert_eq!(registry.load(1, LIST), 0);
    assert_eq!(handle.query(&value(1.0, 473.0), 0).unwrap(), "0:00:01.473");
    assert_eq!(handle.query(&value(1.0, -1.0), 0), Err(1));
    assert_eq!(handle.query(&value(f64::NAN, 0.0), 0), Err(1));
    assert_eq!(handle.query(&value(1.5, 0.0), 0), Err(1));
    let mut exact = value(0.0, 0.0);
    exact.defined = 1 << 8;
    exact.values[8] = 1e18 + 100.0;
    assert_eq!(
        handle.query(&exact, 0).unwrap(),
        "0:00:1000000000000.000128"
    );
    exact.defined = 0;
    assert_eq!(handle.query(&exact, 0), Err(4));
    exact.defined = 1 << 10;
    assert_eq!(handle.query(&exact, 0), Err(2));
    assert_eq!(handle.query(&value(0.0, 0.0), 2), Err(2));
}
#[test]
fn malformed_inputs_reset_outputs_and_static_info_needs_no_dependency_context() {
    unsafe {
        assert_eq!(formatjs_duration_registry_create(ptr::null_mut()), 2);
        let mut construction = ptr::dangling_mut();
        assert_eq!(
            formatjs_duration_begin(ptr::null(), ptr::null(), 0, &mut construction),
            2
        );
        assert!(construction.is_null());
        let registry = Registry::new();
        assert_eq!(registry.load(3, NUMBER), 2);
        assert_eq!(
            formatjs_duration_registry_load(registry.0, 0, ptr::null(), 2),
            2
        );
        assert_eq!(
            formatjs_duration_registry_load(registry.0, 0, [255].as_ptr(), 1),
            2
        );
        assert_eq!(registry.load(0, "{}"), 1);
        let mut bytes = DurationBytes {
            data: ptr::dangling_mut(),
            len: 999,
        };
        assert_eq!(formatjs_duration_resolved(ptr::null(), &mut bytes), 2);
        assert!(bytes.data.is_null());
        assert_eq!(bytes.len, 0);
        let request = b"{\"locales\":[\"en-u-nu-arab\",\"zz\",\"fr-XX\"]}";
        assert_eq!(
            formatjs_duration_supported(request.as_ptr(), request.len(), &mut bytes),
            0
        );
        assert_eq!(result(0, bytes).unwrap(), json!(["en-u-nu-arab", "fr-XX"]));
        assert_eq!(formatjs_duration_info(&mut bytes), 0);
        let info = result(0, bytes).unwrap();
        assert_eq!(info["default"], "en");
        assert!(
            info["available"]
                .as_array()
                .unwrap()
                .iter()
                .any(|locale| locale == "ar")
        );
        formatjs_duration_registry_destroy(ptr::null_mut());
        formatjs_duration_construction_destroy(ptr::null_mut());
        formatjs_duration_destroy(ptr::null_mut());
        formatjs_duration_bytes_free(DurationBytes {
            data: ptr::null_mut(),
            len: 0,
        });
    }
}

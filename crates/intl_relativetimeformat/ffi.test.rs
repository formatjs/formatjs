use formatjs_intl_relativetimeformat::ffi::*;
use serde_json::{Value, json};
use std::{ptr, slice};
const EN: &str = include_str!(env!("FORMATJS_RELATIVE_EN"));
struct Registry(*mut RelativeRegistry);
impl Registry {
    fn new() -> Self {
        let mut out = ptr::null_mut();
        assert_eq!(unsafe { formatjs_relative_registry_create(&mut out) }, 0);
        assert!(!out.is_null());
        Self(out)
    }
    fn load(&self, data: &str) -> i32 {
        unsafe { formatjs_relative_registry_load(self.0, data.as_ptr(), data.len()) }
    }
    fn resolve(&self, request: Value) -> Result<Value, i32> {
        let request = request.to_string();
        let mut out = RelativeBytes {
            data: ptr::null_mut(),
            len: 0,
        };
        let status =
            unsafe { formatjs_relative_resolve(self.0, request.as_ptr(), request.len(), &mut out) };
        if status != 0 {
            assert!(out.data.is_null());
            assert_eq!(out.len, 0);
            return Err(status);
        }
        Ok(serde_json::from_str(&unsafe { owned(out) }).unwrap())
    }
    fn create(&self, resolution: &Value, options: Value) -> Result<Handle, i32> {
        let request = json!({"resolution":resolution,"options":options}).to_string();
        let mut out = ptr::null_mut();
        let status =
            unsafe { formatjs_relative_create(self.0, request.as_ptr(), request.len(), &mut out) };
        if status == 0 {
            assert!(!out.is_null());
            Ok(Handle(out))
        } else {
            assert!(out.is_null());
            Err(status)
        }
    }
}
impl Drop for Registry {
    fn drop(&mut self) {
        unsafe {
            formatjs_relative_registry_destroy(self.0);
        }
    }
}
struct Handle(*mut RelativeHandle);
impl Drop for Handle {
    fn drop(&mut self) {
        unsafe {
            formatjs_relative_destroy(self.0);
        }
    }
}
unsafe fn owned(value: RelativeBytes) -> String {
    let text =
        String::from_utf8(unsafe { slice::from_raw_parts(value.data, value.len) }.to_owned())
            .unwrap();
    unsafe {
        formatjs_relative_bytes_free(value);
    }
    text
}
impl Handle {
    fn raw(&self, query: Value) -> Result<String, i32> {
        let mut query = query;
        if let Some(unit) = query["unit"].as_str() {
            let units: Vec<u16> = unit.encode_utf16().collect();
            query["unit"] = json!(units);
        }
        let query = query.to_string();
        let mut out = RelativeBytes {
            data: ptr::null_mut(),
            len: 0,
        };
        let status =
            unsafe { formatjs_relative_query(self.0, query.as_ptr(), query.len(), &mut out) };
        if status != 0 {
            assert!(out.data.is_null());
            assert_eq!(out.len, 0);
            return Err(status);
        }
        Ok(unsafe { owned(out) })
    }
    fn query(&self, query: Value) -> Result<Value, i32> {
        self.raw(query)
            .map(|text| serde_json::from_str(&text).unwrap())
    }
}
fn loaded() -> (Registry, Value) {
    let registry = Registry::new();
    assert_eq!(registry.load(EN), 0);
    let resolution = registry.resolve(json!({"locales":["en"]})).unwrap();
    (registry, resolution)
}
#[test]
fn abi_reads_fields_after_resolution_and_owns_records_after_registry_release() {
    let (registry, resolution) = loaded();
    let old = registry.create(&resolution, json!({})).ok().unwrap();
    let arab = registry
        .resolve(json!({"locales":["en-u-nu-arab"]}))
        .unwrap();
    {
        let mut pack: Value = serde_json::from_str(EN).unwrap();
        pack["data"]["day"]["future"]["other"] = json!("later {0} days");
        assert_eq!(registry.load(&pack.to_string()), 0);
    }
    let new = registry.create(&arab, json!({})).ok().unwrap();
    drop(registry);
    let query = json!({"method":"format","value":"2","unit":"days"});
    assert_eq!(old.query(query.clone()).unwrap(), json!("in 2 days"));
    assert_eq!(new.query(query).unwrap(), json!("later ٢ days"));
    assert_eq!(
        new.query(json!({"method":"resolvedOptions"})).unwrap(),
        json!({"locale":"en-u-nu-arab","style":"long","numeric":"always","numberingSystem":"arab"})
    );
}
#[test]
fn abi_parts_keep_property_order_and_named_forms_omit_unit() {
    let (registry, resolution) = loaded();
    let model = registry.create(&resolution, json!({})).ok().unwrap();
    assert_eq!(
        model
            .raw(json!({"method":"formatToParts","value":"2","unit":"day"}))
            .unwrap(),
        r#"[{"type":"literal","value":"in "},{"type":"integer","value":"2","unit":"day"},{"type":"literal","value":" days"}]"#
    );
    let auto = registry
        .create(&resolution, json!({"numeric":"auto"}))
        .ok()
        .unwrap();
    assert_eq!(
        auto.query(json!({"method":"formatToParts","value":"-0","unit":"day"}))
            .unwrap(),
        json!([{"type":"literal","value":"today"}])
    );
    assert_eq!(
        model
            .query(json!({"method":"format","value":"-0","unit":"day"}))
            .unwrap(),
        json!("0 days ago")
    );
    assert_eq!(
        model
            .query(json!({"method":"format","value":"1e+21","unit":"seconds"}))
            .unwrap(),
        json!("in 1,000,000,000,000,000,000,000 seconds")
    );
}
#[test]
fn direct_format_preserves_negative_zero_and_rejects_unpaired_unit() {
    let (registry, resolution) = loaded();
    let model = registry.create(&resolution, json!({})).unwrap();
    let unit: Vec<u16> = "day".encode_utf16().collect();
    let mut out = RelativeBytes {
        data: ptr::null_mut(),
        len: 0,
    };
    assert_eq!(
        unsafe {
            formatjs_relative_format(
                model.0,
                b"-0".as_ptr(),
                2,
                unit.as_ptr(),
                unit.len(),
                &mut out,
            )
        },
        0
    );
    assert_eq!(unsafe { owned(out) }, "0 days ago");
    let invalid = [0xd800];
    let mut out = RelativeBytes {
        data: ptr::dangling_mut(),
        len: 99,
    };
    assert_eq!(
        unsafe {
            formatjs_relative_format(model.0, b"1".as_ptr(), 1, invalid.as_ptr(), 1, &mut out)
        },
        1
    );
    assert!(out.data.is_null());
    assert_eq!(out.len, 0);
    assert_eq!(
        unsafe {
            formatjs_relative_format(
                model.0,
                b"1".as_ptr(),
                1,
                invalid.as_ptr(),
                isize::MAX as usize,
                &mut out,
            )
        },
        2
    );
    assert!(out.data.is_null());
}
#[test]
fn direct_parts_match_query_and_preserve_error_statuses() {
    let (registry, resolution) = loaded();
    for options in [json!({}), json!({"numeric":"auto","style":"narrow"})] {
        let model = registry.create(&resolution, options).unwrap();
        for (value, unit) in [
            ("-0", vec![100, 97, 121]),
            ("-1234.5", "days".encode_utf16().collect()),
            ("1e+21", "seconds".encode_utf16().collect()),
            ("-1", "day".encode_utf16().collect()),
            ("Infinity", "day".encode_utf16().collect()),
            ("1", vec![0xd800]),
            ("1", vec![]),
            ("1", "milliseconds".encode_utf16().collect()),
        ] {
            let expected = model.query(json!({"method":"formatToParts","value":value,"unit":unit}));
            let mut out = RelativeBytes {
                data: ptr::dangling_mut(),
                len: 99,
            };
            let status = unsafe {
                formatjs_relative_format_to_parts(
                    model.0,
                    value.as_ptr(),
                    value.len(),
                    unit.as_ptr(),
                    unit.len(),
                    &mut out,
                )
            };
            if status == 0 {
                let actual: Value = serde_json::from_str(&unsafe { owned(out) }).unwrap();
                assert_eq!(Ok(actual), expected, "{value} {unit:?}");
            } else {
                assert_eq!(expected, Err(status), "{value} {unit:?}");
                assert!(out.data.is_null());
                assert_eq!(out.len, 0);
            }
        }
        let mut out = RelativeBytes {
            data: ptr::dangling_mut(),
            len: 99,
        };
        assert_eq!(
            unsafe {
                formatjs_relative_format_to_parts(
                    model.0,
                    b"1".as_ptr(),
                    1,
                    ptr::null(),
                    1,
                    &mut out,
                )
            },
            2
        );
        assert!(out.data.is_null());
        assert_eq!(out.len, 0);
        assert_eq!(
            unsafe {
                formatjs_relative_format_to_parts(
                    model.0,
                    b"1".as_ptr(),
                    1,
                    ptr::null(),
                    0,
                    ptr::null_mut(),
                )
            },
            2
        );
    }
}
#[test]
fn abi_errors_leave_outputs_empty_and_reject_invalid_options() {
    let registry = Registry::new();
    assert_eq!(registry.resolve(json!({"locales":["en"]})), Err(1));
    assert_eq!(registry.load(EN), 0);
    let resolution = registry.resolve(json!({"locales":["en"]})).unwrap();
    for options in [json!({"style":"bad"}), json!({"numeric":"bad"})] {
        assert_eq!(registry.create(&resolution, options).err(), Some(1));
    }
    let model = registry.create(&resolution, json!({})).ok().unwrap();
    for query in [
        json!({"method":"format","value":"NaN","unit":"day"}),
        json!({"method":"format","value":"Infinity","unit":"day"}),
        json!({"method":"formatToParts","value":"1","unit":"DAY"}),
    ] {
        assert_eq!(model.query(query), Err(1));
    }
    assert_eq!(
        model.query(json!({"method":"format","value":"1","unit":[55296]})),
        Err(1)
    );
    assert_eq!(
        model.query(json!({"method":"format","value":"1","unit":[65536]})),
        Err(2)
    );
    assert_eq!(model.query(json!({"method":"unknown"})), Err(2));
    assert_eq!(
        model.query(json!({"method":"format","value":1,"unit":"day"})),
        Err(2)
    );
    let mut out = RelativeBytes {
        data: ptr::dangling_mut(),
        len: 42,
    };
    assert_eq!(
        unsafe { formatjs_relative_query(ptr::null(), ptr::null(), 0, &mut out) },
        2
    );
    assert!(out.data.is_null());
    assert_eq!(out.len, 0);
    assert_eq!(
        unsafe { formatjs_relative_query(model.0, ptr::null(), usize::MAX, &mut out) },
        2
    );
    let invalid = [0xff];
    assert_eq!(
        unsafe { formatjs_relative_query(model.0, invalid.as_ptr(), 1, &mut out) },
        2
    );
    assert!(out.data.is_null());
    assert_eq!(out.len, 0);
    assert_eq!(
        unsafe { formatjs_relative_registry_create(ptr::null_mut()) },
        2
    );
}
#[test]
fn abi_supported_locales_and_failed_load_preserve_registry_state() {
    let (registry, resolution) = loaded();
    assert_eq!(
        registry.load(r#"{"formatVersion":1,"locale":"fr","data":{}}"#),
        1
    );
    let input = json!(["en-US-u-nu-arab", "fr", "EN-us-u-nu-arab"]).to_string();
    let mut out = RelativeBytes {
        data: ptr::null_mut(),
        len: 0,
    };
    assert_eq!(
        unsafe { formatjs_relative_supported(registry.0, input.as_ptr(), input.len(), &mut out) },
        0
    );
    assert_eq!(
        serde_json::from_str::<Value>(&unsafe { owned(out) }).unwrap(),
        json!(["en-US-u-nu-arab"])
    );
    assert_eq!(
        registry
            .create(&resolution, json!({}))
            .ok()
            .unwrap()
            .query(json!({"method":"format","value":"1","unit":"day"}))
            .unwrap(),
        json!("in 1 day")
    );
}

#[test]
fn numeric_entry_points_match_js_number_text_and_error_statuses() {
    let (registry, resolution) = loaded();
    let unit: Vec<u16> = "day".encode_utf16().collect();
    for options in [json!({}), json!({"numeric":"auto","style":"narrow"})] {
        let model = registry.create(&resolution, options).unwrap();
        for (value, text) in [
            (0.0, "0"),
            (-0.0, "-0"),
            (1.0, "1"),
            (-1.0, "-1"),
            (1.2345, "1.2345"),
            (1.2345000000000002, "1.2345000000000002"),
            (1.2344999999999997, "1.2344999999999997"),
            (-1234.5, "-1234.5"),
            (1e-6, "0.000001"),
            (1e-7, "1e-7"),
            (1e20, "100000000000000000000"),
            (1e21, "1e+21"),
            (f64::from_bits(1), "5e-324"),
            (-f64::from_bits(1), "-5e-324"),
            (f64::MIN_POSITIVE, "2.2250738585072014e-308"),
            (f64::MAX, "1.7976931348623157e+308"),
            (f64::NAN, "NaN"),
            (f64::INFINITY, "Infinity"),
            (f64::NEG_INFINITY, "-Infinity"),
        ] {
            for parts in [false, true] {
                let mut legacy = RelativeBytes {
                    data: ptr::dangling_mut(),
                    len: 99,
                };
                let mut numeric = RelativeBytes {
                    data: ptr::dangling_mut(),
                    len: 99,
                };
                let old = if parts {
                    formatjs_relative_format_to_parts
                } else {
                    formatjs_relative_format
                };
                let new = if parts {
                    formatjs_relative_format_to_parts_number
                } else {
                    formatjs_relative_format_number
                };
                let expected = unsafe {
                    old(
                        model.0,
                        text.as_ptr(),
                        text.len(),
                        unit.as_ptr(),
                        unit.len(),
                        &mut legacy,
                    )
                };
                let actual =
                    unsafe { new(model.0, value, unit.as_ptr(), unit.len(), &mut numeric) };
                assert_eq!(actual, expected, "{text}: parts={parts}");
                if actual == 0 {
                    assert_eq!(
                        unsafe { owned(numeric) },
                        unsafe { owned(legacy) },
                        "{text}: parts={parts}"
                    );
                } else {
                    assert!(numeric.data.is_null() && legacy.data.is_null());
                    assert_eq!((numeric.len, legacy.len), (0, 0));
                }
            }
        }
        for call in [
            formatjs_relative_format_number,
            formatjs_relative_format_to_parts_number,
        ] {
            let invalid = [0xd800];
            let mut out = RelativeBytes {
                data: ptr::dangling_mut(),
                len: 99,
            };
            assert_eq!(
                unsafe { call(model.0, 1.0, invalid.as_ptr(), invalid.len(), &mut out) },
                1
            );
            assert!(out.data.is_null() && out.len == 0);
            assert_eq!(
                unsafe {
                    call(
                        model.0,
                        f64::NAN,
                        invalid.as_ptr(),
                        isize::MAX as usize,
                        &mut out,
                    )
                },
                2
            );
            assert!(out.data.is_null() && out.len == 0);
            assert_eq!(
                unsafe { call(ptr::null(), 1.0, unit.as_ptr(), unit.len(), &mut out) },
                2
            );
            assert!(out.data.is_null() && out.len == 0);
            assert_eq!(
                unsafe { call(model.0, 1.0, unit.as_ptr(), unit.len(), ptr::null_mut()) },
                2
            );
        }
    }
}

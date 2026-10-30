use formatjs_intl_pluralrules::ffi::*;
use serde_json::{Value, json};
use std::{ptr, slice};

struct Registry(*mut PluralRegistry);
impl Registry {
    fn new() -> Self {
        let mut handle = ptr::null_mut();
        assert_eq!(unsafe { formatjs_plural_registry_create(&mut handle) }, 0);
        assert!(!handle.is_null());
        Self(handle)
    }
    fn load(&self, pack: &str) -> i32 {
        unsafe { formatjs_plural_registry_load(self.0, pack.as_ptr(), pack.len()) }
    }
    fn create(&self, options: &str) -> Result<Handle, i32> {
        let mut handle = ptr::null_mut();
        let status = unsafe {
            formatjs_plural_create(
                self.0,
                b"en".as_ptr(),
                2,
                options.as_ptr(),
                options.len(),
                &mut handle,
            )
        };
        if status == 0 {
            Ok(Handle(handle))
        } else {
            assert!(handle.is_null());
            Err(status)
        }
    }
}
impl Drop for Registry {
    fn drop(&mut self) {
        unsafe {
            formatjs_plural_registry_destroy(self.0);
        }
    }
}
struct Handle(*mut PluralHandle);
impl Drop for Handle {
    fn drop(&mut self) {
        unsafe {
            formatjs_plural_destroy(self.0);
        }
    }
}
impl Handle {
    fn query(&self, request: Value) -> Result<Value, i32> {
        let request = request.to_string();
        let mut out = PluralBytes {
            data: ptr::null_mut(),
            len: 0,
        };
        let status =
            unsafe { formatjs_plural_query(self.0, request.as_ptr(), request.len(), &mut out) };
        if status != 0 {
            assert!(out.data.is_null());
            assert_eq!(out.len, 0);
            return Err(status);
        }
        let value =
            serde_json::from_slice(unsafe { slice::from_raw_parts(out.data, out.len) }).unwrap();
        unsafe {
            formatjs_plural_bytes_free(out);
        }
        Ok(value)
    }
    fn select(&self, value: &str, bigint: bool) -> Result<u8, i32> {
        let mut category = 255;
        let status = unsafe {
            formatjs_plural_select(self.0, value.as_ptr(), value.len(), bigint, &mut category)
        };
        if status == 0 {
            Ok(category)
        } else {
            assert_eq!(category, 255);
            Err(status)
        }
    }
    fn range(
        &self,
        start: &str,
        end: &str,
        first_bigint: bool,
        last_bigint: bool,
    ) -> Result<u8, i32> {
        let mut category = 255;
        let status = unsafe {
            formatjs_plural_select_range(
                self.0,
                start.as_ptr(),
                start.len(),
                first_bigint,
                end.as_ptr(),
                end.len(),
                last_bigint,
                &mut category,
            )
        };
        if status == 0 {
            Ok(category)
        } else {
            assert_eq!(category, 255);
            Err(status)
        }
    }
}
const EN: &str = r#"{"locale":"en","cardinal":{"one":"i = 1 and v = 0"},"ordinal":{},"ranges":{"cardinal":{"one_other":"other"}}}"#;

#[test]
fn direct_select_matches_json_for_mathematical_inputs() {
    let registry = Registry::new();
    assert_eq!(registry.load(EN), 0);
    let handle = registry.create("{}").unwrap();
    for (value, bigint) in [
        ("1", false),
        ("1.0", false),
        ("1e0", false),
        ("-0", false),
        ("NaN", false),
        ("Infinity", false),
        ("9007199254740993", true),
        ("-9007199254740993", true),
    ] {
        let expected = handle
            .query(json!({"method":"select","mathematical":true,"value":value,"bigint":bigint}))
            .unwrap();
        let category = ["zero", "one", "two", "few", "many", "other"]
            [handle.select(value, bigint).unwrap() as usize];
        assert_eq!(expected, category, "{value} (bigint={bigint})");
    }
    let mut out = 0;
    assert_eq!(
        unsafe { formatjs_plural_select(ptr::null(), b"1".as_ptr(), 1, false, &mut out) },
        2
    );
    assert_eq!(out, 255);
}

#[test]
fn direct_ranges_match_json_including_bigint_flags_and_errors() {
    let registry = Registry::new();
    let mut pack: Value = serde_json::from_str(EN).unwrap();
    pack["ordinal"] = json!({"one":"n % 10 = 1 and n % 100 != 11","two":"n % 10 = 2 and n % 100 != 12","few":"n % 10 = 3 and n % 100 != 13"});
    assert_eq!(registry.load(&pack.to_string()), 0);
    let huge = "1".to_owned() + &"0".repeat(39_998) + "1";
    for options in [
        "{}",
        r#"{"type":"ordinal"}"#,
        r#"{"minimumFractionDigits":2}"#,
    ] {
        let handle = registry.create(options).unwrap();
        for (start, end, first_bigint, last_bigint) in [
            ("1", "2", false, false),
            ("2", "1", false, false),
            ("1.001", "1.002", false, false),
            ("-0", "0", false, false),
            ("Infinity", "-Infinity", false, false),
            ("NaN", "1", false, false),
            ("1", "NaN", false, false),
            ("0x10", "0b11", false, false),
            ("1e-400", "1", false, false),
            (huge.as_str(), "2", true, false),
            ("0", huge.as_str(), false, true),
            ("0", huge.as_str(), false, false),
        ] {
            let expected = handle.query(json!({"method":"selectRange","mathematical":true,"start":start,"end":end,"startBigint":first_bigint,"endBigint":last_bigint}));
            let actual = handle
                .range(start, end, first_bigint, last_bigint)
                .map(|i| json!(["zero", "one", "two", "few", "many", "other"][i as usize]));
            assert_eq!(
                actual, expected,
                "options={options}, flags={first_bigint}/{last_bigint}"
            );
        }
    }
    let handle = registry.create(r#"{"type":"ordinal"}"#).unwrap();
    assert_eq!(handle.range("0", &huge, false, true), Ok(1));
    assert_eq!(handle.range("0", &huge, false, false), Ok(5));
    let mut out = 0;
    assert_eq!(
        unsafe {
            formatjs_plural_select_range(
                ptr::null(),
                b"1".as_ptr(),
                1,
                false,
                b"2".as_ptr(),
                1,
                false,
                &mut out,
            )
        },
        2
    );
    assert_eq!(out, 255);
    out = 0;
    assert_eq!(
        unsafe {
            formatjs_plural_select_range(
                handle.0,
                ptr::null(),
                1,
                false,
                b"2".as_ptr(),
                1,
                false,
                &mut out,
            )
        },
        2
    );
    assert_eq!(out, 255);
    assert_eq!(
        unsafe {
            formatjs_plural_select_range(
                handle.0,
                b"1".as_ptr(),
                1,
                false,
                b"2".as_ptr(),
                1,
                false,
                ptr::null_mut(),
            )
        },
        2
    );
}

#[test]
fn abi_handles_own_rules_after_registry_and_input_release() {
    let registry = Registry::new();
    {
        let pack = EN.to_owned();
        assert_eq!(registry.load(&pack), 0);
    }
    let handle = registry.create("{}").ok().unwrap();
    assert_eq!(
        registry.load(r#"{"locale":"en","cardinal":{},"ordinal":{}}"#),
        0
    );
    assert_eq!(
        registry
            .create("{}")
            .ok()
            .unwrap()
            .query(json!({"method":"select","value":"1"}))
            .unwrap(),
        "other"
    );
    drop(registry);
    assert_eq!(
        handle
            .query(json!({"method":"select","value":"1"}))
            .unwrap(),
        "one"
    );
    assert_eq!(
        handle
            .query(json!({"method":"selectRange","start":"1","end":"2"}))
            .unwrap(),
        "other"
    );
    assert_eq!(
        handle.query(json!({"method":"selectRange","start":"NaN","end":"2"})),
        Err(1)
    );
    let first = handle.query(json!({"method":"resolvedOptions"})).unwrap();
    let second = handle.query(json!({"method":"resolvedOptions"})).unwrap();
    assert_eq!(first, second);
    assert_eq!(first["pluralCategories"], json!(["one", "other"]));
}

#[test]
fn abi_preserves_nonfinite_options_and_distinguishes_type_errors() {
    let registry = Registry::new();
    assert_eq!(registry.load(EN), 0);
    assert!(
        registry
            .create(r#"{"maximumSignificantDigits":2,"maximumFractionDigits":"NaN"}"#)
            .is_ok()
    );
    assert_eq!(
        registry.create(r#"{"maximumFractionDigits":"NaN"}"#).err(),
        Some(1)
    );
    assert_eq!(
        registry
            .create(r#"{"roundingIncrement":2,"maximumSignificantDigits":2}"#)
            .err(),
        Some(4)
    );
    assert_eq!(
        registry
            .create(r#"{"maximumFractionDigits":"uncoerced"}"#)
            .err(),
        Some(2)
    );
    assert_eq!(registry.create("null").err(), Some(2));
}

#[test]
fn invalid_abi_inputs_clear_outputs_and_failed_load_is_atomic() {
    let registry = Registry::new();
    assert_eq!(registry.load(EN), 0);
    assert_eq!(registry.load("invalid"), 1);
    let mut out = PluralBytes {
        data: ptr::null_mut(),
        len: 0,
    };
    assert_eq!(
        unsafe { formatjs_plural_registry_info(registry.0, &mut out) },
        0
    );
    let info: Value =
        serde_json::from_slice(unsafe { slice::from_raw_parts(out.data, out.len) }).unwrap();
    unsafe {
        formatjs_plural_bytes_free(out);
    }
    assert_eq!(info, json!({"available":["en"],"default":"en"}));
    out = PluralBytes {
        data: ptr::dangling_mut(),
        len: 99,
    };
    assert_eq!(
        unsafe { formatjs_plural_query(ptr::null(), ptr::null(), 1, &mut out) },
        2
    );
    assert!(out.data.is_null());
    assert_eq!(out.len, 0);
    assert_eq!(
        unsafe { formatjs_plural_registry_load(registry.0, [255].as_ptr(), 1) },
        2
    );
    assert_eq!(
        unsafe { formatjs_plural_registry_load(registry.0, ptr::null(), usize::MAX) },
        2
    );
    assert_eq!(
        unsafe { formatjs_plural_registry_create(ptr::null_mut()) },
        2
    );
    unsafe {
        formatjs_plural_destroy(ptr::null_mut());
        formatjs_plural_registry_destroy(ptr::null_mut());
    }
}

#[test]
fn registry_matching_observes_current_availability() {
    let registry = Registry::new();
    let query = br#"{"requested":["en-GB-u-nu-arab","qzz"],"supported":true}"#;
    for expected in [json!([]), json!(["en-GB-u-nu-arab"])] {
        let mut out = PluralBytes {
            data: ptr::null_mut(),
            len: 0,
        };
        assert_eq!(
            unsafe {
                formatjs_plural_registry_match(registry.0, query.as_ptr(), query.len(), &mut out)
            },
            0
        );
        let value: Value =
            serde_json::from_slice(unsafe { slice::from_raw_parts(out.data, out.len) }).unwrap();
        unsafe {
            formatjs_plural_bytes_free(out);
        }
        assert_eq!(value, expected);
        assert_eq!(registry.load(EN), 0);
    }
}

use formatjs_intl_numberformat::ffi::*;
use serde_json::{Value, json};
use std::{ptr, slice};

const EN: &str = include_str!(env!("FORMATJS_NUMBER_EN"));
struct Registry(*mut NumberRegistry);
impl Registry {
    fn new() -> Self {
        let mut out = ptr::null_mut();
        assert_eq!(unsafe { formatjs_number_registry_create(&mut out) }, 0);
        assert!(!out.is_null());
        Self(out)
    }
    fn load(&self, value: &str) -> i32 {
        unsafe { formatjs_number_registry_load(self.0, value.as_ptr(), value.len()) }
    }
    fn resolve(&self, request: Value) -> Result<Handle, i32> {
        let request = request.to_string();
        let mut out = ptr::null_mut();
        let status =
            unsafe { formatjs_number_resolve(self.0, request.as_ptr(), request.len(), &mut out) };
        handle(status, out)
    }
}
impl Drop for Registry {
    fn drop(&mut self) {
        unsafe {
            formatjs_number_registry_destroy(self.0);
        }
    }
}
struct Handle(*mut NumberHandle);
impl Drop for Handle {
    fn drop(&mut self) {
        unsafe {
            formatjs_number_destroy(self.0);
        }
    }
}
fn handle(status: i32, out: *mut NumberHandle) -> Result<Handle, i32> {
    if status == 0 {
        assert!(!out.is_null());
        Ok(Handle(out))
    } else {
        assert!(out.is_null());
        Err(status)
    }
}
impl Handle {
    fn create(&self, options: Value) -> Result<Self, i32> {
        let options = options.to_string();
        let mut out = ptr::null_mut();
        let status =
            unsafe { formatjs_number_create(self.0, options.as_ptr(), options.len(), &mut out) };
        handle(status, out)
    }
    fn query(&self, query: Value) -> Result<Value, i32> {
        let query = query.to_string();
        let mut out = NumberBytes {
            data: ptr::null_mut(),
            len: 0,
        };
        let status =
            unsafe { formatjs_number_query(self.0, query.as_ptr(), query.len(), &mut out) };
        if status != 0 {
            assert!(out.data.is_null());
            assert_eq!(out.len, 0);
            return Err(status);
        }
        Ok(unsafe { decoded(out) })
    }
    fn format(&self, text: &str, bigint: bool) -> Value {
        self.query(json!({"method":"format","value":{"text":text,"bigint":bigint}}))
            .unwrap()
    }
}
unsafe fn decoded(value: NumberBytes) -> Value {
    let result =
        serde_json::from_slice(unsafe { slice::from_raw_parts(value.data, value.len) }).unwrap();
    unsafe {
        formatjs_number_bytes_free(value);
    }
    result
}
fn loaded() -> (Registry, Handle) {
    let registry = Registry::new();
    assert_eq!(registry.load(EN), 0);
    let seed = registry.resolve(json!({"locales":["en"]})).ok().unwrap();
    (registry, seed)
}
#[test]
fn abi_resolution_owns_locale_before_later_registrations_and_input_release() {
    let registry = Registry::new();
    assert_eq!(registry.resolve(json!({"locales":["en"]})).err(), Some(1));
    {
        let input = EN.to_owned();
        assert_eq!(registry.load(&input), 0);
    }
    let seed = registry.resolve(json!({"locales":["en"]})).ok().unwrap();
    let mut replacement: Value = serde_json::from_str(EN).unwrap();
    replacement["data"]["numbers"]["symbols"]["latn"]["decimal"] = json!(",");
    assert_eq!(registry.load(&replacement.to_string()), 0);
    let newer = registry.resolve(json!({"locales":["en"]})).ok().unwrap();
    let arab = registry
        .resolve(json!({"locales":["en-u-nu-arab"]}))
        .ok()
        .unwrap();
    let arab = arab
        .create(json!({"maximumFractionDigits":2}))
        .ok()
        .unwrap();
    assert_eq!(arab.format("1.5", false), json!("١٫٥"));
    let options = arab.query(json!({"method":"resolvedOptions"})).unwrap();
    assert_eq!(options["locale"], json!("en-u-nu-arab"));
    assert_eq!(options["numberingSystem"], json!("arab"));
    drop(registry);
    let original = seed
        .create(json!({"maximumFractionDigits":2}))
        .ok()
        .unwrap();
    drop(seed);
    assert_eq!(original.format("1.5", false), json!("1.5"));
    assert_eq!(newer.format("1.5", false), json!("1,5"));
}
#[test]
fn abi_mathematical_inputs_preserve_radix_decimals_bigints_and_number_clamps() {
    let (_registry, seed) = loaded();
    let model = seed
        .create(json!({"useGrouping":false,"maximumFractionDigits":3}))
        .ok()
        .unwrap();
    for (text, expected) in [
        (" 0x20000000000001 ", "9007199254740993"),
        ("9007199254740993.125", "9007199254740993.125"),
        ("0b101", "5"),
        ("\u{feff}0o17\u{2029}", "15"),
        ("-1e-99999", "-0"),
        ("1e99999", "∞"),
        ("0xwat", "NaN"),
        ("-0", "-0"),
        ("  ", "0"),
    ] {
        assert_eq!(model.format(text, false), json!(expected), "{text}");
    }
    let huge = "9".repeat(400);
    assert_eq!(model.format(&huge, true), json!(huge));
    assert_eq!(model.format(&huge, false), json!("∞"));
}
#[test]
fn abi_precision_keeps_inactive_nonfinite_options_and_distinguishes_errors() {
    let (_registry, seed) = loaded();
    let model = seed
        .create(json!({"maximumSignificantDigits":2,"minimumFractionDigits":"NaN"}))
        .ok()
        .unwrap();
    assert_eq!(model.format("1.234", false), json!("1.2"));
    for options in [
        json!({"minimumFractionDigits":"NaN"}),
        json!({"minimumIntegerDigits":"Infinity"}),
        json!({"currency":"US\n"}),
        json!({"unit":"MILE"}),
        json!({"roundingIncrement":3}),
    ] {
        assert_eq!(seed.create(options).err(), Some(1));
    }
    for options in [json!({"style":"currency"}), json!({"style":"unit"})] {
        assert_eq!(seed.create(options).err(), Some(4));
    }
    assert_eq!(
        seed.create(json!({"minimumIntegerDigits":"oops"})).err(),
        Some(2)
    );
    assert_eq!(
        seed.create(json!({"numberingSystem":"arab"})).err(),
        Some(2)
    );
}
#[test]
fn abi_unit_updates_reach_existing_instances_without_replacing_number_data() {
    let (registry, seed) = loaded();
    let model = seed
        .create(json!({"style":"unit","unit":"meter","unitDisplay":"long"}))
        .ok()
        .unwrap();
    assert_eq!(model.format("2", false), json!("2 meters"));
    let update = json!({"locale":"en","data":{"simple":{"meter":{"long":{"one":"{0} rod","other":"{0} rods"},"short":{"other":"{0} r"},"narrow":{"other":"{0}r"}}},"compound":{}}}).to_string();
    assert_eq!(
        unsafe { formatjs_number_registry_units(registry.0, update.as_ptr(), update.len()) },
        0
    );
    assert_eq!(model.format("2", false), json!("2 rods"));
    drop(registry);
    assert_eq!(model.format("1", false), json!("1 rod"));
}
#[test]
fn abi_ranges_and_parts_keep_sources_and_reject_nan() {
    let (_registry, model) = loaded();
    let parts = model
        .query(json!({"method":"formatRangeToParts","start":{"text":"1"},"end":{"text":"2"}}))
        .unwrap();
    assert_eq!(
        parts,
        json!([
            {"type":"integer","value":"1","source":"startRange"},
            {"type":"literal","value":"–","source":"shared"},
            {"type":"integer","value":"2","source":"endRange"}
        ])
    );
    assert_eq!(
        model.query(json!({"method":"formatRange","start":{"text":"invalid"},"end":{"text":"2"}})),
        Err(1)
    );
    let scientific = model.create(json!({"notation":"scientific"})).ok().unwrap();
    let parts = scientific
        .query(json!({"method":"formatToParts","value":{"text":"1234"}}))
        .unwrap();
    assert_eq!(
        parts,
        json!([
            {"type":"integer","value":"1"},{"type":"decimal","value":"."},
            {"type":"fraction","value":"234"},{"type":"exponentSeparator","value":"E"},
            {"type":"exponentInteger","value":"3"}
        ])
    );
}
#[test]
fn abi_support_and_protocol_validation_return_owned_or_empty_results() {
    let (registry, model) = loaded();
    let request = json!({"locales":["en-US-u-nu-arab","fr","EN-us-u-nu-arab"]}).to_string();
    let mut out = NumberBytes {
        data: ptr::null_mut(),
        len: 0,
    };
    assert_eq!(
        unsafe { formatjs_number_supported(registry.0, request.as_ptr(), request.len(), &mut out) },
        0
    );
    assert_eq!(unsafe { decoded(out) }, json!(["en-US-u-nu-arab"]));
    assert_eq!(model.query(json!({"method":"unknown"})), Err(2));
    assert_eq!(
        model.query(json!({"method":"format","value":{"text":123}})),
        Err(2)
    );
    out = NumberBytes {
        data: ptr::dangling_mut(),
        len: 42,
    };
    assert_eq!(
        unsafe { formatjs_number_query(ptr::null(), ptr::null(), 0, &mut out) },
        2
    );
    assert!(out.data.is_null());
    assert_eq!(out.len, 0);
    let invalid = [0xff];
    assert_eq!(
        unsafe { formatjs_number_query(model.0, invalid.as_ptr(), 1, &mut out) },
        2
    );
    assert!(out.data.is_null());
    assert_eq!(out.len, 0);
    assert_eq!(
        unsafe { formatjs_number_query(model.0, ptr::null(), usize::MAX, &mut out) },
        2
    );
    assert_eq!(
        unsafe { formatjs_number_registry_create(ptr::null_mut()) },
        2
    );
}

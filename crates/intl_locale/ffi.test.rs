use std::ptr;

use formatjs_intl_locale::ffi::*;
use serde_json::{Value, json};

struct Handle(*mut LocaleHandle);
impl Handle {
    fn new(tag: &str, options: Value) -> Self {
        let options = options.to_string();
        let mut handle = ptr::null_mut();
        assert_eq!(
            unsafe {
                formatjs_locale_create(
                    tag.as_ptr(),
                    tag.len(),
                    options.as_ptr(),
                    options.len(),
                    &mut handle,
                )
            },
            0
        );
        assert!(!handle.is_null());
        Self(handle)
    }
    fn query(&self, query: Value) -> Value {
        let query = query.to_string();
        let mut out = LocaleBytes {
            data: ptr::null_mut(),
            len: 0,
        };
        assert_eq!(
            unsafe { formatjs_locale_query(self.0, query.as_ptr(), query.len(), &mut out) },
            0
        );
        let value =
            serde_json::from_slice(unsafe { std::slice::from_raw_parts(out.data, out.len) })
                .unwrap();
        unsafe {
            formatjs_locale_bytes_free(out);
        }
        value
    }
    fn transform(&self, kind: u32) -> Self {
        let mut handle = ptr::null_mut();
        assert_eq!(
            unsafe { formatjs_locale_transform(self.0, kind, &mut handle) },
            0
        );
        assert!(!handle.is_null());
        Self(handle)
    }
}
impl Drop for Handle {
    fn drop(&mut self) {
        unsafe {
            formatjs_locale_destroy(self.0);
        }
    }
}

#[test]
fn extension_payloads_survive_transforms_and_unicode_updates() {
    let tag = "en-a-first-second-u-attr-ca-buddhist-kn-x-one-two";
    let locale = Handle::new(tag, json!({"calendar": "gregory", "numeric": false}));
    let suffix = "-a-first-second-u-attr-ca-gregory-kn-false-x-one-two";
    assert_eq!(
        locale.query(json!({"method": "properties"}))["locale"],
        format!("en{suffix}")
    );
    let maximized = locale.transform(0);
    assert_eq!(
        maximized.query(json!({"method": "properties"}))["locale"],
        format!("en-Latn-US{suffix}")
    );
    assert_eq!(
        maximized
            .transform(1)
            .query(json!({"method": "properties"}))["locale"],
        format!("en{suffix}")
    );
}

#[test]
fn owned_record_preserves_canonical_properties() {
    let locale = Handle::new("iw-BU", json!({"calendar":"islamicc", "numeric":true}));
    let properties = locale.query(json!({"method":"properties"}));
    assert_eq!(properties["locale"], "he-MM-u-ca-islamic-civil-kn");
    assert_eq!(properties["calendar"], "islamic-civil");
    assert_eq!(properties["numeric"], true);
    assert_eq!(properties["script"], Value::Null);
    assert_eq!(
        locale.query(json!({"method":"maximize"})),
        "he-Hebr-MM-u-ca-islamic-civil-kn"
    );
    let maximized = locale.transform(0);
    assert_eq!(
        maximized.query(json!({"method":"properties"}))["locale"],
        "he-Hebr-MM-u-ca-islamic-civil-kn"
    );
    assert_eq!(
        maximized.transform(1).query(json!({"method":"properties"}))["locale"],
        "he-MM-u-ca-islamic-civil-kn"
    );
    assert_eq!(
        locale.query(json!({"method":"properties"}))["locale"],
        "he-MM-u-ca-islamic-civil-kn"
    );
    assert_eq!(
        locale.query(json!({"method":"textInfo"})),
        json!({"direction":"rtl"})
    );
}

#[test]
fn query_observes_new_formatter_data_without_recreating_record() {
    let locale = Handle::new("ar", json!({}));
    assert_eq!(
        locale.query(json!({"method":"numberingSystems"})),
        json!(["latn"])
    );
    assert_eq!(
        locale.query(json!({"method":"numberingSystems","defaultNumberingSystem":"arab"})),
        json!(["arab"])
    );
    assert_eq!(
        locale.query(
            json!({"method":"collations","globalCollations":[],"matched":false,"accepted":[]})
        ),
        json!(["emoji", "eor"])
    );
    assert_eq!(locale.query(json!({"method":"collations","globalCollations":["emoji","eor","search"],"matched":true,"accepted":["emoji","search"]})), json!(["emoji"]));
    let explicit = Handle::new("ar-u-nu-thai-co-phonebk", json!({}));
    assert_eq!(
        explicit.query(json!({"method":"numberingSystems","defaultNumberingSystem":"arab"})),
        json!(["thai"])
    );
    assert_eq!(
        explicit.query(
            json!({"method":"collations","globalCollations":[],"matched":false,"accepted":[]})
        ),
        json!(["phonebk"])
    );
}

#[test]
fn abi_rejects_invalid_inputs_and_clears_outputs() {
    let mut handle = ptr::null_mut();
    let options = b"{}";
    assert_eq!(
        unsafe {
            formatjs_locale_create(
                b"en_US".as_ptr(),
                5,
                options.as_ptr(),
                options.len(),
                &mut handle,
            )
        },
        1
    );
    assert!(handle.is_null());
    assert_eq!(
        unsafe { formatjs_locale_create(b"en".as_ptr(), 2, b"null".as_ptr(), 4, &mut handle) },
        2
    );
    let locale = Handle::new("en", json!({}));
    handle = 1usize as *mut LocaleHandle;
    assert_eq!(
        unsafe { formatjs_locale_transform(locale.0, 2, &mut handle) },
        2
    );
    assert!(handle.is_null());
    assert_eq!(
        unsafe { formatjs_locale_transform(ptr::null(), 0, &mut handle) },
        2
    );
    assert!(handle.is_null());
    assert_eq!(
        unsafe { formatjs_locale_transform(locale.0, 0, ptr::null_mut()) },
        2
    );
    assert_eq!(
        unsafe {
            formatjs_locale_create(ptr::null(), 1, options.as_ptr(), options.len(), &mut handle)
        },
        2
    );
    assert_eq!(
        unsafe {
            formatjs_locale_create(
                b"en".as_ptr(),
                2,
                options.as_ptr(),
                options.len(),
                ptr::null_mut(),
            )
        },
        2
    );
    assert_eq!(
        unsafe { formatjs_locale_validate(b"hourCycle".as_ptr(), 9, b"H12".as_ptr(), 3) },
        1
    );
    assert_eq!(
        unsafe { formatjs_locale_validate(b"hourCycle".as_ptr(), 9, b"h12".as_ptr(), 3) },
        0
    );
    assert_eq!(
        unsafe { formatjs_locale_validate(b"region".as_ptr(), 6, [0xff].as_ptr(), 1) },
        2
    );
    let locale = Handle::new("en", json!({}));
    let mut out = LocaleBytes {
        data: ptr::null_mut(),
        len: 99,
    };
    assert_eq!(
        unsafe { formatjs_locale_query(locale.0, b"{}".as_ptr(), 2, &mut out) },
        2
    );
    assert!(out.data.is_null());
    assert_eq!(out.len, 0);
    assert_eq!(
        unsafe { formatjs_locale_query(ptr::null(), b"{}".as_ptr(), 2, &mut out) },
        2
    );
    unsafe {
        formatjs_locale_destroy(ptr::null_mut());
        formatjs_locale_bytes_free(out);
    }
}

#[test]
fn query_results_have_independent_ownership() {
    let locale = Handle::new("en-US", json!({}));
    let query = br#"{"method":"timeZones"}"#;
    let mut first = LocaleBytes {
        data: ptr::null_mut(),
        len: 0,
    };
    let mut second = LocaleBytes {
        data: ptr::null_mut(),
        len: 0,
    };
    unsafe {
        assert_eq!(
            formatjs_locale_query(locale.0, query.as_ptr(), query.len(), &mut first),
            0
        );
        assert_eq!(
            formatjs_locale_query(locale.0, query.as_ptr(), query.len(), &mut second),
            0
        );
        assert_ne!(first.data, second.data);
        formatjs_locale_bytes_free(first);
        let zones: Vec<String> =
            serde_json::from_slice(std::slice::from_raw_parts(second.data, second.len)).unwrap();
        assert!(zones.iter().any(|zone| zone == "America/New_York"));
        assert_eq!(
            zones
                .iter()
                .filter(|zone| zone.as_str() == "America/Denver")
                .count(),
            1
        );
        formatjs_locale_bytes_free(second);
    }
}

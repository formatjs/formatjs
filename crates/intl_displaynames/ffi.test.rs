use formatjs_intl_displaynames::ffi::*;
use serde_json::{Value, json};
use std::{ptr, slice};

fn pack(name: &str) -> String {
    let language = json!({"long":{"en":name},"short":{},"narrow":{}});
    let empty = json!({"long":{},"short":{},"narrow":{}});
    json!({"formatVersion":1,"locale":"en","data":{"types":{"language":{"dialect":language,"standard":language},"region":empty,"script":empty,"currency":empty,"calendar":empty,"dateTimeField":empty},"patterns":{"locale":"{0} ({1})"}}}).to_string()
}
fn empty() -> DisplayBytes {
    DisplayBytes {
        data: ptr::null_mut(),
        len: 0,
    }
}
unsafe fn decoded(bytes: DisplayBytes) -> Value {
    let result =
        serde_json::from_slice(unsafe { slice::from_raw_parts(bytes.data, bytes.len) }).unwrap();
    unsafe { formatjs_display_bytes_free(bytes) };
    result
}

#[test]
fn owned_instances_survive_replacement_and_registry_destruction() {
    unsafe {
        let mut registry = ptr::null_mut();
        assert_eq!(formatjs_display_registry_create(&mut registry), 0);
        let source = pack("English");
        assert_eq!(
            formatjs_display_registry_load(registry, source.as_ptr(), source.len()),
            0
        );
        drop(source);
        let options = br#"{"type":"language","fallback":"none"}"#;
        let mut handle = ptr::null_mut();
        assert_eq!(
            formatjs_display_create(
                registry,
                b"en".as_ptr(),
                2,
                options.as_ptr(),
                options.len(),
                &mut handle
            ),
            0
        );
        let source = pack("changed");
        assert_eq!(
            formatjs_display_registry_load(registry, source.as_ptr(), source.len()),
            0
        );
        formatjs_display_registry_destroy(registry);
        for (query, expected) in [
            (r#"{"method":"of","code":[101,110]}"#, json!("English")),
            (r#"{"method":"of","code":[122,122]}"#, Value::Null),
            (
                r#"{"method":"resolvedOptions"}"#,
                json!({"locale":"en","style":"long","type":"language","fallback":"none","languageDisplay":"dialect"}),
            ),
        ] {
            let mut out = empty();
            assert_eq!(
                formatjs_display_query(handle, query.as_ptr(), query.len(), &mut out),
                0
            );
            assert_eq!(decoded(out), expected);
        }
        formatjs_display_destroy(handle);
    }
}

#[test]
fn malformed_utf16_is_a_range_error_and_invalid_abi_clears_output() {
    unsafe {
        let mut registry = ptr::null_mut();
        assert_eq!(formatjs_display_registry_create(&mut registry), 0);
        assert_eq!(
            formatjs_display_registry_load(registry, [255].as_ptr(), 1),
            2
        );
        let source = pack("English");
        assert_eq!(
            formatjs_display_registry_load(registry, source.as_ptr(), source.len()),
            0
        );
        let mut handle = ptr::null_mut();
        assert_eq!(
            formatjs_display_create(registry, b"en".as_ptr(), 2, b"{}".as_ptr(), 2, &mut handle),
            4
        );
        assert!(handle.is_null());
        let options = br#"{"type":"language"}"#;
        assert_eq!(
            formatjs_display_create(
                registry,
                b"en".as_ptr(),
                2,
                options.as_ptr(),
                options.len(),
                &mut handle
            ),
            0
        );
        for (query, status) in [
            (r#"{"method":"of","code":[55296]}"#, 1),
            (r#"{"method":"of","code":[56320]}"#, 1),
            (r#"{"method":"of","code":[101,110,10]}"#, 1),
            (r#"{"method":"of","code":[65536]}"#, 2),
            (r#"{"method":"of","code":"en"}"#, 2),
        ] {
            let mut out = DisplayBytes {
                data: ptr::dangling_mut(),
                len: 99,
            };
            assert_eq!(
                formatjs_display_query(handle, query.as_ptr(), query.len(), &mut out),
                status
            );
            assert!(out.data.is_null());
            assert_eq!(out.len, 0);
        }
        let mut out = empty();
        assert_eq!(
            formatjs_display_query(handle, ptr::null(), usize::MAX, &mut out),
            2
        );
        formatjs_display_destroy(handle);
        formatjs_display_registry_destroy(registry);
        formatjs_display_destroy(ptr::null_mut());
        formatjs_display_registry_destroy(ptr::null_mut());
        formatjs_display_bytes_free(empty());
    }
}

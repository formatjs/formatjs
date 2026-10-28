use formatjs_intl_listformat::ffi::*;
use serde_json::{Value, json};
use std::{ptr, slice};

fn pack(pair: &str) -> String {
    let template = json!({"pair":pair,"start":"{0}, {1}","middle":"{0}, {1}","end":"{0}, and {1}"});
    let styles = json!({"long":template,"short":template,"narrow":template});
    json!({"formatVersion":1,"locale":"en","data":{"conjunction":styles,"disjunction":styles,"unit":styles}}).to_string()
}
unsafe fn decoded(bytes: ListBytes) -> Value {
    let result =
        serde_json::from_slice(unsafe { slice::from_raw_parts(bytes.data, bytes.len) }).unwrap();
    unsafe { formatjs_list_bytes_free(bytes) };
    result
}
fn empty() -> ListBytes {
    ListBytes {
        data: ptr::null_mut(),
        len: 0,
    }
}

#[test]
fn handles_own_payloads_and_outputs_preserve_utf16_after_registry_destruction() {
    unsafe {
        let mut registry = ptr::null_mut();
        assert_eq!(formatjs_list_registry_create(&mut registry), 0);
        let source = pack("{0} and {1}");
        assert_eq!(
            formatjs_list_registry_load(registry, source.as_ptr(), source.len()),
            0
        );
        drop(source);
        let mut handle = ptr::null_mut();
        assert_eq!(
            formatjs_list_create(registry, b"en".as_ptr(), 2, b"{}".as_ptr(), 2, &mut handle),
            0
        );
        let replacement = pack("{0} & {1}");
        assert_eq!(
            formatjs_list_registry_load(registry, replacement.as_ptr(), replacement.len()),
            0
        );
        formatjs_list_registry_destroy(registry);
        let query = br#"{"method":"formatToParts","list":[[55296],[56320,0]]}"#;
        let mut out = empty();
        assert_eq!(
            formatjs_list_query(handle, query.as_ptr(), query.len(), &mut out),
            0
        );
        assert_eq!(
            decoded(out),
            json!([
                {"type":"element","value":[55296]},
                {"type":"literal","value":[32,97,110,100,32]},
                {"type":"element","value":[56320,0]}
            ])
        );
        let query = br#"{"method":"resolvedOptions"}"#;
        let mut out = empty();
        assert_eq!(
            formatjs_list_query(handle, query.as_ptr(), query.len(), &mut out),
            0
        );
        assert_eq!(
            decoded(out),
            json!({"locale":"en","type":"conjunction","style":"long"})
        );
        formatjs_list_destroy(handle);
    }
}

#[test]
fn invalid_input_clears_output_and_failed_load_is_atomic() {
    unsafe {
        let mut registry = ptr::null_mut();
        assert_eq!(formatjs_list_registry_create(&mut registry), 0);
        assert_eq!(formatjs_list_registry_load(registry, [255].as_ptr(), 1), 2);
        assert_eq!(formatjs_list_registry_load(registry, ptr::null(), 1), 2);
        assert_eq!(
            formatjs_list_registry_load(registry, ptr::null(), usize::MAX),
            2
        );
        let bad = pack("{0} {0}");
        assert_eq!(
            formatjs_list_registry_load(registry, bad.as_ptr(), bad.len()),
            1
        );
        let mut out = empty();
        assert_eq!(formatjs_list_registry_info(registry, &mut out), 0);
        assert_eq!(decoded(out), json!({"available":[],"default":null}));
        let valid = pack("{0} {1}");
        assert_eq!(
            formatjs_list_registry_load(registry, valid.as_ptr(), valid.len()),
            0
        );
        let mut handle = ptr::null_mut();
        let invalid = br#"{"style":"invalid"}"#;
        assert_eq!(
            formatjs_list_create(
                registry,
                b"en".as_ptr(),
                2,
                invalid.as_ptr(),
                invalid.len(),
                &mut handle
            ),
            1
        );
        assert!(handle.is_null());
        assert_eq!(
            formatjs_list_create(registry, b"en".as_ptr(), 2, b"{}".as_ptr(), 2, &mut handle),
            0
        );
        for query in [
            br#"{"method":"format","list":[[65536]]}"#.as_slice(),
            br#"{"method":"format","list":[[-1]]}"#,
            br#"{"method":"format","list":["text"]}"#,
        ] {
            let mut out = ListBytes {
                data: ptr::dangling_mut(),
                len: 99,
            };
            assert_eq!(
                formatjs_list_query(handle, query.as_ptr(), query.len(), &mut out),
                2
            );
            assert!(out.data.is_null());
            assert_eq!(out.len, 0);
        }
        formatjs_list_destroy(handle);
        formatjs_list_registry_destroy(registry);
        formatjs_list_destroy(ptr::null_mut());
        formatjs_list_registry_destroy(ptr::null_mut());
        formatjs_list_bytes_free(empty());
    }
}

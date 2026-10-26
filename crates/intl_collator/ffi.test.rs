use formatjs_intl_collator::ffi::*;
use serde_json::{Value, json};
use std::{ptr, slice};
fn empty() -> CollatorBytes {
    CollatorBytes {
        data: ptr::null_mut(),
        len: 0,
    }
}
unsafe fn decoded(out: &mut CollatorBytes) -> Value {
    let bytes = std::mem::replace(out, empty());
    let result =
        serde_json::from_slice(unsafe { slice::from_raw_parts(bytes.data, bytes.len) }).unwrap();
    unsafe {
        formatjs_collator_bytes_free(bytes);
    }
    result
}
#[test]
fn owned_model_retains_options_and_exact_utf16_after_inputs_drop() {
    unsafe {
        let source = json!({"locales":["en-u-kn"],"options":{"caseFirst":"upper"}}).to_string();
        let mut handle = ptr::null_mut();
        assert_eq!(
            formatjs_collator_create(source.as_ptr(), source.len(), &mut handle),
            0
        );
        drop(source);
        for (query, expected) in [
            (
                json!({"method":"compare","left":[0xd800],"right":[0xdc00]}),
                json!(-1),
            ),
            (
                json!({"method":"compare","left":[0xd800],"right":[0xfffd]}),
                json!(1),
            ),
            (
                json!({"method":"compare","left":[120,50],"right":[120,49,48]}),
                json!(-1),
            ),
        ] {
            let source = query.to_string();
            let mut out = empty();
            assert_eq!(
                formatjs_collator_query(handle, source.as_ptr(), source.len(), &mut out),
                0
            );
            assert_eq!(decoded(&mut out), expected);
        }
        let query = br#"{"method":"resolvedOptions"}"#;
        let mut out = empty();
        assert_eq!(
            formatjs_collator_query(handle, query.as_ptr(), query.len(), &mut out),
            0
        );
        let options = decoded(&mut out);
        assert_eq!(options["numeric"], true);
        assert_eq!(options["caseFirst"], "upper");
        formatjs_collator_destroy(handle);
    }
}
#[test]
fn defaults_supported_tags_and_malformed_inputs_have_distinct_statuses() {
    unsafe {
        let source = br#"{"locales":["th"],"options":{}}"#;
        let mut out = empty();
        assert_eq!(
            formatjs_collator_resolve(source.as_ptr(), source.len(), &mut out),
            0
        );
        assert_eq!(decoded(&mut out)["ignorePunctuation"], true);
        let source = br#"["en-US-u-kn","zz-ZZ"]"#;
        assert_eq!(
            formatjs_collator_supported(source.as_ptr(), source.len(), &mut out),
            0
        );
        assert_eq!(decoded(&mut out), json!(["en-US-u-kn"]));
        let mut handle = ptr::null_mut();
        for (source, status) in [
            (r#"{"locales":["en_US"]}"#, 1),
            (r#"{"locales":[],"options":{"collation":"en_US"}}"#, 1),
            ("null", 2),
            ("{}", 2),
        ] {
            assert_eq!(
                formatjs_collator_create(source.as_ptr(), source.len(), &mut handle),
                status
            );
            assert!(handle.is_null());
        }
        assert_eq!(formatjs_collator_resolve(ptr::null(), 1, &mut out), 2);
        assert_eq!(
            formatjs_collator_resolve(ptr::null(), usize::MAX, &mut out),
            2
        );
        assert!(out.data.is_null());
        assert_eq!(
            formatjs_collator_query(ptr::null(), ptr::null(), 0, &mut out),
            2
        );
        formatjs_collator_destroy(ptr::null_mut());
        formatjs_collator_bytes_free(empty());
    }
}

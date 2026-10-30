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

#[test]
fn direct_format_preserves_unpaired_surrogates_and_rejects_bad_slices() {
    unsafe {
        let mut registry = ptr::null_mut();
        assert_eq!(formatjs_list_registry_create(&mut registry), 0);
        let data = pack("{0} and {1}");
        assert_eq!(
            formatjs_list_registry_load(registry, data.as_ptr(), data.len()),
            0
        );
        let mut handle = ptr::null_mut();
        assert_eq!(
            formatjs_list_create(registry, b"en".as_ptr(), 2, b"{}".as_ptr(), 2, &mut handle),
            0
        );
        let first = [0xd800];
        let second = [b'b' as u16];
        let items = [
            ListSlice {
                data: first.as_ptr(),
                len: first.len(),
            },
            ListSlice {
                data: second.as_ptr(),
                len: second.len(),
            },
        ];
        let mut out = ListUnits {
            data: ptr::null_mut(),
            len: 0,
        };
        assert_eq!(
            formatjs_list_format(handle, items.as_ptr(), items.len(), &mut out),
            0
        );
        assert_eq!(
            slice::from_raw_parts(out.data, out.len),
            &[0xd800, 32, 97, 110, 100, 32, 98]
        );
        formatjs_list_units_free(out);
        let mut out = ListUnits {
            data: ptr::null_mut(),
            len: 0,
        };
        assert_eq!(
            formatjs_list_parts(handle, items.as_ptr(), items.len(), &mut out),
            0
        );
        assert_eq!(
            slice::from_raw_parts(out.data, out.len),
            &[0, 0, 1, 0xd800, 1, 0, 5, 32, 97, 110, 100, 32, 0, 0, 1, 98,]
        );
        formatjs_list_units_free(out);
        let invalid = [ListSlice {
            data: ptr::null(),
            len: 1,
        }];
        let mut out = ListUnits {
            data: ptr::dangling_mut(),
            len: 99,
        };
        assert_eq!(
            formatjs_list_format(handle, invalid.as_ptr(), 1, &mut out),
            2
        );
        assert!(out.data.is_null());
        assert_eq!(out.len, 0);
        assert_eq!(
            formatjs_list_parts(handle, items.as_ptr(), isize::MAX as usize, &mut out),
            2
        );
        assert!(out.data.is_null());
        formatjs_list_destroy(handle);
        formatjs_list_registry_destroy(registry);
    }
}

#[test]
fn default_constructor_negotiates_and_owns_data_without_registry_or_inputs() {
    unsafe {
        let mut registry = ptr::null_mut();
        assert_eq!(formatjs_list_registry_create(&mut registry), 0);
        let english = pack("{0} and {1}");
        assert_eq!(
            formatjs_list_registry_load(registry, english.as_ptr(), english.len()),
            0
        );
        let mut french: Value = serde_json::from_str(&pack("{0} et {1}")).unwrap();
        french["locale"] = json!("fr");
        let french = french.to_string();
        assert_eq!(
            formatjs_list_registry_load(registry, french.as_ptr(), french.len()),
            0
        );
        let mut retained = Vec::new();
        for (requested, locale, output) in [
            (json!([]), "en", "A and B"),
            (json!(["en-XX"]), "en", "A and B"),
            (json!(["qzz"]), "en", "A and B"),
            (json!(["fr-CA", "en"]), "fr", "A et B"),
            (json!(["qzz", "fr-u-nu-latn"]), "fr", "A et B"),
        ] {
            let input = requested.to_string();
            let mut handle = ptr::null_mut();
            assert_eq!(
                formatjs_list_create_default(registry, input.as_ptr(), input.len(), &mut handle),
                0
            );
            retained.push((handle, locale, output));
        }
        let replacement = pack("{0} & {1}");
        assert_eq!(
            formatjs_list_registry_load(registry, replacement.as_ptr(), replacement.len()),
            0
        );
        formatjs_list_registry_destroy(registry);
        for (handle, locale, expected) in retained {
            let query = br#"{"method":"resolvedOptions"}"#;
            let mut out = empty();
            assert_eq!(
                formatjs_list_query(handle, query.as_ptr(), query.len(), &mut out),
                0
            );
            assert_eq!(
                decoded(out),
                json!({"locale":locale,"type":"conjunction","style":"long"})
            );
            let query = br#"{"method":"format","list":[[65],[66]]}"#;
            let mut out = empty();
            assert_eq!(
                formatjs_list_query(handle, query.as_ptr(), query.len(), &mut out),
                0
            );
            assert_eq!(
                decoded(out),
                json!(expected.encode_utf16().collect::<Vec<_>>())
            );
            formatjs_list_destroy(handle);
        }
    }
}

#[test]
fn default_constructor_clears_failed_outputs() {
    unsafe {
        let mut registry = ptr::null_mut();
        assert_eq!(formatjs_list_registry_create(&mut registry), 0);
        for (requested, expected) in [
            (b"[]".as_slice(), 1),
            (b"{}", 2),
            (b"[17]", 2),
            (b"null", 2),
        ] {
            let mut handle = ptr::dangling_mut();
            assert_eq!(
                formatjs_list_create_default(
                    registry,
                    requested.as_ptr(),
                    requested.len(),
                    &mut handle
                ),
                expected
            );
            assert!(handle.is_null());
        }
        let mut handle = ptr::dangling_mut();
        assert_eq!(
            formatjs_list_create_default(ptr::null(), b"[]".as_ptr(), 2, &mut handle),
            2
        );
        assert!(handle.is_null());
        assert_eq!(
            formatjs_list_create_default(registry, b"[]".as_ptr(), 2, ptr::null_mut()),
            2
        );
        assert_eq!(
            formatjs_list_create_default(registry, ptr::null(), 1, &mut handle),
            2
        );
        assert!(handle.is_null());
        formatjs_list_registry_destroy(registry);
    }
}

#[test]
fn direct_buffers_preserve_empty_and_surrogate_elements_across_capacity_boundary() {
    unsafe {
        let mut registry = ptr::null_mut();
        assert_eq!(formatjs_list_registry_create(&mut registry), 0);
        let data = pack("{0} and {1}");
        assert_eq!(
            formatjs_list_registry_load(registry, data.as_ptr(), data.len()),
            0
        );
        let mut handle = ptr::null_mut();
        assert_eq!(
            formatjs_list_create(registry, b"en".as_ptr(), 2, b"{}".as_ptr(), 2, &mut handle),
            0
        );
        formatjs_list_registry_destroy(registry);
        for size in [0, 1, 7, 8, 9, 32] {
            let values: Vec<Vec<u16>> = (0..size)
                .map(|i| match i % 3 {
                    0 => vec![],
                    1 => vec![0xd800, 0],
                    _ => vec![0xdc00],
                })
                .collect();
            let mut expected = Vec::new();
            let mut expected_parts = Vec::new();
            for (index, value) in values.iter().enumerate() {
                if index != 0 {
                    let separator: Vec<u16> = if index == size - 1 { ", and " } else { ", " }
                        .encode_utf16()
                        .collect();
                    expected.extend_from_slice(&separator);
                    expected_parts.extend([1, 0, separator.len() as u16]);
                    expected_parts.extend(separator);
                }
                expected.extend(value);
                expected_parts.extend([0, 0, value.len() as u16]);
                expected_parts.extend(value);
            }
            let mut slices: Vec<ListSlice> = values
                .iter()
                .map(|v| ListSlice {
                    data: v.as_ptr(),
                    len: v.len(),
                })
                .collect();
            let calls = [formatjs_list_format, formatjs_list_parts];
            for (call, expected) in calls.into_iter().zip([expected, expected_parts]) {
                let mut out = ListUnits {
                    data: ptr::null_mut(),
                    len: 0,
                };
                assert_eq!(call(handle, slices.as_ptr(), slices.len(), &mut out), 0);
                assert_eq!(
                    slice::from_raw_parts(out.data, out.len),
                    expected,
                    "size={size}"
                );
                formatjs_list_units_free(out);
            }
            if let Some(last) = slices.last_mut() {
                last.data = ptr::null();
                last.len = 1;
                for call in [formatjs_list_format, formatjs_list_parts] {
                    let mut out = ListUnits {
                        data: ptr::dangling_mut(),
                        len: 99,
                    };
                    assert_eq!(call(handle, slices.as_ptr(), slices.len(), &mut out), 2);
                    assert!(out.data.is_null() && out.len == 0);
                }
            }
        }
        formatjs_list_destroy(handle);
    }
}

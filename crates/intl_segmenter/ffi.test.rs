use formatjs_intl_segmenter::ffi::*;
use serde_json::{Value, json};
use std::{ptr, slice};
fn empty() -> SegmenterBytes {
    SegmenterBytes {
        data: ptr::null_mut(),
        len: 0,
    }
}
unsafe fn decoded(out: &mut SegmenterBytes) -> Value {
    let bytes = std::mem::replace(out, empty());
    let value =
        serde_json::from_slice(unsafe { slice::from_raw_parts(bytes.data, bytes.len) }).unwrap();
    unsafe {
        formatjs_segmenter_bytes_free(bytes);
    }
    value
}
#[test]
fn cursors_own_input_survive_parents_and_exhaust_independently() {
    unsafe {
        let mut model = ptr::null_mut();
        assert_eq!(
            formatjs_segmenter_create(b"en".as_ptr(), 2, b"{}".as_ptr(), 2, &mut model),
            0
        );
        let input = json!([0xd800, 0x61, 0xd83d, 0xde00, 0xdc00]).to_string();
        let mut segments = ptr::null_mut();
        assert_eq!(
            formatjs_segmenter_segment(model, input.as_ptr(), input.len(), &mut segments),
            0
        );
        drop(input);
        formatjs_segmenter_destroy(model);
        let mut out = empty();
        assert_eq!(formatjs_segments_containing(segments, 3, &mut out), 0);
        assert_eq!(
            decoded(&mut out),
            json!({"index":2,"segment":[0xd83d,0xde00]})
        );
        assert_eq!(formatjs_segments_containing(segments, 5, &mut out), 0);
        assert_eq!(decoded(&mut out), Value::Null);
        let mut span = SegmenterSpan {
            start: 0,
            end: 0,
            word_like: -1,
        };
        assert_eq!(formatjs_segments_containing_span(segments, 3, &mut span), 0);
        assert_eq!((span.start, span.end, span.word_like), (2, 4, -1));
        assert_eq!(formatjs_segments_containing_span(segments, 5, &mut span), 1);
        let mut first = ptr::null_mut();
        let mut second = ptr::null_mut();
        assert_eq!(formatjs_segments_cursor(segments, &mut first), 0);
        assert_eq!(formatjs_segments_cursor(segments, &mut second), 0);
        formatjs_segments_destroy(segments);
        for cursor in [first, second] {
            for (index, units) in [
                (0, vec![0xd800]),
                (1, vec![0x61]),
                (2, vec![0xd83d, 0xde00]),
                (4, vec![0xdc00]),
            ] {
                assert_eq!(formatjs_segment_cursor_next(cursor, &mut out), 0);
                assert_eq!(decoded(&mut out), json!({"index":index,"segment":units}));
            }
            for _ in 0..2 {
                assert_eq!(formatjs_segment_cursor_next(cursor, &mut out), 0);
                assert_eq!(decoded(&mut out), Value::Null);
            }
            formatjs_segment_cursor_destroy(cursor);
        }
    }
}
#[test]
fn word_flags_and_malformed_abi_are_distinct_from_empty_results() {
    unsafe {
        let mut model = ptr::null_mut();
        let options = br#"{"granularity":"word"}"#;
        assert_eq!(
            formatjs_segmenter_create(
                b"en".as_ptr(),
                2,
                options.as_ptr(),
                options.len(),
                &mut model
            ),
            0
        );
        let mut out = empty();
        assert_eq!(formatjs_segmenter_resolved(model, &mut out), 0);
        assert_eq!(
            decoded(&mut out),
            json!({"locale":"en","granularity":"word"})
        );
        let mut segments = ptr::null_mut();
        let units = b"[97,32]";
        assert_eq!(
            formatjs_segmenter_segment(model, units.as_ptr(), units.len(), &mut segments),
            0
        );
        for (index, expected) in [(0, true), (1, false)] {
            assert_eq!(formatjs_segments_containing(segments, index, &mut out), 0);
            assert_eq!(decoded(&mut out)["isWordLike"], json!(expected));
            let mut span = SegmenterSpan {
                start: 0,
                end: 0,
                word_like: -1,
            };
            assert_eq!(
                formatjs_segments_containing_span(segments, index, &mut span),
                0
            );
            assert_eq!(span.word_like, i32::from(expected));
        }
        formatjs_segments_destroy(segments);
        for units in ["[65536]", "[-1]", "[1.5]", "null", "\"abc\""] {
            assert_eq!(
                formatjs_segmenter_segment(model, units.as_ptr(), units.len(), &mut segments),
                2
            );
            assert!(segments.is_null());
        }
        assert_eq!(
            formatjs_segmenter_segment(model, ptr::null(), 1, &mut segments),
            2
        );
        assert_eq!(
            formatjs_segmenter_segment(model, ptr::null(), usize::MAX, &mut segments),
            2
        );
        assert_eq!(formatjs_segmenter_resolved(ptr::null(), &mut out), 2);
        assert!(out.data.is_null());
        assert_eq!(out.len, 0);
        formatjs_segmenter_destroy(model);
        assert_eq!(
            formatjs_segmenter_create(b"en_US".as_ptr(), 5, b"{}".as_ptr(), 2, &mut model),
            1
        );
        assert!(model.is_null());
        assert_eq!(
            formatjs_segmenter_create(b"en".as_ptr(), 2, b"null".as_ptr(), 4, &mut model),
            2
        );
        formatjs_segmenter_destroy(ptr::null_mut());
        formatjs_segments_destroy(ptr::null_mut());
        formatjs_segment_cursor_destroy(ptr::null_mut());
        formatjs_segmenter_bytes_free(empty());
    }
}

#[test]
fn direct_units_preserve_lone_surrogates() {
    unsafe {
        let mut model = ptr::null_mut();
        assert_eq!(
            formatjs_segmenter_create(b"en".as_ptr(), 2, b"{}".as_ptr(), 2, &mut model),
            0
        );
        let input = [0xd800, 0x61, 0xd83d, 0xde00, 0xdc00];
        let mut segments = ptr::null_mut();
        assert_eq!(
            formatjs_segmenter_segment_units(model, input.as_ptr(), input.len(), &mut segments),
            0
        );
        let mut out = empty();
        assert_eq!(formatjs_segments_containing(segments, 4, &mut out), 0);
        assert_eq!(decoded(&mut out), json!({"index":4,"segment":[0xdc00]}));
        let mut cursor = ptr::null_mut();
        assert_eq!(formatjs_segments_cursor(segments, &mut cursor), 0);
        let mut span = SegmenterSpan {
            start: 0,
            end: 0,
            word_like: -1,
        };
        assert_eq!(formatjs_segment_cursor_next_span(cursor, &mut span), 0);
        assert_eq!((span.start, span.end, span.word_like), (0, 1, -1));
        for _ in 0..3 {
            assert_eq!(formatjs_segment_cursor_next_span(cursor, &mut span), 0);
        }
        assert_eq!(formatjs_segment_cursor_next_span(cursor, &mut span), 1);
        formatjs_segment_cursor_destroy(cursor);
        formatjs_segments_destroy(segments);
        assert_eq!(
            formatjs_segmenter_segment_units(model, ptr::null(), 1, &mut segments),
            2
        );
        assert!(segments.is_null());
        formatjs_segmenter_destroy(model);
    }
}
#[test]
fn matching_preserves_supported_extensions_and_default_fallback() {
    unsafe {
        for (request, expected) in [
            (json!({"requested":["zz-ZZ"],"lookup":true}), json!("en")),
            (
                json!({"requested":["en-US-u-nu-arab"],"supported":true}),
                json!(["en-US-u-nu-arab"]),
            ),
        ] {
            let source = request.to_string();
            let mut out = empty();
            assert_eq!(
                formatjs_segmenter_match(source.as_ptr(), source.len(), &mut out),
                0
            );
            assert_eq!(decoded(&mut out), expected);
        }
    }
}

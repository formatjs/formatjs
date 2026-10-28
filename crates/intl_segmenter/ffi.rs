//! Owned UTF-16 segment tables and independent cursors. No runtime pointers cross Rust.
use crate::{Cursor, Options, SegmentData, Segmenter, Segments};
use serde::Deserialize;
use serde_json::{Value, json};
use std::{
    panic::{AssertUnwindSafe, catch_unwind},
    ptr, slice, str,
};

pub struct SegmenterHandle(Segmenter);
pub struct SegmentsHandle(Segments);
pub struct CursorHandle(Cursor);
#[repr(C)]
pub struct SegmenterBytes {
    pub data: *mut u8,
    pub len: usize,
}
impl SegmenterBytes {
    const EMPTY: Self = Self {
        data: ptr::null_mut(),
        len: 0,
    };
}
fn guarded(call: impl FnOnce() -> Result<(), i32>) -> i32 {
    catch_unwind(AssertUnwindSafe(call))
        .map(|result| result.err().unwrap_or(0))
        .unwrap_or(3)
}
unsafe fn input<'a>(data: *const u8, len: usize) -> Result<&'a str, i32> {
    if len > isize::MAX as usize {
        return Err(2);
    }
    if data.is_null() {
        return if len == 0 { Ok("") } else { Err(2) };
    }
    str::from_utf8(unsafe { slice::from_raw_parts(data, len) }).map_err(|_| 2)
}
unsafe fn output(value: Value, out: *mut SegmenterBytes) {
    let bytes = value.to_string().into_bytes().into_boxed_slice();
    let len = bytes.len();
    unsafe {
        out.write(SegmenterBytes {
            data: Box::into_raw(bytes).cast::<u8>(),
            len,
        });
    }
}
fn record(value: Option<SegmentData<'_>>) -> Value {
    let Some(value) = value else {
        return Value::Null;
    };
    // The host retains the original JS input and creates each ordinary record.
    // Units preserve lone surrogates without UTF-8 replacement or JSON escapes.
    let mut result = json!({"segment":value.segment,"index":value.index});
    if let Some(word) = value.is_word_like {
        result["isWordLike"] = json!(word);
    }
    result
}
#[derive(Deserialize)]
struct MatchRequest {
    requested: Vec<String>,
    #[serde(default)]
    lookup: bool,
    #[serde(default)]
    supported: bool,
}

/// Match canonical tags against static Segmenter locales. Status: 0 success,
/// 1 invalid locale/options/data, 2 invalid ABI input, 3 caught panic.
/// # Safety
/// Input is readable for len bytes; out writable. Free successful output once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_segmenter_match(
    data: *const u8,
    len: usize,
    out: *mut SegmenterBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(SegmenterBytes::EMPTY);
    }
    guarded(|| {
        let request: MatchRequest =
            serde_json::from_str(unsafe { input(data, len)? }).map_err(|_| 2)?;
        let result = if request.supported {
            json!(crate::supported_locales(&request.requested).map_err(|_| 1)?)
        } else {
            let options = Options {
                locale_matcher: if request.lookup {
                    crate::LocaleMatcher::Lookup
                } else {
                    crate::LocaleMatcher::BestFit
                },
                ..Default::default()
            };
            json!(
                Segmenter::new(&request.requested, &options)
                    .map_err(|_| 1)?
                    .resolved_options()
                    .locale
            )
        };
        unsafe {
            output(result, out);
        }
        Ok(())
    })
}

/// Construct from a negotiated locale and already coerced options. Borrows nothing.
/// # Safety
/// Strings readable for lengths; out writable. Destroy successful handle once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_segmenter_create(
    locale: *const u8,
    locale_len: usize,
    data: *const u8,
    len: usize,
    out: *mut *mut SegmenterHandle,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(ptr::null_mut());
    }
    guarded(|| {
        let locale = unsafe { input(locale, locale_len)? }.to_owned();
        let value: Value = serde_json::from_str(unsafe { input(data, len)? }).map_err(|_| 2)?;
        if !value.is_object() {
            return Err(2);
        }
        let options: Options = serde_json::from_value(value).map_err(|_| 1)?;
        let model = Segmenter::new(&[locale], &options).map_err(|_| 1)?;
        unsafe {
            out.write(Box::into_raw(Box::new(SegmenterHandle(model))));
        }
        Ok(())
    })
}

/// Return fresh resolved options JSON.
/// # Safety
/// Handle live; out writable. Free output once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_segmenter_resolved(
    handle: *const SegmenterHandle,
    out: *mut SegmenterBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(SegmenterBytes::EMPTY);
    }
    if handle.is_null() {
        return 2;
    }
    guarded(|| {
        unsafe {
            output(
                serde_json::to_value((&*handle).0.resolved_options()).map_err(|_| 2)?,
                out,
            );
        }
        Ok(())
    })
}

/// Copy JSON UTF-16 units into an immutable segment table. Surrogates remain raw.
/// # Safety
/// Model live; input readable for len bytes; out writable. Destroy result once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_segmenter_segment(
    handle: *const SegmenterHandle,
    data: *const u8,
    len: usize,
    out: *mut *mut SegmentsHandle,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(ptr::null_mut());
    }
    if handle.is_null() {
        return 2;
    }
    guarded(|| {
        let units: Vec<u16> = serde_json::from_str(unsafe { input(data, len)? }).map_err(|_| 2)?;
        let segments = unsafe { (&*handle).0.segment(units) };
        unsafe {
            out.write(Box::into_raw(Box::new(SegmentsHandle(segments))));
        }
        Ok(())
    })
}

/// Query a validated nonnegative UTF-16 index; past-end returns JSON null.
/// # Safety
/// Handle live; out writable. Free output once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_segments_containing(
    handle: *const SegmentsHandle,
    index: usize,
    out: *mut SegmenterBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(SegmenterBytes::EMPTY);
    }
    if handle.is_null() {
        return 2;
    }
    guarded(|| {
        unsafe {
            output(record((&*handle).0.containing(index)), out);
        }
        Ok(())
    })
}

/// Create an independent owned cursor, retaining its immutable table.
/// # Safety
/// Segments live; out writable. Destroy result once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_segments_cursor(
    handle: *const SegmentsHandle,
    out: *mut *mut CursorHandle,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(ptr::null_mut());
    }
    if handle.is_null() {
        return 2;
    }
    guarded(|| {
        unsafe {
            out.write(Box::into_raw(Box::new(CursorHandle((&*handle).0.cursor()))));
        }
        Ok(())
    })
}

/// Advance once. JSON null denotes stable exhaustion; only this cursor mutates.
/// # Safety
/// Cursor live and exclusively borrowed; out writable. Free output once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_segment_cursor_next(
    handle: *mut CursorHandle,
    out: *mut SegmenterBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(SegmenterBytes::EMPTY);
    }
    if handle.is_null() {
        return 2;
    }
    guarded(|| {
        unsafe {
            output(record((&mut *handle).0.next_record()), out);
        }
        Ok(())
    })
}

/// # Safety
/// Handle null or live and owned, with no outstanding borrows.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_segmenter_destroy(handle: *mut SegmenterHandle) {
    if !handle.is_null() {
        drop(unsafe { Box::from_raw(handle) });
    }
}
/// # Safety
/// Handle null or live and owned, with no outstanding borrows.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_segments_destroy(handle: *mut SegmentsHandle) {
    if !handle.is_null() {
        drop(unsafe { Box::from_raw(handle) });
    }
}
/// # Safety
/// Handle null or live and owned, with no outstanding borrows.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_segment_cursor_destroy(handle: *mut CursorHandle) {
    if !handle.is_null() {
        drop(unsafe { Box::from_raw(handle) });
    }
}
/// # Safety
/// Bytes empty or an unreleased result from this module.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_segmenter_bytes_free(value: SegmenterBytes) {
    if !value.data.is_null() {
        drop(unsafe { Box::from_raw(ptr::slice_from_raw_parts_mut(value.data, value.len)) });
    }
}

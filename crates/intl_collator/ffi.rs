//! Coerced primitives only. Owned models/output never borrow JS or C++ runtime state.
use crate::{Collator, Options};
use serde::Deserialize;
use serde_json::Value;
use std::{
    panic::{AssertUnwindSafe, catch_unwind},
    ptr, slice, str,
};
pub struct CollatorHandle(Collator);
#[repr(C)]
pub struct CollatorBytes {
    pub data: *mut u8,
    pub len: usize,
}
impl CollatorBytes {
    const EMPTY: Self = Self {
        data: ptr::null_mut(),
        len: 0,
    };
}
fn guarded(call: impl FnOnce() -> Result<(), i32>) -> i32 {
    catch_unwind(AssertUnwindSafe(call))
        .map(|value| value.err().unwrap_or(0))
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
unsafe fn utf16<'a>(data: *const u16, len: usize) -> Result<&'a [u16], i32> {
    if len > isize::MAX as usize / size_of::<u16>() {
        return Err(2);
    }
    if len == 0 {
        return Ok(&[]);
    }
    if data.is_null() || !data.is_aligned() {
        return Err(2);
    }
    Ok(unsafe { slice::from_raw_parts(data, len) })
}
unsafe fn output(value: Value, out: *mut CollatorBytes) {
    let data = value.to_string().into_bytes().into_boxed_slice();
    let len = data.len();
    unsafe {
        out.write(CollatorBytes {
            data: Box::into_raw(data).cast::<u8>(),
            len,
        });
    }
}
#[derive(Deserialize)]
struct Request {
    locales: Vec<String>,
    #[serde(default)]
    options: Options,
}
fn model(request: &str) -> Result<Collator, i32> {
    let request: Request = serde_json::from_str(request).map_err(|_| 2)?;
    Collator::new(&request.locales, &request.options).map_err(|_| 1)
}
/// Resolve locale-dependent defaults before the host reads sensitivity/punctuation.
/// Status: 0 success, 1 invalid locale/options/data, 2 invalid ABI input, 3 panic.
/// # Safety
/// Input readable for len; out writable. Free successful output once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_collator_resolve(
    data: *const u8,
    len: usize,
    out: *mut CollatorBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(CollatorBytes::EMPTY);
    }
    guarded(|| {
        let model = model(unsafe { input(data, len)? })?;
        unsafe {
            output(
                serde_json::to_value(model.resolved_options()).map_err(|_| 2)?,
                out,
            );
        }
        Ok(())
    })
}
/// Create a complete immutable instance after host option reads finish.
/// # Safety
/// Input readable for len; out writable. Destroy successful handle once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_collator_create(
    data: *const u8,
    len: usize,
    out: *mut *mut CollatorHandle,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(ptr::null_mut());
    }
    guarded(|| {
        let model = model(unsafe { input(data, len)? })?;
        unsafe {
            out.write(Box::into_raw(Box::new(CollatorHandle(model))));
        }
        Ok(())
    })
}
/// Filter canonical requested tags using the shared TS support profile.
/// # Safety
/// Input readable for len; out writable. Free successful output once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_collator_supported(
    data: *const u8,
    len: usize,
    out: *mut CollatorBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(CollatorBytes::EMPTY);
    }
    guarded(|| {
        let requested: Vec<String> =
            serde_json::from_str(unsafe { input(data, len)? }).map_err(|_| 2)?;
        let supported = crate::supported_locales(&requested).map_err(|_| 1)?;
        unsafe {
            output(serde_json::to_value(supported).map_err(|_| 2)?, out);
        }
        Ok(())
    })
}
#[derive(Deserialize)]
#[serde(tag = "method", rename_all = "camelCase")]
enum Query {
    ResolvedOptions,
    Compare { left: Vec<u16>, right: Vec<u16> },
}
/// Compare original UTF-16 units, including lone surrogates, or return fresh options.
/// # Safety
/// Model live; input readable for len; out writable. Free successful output once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_collator_query(
    handle: *const CollatorHandle,
    data: *const u8,
    len: usize,
    out: *mut CollatorBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(CollatorBytes::EMPTY);
    }
    if handle.is_null() {
        return 2;
    }
    guarded(|| {
        let query: Query = serde_json::from_str(unsafe { input(data, len)? }).map_err(|_| 2)?;
        let model = unsafe { &(*handle).0 };
        let result = match query {
            Query::ResolvedOptions => {
                serde_json::to_value(model.resolved_options()).map_err(|_| 2)?
            }
            Query::Compare { left, right } => {
                serde_json::to_value(model.compare(&left, &right)).map_err(|_| 2)?
            }
        };
        unsafe {
            output(result, out);
        }
        Ok(())
    })
}
/// Compare borrowed UTF-16 without allocating JSON requests or results.
/// Status: 0 success, 2 invalid ABI input, 3 panic. Errors leave out as zero.
/// # Safety
/// Handle null or live; out null or writable. Valid-size, aligned, non-null
/// input buffers must be readable for their lengths for the duration of the call.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_collator_compare(
    handle: *const CollatorHandle,
    left: *const u16,
    left_len: usize,
    right: *const u16,
    right_len: usize,
    out: *mut i8,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe { out.write(0) };
    if handle.is_null() {
        return 2;
    }
    guarded(|| {
        let left = unsafe { utf16(left, left_len)? };
        let right = unsafe { utf16(right, right_len)? };
        let order = unsafe { (*handle).0.compare(left, right) };
        unsafe { out.write(order) };
        Ok(())
    })
}
/// # Safety
/// Handle null or live and owned, with no outstanding borrows.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_collator_destroy(handle: *mut CollatorHandle) {
    if !handle.is_null() {
        drop(unsafe { Box::from_raw(handle) });
    }
}
/// # Safety
/// Bytes empty or an unreleased result from this module.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_collator_bytes_free(value: CollatorBytes) {
    if !value.data.is_null() {
        drop(unsafe { Box::from_raw(ptr::slice_from_raw_parts_mut(value.data, value.len)) });
    }
}

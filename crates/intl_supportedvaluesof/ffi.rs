//! C ABI for the Hermes adapter. Callbacks borrow runtime observations; Rust
//! copies them before the next callback. No JS or C++ exception may cross ABI.

use std::ffi::c_void;
use std::panic::{AssertUnwindSafe, catch_unwind};
use std::{ptr, slice, str};

use crate::{Observation, supported_values_of};

#[repr(C)]
#[derive(Clone, Copy)]
pub struct BorrowedString {
    pub data: *const u8,
    pub len: usize,
}

impl BorrowedString {
    const EMPTY: Self = Self {
        data: ptr::null(),
        len: 0,
    };
}

#[repr(C)]
pub struct ProbeResult {
    pub resolved: BorrowedString,
    pub formatted: BorrowedString,
}

#[repr(C)]
pub struct ValuesResult {
    pub data: *mut u8,
    pub len: usize,
}

impl ValuesResult {
    const EMPTY: Self = Self {
        data: ptr::null_mut(),
        len: 0,
    };
}

pub type Probe = unsafe extern "C" fn(
    context: *mut c_void,
    key: u32,
    value: BorrowedString,
    locale: BorrowedString,
    out: *mut ProbeResult,
) -> i32;

unsafe fn copy_string(value: BorrowedString) -> Result<Option<String>, ()> {
    if value.data.is_null() {
        return if value.len == 0 { Ok(None) } else { Err(()) };
    }
    let bytes = unsafe { slice::from_raw_parts(value.data, value.len) };
    str::from_utf8(bytes)
        .map(|value| Some(value.to_owned()))
        .map_err(|_| ())
}

/// Returns 0 on success, 1 for an invalid key, 2 for invalid ABI input, 3 on panic.
///
/// # Safety
/// `out` is writable; `key` points to `len` readable bytes. Callback output
/// pointers remain readable until the next callback. Callback returns 0 for
/// observations, 1 for unsupported/formatter errors, 2 for an ABI failure.
/// Callback must not unwind. `context` is passed through without dereferencing.
/// Successful output is owned and must be freed once with `formatjs_values_free`.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_supported_values_of(
    key: *const u8,
    len: usize,
    probe: Option<
        unsafe extern "C" fn(
            *mut c_void,
            u32,
            BorrowedString,
            BorrowedString,
            *mut ProbeResult,
        ) -> i32,
    >,
    context: *mut c_void,
    out: *mut ValuesResult,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe { out.write(ValuesResult::EMPTY) };
    if key.is_null() || probe.is_none() {
        return 2;
    }
    catch_unwind(AssertUnwindSafe(|| {
        let key = match unsafe { str::from_utf8(slice::from_raw_parts(key, len)) } {
            Ok(key) => key,
            Err(_) => return 2,
        };
        let mut invalid = false;
        let values = supported_values_of(key, |key, value, locale| {
            if invalid {
                return None;
            }
            let mut observation = ProbeResult {
                resolved: BorrowedString::EMPTY,
                formatted: BorrowedString::EMPTY,
            };
            let status = unsafe {
                probe.unwrap()(
                    context,
                    key as u32,
                    BorrowedString {
                        data: value.as_ptr(),
                        len: value.len(),
                    },
                    BorrowedString {
                        data: locale.as_ptr(),
                        len: locale.len(),
                    },
                    &mut observation,
                )
            };
            if status == 1 {
                return None;
            }
            if status != 0 {
                invalid = true;
                return None;
            }
            match unsafe {
                (
                    copy_string(observation.resolved),
                    copy_string(observation.formatted),
                )
            } {
                (Ok(resolved), Ok(formatted)) => Some(Observation {
                    resolved,
                    formatted,
                }),
                _ => {
                    invalid = true;
                    None
                }
            }
        });
        if invalid {
            return 2;
        }
        let values = match values {
            Ok(values) => values,
            Err(_) => return 1,
        };
        // Candidate identifiers contain no newlines. This avoids JSON parsing
        // across the ABI; each non-empty UTF-8 line becomes one JSI array entry.
        let mut bytes = values.join("\n").into_bytes().into_boxed_slice();
        if !bytes.is_empty() {
            unsafe {
                out.write(ValuesResult {
                    data: bytes.as_mut_ptr(),
                    len: bytes.len(),
                })
            };
            std::mem::forget(bytes);
        }
        0
    }))
    .unwrap_or(3)
}

/// # Safety
/// `result` is an unfreed successful result from `formatjs_supported_values_of`,
/// or `{null, 0}`. Do not change its pointer or length.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_values_free(result: ValuesResult) {
    if !result.data.is_null() {
        unsafe {
            drop(Box::from_raw(ptr::slice_from_raw_parts_mut(
                result.data,
                result.len,
            )))
        };
    }
}

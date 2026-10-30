//! Owned DisplayNames handles for JSI. Only coerced primitives cross this ABI;
//! no runtime pointers, JS values or C++ exceptions enter Rust.

use crate::{DisplayNames, Error, Options, registry::Registry};
use serde::Deserialize;
use serde_json::{Value, json};
use std::{
    panic::{AssertUnwindSafe, catch_unwind},
    ptr, slice, str,
};

pub struct DisplayRegistry(Registry);
pub struct DisplayHandle(DisplayNames);

#[repr(C)]
pub struct DisplayBytes {
    pub data: *mut u8,
    pub len: usize,
}
impl DisplayBytes {
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
fn status(_: Error) -> i32 {
    1
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
unsafe fn output(value: Value, out: *mut DisplayBytes) {
    let bytes = value.to_string().into_bytes().into_boxed_slice();
    let len = bytes.len();
    let data = Box::into_raw(bytes).cast::<u8>();
    unsafe {
        out.write(DisplayBytes { data, len });
    }
}

fn options(json: &str) -> Result<Options, i32> {
    let value: Value = serde_json::from_str(json).map_err(|_| 2)?;
    if !value.is_object() {
        return Err(2);
    }
    if value.get("type").is_none() {
        return Err(4);
    }
    serde_json::from_value(value).map_err(|_| 1)
}

/// Status: 0 success, 1 RangeError/data error, 2 invalid ABI input, 3 panic.
/// 4 TypeError for missing type. Handles belong to caller; destroy exactly once.
/// # Safety
/// `out` is writable. Registry mutation requires exclusive access to its handle.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_display_registry_create(out: *mut *mut DisplayRegistry) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(ptr::null_mut());
    }
    guarded(|| {
        unsafe {
            out.write(Box::into_raw(Box::new(
                DisplayRegistry(Registry::initial()),
            )));
        }
        Ok(())
    })
}

/// Load one pack atomically. Uses the same status codes as registry_create.
/// # Safety
/// `registry` is live and exclusively borrowed; data is readable for len bytes.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_display_registry_load(
    registry: *mut DisplayRegistry,
    data: *const u8,
    len: usize,
) -> i32 {
    if registry.is_null() {
        return 2;
    }
    guarded(|| unsafe {
        (&mut *registry)
            .0
            .add_locale_data(input(data, len)?)
            .map_err(status)
    })
}

/// Return current available/default locales as fresh owned JSON bytes.
/// # Safety
/// `registry` is live; `out` is writable. Free successful output exactly once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_display_registry_info(
    registry: *const DisplayRegistry,
    out: *mut DisplayBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(DisplayBytes::EMPTY);
    }
    if registry.is_null() {
        return 2;
    }
    guarded(|| {
        let registry = unsafe { &(*registry).0 };
        unsafe {
            output(
                json!({"available":registry.available_locales(),"default":registry.default_locale()}),
                out,
            );
        }
        Ok(())
    })
}

/// Create from an already negotiated AvailableLocales entry and coerced options.
/// The resulting instance does not borrow its registry or input buffers.
/// # Safety
/// Registry is live; string inputs are readable for their lengths; out writable.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_display_create(
    registry: *const DisplayRegistry,
    locale: *const u8,
    locale_len: usize,
    data: *const u8,
    len: usize,
    out: *mut *mut DisplayHandle,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(ptr::null_mut());
    }
    if registry.is_null() {
        return 2;
    }
    guarded(|| {
        let locale = unsafe { input(locale, locale_len)? };
        let options = options(unsafe { input(data, len)? })?;
        let rules = unsafe { (*registry).0.create(locale, &options) }.map_err(status)?;
        unsafe {
            out.write(Box::into_raw(Box::new(DisplayHandle(rules))));
        }
        Ok(())
    })
}

#[derive(Deserialize)]
#[serde(tag = "method", rename_all = "camelCase")]
enum Query {
    ResolvedOptions,
    Of { code: Vec<u16> },
}

#[derive(Deserialize)]
struct MatchRequest {
    requested: Vec<String>,
    #[serde(default)]
    lookup: bool,
    #[serde(default)]
    supported: bool,
}

/// Match already canonicalized requested tags against currently loaded data.
/// # Safety
/// Registry is live; input bytes readable; out writable. Free successful output once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_display_registry_match(
    registry: *const DisplayRegistry,
    data: *const u8,
    len: usize,
    out: *mut DisplayBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(DisplayBytes::EMPTY);
    }
    if registry.is_null() {
        return 2;
    }
    guarded(|| {
        let request: MatchRequest =
            serde_json::from_str(unsafe { input(data, len)? }).map_err(|_| 2)?;
        let registry = unsafe { &(*registry).0 };
        let result = if request.supported {
            json!(registry.supported_locales(&request.requested))
        } else {
            json!(
                registry
                    .negotiate(&request.requested, request.lookup)
                    .map_err(status)?
            )
        };
        unsafe {
            output(result, out);
        }
        Ok(())
    })
}

/// Query an immutable instance. Code input uses UTF-16 units; malformed UTF-16
/// is an invalid code (RangeError), not malformed ABI JSON. Missing names return null.
/// # Safety
/// Handle is live; query bytes readable; out writable. Free successful output once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_display_query(
    handle: *const DisplayHandle,
    data: *const u8,
    len: usize,
    out: *mut DisplayBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(DisplayBytes::EMPTY);
    }
    if handle.is_null() {
        return 2;
    }
    guarded(|| {
        let query: Query = serde_json::from_str(unsafe { input(data, len)? }).map_err(|_| 2)?;
        let rules = unsafe { &(*handle).0 };
        let result = match query {
            Query::ResolvedOptions => {
                serde_json::to_value(rules.resolved_options()).map_err(|_| 2)?
            }
            Query::Of { code } => {
                let code = String::from_utf16(&code).map_err(|_| 1)?;
                json!(rules.of(&code).map_err(status)?)
            }
        };
        unsafe {
            output(result, out);
        }
        Ok(())
    })
}

/// # Safety
/// Registry is null or a live owned handle. No call may still borrow it.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_display_registry_destroy(handle: *mut DisplayRegistry) {
    if !handle.is_null() {
        drop(unsafe { Box::from_raw(handle) });
    }
}
/// # Safety
/// Instance is null or a live owned handle. No call may still borrow it.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_display_destroy(handle: *mut DisplayHandle) {
    if !handle.is_null() {
        drop(unsafe { Box::from_raw(handle) });
    }
}
/// # Safety
/// Value is empty or an unreleased result returned by this module.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_display_bytes_free(value: DisplayBytes) {
    if !value.data.is_null() {
        drop(unsafe { Box::from_raw(ptr::slice_from_raw_parts_mut(value.data, value.len)) });
    }
}

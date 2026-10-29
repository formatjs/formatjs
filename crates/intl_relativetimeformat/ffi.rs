//! Owned handles and JSON results; no JS values or runtime pointers cross Rust.
use crate::{Options, RelativeTimeFormat, Resolution, registry::Registry};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::{
    panic::{AssertUnwindSafe, catch_unwind},
    ptr, slice, str,
};
pub struct RelativeRegistry(Registry);
pub struct RelativeHandle(RelativeTimeFormat);
#[repr(C)]
pub struct RelativeBytes {
    pub data: *mut u8,
    pub len: usize,
}
impl RelativeBytes {
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
fn encode<T: Serialize>(value: &T) -> Result<Vec<u8>, i32> {
    // Serialize structs directly: relative number parts create type/value/unit
    // in that order. Passing through Value would alphabetize unit before value.
    serde_json::to_vec(value).map_err(|_| 2)
}
unsafe fn output(value: Vec<u8>, out: *mut RelativeBytes) {
    let value = value.into_boxed_slice();
    let len = value.len();
    unsafe {
        out.write(RelativeBytes {
            data: Box::into_raw(value).cast::<u8>(),
            len,
        });
    }
}
/// Status: 0 success, 1 RangeError/data error, 2 invalid ABI input, 3 panic.
/// Successful handles and byte results belong to the caller.
/// # Safety
/// Out writable. Registry mutation requires exclusive access.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_relative_registry_create(out: *mut *mut RelativeRegistry) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(ptr::null_mut());
    }
    guarded(|| {
        unsafe {
            out.write(Box::into_raw(Box::new(RelativeRegistry(
                Registry::initial(),
            ))));
        }
        Ok(())
    })
}
/// # Safety
/// Registry live and exclusively borrowed; input readable for len bytes.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_relative_registry_load(
    registry: *mut RelativeRegistry,
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
            .map_err(|_| 1)
    })
}
/// # Safety
/// Registry live; out writable. Free successful output once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_relative_registry_info(
    registry: *const RelativeRegistry,
    out: *mut RelativeBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(RelativeBytes::EMPTY);
    }
    if registry.is_null() {
        return 2;
    }
    guarded(|| {
        let registry = unsafe { &(*registry).0 };
        let bytes = encode(
            &json!({"available":registry.available_locales(),"default":registry.default_locale()}),
        )?;
        unsafe {
            output(bytes, out);
        }
        Ok(())
    })
}
#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
struct LocaleOptions {
    locale_matcher: Option<String>,
    numbering_system: Option<String>,
}
#[derive(Deserialize)]
struct ResolveRequest {
    locales: Vec<String>,
    #[serde(default)]
    options: LocaleOptions,
}
/// Fix locale/nu before the host reads style and numeric. Does not retain fields.
/// # Safety
/// Registry live; input readable for len bytes; out writable. Free output once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_relative_resolve(
    registry: *const RelativeRegistry,
    data: *const u8,
    len: usize,
    out: *mut RelativeBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(RelativeBytes::EMPTY);
    }
    if registry.is_null() {
        return 2;
    }
    guarded(|| {
        let request: ResolveRequest =
            serde_json::from_str(unsafe { input(data, len)? }).map_err(|_| 2)?;
        let options = Options {
            locale_matcher: request.options.locale_matcher,
            numbering_system: request.options.numbering_system,
            ..Default::default()
        };
        let resolution = unsafe { &(*registry).0 }
            .resolve(&request.locales, &options)
            .map_err(|_| 1)?;
        unsafe {
            output(encode(&resolution)?, out);
        }
        Ok(())
    })
}
#[derive(Default, Deserialize)]
#[serde(default)]
struct FormatOptions {
    style: Option<String>,
    numeric: Option<String>,
}
#[derive(Deserialize)]
struct CreateRequest {
    resolution: Resolution,
    #[serde(default)]
    options: FormatOptions,
}
/// Read current fields after host option getters, using the earlier resolution.
/// Result owns its data independently of the registry and input buffers.
/// # Safety
/// Registry live; input readable for len bytes; out writable. Destroy handle once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_relative_create(
    registry: *const RelativeRegistry,
    data: *const u8,
    len: usize,
    out: *mut *mut RelativeHandle,
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
        let request: CreateRequest =
            serde_json::from_str(unsafe { input(data, len)? }).map_err(|_| 2)?;
        let options = Options {
            style: request.options.style,
            numeric: request.options.numeric,
            ..Default::default()
        };
        let model = unsafe { &(*registry).0 }
            .create_resolved(&request.resolution, &options)
            .map_err(|_| 1)?;
        unsafe {
            out.write(Box::into_raw(Box::new(RelativeHandle(model))));
        }
        Ok(())
    })
}
/// # Safety
/// Registry live; input readable canonical locale array; out writable. Free once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_relative_supported(
    registry: *const RelativeRegistry,
    data: *const u8,
    len: usize,
    out: *mut RelativeBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(RelativeBytes::EMPTY);
    }
    if registry.is_null() {
        return 2;
    }
    guarded(|| {
        let requested: Vec<String> =
            serde_json::from_str(unsafe { input(data, len)? }).map_err(|_| 2)?;
        let requested =
            formatjs_intl_getcanonicallocales::get_canonical_locales(&requested).map_err(|_| 1)?;
        let supported = unsafe { &(*registry).0 }.supported_locales(&requested);
        unsafe {
            output(encode(&supported)?, out);
        }
        Ok(())
    })
}
#[derive(Deserialize)]
#[serde(tag = "method", rename_all = "camelCase")]
enum Query {
    ResolvedOptions,
    Format { value: String, unit: Vec<u16> },
    FormatToParts { value: String, unit: Vec<u16> },
}
/// Host performs ToNumber then ToString, including BigInt/Symbol rejection.
/// Unit UTF-16 preserves lone surrogates for RangeError rather than ABI failure.
/// # Safety
/// Handle live; input readable for len bytes; out writable. Free output once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_relative_query(
    handle: *const RelativeHandle,
    data: *const u8,
    len: usize,
    out: *mut RelativeBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(RelativeBytes::EMPTY);
    }
    if handle.is_null() {
        return 2;
    }
    guarded(|| {
        let query: Query = serde_json::from_str(unsafe { input(data, len)? }).map_err(|_| 2)?;
        let model = unsafe { &(*handle).0 };
        let bytes = match query {
            Query::ResolvedOptions => encode(model.resolved_options())?,
            Query::Format { value, unit } => encode(
                &model
                    .format(&value, &String::from_utf16(&unit).map_err(|_| 1)?)
                    .map_err(|_| 1)?,
            )?,
            Query::FormatToParts { value, unit } => encode(
                &model
                    .format_to_parts(&value, &String::from_utf16(&unit).map_err(|_| 1)?)
                    .map_err(|_| 1)?,
            )?,
        };
        unsafe {
            output(bytes, out);
        }
        Ok(())
    })
}

/// Format pre-coerced numeric text and UTF-16 unit without JSON on the hot path.
/// # Safety
/// Handle live; value and unit readable for their lengths; out writable.
/// Free successful output once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_relative_format(
    handle: *const RelativeHandle,
    value: *const u8,
    value_len: usize,
    unit: *const u16,
    unit_len: usize,
    out: *mut RelativeBytes,
) -> i32 {
    unsafe { formatted(handle, value, value_len, unit, unit_len, out, false) }
}

/// Format parts from pre-coerced numeric text and UTF-16 unit; output is JSON.
/// # Safety
/// Handle live; value and unit readable for their lengths; out writable.
/// Free successful output once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_relative_format_to_parts(
    handle: *const RelativeHandle,
    value: *const u8,
    value_len: usize,
    unit: *const u16,
    unit_len: usize,
    out: *mut RelativeBytes,
) -> i32 {
    unsafe { formatted(handle, value, value_len, unit, unit_len, out, true) }
}

unsafe fn formatted(
    handle: *const RelativeHandle,
    value: *const u8,
    value_len: usize,
    unit: *const u16,
    unit_len: usize,
    out: *mut RelativeBytes,
    parts: bool,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe { out.write(RelativeBytes::EMPTY) };
    if handle.is_null()
        || unit_len > isize::MAX as usize / std::mem::size_of::<u16>()
        || (unit_len != 0 && unit.is_null())
    {
        return 2;
    }
    guarded(|| {
        let value = unsafe { input(value, value_len)? };
        let unit = if unit_len == 0 {
            &[][..]
        } else {
            unsafe { slice::from_raw_parts(unit, unit_len) }
        };
        // Supported unit names are ASCII and at most eight code units.
        let mut ascii = [0u8; 8];
        if unit.len() > ascii.len() {
            return Err(1);
        }
        for (out, value) in ascii.iter_mut().zip(unit) {
            *out = u8::try_from(*value).map_err(|_| 1)?;
        }
        let unit = str::from_utf8(&ascii[..unit.len()]).map_err(|_| 1)?;
        let model = unsafe { &(*handle).0 };
        let bytes = if parts {
            encode(&model.format_to_parts(value, unit).map_err(|_| 1)?)?
        } else {
            model.format(value, unit).map_err(|_| 1)?.into_bytes()
        };
        unsafe { output(bytes, out) };
        Ok(())
    })
}
/// # Safety
/// Registry null or live owned handle; no outstanding borrows.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_relative_registry_destroy(handle: *mut RelativeRegistry) {
    if !handle.is_null() {
        drop(unsafe { Box::from_raw(handle) });
    }
}
/// # Safety
/// Instance null or live owned handle; no outstanding borrows.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_relative_destroy(handle: *mut RelativeHandle) {
    if !handle.is_null() {
        drop(unsafe { Box::from_raw(handle) });
    }
}
/// # Safety
/// Value empty or unreleased bytes returned by this module.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_relative_bytes_free(value: RelativeBytes) {
    if !value.data.is_null() {
        drop(unsafe { Box::from_raw(ptr::slice_from_raw_parts_mut(value.data, value.len)) });
    }
}

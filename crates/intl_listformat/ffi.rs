//! Owned ListFormat handles for JSI. Only coerced primitives cross this ABI;
//! no runtime pointers, JS values or C++ exceptions enter Rust.

use crate::{Error, ListFormat, Options, registry::Registry};
use serde::Deserialize;
use serde_json::{Value, json};
use std::{
    borrow::Cow,
    panic::{AssertUnwindSafe, catch_unwind},
    ptr, slice, str,
};

pub struct ListRegistry(Registry);
pub struct ListHandle(ListFormat);

#[repr(C)]
pub struct ListBytes {
    pub data: *mut u8,
    pub len: usize,
}
#[repr(C)]
pub struct ListSlice {
    pub data: *const u16,
    pub len: usize,
}
#[repr(C)]
pub struct ListUnits {
    pub data: *mut u16,
    pub len: usize,
}
impl ListUnits {
    const EMPTY: Self = Self {
        data: ptr::null_mut(),
        len: 0,
    };
}
impl ListBytes {
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
unsafe fn output(value: Value, out: *mut ListBytes) {
    let bytes = value.to_string().into_bytes().into_boxed_slice();
    let len = bytes.len();
    let data = Box::into_raw(bytes).cast::<u8>();
    unsafe {
        out.write(ListBytes { data, len });
    }
}

fn options(json: &str) -> Result<Options, i32> {
    let value: Value = serde_json::from_str(json).map_err(|_| 2)?;
    if !value.is_object() {
        return Err(2);
    }
    serde_json::from_value(value).map_err(|_| 1)
}

/// Status: 0 success, 1 RangeError/data error, 2 invalid ABI input, 3 panic.
/// Successful handles belong to caller and must be destroyed once.
/// # Safety
/// `out` is writable. Registry mutation requires exclusive access to its handle.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_list_registry_create(out: *mut *mut ListRegistry) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(ptr::null_mut());
    }
    guarded(|| {
        unsafe {
            out.write(Box::into_raw(Box::new(ListRegistry(Registry::initial()))));
        }
        Ok(())
    })
}

/// Load one pack atomically. Uses the same status codes as registry_create.
/// # Safety
/// `registry` is live and exclusively borrowed; data is readable for len bytes.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_list_registry_load(
    registry: *mut ListRegistry,
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
pub unsafe extern "C" fn formatjs_list_registry_info(
    registry: *const ListRegistry,
    out: *mut ListBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(ListBytes::EMPTY);
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
pub unsafe extern "C" fn formatjs_list_create(
    registry: *const ListRegistry,
    locale: *const u8,
    locale_len: usize,
    data: *const u8,
    len: usize,
    out: *mut *mut ListHandle,
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
            out.write(Box::into_raw(Box::new(ListHandle(rules))));
        }
        Ok(())
    })
}

/// Negotiate canonical requested tags and create with default type/style.
/// # Safety
/// Registry is live; JSON bytes are readable; out writable. Free the handle once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_list_create_default(
    registry: *const ListRegistry,
    data: *const u8,
    len: usize,
    out: *mut *mut ListHandle,
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
        let requested: Vec<String> =
            serde_json::from_str(unsafe { input(data, len)? }).map_err(|_| 2)?;
        let registry = unsafe { &(*registry).0 };
        let locale = registry.negotiate(&requested, false).map_err(status)?;
        let rules = registry
            .create(&locale, &Options::default())
            .map_err(status)?;
        unsafe {
            out.write(Box::into_raw(Box::new(ListHandle(rules))));
        }
        Ok(())
    })
}

#[derive(Deserialize)]
#[serde(tag = "method", rename_all = "camelCase")]
enum Query {
    ResolvedOptions,
    Format { list: Vec<Vec<u16>> },
    FormatToParts { list: Vec<Vec<u16>> },
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
pub unsafe extern "C" fn formatjs_list_registry_match(
    registry: *const ListRegistry,
    data: *const u8,
    len: usize,
    out: *mut ListBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(ListBytes::EMPTY);
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

/// Query an immutable instance. List elements and output values use UTF-16
/// unit arrays; JSON never decodes application strings as Unicode scalar text.
/// # Safety
/// Handle is live; query bytes readable; out writable. Free successful output once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_list_query(
    handle: *const ListHandle,
    data: *const u8,
    len: usize,
    out: *mut ListBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(ListBytes::EMPTY);
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
            Query::Format { list } => json!(rules.format(&list)),
            Query::FormatToParts { list } => json!(rules.format_to_parts(&list)),
        };
        unsafe {
            output(result, out);
        }
        Ok(())
    })
}

unsafe fn list_values<'a>(
    items: *const ListSlice,
    len: usize,
    inline: &'a mut [&'a [u16]; 8],
) -> Result<Cow<'a, [&'a [u16]]>, i32> {
    if len > isize::MAX as usize / std::mem::size_of::<ListSlice>() || (len != 0 && items.is_null())
    {
        return Err(2);
    }
    let items = if len == 0 {
        &[][..]
    } else {
        unsafe { slice::from_raw_parts(items, len) }
    };
    let read = |item: &ListSlice| {
        if item.len > isize::MAX as usize / std::mem::size_of::<u16>()
            || (item.len != 0 && item.data.is_null())
        {
            return Err(2);
        }
        let units = if item.len == 0 {
            &[][..]
        } else {
            unsafe { slice::from_raw_parts(item.data, item.len) }
        };
        Ok(units)
    };
    if len <= inline.len() {
        for (slot, item) in inline.iter_mut().zip(items) {
            *slot = read(item)?;
        }
        Ok(Cow::Borrowed(&inline[..len]))
    } else {
        let mut values = Vec::with_capacity(len);
        for item in items {
            values.push(read(item)?);
        }
        Ok(Cow::Owned(values))
    }
}

unsafe fn output_units(result: Vec<u16>, out: *mut ListUnits) {
    let result = result.into_boxed_slice();
    let len = result.len();
    unsafe {
        out.write(ListUnits {
            data: Box::into_raw(result).cast(),
            len,
        })
    };
}

/// Format validated string values without JSON or Unicode scalar conversion.
/// # Safety
/// Handle is live; items and their UTF-16 slices are readable; out writable.
/// Free successful output exactly once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_list_format(
    handle: *const ListHandle,
    items: *const ListSlice,
    len: usize,
    out: *mut ListUnits,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe { out.write(ListUnits::EMPTY) };
    if handle.is_null() {
        return 2;
    }
    guarded(|| {
        let mut inline = [&[][..]; 8];
        let values = unsafe { list_values(items, len, &mut inline)? };
        let result = unsafe { &(*handle).0 }.format_borrowed(&values);
        unsafe { output_units(result, out) };
        Ok(())
    })
}

/// Return parts as UTF-16 records: kind, high length, low length, value units.
/// # Safety
/// Same input and output ownership contract as formatjs_list_format.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_list_parts(
    handle: *const ListHandle,
    items: *const ListSlice,
    len: usize,
    out: *mut ListUnits,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe { out.write(ListUnits::EMPTY) };
    if handle.is_null() {
        return 2;
    }
    guarded(|| {
        let mut inline = [&[][..]; 8];
        let values = unsafe { list_values(items, len, &mut inline)? };
        let parts = unsafe { &(*handle).0 }.format_to_parts_borrowed(&values);
        let mut result = Vec::new();
        for part in parts {
            let len = u32::try_from(part.value.len()).map_err(|_| 2)?;
            result.extend_from_slice(&[
                if part.kind == "element" { 0 } else { 1 },
                (len >> 16) as u16,
                len as u16,
            ]);
            result.extend(part.value);
        }
        unsafe { output_units(result, out) };
        Ok(())
    })
}

/// # Safety
/// Value is empty or an unreleased result from formatjs_list_format.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_list_units_free(value: ListUnits) {
    if !value.data.is_null() {
        drop(unsafe { Box::from_raw(ptr::slice_from_raw_parts_mut(value.data, value.len)) });
    }
}

/// # Safety
/// Registry is null or a live owned handle. No call may still borrow it.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_list_registry_destroy(handle: *mut ListRegistry) {
    if !handle.is_null() {
        drop(unsafe { Box::from_raw(handle) });
    }
}
/// # Safety
/// Instance is null or a live owned handle. No call may still borrow it.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_list_destroy(handle: *mut ListHandle) {
    if !handle.is_null() {
        drop(unsafe { Box::from_raw(handle) });
    }
}
/// # Safety
/// Value is empty or an unreleased result returned by this module.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_list_bytes_free(value: ListBytes) {
    if !value.data.is_null() {
        drop(unsafe { Box::from_raw(ptr::slice_from_raw_parts_mut(value.data, value.len)) });
    }
}

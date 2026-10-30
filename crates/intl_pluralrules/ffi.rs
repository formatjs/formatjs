//! Owned PluralRules handles for JSI. Only coerced primitives cross this ABI;
//! no runtime pointers, JS values or C++ exceptions enter Rust.

use crate::{
    Error, digits,
    instance::{Options, PluralRules},
    registry::Registry,
};
use serde::Deserialize;
use serde_json::{Map, Value, json};
use std::{
    panic::{AssertUnwindSafe, catch_unwind},
    ptr, slice, str,
};

pub struct PluralRegistry(Registry);
pub struct PluralHandle(PluralRules);

#[repr(C)]
pub struct PluralBytes {
    pub data: *mut u8,
    pub len: usize,
}
impl PluralBytes {
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
fn status(error: Error) -> i32 {
    match error {
        Error::Digits(digits::Error::Type(_)) => 4,
        _ => 1,
    }
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
unsafe fn output(value: Value, out: *mut PluralBytes) {
    let bytes = value.to_string().into_bytes().into_boxed_slice();
    let len = bytes.len();
    let data = Box::into_raw(bytes).cast::<u8>();
    unsafe {
        out.write(PluralBytes { data, len });
    }
}

fn number(object: &Map<String, Value>, name: &str) -> Result<Option<f64>, i32> {
    let Some(value) = object.get(name) else {
        return Ok(None);
    };
    // JSON cannot encode non-finite Numbers. The private host protocol uses
    // these three strings after ToNumber; inactive digit options stay lazy.
    Ok(Some(match value {
        Value::Number(number) => number.as_f64().ok_or(2)?,
        Value::String(value) if value == "NaN" => f64::NAN,
        Value::String(value) if value == "Infinity" => f64::INFINITY,
        Value::String(value) if value == "-Infinity" => f64::NEG_INFINITY,
        _ => return Err(2),
    }))
}
fn string(object: &Map<String, Value>, name: &str) -> Result<Option<String>, i32> {
    object
        .get(name)
        .map(|value| value.as_str().map(str::to_owned).ok_or(2))
        .transpose()
}
fn options(json: &str) -> Result<Options, i32> {
    let value: Value = serde_json::from_str(json).map_err(|_| 2)?;
    let object = value.as_object().ok_or(2)?;
    Ok(Options {
        kind: string(object, "type")?,
        notation: string(object, "notation")?,
        compact_display: string(object, "compactDisplay")?,
        digits: digits::Options {
            minimum_integer_digits: number(object, "minimumIntegerDigits")?,
            minimum_fraction_digits: number(object, "minimumFractionDigits")?,
            maximum_fraction_digits: number(object, "maximumFractionDigits")?,
            minimum_significant_digits: number(object, "minimumSignificantDigits")?,
            maximum_significant_digits: number(object, "maximumSignificantDigits")?,
            rounding_increment: number(object, "roundingIncrement")?,
            rounding_mode: string(object, "roundingMode")?,
            rounding_priority: string(object, "roundingPriority")?,
            trailing_zero_display: string(object, "trailingZeroDisplay")?,
        },
    })
}

/// Status: 0 success, 1 RangeError/data error, 2 invalid ABI input, 3 panic,
/// 4 TypeError. Successful handles belong to caller and must be destroyed once.
/// # Safety
/// `out` is writable. Registry mutation requires exclusive access to its handle.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_plural_registry_create(out: *mut *mut PluralRegistry) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(ptr::null_mut());
    }
    guarded(|| {
        unsafe {
            out.write(Box::into_raw(Box::new(PluralRegistry(Registry::initial()))));
        }
        Ok(())
    })
}

/// Load one pack atomically. Uses the same status codes as registry_create.
/// # Safety
/// `registry` is live and exclusively borrowed; data is readable for len bytes.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_plural_registry_load(
    registry: *mut PluralRegistry,
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
pub unsafe extern "C" fn formatjs_plural_registry_info(
    registry: *const PluralRegistry,
    out: *mut PluralBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(PluralBytes::EMPTY);
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
pub unsafe extern "C" fn formatjs_plural_create(
    registry: *const PluralRegistry,
    locale: *const u8,
    locale_len: usize,
    data: *const u8,
    len: usize,
    out: *mut *mut PluralHandle,
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
            out.write(Box::into_raw(Box::new(PluralHandle(rules))));
        }
        Ok(())
    })
}

#[derive(Deserialize)]
#[serde(tag = "method", rename_all = "camelCase")]
enum Query {
    ResolvedOptions,
    Select {
        value: String,
        #[serde(default)]
        mathematical: bool,
        #[serde(default)]
        bigint: bool,
    },
    SelectRange {
        start: String,
        end: String,
        #[serde(default)]
        mathematical: bool,
        #[serde(default, rename = "startBigint")]
        start_bigint: bool,
        #[serde(default, rename = "endBigint")]
        end_bigint: bool,
    },
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
pub unsafe extern "C" fn formatjs_plural_registry_match(
    registry: *const PluralRegistry,
    data: *const u8,
    len: usize,
    out: *mut PluralBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(PluralBytes::EMPTY);
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

/// Query an immutable instance. Selection receives normalized decimals or
/// primitive text with mathematical=true; outputs are fresh owned JSON bytes.
/// # Safety
/// Handle is live; query bytes readable; out writable. Free successful output once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_plural_query(
    handle: *const PluralHandle,
    data: *const u8,
    len: usize,
    out: *mut PluralBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(PluralBytes::EMPTY);
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
            Query::Select {
                value,
                mathematical,
                bigint,
            } => json!(
                if mathematical {
                    rules.select_mathematical(&value, bigint)
                } else {
                    rules.select(&value)
                }
                .map_err(status)?
            ),
            Query::SelectRange {
                start,
                end,
                mathematical,
                start_bigint,
                end_bigint,
            } => {
                json!(
                    if mathematical {
                        rules.select_range_mathematical(&start, &end, start_bigint, end_bigint)
                    } else {
                        rules.select_range(&start, &end)
                    }
                    .map_err(status)?
                )
            }
        };
        unsafe {
            output(result, out);
        }
        Ok(())
    })
}

/// Select a plural category from the already coerced mathematical text.
/// # Safety
/// Handle is live; value bytes readable; out writable.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_plural_select(
    handle: *const PluralHandle,
    value: *const u8,
    len: usize,
    bigint: bool,
    out: *mut u8,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe { out.write(255) };
    if handle.is_null() {
        return 2;
    }
    guarded(|| {
        let value = unsafe { input(value, len)? };
        let category = unsafe { &(*handle).0 }
            .select_mathematical(value, bigint)
            .map_err(status)?;
        unsafe { out.write(category_index(category)?) };
        Ok(())
    })
}

fn category_index(category: &str) -> Result<u8, i32> {
    match category {
        "zero" => Ok(0),
        "one" => Ok(1),
        "two" => Ok(2),
        "few" => Ok(3),
        "many" => Ok(4),
        "other" => Ok(5),
        _ => Err(3),
    }
}

/// Select a range category from already coerced mathematical text.
/// Category order: zero, one, two, few, many, other. Errors leave out=255.
/// # Safety
/// Handle live; endpoint bytes readable for their lengths; out writable.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_plural_select_range(
    handle: *const PluralHandle,
    start: *const u8,
    start_len: usize,
    start_bigint: bool,
    end: *const u8,
    end_len: usize,
    end_bigint: bool,
    out: *mut u8,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe { out.write(255) };
    if handle.is_null() {
        return 2;
    }
    guarded(|| {
        let start = unsafe { input(start, start_len)? };
        let end = unsafe { input(end, end_len)? };
        let category = unsafe { &(*handle).0 }
            .select_range_mathematical(start, end, start_bigint, end_bigint)
            .map_err(status)?;
        unsafe { out.write(category_index(category)?) };
        Ok(())
    })
}

/// # Safety
/// Registry is null or a live owned handle. No call may still borrow it.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_plural_registry_destroy(handle: *mut PluralRegistry) {
    if !handle.is_null() {
        drop(unsafe { Box::from_raw(handle) });
    }
}
/// # Safety
/// Instance is null or a live owned handle. No call may still borrow it.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_plural_destroy(handle: *mut PluralHandle) {
    if !handle.is_null() {
        drop(unsafe { Box::from_raw(handle) });
    }
}
/// # Safety
/// Value is empty or an unreleased result returned by this module.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_plural_bytes_free(value: PluralBytes) {
    if !value.data.is_null() {
        drop(unsafe { Box::from_raw(ptr::slice_from_raw_parts_mut(value.data, value.len)) });
    }
}

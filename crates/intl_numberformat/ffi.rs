//! Coerced primitive text only. Handles and results never borrow host runtime state.
use crate::{Error, NumberFormat, Options, metadata, registry::Registry};
use formatjs_intl_pluralrules::mathematical::to_mathematical_value;
use serde::Deserialize;
use serde_json::{Value, json};
use std::{
    panic::{AssertUnwindSafe, catch_unwind},
    ptr, slice, str,
};

pub struct NumberRegistry(Registry);
pub struct NumberHandle(NumberFormat);
#[repr(C)]
pub struct NumberBytes {
    pub data: *mut u8,
    pub len: usize,
}
impl NumberBytes {
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
        Error::Type(_) => 4,
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
unsafe fn output(value: Value, out: *mut NumberBytes) {
    let data = value.to_string().into_bytes().into_boxed_slice();
    let len = data.len();
    unsafe {
        out.write(NumberBytes {
            data: Box::into_raw(data).cast::<u8>(),
            len,
        });
    }
}
fn options(value: Value) -> Result<Options, i32> {
    let mut object = value.as_object().cloned().ok_or(2)?;
    if object.contains_key("localeMatcher") || object.contains_key("numberingSystem") {
        return Err(2);
    }
    let mut number = |key: &str| -> Result<Option<f64>, i32> {
        object
            .remove(key)
            .map(|value| match value {
                Value::Number(value) => value.as_f64().ok_or(2),
                Value::String(value) => match value.as_str() {
                    "NaN" => Ok(f64::NAN),
                    "Infinity" => Ok(f64::INFINITY),
                    "-Infinity" => Ok(f64::NEG_INFINITY),
                    _ => Err(2),
                },
                _ => Err(2),
            })
            .transpose()
    };
    // JSON cannot carry nonfinite Numbers; preserve them until active precision
    // validation. Inactive fraction/significant options must remain lazy.
    let minimum_integer = number("minimumIntegerDigits")?;
    let minimum_fraction = number("minimumFractionDigits")?;
    let maximum_fraction = number("maximumFractionDigits")?;
    let minimum_significant = number("minimumSignificantDigits")?;
    let maximum_significant = number("maximumSignificantDigits")?;
    let increment = number("roundingIncrement")?;
    let mut options: Options = serde_json::from_value(Value::Object(object)).map_err(|_| 2)?;
    options.digits.minimum_integer_digits = minimum_integer;
    options.digits.minimum_fraction_digits = minimum_fraction;
    options.digits.maximum_fraction_digits = maximum_fraction;
    options.digits.minimum_significant_digits = minimum_significant;
    options.digits.maximum_significant_digits = maximum_significant;
    options.digits.rounding_increment = increment;
    Ok(options)
}

/// Status: 0 success, 1 RangeError/data error, 2 invalid ABI input, 3 panic,
/// 4 TypeError. Successful handles and bytes belong to the caller.
/// # Safety
/// Out is writable. Registry mutation requires exclusive access.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_number_registry_create(out: *mut *mut NumberRegistry) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(ptr::null_mut());
    }
    guarded(|| {
        unsafe {
            out.write(Box::into_raw(Box::new(NumberRegistry(Registry::initial()))));
        }
        Ok(())
    })
}
/// # Safety
/// Registry live and exclusively borrowed; input readable for len bytes.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_number_registry_load(
    registry: *mut NumberRegistry,
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
#[derive(Deserialize)]
struct UnitUpdate {
    locale: String,
    data: Value,
}
/// Extend shared units, including records held by existing formatters.
/// # Safety
/// Registry live; input readable for len bytes. No concurrent registry mutation.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_number_registry_units(
    registry: *const NumberRegistry,
    data: *const u8,
    len: usize,
) -> i32 {
    if registry.is_null() {
        return 2;
    }
    guarded(|| {
        let update: UnitUpdate =
            serde_json::from_str(unsafe { input(data, len)? }).map_err(|_| 2)?;
        unsafe { &(*registry).0 }
            .add_unit_data(&update.locale, &update.data.to_string())
            .map_err(status)
    })
}
/// Return current locales plus static currency digits and sanctioned units.
/// # Safety
/// Registry live; out writable. Free successful output once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_number_registry_info(
    registry: *const NumberRegistry,
    out: *mut NumberBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(NumberBytes::EMPTY);
    }
    if registry.is_null() {
        return 2;
    }
    guarded(|| {
        let registry = unsafe { &(*registry).0 };
        let metadata = metadata::load().map_err(status)?;
        unsafe {
            output(
                json!({"available":registry.available_locales(),"default":registry.default_locale(),"currencyDigits":metadata.currency_digits,"units":metadata.units}),
                out,
            );
        }
        Ok(())
    })
}
#[derive(Deserialize)]
struct ResolveRequest {
    locales: Vec<String>,
    #[serde(default)]
    options: ResolveOptions,
}
#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
struct ResolveOptions {
    locale_matcher: Option<String>,
    numbering_system: Option<String>,
}
/// Capture locale resolution before later option getters can replace registry data.
/// # Safety
/// Registry live; input readable for len bytes; out writable. Destroy handle once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_number_resolve(
    registry: *const NumberRegistry,
    data: *const u8,
    len: usize,
    out: *mut *mut NumberHandle,
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
        let request: ResolveRequest =
            serde_json::from_str(unsafe { input(data, len)? }).map_err(|_| 2)?;
        let options = Options {
            locale_matcher: request.options.locale_matcher,
            numbering_system: request.options.numbering_system,
            ..Default::default()
        };
        let model = unsafe { &(*registry).0 }
            .create(&request.locales, &options)
            .map_err(status)?;
        unsafe {
            out.write(Box::into_raw(Box::new(NumberHandle(model))));
        }
        Ok(())
    })
}
/// Configure formatting from a captured locale. Does not consult registry again.
/// # Safety
/// Resolved handle live; input readable for len bytes; out writable. Destroy result once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_number_create(
    resolved: *const NumberHandle,
    data: *const u8,
    len: usize,
    out: *mut *mut NumberHandle,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(ptr::null_mut());
    }
    if resolved.is_null() {
        return 2;
    }
    guarded(|| {
        let value: Value = serde_json::from_str(unsafe { input(data, len)? }).map_err(|_| 2)?;
        let options = options(value)?;
        let model = unsafe { &(*resolved).0 }
            .reconfigure(&options)
            .map_err(status)?;
        unsafe {
            out.write(Box::into_raw(Box::new(NumberHandle(model))));
        }
        Ok(())
    })
}
#[derive(Deserialize)]
struct SupportedRequest {
    locales: Vec<String>,
}
/// # Safety
/// Registry live; input readable for len bytes; out writable. Free result once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_number_supported(
    registry: *const NumberRegistry,
    data: *const u8,
    len: usize,
    out: *mut NumberBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(NumberBytes::EMPTY);
    }
    if registry.is_null() {
        return 2;
    }
    guarded(|| {
        let request: SupportedRequest =
            serde_json::from_str(unsafe { input(data, len)? }).map_err(|_| 2)?;
        let locales = formatjs_intl_getcanonicallocales::get_canonical_locales(&request.locales)
            .map_err(|_| 1)?;
        let supported = unsafe { &(*registry).0 }.supported_locales(&locales);
        unsafe {
            output(json!(supported), out);
        }
        Ok(())
    })
}
#[derive(Deserialize)]
struct NumericInput {
    text: String,
    #[serde(default)]
    bigint: bool,
}
impl NumericInput {
    fn mathematical(&self) -> String {
        to_mathematical_value(&self.text, self.bigint)
    }
}
#[derive(Deserialize)]
#[serde(tag = "method", rename_all = "camelCase")]
enum Query {
    ResolvedOptions,
    Format {
        value: NumericInput,
    },
    FormatToParts {
        value: NumericInput,
    },
    FormatRange {
        start: NumericInput,
        end: NumericInput,
    },
    FormatRangeToParts {
        start: NumericInput,
        end: NumericInput,
    },
}
/// Host already performed ToPrimitive and rejected Symbols/undefined range endpoints.
/// # Safety
/// Handle live; input readable for len bytes; out writable. Free result once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_number_query(
    handle: *const NumberHandle,
    data: *const u8,
    len: usize,
    out: *mut NumberBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(NumberBytes::EMPTY);
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
            Query::Format { value } => json!(model.format(&value.mathematical()).map_err(status)?),
            Query::FormatToParts { value } => json!(
                model
                    .format_to_parts(&value.mathematical())
                    .map_err(status)?
            ),
            Query::FormatRange { start, end } => json!(
                model
                    .format_range(&start.mathematical(), &end.mathematical())
                    .map_err(status)?
            ),
            Query::FormatRangeToParts { start, end } => json!(
                model
                    .format_range_to_parts(&start.mathematical(), &end.mathematical())
                    .map_err(status)?
            ),
        };
        unsafe {
            output(result, out);
        }
        Ok(())
    })
}
/// # Safety
/// Registry null or owned live handle; no outstanding borrows.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_number_registry_destroy(handle: *mut NumberRegistry) {
    if !handle.is_null() {
        drop(unsafe { Box::from_raw(handle) });
    }
}
/// # Safety
/// Handle null or owned live instance; no outstanding borrows.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_number_destroy(handle: *mut NumberHandle) {
    if !handle.is_null() {
        drop(unsafe { Box::from_raw(handle) });
    }
}
/// # Safety
/// Value empty or unreleased bytes returned by this module.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_number_bytes_free(value: NumberBytes) {
    if !value.data.is_null() {
        drop(unsafe { Box::from_raw(ptr::slice_from_raw_parts_mut(value.data, value.len)) });
    }
}

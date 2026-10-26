//! Owned, synchronized native dependency contexts. Hosts supply coerced values.
use crate::{
    Configuration, Display, Duration, DurationFormat, Error, LocaleResolution, PreparedUnit,
    RenderError, Renderer, ResolutionOptions, Style, Unit, UnitOptions, UnitResolver, UnitStyle,
    available_locales, supported_locales,
};
use serde::{Deserialize, Serialize, de::DeserializeOwned};
use std::{
    panic::{AssertUnwindSafe, catch_unwind},
    ptr, slice, str,
    sync::{Arc, Mutex},
};

type Context = Arc<Mutex<Renderer>>;
pub struct DurationRegistry(Context);
pub struct DurationHandle {
    context: Context,
    formatter: DurationFormat,
}
pub struct DurationConstruction {
    context: Context,
    resolution: LocaleResolution,
    phase: Phase,
}
enum Phase {
    Style,
    Units(Units),
    Finished,
}
struct Units {
    style: Style,
    resolver: UnitResolver,
    values: [UnitOptions; 10],
    next: usize,
    prepared: Option<PreparedUnit>,
}
#[repr(C)]
#[derive(Clone, Copy)]
pub struct DurationBytes {
    pub data: *mut u8,
    pub len: usize,
}
impl DurationBytes {
    const EMPTY: Self = Self {
        data: ptr::null_mut(),
        len: 0,
    };
}
#[repr(C)]
pub struct DurationValue {
    pub values: [f64; 10],
    pub defined: u16,
}
fn guarded(call: impl FnOnce() -> Result<(), i32>) -> i32 {
    catch_unwind(AssertUnwindSafe(call))
        .map(|result| result.err().unwrap_or(0))
        .unwrap_or(3)
}
fn error(error: Error) -> i32 {
    if error == Error::EmptyDuration { 4 } else { 1 }
}
fn render_error(error: RenderError) -> i32 {
    use formatjs_intl_listformat::Error as List;
    use formatjs_intl_numberformat::Error as Number;
    match error {
        RenderError::Number(Number::MissingLocale)
        | RenderError::List(List::MissingLocale)
        | RenderError::InvalidParts => 5,
        RenderError::Number(Number::Type(_)) => 4,
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
unsafe fn request<T: DeserializeOwned>(data: *const u8, len: usize) -> Result<T, i32> {
    serde_json::from_str(unsafe { input(data, len)? }).map_err(|_| 2)
}
unsafe fn choice<T: DeserializeOwned>(data: *const u8, len: usize) -> Result<Option<T>, i32> {
    let value: Option<String> = unsafe { request(data, len)? };
    value
        .map(|value| serde_json::from_value(serde_json::Value::String(value)).map_err(|_| 1))
        .transpose()
}
unsafe fn output(value: &impl Serialize, out: *mut DurationBytes) -> Result<(), i32> {
    let value = serde_json::to_vec(value).map_err(|_| 3)?.into_boxed_slice();
    let len = value.len();
    unsafe {
        out.write(DurationBytes {
            data: Box::into_raw(value).cast::<u8>(),
            len,
        });
    }
    Ok(())
}
unsafe fn bytes_out(out: *mut DurationBytes) -> Result<(), i32> {
    if out.is_null() {
        return Err(2);
    }
    unsafe {
        out.write(DurationBytes::EMPTY);
    }
    Ok(())
}
#[derive(Deserialize)]
struct ResolveRequest {
    locales: Vec<String>,
    #[serde(default)]
    options: ResolutionOptions,
}

/// # Safety
/// Out writable; destroy successful handle once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_duration_registry_create(out: *mut *mut DurationRegistry) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(ptr::null_mut());
    }
    guarded(|| {
        unsafe {
            out.write(Box::into_raw(Box::new(DurationRegistry(Arc::new(
                Mutex::new(Renderer::default()),
            )))));
        }
        Ok(())
    })
}
/// Kind 0 NumberFormat pack, 1 ListFormat pack. Cache snapshots survive replacement.
/// # Safety
/// Registry live; input readable for len bytes.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_duration_registry_load(
    registry: *const DurationRegistry,
    kind: u32,
    data: *const u8,
    len: usize,
) -> i32 {
    if registry.is_null() {
        return 2;
    }
    guarded(|| unsafe {
        let data = input(data, len)?;
        let mut context = (*registry).0.lock().map_err(|_| 3)?;
        match kind {
            0 => context.add_number_data(data),
            1 => context.add_list_data(data),
            _ => return Err(2),
        }
        .map_err(render_error)
    })
}
/// # Safety
/// Registry live; JSON {locale,data} readable for len bytes.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_duration_registry_units(
    registry: *const DurationRegistry,
    data: *const u8,
    len: usize,
) -> i32 {
    if registry.is_null() {
        return 2;
    }
    #[derive(Deserialize)]
    struct Request {
        locale: String,
        data: serde_json::Value,
    }
    guarded(|| unsafe {
        let request: Request = request(data, len)?;
        (*registry)
            .0
            .lock()
            .map_err(|_| 3)?
            .add_number_unit_data(&request.locale, &request.data.to_string())
            .map_err(render_error)
    })
}
/// # Safety
/// Out writable; free successful byte result once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_duration_info(out: *mut DurationBytes) -> i32 {
    if unsafe { bytes_out(out) }.is_err() {
        return 2;
    }
    #[derive(Serialize)]
    struct Info {
        available: &'static [String],
        default: &'static str,
    }
    guarded(|| unsafe {
        output(
            &Info {
                available: available_locales().map_err(error)?,
                default: "en",
            },
            out,
        )
    })
}
/// # Safety
/// JSON {locales,options} readable; out writable.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_duration_supported(
    data: *const u8,
    len: usize,
    out: *mut DurationBytes,
) -> i32 {
    if unsafe { bytes_out(out) }.is_err() {
        return 2;
    }
    guarded(|| unsafe {
        let request: ResolveRequest = request(data, len)?;
        output(
            &supported_locales(&request.locales, &request.options).map_err(error)?,
            out,
        )
    })
}
/// Resolve locale/nu before the host reads style and unit getters.
/// # Safety
/// Registry live, JSON {locales,options} readable, out writable.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_duration_begin(
    registry: *const DurationRegistry,
    data: *const u8,
    len: usize,
    out: *mut *mut DurationConstruction,
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
    guarded(|| unsafe {
        let request: ResolveRequest = request(data, len)?;
        let context = (*registry).0.clone();
        let resolution = context
            .lock()
            .map_err(|_| 3)?
            .resolve_locale(&request.locales, &request.options)
            .map_err(error)?;
        out.write(Box::into_raw(Box::new(DurationConstruction {
            context,
            resolution,
            phase: Phase::Style,
        })));
        Ok(())
    })
}
/// # Safety
/// Construction exclusively borrowed; JSON string or null readable.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_duration_style(
    construction: *mut DurationConstruction,
    data: *const u8,
    len: usize,
) -> i32 {
    if construction.is_null() {
        return 2;
    }
    guarded(|| unsafe {
        let construction = &mut *construction;
        if !matches!(construction.phase, Phase::Style) {
            return Err(2);
        }
        let style = choice::<Style>(data, len)?.unwrap_or_default();
        construction.phase = Phase::Units(Units {
            style,
            resolver: UnitResolver::new(style),
            values: [UnitOptions {
                style: UnitStyle::Short,
                display: Display::Auto,
            }; 10],
            next: 0,
            prepared: None,
        });
        Ok(())
    })
}
/// Validate style before the corresponding display getter. Units use canonical order.
/// # Safety
/// Construction exclusively borrowed; JSON string or null readable.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_duration_unit_style(
    construction: *mut DurationConstruction,
    index: u32,
    data: *const u8,
    len: usize,
) -> i32 {
    if construction.is_null() {
        return 2;
    }
    guarded(|| unsafe {
        let Phase::Units(units) = &mut (*construction).phase else {
            return Err(2);
        };
        if index as usize != units.next || units.prepared.is_some() {
            return Err(2);
        }
        let unit = *Unit::ALL.get(units.next).ok_or(2)?;
        units.prepared = Some(
            units
                .resolver
                .prepare(unit, choice(data, len)?)
                .map_err(error)?,
        );
        Ok(())
    })
}
/// # Safety
/// Construction exclusively borrowed; JSON string or null readable.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_duration_unit_display(
    construction: *mut DurationConstruction,
    index: u32,
    data: *const u8,
    len: usize,
) -> i32 {
    if construction.is_null() {
        return 2;
    }
    guarded(|| unsafe {
        let Phase::Units(units) = &mut (*construction).phase else {
            return Err(2);
        };
        if index as usize != units.next {
            return Err(2);
        }
        let prepared = units.prepared.ok_or(2)?;
        let value = units
            .resolver
            .finish(prepared, choice(data, len)?)
            .map_err(error)?;
        *units.values.get_mut(units.next).ok_or(2)? = value;
        units.prepared = None;
        units.next += 1;
        Ok(())
    })
}
/// Fractional digits are read last; successful construction cannot finish again.
/// # Safety
/// Construction exclusively borrowed; out writable.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_duration_finish(
    construction: *mut DurationConstruction,
    has_fractional_digits: u8,
    fractional_digits: f64,
    out: *mut *mut DurationHandle,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(ptr::null_mut());
    }
    if construction.is_null() || has_fractional_digits > 1 {
        return 2;
    }
    guarded(|| unsafe {
        let construction = &mut *construction;
        let Phase::Units(units) = &construction.phase else {
            return Err(2);
        };
        if units.next != Unit::ALL.len() || units.prepared.is_some() {
            return Err(2);
        }
        let configuration = Configuration {
            style: units.style,
            units: units.values,
            fractional_digits: crate::options::fractional_digits(
                (has_fractional_digits == 1).then_some(fractional_digits),
            )
            .map_err(error)?,
        };
        let formatter =
            DurationFormat::from_resolution(construction.resolution.clone(), configuration)
                .map_err(error)?;
        let handle = DurationHandle {
            context: construction.context.clone(),
            formatter,
        };
        construction.phase = Phase::Finished;
        out.write(Box::into_raw(Box::new(handle)));
        Ok(())
    })
}
/// # Safety
/// Handle live; out writable.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_duration_resolved(
    handle: *const DurationHandle,
    out: *mut DurationBytes,
) -> i32 {
    if unsafe { bytes_out(out) }.is_err() {
        return 2;
    }
    if handle.is_null() {
        return 2;
    }
    guarded(|| unsafe { output((*handle).formatter.resolved_options(), out) })
}
/// Values use Unit::ALL order; undefined fields have clear bits in defined.
/// # Safety
/// Handle and value live; out writable. Mode 0 string, 1 parts.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_duration_format(
    handle: *const DurationHandle,
    value: *const DurationValue,
    mode: u32,
    out: *mut DurationBytes,
) -> i32 {
    if unsafe { bytes_out(out) }.is_err() {
        return 2;
    }
    if handle.is_null() || value.is_null() || mode > 1 {
        return 2;
    }
    guarded(|| unsafe {
        let value = &*value;
        if value.defined & !0x3ff != 0 {
            return Err(2);
        }
        let duration = Duration::from_numbers(std::array::from_fn(|index| {
            (value.defined & (1 << index) != 0).then_some(value.values[index])
        }))
        .map_err(error)?;
        let handle = &*handle;
        let mut context = handle.context.lock().map_err(|_| 3)?;
        if mode == 0 {
            output(
                &handle
                    .formatter
                    .format(&mut context, &duration)
                    .map_err(render_error)?,
                out,
            )
        } else {
            output(
                &handle
                    .formatter
                    .format_to_parts(&mut context, &duration)
                    .map_err(render_error)?,
                out,
            )
        }
    })
}
/// # Safety
/// Null or live registry owned by caller; free once without concurrent access.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_duration_registry_destroy(registry: *mut DurationRegistry) {
    if !registry.is_null() {
        unsafe {
            drop(Box::from_raw(registry));
        }
    }
}
/// # Safety
/// Null or live construction owned by caller; free once without concurrent access.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_duration_construction_destroy(
    construction: *mut DurationConstruction,
) {
    if !construction.is_null() {
        unsafe {
            drop(Box::from_raw(construction));
        }
    }
}
/// # Safety
/// Null or live handle owned by caller; free once without concurrent access.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_duration_destroy(handle: *mut DurationHandle) {
    if !handle.is_null() {
        unsafe {
            drop(Box::from_raw(handle));
        }
    }
}
/// # Safety
/// Unmodified successful byte result, freed exactly once; null/zero allowed.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_duration_bytes_free(bytes: DurationBytes) {
    if !bytes.data.is_null() {
        unsafe {
            drop(Box::from_raw(ptr::slice_from_raw_parts_mut(
                bytes.data, bytes.len,
            )));
        }
    }
}

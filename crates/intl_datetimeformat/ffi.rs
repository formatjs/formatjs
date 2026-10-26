//! Thread-bound owned handles. Callback contexts stay opaque to Rust.
use crate::ffi_input::Value;
use crate::{
    DateTimeFormat, Error, Runtime,
    calendar::{CalendarFields, CalendarProvider},
    fields::Components,
    instance::Construction,
    registry::{Resolution, ResolutionOptions},
    selection::{Options, Snapshot},
    timezone::TimeZone,
};
use serde::{Deserialize, Serialize};
use std::{
    ffi::c_void,
    panic::{AssertUnwindSafe, catch_unwind},
    ptr,
    rc::Rc,
    slice, str,
    sync::Arc,
};

pub struct DateTimeRegistry(Runtime);
impl DateTimeRegistry {
    pub fn runtime(&self) -> Runtime {
        self.0.clone()
    }
}
pub struct DateTimeHandle(Rc<DateTimeFormat>);
pub struct DateTimeConstruction {
    construction: Option<Construction>,
    phase: Phase,
}
enum Phase {
    Begun,
    Resolved {
        resolution: Resolution,
        hour12: Option<bool>,
    },
    Zoned {
        resolution: Resolution,
        hour12: Option<bool>,
        zone: TimeZone,
    },
    Captured {
        snapshot: Snapshot,
        zone: TimeZone,
    },
    Finished,
}
#[repr(C)]
#[derive(Clone, Copy)]
pub struct DateTimeBytes {
    pub data: *mut u8,
    pub len: usize,
}
impl DateTimeBytes {
    const EMPTY: Self = Self {
        data: ptr::null_mut(),
        len: 0,
    };
}
#[repr(C)]
pub struct DateTimeBorrowed {
    pub data: *const u8,
    pub len: usize,
}
pub type CalendarCall = unsafe extern "C" fn(*mut c_void, i64, *mut DateTimeBorrowed) -> i32;
pub type CalendarRelease = unsafe extern "C" fn(*mut c_void);
struct CallbackContext {
    context: *mut c_void,
    release: Option<CalendarRelease>,
}
impl Drop for CallbackContext {
    fn drop(&mut self) {
        if let Some(release) = self.release {
            unsafe { release(self.context) }
        }
    }
}
struct Callback {
    context: CallbackContext,
    call: CalendarCall,
}
impl CalendarProvider for Callback {
    fn date_from_time(&self, milliseconds: i64) -> Result<CalendarFields, Error> {
        let mut out = DateTimeBorrowed {
            data: ptr::null(),
            len: 0,
        };
        if unsafe { (self.call)(self.context.context, milliseconds, &mut out) } != 0 {
            return Err(Error::CalendarCallback);
        }
        let text = unsafe { input(out.data, out.len) }.map_err(|_| Error::InvalidLocaleData)?;
        serde_json::from_str(text).map_err(|_| Error::InvalidLocaleData)
    }
}
pub(crate) fn status(error: Error) -> i32 {
    match error {
        Error::CalendarCallback => 5,
        Error::StyleComponents
        | Error::TemporalMismatch
        | Error::TemporalTypeMismatch
        | Error::UnsupportedTemporal => 4,
        _ => 1,
    }
}
pub(crate) fn guarded(call: impl FnOnce() -> Result<(), i32>) -> i32 {
    catch_unwind(AssertUnwindSafe(call))
        .map(|result| result.err().unwrap_or(0))
        .unwrap_or(3)
}
/// # Safety
/// Input readable for len bytes for the returned borrow.
pub unsafe fn input<'a>(data: *const u8, len: usize) -> Result<&'a str, i32> {
    if len > isize::MAX as usize {
        return Err(2);
    }
    if data.is_null() {
        return if len == 0 { Ok("") } else { Err(2) };
    }
    str::from_utf8(unsafe { slice::from_raw_parts(data, len) }).map_err(|_| 2)
}
fn encode<T: Serialize>(value: &T) -> Result<Vec<u8>, i32> {
    serde_json::to_vec(value).map_err(|_| 2)
}
unsafe fn output(value: Vec<u8>, out: *mut DateTimeBytes) {
    let value = value.into_boxed_slice();
    let len = value.len();
    unsafe {
        out.write(DateTimeBytes {
            data: Box::into_raw(value).cast::<u8>(),
            len,
        });
    }
}
unsafe fn request<T: serde::de::DeserializeOwned>(data: *const u8, len: usize) -> Result<T, i32> {
    serde_json::from_str(unsafe { input(data, len)? }).map_err(|_| 2)
}
/// # Safety
/// Out writable. All handles and callbacks remain on their creating thread.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_datetime_registry_create(out: *mut *mut DateTimeRegistry) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(ptr::null_mut());
    }
    guarded(|| {
        unsafe {
            out.write(Box::into_raw(Box::new(
                DateTimeRegistry(Runtime::default()),
            )));
        }
        Ok(())
    })
}
/// Kind 0 base locale, 1 calendar locale patch, 2 timezone transitions.
/// # Safety
/// Registry live; input readable. No simultaneous handle mutation.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_datetime_registry_load(
    registry: *const DateTimeRegistry,
    kind: u32,
    data: *const u8,
    len: usize,
) -> i32 {
    if registry.is_null() {
        return 2;
    }
    guarded(|| {
        let runtime = unsafe { (&*registry).runtime() };
        let text = unsafe { input(data, len)? };
        match kind {
            0 => runtime.add_locale_data(text),
            1 => runtime.add_calendar_locale_data(text),
            2 => runtime.time_zones().load_json(text),
            _ => return Err(2),
        }
        .map_err(status)
    })
}
/// # Safety
/// Registry live; out writable. Free successful bytes once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_datetime_registry_info(
    registry: *const DateTimeRegistry,
    out: *mut DateTimeBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(DateTimeBytes::EMPTY);
    }
    if registry.is_null() {
        return 2;
    }
    guarded(|| {
        let runtime = unsafe { (&*registry).runtime() };
        let value = runtime.info().map_err(status)?;
        unsafe {
            output(encode(&value)?, out);
        }
        Ok(())
    })
}
/// JSON string selects the default; null resets UTC.
/// # Safety
/// Registry live; input readable for len bytes.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_datetime_registry_zone(
    registry: *const DateTimeRegistry,
    data: *const u8,
    len: usize,
) -> i32 {
    if registry.is_null() {
        return 2;
    }
    guarded(|| {
        let runtime = unsafe { (&*registry).runtime() };
        let value: Option<String> = unsafe { request(data, len)? };
        runtime
            .time_zones()
            .set_default_time_zone(value.as_deref())
            .map_err(status)
    })
}
#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
struct SupportedOptions {
    locale_matcher: Option<String>,
}
#[derive(Deserialize)]
struct Supported {
    locales: Vec<String>,
    #[serde(default)]
    options: SupportedOptions,
}
/// # Safety
/// Registry live; input readable; out writable. Free successful bytes once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_datetime_supported(
    registry: *const DateTimeRegistry,
    data: *const u8,
    len: usize,
    out: *mut DateTimeBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(DateTimeBytes::EMPTY);
    }
    if registry.is_null() {
        return 2;
    }
    guarded(|| {
        let runtime = unsafe { (&*registry).runtime() };
        let request: Supported = unsafe { request(data, len)? };
        let values = runtime
            .supported_locales(&request.locales, request.options.locale_matcher.as_deref())
            .map_err(status)?;
        unsafe {
            output(encode(&values)?, out);
        }
        Ok(())
    })
}
/// Context transfers on entry when release is supplied, including rejected calls.
/// Callback output is borrowed until its next invocation; nonzero means foreign failure.
/// # Safety
/// Registry live; name readable. Call/release never unwind and stay on this thread.
/// Callback output remains readable until the next callback or release.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_datetime_registry_calendar(
    registry: *const DateTimeRegistry,
    name: *const u8,
    len: usize,
    context: *mut c_void,
    call: Option<CalendarCall>,
    release: Option<CalendarRelease>,
) -> i32 {
    let context = CallbackContext { context, release };
    if registry.is_null() || call.is_none() {
        return 2;
    }
    guarded(|| {
        let runtime = unsafe { (&*registry).runtime() };
        let name = unsafe { input(name, len)? }.to_owned();
        let call = call.ok_or(2)?;
        runtime.register_calendar(name, Arc::new(Callback { context, call }));
        Ok(())
    })
}
/// Capture timezone availability before host locale/option coercion.
/// # Safety
/// Registry live; out writable. Destroy successful construction once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_datetime_begin(
    registry: *const DateTimeRegistry,
    out: *mut *mut DateTimeConstruction,
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
        let runtime = unsafe { (&*registry).runtime() };
        let value = DateTimeConstruction {
            construction: Some(runtime.begin()),
            phase: Phase::Begun,
        };
        unsafe {
            out.write(Box::into_raw(Box::new(value)));
        }
        Ok(())
    })
}
#[derive(Deserialize)]
struct Resolve {
    locales: Vec<String>,
    #[serde(default)]
    options: ResolutionOptions,
}
/// # Safety
/// Construction live and exclusive, still begun; input readable.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_datetime_resolve(
    handle: *mut DateTimeConstruction,
    data: *const u8,
    len: usize,
) -> i32 {
    if handle.is_null() {
        return 2;
    }
    guarded(|| {
        let request: Resolve = unsafe { request(data, len)? };
        let handle = unsafe { &mut *handle };
        if !matches!(handle.phase, Phase::Begun) {
            return Err(2);
        }
        let resolution = handle
            .construction
            .as_ref()
            .ok_or(2)?
            .resolve(&request.locales, &request.options)
            .map_err(status)?;
        handle.phase = Phase::Resolved {
            resolution,
            hour12: request.options.hour12,
        };
        Ok(())
    })
}
/// # Safety
/// Construction live and exclusive, already resolved; input JSON string/null readable.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_datetime_zone(
    handle: *mut DateTimeConstruction,
    data: *const u8,
    len: usize,
) -> i32 {
    if handle.is_null() {
        return 2;
    }
    guarded(|| {
        let value: Option<String> = unsafe { request(data, len)? };
        let handle = unsafe { &mut *handle };
        let Phase::Resolved { resolution, hour12 } = &handle.phase else {
            return Err(2);
        };
        let zone = handle
            .construction
            .as_ref()
            .ok_or(2)?
            .time_zone(value.as_deref())
            .map_err(status)?;
        handle.phase = Phase::Zoned {
            resolution: resolution.clone(),
            hour12: *hour12,
            zone,
        };
        Ok(())
    })
}
/// Force current locale/calendar formats before host reads late options.
/// # Safety
/// Construction live and exclusive, already zoned; component JSON readable.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_datetime_capture(
    handle: *mut DateTimeConstruction,
    data: *const u8,
    len: usize,
) -> i32 {
    if handle.is_null() {
        return 2;
    }
    guarded(|| {
        let mut components: Components = unsafe { request(data, len)? };
        let handle = unsafe { &mut *handle };
        let Phase::Zoned {
            resolution,
            hour12,
            zone,
        } = &handle.phase
        else {
            return Err(2);
        };
        components.hour12 = *hour12;
        let snapshot = handle
            .construction
            .as_ref()
            .ok_or(2)?
            .capture(resolution.clone(), components)
            .map_err(status)?;
        handle.phase = Phase::Captured {
            snapshot,
            zone: zone.clone(),
        };
        Ok(())
    })
}
/// A valid finalization attempt consumes construction state, even when options fail.
/// # Safety
/// Construction live and exclusive, already captured; late options readable; out writable.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_datetime_create(
    handle: *mut DateTimeConstruction,
    data: *const u8,
    len: usize,
    out: *mut *mut DateTimeHandle,
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
        let options: Options = unsafe { request(data, len)? };
        let handle = unsafe { &mut *handle };
        if !matches!(handle.phase, Phase::Captured { .. }) {
            return Err(2);
        }
        let Phase::Captured { snapshot, zone } =
            std::mem::replace(&mut handle.phase, Phase::Finished)
        else {
            return Err(2);
        };
        let configuration = snapshot.select(&options).map_err(status)?;
        let value = handle
            .construction
            .take()
            .ok_or(2)?
            .finish(configuration, zone);
        unsafe {
            out.write(Box::into_raw(Box::new(DateTimeHandle(Rc::new(value)))));
        }
        Ok(())
    })
}
#[derive(Deserialize)]
#[serde(tag = "op", rename_all = "camelCase", deny_unknown_fields)]
enum Query {
    Resolved {},
    Format { value: Value },
    Parts { value: Value },
    Range { first: Value, second: Value },
    RangeParts { first: Value, second: Value },
}
/// # Safety
/// Handle live on entry; input readable; out writable. Reentrant destruction is allowed.
/// Free successful bytes once. Foreign callback failures return status 5.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_datetime_query(
    handle: *const DateTimeHandle,
    data: *const u8,
    len: usize,
    out: *mut DateTimeBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(DateTimeBytes::EMPTY);
    }
    if handle.is_null() {
        return 2;
    }
    guarded(|| {
        let formatter = unsafe { (&*handle).0.clone() };
        let query: Query = unsafe { request(data, len)? };
        let bytes = match query {
            Query::Resolved {} => encode(&formatter.resolved_options())?,
            Query::Format { value } => {
                encode(&formatter.format(&value.into_value()?).map_err(status)?)?
            }
            Query::Parts { value } => encode(
                &formatter
                    .format_to_parts(&value.into_value()?)
                    .map_err(status)?,
            )?,
            Query::Range { first, second } => encode(
                &formatter
                    .format_range(&first.into_value()?, &second.into_value()?)
                    .map_err(status)?,
            )?,
            Query::RangeParts { first, second } => encode(
                &formatter
                    .format_range_to_parts(&first.into_value()?, &second.into_value()?)
                    .map_err(status)?,
            )?,
        };
        unsafe {
            output(bytes, out);
        }
        Ok(())
    })
}
/// # Safety
/// Construction null or live and uniquely owned. Do not reuse after destruction.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_datetime_construction_destroy(handle: *mut DateTimeConstruction) {
    if !handle.is_null() {
        let _ = catch_unwind(AssertUnwindSafe(|| unsafe {
            drop(Box::from_raw(handle));
        }));
    }
}
/// # Safety
/// Formatter null or live and uniquely owned. Do not reuse after destruction.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_datetime_destroy(handle: *mut DateTimeHandle) {
    if !handle.is_null() {
        let _ = catch_unwind(AssertUnwindSafe(|| unsafe {
            drop(Box::from_raw(handle));
        }));
    }
}
/// # Safety
/// Registry null or live and uniquely owned. Do not reuse after destruction.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_datetime_registry_destroy(handle: *mut DateTimeRegistry) {
    if !handle.is_null() {
        let _ = catch_unwind(AssertUnwindSafe(|| unsafe {
            drop(Box::from_raw(handle));
        }));
    }
}
/// # Safety
/// Bytes empty or allocated by this ABI and not previously freed.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_datetime_bytes_free(value: DateTimeBytes) {
    if !value.data.is_null() && value.len <= isize::MAX as usize {
        unsafe {
            drop(Box::from_raw(ptr::slice_from_raw_parts_mut(
                value.data, value.len,
            )));
        }
    }
}

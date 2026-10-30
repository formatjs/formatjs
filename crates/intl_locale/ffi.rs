//! Owned Locale records for Hermes. Only coerced strings/JSON cross this ABI;
//! JS coercion, brands and option access order stay in the binding.

use std::panic::{AssertUnwindSafe, catch_unwind};
use std::{ptr, slice, str};

use serde::{Deserialize, Serialize};

use crate::{Locale, LocaleOptions, validate_option};

pub struct LocaleHandle(Locale);

#[repr(C)]
pub struct LocaleBytes {
    pub data: *mut u8,
    pub len: usize,
}

impl LocaleBytes {
    const EMPTY: Self = Self {
        data: ptr::null_mut(),
        len: 0,
    };
}

#[derive(Deserialize)]
#[serde(tag = "method", rename_all = "camelCase")]
enum Query {
    Properties,
    Maximize,
    Minimize,
    Calendars,
    HourCycles,
    NumberingSystems {
        #[serde(rename = "defaultNumberingSystem")]
        default_numbering_system: Option<String>,
    },
    Collations {
        #[serde(rename = "globalCollations")]
        global_collations: Vec<String>,
        matched: bool,
        accepted: Vec<String>,
    },
    TimeZones,
    TextInfo,
    WeekInfo,
}

unsafe fn input<'a>(data: *const u8, len: usize) -> Result<&'a str, ()> {
    if len > isize::MAX as usize {
        return Err(());
    }
    if data.is_null() {
        return if len == 0 { Ok("") } else { Err(()) };
    }
    str::from_utf8(unsafe { slice::from_raw_parts(data, len) }).map_err(|_| ())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Properties<'a> {
    locale: &'a str,
    base_name: String,
    language: &'a str,
    script: Option<&'a str>,
    region: Option<&'a str>,
    variants: Option<String>,
    calendar: Option<&'a str>,
    collation: Option<&'a str>,
    hour_cycle: Option<&'a str>,
    case_first: Option<&'a str>,
    numeric: bool,
    numbering_system: Option<&'a str>,
    first_day_of_week: Option<&'a str>,
}

impl<'a> From<&'a Locale> for Properties<'a> {
    fn from(locale: &'a Locale) -> Self {
        Self {
            locale: locale.as_str(),
            base_name: locale.base_name(),
            language: locale.language(),
            script: locale.script(),
            region: locale.region(),
            variants: locale.variants(),
            calendar: locale.keyword("ca"),
            collation: locale.keyword("co"),
            hour_cycle: locale.keyword("hc"),
            case_first: locale.keyword("kf"),
            numeric: locale.numeric(),
            numbering_system: locale.keyword("nu"),
            first_day_of_week: locale.keyword("fw"),
        }
    }
}

/// Returns 0 on success, 1 for invalid locale/options, 2 for invalid ABI input,
/// 3 on panic. `options` is a JSON object of already-coerced LocaleOptions.
///
/// # Safety
/// Inputs point to readable UTF-8 bytes for their lengths; `out` is writable.
/// Successful handle belongs to caller; destroy exactly once after last query.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_locale_create(
    tag: *const u8,
    tag_len: usize,
    options: *const u8,
    options_len: usize,
    out: *mut *mut LocaleHandle,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(ptr::null_mut());
    }
    catch_unwind(AssertUnwindSafe(|| {
        let (Ok(tag), Ok(options)) = (unsafe { input(tag, tag_len) }, unsafe {
            input(options, options_len)
        }) else {
            return 2;
        };
        let locale = if options == "{}" {
            Locale::from_tag(tag)
        } else {
            let Ok(options) = serde_json::from_str::<LocaleOptions>(options) else {
                return 2;
            };
            Locale::new(tag, &options)
        };
        let Ok(locale) = locale else {
            return 1;
        };
        unsafe {
            out.write(Box::into_raw(Box::new(LocaleHandle(locale))));
        }
        0
    }))
    .unwrap_or(3)
}

/// Transform an existing record without re-entering the JS constructor.
///
/// # Safety
/// `handle` is live and `out` is writable. Destroy a successful output once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_locale_transform(
    handle: *const LocaleHandle,
    kind: u32,
    out: *mut *mut LocaleHandle,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe { out.write(ptr::null_mut()) };
    if handle.is_null() || kind > 1 {
        return 2;
    }
    catch_unwind(AssertUnwindSafe(|| {
        let locale = &unsafe { &*handle }.0;
        let transformed = if kind == 0 {
            locale.maximize()
        } else {
            locale.minimize()
        };
        unsafe { out.write(Box::into_raw(Box::new(LocaleHandle(transformed)))) };
        0
    }))
    .unwrap_or(3)
}

/// Validate each coerced string option before JS reads the next property.
/// Uses the same status codes as `formatjs_locale_create`.
///
/// # Safety
/// Both inputs point to readable bytes for their lengths.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_locale_validate(
    name: *const u8,
    name_len: usize,
    value: *const u8,
    value_len: usize,
) -> i32 {
    catch_unwind(AssertUnwindSafe(|| {
        let (Ok(name), Ok(value)) = (unsafe { input(name, name_len) }, unsafe {
            input(value, value_len)
        }) else {
            return 2;
        };
        if validate_option(name, value).is_ok() {
            0
        } else {
            1
        }
    }))
    .unwrap_or(3)
}

/// Query an immutable record; each result owns fresh JSON bytes. Formatter
/// observations belong to this call, so later locale-data loading is visible.
/// Absent scalar properties encode null; JS exposes them as undefined.
///
/// # Safety
/// `handle` is live; `query` points to readable bytes; `out` is writable.
/// Keep handle alive throughout this call. Free successful output exactly once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_locale_query(
    handle: *const LocaleHandle,
    query: *const u8,
    query_len: usize,
    out: *mut LocaleBytes,
) -> i32 {
    if out.is_null() {
        return 2;
    }
    unsafe {
        out.write(LocaleBytes::EMPTY);
    }
    if handle.is_null() {
        return 2;
    }
    catch_unwind(AssertUnwindSafe(|| {
        let Ok(query) = (unsafe { input(query, query_len) }) else {
            return 2;
        };
        let Ok(query) = serde_json::from_str::<Query>(query) else {
            return 2;
        };
        let locale = &unsafe { &*handle }.0;
        let bytes = match query {
            Query::Properties => serde_json::to_vec(&Properties::from(locale)),
            Query::Maximize => serde_json::to_vec(locale.maximize().as_str()),
            Query::Minimize => serde_json::to_vec(locale.minimize().as_str()),
            Query::Calendars => serde_json::to_vec(&locale.calendars()),
            Query::HourCycles => serde_json::to_vec(&locale.hour_cycles()),
            Query::NumberingSystems {
                default_numbering_system,
            } => serde_json::to_vec(&locale.numbering_systems(default_numbering_system.as_deref())),
            Query::Collations {
                global_collations,
                matched,
                accepted,
            } => serde_json::to_vec(&locale.collations(&global_collations, matched, |value| {
                accepted.iter().any(|candidate| candidate == value)
            })),
            Query::TimeZones => serde_json::to_vec(&locale.time_zones()),
            Query::TextInfo => serde_json::to_vec(&locale.text_info()),
            Query::WeekInfo => serde_json::to_vec(&locale.week_info()),
        };
        let Ok(bytes) = bytes else {
            return 3;
        };
        let mut bytes = bytes.into_boxed_slice();
        unsafe {
            out.write(LocaleBytes {
                data: bytes.as_mut_ptr(),
                len: bytes.len(),
            });
        }
        std::mem::forget(bytes);
        0
    }))
    .unwrap_or(3)
}

/// # Safety
/// `handle` is null or an unfreed successful create result, with no live queries.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_locale_destroy(handle: *mut LocaleHandle) {
    if !handle.is_null() {
        unsafe {
            drop(Box::from_raw(handle));
        }
    }
}

/// # Safety
/// `bytes` is an unfreed successful query result or {null, 0}. Preserve its length.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_locale_bytes_free(bytes: LocaleBytes) {
    if !bytes.data.is_null() {
        unsafe {
            drop(Box::from_raw(ptr::slice_from_raw_parts_mut(
                bytes.data, bytes.len,
            )));
        }
    }
}

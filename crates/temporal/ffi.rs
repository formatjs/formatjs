//! Normalized primitive requests; never borrow host runtime objects.
use crate::{Error, IsoDateTime, NANOSECONDS_PER_DAY};
use serde_json::{Value, json};
use std::{
    boxed::Box,
    panic::{AssertUnwindSafe, catch_unwind},
    ptr, slice, str,
    string::ToString,
    sync::atomic::{AtomicU64, Ordering},
};

static CALLS: AtomicU64 = AtomicU64::new(0);
#[repr(C)]
pub struct TemporalBytes {
    pub data: *mut u8,
    pub len: usize,
}
impl TemporalBytes {
    const EMPTY: Self = Self {
        data: ptr::null_mut(),
        len: 0,
    };
}
fn integer(value: Option<&Value>, default: Option<i64>) -> Result<i64, Error> {
    let Some(value) = value else {
        return default.ok_or(Error::InvalidDateTime);
    };
    let number = value.as_f64().ok_or(Error::InvalidDateTime)?;
    if !number.is_finite() || number.fract() != 0.0 || number.abs() > 9_007_199_254_740_991.0 {
        return Err(Error::InvalidDateTime);
    }
    Ok(number as i64)
}
fn fields(value: &Value) -> Result<IsoDateTime, Error> {
    let number = |key, default| integer(value.get(key), default);
    let small = |key, maximum| -> Result<u8, Error> {
        let value = number(key, Some(0))?;
        if value < 0 || value > maximum {
            return Err(Error::InvalidDateTime);
        }
        Ok(value as u8)
    };
    let nano = |key| -> Result<u32, Error> {
        let value = number(key, Some(0))?;
        if !(0..=999).contains(&value) {
            return Err(Error::InvalidDateTime);
        }
        Ok(value as u32)
    };
    Ok(IsoDateTime {
        year: number("year", None)?
            .try_into()
            .map_err(|_| Error::OutOfRange)?,
        month: small("month", 12)?,
        day: small("day", 31)?,
        hour: small("hour", 23)?,
        minute: small("minute", 59)?,
        second: small("second", 59)?,
        nanosecond: nano("millisecond")? * 1_000_000
            + nano("microsecond")? * 1000
            + nano("nanosecond")?,
    })
}
fn record(fields: IsoDateTime) -> Value {
    json!({"year":fields.year,"month":fields.month,"day":fields.day,"hour":fields.hour,"minute":fields.minute,"second":fields.second,"millisecond":fields.nanosecond/1_000_000,"microsecond":fields.nanosecond/1000%1000,"nanosecond":fields.nanosecond%1000})
}
fn execute(request: Value) -> Result<Value, i32> {
    let op = request.get("op").and_then(Value::as_str).ok_or(2)?;
    if op == "info" {
        return Ok(
            json!({"backend":"rust-iso","calls":CALLS.load(Ordering::Relaxed),"operations":["isoToEpochNanoseconds","epochNanosecondsToISO","addISODays"],"completeTemporalBackend":false}),
        );
    }
    if !matches!(
        op,
        "isoToEpochNanoseconds" | "epochNanosecondsToISO" | "addISODays"
    ) {
        return Err(2);
    }
    CALLS.fetch_add(1, Ordering::Relaxed);
    let result = (|| -> Result<Value, Error> {
        match op {
            "isoToEpochNanoseconds" => Ok(Value::String(
                fields(&request["fields"])?
                    .to_epoch_nanoseconds()?
                    .to_string(),
            )),
            "epochNanosecondsToISO" => {
                let value = request["nanoseconds"]
                    .as_str()
                    .ok_or(Error::InvalidDateTime)?
                    .parse::<i128>()
                    .map_err(|_| Error::OutOfRange)?;
                Ok(record(IsoDateTime::from_epoch_nanoseconds(value)?))
            }
            "addISODays" => {
                let origin = fields(&request["fields"])?.to_epoch_nanoseconds()?;
                let days = integer(request.get("days"), None)?;
                let value = origin + i128::from(days) * NANOSECONDS_PER_DAY;
                Ok(record(IsoDateTime::from_epoch_nanoseconds(value)?))
            }
            _ => unreachable!(),
        }
    })();
    result.map_err(|_| 1)
}
/// Status: 0 success, 1 range error, 2 invalid ABI input, 3 panic.
/// # Safety
/// Input must be readable for len; out writable. Free successful output once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_temporal_query(
    data: *const u8,
    len: usize,
    out: *mut TemporalBytes,
) -> i32 {
    if out.is_null() || !out.is_aligned() {
        return 2;
    }
    unsafe {
        out.write(TemporalBytes::EMPTY);
    }
    if len > isize::MAX as usize || data.is_null() && len != 0 {
        return 2;
    }
    catch_unwind(AssertUnwindSafe(|| -> Result<(), i32> {
        let bytes = if len == 0 {
            &[]
        } else {
            unsafe { slice::from_raw_parts(data, len) }
        };
        let source = str::from_utf8(bytes).map_err(|_| 2)?;
        let request = serde_json::from_str(source).map_err(|_| 2)?;
        let result = execute(request)?;
        let bytes = result.to_string().into_bytes().into_boxed_slice();
        let len = bytes.len();
        unsafe {
            out.write(TemporalBytes {
                data: Box::into_raw(bytes).cast::<u8>(),
                len,
            });
        }
        Ok(())
    }))
    .map_or(3, |value| value.err().unwrap_or(0))
}
/// # Safety
/// Bytes must come from a successful query and must be freed exactly once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn formatjs_temporal_bytes_free(bytes: TemporalBytes) {
    if !bytes.data.is_null() {
        drop(unsafe { Box::from_raw(ptr::slice_from_raw_parts_mut(bytes.data, bytes.len)) });
    }
}

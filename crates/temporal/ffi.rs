//! Normalized Temporal requests; host object semantics stay in JS.
use crate::calendar::{Date, DateDuration, DateUnit, MonthCode, Overflow};
use crate::{CalendarProvider, CalendarRef, CalendarRegistry};
use crate::{
    Duration, Error, Instant, IsoDateTime, NANOSECONDS_PER_DAY, PlainTime, Precision, RoundingMode,
    TimeUnit,
};
use serde_json::{Value, json};
use std::{
    boxed::Box,
    panic::{AssertUnwindSafe, catch_unwind},
    ptr, slice, str,
    string::ToString,
    sync::{
        OnceLock,
        atomic::{AtomicU64, Ordering},
    },
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
const DURATION_FIELDS: [&str; 10] = [
    "years",
    "months",
    "weeks",
    "days",
    "hours",
    "minutes",
    "seconds",
    "milliseconds",
    "microseconds",
    "nanoseconds",
];
fn decimal(request: &Value, key: &str) -> Result<i128, Error> {
    request[key]
        .as_str()
        .ok_or(Error::InvalidSyntax)?
        .parse()
        .map_err(|_| Error::OutOfRange)
}
fn instant(request: &Value, key: &str) -> Result<Instant, Error> {
    Instant::from_epoch_nanoseconds(decimal(request, key)?)
}
fn mode(request: &Value) -> Result<RoundingMode, Error> {
    request["mode"]
        .as_str()
        .ok_or(Error::InvalidRoundingOptions)?
        .parse()
}
fn precision(request: &Value) -> Result<Precision, Error> {
    Ok(match request["precision"].as_str() {
        Some("auto") => Precision::Auto,
        Some("minute") => Precision::Minute,
        _ => Precision::Digits(
            integer(request.get("precision"), None)?
                .try_into()
                .map_err(|_| Error::InvalidRoundingOptions)?,
        ),
    })
}
fn duration(request: &Value) -> Result<Duration, Error> {
    let mut fields = [0; 10];
    for (index, key) in DURATION_FIELDS.iter().enumerate() {
        fields[index] = decimal(&request["duration"], key)?;
    }
    Duration::new(fields)
}
fn duration_record(duration: Duration) -> Value {
    let fields = duration.fields();
    Value::Object(
        DURATION_FIELDS
            .iter()
            .enumerate()
            .map(|(index, key)| (key.to_string(), json!(fields[index] as f64)))
            .collect(),
    )
}
static CALENDARS: OnceLock<Result<CalendarRegistry<'static>, Error>> = OnceLock::new();
fn compiled_calendars() -> Result<CalendarRegistry<'static>, Error> {
    #[cfg(feature = "compiled_calendars")]
    {
        CalendarRegistry::compiled()
    }
    #[cfg(not(feature = "compiled_calendars"))]
    {
        Ok(CalendarRegistry::arithmetic())
    }
}
fn calendar_record(value: Date) -> Value {
    json!({"year":value.year,"month":value.month,"day":value.day,
        "monthCode":std::format!("M{:02}{}",value.month_code.number,if value.month_code.leap {"L"} else {""})})
}
fn calendar_overflow(request: &Value) -> Result<Overflow, Error> {
    match request["overflow"].as_str() {
        Some("constrain") => Ok(Overflow::Constrain),
        Some("reject") => Ok(Overflow::Reject),
        _ => Err(Error::InvalidDateTime),
    }
}
fn calendar_epoch(
    calendar: CalendarRef<'_>,
    fields: &Value,
    overflow: Overflow,
) -> Result<i64, Error> {
    let year: i32 = integer(fields.get("year"), None)?
        .try_into()
        .map_err(|_| Error::OutOfRange)?;
    let month = if let Some(code) = fields.get("monthCode") {
        let code = code.as_str().ok_or(Error::InvalidDateTime)?.as_bytes();
        if !(code.len() == 3 || code.len() == 4 && code[3] == b'L')
            || code[0] != b'M'
            || !code[1].is_ascii_digit()
            || !code[2].is_ascii_digit()
        {
            return Err(Error::InvalidDateTime);
        }
        let month = calendar
            .month_from_code(
                year,
                MonthCode {
                    number: (code[1] - b'0') * 10 + code[2] - b'0',
                    leap: code.len() == 4,
                },
                overflow,
            )
            .map_err(crate::calendar_provider::error)?;
        if fields.get("month").is_some() && integer(fields.get("month"), None)? != i64::from(month)
        {
            return Err(Error::InvalidDateTime);
        }
        i32::from(month)
    } else {
        calendar_field(fields.get("month"), overflow)?
    };
    calendar
        .epoch_day_extended(
            year,
            month,
            calendar_field(fields.get("day"), overflow)?,
            overflow,
        )
        .map_err(crate::calendar_provider::error)
}
fn calendar_field(value: Option<&Value>, overflow: Overflow) -> Result<i32, Error> {
    let value = integer(value, None)?;
    if overflow == Overflow::Constrain {
        Ok(value.clamp(i64::from(i32::MIN), i64::from(i32::MAX)) as i32)
    } else {
        value.try_into().map_err(|_| Error::OutOfRange)
    }
}
fn calendar_operation(op: &str, request: &Value) -> Result<Value, Error> {
    let registry = CALENDARS
        .get_or_init(compiled_calendars)
        .as_ref()
        .map_err(|error| *error)?;
    let calendar = registry.resolve(request["calendar"].as_str().ok_or(Error::InvalidCalendar)?)?;
    let number = |key| integer(request.get(key), None);
    let year =
        || -> Result<i32, Error> { number("year")?.try_into().map_err(|_| Error::OutOfRange) };
    let result = match op {
        "calendarStartOfYear" => json!(
            calendar
                .start_of_year(year()?)
                .map_err(crate::calendar_provider::error)?
        ),
        "calendarMonthsInYear" => json!(
            calendar
                .months_in_year(year()?)
                .map_err(crate::calendar_provider::error)?
        ),
        "calendarDaysInMonth" => json!(
            calendar
                .days_in_month(
                    year()?,
                    number("month")?
                        .try_into()
                        .map_err(|_| Error::InvalidDateTime)?
                )
                .map_err(crate::calendar_provider::error)?
        ),
        "calendarToEpochDay" => json!(calendar_epoch(
            calendar,
            &request["fields"],
            calendar_overflow(request)?
        )?),
        "calendarFromEpochDay" => calendar_record(
            calendar
                .date_extended(number("epoch")?)
                .map_err(crate::calendar_provider::error)?,
        ),
        "calendarAdd" => {
            let overflow = calendar_overflow(request)?;
            let origin = calendar_epoch(calendar, &request["fields"], Overflow::Reject)?;
            let duration = &request["duration"];
            let duration = DateDuration {
                years: integer(duration.get("years"), Some(0))?,
                months: integer(duration.get("months"), Some(0))?,
                weeks: integer(duration.get("weeks"), Some(0))?,
                days: integer(duration.get("days"), Some(0))?,
            };
            let epoch = calendar
                .add_extended(origin, duration, overflow)
                .map_err(crate::calendar_provider::error)?;
            calendar_record(
                calendar
                    .date_extended(epoch)
                    .map_err(crate::calendar_provider::error)?,
            )
        }
        "calendarUntil" => {
            let unit = match request["largest"].as_str() {
                Some("year") => DateUnit::Year,
                Some("month") => DateUnit::Month,
                Some("week") => DateUnit::Week,
                Some("day") => DateUnit::Day,
                _ => return Err(Error::InvalidRoundingOptions),
            };
            let value = calendar
                .until_raw(number("one")?, number("two")?, unit)
                .map_err(crate::calendar_provider::error)?;
            json!({"years":value.years,"months":value.months,"weeks":value.weeks,"days":value.days})
        }
        "calendarMonthSerial" => {
            let year = year()?;
            let before = match calendar {
                CalendarRef::Arithmetic(value) => value.months_before_year(year),
                CalendarRef::Table(value) => value.months_before_year(year),
            }
            .map_err(crate::calendar_provider::error)?;
            json!(before + number("month")? - 1)
        }
        "calendarEra" => match calendar
            .era_extended(number("epoch")?)
            .map_err(crate::calendar_provider::error)?
        {
            Some(era) => json!({"era":era.name,"eraYear":era.year}),
            None => Value::Null,
        },
        "calendarYearFromEra" => json!(
            calendar
                .year_from_era(
                    request["era"].as_str().ok_or(Error::InvalidDateTime)?,
                    year()?
                )
                .map_err(crate::calendar_provider::error)?
        ),
        _ => return Err(Error::InvalidSyntax),
    };
    Ok(result)
}
fn time_operation(op: &str, request: &Value) -> Result<Value, Error> {
    if op == "parsePlainTime" {
        return Ok(json!(
            request["text"]
                .as_str()
                .ok_or(Error::InvalidSyntax)?
                .parse::<PlainTime>()?
                .nanoseconds()
                .to_string()
        ));
    }
    if op == "regulatePlainTime" {
        let constrain = request["constrain"]
            .as_bool()
            .ok_or(Error::InvalidDateTime)?;
        let mut values = [0; 6];
        for (index, (key, maximum)) in [
            ("hour", 23.),
            ("minute", 59.),
            ("second", 59.),
            ("millisecond", 999.),
            ("microsecond", 999.),
            ("nanosecond", 999.),
        ]
        .iter()
        .enumerate()
        {
            let value = request["fields"][key]
                .as_f64()
                .ok_or(Error::InvalidDateTime)?;
            if !value.is_finite() || value.fract() != 0. {
                return Err(Error::InvalidDateTime);
            }
            let value = if constrain {
                value.clamp(0., *maximum)
            } else {
                value
            };
            if value < 0. || value > *maximum {
                return Err(Error::InvalidDateTime);
            }
            values[index] = value as u32;
        }
        return Ok(json!(
            PlainTime::new(
                values[0] as u8,
                values[1] as u8,
                values[2] as u8,
                values[3] * 1_000_000 + values[4] * 1000 + values[5]
            )?
            .nanoseconds()
            .to_string()
        ));
    }
    let value = PlainTime::from_nanoseconds(decimal(request, "nanoseconds")?)?;
    match op {
        "formatPlainTime" => Ok(json!(
            value
                .format(precision(request)?, mode(request)?)?
                .to_string()
        )),
        "addPlainTime" => {
            let duration = duration(request)?;
            let result = match request["subtract"].as_bool() {
                Some(false) => value.checked_add(duration)?,
                Some(true) => value.checked_subtract(duration)?,
                None => return Err(Error::InvalidDuration),
            };
            Ok(json!(result.nanoseconds().to_string()))
        }
        "roundPlainTime" => {
            let unit = request["unit"]
                .as_str()
                .ok_or(Error::InvalidRoundingOptions)?
                .parse()?;
            let increment = integer(request.get("increment"), None)?
                .try_into()
                .map_err(|_| Error::InvalidRoundingOptions)?;
            Ok(json!(
                value
                    .rounded_nanoseconds(unit, increment, mode(request)?)?
                    .to_string()
            ))
        }
        "differencePlainTime" => {
            let other = PlainTime::from_nanoseconds(decimal(request, "other")?)?;
            let largest = request["largest"]
                .as_str()
                .ok_or(Error::InvalidRoundingOptions)?
                .parse()?;
            let smallest = request["smallest"]
                .as_str()
                .ok_or(Error::InvalidRoundingOptions)?
                .parse()?;
            let increment = integer(request.get("increment"), None)?
                .try_into()
                .map_err(|_| Error::InvalidRoundingOptions)?;
            Ok(duration_record(value.until(
                other,
                largest,
                smallest,
                increment,
                mode(request)?,
            )?))
        }
        _ => Err(Error::InvalidSyntax),
    }
}
fn instant_operation(op: &str, request: &Value) -> Result<Value, Error> {
    if op == "parseInstant" {
        return Ok(json!(
            request["text"]
                .as_str()
                .ok_or(Error::InvalidSyntax)?
                .parse::<Instant>()?
                .epoch_nanoseconds()
                .to_string()
        ));
    }
    let value = instant(request, "nanoseconds")?;
    match op {
        "formatInstant" => {
            let precision = precision(request)?;
            let offset = if request.get("offset").is_some() {
                Some(
                    decimal(request, "offset")?
                        .try_into()
                        .map_err(|_| Error::OutOfRange)?,
                )
            } else {
                None
            };
            Ok(json!(
                value
                    .format(precision, RoundingMode::Trunc, offset)?
                    .to_string()
            ))
        }
        "addInstant" => {
            let duration = duration(request)?;
            let result = match request["subtract"].as_bool() {
                Some(false) => value.checked_add(duration)?,
                Some(true) => value.checked_subtract(duration)?,
                None => return Err(Error::InvalidDuration),
            };
            Ok(json!(result.epoch_nanoseconds().to_string()))
        }
        "roundInstant" => {
            let quantum = decimal(request, "quantum")?;
            if quantum <= 0 || quantum > NANOSECONDS_PER_DAY || NANOSECONDS_PER_DAY % quantum != 0 {
                return Err(Error::InvalidRoundingOptions);
            }
            let unit = [
                TimeUnit::Hour,
                TimeUnit::Minute,
                TimeUnit::Second,
                TimeUnit::Millisecond,
                TimeUnit::Microsecond,
                TimeUnit::Nanosecond,
            ]
            .into_iter()
            .find(|unit| quantum % unit.nanoseconds() == 0)
            .ok_or(Error::InvalidRoundingOptions)?;
            let increment = (quantum / unit.nanoseconds())
                .try_into()
                .map_err(|_| Error::InvalidRoundingOptions)?;
            Ok(json!(
                value
                    .round(unit, increment, mode(request)?)?
                    .epoch_nanoseconds()
                    .to_string()
            ))
        }
        "differenceInstant" => {
            let other = instant(request, "other")?;
            let largest = request["largest"]
                .as_str()
                .ok_or(Error::InvalidRoundingOptions)?
                .parse()?;
            let smallest = request["smallest"]
                .as_str()
                .ok_or(Error::InvalidRoundingOptions)?
                .parse()?;
            let increment = integer(request.get("increment"), None)?
                .try_into()
                .map_err(|_| Error::InvalidRoundingOptions)?;
            Ok(duration_record(value.until(
                other,
                largest,
                smallest,
                increment,
                mode(request)?,
            )?))
        }
        _ => Err(Error::InvalidSyntax),
    }
}
fn execute(request: Value) -> Result<Value, i32> {
    let op = request.get("op").and_then(Value::as_str).ok_or(2)?;
    if op == "info" {
        return Ok(
            json!({"backend":"rust-iso-instant-time-calendars","calls":CALLS.load(Ordering::Relaxed),"operations":["calendarStartOfYear","calendarMonthsInYear","calendarDaysInMonth","calendarToEpochDay","calendarFromEpochDay","calendarAdd","calendarUntil","calendarMonthSerial","calendarEra","calendarYearFromEra","isoToEpochNanoseconds","epochNanosecondsToISO","addISODays","parsePlainTime","regulatePlainTime","formatPlainTime","addPlainTime","roundPlainTime","differencePlainTime","parseInstant","formatInstant","addInstant","roundInstant","differenceInstant"],"completeTemporalBackend":false}),
        );
    }
    if !matches!(
        op,
        "calendarStartOfYear"
            | "calendarMonthsInYear"
            | "calendarDaysInMonth"
            | "calendarToEpochDay"
            | "calendarFromEpochDay"
            | "calendarAdd"
            | "calendarUntil"
            | "calendarMonthSerial"
            | "calendarEra"
            | "calendarYearFromEra"
            | "isoToEpochNanoseconds"
            | "epochNanosecondsToISO"
            | "addISODays"
            | "parsePlainTime"
            | "regulatePlainTime"
            | "formatPlainTime"
            | "addPlainTime"
            | "roundPlainTime"
            | "differencePlainTime"
            | "parseInstant"
            | "formatInstant"
            | "addInstant"
            | "roundInstant"
            | "differenceInstant"
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
            _ if op.starts_with("calendar") => calendar_operation(op, &request),
            _ if op.ends_with("PlainTime") => time_operation(op, &request),
            _ => instant_operation(op, &request),
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

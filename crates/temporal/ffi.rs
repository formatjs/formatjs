//! Normalized Temporal requests; host object semantics stay in JS.
use crate::calendar::{Date, DateDuration, DateUnit, MonthCode, Overflow};
use crate::{
    CalendarProvider, CalendarRef, CalendarRegistry, Disambiguation, TimeZone, TimeZoneRegistry,
    TransitionDirection,
};
use crate::{
    DateTimeUnit, Duration, Error, Instant, IsoDateTime, NANOSECONDS_PER_DAY, PlainDate,
    PlainDateTime, PlainMonthDay, PlainTime, PlainYearMonth, Precision, ResolvedTimeZone,
    RoundingMode, TimeFields, TimeUnit, ZonedDateTime,
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

pub(crate) const OPERATIONS: &[&str] = &[
    "addPlainYearMonth",
    "differencePlainYearMonth",
    "yearMonthToDate",
    "monthDayToDate",
    "formatPlainDate",
    "formatPlainDateTime",
    "formatPlainYearMonth",
    "formatPlainMonthDay",
    "formatZonedDateTime",
    "parsePlainDate",
    "parsePlainDateTime",
    "parsePlainYearMonth",
    "parsePlainMonthDay",
    "parseZonedFields",
    "resolveZonedDateTime",
    "addZonedDateTime",
    "differenceZonedDateTime",
    "roundZonedDateTime",
    "startOfZonedDay",
    "hoursInZonedDay",
    "addPlainDate",
    "addPlainDateTime",
    "differencePlainDate",
    "differencePlainDateTime",
    "roundPlainDateTime",
    "transformDuration",
    "parseDuration",
    "validateDuration",
    "formatDuration",
    "addDuration",
    "compareDuration",
    "totalDuration",
    "roundDuration",
    "timeZoneIdentity",
    "timeZoneOffset",
    "timeZonePossibleInstants",
    "timeZoneResolve",
    "timeZoneTransition",
    "calendarStartOfYear",
    "calendarMonthsInYear",
    "calendarDaysInMonth",
    "calendarToEpochDay",
    "calendarFromEpochDay",
    "calendarAdd",
    "calendarUntil",
    "calendarMonthSerial",
    "calendarEra",
    "calendarYearFromEra",
    "isoToEpochNanoseconds",
    "epochNanosecondsToISO",
    "addISODays",
    "parsePlainTime",
    "regulatePlainTime",
    "formatPlainTime",
    "addPlainTime",
    "roundPlainTime",
    "differencePlainTime",
    "parseInstant",
    "formatInstant",
    "addInstant",
    "roundInstant",
    "differenceInstant",
    "calendarProperties",
    "zonedProperties",
    "withPlainDate",
    "withPlainDateTime",
    "withPlainYearMonth",
    "withPlainMonthDay",
    "withZonedDateTime",
];

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
    // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L71-L77
    // L71: split the combined subsecond field into complete milliseconds.
    // L72: microseconds discard complete milliseconds before selecting three digits.
    // L73: modulo 1000 bounds that field to 0..999.
    // L74: the final remainder gives nanoseconds within the microsecond.
    // L75: preserve the three ISO date-record fields.
    // L76: preserve the six time-record fields.
    // L77: the flat transport object combines those conceptual records.
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
    let value = &request[key];
    if let Some(text) = value.as_str() {
        return text.parse().map_err(|_| Error::OutOfRange);
    }
    let number = value.as_f64().ok_or(Error::InvalidSyntax)?;
    if !number.is_finite()
        || number.fract() != 0.0
        || number < i128::MIN as f64
        || number >= -(i128::MIN as f64)
    {
        return Err(Error::OutOfRange);
    }
    Ok(number as i128)
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
// Proposal comparison §7.5.16: wire input dependency; duration_value calls Duration::new.
fn duration(request: &Value) -> Result<Duration, Error> {
    duration_value(&request["duration"])
}
// Proposal comparison §7.5.16 steps1–9: decode only; Duration::new owns invariants.
fn duration_value(value: &Value) -> Result<Duration, Error> {
    let mut fields = [0; 10];
    for (index, key) in DURATION_FIELDS.iter().enumerate() {
        fields[index] = decimal(value, key)?;
    }
    Duration::new(fields)
}
// Proposal comparison §7.5.16: validated-field wire output; Duration::new owns invariants.
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
pub(crate) fn calendars() -> Result<CalendarRegistry<'static>, Error> {
    CALENDARS
        .get_or_init(compiled_calendars)
        .as_ref()
        .copied()
        .map_err(|error| *error)
}
pub(crate) fn resolve_calendar(identifier: &str) -> Result<CalendarRef<'static>, Error> {
    if identifier.eq_ignore_ascii_case("iso8601") {
        return Ok(CalendarRef::Arithmetic(crate::calendar::Calendar::Iso8601));
    }
    calendars()?.resolve(identifier)
}
pub(crate) fn calendar_for_string(text: &str) -> Result<CalendarRef<'static>, Error> {
    resolve_calendar(crate::parse::calendar_annotation(text).unwrap_or("iso8601"))
}
pub(crate) fn time_zones() -> TimeZoneRegistry<'static> {
    #[cfg(feature = "compiled_time_zones")]
    {
        TimeZoneRegistry::compiled()
    }
    #[cfg(not(feature = "compiled_time_zones"))]
    {
        TimeZoneRegistry::empty()
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
// Clamp finite Number fields before narrowing to Rust integers.
pub(crate) fn calendar_field_number(value: f64, constrain: bool) -> Result<i32, Error> {
    if !value.is_finite() || value.fract() != 0.0 {
        return Err(Error::InvalidDateTime);
    }
    let value = if constrain {
        value.clamp(i32::MIN as f64, i32::MAX as f64)
    } else {
        value
    };
    if value < i32::MIN as f64 || value > i32::MAX as f64 {
        return Err(Error::OutOfRange);
    }
    Ok(value as i32)
}
fn calendar_field(value: Option<&Value>, overflow: Overflow) -> Result<i32, Error> {
    calendar_field_number(
        value
            .and_then(Value::as_f64)
            .ok_or(Error::InvalidDateTime)?,
        overflow == Overflow::Constrain,
    )
}
pub(crate) const DATE_PROPERTIES: &[&str] = &[
    "dayOfWeek",
    "daysInWeek",
    "dayOfYear",
    "daysInMonth",
    "monthsInYear",
    "daysInYear",
    "inLeapYear",
    "weekOfYear",
    "yearOfWeek",
    "era",
    "eraYear",
    "hour",
    "minute",
    "second",
    "millisecond",
    "microsecond",
    "nanosecond",
    "localNanoseconds",
    "offsetNanoseconds",
    "offset",
    "hoursInDay",
];

pub(crate) struct CalendarSnapshot {
    pub date: Option<Date>,
    pub values: [Value; 21],
    pub errors: u32,
}
impl CalendarSnapshot {
    fn into_json(self) -> Value {
        let mut values = serde_json::Map::new();
        let mut errors = std::vec::Vec::new();
        if self.date.is_none() {
            errors.extend(["year", "month", "monthCode", "day"]);
        }
        for (index, (key, value)) in DATE_PROPERTIES.iter().zip(self.values).enumerate() {
            if !value.is_null() {
                values.insert((*key).into(), value);
            }
            if self.errors & (1 << index) != 0 {
                errors.push(*key);
            }
        }
        json!({"date":self.date.map(calendar_record),"values":values,"errors":errors})
    }
}
pub(crate) fn calendar_snapshot(
    calendar: CalendarRef<'_>,
    epoch: i64,
) -> Result<CalendarSnapshot, Error> {
    let date = calendar
        .date_extended(epoch)
        .map_err(crate::calendar_provider::error)?;
    let mut values = [const { Value::Null }; 21];
    let mut errors = 0u32;
    macro_rules! field {
        ($index:literal, $result:expr) => {
            match $result {
                Ok(value) => {
                    values[$index] = json!(value);
                }
                Err(_) => {
                    errors |= 1 << $index;
                }
            }
        };
    }
    let start = calendar.start_of_year(date.year);
    let days = start.and_then(|first| {
        calendar
            .start_of_year(date.year + 1)
            .map(|last| last - first)
    });
    let months = calendar.months_in_year(date.year);
    field!(3, calendar.days_in_month(date.year, date.month));
    field!(4, months);
    field!(5, days);
    field!(2, start.map(|first| epoch - first + 1));
    field!(
        6,
        match calendar.id() {
            "hebrew" | "chinese" | "dangi" => months.map(|value| value == 13),
            "islamic-civil" | "islamic-tbla" | "islamic-umalqura" => days.map(|value| value == 355),
            _ => days.map(|value| value == 366),
        }
    );
    let weekday = (epoch + 3).rem_euclid(7) + 1;
    values[0] = json!(weekday);
    values[1] = json!(7);
    if calendar.id() == "iso8601" {
        let thursday = epoch + 4 - weekday;
        let year =
            crate::iso::iso_from_epoch_nanoseconds_raw(i128::from(thursday) * NANOSECONDS_PER_DAY)
                .year;
        values[8] = json!(year);
        values[7] = json!((thursday - crate::iso::epoch_day_from_iso(year, 1, 1)) / 7 + 1);
    }
    match calendar.era_extended(epoch) {
        Ok(Some(era)) => {
            values[9] = json!(era.name);
            values[10] = json!(era.year);
        }
        Ok(None) => {}
        Err(_) => {
            errors |= 1 << 9;
            errors |= 1 << 10;
        }
    }
    Ok(CalendarSnapshot {
        date: Some(date),
        values,
        errors,
    })
}

fn prepared_date_fields<'a>(
    fields: &'a Value,
    constrain: bool,
) -> Result<crate::DateFields<'a>, Error> {
    let number = |key: &str, clamp: bool| -> Result<Option<i32>, Error> {
        let Some(value) = fields.get(key) else {
            return Ok(None);
        };
        calendar_field_number(
            value.as_f64().ok_or(Error::InvalidDateTime)?,
            clamp && constrain,
        )
        .map(Some)
    };
    let code = fields
        .get("monthCode")
        .map(|value| {
            let bytes = value.as_str().ok_or(Error::InvalidDateTime)?.as_bytes();
            if !(bytes.len() == 3 || bytes.len() == 4 && bytes[3] == b'L')
                || bytes[0] != b'M'
                || !bytes[1].is_ascii_digit()
                || !bytes[2].is_ascii_digit()
            {
                return Err(Error::InvalidDateTime);
            }
            Ok(MonthCode {
                number: (bytes[1] - b'0') * 10 + bytes[2] - b'0',
                leap: bytes.len() == 4,
            })
        })
        .transpose()?;
    Ok(crate::DateFields {
        year: number("year", false)?,
        month: number("month", true)?,
        day: number("day", true)?,
        month_code: code,
        era: fields
            .get("era")
            .map(|value| value.as_str().ok_or(Error::InvalidDateTime))
            .transpose()?,
        era_year: number("eraYear", false)?,
    })
}
fn prepared_time_fields(fields: &Value, constrain: bool) -> Result<TimeFields, Error> {
    let number = |key: &str, maximum: f64| -> Result<Option<i128>, Error> {
        let Some(value) = fields.get(key) else {
            return Ok(None);
        };
        let mut value = value.as_f64().ok_or(Error::InvalidDateTime)?;
        if !value.is_finite() || value.fract() != 0.0 {
            return Err(Error::InvalidDateTime);
        }
        if constrain {
            value = value.clamp(0.0, maximum);
        }
        if value < 0.0 || value > maximum {
            return Err(Error::InvalidDateTime);
        }
        Ok(Some(value as i128))
    };
    Ok(TimeFields {
        hour: number("hour", 23.0)?,
        minute: number("minute", 59.0)?,
        second: number("second", 59.0)?,
        millisecond: number("millisecond", 999.0)?,
        microsecond: number("microsecond", 999.0)?,
        nanosecond: number("nanosecond", 999.0)?,
    })
}
fn with_operation(op: &str, request: &Value) -> Result<Value, Error> {
    let constrain = calendar_overflow(request)? == Overflow::Constrain;
    let overflow = if constrain {
        crate::Overflow::Constrain
    } else {
        crate::Overflow::Reject
    };
    let fields = &request["fields"];
    let date = prepared_date_fields(fields, constrain)?;
    if op == "withZonedDateTime" {
        let source = zoned_value(&request["value"])?;
        let disambiguation = match request["disambiguation"].as_str() {
            Some("compatible") => Disambiguation::Compatible,
            Some("earlier") => Disambiguation::Earlier,
            Some("later") => Disambiguation::Later,
            Some("reject") => Disambiguation::Reject,
            _ => return Err(Error::InvalidDateTime),
        };
        let offset = match request["behavior"].as_str() {
            Some("prefer") => crate::OffsetOption::Prefer,
            Some("use") => crate::OffsetOption::Use,
            Some("ignore") => crate::OffsetOption::Ignore,
            Some("reject") => crate::OffsetOption::Reject,
            _ => return Err(Error::InvalidDateTime),
        };
        let hint = fields
            .get("offset")
            .map(|value| {
                crate::parse::offset_nanoseconds(value.as_str().ok_or(Error::InvalidTimeZone)?)
            })
            .transpose()?;
        let result = source.with_fields(
            crate::ZonedFields {
                date_time: crate::DateTimeFields {
                    date,
                    time: prepared_time_fields(fields, constrain)?,
                },
                offset: hint,
            },
            crate::ZonedWithOptions {
                disambiguation,
                offset,
                overflow,
            },
        )?;
        return Ok(json!(result.instant().epoch_nanoseconds().to_string()));
    }
    if op == "withPlainDateTime" {
        let calendar =
            resolve_calendar(request["calendar"].as_str().ok_or(Error::InvalidCalendar)?)?;
        let source =
            PlainDateTime::from_epoch_nanoseconds_in(decimal(request, "nanoseconds")?, calendar)?;
        let result = source.with_fields(
            crate::DateTimeFields {
                date,
                time: prepared_time_fields(fields, constrain)?,
            },
            overflow,
        )?;
        return Ok(json!(result.epoch_nanoseconds().to_string()));
    }
    let slot = &request["value"];
    let epoch = integer(slot.get("epochDay"), None)?;
    let calendar = resolve_calendar(slot["calendar"].as_str().ok_or(Error::InvalidCalendar)?)?;
    Ok(json!(match op {
        "withPlainDate" => PlainDate::from_epoch_day_in(epoch, calendar)?
            .with_fields(date, overflow)?
            .epoch_day(),
        "withPlainYearMonth" => PlainYearMonth::from_epoch_day_in(epoch, calendar)?
            .with_fields(date, overflow)?
            .epoch_day(),
        "withPlainMonthDay" => PlainMonthDay::from_epoch_day_in(epoch, calendar)?
            .with_fields(date, overflow)?
            .epoch_day(),
        _ => return Err(Error::InvalidDateTime),
    }))
}

fn add_clock(snapshot: &mut CalendarSnapshot, nanoseconds: i128) {
    let fields = crate::iso::iso_from_epoch_nanoseconds_raw(nanoseconds);
    for (target, value) in snapshot.values[11..17].iter_mut().zip([
        u32::from(fields.hour),
        u32::from(fields.minute),
        u32::from(fields.second),
        fields.nanosecond / 1_000_000,
        fields.nanosecond / 1000 % 1000,
        fields.nanosecond % 1000,
    ]) {
        *target = Value::from(value);
    }
}
pub(crate) fn partial_calendar_snapshot(calendar: CalendarRef<'_>, epoch: i64) -> CalendarSnapshot {
    calendar_snapshot(calendar, epoch).unwrap_or_else(|_| CalendarSnapshot {
        date: None,
        values: [const { Value::Null }; 21],
        errors: (1 << 11) - 1,
    })
}
fn zoned_snapshot(record: &Value) -> Result<CalendarSnapshot, Error> {
    let value = if record.get("epochNanoseconds").is_some() {
        ZonedDateTime::new_in_calendar(
            instant(record, "epochNanoseconds")?,
            time_zones().resolve(record["timeZone"].as_str().ok_or(Error::InvalidTimeZone)?)?,
            resolve_calendar(record["calendar"].as_str().ok_or(Error::InvalidCalendar)?)?,
        )
    } else {
        zoned_value(record)?
    };
    zoned_value_snapshot(value)
}
struct Offset(i128);
impl core::fmt::Display for Offset {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        let absolute = self.0.abs();
        let seconds = absolute / 1_000_000_000;
        write!(
            f,
            "{}{:02}:{:02}",
            if self.0 < 0 { '-' } else { '+' },
            seconds / 3600,
            seconds / 60 % 60
        )?;
        let mut fraction = absolute % 1_000_000_000;
        if seconds % 60 != 0 || fraction != 0 {
            write!(f, ":{:02}", seconds % 60)?;
            if fraction != 0 {
                let mut digits = 9usize;
                while fraction % 10 == 0 {
                    fraction /= 10;
                    digits -= 1;
                }
                write!(f, ".{fraction:0digits$}")?;
            }
        }
        Ok(())
    }
}
pub(crate) fn zoned_value_snapshot(
    value: ZonedDateTime<ResolvedTimeZone<'static>, CalendarRef<'static>>,
) -> Result<CalendarSnapshot, Error> {
    let offset = value.time_zone().offset_nanoseconds(value.instant());
    let local = value.instant().epoch_nanoseconds() + offset;
    let mut properties = partial_calendar_snapshot(
        value.calendar(),
        local.div_euclid(NANOSECONDS_PER_DAY) as i64,
    );
    add_clock(&mut properties, local);
    properties.values[17] = json!(local.to_string());
    properties.values[18] = json!(offset as i64);
    properties.values[19] = json!(Offset(offset).to_string());
    match value.hours_in_day() {
        Ok(hours) => {
            properties.values[20] = json!(hours);
        }
        Err(_) => {
            properties.errors |= 1 << 20;
        }
    }
    Ok(properties)
}
pub(crate) fn calendar_properties(
    calendar: CalendarRef<'_>,
    request: &Value,
) -> Result<CalendarSnapshot, Error> {
    let epoch = integer(request.get("epoch"), None)?;
    let extended = request["extended"].as_bool().unwrap_or(false);
    if epoch.abs() > 110_000_000 || !extended && !(-100_000_001..=100_000_000).contains(&epoch) {
        return Err(Error::OutOfRange);
    }
    let mut result = calendar_snapshot(calendar, epoch)?;
    if request.get("nanoseconds").is_some() {
        add_clock(&mut result, decimal(request, "nanoseconds")?);
    }
    Ok(result)
}

fn calendar_operation(op: &str, request: &Value) -> Result<Value, Error> {
    let calendar = resolve_calendar(request["calendar"].as_str().ok_or(Error::InvalidCalendar)?)?;
    if op == "calendarProperties" {
        return calendar_properties(calendar, request).map(CalendarSnapshot::into_json);
    }
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
fn time_zone_operation(op: &str, request: &Value) -> Result<Value, Error> {
    let registry = time_zones();
    let zone = registry.resolve(
        request["identifier"]
            .as_str()
            .ok_or(Error::InvalidTimeZone)?,
    )?;
    match op {
        "timeZoneIdentity" => {
            Ok(json!({"identifier":zone.identifier(),"primary":zone.primary_identifier()}))
        }
        "timeZoneOffset" => Ok(json!(
            zone.offset_nanoseconds(instant(request, "nanoseconds")?)
                .to_string()
        )),
        "timeZoneTransition" => {
            let direction = match request["direction"].as_str() {
                Some("next") => TransitionDirection::Next,
                Some("previous") => TransitionDirection::Previous,
                _ => return Err(Error::InvalidTimeZone),
            };
            Ok(
                match zone.transition(instant(request, "nanoseconds")?, direction) {
                    Some(value) => json!(value.epoch_nanoseconds().to_string()),
                    None => Value::Null,
                },
            )
        }
        "timeZonePossibleInstants" => {
            let mut values = std::vec::Vec::new();
            crate::zoned::visit_possible_instants(
                fields(&request["fields"])?,
                &zone,
                &mut |value| {
                    let value = value.epoch_nanoseconds();
                    if !values.contains(&value) {
                        values.push(value);
                    }
                },
            )?;
            values.sort_unstable();
            Ok(json!(
                values
                    .iter()
                    .map(ToString::to_string)
                    .collect::<std::vec::Vec<_>>()
            ))
        }
        "timeZoneResolve" => {
            let mode = match request["disambiguation"].as_str() {
                Some("compatible") => Disambiguation::Compatible,
                Some("earlier") => Disambiguation::Earlier,
                Some("later") => Disambiguation::Later,
                Some("reject") => Disambiguation::Reject,
                _ => return Err(Error::InvalidTimeZone),
            };
            Ok(json!(
                crate::zoned::resolve_local(fields(&request["fields"])?, &zone, mode)?
                    .epoch_nanoseconds()
                    .to_string()
            ))
        }
        _ => Err(Error::InvalidSyntax),
    }
}
fn calendar_name(request: &Value) -> Result<crate::CalendarName, Error> {
    match request["calendarName"].as_str() {
        Some("auto") => Ok(crate::CalendarName::Auto),
        Some("always") => Ok(crate::CalendarName::Always),
        Some("never") => Ok(crate::CalendarName::Never),
        Some("critical") => Ok(crate::CalendarName::Critical),
        _ => Err(Error::InvalidDateTime),
    }
}
fn date_output_operation(op: &str, request: &Value) -> Result<Value, Error> {
    if op == "formatZonedDateTime" {
        let value = zoned_value(&request["value"])?;
        let options = crate::ZonedFormatOptions {
            precision: precision(request)?,
            rounding_mode: mode(request)?,
            calendar_name: calendar_name(request)?,
            offset: request["offset"].as_bool().ok_or(Error::InvalidDateTime)?,
            time_zone_name: match request["timeZoneName"].as_str() {
                Some("auto") => crate::TimeZoneName::Auto,
                Some("never") => crate::TimeZoneName::Never,
                Some("critical") => crate::TimeZoneName::Critical,
                _ => return Err(Error::InvalidDateTime),
            },
        };
        return Ok(json!(value.format(options)?.to_string()));
    }
    if op == "formatPlainDateTime" {
        let calendar =
            resolve_calendar(request["calendar"].as_str().ok_or(Error::InvalidCalendar)?)?;
        let value =
            PlainDateTime::from_epoch_nanoseconds_in(decimal(request, "nanoseconds")?, calendar)?;
        return Ok(json!(
            value
                .format(precision(request)?, mode(request)?)?
                .with_calendar_name(calendar_name(request)?)
                .to_string()
        ));
    }
    let record = &request["value"];
    let calendar = resolve_calendar(record["calendar"].as_str().ok_or(Error::InvalidCalendar)?)?;
    let epoch = integer(record.get("epochDay"), None)?;
    let overflow = || -> Result<crate::Overflow, Error> {
        Ok(match calendar_overflow(request)? {
            Overflow::Constrain => crate::Overflow::Constrain,
            Overflow::Reject => crate::Overflow::Reject,
        })
    };
    match op {
        "formatPlainDate" => Ok(json!(
            PlainDate::from_epoch_day_in(epoch, calendar)?
                .format(calendar_name(request)?)
                .to_string()
        )),
        "formatPlainYearMonth" => Ok(json!(
            PlainYearMonth::from_epoch_day_in(epoch, calendar)?
                .format(calendar_name(request)?)
                .to_string()
        )),
        "formatPlainMonthDay" => Ok(json!(
            PlainMonthDay::from_epoch_day_in(epoch, calendar)?
                .format(calendar_name(request)?)
                .to_string()
        )),
        "addPlainYearMonth" => {
            let value = PlainYearMonth::from_epoch_day_in(epoch, calendar)?;
            let duration = duration(request)?;
            let result = match request["subtract"].as_bool() {
                Some(false) => value.checked_add(duration, overflow()?)?,
                Some(true) => value.checked_subtract(duration, overflow()?)?,
                None => return Err(Error::InvalidDuration),
            };
            Ok(json!(result.epoch_day()))
        }
        "differencePlainYearMonth" => {
            let value = PlainYearMonth::from_epoch_day_in(epoch, calendar)?;
            let other = &request["other"];
            let other_calendar =
                resolve_calendar(other["calendar"].as_str().ok_or(Error::InvalidCalendar)?)?;
            let other = PlainYearMonth::from_epoch_day_in(
                integer(other.get("epochDay"), None)?,
                other_calendar,
            )?;
            let unit = |key: &str| -> Result<crate::YearMonthUnit, Error> {
                match request[key].as_str() {
                    Some("year") => Ok(crate::YearMonthUnit::Year),
                    Some("month") => Ok(crate::YearMonthUnit::Month),
                    _ => Err(Error::InvalidRoundingOptions),
                }
            };
            let (largest, smallest, increment, mode) = (
                unit("largest")?,
                unit("smallest")?,
                integer(request.get("increment"), None)?
                    .try_into()
                    .map_err(|_| Error::InvalidRoundingOptions)?,
                mode(request)?,
            );
            let result = match request["since"].as_bool() {
                Some(false) => value.until(other, largest, smallest, increment, mode)?,
                Some(true) => value.since(other, largest, smallest, increment, mode)?,
                None => return Err(Error::InvalidRoundingOptions),
            };
            Ok(duration_record(result))
        }
        "yearMonthToDate" => {
            let value = PlainYearMonth::from_epoch_day_in(epoch, calendar)?;
            let day = request["day"].as_f64().ok_or(Error::InvalidDateTime)?;
            if !day.is_finite() || day.fract() != 0.0 || day < 1.0 {
                return Err(Error::InvalidDateTime);
            }
            Ok(json!(
                value
                    .to_plain_date(day.min(255.0) as u8, crate::Overflow::Constrain)?
                    .epoch_day()
            ))
        }
        "monthDayToDate" => {
            let value = PlainMonthDay::from_epoch_day_in(epoch, calendar)?;
            let year = integer(request.get("year"), None)?
                .try_into()
                .map_err(|_| Error::OutOfRange)?;
            Ok(json!(
                value
                    .to_plain_date(year, crate::Overflow::Constrain)?
                    .epoch_day()
            ))
        }
        _ => Err(Error::InvalidSyntax),
    }
}
pub(crate) fn parsed_offset_text(offset: crate::OffsetInput) -> Option<std::string::String> {
    match offset {
        crate::OffsetInput::Wall => None,
        crate::OffsetInput::Utc => Some("Z".to_string()),
        crate::OffsetInput::Minute(value) | crate::OffsetInput::Exact(value) => {
            let absolute = value.abs();
            let sign = if value < 0 { "-" } else { "+" };
            let base = std::format!(
                "{sign}{:02}:{:02}",
                absolute / 3_600_000_000_000,
                absolute / 60_000_000_000 % 60
            );
            Some(if matches!(offset, crate::OffsetInput::Minute(_)) {
                base
            } else {
                std::format!(
                    "{base}:{:02}.{:09}",
                    absolute / 1_000_000_000 % 60,
                    absolute % 1_000_000_000
                )
            })
        }
    }
}
fn string_operation(op: &str, request: &Value) -> Result<Value, Error> {
    if op == "resolveZonedDateTime" {
        let local = decimal(request, "nanoseconds")?;
        let fields = IsoDateTime::from_epoch_nanoseconds(local)?;
        let calendar =
            resolve_calendar(request["calendar"].as_str().ok_or(Error::InvalidCalendar)?)?;
        let zone = time_zones().resolve(
            request["identifier"]
                .as_str()
                .ok_or(Error::InvalidTimeZone)?,
        )?;
        let disambiguation = match request["disambiguation"].as_str() {
            Some("compatible") => Disambiguation::Compatible,
            Some("earlier") => Disambiguation::Earlier,
            Some("later") => Disambiguation::Later,
            Some("reject") => Disambiguation::Reject,
            _ => return Err(Error::InvalidDateTime),
        };
        let offset_option = match request["behavior"].as_str() {
            Some("prefer") => crate::OffsetOption::Prefer,
            Some("use") => crate::OffsetOption::Use,
            Some("ignore") => crate::OffsetOption::Ignore,
            Some("reject") => crate::OffsetOption::Reject,
            _ => return Err(Error::InvalidDateTime),
        };
        let offset = match request.get("offset").and_then(Value::as_str) {
            None => crate::OffsetInput::Wall,
            Some(value) if value.eq_ignore_ascii_case("z") => crate::OffsetInput::Utc,
            Some(value) => {
                let offset = crate::parse::offset_nanoseconds(value)?;
                match request["matchMinute"].as_bool() {
                    Some(true) => crate::OffsetInput::Minute(offset),
                    Some(false) => crate::OffsetInput::Exact(offset),
                    None => return Err(Error::InvalidDateTime),
                }
            }
        };
        let result = match request["dateOnly"].as_bool() {
            Some(true) => {
                ZonedDateTime::new_in_calendar(Instant::from_epoch_nanoseconds(0)?, zone, calendar)
                    .day_boundary(
                        local
                            .div_euclid(NANOSECONDS_PER_DAY)
                            .try_into()
                            .map_err(|_| Error::OutOfRange)?,
                    )?
            }
            Some(false) => ZonedDateTime::from_local_with_offset(
                fields,
                zone,
                calendar,
                offset,
                crate::ZonedParseOptions {
                    disambiguation,
                    offset: offset_option,
                },
            )?
            .instant(),
            None => return Err(Error::InvalidDateTime),
        };
        return Ok(json!(result.epoch_nanoseconds().to_string()));
    }
    let text = request["text"].as_str().ok_or(Error::InvalidSyntax)?;
    if op == "parseZonedFields" {
        let parsed = crate::parse::zoned_fields(text)?;
        // ParseISODateTime validates fields; JS reads options before representability.
        // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L977-L995
        parsed.fields.validate()?;
        let mut fields = record(parsed.fields);
        fields["calendar"] = json!(crate::parse::calendar_annotation(text).unwrap_or("iso8601"));
        let offset = parsed_offset_text(parsed.offset);
        return Ok(json!({"fields":fields,"timeZone":parsed.zone,"offset":offset}));
    }
    let calendar = calendar_for_string(text)?;
    match op {
        "parsePlainDate" => {
            let result = PlainDate::parse_in(text, calendar)?;
            Ok(json!({"epochDay":result.epoch_day(),"calendar":result.calendar_id()}))
        }
        "parsePlainDateTime" => {
            let result = PlainDateTime::parse_in(text, calendar)?;
            Ok(
                json!({"epochNanoseconds":result.epoch_nanoseconds().to_string(),"calendar":result.calendar_id()}),
            )
        }
        "parsePlainYearMonth" => {
            let result = PlainYearMonth::parse_in(text, calendar)?;
            Ok(json!({"epochDay":result.epoch_day(),"calendar":result.calendar_id()}))
        }
        "parsePlainMonthDay" => {
            let result = PlainMonthDay::parse_in(text, calendar)?;
            Ok(json!({"epochDay":result.epoch_day(),"calendar":result.calendar_id()}))
        }
        _ => Err(Error::InvalidSyntax),
    }
}
fn zoned_value(
    value: &Value,
) -> Result<ZonedDateTime<ResolvedTimeZone<'static>, CalendarRef<'static>>, Error> {
    Ok(ZonedDateTime::new_in_calendar(
        instant(value, "nanoseconds")?,
        time_zones().resolve(value["identifier"].as_str().ok_or(Error::InvalidTimeZone)?)?,
        resolve_calendar(value["calendar"].as_str().ok_or(Error::InvalidCalendar)?)?,
    ))
}
fn zoned_operation(op: &str, request: &Value) -> Result<Value, Error> {
    let value = zoned_value(&request["value"])?;
    let unit = |key: &str| -> Result<DateTimeUnit, Error> {
        request[key]
            .as_str()
            .ok_or(Error::InvalidRoundingOptions)?
            .parse()
    };
    let increment = || -> Result<u32, Error> {
        integer(request.get("increment"), None)?
            .try_into()
            .map_err(|_| Error::InvalidRoundingOptions)
    };
    match op {
        "addZonedDateTime" => {
            let duration = duration(request)?;
            let overflow = match calendar_overflow(request)? {
                Overflow::Constrain => crate::Overflow::Constrain,
                Overflow::Reject => crate::Overflow::Reject,
            };
            let result = match request["subtract"].as_bool() {
                Some(false) => value.checked_add(duration, overflow)?,
                Some(true) => value.checked_subtract(duration, overflow)?,
                None => return Err(Error::InvalidDuration),
            };
            Ok(json!(result.instant().epoch_nanoseconds().to_string()))
        }
        "differenceZonedDateTime" => {
            let other = zoned_value(&request["other"])?;
            let (largest, smallest, increment, mode) = (
                unit("largest")?,
                unit("smallest")?,
                increment()?,
                mode(request)?,
            );
            let result = match request["since"].as_bool() {
                Some(false) => value.until(&other, largest, smallest, increment, mode)?,
                Some(true) => value.since(&other, largest, smallest, increment, mode)?,
                None => return Err(Error::InvalidRoundingOptions),
            };
            Ok(duration_record(result))
        }
        "roundZonedDateTime" => Ok(json!(
            value
                .round(unit("unit")?, increment()?, mode(request)?)?
                .instant()
                .epoch_nanoseconds()
                .to_string()
        )),
        "startOfZonedDay" => {
            let instant = match request.get("day") {
                Some(day) => value.day_boundary(integer(Some(day), None)?)?,
                None => value.start_of_day()?.instant(),
            };
            Ok(json!(instant.epoch_nanoseconds().to_string()))
        }
        "hoursInZonedDay" => Ok(json!(value.hours_in_day()?)),
        _ => Err(Error::InvalidSyntax),
    }
}
enum DurationAnchor {
    Date(PlainDate<CalendarRef<'static>>),
    Zoned(ZonedDateTime<ResolvedTimeZone<'static>, CalendarRef<'static>>),
}
impl DurationAnchor {
    fn new(value: &Value) -> Result<Self, Error> {
        match value["kind"].as_str() {
            Some("date") => Ok(Self::Date(PlainDate::from_epoch_day_in(
                integer(value.get("epochDay"), None)?,
                resolve_calendar(value["calendar"].as_str().ok_or(Error::InvalidCalendar)?)?,
            )?)),
            Some("zoned") => Ok(Self::Zoned(zoned_value(value)?)),
            _ => Err(Error::InvalidDateTime),
        }
    }
    fn total(&self, duration: Duration, unit: DateTimeUnit) -> Result<f64, Error> {
        match self {
            Self::Date(value) => value.total_duration(duration, unit),
            Self::Zoned(value) => value.total_duration(duration, unit),
        }
    }
    fn round(
        &self,
        duration: Duration,
        largest: DateTimeUnit,
        smallest: DateTimeUnit,
        increment: u32,
        mode: RoundingMode,
    ) -> Result<Duration, Error> {
        match self {
            Self::Date(value) => value.round_duration(duration, largest, smallest, increment, mode),
            Self::Zoned(value) => {
                value.round_duration(duration, largest, smallest, increment, mode)
            }
        }
    }
    fn compare(&self, one: Duration, two: Duration) -> Result<core::cmp::Ordering, Error> {
        match self {
            Self::Date(value) => value.compare_durations(one, two),
            Self::Zoned(value) => value.compare_durations(one, two),
        }
    }
}
// Proposal comparison §7.3.21 steps12–15: totalDuration caller example only.
// This dispatcher transports operations; DurationAnchor::total owns anchored totals.
fn duration_operation(op: &str, request: &Value) -> Result<Value, Error> {
    if op == "parseDuration" {
        return Ok(duration_record(
            request["text"]
                .as_str()
                .ok_or(Error::InvalidSyntax)?
                .parse::<Duration>()?,
        ));
    }
    let value = duration(request)?;
    let unit = |key: &str| -> Result<DateTimeUnit, Error> {
        request[key]
            .as_str()
            .ok_or(Error::InvalidRoundingOptions)?
            .parse()
    };
    let relative = request
        .get("relative")
        .filter(|value| !value.is_null())
        .map(DurationAnchor::new)
        .transpose()?;
    match op {
        "validateDuration" => Ok(Value::Null),
        "transformDuration" => Ok(duration_record(match request["absolute"].as_bool() {
            Some(true) => value.abs(),
            Some(false) => value.negated(),
            None => return Err(Error::InvalidDuration),
        })),
        "formatDuration" => Ok(json!(
            value
                .format(precision(request)?, mode(request)?)?
                .to_string()
        )),
        "addDuration" => {
            let other = duration_value(&request["other"])?;
            let result = match request["subtract"].as_bool() {
                Some(false) => value.checked_add(other)?,
                Some(true) => value.checked_subtract(other)?,
                None => return Err(Error::InvalidDuration),
            };
            Ok(duration_record(result))
        }
        "compareDuration" => {
            let other = duration_value(&request["other"])?;
            Ok(json!(match relative {
                Some(anchor) => anchor.compare(value, other)?,
                None => value.compare_time(other)?,
            } as i8))
        }
        "totalDuration" => {
            // §7.3.21 steps12–15: anchored/time total delegates to semantic owners below.
            let unit = unit("unit")?;
            Ok(json!(match relative {
                Some(anchor) => anchor.total(value, unit)?,
                None => match unit.time() {
                    Some(unit) => value.total(unit)?,
                    None if unit == DateTimeUnit::Day => value.total_days()?,
                    None => return Err(Error::InvalidDuration),
                },
            }))
        }
        "roundDuration" => {
            let largest = unit("largest")?;
            let smallest = unit("smallest")?;
            let increment = integer(request.get("increment"), None)?
                .try_into()
                .map_err(|_| Error::InvalidRoundingOptions)?;
            let mode = mode(request)?;
            Ok(duration_record(match relative {
                Some(anchor) => anchor.round(value, largest, smallest, increment, mode)?,
                None => value.round(largest, smallest, increment, mode)?,
            }))
        }
        _ => Err(Error::InvalidSyntax),
    }
}
pub(crate) fn regulate_time_fields(
    values: [f64; 6],
    overflow: crate::Overflow,
) -> Result<PlainTime, Error> {
    let mut fields = [0i128; 6];
    for (target, value) in fields.iter_mut().zip(values) {
        if !value.is_finite() || value.fract() != 0.0 {
            return Err(Error::InvalidDateTime);
        }
        // Saturation beyond i128 preserves regulation: clamp selects the same
        // endpoint; reject still rejects. Values within clock bounds cast exactly.
        *target = value as i128;
    }
    PlainTime::from_fields(
        TimeFields {
            hour: Some(fields[0]),
            minute: Some(fields[1]),
            second: Some(fields[2]),
            millisecond: Some(fields[3]),
            microsecond: Some(fields[4]),
            nanosecond: Some(fields[5]),
        },
        overflow,
    )
}
fn time_result(value: PlainTime, request: &Value) -> Value {
    if request["clockSnapshot"].as_bool() == Some(true) {
        let (hour, minute, second, fraction) = value.fields();
        json!({"nanoseconds":value.nanoseconds().to_string(),"fields":[hour as u32, minute as u32, second as u32, fraction / 1_000_000, fraction / 1000 % 1000, fraction % 1000]})
    } else {
        json!(value.nanoseconds().to_string())
    }
}
fn time_operation(op: &str, request: &Value) -> Result<Value, Error> {
    if op == "parsePlainTime" {
        return Ok(time_result(
            request["text"]
                .as_str()
                .ok_or(Error::InvalidSyntax)?
                .parse::<PlainTime>()?,
            request,
        ));
    }
    if op == "regulatePlainTime" {
        let constrain = request["constrain"]
            .as_bool()
            .ok_or(Error::InvalidDateTime)?;
        let mut values = [0.0; 6];
        for (index, key) in [
            "hour",
            "minute",
            "second",
            "millisecond",
            "microsecond",
            "nanosecond",
        ]
        .iter()
        .enumerate()
        {
            values[index] = request["fields"][key]
                .as_f64()
                .ok_or(Error::InvalidDateTime)?;
        }
        return Ok(time_result(
            regulate_time_fields(
                values,
                if constrain {
                    crate::Overflow::Constrain
                } else {
                    crate::Overflow::Reject
                },
            )?,
            request,
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
            Ok(time_result(result, request))
        }
        "roundPlainTime" => {
            let unit = request["unit"]
                .as_str()
                .ok_or(Error::InvalidRoundingOptions)?
                .parse()?;
            let increment = integer(request.get("increment"), None)?
                .try_into()
                .map_err(|_| Error::InvalidRoundingOptions)?;
            let mode = mode(request)?;
            if request["clockSnapshot"].as_bool() == Some(true) {
                return Ok(time_result(value.round(unit, increment, mode)?, request));
            }
            Ok(json!(
                value
                    .rounded_nanoseconds(unit, increment, mode)?
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
fn plain_operation(op: &str, request: &Value) -> Result<Value, Error> {
    let calendar = resolve_calendar(request["calendar"].as_str().ok_or(Error::InvalidCalendar)?)?;
    let subtract = || request["subtract"].as_bool().ok_or(Error::InvalidDuration);
    let since = || {
        request["since"]
            .as_bool()
            .ok_or(Error::InvalidRoundingOptions)
    };
    let overflow = || -> Result<crate::Overflow, Error> {
        Ok(match calendar_overflow(request)? {
            Overflow::Constrain => crate::Overflow::Constrain,
            Overflow::Reject => crate::Overflow::Reject,
        })
    };
    let unit = |key: &str| -> Result<DateTimeUnit, Error> {
        request[key]
            .as_str()
            .ok_or(Error::InvalidRoundingOptions)?
            .parse()
    };
    let increment = || -> Result<u32, Error> {
        integer(request.get("increment"), None)?
            .try_into()
            .map_err(|_| Error::InvalidRoundingOptions)
    };
    if op.ends_with("PlainDate") {
        let value =
            PlainDate::from_epoch_day_in(integer(request.get("epochDay"), None)?, calendar)?;
        return match op {
            "addPlainDate" => {
                let duration = duration(request)?;
                let result = if subtract()? {
                    value.checked_subtract(duration, overflow()?)?
                } else {
                    value.checked_add(duration, overflow()?)?
                };
                Ok(json!(result.epoch_day()))
            }
            "differencePlainDate" => {
                let other =
                    PlainDate::from_epoch_day_in(integer(request.get("other"), None)?, calendar)?;
                let (largest, smallest, increment, mode) = (
                    unit("largest")?,
                    unit("smallest")?,
                    increment()?,
                    mode(request)?,
                );
                Ok(duration_record(if since()? {
                    value.since(other, largest, smallest, increment, mode)?
                } else {
                    value.until(other, largest, smallest, increment, mode)?
                }))
            }
            _ => Err(Error::InvalidSyntax),
        };
    }
    let value =
        PlainDateTime::from_epoch_nanoseconds_in(decimal(request, "nanoseconds")?, calendar)?;
    match op {
        "addPlainDateTime" => {
            let duration = duration(request)?;
            let result = if subtract()? {
                value.checked_subtract(duration, overflow()?)?
            } else {
                value.checked_add(duration, overflow()?)?
            };
            Ok(json!(result.epoch_nanoseconds().to_string()))
        }
        "differencePlainDateTime" => {
            let other =
                PlainDateTime::from_epoch_nanoseconds_in(decimal(request, "other")?, calendar)?;
            let (largest, smallest, increment, mode) = (
                unit("largest")?,
                unit("smallest")?,
                increment()?,
                mode(request)?,
            );
            Ok(duration_record(if since()? {
                value.since(other, largest, smallest, increment, mode)?
            } else {
                value.until(other, largest, smallest, increment, mode)?
            }))
        }
        "roundPlainDateTime" => {
            let unit = unit("unit")?;
            let increment = increment()?;
            let mode = mode(request)?;
            let result = if unit == DateTimeUnit::Day {
                if increment != 1 {
                    return Err(Error::InvalidRoundingOptions);
                }
                value.round_day(mode)?
            } else {
                value.round(
                    unit.time().ok_or(Error::InvalidRoundingOptions)?,
                    increment,
                    mode,
                )?
            };
            Ok(json!(result.epoch_nanoseconds().to_string()))
        }
        _ => Err(Error::InvalidSyntax),
    }
}
pub(crate) fn format_instant(
    value: Instant,
    precision: Precision,
    rounding: RoundingMode,
    offset: Option<i128>,
    identifier: Option<&str>,
) -> Result<crate::FormattedInstant, Error> {
    let quantum = match precision {
        Precision::Auto => 1,
        Precision::Minute => 60_000_000_000,
        Precision::Digits(digits) if digits <= 9 => 10i128.pow(u32::from(9 - digits)),
        _ => return Err(Error::InvalidRoundingOptions),
    };
    let value = Instant::from_epoch_nanoseconds(crate::rounding::round_instant(
        value.epoch_nanoseconds(),
        quantum,
        rounding,
    ))?;
    let offset = if let Some(identifier) = identifier {
        Some(
            time_zones()
                .resolve(identifier)?
                .offset_nanoseconds(value)
                .try_into()
                .map_err(|_| Error::OutOfRange)?,
        )
    } else {
        offset
            .map(|value| value.try_into().map_err(|_| Error::OutOfRange))
            .transpose()?
    };
    value.format(precision, RoundingMode::Trunc, offset)
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
            let rounding = if request.get("mode").is_some() {
                mode(request)?
            } else {
                RoundingMode::Trunc
            };
            let identifier = request["identifier"].as_str();
            let offset = if identifier.is_none() && request.get("offset").is_some() {
                Some(decimal(request, "offset")?)
            } else {
                None
            };
            Ok(json!(
                format_instant(value, precision, rounding, offset, identifier)?.to_string()
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
            if let Some(unit) = request.get("unit") {
                let unit = unit
                    .as_str()
                    .ok_or(Error::InvalidRoundingOptions)?
                    .parse()?;
                let increment = integer(request.get("increment"), None)?
                    .try_into()
                    .map_err(|_| Error::InvalidRoundingOptions)?;
                return Ok(json!(
                    value
                        .round(unit, increment, mode(request)?)?
                        .epoch_nanoseconds()
                        .to_string()
                ));
            }
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
pub(crate) fn record_call() {
    CALLS.fetch_add(1, Ordering::Relaxed);
}
pub(crate) fn execute(request: &Value) -> Result<Value, i32> {
    let op = request.get("op").and_then(Value::as_str).ok_or(2)?;
    if op == "info" {
        return Ok(
            json!({"backend":"rust-iso-instant-time-calendars-zones-duration-plain-zoned-strings-format","calls":CALLS.load(Ordering::Relaxed),"operations":OPERATIONS,"completeTemporalBackend":false}),
        );
    }
    if !matches!(
        op,
        "addPlainYearMonth"
            | "differencePlainYearMonth"
            | "yearMonthToDate"
            | "monthDayToDate"
            | "formatPlainDate"
            | "formatPlainDateTime"
            | "formatPlainYearMonth"
            | "formatPlainMonthDay"
            | "formatZonedDateTime"
            | "parsePlainDate"
            | "parsePlainDateTime"
            | "parsePlainYearMonth"
            | "parsePlainMonthDay"
            | "parseZonedFields"
            | "resolveZonedDateTime"
            | "addZonedDateTime"
            | "differenceZonedDateTime"
            | "roundZonedDateTime"
            | "startOfZonedDay"
            | "hoursInZonedDay"
            | "addPlainDate"
            | "addPlainDateTime"
            | "differencePlainDate"
            | "differencePlainDateTime"
            | "roundPlainDateTime"
            | "transformDuration"
            | "parseDuration"
            | "validateDuration"
            | "formatDuration"
            | "addDuration"
            | "compareDuration"
            | "totalDuration"
            | "roundDuration"
            | "timeZoneIdentity"
            | "timeZoneOffset"
            | "timeZonePossibleInstants"
            | "timeZoneResolve"
            | "timeZoneTransition"
            | "calendarStartOfYear"
            | "calendarMonthsInYear"
            | "calendarDaysInMonth"
            | "calendarToEpochDay"
            | "calendarFromEpochDay"
            | "calendarProperties"
            | "zonedProperties"
            | "withPlainDate"
            | "withPlainDateTime"
            | "withPlainYearMonth"
            | "withPlainMonthDay"
            | "withZonedDateTime"
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
    record_call();
    let result = (|| -> Result<Value, Error> {
        match op {
            "zonedProperties" => zoned_snapshot(&request["value"]).map(CalendarSnapshot::into_json),
            _ if op.starts_with("with") => with_operation(op, request),
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
            _ if matches!(
                op,
                "addPlainYearMonth"
                    | "differencePlainYearMonth"
                    | "yearMonthToDate"
                    | "monthDayToDate"
                    | "formatPlainDate"
                    | "formatPlainDateTime"
                    | "formatPlainYearMonth"
                    | "formatPlainMonthDay"
                    | "formatZonedDateTime"
            ) =>
            {
                date_output_operation(op, &request)
            }
            _ if matches!(
                op,
                "parsePlainDate"
                    | "parsePlainDateTime"
                    | "parsePlainYearMonth"
                    | "parsePlainMonthDay"
                    | "parseZonedFields"
                    | "resolveZonedDateTime"
            ) =>
            {
                string_operation(op, &request)
            }
            _ if op.ends_with("ZonedDateTime") || op.ends_with("ZonedDay") => {
                zoned_operation(op, &request)
            }
            _ if op.ends_with("PlainDate") || op.ends_with("PlainDateTime") => {
                plain_operation(op, &request)
            }
            _ if op.ends_with("Duration") => duration_operation(op, &request),
            _ if op.starts_with("timeZone") => time_zone_operation(op, &request),
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
        let result = execute(&request)?;
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

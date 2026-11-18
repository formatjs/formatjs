use super::Reader;
use crate::{
    CalendarName, CalendarProvider, Duration, Error, Instant, Overflow, PlainDate, PlainDateTime,
    PlainMonthDay, PlainTime, PlainYearMonth, Precision, RoundingMode, TimeUnit, TimeZone,
    TransitionDirection,
};
use core::fmt::{self, Write};
use std::vec::Vec;

const MODES: [RoundingMode; 9] = [
    RoundingMode::Ceil,
    RoundingMode::Floor,
    RoundingMode::Expand,
    RoundingMode::Trunc,
    RoundingMode::HalfCeil,
    RoundingMode::HalfFloor,
    RoundingMode::HalfExpand,
    RoundingMode::HalfTrunc,
    RoundingMode::HalfEven,
];
enum Request<'a> {
    Parse(&'a str),
    ParseDuration(&'a str),
    AddDuration([f64; 10], [f64; 10], bool),
    TransformDuration([f64; 10], bool),
    ParseZoned(&'a str),
    ResolveZoned(
        i128,
        crate::ZonedParseOptions,
        bool,
        bool,
        &'a str,
        &'a str,
        Option<&'a str>,
    ),
    ZoneTransition(i128, TransitionDirection, &'a str),
    RoundZoned(i128, crate::ZonedUnit, u32, RoundingMode, &'a str, &'a str),
    AddZoned(i128, [f64; 10], bool, Overflow, &'a str, &'a str),
    StartZoned(i128, Option<f64>, &'a str, &'a str),
    ParseTime(&'a str),
    DifferenceTime(f64, f64, TimeUnit, TimeUnit, u32, RoundingMode),
    FormatDuration([f64; 10], Precision, RoundingMode),
    RegulateTime([f64; 6], Overflow),
    AddTime(f64, [f64; 10], bool),
    RoundTime(f64, TimeUnit, u32, RoundingMode),
    FormatTime(f64, Precision, RoundingMode),
    ParseDateTime(&'a str),
    AddDateTime(i128, [f64; 10], bool, Overflow, &'a str),
    RoundDateTime(i128, Option<TimeUnit>, u32, RoundingMode, &'a str),
    FormatDateTime(i128, Precision, RoundingMode, CalendarName, &'a str),
    FormatDate(&'a str, f64, CalendarName, &'a str),
    ParseDate(&'a str, &'a str),
    CreateISODate([f64; 3], Option<crate::calendar::MonthCode>, Overflow),
    WithISODate(
        &'a str,
        f64,
        [f64; 3],
        Option<crate::calendar::MonthCode>,
        Overflow,
    ),
    AddDate(f64, [f64; 10], bool, Overflow, &'a str),
    Add(i128, [f64; 10], bool),
    Round(i128, TimeUnit, u32, RoundingMode),
    Format(i128, Precision, RoundingMode, Option<i128>, Option<&'a str>),
}
fn read_iso_fields(
    reader: &mut Reader<'_>,
) -> Result<([f64; 3], Option<crate::calendar::MonthCode>, Overflow), i32> {
    let mut fields = [0.0; 3];
    for field in &mut fields {
        *field = f64::from_le_bytes(reader.take(8)?.try_into().map_err(|_| 2)?);
    }
    let number = reader.byte()?;
    let flags = reader.byte()?;
    if flags > 3 || flags == 2 {
        return Err(2);
    }
    let code = (flags & 1 != 0).then_some(crate::calendar::MonthCode {
        number,
        leap: flags & 2 != 0,
    });
    let overflow = match reader.byte()? {
        0 => Overflow::Constrain,
        1 => Overflow::Reject,
        _ => return Err(2),
    };
    Ok((fields, code, overflow))
}
fn read_request<'a>(operation: &'a str, reader: &mut Reader<'a>) -> Result<Request<'a>, i32> {
    let request = match operation {
        "parseDuration" => {
            let len = reader.length()?;
            Request::ParseDuration(core::str::from_utf8(reader.take(len)?).map_err(|_| 2)?)
        }
        "addDuration" | "transformDuration" => {
            let mut one = [0.0; 10];
            for value in &mut one {
                *value = f64::from_le_bytes(reader.take(8)?.try_into().map_err(|_| 2)?);
            }
            if operation == "addDuration" {
                let mut two = [0.0; 10];
                for value in &mut two {
                    *value = f64::from_le_bytes(reader.take(8)?.try_into().map_err(|_| 2)?);
                }
                let subtract = match reader.byte()? {
                    0 => false,
                    1 => true,
                    _ => return Err(2),
                };
                Request::AddDuration(one, two, subtract)
            } else {
                let absolute = match reader.byte()? {
                    0 => false,
                    1 => true,
                    _ => return Err(2),
                };
                Request::TransformDuration(one, absolute)
            }
        }
        "addZonedDateTime" | "startOfZonedDay" => {
            let ns = i128::from_le_bytes(reader.take(16)?.try_into().map_err(|_| 2)?);
            let mut fields = [0.0; 10];
            let mut day = None;
            let mut subtract = false;
            let mut overflow = Overflow::Constrain;
            if operation == "addZonedDateTime" {
                for value in &mut fields {
                    *value = f64::from_le_bytes(reader.take(8)?.try_into().map_err(|_| 2)?);
                }
                subtract = match reader.byte()? {
                    0 => false,
                    1 => true,
                    _ => return Err(2),
                };
                overflow = match reader.byte()? {
                    0 => Overflow::Constrain,
                    1 => Overflow::Reject,
                    _ => return Err(2),
                };
            } else {
                let present = reader.byte()?;
                let value = f64::from_le_bytes(reader.take(8)?.try_into().map_err(|_| 2)?);
                day = match present {
                    0 if value == 0.0 => None,
                    1 => Some(value),
                    _ => return Err(2),
                };
            }
            let len = reader.length()?;
            let identifier = core::str::from_utf8(reader.take(len)?).map_err(|_| 2)?;
            let len = reader.length()?;
            let calendar = core::str::from_utf8(reader.take(len)?).map_err(|_| 2)?;
            if operation == "addZonedDateTime" {
                Request::AddZoned(ns, fields, subtract, overflow, identifier, calendar)
            } else {
                Request::StartZoned(ns, day, identifier, calendar)
            }
        }
        "roundZonedDateTime" => {
            let ns = i128::from_le_bytes(reader.take(16)?.try_into().map_err(|_| 2)?);
            let unit = *[
                crate::ZonedUnit::Hour,
                crate::ZonedUnit::Minute,
                crate::ZonedUnit::Second,
                crate::ZonedUnit::Millisecond,
                crate::ZonedUnit::Microsecond,
                crate::ZonedUnit::Nanosecond,
                crate::ZonedUnit::Day,
            ]
            .get(usize::from(reader.byte()?))
            .ok_or(2)?;
            let increment = u32::from_le_bytes(reader.take(4)?.try_into().map_err(|_| 2)?);
            let mode = *MODES.get(usize::from(reader.byte()?)).ok_or(2)?;
            let len = reader.length()?;
            let identifier = core::str::from_utf8(reader.take(len)?).map_err(|_| 2)?;
            let len = reader.length()?;
            let calendar = core::str::from_utf8(reader.take(len)?).map_err(|_| 2)?;
            Request::RoundZoned(ns, unit, increment, mode, identifier, calendar)
        }
        "parseZonedFields" => {
            let len = reader.length()?;
            Request::ParseZoned(core::str::from_utf8(reader.take(len)?).map_err(|_| 2)?)
        }
        "resolveZonedDateTime" => {
            let local = i128::from_le_bytes(reader.take(16)?.try_into().map_err(|_| 2)?);
            let disambiguation = *[
                crate::Disambiguation::Compatible,
                crate::Disambiguation::Earlier,
                crate::Disambiguation::Later,
                crate::Disambiguation::Reject,
            ]
            .get(usize::from(reader.byte()?))
            .ok_or(2)?;
            let offset = *[
                crate::OffsetOption::Prefer,
                crate::OffsetOption::Use,
                crate::OffsetOption::Ignore,
                crate::OffsetOption::Reject,
            ]
            .get(usize::from(reader.byte()?))
            .ok_or(2)?;
            let flags = reader.byte()?;
            if flags > 7 {
                return Err(2);
            }
            let mut read_text = || {
                let len = reader.length()?;
                core::str::from_utf8(reader.take(len)?).map_err(|_| 2)
            };
            let identifier = read_text()?;
            let calendar = read_text()?;
            let text = read_text()?;
            if flags & 4 == 0 && !text.is_empty() {
                return Err(2);
            }
            Request::ResolveZoned(
                local,
                crate::ZonedParseOptions {
                    disambiguation,
                    offset,
                },
                flags & 1 != 0,
                flags & 2 != 0,
                identifier,
                calendar,
                (flags & 4 != 0).then_some(text),
            )
        }
        "timeZoneTransition" => {
            let value = i128::from_le_bytes(reader.take(16)?.try_into().map_err(|_| 2)?);
            let direction = match reader.byte()? {
                0 => TransitionDirection::Next,
                1 => TransitionDirection::Previous,
                _ => return Err(2),
            };
            let len = reader.length()?;
            let identifier = core::str::from_utf8(reader.take(len)?).map_err(|_| 2)?;
            Request::ZoneTransition(value, direction, identifier)
        }
        "parseInstant" => {
            let len = reader.length()?;
            Request::Parse(core::str::from_utf8(reader.take(len)?).map_err(|_| 2)?)
        }
        "differencePlainTime" => {
            let one = f64::from_le_bytes(reader.take(8)?.try_into().map_err(|_| 2)?);
            let other = f64::from_le_bytes(reader.take(8)?.try_into().map_err(|_| 2)?);
            let units = [
                TimeUnit::Hour,
                TimeUnit::Minute,
                TimeUnit::Second,
                TimeUnit::Millisecond,
                TimeUnit::Microsecond,
                TimeUnit::Nanosecond,
            ];
            let largest = *units.get(usize::from(reader.byte()?)).ok_or(2)?;
            let smallest = *units.get(usize::from(reader.byte()?)).ok_or(2)?;
            let increment = u32::from_le_bytes(reader.take(4)?.try_into().map_err(|_| 2)?);
            let mode = *MODES.get(usize::from(reader.byte()?)).ok_or(2)?;
            Request::DifferenceTime(one, other, largest, smallest, increment, mode)
        }
        "formatDuration" => {
            let mut fields = [0.0; 10];
            for field in &mut fields {
                *field = f64::from_le_bytes(reader.take(8)?.try_into().map_err(|_| 2)?);
            }
            let precision = match reader.byte()? {
                255 => Precision::Auto,
                254 => Precision::Minute,
                value => Precision::Digits(value),
            };
            let mode = *MODES.get(usize::from(reader.byte()?)).ok_or(2)?;
            Request::FormatDuration(fields, precision, mode)
        }
        "parsePlainTime" => {
            let len = reader.length()?;
            Request::ParseTime(core::str::from_utf8(reader.take(len)?).map_err(|_| 2)?)
        }
        "regulatePlainTime" => {
            let mut fields = [0.0; 6];
            for field in &mut fields {
                *field = f64::from_le_bytes(reader.take(8)?.try_into().map_err(|_| 2)?);
            }
            let overflow = match reader.byte()? {
                0 => Overflow::Reject,
                1 => Overflow::Constrain,
                _ => return Err(2),
            };
            Request::RegulateTime(fields, overflow)
        }
        "addPlainTime" => {
            let ns = f64::from_le_bytes(reader.take(8)?.try_into().map_err(|_| 2)?);
            let mut fields = [0.0; 10];
            for field in &mut fields {
                *field = f64::from_le_bytes(reader.take(8)?.try_into().map_err(|_| 2)?);
            }
            let subtract = match reader.byte()? {
                0 => false,
                1 => true,
                _ => return Err(2),
            };
            Request::AddTime(ns, fields, subtract)
        }
        "roundPlainTime" => {
            let ns = f64::from_le_bytes(reader.take(8)?.try_into().map_err(|_| 2)?);
            let units = [
                TimeUnit::Hour,
                TimeUnit::Minute,
                TimeUnit::Second,
                TimeUnit::Millisecond,
                TimeUnit::Microsecond,
                TimeUnit::Nanosecond,
            ];
            let unit = *units.get(usize::from(reader.byte()?)).ok_or(2)?;
            let increment = u32::from_le_bytes(reader.take(4)?.try_into().map_err(|_| 2)?);
            let mode = *MODES.get(usize::from(reader.byte()?)).ok_or(2)?;
            Request::RoundTime(ns, unit, increment, mode)
        }
        "formatPlainTime" => {
            let ns = f64::from_le_bytes(reader.take(8)?.try_into().map_err(|_| 2)?);
            let precision = match reader.byte()? {
                255 => Precision::Auto,
                254 => Precision::Minute,
                value => Precision::Digits(value),
            };
            let mode = *MODES.get(usize::from(reader.byte()?)).ok_or(2)?;
            Request::FormatTime(ns, precision, mode)
        }
        "parsePlainDateTime" => {
            let len = reader.length()?;
            Request::ParseDateTime(core::str::from_utf8(reader.take(len)?).map_err(|_| 2)?)
        }
        "formatPlainDateTime" => {
            let value = i128::from_le_bytes(reader.take(16)?.try_into().map_err(|_| 2)?);
            let precision = match reader.byte()? {
                255 => Precision::Auto,
                254 => Precision::Minute,
                value => Precision::Digits(value),
            };
            let mode = *MODES.get(usize::from(reader.byte()?)).ok_or(2)?;
            let names = [
                CalendarName::Auto,
                CalendarName::Always,
                CalendarName::Never,
                CalendarName::Critical,
            ];
            let name = *names.get(usize::from(reader.byte()?)).ok_or(2)?;
            let len = reader.length()?;
            let calendar = core::str::from_utf8(reader.take(len)?).map_err(|_| 2)?;
            Request::FormatDateTime(value, precision, mode, name, calendar)
        }
        "parsePlainDate" | "parsePlainYearMonth" | "parsePlainMonthDay" => {
            let len = reader.length()?;
            Request::ParseDate(
                operation,
                core::str::from_utf8(reader.take(len)?).map_err(|_| 2)?,
            )
        }
        "calendarToEpochDay" => {
            let (fields, code, overflow) = read_iso_fields(reader)?;
            Request::CreateISODate(fields, code, overflow)
        }
        "withPlainDate" | "withPlainYearMonth" | "withPlainMonthDay" => {
            let epoch = f64::from_le_bytes(reader.take(8)?.try_into().map_err(|_| 2)?);
            let (fields, code, overflow) = read_iso_fields(reader)?;
            Request::WithISODate(operation, epoch, fields, code, overflow)
        }
        "formatPlainDate" | "formatPlainYearMonth" | "formatPlainMonthDay" => {
            let epoch = f64::from_le_bytes(reader.take(8)?.try_into().map_err(|_| 2)?);
            let names = [
                CalendarName::Auto,
                CalendarName::Always,
                CalendarName::Never,
                CalendarName::Critical,
            ];
            let name = *names.get(usize::from(reader.byte()?)).ok_or(2)?;
            let len = reader.length()?;
            let calendar = core::str::from_utf8(reader.take(len)?).map_err(|_| 2)?;
            Request::FormatDate(operation, epoch, name, calendar)
        }
        "addPlainDateTime" => {
            let ns = i128::from_le_bytes(reader.take(16)?.try_into().map_err(|_| 2)?);
            let mut fields = [0.0; 10];
            for value in &mut fields {
                *value = f64::from_le_bytes(reader.take(8)?.try_into().map_err(|_| 2)?);
            }
            let subtract = match reader.byte()? {
                0 => false,
                1 => true,
                _ => return Err(2),
            };
            let overflow = match reader.byte()? {
                0 => Overflow::Constrain,
                1 => Overflow::Reject,
                _ => return Err(2),
            };
            let len = reader.length()?;
            let calendar = core::str::from_utf8(reader.take(len)?).map_err(|_| 2)?;
            Request::AddDateTime(ns, fields, subtract, overflow, calendar)
        }
        "roundPlainDateTime" => {
            let ns = i128::from_le_bytes(reader.take(16)?.try_into().map_err(|_| 2)?);
            let units = [
                Some(TimeUnit::Hour),
                Some(TimeUnit::Minute),
                Some(TimeUnit::Second),
                Some(TimeUnit::Millisecond),
                Some(TimeUnit::Microsecond),
                Some(TimeUnit::Nanosecond),
                None,
            ];
            let unit = *units.get(usize::from(reader.byte()?)).ok_or(2)?;
            let increment = u32::from_le_bytes(reader.take(4)?.try_into().map_err(|_| 2)?);
            let mode = *MODES.get(usize::from(reader.byte()?)).ok_or(2)?;
            let len = reader.length()?;
            let calendar = core::str::from_utf8(reader.take(len)?).map_err(|_| 2)?;
            Request::RoundDateTime(ns, unit, increment, mode, calendar)
        }
        "addPlainDate" => {
            let epoch = f64::from_le_bytes(reader.take(8)?.try_into().map_err(|_| 2)?);
            let mut fields = [0.0; 10];
            for value in &mut fields {
                *value = f64::from_le_bytes(reader.take(8)?.try_into().map_err(|_| 2)?);
            }
            let subtract = match reader.byte()? {
                0 => false,
                1 => true,
                _ => return Err(2),
            };
            let overflow = match reader.byte()? {
                0 => Overflow::Constrain,
                1 => Overflow::Reject,
                _ => return Err(2),
            };
            let len = reader.length()?;
            let calendar = core::str::from_utf8(reader.take(len)?).map_err(|_| 2)?;
            Request::AddDate(epoch, fields, subtract, overflow, calendar)
        }
        "addInstant" => {
            let value = i128::from_le_bytes(reader.take(16)?.try_into().map_err(|_| 2)?);
            let mut fields = [0.0; 10];
            for value in &mut fields {
                *value = f64::from_le_bytes(reader.take(8)?.try_into().map_err(|_| 2)?);
            }
            let subtract = match reader.byte()? {
                0 => false,
                1 => true,
                _ => return Err(2),
            };
            Request::Add(value, fields, subtract)
        }
        "roundInstant" => {
            let value = i128::from_le_bytes(reader.take(16)?.try_into().map_err(|_| 2)?);
            let units = [
                TimeUnit::Hour,
                TimeUnit::Minute,
                TimeUnit::Second,
                TimeUnit::Millisecond,
                TimeUnit::Microsecond,
                TimeUnit::Nanosecond,
            ];
            let unit = *units.get(usize::from(reader.byte()?)).ok_or(2)?;
            let increment = u32::from_le_bytes(reader.take(4)?.try_into().map_err(|_| 2)?);
            let mode = *MODES.get(usize::from(reader.byte()?)).ok_or(2)?;
            Request::Round(value, unit, increment, mode)
        }
        "formatInstant" => {
            let value = i128::from_le_bytes(reader.take(16)?.try_into().map_err(|_| 2)?);
            let precision = match reader.byte()? {
                255 => Precision::Auto,
                254 => Precision::Minute,
                value => Precision::Digits(value),
            };
            let mode = *MODES.get(usize::from(reader.byte()?)).ok_or(2)?;
            let flags = reader.byte()?;
            if flags > 3 {
                return Err(2);
            }
            let offset = i64::from_le_bytes(reader.take(8)?.try_into().map_err(|_| 2)?) as i128;
            let len = reader.length()?;
            let identifier = core::str::from_utf8(reader.take(len)?).map_err(|_| 2)?;
            Request::Format(
                value,
                precision,
                mode,
                (flags & 1 != 0).then_some(offset),
                (flags & 2 != 0).then_some(identifier),
            )
        }
        _ => return Err(2),
    };
    if reader.offset != reader.bytes.len() {
        return Err(2);
    }
    Ok(request)
}
struct Text<'a>(&'a mut Vec<u8>);
impl Write for Text<'_> {
    fn write_str(&mut self, value: &str) -> fmt::Result {
        self.0.extend_from_slice(value.as_bytes());
        Ok(())
    }
}
fn write_integer(output: &mut Vec<u8>, value: i128) {
    if let Ok(value) = i64::try_from(value) {
        output.push(15);
        output.extend_from_slice(&value.to_le_bytes());
    } else {
        output.push(10);
        output.extend_from_slice(&value.to_le_bytes());
    }
}
fn duration(fields: [f64; 10]) -> Result<Duration, Error> {
    let mut integers = [0; 10];
    for (target, value) in integers.iter_mut().zip(fields) {
        if !value.is_finite()
            || value.fract() != 0.0
            || value < i128::MIN as f64
            || value >= -(i128::MIN as f64)
        {
            return Err(Error::InvalidDuration);
        }
        *target = value as i128;
    }
    Duration::new(integers)
}
fn write_text(output: &mut Vec<u8>, value: impl fmt::Display) -> Result<(), Error> {
    output.push(4);
    let position = output.len();
    output.extend_from_slice(&[0; 4]);
    write!(Text(output), "{value}").map_err(|_| Error::InvalidDateTime)?;
    let length = (output.len() - position - 4) as u32;
    output[position..position + 4].copy_from_slice(&length.to_le_bytes());
    Ok(())
}
fn iso_fields(
    fields: [f64; 3],
    month_code: Option<crate::calendar::MonthCode>,
    overflow: Overflow,
) -> Result<crate::DateFields<'static>, Error> {
    let constrain = overflow == Overflow::Constrain;
    let optional = |value: f64, clamp| {
        if value.is_nan() {
            Ok(None)
        } else {
            crate::ffi::calendar_field_number(value, clamp).map(Some)
        }
    };
    Ok(crate::DateFields {
        year: optional(fields[0], false)?,
        month: optional(fields[1], constrain)?,
        day: optional(fields[2], constrain)?,
        month_code,
        ..Default::default()
    })
}
fn time(value: f64) -> Result<PlainTime, Error> {
    if !value.is_finite()
        || value.fract() != 0.0
        || !(0.0..crate::NANOSECONDS_PER_DAY as f64).contains(&value)
    {
        return Err(Error::InvalidDateTime);
    }
    PlainTime::from_nanoseconds(i128::from(value as u64))
}
fn encode_time(output: &mut Vec<u8>, value: PlainTime) {
    let (hour, minute, second, fraction) = value.fields();
    output.push(13);
    output.extend_from_slice(&(value.nanoseconds() as u64 as f64).to_le_bytes());
    output.extend_from_slice(&[hour, minute, second]);
    for field in [
        fraction / 1_000_000,
        fraction / 1000 % 1000,
        fraction % 1000,
    ] {
        output.extend_from_slice(&(field as u16).to_le_bytes());
    }
}
type ZonedValue =
    crate::ZonedDateTime<crate::ResolvedTimeZone<'static>, crate::CalendarRef<'static>>;
fn zoned_value(ns: i128, identifier: &str, calendar: &str) -> Result<ZonedValue, Error> {
    Ok(crate::ZonedDateTime::new_in_calendar(
        Instant::from_epoch_nanoseconds(ns)?,
        crate::ffi::time_zones().resolve(identifier)?,
        crate::ffi::resolve_calendar(calendar)?,
    ))
}
fn iso_date_time_record(ns: i128) -> Result<[u8; 48], Error> {
    let fields = crate::IsoDateTime::from_epoch_nanoseconds(ns)?;
    let calendar = crate::calendar::Calendar::Iso8601;
    let epoch = ns.div_euclid(crate::NANOSECONDS_PER_DAY) as i64;
    let start = calendar
        .start_of_year(fields.year)
        .map_err(crate::calendar_provider::error)?;
    let length = calendar
        .days_in_month(fields.year, fields.month)
        .map_err(crate::calendar_provider::error)?;
    let weekday = (epoch + 3).rem_euclid(7) + 1;
    let thursday = epoch + 4 - weekday;
    let week_year = crate::calendar::iso_fields(thursday).0;
    let week = (thursday - crate::iso::epoch_day_from_iso(week_year, 1, 1)) / 7 + 1;
    let leap = fields.year % 4 == 0 && (fields.year % 100 != 0 || fields.year % 400 == 0);
    let mut bytes = [0; 48];
    bytes[0] = 12;
    bytes[1..17].copy_from_slice(&ns.to_le_bytes());
    bytes[17] = 11;
    bytes[18..22].copy_from_slice(&(epoch as i32).to_le_bytes());
    bytes[22..26].copy_from_slice(&fields.year.to_le_bytes());
    bytes[26..30].copy_from_slice(&[fields.month, fields.day, weekday as u8, length]);
    bytes[30..32].copy_from_slice(&(if leap { 366u16 } else { 365 }).to_le_bytes());
    bytes[32..34].copy_from_slice(&((epoch - start + 1) as u16).to_le_bytes());
    bytes[34] = week as u8;
    bytes[35..39].copy_from_slice(&week_year.to_le_bytes());
    bytes[39..42].copy_from_slice(&[fields.hour, fields.minute, fields.second]);
    bytes[42..44].copy_from_slice(&((fields.nanosecond / 1_000_000) as u16).to_le_bytes());
    bytes[44..46].copy_from_slice(&((fields.nanosecond / 1000 % 1000) as u16).to_le_bytes());
    bytes[46..48].copy_from_slice(&((fields.nanosecond % 1000) as u16).to_le_bytes());
    Ok(bytes)
}
fn encode_zoned_value(output: &mut Vec<u8>, value: ZonedValue) -> Result<(), Error> {
    if value.calendar().id() == "iso8601" {
        let ns = value.instant().epoch_nanoseconds();
        let offset = value.time_zone().offset_nanoseconds(value.instant());
        if let (Ok(record), Ok(hours)) = (iso_date_time_record(ns + offset), value.hours_in_day()) {
            output.push(17);
            output.extend_from_slice(&ns.to_le_bytes());
            output.extend_from_slice(&(offset as f64).to_le_bytes());
            output.extend_from_slice(&hours.to_le_bytes());
            let length_at = output.len();
            output.extend_from_slice(&[0; 4]);
            let start = output.len();
            write!(Text(output), "{}", crate::ffi::full_offset(offset))
                .map_err(|_| Error::OutOfRange)?;
            let length = (output.len() - start) as u32;
            output[length_at..length_at + 4].copy_from_slice(&length.to_le_bytes());
            output.extend_from_slice(&record);
            return Ok(());
        }
    }
    super::encode_zoned(
        output,
        value.instant().epoch_nanoseconds(),
        value.calendar().id(),
        crate::ffi::zoned_value_snapshot(value)?,
    );
    Ok(())
}
fn encode_duration(output: &mut Vec<u8>, value: Duration) {
    output.push(14);
    for field in value.fields() {
        output.extend_from_slice(&(field as f64).to_le_bytes());
    }
}
fn execute(request: Request<'_>, output: &mut Vec<u8>) -> Result<(), Error> {
    match request {
        Request::ParseDuration(text) => encode_duration(output, text.parse::<Duration>()?),
        Request::AddDuration(one, two, subtract) => {
            let one = duration(one)?;
            let two = duration(two)?;
            encode_duration(
                output,
                if subtract {
                    one.checked_subtract(two)?
                } else {
                    one.checked_add(two)?
                },
            );
        }
        Request::TransformDuration(fields, absolute) => {
            let value = duration(fields)?;
            encode_duration(
                output,
                if absolute {
                    value.abs()
                } else {
                    value.negated()
                },
            );
        }
        Request::AddZoned(ns, fields, subtract, overflow, identifier, calendar) => {
            let value = zoned_value(ns, identifier, calendar)?;
            let duration = duration(fields)?;
            let value = if subtract {
                value.checked_subtract(duration, overflow)?
            } else {
                value.checked_add(duration, overflow)?
            };
            encode_zoned_value(output, value)?;
        }
        Request::StartZoned(ns, day, identifier, calendar) => {
            let value = zoned_value(ns, identifier, calendar)?;
            let value = if let Some(day) = day {
                crate::ZonedDateTime::new_in_calendar(
                    value
                        .day_boundary(i64::from(crate::ffi::calendar_field_number(day, false)?))?,
                    *value.time_zone(),
                    value.calendar(),
                )
            } else {
                value.start_of_day()?
            };
            encode_zoned_value(output, value)?;
        }
        Request::RoundZoned(ns, unit, increment, mode, identifier, calendar) => {
            let value = zoned_value(ns, identifier, calendar)?.round(unit, increment, mode)?;
            encode_zoned_value(output, value)?;
        }
        Request::DifferenceTime(one, other, largest, smallest, increment, mode) => {
            let value = time(one)?.until(time(other)?, largest, smallest, increment, mode)?;
            encode_duration(output, value);
        }
        Request::FormatDuration(fields, precision, mode) => {
            write_text(output, duration(fields)?.format(precision, mode)?)?
        }
        Request::ParseTime(text) => encode_time(output, text.parse::<PlainTime>()?),
        Request::RegulateTime(fields, overflow) => {
            encode_time(output, crate::ffi::regulate_time_fields(fields, overflow)?)
        }
        Request::AddTime(ns, fields, subtract) => {
            let value = time(ns)?;
            let duration = duration(fields)?;
            encode_time(
                output,
                if subtract {
                    value.checked_subtract(duration)?
                } else {
                    value.checked_add(duration)?
                },
            );
        }
        Request::RoundTime(ns, unit, increment, mode) => {
            encode_time(output, time(ns)?.round(unit, increment, mode)?)
        }
        Request::FormatTime(ns, precision, mode) => {
            write_text(output, time(ns)?.format(precision, mode)?)?
        }
        Request::AddDateTime(ns, fields, subtract, overflow, calendar) => {
            let calendar = crate::ffi::resolve_calendar(calendar)?;
            let value = PlainDateTime::from_epoch_nanoseconds_in(ns, calendar)?;
            let duration = duration(fields)?;
            let result = if subtract {
                value.checked_subtract(duration, overflow)?
            } else {
                value.checked_add(duration, overflow)?
            };
            let ns = result.epoch_nanoseconds();
            super::encode_date_time(
                output,
                ns,
                calendar.id(),
                crate::ffi::date_time_snapshot(calendar, ns),
            );
        }
        Request::RoundDateTime(ns, unit, increment, mode, calendar) => {
            let calendar = crate::ffi::resolve_calendar(calendar)?;
            let value = PlainDateTime::from_epoch_nanoseconds_in(ns, calendar)?;
            let result = if let Some(unit) = unit {
                value.round(unit, increment, mode)?
            } else {
                if increment != 1 {
                    return Err(Error::InvalidRoundingOptions);
                }
                value.round_day(mode)?
            };
            let ns = result.epoch_nanoseconds();
            super::encode_date_time(
                output,
                ns,
                calendar.id(),
                crate::ffi::date_time_snapshot(calendar, ns),
            );
        }
        Request::ParseDateTime(text) => {
            let calendar = crate::ffi::calendar_for_string(text)?;
            let ns = PlainDateTime::parse_in(text, calendar)?.epoch_nanoseconds();
            super::encode_date_time(
                output,
                ns,
                calendar.id(),
                crate::ffi::date_time_snapshot(calendar, ns),
            );
        }
        Request::FormatDateTime(ns, precision, mode, name, calendar) => {
            let calendar = crate::ffi::resolve_calendar(calendar)?;
            let value = PlainDateTime::from_epoch_nanoseconds_in(ns, calendar)?;
            write_text(
                output,
                value.format(precision, mode)?.with_calendar_name(name),
            )?;
        }
        Request::FormatDate(operation, epoch, name, calendar) => {
            if !epoch.is_finite()
                || epoch.fract() != 0.0
                || !(-110_000_000.0..=110_000_000.0).contains(&epoch)
            {
                return Err(Error::OutOfRange);
            }
            let calendar = crate::ffi::resolve_calendar(calendar)?;
            let epoch = epoch as i64;
            match operation {
                "formatPlainDate" => write_text(
                    output,
                    PlainDate::from_epoch_day_in(epoch, calendar)?.format(name),
                )?,
                "formatPlainYearMonth" => write_text(
                    output,
                    PlainYearMonth::from_epoch_day_in(epoch, calendar)?.format(name),
                )?,
                "formatPlainMonthDay" => write_text(
                    output,
                    PlainMonthDay::from_epoch_day_in(epoch, calendar)?.format(name),
                )?,
                _ => return Err(Error::InvalidSyntax),
            }
        }
        Request::ParseZoned(text) => {
            let parsed = crate::parse::zoned_fields(text)?;
            let fields = parsed.fields;
            let local = fields.to_epoch_nanoseconds()?;
            let offset = crate::ffi::parsed_offset_text(parsed.offset);
            let zone = crate::ffi::time_zones().resolve(parsed.zone).ok();
            let identifier = zone.as_ref().map_or("", |zone| zone.identifier());
            output.push(18);
            output.extend_from_slice(&local.to_le_bytes());
            output.extend_from_slice(&fields.year.to_le_bytes());
            output.extend_from_slice(&[
                fields.month,
                fields.day,
                fields.hour,
                fields.minute,
                fields.second,
            ]);
            for value in [
                fields.nanosecond / 1_000_000,
                fields.nanosecond / 1000 % 1000,
                fields.nanosecond % 1000,
            ] {
                output.extend_from_slice(&(value as u16).to_le_bytes());
            }
            output.push(u8::from(offset.is_some()));
            for value in [
                crate::parse::calendar_annotation(text).unwrap_or("iso8601"),
                parsed.zone,
                offset.as_deref().unwrap_or(""),
                identifier,
            ] {
                output.extend_from_slice(&(value.len() as u32).to_le_bytes());
                output.extend_from_slice(value.as_bytes());
            }
        }
        Request::ResolveZoned(
            local,
            options,
            date_only,
            match_minute,
            identifier,
            calendar,
            text,
        ) => {
            crate::iso::check_local(local)?;
            let calendar = crate::ffi::resolve_calendar(calendar)?;
            let zone = crate::ffi::time_zones().resolve(identifier)?;
            let offset = match text {
                None => crate::OffsetInput::Wall,
                Some(value) if value.eq_ignore_ascii_case("z") => crate::OffsetInput::Utc,
                Some(value) => {
                    let offset = crate::parse::offset_nanoseconds(value)?;
                    if match_minute {
                        crate::OffsetInput::Minute(offset)
                    } else {
                        crate::OffsetInput::Exact(offset)
                    }
                }
            };
            let value = if date_only {
                let instant = crate::ZonedDateTime::new_in_calendar(
                    Instant::from_epoch_nanoseconds(0)?,
                    zone,
                    calendar,
                )
                .day_boundary(
                    (local.div_euclid(crate::NANOSECONDS_PER_DAY))
                        .try_into()
                        .map_err(|_| Error::OutOfRange)?,
                )?;
                crate::ZonedDateTime::new_in_calendar(instant, zone, calendar)
            } else {
                crate::ZonedDateTime::from_local_nanoseconds_with_offset(
                    local, zone, calendar, offset, options,
                )?
            };
            encode_zoned_value(output, value)?;
        }
        Request::ZoneTransition(value, direction, identifier) => {
            let zone = crate::ffi::time_zones().resolve(identifier)?;
            let value = Instant::from_epoch_nanoseconds(value)?;
            match zone.transition(value, direction) {
                Some(value) => write_integer(output, value.epoch_nanoseconds()),
                None => output.push(0),
            }
        }
        Request::Parse(text) => write_integer(output, text.parse::<Instant>()?.epoch_nanoseconds()),
        Request::WithISODate(operation, epoch, fields, month_code, overflow) => {
            if !epoch.is_finite()
                || epoch.fract() != 0.0
                || !(-110_000_000.0..=110_000_000.0).contains(&epoch)
            {
                return Err(Error::OutOfRange);
            }
            let calendar = crate::calendar::Calendar::Iso8601;
            let fields = iso_fields(fields, month_code, overflow)?;
            let epoch = match operation {
                "withPlainDate" => PlainDate::from_epoch_day_in(epoch as i64, calendar)?
                    .with_fields(fields, overflow)?
                    .epoch_day(),
                "withPlainYearMonth" => PlainYearMonth::from_epoch_day_in(epoch as i64, calendar)?
                    .with_fields(fields, overflow)?
                    .epoch_day(),
                "withPlainMonthDay" => PlainMonthDay::from_epoch_day_in(epoch as i64, calendar)?
                    .with_fields(fields, overflow)?
                    .epoch_day(),
                _ => return Err(Error::InvalidSyntax),
            };
            let calendar = crate::ffi::resolve_calendar("iso8601")?;
            super::encode_date(
                output,
                epoch,
                "iso8601",
                crate::ffi::calendar_snapshot(calendar, epoch)?,
            );
        }
        Request::CreateISODate(fields, month_code, overflow) => {
            let calendar = crate::calendar::Calendar::Iso8601;
            let fields = iso_fields(fields, month_code, overflow)?;
            let epoch = PlainDate::from_calendar_fields(calendar, fields, overflow)?.epoch_day();
            let calendar = crate::ffi::resolve_calendar("iso8601")?;
            super::encode_date(
                output,
                epoch,
                "iso8601",
                crate::ffi::calendar_snapshot(calendar, epoch)?,
            );
        }
        Request::ParseDate(operation, text) => {
            let calendar = crate::ffi::calendar_for_string(text)?;
            let epoch = match operation {
                "parsePlainDate" => PlainDate::parse_in(text, calendar)?.epoch_day(),
                "parsePlainYearMonth" => PlainYearMonth::parse_in(text, calendar)?.epoch_day(),
                "parsePlainMonthDay" => PlainMonthDay::parse_in(text, calendar)?.epoch_day(),
                _ => return Err(Error::InvalidSyntax),
            };
            super::encode_date(
                output,
                epoch,
                calendar.id(),
                crate::ffi::calendar_snapshot(calendar, epoch)?,
            );
        }
        Request::AddDate(epoch, fields, subtract, overflow, calendar) => {
            if !epoch.is_finite()
                || epoch.fract() != 0.0
                || !(-100_000_001.0..=100_000_000.0).contains(&epoch)
            {
                return Err(Error::OutOfRange);
            }
            let calendar = crate::ffi::resolve_calendar(calendar)?;
            let value = PlainDate::from_epoch_day_in(epoch as i64, calendar)?;
            let duration = duration(fields)?;
            let result = if subtract {
                value.checked_subtract(duration, overflow)?
            } else {
                value.checked_add(duration, overflow)?
            };
            let epoch = result.epoch_day();
            super::encode_date(
                output,
                epoch,
                calendar.id(),
                crate::ffi::calendar_snapshot(calendar, epoch)?,
            );
        }
        Request::Add(value, fields, subtract) => {
            let value = Instant::from_epoch_nanoseconds(value)?;
            let duration = duration(fields)?;
            let value = if subtract {
                value.checked_subtract(duration)?
            } else {
                value.checked_add(duration)?
            };
            write_integer(output, value.epoch_nanoseconds());
        }
        Request::Round(value, unit, increment, mode) => {
            let result = Instant::from_epoch_nanoseconds(value)?.round(unit, increment, mode)?;
            write_integer(output, result.epoch_nanoseconds());
        }
        Request::Format(value, precision, mode, offset, identifier) => {
            let value = crate::ffi::format_instant(
                Instant::from_epoch_nanoseconds(value)?,
                precision,
                mode,
                offset,
                identifier,
            )?;
            output.push(4);
            let position = output.len();
            output.extend_from_slice(&[0; 4]);
            write!(Text(output), "{value}").map_err(|_| Error::InvalidDateTime)?;
            let length = (output.len() - position - 4) as u32;
            output[position..position + 4].copy_from_slice(&length.to_le_bytes());
        }
    }
    Ok(())
}
pub(super) fn run<'a>(
    operation: &'a str,
    mut reader: Reader<'a>,
    output: &mut Vec<u8>,
) -> Option<Result<(), i32>> {
    if reader.bytes.get(reader.offset) != Some(&10) {
        return None;
    }
    reader.offset += 1;
    Some(read_request(operation, &mut reader).and_then(|request| {
        crate::ffi::record_call();
        execute(request, output).map_err(|_| 1)
    }))
}

pub(super) fn round_instant_i64(
    value: i64,
    unit: u32,
    increment: u32,
    mode: u32,
) -> Result<i64, i32> {
    let units = [
        TimeUnit::Hour,
        TimeUnit::Minute,
        TimeUnit::Second,
        TimeUnit::Millisecond,
        TimeUnit::Microsecond,
        TimeUnit::Nanosecond,
    ];
    let unit = *units.get(unit as usize).ok_or(2)?;
    let mode = *MODES.get(mode as usize).ok_or(2)?;
    let result = Instant::from_epoch_nanoseconds(i128::from(value))
        .and_then(|value| value.round(unit, increment, mode))
        .map_err(|_| 1)?;
    let result = i64::try_from(result.epoch_nanoseconds()).map_err(|_| 1)?;
    if result == i64::MIN {
        return Err(1);
    }
    crate::ffi::record_call();
    Ok(result)
}

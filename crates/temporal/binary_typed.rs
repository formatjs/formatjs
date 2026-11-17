use super::Reader;
use crate::{
    CalendarName, CalendarProvider, Duration, Error, Instant, Overflow, PlainDate, PlainMonthDay,
    PlainYearMonth, Precision, RoundingMode, TimeUnit,
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
        "parseInstant" => {
            let len = reader.length()?;
            Request::Parse(core::str::from_utf8(reader.take(len)?).map_err(|_| 2)?)
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
    output.push(10);
    output.extend_from_slice(&value.to_le_bytes());
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
fn execute(request: Request<'_>, output: &mut Vec<u8>) -> Result<(), Error> {
    match request {
        Request::FormatDate(operation, epoch, name, calendar) => {
            if !epoch.is_finite()
                || epoch.fract() != 0.0
                || !(-110_000_000.0..=110_000_000.0).contains(&epoch)
            {
                return Err(Error::OutOfRange);
            }
            let calendar = crate::ffi::calendars()?.resolve(calendar)?;
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
            let calendar = crate::ffi::calendars()?.resolve("iso8601")?;
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
            let calendar = crate::ffi::calendars()?.resolve("iso8601")?;
            super::encode_date(
                output,
                epoch,
                "iso8601",
                crate::ffi::calendar_snapshot(calendar, epoch)?,
            );
        }
        Request::ParseDate(operation, text) => {
            let calendar = crate::ffi::calendars()?.for_string(text)?;
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
            let calendar = crate::ffi::calendars()?.resolve(calendar)?;
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

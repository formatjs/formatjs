use super::Reader;
use crate::{
    CalendarProvider, Duration, Error, Instant, Overflow, PlainDate, PlainMonthDay, PlainYearMonth,
    Precision, RoundingMode,
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
    ParseDate(&'a str, &'a str),
    AddDate(f64, [f64; 10], bool, Overflow, &'a str),
    Add(i128, [f64; 10], bool),
    Format(i128, Precision, RoundingMode, Option<i128>, Option<&'a str>),
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
fn execute(request: Request<'_>, output: &mut Vec<u8>) -> Result<(), Error> {
    match request {
        Request::Parse(text) => write_integer(output, text.parse::<Instant>()?.epoch_nanoseconds()),
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

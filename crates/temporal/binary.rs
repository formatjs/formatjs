//! Reusable WASM records. JSON remains available for the native SDK/control interface.
use crate::ffi::{DATE_PROPERTIES, OPERATIONS, complete_result, execute};
use serde_json::{Map, Number, Value};
use std::{
    boxed::Box,
    cell::RefCell,
    panic::{AssertUnwindSafe, catch_unwind},
    string::String,
    vec::Vec,
};

#[path = "binary_typed.rs"]
mod typed;

pub const STRINGS: &[&str] = &[
    "M01",
    "M01L",
    "M02",
    "M02L",
    "M03",
    "M03L",
    "M04",
    "M04L",
    "M05",
    "M05L",
    "M06",
    "M06L",
    "M07",
    "M07L",
    "M08",
    "M08L",
    "M09",
    "M09L",
    "M10",
    "M10L",
    "M11",
    "M11L",
    "M12",
    "M12L",
    "M13",
    "M13L",
    "UTC",
    "aa",
    "absolute",
    "ah",
    "always",
    "am",
    "ap",
    "auto",
    "backend",
    "bce",
    "be",
    "behavior",
    "buddhist",
    "calendar",
    "calendarName",
    "calls",
    "ce",
    "ceil",
    "chinese",
    "compatible",
    "completeTemporalBackend",
    "constrain",
    "coptic",
    "critical",
    "dangi",
    "date",
    "dateOnly",
    "day",
    "dayOfWeek",
    "dayOfYear",
    "days",
    "daysInMonth",
    "daysInWeek",
    "daysInYear",
    "direction",
    "disambiguation",
    "duration",
    "earlier",
    "epochDay",
    "epochNanoseconds",
    "era",
    "eraYear",
    "errors",
    "ethioaa",
    "ethiopic",
    "expand",
    "extended",
    "fields",
    "floor",
    "gregory",
    "halfCeil",
    "halfEven",
    "halfExpand",
    "halfFloor",
    "halfTrunc",
    "hebrew",
    "hour",
    "hours",
    "identifier",
    "ignore",
    "inLeapYear",
    "indian",
    "islamic-civil",
    "islamic-tbla",
    "islamic-umalqura",
    "iso8601",
    "japanese",
    "kind",
    "largest",
    "later",
    "matchMinute",
    "microsecond",
    "microseconds",
    "millisecond",
    "milliseconds",
    "minute",
    "minutes",
    "mode",
    "month",
    "monthCode",
    "months",
    "monthsInYear",
    "nanosecond",
    "nanoseconds",
    "never",
    "offset",
    "operations",
    "other",
    "overflow",
    "persian",
    "precision",
    "prefer",
    "primary",
    "properties",
    "reject",
    "roc",
    "second",
    "seconds",
    "since",
    "smallest",
    "subtract",
    "text",
    "timeZone",
    "timeZoneName",
    "trunc",
    "unit",
    "use",
    "value",
    "values",
    "week",
    "weekOfYear",
    "weeks",
    "year",
    "yearOfWeek",
    "years",
];
fn string_code(value: &str) -> Option<u16> {
    Some(match value {
        "M01" => 0,
        "M01L" => 1,
        "M02" => 2,
        "M02L" => 3,
        "M03" => 4,
        "M03L" => 5,
        "M04" => 6,
        "M04L" => 7,
        "M05" => 8,
        "M05L" => 9,
        "M06" => 10,
        "M06L" => 11,
        "M07" => 12,
        "M07L" => 13,
        "M08" => 14,
        "M08L" => 15,
        "M09" => 16,
        "M09L" => 17,
        "M10" => 18,
        "M10L" => 19,
        "M11" => 20,
        "M11L" => 21,
        "M12" => 22,
        "M12L" => 23,
        "M13" => 24,
        "M13L" => 25,
        "UTC" => 26,
        "aa" => 27,
        "absolute" => 28,
        "ah" => 29,
        "always" => 30,
        "am" => 31,
        "ap" => 32,
        "auto" => 33,
        "backend" => 34,
        "bce" => 35,
        "be" => 36,
        "behavior" => 37,
        "buddhist" => 38,
        "calendar" => 39,
        "calendarName" => 40,
        "calls" => 41,
        "ce" => 42,
        "ceil" => 43,
        "chinese" => 44,
        "compatible" => 45,
        "completeTemporalBackend" => 46,
        "constrain" => 47,
        "coptic" => 48,
        "critical" => 49,
        "dangi" => 50,
        "date" => 51,
        "dateOnly" => 52,
        "day" => 53,
        "dayOfWeek" => 54,
        "dayOfYear" => 55,
        "days" => 56,
        "daysInMonth" => 57,
        "daysInWeek" => 58,
        "daysInYear" => 59,
        "direction" => 60,
        "disambiguation" => 61,
        "duration" => 62,
        "earlier" => 63,
        "epochDay" => 64,
        "epochNanoseconds" => 65,
        "era" => 66,
        "eraYear" => 67,
        "errors" => 68,
        "ethioaa" => 69,
        "ethiopic" => 70,
        "expand" => 71,
        "extended" => 72,
        "fields" => 73,
        "floor" => 74,
        "gregory" => 75,
        "halfCeil" => 76,
        "halfEven" => 77,
        "halfExpand" => 78,
        "halfFloor" => 79,
        "halfTrunc" => 80,
        "hebrew" => 81,
        "hour" => 82,
        "hours" => 83,
        "identifier" => 84,
        "ignore" => 85,
        "inLeapYear" => 86,
        "indian" => 87,
        "islamic-civil" => 88,
        "islamic-tbla" => 89,
        "islamic-umalqura" => 90,
        "iso8601" => 91,
        "japanese" => 92,
        "kind" => 93,
        "largest" => 94,
        "later" => 95,
        "matchMinute" => 96,
        "microsecond" => 97,
        "microseconds" => 98,
        "millisecond" => 99,
        "milliseconds" => 100,
        "minute" => 101,
        "minutes" => 102,
        "mode" => 103,
        "month" => 104,
        "monthCode" => 105,
        "months" => 106,
        "monthsInYear" => 107,
        "nanosecond" => 108,
        "nanoseconds" => 109,
        "never" => 110,
        "offset" => 111,
        "operations" => 112,
        "other" => 113,
        "overflow" => 114,
        "persian" => 115,
        "precision" => 116,
        "prefer" => 117,
        "primary" => 118,
        "properties" => 119,
        "reject" => 120,
        "roc" => 121,
        "second" => 122,
        "seconds" => 123,
        "since" => 124,
        "smallest" => 125,
        "subtract" => 126,
        "text" => 127,
        "timeZone" => 128,
        "timeZoneName" => 129,
        "trunc" => 130,
        "unit" => 131,
        "use" => 132,
        "value" => 133,
        "values" => 134,
        "week" => 135,
        "weekOfYear" => 136,
        "weeks" => 137,
        "year" => 138,
        "yearOfWeek" => 139,
        "years" => 140,
        _ => return None,
    })
}

#[derive(Default)]
struct Buffers {
    input: Vec<u8>,
    output: Vec<u8>,
    info: Box<[usize; 2]>,
}
std::thread_local! {
    static BUFFERS: RefCell<Buffers> = RefCell::new(Buffers::default());
}

pub fn input(capacity: usize) -> *mut u8 {
    BUFFERS.with(|cell| {
        let Ok(mut buffers) = cell.try_borrow_mut() else {
            return core::ptr::null_mut();
        };
        if capacity > buffers.input.len() {
            let extra = capacity - buffers.input.len();
            if buffers.input.try_reserve(extra).is_err() {
                return core::ptr::null_mut();
            }
            buffers.input.resize(capacity, 0);
        }
        buffers.info[0] = buffers.input.as_mut_ptr() as usize;
        buffers.info[1] = buffers.input.len();
        buffers.info.as_mut_ptr().cast()
    })
}
#[derive(Clone, Copy)]
struct Reader<'a> {
    bytes: &'a [u8],
    offset: usize,
}
impl<'a> Reader<'a> {
    fn take(&mut self, count: usize) -> Result<&'a [u8], i32> {
        let end = self.offset.checked_add(count).ok_or(2)?;
        let value = self.bytes.get(self.offset..end).ok_or(2)?;
        self.offset = end;
        Ok(value)
    }
    fn byte(&mut self) -> Result<u8, i32> {
        Ok(self.take(1)?[0])
    }
    fn length(&mut self) -> Result<usize, i32> {
        Ok(u32::from_le_bytes(self.take(4)?.try_into().map_err(|_| 2)?) as usize)
    }
    fn short(&mut self) -> Result<u16, i32> {
        Ok(u16::from_le_bytes(self.take(2)?.try_into().map_err(|_| 2)?))
    }
    fn key(&mut self) -> Result<String, i32> {
        let code = self.short()?;
        if code == u16::MAX {
            return self.text();
        }
        Ok((*STRINGS.get(usize::from(code)).ok_or(2)?).into())
    }
    fn text(&mut self) -> Result<String, i32> {
        let len = self.length()?;
        Ok(core::str::from_utf8(self.take(len)?).map_err(|_| 2)?.into())
    }
    fn value(&mut self, depth: usize) -> Result<Value, i32> {
        if depth > 32 {
            return Err(2);
        }
        Ok(match self.byte()? {
            0 => Value::Null,
            1 => Value::Bool(false),
            2 => Value::Bool(true),
            3 => Value::Number(
                Number::from_f64(f64::from_le_bytes(self.take(8)?.try_into().map_err(|_| 2)?))
                    .ok_or(2)?,
            ),
            4 => Value::String(self.text()?),
            8 => Value::String((*STRINGS.get(usize::from(self.short()?)).ok_or(2)?).into()),
            5 => {
                let count = self.length()?;
                if count > self.bytes.len() - self.offset {
                    return Err(2);
                }
                let mut values = Vec::with_capacity(count);
                for _ in 0..count {
                    values.push(self.value(depth + 1)?)
                }
                Value::Array(values)
            }
            6 => {
                let count = self.length()?;
                if count > (self.bytes.len() - self.offset) / 3 {
                    return Err(2);
                }
                let mut values = Map::new();
                for _ in 0..count {
                    let key = self.key()?;
                    if values.contains_key(&key) {
                        return Err(2);
                    }
                    values.insert(key, self.value(depth + 1)?);
                }
                Value::Object(values)
            }
            _ => return Err(2),
        })
    }
}
fn text(output: &mut Vec<u8>, value: &str) {
    output.extend_from_slice(&(value.len() as u32).to_le_bytes());
    output.extend_from_slice(value.as_bytes());
}
fn encode(output: &mut Vec<u8>, value: &Value) {
    match value {
        Value::Null => output.push(0),
        Value::Bool(false) => output.push(1),
        Value::Bool(true) => output.push(2),
        Value::Number(value) => {
            output.push(3);
            output.extend_from_slice(&value.as_f64().unwrap().to_le_bytes());
        }
        Value::String(value) => {
            if let Some(code) = string_code(value) {
                output.push(8);
                output.extend_from_slice(&code.to_le_bytes());
            } else {
                output.push(4);
                text(output, value);
            }
        }
        Value::Array(values) => {
            output.push(5);
            output.extend_from_slice(&(values.len() as u32).to_le_bytes());
            for value in values {
                encode(output, value)
            }
        }
        Value::Object(values) => {
            if values.len() == 3
                && values.contains_key("date")
                && values.contains_key("values")
                && values.contains_key("errors")
            {
                output.push(9);
                for key in ["year", "month", "day", "monthCode"] {
                    encode(output, &values["date"][key]);
                }
                let errors = values["errors"].as_array().unwrap();
                let mut mask = 0u32;
                for (index, key) in DATE_PROPERTIES.iter().enumerate() {
                    if errors.iter().any(|value| value.as_str() == Some(key)) {
                        mask |= 1 << index;
                    }
                }
                output.extend_from_slice(&mask.to_le_bytes());
                for key in DATE_PROPERTIES {
                    encode(output, &values["values"][key]);
                }
                return;
            }
            output.push(6);
            output.extend_from_slice(&(values.len() as u32).to_le_bytes());
            for (key, value) in values {
                if let Some(code) = string_code(key) {
                    output.extend_from_slice(&code.to_le_bytes());
                } else {
                    output.extend_from_slice(&u16::MAX.to_le_bytes());
                    text(output, key);
                }
                encode(output, value);
            }
        }
    }
}
fn encode_date(
    output: &mut Vec<u8>,
    epoch: i64,
    calendar: &str,
    snapshot: crate::ffi::CalendarSnapshot,
) {
    if calendar == "iso8601" && snapshot.errors == 0 {
        if let Some(date) = snapshot.date {
            // ISO date: epoch/year, month/day/weekday/month length, year/day lengths, week/year.
            output.push(11);
            output.extend_from_slice(&(epoch as i32).to_le_bytes());
            output.extend_from_slice(&date.year.to_le_bytes());
            output.extend_from_slice(&[date.month, date.day]);
            for index in [0, 3] {
                output.push(snapshot.values[index].as_u64().unwrap() as u8);
            }
            for index in [5, 2] {
                output.extend_from_slice(
                    &(snapshot.values[index].as_u64().unwrap() as u16).to_le_bytes(),
                );
            }
            output.push(snapshot.values[7].as_u64().unwrap() as u8);
            output.extend_from_slice(&(snapshot.values[8].as_i64().unwrap() as i32).to_le_bytes());
            return;
        }
    }
    output.push(6);
    output.extend_from_slice(&3u32.to_le_bytes());
    output.extend_from_slice(&string_code("epochDay").unwrap().to_le_bytes());
    encode(output, &Value::from(epoch));
    output.extend_from_slice(&string_code("calendar").unwrap().to_le_bytes());
    encode(output, &Value::from(calendar));
    output.extend_from_slice(&string_code("properties").unwrap().to_le_bytes());
    encode_snapshot(output, snapshot);
}
fn encode_date_time(
    output: &mut Vec<u8>,
    ns: i128,
    calendar: &str,
    snapshot: crate::ffi::CalendarSnapshot,
) {
    if calendar == "iso8601" && snapshot.errors == 0 && snapshot.date.is_some() {
        let fields = crate::iso::iso_from_epoch_nanoseconds_raw(ns);
        output.push(12);
        output.extend_from_slice(&ns.to_le_bytes());
        encode_date(
            output,
            ns.div_euclid(crate::NANOSECONDS_PER_DAY) as i64,
            calendar,
            snapshot,
        );
        output.extend_from_slice(&[fields.hour, fields.minute, fields.second]);
        for value in [
            fields.nanosecond / 1_000_000,
            fields.nanosecond / 1000 % 1000,
            fields.nanosecond % 1000,
        ] {
            output.extend_from_slice(&(value as u16).to_le_bytes());
        }
        return;
    }
    output.push(6);
    output.extend_from_slice(&3u32.to_le_bytes());
    output.extend_from_slice(&string_code("epochNanoseconds").unwrap().to_le_bytes());
    encode(output, &Value::from(std::string::ToString::to_string(&ns)));
    output.extend_from_slice(&string_code("calendar").unwrap().to_le_bytes());
    encode(output, &Value::from(calendar));
    output.extend_from_slice(&string_code("properties").unwrap().to_le_bytes());
    encode_snapshot(output, snapshot);
}
fn encode_zoned(
    output: &mut Vec<u8>,
    ns: i128,
    calendar: &str,
    snapshot: crate::ffi::CalendarSnapshot,
) {
    if calendar == "iso8601" && snapshot.errors == 0 && snapshot.date.is_some() {
        output.push(17);
        output.extend_from_slice(&ns.to_le_bytes());
        let offset = snapshot.values[18].as_i64().unwrap();
        output.extend_from_slice(&(offset as f64).to_le_bytes());
        output.extend_from_slice(&snapshot.values[20].as_f64().unwrap().to_le_bytes());
        let text = snapshot.values[19].as_str().unwrap();
        output.extend_from_slice(&(text.len() as u32).to_le_bytes());
        output.extend_from_slice(text.as_bytes());
        encode_date_time(output, ns + i128::from(offset), calendar, snapshot);
    } else {
        output.push(16);
        output.extend_from_slice(&ns.to_le_bytes());
        encode_snapshot(output, snapshot);
    }
}
fn encode_snapshot(output: &mut Vec<u8>, snapshot: crate::ffi::CalendarSnapshot) {
    output.push(9);
    if let Some(date) = snapshot.date {
        for value in [
            Value::from(date.year),
            Value::from(date.month),
            Value::from(date.day),
        ] {
            encode(output, &value);
        }
        let code = date.month_code;
        // Month codes occupy the first 26 interned strings, in month/leap order.
        output.push(8);
        output.extend_from_slice(
            &(u16::from(code.number - 1) * 2 + u16::from(code.leap)).to_le_bytes(),
        );
    } else {
        output.extend_from_slice(&[0; 4]);
    }
    output.extend_from_slice(&snapshot.errors.to_le_bytes());
    for value in &snapshot.values {
        encode(output, value);
    }
}

fn run(bytes: &[u8], output: &mut Vec<u8>) -> Result<(), i32> {
    let mut reader = Reader { bytes, offset: 0 };
    let operation = OPERATIONS.get(usize::from(reader.byte()?)).ok_or(2)?;
    if let Some(result) = typed::run(operation, reader, output) {
        return result;
    }
    let Value::Object(mut request) = reader.value(0)? else {
        return Err(2);
    };
    if reader.offset != bytes.len() || request.contains_key("op") {
        return Err(2);
    }
    request.insert("op".into(), Value::String((*operation).into()));
    let request = Value::Object(request);
    if *operation == "calendarProperties" {
        crate::ffi::record_call();
        let calendar =
            crate::ffi::resolve_calendar(request["calendar"].as_str().ok_or(1)?).map_err(|_| 1)?;
        let result = crate::ffi::calendar_properties(calendar, &request).map_err(|_| 1)?;
        encode_snapshot(output, result);
        return Ok(());
    }
    let result = execute(&request)?;
    let (result, snapshot) = complete_result(operation, &request, result).map_err(|_| 1)?;
    if let Some(snapshot) = snapshot {
        let values = result.as_object().ok_or(2)?;
        output.push(6);
        output.extend_from_slice(&((values.len() + 1) as u32).to_le_bytes());
        for (key, value) in values {
            output.extend_from_slice(&string_code(key).ok_or(2)?.to_le_bytes());
            encode(output, value);
        }
        output.extend_from_slice(&string_code("properties").unwrap().to_le_bytes());
        encode_snapshot(output, snapshot);
    } else {
        encode(output, &result);
    }
    Ok(())
}
/// Returned header is [status: u32, payload length: u32], followed by one record.
/// Storage belongs to the module and remains valid until its next exchange.
pub fn exchange(length: usize) -> *const u8 {
    BUFFERS.with(|cell| {
        let Ok(mut buffers) = cell.try_borrow_mut() else {
            return core::ptr::null();
        };
        let Buffers { input, output, .. } = &mut *buffers;
        output.clear();
        output.extend_from_slice(&[0; 8]);
        let result = catch_unwind(AssertUnwindSafe(|| {
            run(input.get(..length).ok_or(2)?, output)
        }))
        .unwrap_or(Err(3));
        if let Err(status) = result {
            output.truncate(8);
            output[..4].copy_from_slice(&u32::try_from(status).unwrap_or(3).to_le_bytes());
        }
        let len = (buffers.output.len() - 8) as u32;
        buffers.output[4..8].copy_from_slice(&len.to_le_bytes());
        buffers.output.as_ptr()
    })
}

/// Returns i64::MIN when the caller must use the full-width checked exchange.
pub fn round_instant_i64(value: i64, unit: u32, increment: u32, mode: u32) -> i64 {
    catch_unwind(|| typed::round_instant_i64(value, unit, increment, mode))
        .ok()
        .and_then(Result::ok)
        .unwrap_or(i64::MIN)
}

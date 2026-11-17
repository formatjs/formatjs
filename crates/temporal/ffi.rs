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
    duration_value(&request["duration"])
}
fn duration_value(value: &Value) -> Result<Duration, Error> {
    let mut fields = [0; 10];
    for (index, key) in DURATION_FIELDS.iter().enumerate() {
        fields[index] = decimal(value, key)?;
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
fn calendars() -> Result<CalendarRegistry<'static>, Error> {
    CALENDARS
        .get_or_init(compiled_calendars)
        .as_ref()
        .copied()
        .map_err(|error| *error)
}
fn time_zones() -> TimeZoneRegistry<'static> {
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
fn calendar_field(value: Option<&Value>, overflow: Overflow) -> Result<i32, Error> {
    let value = integer(value, None)?;
    if overflow == Overflow::Constrain {
        Ok(value.clamp(i64::from(i32::MIN), i64::from(i32::MAX)) as i32)
    } else {
        value.try_into().map_err(|_| Error::OutOfRange)
    }
}
fn calendar_operation(op: &str, request: &Value) -> Result<Value, Error> {
    let registry = calendars()?;
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
            calendars()?.resolve(request["calendar"].as_str().ok_or(Error::InvalidCalendar)?)?;
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
    let calendar =
        calendars()?.resolve(record["calendar"].as_str().ok_or(Error::InvalidCalendar)?)?;
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
                calendars()?.resolve(other["calendar"].as_str().ok_or(Error::InvalidCalendar)?)?;
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
fn string_operation(op: &str, request: &Value) -> Result<Value, Error> {
    if op == "resolveZonedDateTime" {
        let local = decimal(request, "nanoseconds")?;
        let fields = IsoDateTime::from_epoch_nanoseconds(local)?;
        let calendar =
            calendars()?.resolve(request["calendar"].as_str().ok_or(Error::InvalidCalendar)?)?;
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
        parsed.fields.to_epoch_nanoseconds()?;
        let mut fields = record(parsed.fields);
        fields["calendar"] = json!(crate::parse::calendar_annotation(text).unwrap_or("iso8601"));
        let offset = match parsed.offset {
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
                Some(if matches!(parsed.offset, crate::OffsetInput::Minute(_)) {
                    base
                } else {
                    std::format!(
                        "{base}:{:02}.{:09}",
                        absolute / 1_000_000_000 % 60,
                        absolute % 1_000_000_000
                    )
                })
            }
        };
        return Ok(json!({"fields":fields,"timeZone":parsed.zone,"offset":offset}));
    }
    let calendar = calendars()?.for_string(text)?;
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
        calendars()?.resolve(value["calendar"].as_str().ok_or(Error::InvalidCalendar)?)?,
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
                calendars()?.resolve(value["calendar"].as_str().ok_or(Error::InvalidCalendar)?)?,
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
            let value = request["fields"][key]
                .as_f64()
                .ok_or(Error::InvalidDateTime)?;
            if !value.is_finite() || value.fract() != 0. {
                return Err(Error::InvalidDateTime);
            }
            values[index] = value as i128;
        }
        return Ok(json!(
            PlainTime::from_fields(
                TimeFields {
                    hour: Some(values[0]),
                    minute: Some(values[1]),
                    second: Some(values[2]),
                    millisecond: Some(values[3]),
                    microsecond: Some(values[4]),
                    nanosecond: Some(values[5])
                },
                if constrain {
                    crate::Overflow::Constrain
                } else {
                    crate::Overflow::Reject
                },
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
fn plain_operation(op: &str, request: &Value) -> Result<Value, Error> {
    let calendar =
        calendars()?.resolve(request["calendar"].as_str().ok_or(Error::InvalidCalendar)?)?;
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
            json!({"backend":"rust-iso-instant-time-calendars-zones-duration-plain-zoned-strings-format","calls":CALLS.load(Ordering::Relaxed),"operations":["addPlainYearMonth","differencePlainYearMonth","yearMonthToDate","monthDayToDate","formatPlainDate","formatPlainDateTime","formatPlainYearMonth","formatPlainMonthDay","formatZonedDateTime","parsePlainDate","parsePlainDateTime","parsePlainYearMonth","parsePlainMonthDay","parseZonedFields","resolveZonedDateTime","addZonedDateTime","differenceZonedDateTime","roundZonedDateTime","startOfZonedDay","hoursInZonedDay","addPlainDate","addPlainDateTime","differencePlainDate","differencePlainDateTime","roundPlainDateTime","transformDuration","parseDuration","validateDuration","formatDuration","addDuration","compareDuration","totalDuration","roundDuration","timeZoneIdentity","timeZoneOffset","timeZonePossibleInstants","timeZoneResolve","timeZoneTransition","calendarStartOfYear","calendarMonthsInYear","calendarDaysInMonth","calendarToEpochDay","calendarFromEpochDay","calendarAdd","calendarUntil","calendarMonthSerial","calendarEra","calendarYearFromEra","isoToEpochNanoseconds","epochNanosecondsToISO","addISODays","parsePlainTime","regulatePlainTime","formatPlainTime","addPlainTime","roundPlainTime","differencePlainTime","parseInstant","formatInstant","addInstant","roundInstant","differenceInstant"],"completeTemporalBackend":false}),
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

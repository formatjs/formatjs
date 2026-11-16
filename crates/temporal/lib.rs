#![no_std]
#[cfg(feature = "ffi")]
extern crate std;
#[cfg(feature = "ffi")]
pub mod ffi;

mod calendar_difference;
mod calendar_provider;
mod calendar_registry;
mod context;
mod date;
mod duration;
mod format;
mod iso;
mod now;
mod parse;
mod plain_relative;
mod relative_duration;
mod rounding;
mod short_dates;
mod time;
mod timezone;
mod timezone_identity;
mod timezone_registry;
mod zoned;
mod zoned_difference;
mod zoned_string;

pub use calendar_difference::DateTimeUnit;
pub use calendar_difference::DateTimeUnit as ZonedUnit;
pub use calendar_provider::{CalendarProvider, CalendarRef, DateFields, table_calendar};
pub use calendar_registry::CalendarRegistry;
pub use context::TemporalContext;
use core::fmt;
use core::str::FromStr;
pub use date::{
    DateTimeFields, FormattedDate, FormattedDateTime, Overflow, PlainDate, PlainDateTime,
};
pub use duration::{
    Duration, DurationFields, FormattedDuration, MAX_DURATION_NANOSECONDS,
    round_duration_nanoseconds,
};
pub use format::{FormattedInstant, Precision};
pub use formatjs_intl_datetimeformat_calendars::calendar;
pub use iso::IsoDateTime;
pub use now::{Now, SystemClock};
pub use rounding::{RoundingMode, TimeUnit};
pub use short_dates::{
    FormattedMonthDay, FormattedYearMonth, PlainMonthDay, PlainYearMonth, YearMonthUnit,
};
pub use time::{FormattedTime, PlainTime, TimeFields};
pub use timezone::{FutureRule, OffsetTransition, TransitionRule, TransitionZone};
pub use timezone_identity::{NamedTimeZone, NamedTimeZoneIdentifier, named_time_zone_identifier};
pub use timezone_registry::{ResolvedTimeZone, TimeZoneRecord, TimeZoneRegistry};
pub use zoned::{Disambiguation, FixedOffset, TimeZone, TransitionDirection, ZonedDateTime};
pub use zoned_string::{
    CalendarName, FormattedZonedDateTime, OffsetInput, OffsetOption, TimeZoneName,
    ZonedFormatOptions, ZonedParseOptions,
};

pub const NANOSECONDS_PER_DAY: i128 = 86_400_000_000_000;
pub const MAX_EPOCH_NANOSECONDS: i128 = 100_000_000 * NANOSECONDS_PER_DAY;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Error {
    InvalidCalendar,
    InvalidCalendarData,
    MissingCalendarData,
    InvalidTimeZone,
    InvalidTimeZoneData,
    MissingTimeZoneData,
    InvalidSyntax,
    InvalidDateTime,
    InvalidDuration,
    InvalidRoundingOptions,
    OutOfRange,
}
impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self {
            Self::InvalidCalendar => "Invalid calendar",
            Self::InvalidCalendarData => "Invalid calendar data",
            Self::MissingCalendarData => "Calendar data not loaded",
            Self::InvalidTimeZone => "Invalid time zone",
            Self::InvalidTimeZoneData => "Invalid time zone data",
            Self::MissingTimeZoneData => "Time zone data not loaded",
            Self::InvalidSyntax => "Invalid instant string",
            Self::InvalidDateTime => "Invalid ISO date/time",
            Self::InvalidRoundingOptions => "Invalid rounding options",
            Self::InvalidDuration => "Invalid duration",
            Self::OutOfRange => "Instant out of range",
        })
    }
}
impl core::error::Error for Error {}

/// Exact nanoseconds since the Unix epoch, bounded to Temporal's instant range.
#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct Instant(i128);
impl Instant {
    pub fn from_epoch_nanoseconds(value: i128) -> Result<Self, Error> {
        if !(-MAX_EPOCH_NANOSECONDS..=MAX_EPOCH_NANOSECONDS).contains(&value) {
            return Err(Error::OutOfRange);
        }
        Ok(Self(value))
    }
    pub fn from_epoch_milliseconds(value: i64) -> Result<Self, Error> {
        Self::from_epoch_nanoseconds(i128::from(value) * 1_000_000)
    }
    pub const fn epoch_nanoseconds(self) -> i128 {
        self.0
    }
    pub const fn epoch_milliseconds(self) -> i64 {
        self.0.div_euclid(1_000_000) as i64
    }
    pub fn from_iso_offset(fields: IsoDateTime, offset_nanoseconds: i128) -> Result<Self, Error> {
        if !(-NANOSECONDS_PER_DAY + 1..NANOSECONDS_PER_DAY).contains(&offset_nanoseconds) {
            return Err(Error::InvalidDateTime);
        }
        Self::from_epoch_nanoseconds(fields.to_epoch_nanoseconds()? - offset_nanoseconds)
    }
    pub fn to_iso(self) -> IsoDateTime {
        // Every Instant lies inside the local ISO date/time range.
        IsoDateTime::from_epoch_nanoseconds(self.0).unwrap()
    }
}
impl FromStr for Instant {
    type Err = Error;
    fn from_str(value: &str) -> Result<Self, Error> {
        parse::instant(value)
    }
}

//! DateTimeFormat core. Gregorian arithmetic does not depend on host Date/ICU.
pub mod calendar;
pub mod civil;
pub mod data;
pub mod ffi;
mod ffi_input;
pub mod fields;
pub mod instance;
pub use instance::{DateTimeFormat, DateTimeValue, ResolvedOptions, Runtime};
pub mod locale_patterns;
pub mod matching;
pub mod numbers;
pub mod pattern;
pub mod registry;
pub mod render;
pub mod selection;
pub mod timezone;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Error {
    InvalidDate,
    InvalidPattern,
    MissingFormats,
    MissingCalendar,
    InvalidLocaleData,
    InvalidLocale,
    InvalidOption(&'static str),
    MissingLocale,
    MissingNumberData,
    StyleComponents,
    TemporalMismatch,
    TemporalTypeMismatch,
    TemporalCalendarMismatch,
    UnsupportedTemporal,
    CalendarCallback,
    InvalidTimeZone,
    InvalidTimeZoneData,
}
impl std::fmt::Display for Error {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidLocale => formatter.write_str("Invalid DateTimeFormat locale"),
            Self::InvalidOption(name) => write!(formatter, "Invalid DateTimeFormat option: {name}"),
            Self::MissingNumberData => formatter.write_str("DateTimeFormat number data not loaded"),
            Self::MissingLocale => formatter.write_str("DateTimeFormat locale data not loaded"),
            Self::StyleComponents => {
                formatter.write_str("DateTimeFormat styles cannot be combined with components")
            }
            Self::TemporalMismatch => {
                formatter.write_str("DateTimeFormat options do not overlap the Temporal type")
            }
            Self::TemporalTypeMismatch => {
                formatter.write_str("Range endpoints must have the same Temporal type")
            }
            Self::TemporalCalendarMismatch => {
                formatter.write_str("Temporal calendar does not match DateTimeFormat")
            }
            Self::UnsupportedTemporal => {
                formatter.write_str("Temporal.ZonedDateTime is not supported by DateTimeFormat")
            }
            Self::CalendarCallback => formatter.write_str("Calendar provider callback failed"),
            Self::InvalidPattern => formatter.write_str("Invalid DateTimeFormat pattern"),
            Self::InvalidLocaleData => formatter.write_str("Invalid DateTimeFormat locale data"),
            Self::MissingCalendar => formatter.write_str("DateTimeFormat calendar data not loaded"),
            Self::MissingFormats => formatter.write_str("Missing DateTimeFormat patterns"),
            Self::InvalidDate => formatter.write_str("Invalid DateTimeFormat date"),
            Self::InvalidTimeZone => formatter.write_str("Invalid DateTimeFormat time zone"),
            Self::InvalidTimeZoneData => {
                formatter.write_str("Invalid DateTimeFormat time zone data")
            }
        }
    }
}
impl std::error::Error for Error {}

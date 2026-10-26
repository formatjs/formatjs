//! DateTimeFormat core. Gregorian arithmetic does not depend on host Date/ICU.
pub mod civil;
pub mod timezone;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Error {
    InvalidDate,
    InvalidTimeZone,
    InvalidTimeZoneData,
}
impl std::fmt::Display for Error {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidDate => formatter.write_str("Invalid DateTimeFormat date"),
            Self::InvalidTimeZone => formatter.write_str("Invalid DateTimeFormat time zone"),
            Self::InvalidTimeZoneData => {
                formatter.write_str("Invalid DateTimeFormat time zone data")
            }
        }
    }
}
impl std::error::Error for Error {}

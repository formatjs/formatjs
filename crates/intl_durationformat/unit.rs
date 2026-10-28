#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[repr(usize)]
pub enum Unit {
    Years,
    Months,
    Weeks,
    Days,
    Hours,
    Minutes,
    Seconds,
    Milliseconds,
    Microseconds,
    Nanoseconds,
}
impl Unit {
    pub const ALL: [Self; 10] = [
        Self::Years,
        Self::Months,
        Self::Weeks,
        Self::Days,
        Self::Hours,
        Self::Minutes,
        Self::Seconds,
        Self::Milliseconds,
        Self::Microseconds,
        Self::Nanoseconds,
    ];
    pub fn key(self) -> &'static str {
        [
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
        ][self as usize]
    }
    pub fn singular(self) -> &'static str {
        [
            "year",
            "month",
            "week",
            "day",
            "hour",
            "minute",
            "second",
            "millisecond",
            "microsecond",
            "nanosecond",
        ][self as usize]
    }
    pub fn display_key(self) -> &'static str {
        [
            "yearsDisplay",
            "monthsDisplay",
            "weeksDisplay",
            "daysDisplay",
            "hoursDisplay",
            "minutesDisplay",
            "secondsDisplay",
            "millisecondsDisplay",
            "microsecondsDisplay",
            "nanosecondsDisplay",
        ][self as usize]
    }
    pub fn is_clock(self) -> bool {
        matches!(self, Self::Hours | Self::Minutes | Self::Seconds)
    }
    pub fn is_subsecond(self) -> bool {
        matches!(
            self,
            Self::Milliseconds | Self::Microseconds | Self::Nanoseconds
        )
    }
}

use crate::{
    CalendarRef, CalendarRegistry, Error, PlainDate, PlainDateTime, PlainMonthDay, PlainYearMonth,
    ResolvedTimeZone, TimeZoneRegistry, ZonedDateTime, ZonedParseOptions,
};

/// Shared data views for native Temporal entry points. Values retain their providers.
#[derive(Clone, Copy, Debug, Default)]
pub struct TemporalContext<'a> {
    calendars: CalendarRegistry<'a>,
    time_zones: TimeZoneRegistry<'a>,
}
impl<'a> TemporalContext<'a> {
    pub const fn new(calendars: CalendarRegistry<'a>, time_zones: TimeZoneRegistry<'a>) -> Self {
        Self {
            calendars,
            time_zones,
        }
    }
    pub const fn calendars(&self) -> CalendarRegistry<'a> {
        self.calendars
    }
    pub const fn time_zones(&self) -> TimeZoneRegistry<'a> {
        self.time_zones
    }
    pub fn parse_date(&self, value: &str) -> Result<PlainDate<CalendarRef<'a>>, Error> {
        PlainDate::parse_in(value, self.calendars.for_string(value)?)
    }
    pub fn parse_date_time(&self, value: &str) -> Result<PlainDateTime<CalendarRef<'a>>, Error> {
        PlainDateTime::parse_in(value, self.calendars.for_string(value)?)
    }
    pub fn parse_year_month(&self, value: &str) -> Result<PlainYearMonth<CalendarRef<'a>>, Error> {
        PlainYearMonth::parse_in(value, self.calendars.for_string(value)?)
    }
    pub fn parse_month_day(&self, value: &str) -> Result<PlainMonthDay<CalendarRef<'a>>, Error> {
        PlainMonthDay::parse_in(value, self.calendars.for_string(value)?)
    }
    pub fn parse_zoned(
        &self,
        value: &str,
        options: ZonedParseOptions,
    ) -> Result<ZonedDateTime<ResolvedTimeZone<'a>, CalendarRef<'a>>, Error> {
        ZonedDateTime::parse_in(
            value,
            self.time_zones,
            self.calendars.for_string(value)?,
            options,
        )
    }
}
impl TemporalContext<'static> {
    #[cfg(all(feature = "compiled_calendars", feature = "compiled_time_zones"))]
    pub fn compiled() -> Result<Self, Error> {
        Ok(Self::new(
            CalendarRegistry::compiled()?,
            TimeZoneRegistry::compiled(),
        ))
    }
}

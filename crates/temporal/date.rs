use crate::calendar::Calendar;
use crate::calendar_provider::{
    DateFieldShape, error, merge_fields, overflow as calendar_overflow, resolve_fields,
};
use crate::{
    CalendarName, CalendarProvider, DateFields, Duration, Error, IsoDateTime, NANOSECONDS_PER_DAY,
    PlainTime, Precision, RoundingMode, TimeFields, TimeUnit,
};
use core::{fmt, str::FromStr};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Overflow {
    Constrain,
    Reject,
}

#[derive(Clone, Copy, Debug, Default)]
pub struct DateTimeFields<'a> {
    pub date: DateFields<'a>,
    pub time: TimeFields,
}
#[derive(Clone, Copy, Debug)]
pub struct PlainDate<C = Calendar>(i64, C);
impl PlainDate {
    pub fn new(year: i32, month: u8, day: u8) -> Result<Self, Error> {
        let value = IsoDateTime {
            year,
            month,
            day,
            hour: 12,
            minute: 0,
            second: 0,
            nanosecond: 0,
        }
        .to_epoch_nanoseconds()?;
        Self::from_epoch_day(value.div_euclid(NANOSECONDS_PER_DAY) as i64)
    }
    pub fn from_epoch_day(value: i64) -> Result<Self, Error> {
        if !(-100_000_001..=100_000_000).contains(&value) {
            return Err(Error::OutOfRange);
        }
        Ok(Self(value, Calendar::Iso8601))
    }
}
impl<C: CalendarProvider> PlainDate<C> {
    pub fn with_fields(self, fields: DateFields<'_>, overflow: Overflow) -> Result<Self, Error> {
        Self::from_calendar_fields(
            self.1,
            merge_fields(self.1, self.0, fields, DateFieldShape::Date)?,
            overflow,
        )
    }
    pub fn from_epoch_day_in(value: i64, calendar: C) -> Result<Self, Error> {
        PlainDate::from_epoch_day(value)?;
        calendar.date(value).map_err(error)?;
        Ok(Self(value, calendar))
    }
    pub fn from_calendar_fields(
        calendar: C,
        fields: DateFields<'_>,
        overflow: Overflow,
    ) -> Result<Self, Error> {
        Self::from_epoch_day_in(resolve_fields(calendar, fields, overflow)?, calendar)
    }
    pub fn parse_in(value: &str, calendar: C) -> Result<Self, Error> {
        let fields = crate::parse::plain_date_time_fields(value)?;
        crate::parse::check_calendar(value, calendar.id())?;
        PlainDate::new(fields.year, fields.month, fields.day)?.with_calendar(calendar)
    }
    pub const fn calendar(self) -> C {
        self.1
    }
    pub fn format(self, calendar_name: CalendarName) -> FormattedDate<C> {
        FormattedDate {
            value: self,
            calendar_name,
        }
    }
    pub fn calendar_id(self) -> &'static str {
        self.1.id()
    }
    pub fn equals<D: CalendarProvider>(self, other: PlainDate<D>) -> bool {
        self.0 == other.0 && self.calendar_id() == other.calendar_id()
    }
    // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L909-L915
    // L909: a greater year has a greater epoch day, regardless of month/day.
    // L910: a lesser year has a lesser epoch day, regardless of month/day.
    // L911: within one year, a greater month has a greater epoch day.
    // L912: within one year, a lesser month has a lesser epoch day.
    // L913: within one month, a greater day has a greater epoch day.
    // L914: within one month, a lesser day has a lesser epoch day.
    // L915: equal epoch days identify the same ISO date.
    pub fn compare<D: CalendarProvider>(self, other: PlainDate<D>) -> core::cmp::Ordering {
        self.0.cmp(&other.0)
    }
    pub fn with_calendar<D: CalendarProvider>(self, calendar: D) -> Result<PlainDate<D>, Error> {
        PlainDate::from_epoch_day_in(self.0, calendar)
    }
    pub fn calendar_fields(self) -> Result<crate::calendar::Date, Error> {
        self.1.date(self.0).map_err(error)
    }
    pub fn era(self) -> Result<Option<crate::calendar::Era>, Error> {
        self.1.era(self.0).map_err(error)
    }
    pub fn day_of_week(self) -> u8 {
        ((self.0 + 3).rem_euclid(7) + 1) as u8
    }
    pub const fn days_in_week(self) -> u8 {
        7
    }
    pub fn day_of_year(self) -> Result<u16, Error> {
        Ok((self.0
            - self
                .1
                .start_of_year(self.calendar_fields()?.year)
                .map_err(error)?
            + 1) as u16)
    }
    pub fn days_in_month(self) -> Result<u8, Error> {
        let fields = self.calendar_fields()?;
        self.1
            .days_in_month(fields.year, fields.month)
            .map_err(error)
    }
    pub fn months_in_year(self) -> Result<u8, Error> {
        self.1
            .months_in_year(self.calendar_fields()?.year)
            .map_err(error)
    }
    pub fn days_in_year(self) -> Result<u16, Error> {
        let year = self.calendar_fields()?.year;
        Ok((self.1.start_of_year(year + 1).map_err(error)?
            - self.1.start_of_year(year).map_err(error)?) as u16)
    }
    pub fn in_leap_year(self) -> Result<bool, Error> {
        Ok(match self.calendar_id() {
            "hebrew" | "chinese" | "dangi" => self.months_in_year()? == 13,
            "islamic-civil" | "islamic-tbla" | "islamic-umalqura" => self.days_in_year()? == 355,
            _ => self.days_in_year()? == 366,
        })
    }
    pub fn week_of_year(self) -> Option<(i32, u8)> {
        if self.calendar_id() != "iso8601" {
            return None;
        }
        let thursday = self.0 + 4 - i64::from(self.day_of_week());
        let year =
            crate::iso::iso_from_epoch_nanoseconds_raw(i128::from(thursday) * NANOSECONDS_PER_DAY)
                .year;
        Some((
            year,
            ((thursday - crate::iso::epoch_day_from_iso(year, 1, 1)) / 7 + 1) as u8,
        ))
    }
    pub const fn epoch_day(self) -> i64 {
        self.0
    }
    pub fn fields(self) -> (i32, u8, u8) {
        let fields = IsoDateTime::from_epoch_nanoseconds(
            i128::from(self.0) * NANOSECONDS_PER_DAY + NANOSECONDS_PER_DAY / 2,
        )
        .unwrap();
        (fields.year, fields.month, fields.day)
    }
    pub fn checked_add(self, duration: Duration, overflow: Overflow) -> Result<Self, Error> {
        let fields = duration.fields();
        let extra_days = duration.time_nanoseconds(false)? / NANOSECONDS_PER_DAY;
        self.add_date(
            fields[0],
            fields[1],
            fields[2] * 7 + fields[3] + extra_days,
            overflow,
        )
    }
    pub fn checked_subtract(self, duration: Duration, overflow: Overflow) -> Result<Self, Error> {
        self.checked_add(duration.negated(), overflow)
    }
    fn add_date(
        self,
        years: i128,
        months: i128,
        days: i128,
        overflow: Overflow,
    ) -> Result<Self, Error> {
        use crate::calendar::DateDuration;
        let duration = DateDuration {
            years: years.try_into().map_err(|_| Error::OutOfRange)?,
            months: months.try_into().map_err(|_| Error::OutOfRange)?,
            days: days.try_into().map_err(|_| Error::OutOfRange)?,
            ..DateDuration::default()
        };
        let day = self
            .1
            .add(self.0, duration, calendar_overflow(overflow))
            .map_err(error)?;
        Self::from_epoch_day_in(day, self.1)
    }

    pub fn to_date_time(self, time: PlainTime) -> Result<PlainDateTime<C>, Error> {
        PlainDateTime::from_epoch_nanoseconds_in(
            i128::from(self.0) * NANOSECONDS_PER_DAY + time.nanoseconds(),
            self.1,
        )
    }
    pub fn to_zoned_date_time<Z: crate::TimeZone>(
        self,
        time_zone: Z,
        time: Option<PlainTime>,
    ) -> Result<crate::ZonedDateTime<Z, C>, Error> {
        let instant = match time {
            Some(time) => crate::zoned::resolve_local(
                self.to_date_time(time)?.fields(),
                &time_zone,
                crate::Disambiguation::Compatible,
            )?,
            None => crate::zoned::day_boundary(self.0, &time_zone)?,
        };
        Ok(crate::ZonedDateTime::new_in_calendar(
            instant, time_zone, self.1,
        ))
    }
}
pub fn month_length(year: i32, month: u8) -> u8 {
    match month {
        2 => 28 + u8::from(year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)),
        4 | 6 | 9 | 11 => 30,
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        _ => 0,
    }
}
impl FromStr for PlainDate {
    type Err = Error;
    fn from_str(value: &str) -> Result<Self, Error> {
        let fields = crate::parse::plain_date_time_fields(value)?;
        Self::new(fields.year, fields.month, fields.day)?
            .with_calendar(crate::parse::arithmetic_calendar(value)?)
    }
}
impl<C: CalendarProvider> fmt::Display for PlainDate<C> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        self.format(CalendarName::Auto).fmt(f)
    }
}
pub struct FormattedDate<C = Calendar> {
    value: PlainDate<C>,
    calendar_name: CalendarName,
}
impl<C: CalendarProvider> fmt::Display for FormattedDate<C> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write_date(f, self.value.fields())?;
        write_calendar(f, self.value.calendar_id(), self.calendar_name)
    }
}
pub(crate) fn write_date(f: &mut fmt::Formatter<'_>, fields: (i32, u8, u8)) -> fmt::Result {
    let output = crate::format::IsoString::date(fields);
    f.write_str(output.as_str()?)
}
pub(crate) fn write_calendar(
    f: &mut fmt::Formatter<'_>,
    calendar: &str,
    show: CalendarName,
) -> fmt::Result {
    if show != CalendarName::Never && (show != CalendarName::Auto || calendar != "iso8601") {
        write!(
            f,
            "[{}u-ca={calendar}]",
            if show == CalendarName::Critical {
                "!"
            } else {
                ""
            }
        )?;
    }
    Ok(())
}

#[derive(Clone, Copy, Debug)]
pub struct PlainDateTime<C = Calendar>(i128, C);
impl PlainDateTime {
    pub fn new(fields: IsoDateTime) -> Result<Self, Error> {
        Self::from_epoch_nanoseconds(fields.to_epoch_nanoseconds()?)
    }
    pub fn from_epoch_nanoseconds(value: i128) -> Result<Self, Error> {
        crate::iso::check_local(value)?;
        Ok(Self(value, Calendar::Iso8601))
    }
}
impl<C: CalendarProvider> PlainDateTime<C> {
    pub fn from_calendar_fields(
        calendar: C,
        fields: DateTimeFields<'_>,
        overflow: Overflow,
    ) -> Result<Self, Error> {
        let date = PlainDate::from_calendar_fields(calendar, fields.date, overflow)?;
        let time = if fields.time.is_empty() {
            PlainTime::from_nanoseconds(0)?
        } else {
            PlainTime::from_fields(fields.time, overflow)?
        };
        date.to_date_time(time)
    }
    pub fn with_fields(
        self,
        fields: DateTimeFields<'_>,
        overflow: Overflow,
    ) -> Result<Self, Error> {
        let has_date = fields.date.has_fields(self.calendar_id());
        if !has_date && fields.time.is_empty() {
            return Err(Error::InvalidDateTime);
        }
        let date = if has_date {
            self.date().with_fields(fields.date, overflow)?
        } else {
            self.date()
        };
        let time = if fields.time.is_empty() {
            self.time()
        } else {
            self.time().with_fields(fields.time, overflow)?
        };
        date.to_date_time(time)
    }
    pub fn from_epoch_nanoseconds_in(value: i128, calendar: C) -> Result<Self, Error> {
        crate::iso::check_local(value)?;
        calendar
            .date(value.div_euclid(NANOSECONDS_PER_DAY) as i64)
            .map_err(error)?;
        Ok(Self(value, calendar))
    }
    pub fn parse_in(value: &str, calendar: C) -> Result<Self, Error> {
        let fields = crate::parse::plain_date_time_fields(value)?;
        crate::parse::check_calendar(value, calendar.id())?;
        Self::from_epoch_nanoseconds_in(fields.to_epoch_nanoseconds()?, calendar)
    }
    pub const fn calendar(self) -> C {
        self.1
    }
    pub fn calendar_id(self) -> &'static str {
        self.1.id()
    }
    pub fn equals<D: CalendarProvider>(self, other: PlainDateTime<D>) -> bool {
        self.0 == other.0 && self.calendar_id() == other.calendar_id()
    }
    // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L920-L922
    // L920: epoch-day order equals ISO-date order; each clock lies within one day.
    // L921: different dates dominate the entire clock remainder.
    // L922: on equal dates, exact nanoseconds compare the six clock fields.
    pub fn compare<D: CalendarProvider>(self, other: PlainDateTime<D>) -> core::cmp::Ordering {
        self.0.cmp(&other.0)
    }
    pub fn with_calendar<D: CalendarProvider>(
        self,
        calendar: D,
    ) -> Result<PlainDateTime<D>, Error> {
        PlainDateTime::from_epoch_nanoseconds_in(self.0, calendar)
    }
    pub fn calendar_fields(self) -> Result<crate::calendar::Date, Error> {
        self.date().calendar_fields()
    }
    pub const fn epoch_nanoseconds(self) -> i128 {
        self.0
    }
    pub fn fields(self) -> IsoDateTime {
        IsoDateTime::from_epoch_nanoseconds(self.0).unwrap()
    }
    pub fn date(self) -> PlainDate<C> {
        PlainDate(self.0.div_euclid(NANOSECONDS_PER_DAY) as i64, self.1)
    }
    pub fn time(self) -> PlainTime {
        PlainTime::from_nanoseconds(self.0.rem_euclid(NANOSECONDS_PER_DAY)).unwrap()
    }
    pub fn with_time(self, time: PlainTime) -> Result<Self, Error> {
        self.date().to_date_time(time)
    }
    pub fn checked_add(self, duration: Duration, overflow: Overflow) -> Result<Self, Error> {
        let fields = duration.fields();
        let time = self.time().nanoseconds() + duration.time_nanoseconds(false)?;
        let date = self.date().add_date(
            fields[0],
            fields[1],
            fields[2] * 7 + fields[3] + time.div_euclid(NANOSECONDS_PER_DAY),
            overflow,
        )?;
        date.to_date_time(PlainTime::from_nanoseconds(
            time.rem_euclid(NANOSECONDS_PER_DAY),
        )?)
    }
    pub fn checked_subtract(self, duration: Duration, overflow: Overflow) -> Result<Self, Error> {
        self.checked_add(duration.negated(), overflow)
    }
    pub fn round(self, unit: TimeUnit, increment: u32, mode: RoundingMode) -> Result<Self, Error> {
        let rounded = self.time().rounded_nanoseconds(unit, increment, mode)?;
        Self::from_epoch_nanoseconds_in(
            i128::from(self.date().0) * NANOSECONDS_PER_DAY + rounded,
            self.1,
        )
    }
    pub fn round_day(self, mode: RoundingMode) -> Result<Self, Error> {
        let rounded =
            crate::rounding::round_instant(self.time().nanoseconds(), NANOSECONDS_PER_DAY, mode);
        Self::from_epoch_nanoseconds_in(
            i128::from(self.date().0) * NANOSECONDS_PER_DAY + rounded,
            self.1,
        )
    }
    pub fn until(
        self,
        other: Self,
        largest: impl Into<crate::DateTimeUnit>,
        smallest: impl Into<crate::DateTimeUnit>,
        increment: u32,
        mode: RoundingMode,
    ) -> Result<Duration, Error> {
        crate::plain_relative::date_time_difference(
            self,
            other,
            largest.into(),
            smallest.into(),
            increment,
            mode,
            false,
        )
    }
    pub fn since(
        self,
        other: Self,
        largest: impl Into<crate::DateTimeUnit>,
        smallest: impl Into<crate::DateTimeUnit>,
        increment: u32,
        mode: RoundingMode,
    ) -> Result<Duration, Error> {
        crate::plain_relative::date_time_difference(
            self,
            other,
            largest.into(),
            smallest.into(),
            increment,
            mode,
            true,
        )
    }
    pub fn format(
        self,
        precision: Precision,
        mode: RoundingMode,
    ) -> Result<FormattedDateTime<C>, Error> {
        let quantum = match precision {
            Precision::Auto => 1,
            Precision::Minute => 60_000_000_000,
            Precision::Digits(n) if n <= 9 => 10i128.pow(u32::from(9 - n)),
            _ => return Err(Error::InvalidRoundingOptions),
        };
        let value = i128::from(self.date().0) * NANOSECONDS_PER_DAY
            + crate::rounding::round_instant(self.time().nanoseconds(), quantum, mode);
        Ok(FormattedDateTime {
            value: Self::from_epoch_nanoseconds_in(value, self.1)?,
            precision,
            calendar_name: CalendarName::Auto,
        })
    }
}
impl FromStr for PlainDateTime {
    type Err = Error;
    fn from_str(value: &str) -> Result<Self, Error> {
        Self::new(crate::parse::plain_date_time_fields(value)?)?
            .with_calendar(crate::parse::arithmetic_calendar(value)?)
    }
}
impl<C: CalendarProvider> fmt::Display for PlainDateTime<C> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        self.format(Precision::Auto, RoundingMode::Trunc)
            .map_err(|_| fmt::Error)?
            .fmt(f)
    }
}
pub struct FormattedDateTime<C = Calendar> {
    value: PlainDateTime<C>,
    precision: Precision,
    calendar_name: CalendarName,
}
impl<C: CalendarProvider> FormattedDateTime<C> {
    pub fn with_calendar_name(mut self, calendar_name: CalendarName) -> Self {
        self.calendar_name = calendar_name;
        self
    }
}
impl<C: CalendarProvider> fmt::Display for FormattedDateTime<C> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let output = crate::format::IsoString::date_time(self.value.fields(), self.precision);
        f.write_str(output.as_str()?)?;
        write_calendar(f, self.value.calendar_id(), self.calendar_name)
    }
}

macro_rules! date_order {
    ($type:ident) => {
        impl<C: CalendarProvider> PartialEq for $type<C> {
            fn eq(&self, other: &Self) -> bool {
                self.0 == other.0 && self.calendar_id() == other.calendar_id()
            }
        }
        impl<C: CalendarProvider> Eq for $type<C> {}
        impl<C: CalendarProvider> PartialOrd for $type<C> {
            fn partial_cmp(&self, other: &Self) -> Option<core::cmp::Ordering> {
                Some(self.cmp(other))
            }
        }
        impl<C: CalendarProvider> Ord for $type<C> {
            fn cmp(&self, other: &Self) -> core::cmp::Ordering {
                self.0
                    .cmp(&other.0)
                    .then_with(|| self.calendar_id().cmp(other.calendar_id()))
            }
        }
    };
}
date_order!(PlainDate);
date_order!(PlainDateTime);

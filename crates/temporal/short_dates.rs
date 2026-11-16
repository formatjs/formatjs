use crate::calendar::{Calendar, Date, DateDuration};
use crate::calendar_provider::{
    error, overflow as calendar_overflow, resolve_year, resolve_year_month,
};
use crate::date::month_length;
use crate::iso::{epoch_day_from_iso, iso_from_epoch_nanoseconds_raw};
use crate::{
    CalendarName, CalendarProvider, DateFields, DateTimeUnit, Duration, Error, NANOSECONDS_PER_DAY,
    Overflow, PlainDate, RoundingMode,
};
use core::{cmp::Ordering, fmt, str::FromStr};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum YearMonthUnit {
    Year,
    Month,
}
impl From<YearMonthUnit> for DateTimeUnit {
    fn from(value: YearMonthUnit) -> Self {
        match value {
            YearMonthUnit::Year => Self::Year,
            YearMonthUnit::Month => Self::Month,
        }
    }
}

#[derive(Clone, Copy, Debug)]
pub struct PlainYearMonth<C = Calendar> {
    epoch_day: i64,
    calendar: C,
}
impl PlainYearMonth {
    pub fn new(year: i32, month: u8, reference_day: u8) -> Result<Self, Error> {
        if !(1..=12).contains(&month)
            || reference_day == 0
            || reference_day > month_length(year, month)
        {
            return Err(Error::InvalidDateTime);
        }
        Self::from_epoch_day_in(
            epoch_day_from_iso(year, month, reference_day),
            Calendar::Iso8601,
        )
    }
}
impl<C: CalendarProvider> PlainYearMonth<C> {
    pub fn from_epoch_day_in(epoch_day: i64, calendar: C) -> Result<Self, Error> {
        check_year_month(epoch_day)?;
        calendar.date_extended(epoch_day).map_err(error)?;
        Ok(Self {
            epoch_day,
            calendar,
        })
    }
    pub fn from_calendar_fields(
        calendar: C,
        fields: DateFields<'_>,
        overflow: Overflow,
    ) -> Result<Self, Error> {
        let (year, month) = resolve_year_month(
            calendar,
            DateFields {
                day: Some(1),
                ..fields
            },
            overflow,
        )?;
        Self::from_epoch_day_in(
            calendar
                .epoch_day_extended(year, month, 1, calendar_overflow(overflow))
                .map_err(error)?,
            calendar,
        )
    }
    pub fn parse_in(value: &str, calendar: C) -> Result<Self, Error> {
        let fields = crate::parse::short_date_fields(value, true)?;
        crate::parse::check_calendar(value, calendar.id())?;
        let reference = Self::from_epoch_day_in(
            epoch_day_from_iso(fields.year, fields.month, fields.day),
            calendar,
        )?;
        let date = reference.calendar_fields()?;
        Self::from_calendar_fields(calendar, date_fields(date), Overflow::Constrain)
    }
    pub const fn epoch_day(self) -> i64 {
        self.epoch_day
    }
    pub const fn calendar(self) -> C {
        self.calendar
    }
    pub fn format(self, calendar_name: CalendarName) -> FormattedYearMonth<C> {
        FormattedYearMonth {
            value: self,
            calendar_name,
        }
    }
    pub fn calendar_id(self) -> &'static str {
        self.calendar.id()
    }
    pub fn with_calendar<D: CalendarProvider>(
        self,
        calendar: D,
    ) -> Result<PlainYearMonth<D>, Error> {
        PlainYearMonth::from_epoch_day_in(self.epoch_day, calendar)
    }
    /// ISO reference fields; calendar fields are available separately.
    pub fn fields(self) -> (i32, u8, u8) {
        iso_fields(self.epoch_day)
    }
    pub fn calendar_fields(self) -> Result<Date, Error> {
        self.calendar.date_extended(self.epoch_day).map_err(error)
    }
    pub fn era(self) -> Result<Option<crate::calendar::Era>, Error> {
        self.calendar.era_extended(self.epoch_day).map_err(error)
    }
    pub fn days_in_month(self) -> Result<u8, Error> {
        let fields = self.calendar_fields()?;
        self.calendar
            .days_in_month(fields.year, fields.month)
            .map_err(error)
    }
    pub fn months_in_year(self) -> Result<u8, Error> {
        self.calendar
            .months_in_year(self.calendar_fields()?.year)
            .map_err(error)
    }
    pub fn days_in_year(self) -> Result<u16, Error> {
        let year = self.calendar_fields()?.year;
        Ok((self.calendar.start_of_year(year + 1).map_err(error)?
            - self.calendar.start_of_year(year).map_err(error)?) as u16)
    }
    pub fn in_leap_year(self) -> Result<bool, Error> {
        Ok(match self.calendar_id() {
            "hebrew" | "chinese" | "dangi" => self.months_in_year()? == 13,
            "islamic-civil" | "islamic-tbla" | "islamic-umalqura" => self.days_in_year()? == 355,
            _ => self.days_in_year()? == 366,
        })
    }
    pub fn equals<D: CalendarProvider>(self, other: PlainYearMonth<D>) -> bool {
        self.epoch_day == other.epoch_day && self.calendar_id() == other.calendar_id()
    }
    pub fn compare<D: CalendarProvider>(self, other: PlainYearMonth<D>) -> Ordering {
        self.epoch_day.cmp(&other.epoch_day)
    }
    pub fn to_plain_date(self, day: u8, overflow: Overflow) -> Result<PlainDate<C>, Error> {
        PlainDate::from_calendar_fields(
            self.calendar,
            DateFields {
                day: Some(i32::from(day)),
                ..date_fields(self.calendar_fields()?)
            },
            overflow,
        )
    }
    fn first_day(self) -> Result<i64, Error> {
        Ok(self.epoch_day - i64::from(self.calendar_fields()?.day) + 1)
    }
    pub fn checked_add(self, duration: Duration, overflow: Overflow) -> Result<Self, Error> {
        let fields = duration.fields();
        if fields[2..].iter().any(|value| *value != 0) {
            return Err(Error::InvalidDuration);
        }
        let first = self.first_day()?;
        PlainDate::from_epoch_day(first)?;
        let duration = DateDuration {
            years: fields[0].try_into().map_err(|_| Error::OutOfRange)?,
            months: fields[1].try_into().map_err(|_| Error::OutOfRange)?,
            ..DateDuration::default()
        };
        let epoch = self
            .calendar
            .add_extended(first, duration, calendar_overflow(overflow))
            .map_err(error)?;
        Self::from_epoch_day_in(epoch, self.calendar)
    }
    pub fn checked_subtract(self, duration: Duration, overflow: Overflow) -> Result<Self, Error> {
        self.checked_add(duration.negated(), overflow)
    }
    pub fn until(
        self,
        other: Self,
        largest: YearMonthUnit,
        smallest: YearMonthUnit,
        increment: u32,
        mode: RoundingMode,
    ) -> Result<Duration, Error> {
        self.difference(other, largest, smallest, increment, mode, false)
    }
    pub fn since(
        self,
        other: Self,
        largest: YearMonthUnit,
        smallest: YearMonthUnit,
        increment: u32,
        mode: RoundingMode,
    ) -> Result<Duration, Error> {
        self.difference(other, largest, smallest, increment, mode, true)
    }
    fn difference(
        self,
        other: Self,
        largest: YearMonthUnit,
        smallest: YearMonthUnit,
        increment: u32,
        mode: RoundingMode,
        since: bool,
    ) -> Result<Duration, Error> {
        if self.calendar_id() != other.calendar_id() {
            return Err(Error::InvalidDateTime);
        }
        if increment == 0
            || increment > 1_000_000_000
            || (largest == YearMonthUnit::Month && smallest == YearMonthUnit::Year)
        {
            return Err(Error::InvalidRoundingOptions);
        }
        if self.equals(other) {
            return Duration::new([0; 10]);
        }
        let start = PlainDate::from_epoch_day_in(self.first_day()?, self.calendar)?;
        let end = PlainDate::from_epoch_day_in(other.first_day()?, other.calendar)?;
        if smallest == YearMonthUnit::Month && increment == 1 {
            let unit = match largest {
                YearMonthUnit::Year => crate::calendar::DateUnit::Year,
                YearMonthUnit::Month => crate::calendar::DateUnit::Month,
            };
            let fields = self
                .calendar
                .until_raw(start.epoch_day(), end.epoch_day(), unit)
                .map_err(error)?;
            let mut values = [0; 10];
            values[0] = i128::from(fields.years);
            values[1] = i128::from(fields.months);
            let result = Duration::new(values)?;
            return Ok(if since { result.negated() } else { result });
        }
        if since {
            start.since(end, largest.into(), smallest.into(), increment, mode)
        } else {
            start.until(end, largest.into(), smallest.into(), increment, mode)
        }
    }
}
impl FromStr for PlainYearMonth {
    type Err = Error;
    fn from_str(value: &str) -> Result<Self, Error> {
        Self::parse_in(value, crate::parse::arithmetic_calendar(value)?)
    }
}
impl<C: CalendarProvider> PartialEq for PlainYearMonth<C> {
    fn eq(&self, other: &Self) -> bool {
        self.equals(*other)
    }
}
impl<C: CalendarProvider> Eq for PlainYearMonth<C> {}
impl<C: CalendarProvider> PartialOrd for PlainYearMonth<C> {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}
impl<C: CalendarProvider> Ord for PlainYearMonth<C> {
    fn cmp(&self, other: &Self) -> Ordering {
        self.compare(*other)
            .then_with(|| self.calendar_id().cmp(other.calendar_id()))
    }
}
impl<C: CalendarProvider> fmt::Display for PlainYearMonth<C> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        self.format(CalendarName::Auto).fmt(f)
    }
}
pub struct FormattedYearMonth<C = Calendar> {
    value: PlainYearMonth<C>,
    calendar_name: CalendarName,
}
impl<C: CalendarProvider> fmt::Display for FormattedYearMonth<C> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let (year, month, day) = self.value.fields();
        write_year(f, year)?;
        write!(f, "-{month:02}")?;
        if self.value.calendar_id() != "iso8601"
            || matches!(
                self.calendar_name,
                CalendarName::Always | CalendarName::Critical
            )
        {
            write!(f, "-{day:02}")?;
        }
        crate::date::write_calendar(f, self.value.calendar_id(), self.calendar_name)
    }
}

#[derive(Clone, Copy, Debug)]
pub struct PlainMonthDay<C = Calendar> {
    epoch_day: i64,
    calendar: C,
}
impl PlainMonthDay {
    pub fn new(month: u8, day: u8, reference_year: i32) -> Result<Self, Error> {
        Self::from_epoch_day_in(
            PlainDate::new(reference_year, month, day)?.epoch_day(),
            Calendar::Iso8601,
        )
    }
}
impl<C: CalendarProvider> PlainMonthDay<C> {
    pub fn from_epoch_day_in(epoch_day: i64, calendar: C) -> Result<Self, Error> {
        PlainDate::from_epoch_day_in(epoch_day, calendar)?;
        Ok(Self {
            epoch_day,
            calendar,
        })
    }
    pub fn from_calendar_fields(
        calendar: C,
        fields: DateFields<'_>,
        overflow: Overflow,
    ) -> Result<Self, Error> {
        let mut day = fields
            .day
            .filter(|day| *day > 0)
            .ok_or(Error::InvalidDateTime)?;
        let year = resolve_year(calendar, fields)?;
        let mut code = fields.month_code;
        if calendar.id() == "iso8601" {
            let (_, month) = resolve_year_month(
                calendar,
                DateFields {
                    year: Some(1972),
                    ..fields
                },
                overflow,
            )?;
            let start = calendar
                .epoch_day_extended(1972, month, 1, calendar_overflow(overflow))
                .map_err(error)?;
            let month = calendar.date_extended(start).map_err(error)?.month;
            let maximum = i32::from(month_length(year.unwrap_or(1972), month));
            if day > maximum && overflow == Overflow::Reject {
                return Err(Error::InvalidDateTime);
            }
            return Self::from_epoch_day_in(
                epoch_day_from_iso(1972, month, day.min(maximum) as u8),
                calendar,
            );
        }
        if let Some(year) = year {
            if calendar.start_of_year(year).map_err(error)? > 100_000_000
                || calendar
                    .start_of_year(year.checked_add(1).ok_or(Error::OutOfRange)?)
                    .map_err(error)?
                    <= -100_000_001
            {
                return Err(Error::OutOfRange);
            }
            let (_, month) = resolve_year_month(calendar, fields, overflow)?;
            let epoch = calendar
                .epoch_day_extended(year, month, day, calendar_overflow(overflow))
                .map_err(error)?;
            let normalized = calendar.date_extended(epoch).map_err(error)?;
            code = Some(normalized.month_code);
            day = i32::from(normalized.day);
        } else if fields.month.is_some() {
            return Err(Error::InvalidDateTime);
        }
        let mut code = code.ok_or(Error::InvalidDateTime)?;
        if matches!(calendar.id(), "chinese" | "dangi") {
            if day > 30 && overflow == Overflow::Reject {
                return Err(Error::InvalidDateTime);
            }
            day = day.min(30);
            if code.leap
                && (matches!(code.number, 1 | 12)
                    || (day == 30 && matches!(code.number, 2 | 8 | 9 | 10 | 11)))
            {
                if overflow == Overflow::Reject {
                    return Err(Error::InvalidDateTime);
                }
                code.leap = false;
            }
        }
        let mut best = None;
        let mut maximum_day = 0;
        for (minimum_year, maximum_year, descending) in [(1900, 1972, true), (1973, 2035, false)] {
            let minimum = epoch_day_from_iso(minimum_year, 1, 1);
            let maximum = epoch_day_from_iso(maximum_year, 12, 31);
            let first = calendar.date_extended(minimum).map_err(error)?.year;
            let latest = calendar.date_extended(maximum).map_err(error)?.year;
            for index in 0..=latest - first {
                let year = if descending {
                    latest - index
                } else {
                    first + index
                };
                let Ok(month) =
                    calendar.month_from_code(year, code, crate::calendar::Overflow::Reject)
                else {
                    continue;
                };
                let Ok(start) = calendar.epoch_day_extended(
                    year,
                    i32::from(month),
                    1,
                    crate::calendar::Overflow::Reject,
                ) else {
                    continue;
                };
                let valid_day = day.min(i32::from(
                    calendar.days_in_month(year, month).map_err(error)?,
                ));
                let epoch = start + i64::from(valid_day) - 1;
                if epoch < minimum || epoch > maximum {
                    continue;
                }
                if valid_day == day {
                    return Self::from_epoch_day_in(epoch, calendar);
                }
                if valid_day > maximum_day {
                    maximum_day = valid_day;
                    best = Some(epoch);
                }
            }
        }
        if overflow == Overflow::Constrain
            && let Some(epoch) = best
        {
            return Self::from_epoch_day_in(epoch, calendar);
        }
        Err(Error::InvalidDateTime)
    }
    pub fn parse_in(value: &str, calendar: C) -> Result<Self, Error> {
        let fields = crate::parse::short_date_fields(value, false)?;
        crate::parse::check_calendar(value, calendar.id())?;
        if calendar.id() == "iso8601" {
            return Self::from_calendar_fields(
                calendar,
                DateFields {
                    year: Some(fields.year),
                    month: Some(i32::from(fields.month)),
                    day: Some(i32::from(fields.day)),
                    ..DateFields::default()
                },
                Overflow::Constrain,
            );
        }
        if !(-271821..=275760).contains(&fields.year) {
            return Err(Error::OutOfRange);
        }
        let epoch = epoch_day_from_iso(fields.year, fields.month, fields.day);
        let date = calendar.date_extended(epoch).map_err(error)?;
        Self::from_calendar_fields(calendar, date_fields(date), Overflow::Constrain)
    }
    pub const fn epoch_day(self) -> i64 {
        self.epoch_day
    }
    pub const fn calendar(self) -> C {
        self.calendar
    }
    pub fn format(self, calendar_name: CalendarName) -> FormattedMonthDay<C> {
        FormattedMonthDay {
            value: self,
            calendar_name,
        }
    }
    pub fn calendar_id(self) -> &'static str {
        self.calendar.id()
    }
    pub fn with_calendar<D: CalendarProvider>(
        self,
        calendar: D,
    ) -> Result<PlainMonthDay<D>, Error> {
        PlainMonthDay::from_epoch_day_in(self.epoch_day, calendar)
    }
    pub fn equals<D: CalendarProvider>(self, other: PlainMonthDay<D>) -> bool {
        self.epoch_day == other.epoch_day && self.calendar_id() == other.calendar_id()
    }
    /// ISO reference month, day, year.
    pub fn fields(self) -> (u8, u8, i32) {
        let (year, month, day) = iso_fields(self.epoch_day);
        (month, day, year)
    }
    pub fn calendar_fields(self) -> Result<Date, Error> {
        self.calendar.date(self.epoch_day).map_err(error)
    }
    pub fn to_plain_date(self, year: i32, overflow: Overflow) -> Result<PlainDate<C>, Error> {
        self.to_plain_date_fields(
            DateFields {
                year: Some(year),
                ..DateFields::default()
            },
            overflow,
        )
    }
    pub fn to_plain_date_fields(
        self,
        fields: DateFields<'_>,
        overflow: Overflow,
    ) -> Result<PlainDate<C>, Error> {
        let reference = self.calendar_fields()?;
        PlainDate::from_calendar_fields(
            self.calendar,
            DateFields {
                year: fields.year,
                era: fields.era,
                era_year: fields.era_year,
                month_code: Some(reference.month_code),
                day: Some(i32::from(reference.day)),
                ..DateFields::default()
            },
            overflow,
        )
    }
}
impl FromStr for PlainMonthDay {
    type Err = Error;
    fn from_str(value: &str) -> Result<Self, Error> {
        Self::parse_in(value, crate::parse::arithmetic_calendar(value)?)
    }
}
impl<C: CalendarProvider> PartialEq for PlainMonthDay<C> {
    fn eq(&self, other: &Self) -> bool {
        self.equals(*other)
    }
}
impl<C: CalendarProvider> Eq for PlainMonthDay<C> {}
impl<C: CalendarProvider> fmt::Display for PlainMonthDay<C> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        self.format(CalendarName::Auto).fmt(f)
    }
}
pub struct FormattedMonthDay<C = Calendar> {
    value: PlainMonthDay<C>,
    calendar_name: CalendarName,
}
impl<C: CalendarProvider> fmt::Display for FormattedMonthDay<C> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let (month, day, year) = self.value.fields();
        if self.value.calendar_id() != "iso8601"
            || matches!(
                self.calendar_name,
                CalendarName::Always | CalendarName::Critical
            )
        {
            write_year(f, year)?;
            write!(f, "-")?;
        }
        write!(f, "{month:02}-{day:02}")?;
        crate::date::write_calendar(f, self.value.calendar_id(), self.calendar_name)
    }
}

fn check_year_month(epoch: i64) -> Result<(), Error> {
    if !(-110_000_000..=110_000_000).contains(&epoch) {
        return Err(Error::OutOfRange);
    }
    let (year, month, _) = iso_fields(epoch);
    if !(-271821..=275760).contains(&year)
        || (year == -271821 && month < 4)
        || (year == 275760 && month > 9)
    {
        return Err(Error::OutOfRange);
    }
    Ok(())
}
fn date_fields(date: Date) -> DateFields<'static> {
    DateFields {
        year: Some(date.year),
        month_code: Some(date.month_code),
        day: Some(i32::from(date.day)),
        ..DateFields::default()
    }
}
fn iso_fields(epoch: i64) -> (i32, u8, u8) {
    let fields = iso_from_epoch_nanoseconds_raw(i128::from(epoch) * NANOSECONDS_PER_DAY);
    (fields.year, fields.month, fields.day)
}
fn write_year(f: &mut fmt::Formatter<'_>, year: i32) -> fmt::Result {
    if (0..=9999).contains(&year) {
        write!(f, "{year:04}")
    } else {
        write!(f, "{year:+07}")
    }
}

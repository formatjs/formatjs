use crate::calendar::{Calendar, Date, DateDuration};
use crate::calendar_provider::{
    DateFieldShape, error, merge_fields, overflow as calendar_overflow, resolve_year,
    resolve_year_month,
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
    // Proposal comparison §9.5.7 step 16.e: Forward year or month to typed relative rounding.
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
    // Proposal comparison §9.1.1 steps 9–11: Validate the typed ISO reference date and build the year-month.
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
    // Proposal comparison §9.3.13 steps 7, 10–11: merge typed year-month updates.
    pub fn with_fields(self, fields: DateFields<'_>, overflow: Overflow) -> Result<Self, Error> {
        Self::from_calendar_fields(
            self.calendar,
            merge_fields(
                self.calendar,
                self.epoch_day,
                fields,
                DateFieldShape::YearMonth,
            )?,
            overflow,
        )
    }
    // Proposal comparison §9.5.5 steps 1, 4 and 5: Check the reference month and store its calendar.
    pub fn from_epoch_day_in(epoch_day: i64, calendar: C) -> Result<Self, Error> {
        check_year_month(epoch_day)?;
        calendar.date_extended(epoch_day).map_err(error)?;
        Ok(Self {
            epoch_day,
            calendar,
        })
    }
    // Proposal comparison §12.3.13 steps 1–4: Resolve typed year-month fields with day one.
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
    // Proposal comparison §9.5.2 steps 4, 11–12 and 14–15: Parse and normalize a typed year-month.
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
    // Proposal comparison §9.2.3 step 3: Read the exact ISO reference day used for comparison.
    pub const fn epoch_day(self) -> i64 {
        self.epoch_day
    }
    // Proposal comparison §9.5.7 step 2: Read the stored calendar provider.
    pub const fn calendar(self) -> C {
        self.calendar
    }
    // Proposal comparison §9.3.19 step 5: Capture typed year-month formatting inputs.
    pub fn format(self, calendar_name: CalendarName) -> FormattedYearMonth<C> {
        FormattedYearMonth {
            value: self,
            calendar_name,
        }
    }
    // Proposal comparison §9.3.3 step 3: Return the stored calendar provider ID.
    pub fn calendar_id(self) -> &'static str {
        self.calendar.id()
    }
    // Proposal comparison §9.5.5 steps 1, 4 and 5: Reuse typed construction for a replacement calendar.
    pub fn with_calendar<D: CalendarProvider>(
        self,
        calendar: D,
    ) -> Result<PlainYearMonth<D>, Error> {
        PlainYearMonth::from_epoch_day_in(self.epoch_day, calendar)
    }
    /// ISO reference fields; calendar fields are available separately.
    // Proposal comparison §9.5.6 steps 1, 2 and 4.a: Supply the ISO reference fields for formatting.
    pub fn fields(self) -> (i32, u8, u8) {
        iso_fields(self.epoch_day)
    }
    // Proposal comparison §13.42 step 2: Project the reference day through the stored calendar.
    pub fn calendar_fields(self) -> Result<Date, Error> {
        self.calendar.date_extended(self.epoch_day).map_err(error)
    }
    // Proposal comparison §9.3.4 step 3: Read the calendar era at the reference day.
    pub fn era(self) -> Result<Option<crate::calendar::Era>, Error> {
        self.calendar.era_extended(self.epoch_day).map_err(error)
    }
    // Proposal comparison §9.3.10 step 3: Look up month length in the projected year and month.
    pub fn days_in_month(self) -> Result<u8, Error> {
        let fields = self.calendar_fields()?;
        self.calendar
            .days_in_month(fields.year, fields.month)
            .map_err(error)
    }
    // Proposal comparison §9.3.11 step 3: Look up month count in the projected year.
    pub fn months_in_year(self) -> Result<u8, Error> {
        self.calendar
            .months_in_year(self.calendar_fields()?.year)
            .map_err(error)
    }
    // Proposal comparison §9.3.9 step 3: Get year length from consecutive calendar year starts.
    pub fn days_in_year(self) -> Result<u16, Error> {
        let year = self.calendar_fields()?.year;
        Ok((self.calendar.start_of_year(year + 1).map_err(error)?
            - self.calendar.start_of_year(year).map_err(error)?) as u16)
    }
    // Proposal comparison §9.3.12 step 3: Derive leap status from provider month or day count.
    pub fn in_leap_year(self) -> Result<bool, Error> {
        Ok(match self.calendar_id() {
            "hebrew" | "chinese" | "dangi" => self.months_in_year()? == 13,
            "islamic-civil" | "islamic-tbla" | "islamic-umalqura" => self.days_in_year()? == 355,
            _ => self.days_in_year()? == 366,
        })
    }
    // Proposal comparison §9.3.18 steps 4–5: compare the reference day and calendar identity.
    pub fn equals<D: CalendarProvider>(self, other: PlainYearMonth<D>) -> bool {
        self.epoch_day == other.epoch_day && self.calendar_id() == other.calendar_id()
    }
    // Proposal comparison §9.2.3 step 3: Compare typed year-month ISO reference dates.
    pub fn compare<D: CalendarProvider>(self, other: PlainYearMonth<D>) -> Ordering {
        self.epoch_day.cmp(&other.epoch_day)
    }
    // Proposal comparison §9.3.23 steps 7–9: add the supplied day to the year-month fields.
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
    // Proposal comparison §9.5.7 steps 7–12: Derive calendar day one from the reference date.
    fn first_day(self) -> Result<i64, Error> {
        Ok(self.epoch_day - i64::from(self.calendar_fields()?.day) + 1)
    }
    // ECMA-262 preview §22.13.5.4 steps 7–15: add years and months from calendar day one.
    // https://tc39.es/ecma262/pr/3966/#sec-adddurationtoyearmonth
    pub fn checked_add(self, duration: Duration, overflow: Overflow) -> Result<Self, Error> {
        let fields = duration.fields();
        if fields[2..].iter().any(|value| *value != 0) {
            return Err(Error::InvalidDuration);
        }
        let first = self.first_day()?;
        // §22.3.3.16 step 3 bounds the input to CalendarDateAdd.
        // https://tc39.es/ecma262/pr/3966/#sec-calendardatefromfields
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
        // §22.3.3.1 step 3 bounds the result before building a PlainYearMonth.
        // https://tc39.es/ecma262/pr/3966/#sec-calendardateadd
        PlainDate::from_epoch_day(epoch)?;
        Self::from_epoch_day_in(epoch, self.calendar)
    }
    // Proposal comparison §9.5.8 step 2: negate the years and months before addition.
    pub fn checked_subtract(self, duration: Duration, overflow: Overflow) -> Result<Self, Error> {
        self.checked_add(duration.negated(), overflow)
    }
    // Proposal comparison §9.3.16 step 3: route the typed year-month until difference.
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
    // Proposal comparison §9.3.17 step 3: route the typed year-month since difference.
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
    // ECMA-262 preview §22.13.5.5: compare and round calendar months.
    // https://tc39.es/ecma262/pr/3966/#sec-differencetemporalplainyearmonth
    fn difference(
        self,
        other: Self,
        largest: YearMonthUnit,
        smallest: YearMonthUnit,
        increment: u32,
        mode: RoundingMode,
        since: bool,
    ) -> Result<Duration, Error> {
        // Steps 2–3 compare calendar identifiers before validating settings in step 5.
        if self.calendar_id() != other.calendar_id() {
            return Err(Error::InvalidDateTime);
        }
        if increment == 0
            || increment > 1_000_000_000
            || (largest == YearMonthUnit::Month && smallest == YearMonthUnit::Year)
        {
            return Err(Error::InvalidRoundingOptions);
        }
        // Step 6 tests exact reference dates before constructing day-one projections.
        if self.equals(other) {
            return Duration::new([0; 10]);
        }
        // Steps 7–12: both calendar day-one projections must be valid dates.
        let start = PlainDate::from_epoch_day_in(self.first_day()?, self.calendar)?;
        let end = PlainDate::from_epoch_day_in(other.first_day()?, other.calendar)?;
        // Steps 13–17: keep years and months. Unit month at increment one needs no rounding.
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
            // Step 18: negate the result for since.
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
    // Proposal comparison §9.5.2 steps 4 and 14–15: Route Rust string parsing to typed year-month normalization.
    fn from_str(value: &str) -> Result<Self, Error> {
        Self::parse_in(value, crate::parse::arithmetic_calendar(value)?)
    }
}
impl<C: CalendarProvider> PartialEq for PlainYearMonth<C> {
    // Proposal comparison §9.3.18 steps 4–5: Delegate Rust equality to typed year-month equality.
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
    // Proposal comparison §9.2.3 step 3: Use ISO reference date as the primary Rust sort key.
    fn cmp(&self, other: &Self) -> Ordering {
        self.compare(*other)
            .then_with(|| self.calendar_id().cmp(other.calendar_id()))
    }
}
impl<C: CalendarProvider> fmt::Display for PlainYearMonth<C> {
    // Proposal comparison §9.3.19 step 5: Format typed year-month with automatic calendar display.
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        self.format(CalendarName::Auto).fmt(f)
    }
}
pub struct FormattedYearMonth<C = Calendar> {
    value: PlainYearMonth<C>,
    calendar_name: CalendarName,
}
impl<C: CalendarProvider> fmt::Display for FormattedYearMonth<C> {
    // Proposal comparison §9.5.6 steps 1–7: Format ISO year-month and conditional reference day.
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
    // Proposal comparison §10.1.1 steps 9–11: Validate the typed ISO reference date and build the month-day.
    pub fn new(month: u8, day: u8, reference_year: i32) -> Result<Self, Error> {
        Self::from_epoch_day_in(
            PlainDate::new(reference_year, month, day)?.epoch_day(),
            Calendar::Iso8601,
        )
    }
}
impl<C: CalendarProvider> PlainMonthDay<C> {
    // Proposal comparison §10.3.6 steps 7, 10–11: merge typed month-day fields.
    pub fn with_fields(self, fields: DateFields<'_>, overflow: Overflow) -> Result<Self, Error> {
        Self::from_calendar_fields(
            self.calendar,
            merge_fields(
                self.calendar,
                self.epoch_day,
                fields,
                DateFieldShape::MonthDay,
            )?,
            overflow,
        )
    }
    // Proposal comparison §10.5.2 steps 1, 4 and 5: Check and store the typed month-day reference date.
    pub fn from_epoch_day_in(epoch_day: i64, calendar: C) -> Result<Self, Error> {
        PlainDate::from_epoch_day_in(epoch_day, calendar)?;
        Ok(Self {
            epoch_day,
            calendar,
        })
    }
    // Proposal comparison §12.3.24 steps 1.b–1.e: Regulate typed ISO month-day fields and store a 1972 reference.
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
    // ECMA-262 preview §22.14.5.2 steps 4–7 and 10–16: parse and normalize the reference day.
    // https://tc39.es/ecma262/pr/3966/#sec-totemporalmonthday
    pub fn parse_in(value: &str, calendar: C) -> Result<Self, Error> {
        let fields = crate::parse::short_date_fields(value, false)?;
        crate::parse::check_calendar(value, calendar.id())?;
        // Step 10: ISO month-days store a 1972 reference year.
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
        // Steps 12–15: check the original date before canonical calendar normalization.
        PlainDate::from_epoch_day(epoch)?;
        let date = calendar.date_extended(epoch).map_err(error)?;
        Self::from_calendar_fields(calendar, date_fields(date), Overflow::Constrain)
    }
    // Proposal comparison §10.5.2 step 4: Read the stored ISO reference epoch day.
    pub const fn epoch_day(self) -> i64 {
        self.epoch_day
    }
    // Proposal comparison §10.3.12 step 4: Read the stored month-day calendar provider.
    pub const fn calendar(self) -> C {
        self.calendar
    }
    // Proposal comparison §10.3.8 step 5: Capture typed month-day formatting inputs.
    pub fn format(self, calendar_name: CalendarName) -> FormattedMonthDay<C> {
        FormattedMonthDay {
            value: self,
            calendar_name,
        }
    }
    // Proposal comparison §10.3.3 step 3: Return the stored calendar provider ID.
    pub fn calendar_id(self) -> &'static str {
        self.calendar.id()
    }
    // Proposal comparison §10.5.2 steps 1, 4 and 5: Reuse typed construction for a replacement calendar.
    pub fn with_calendar<D: CalendarProvider>(
        self,
        calendar: D,
    ) -> Result<PlainMonthDay<D>, Error> {
        PlainMonthDay::from_epoch_day_in(self.epoch_day, calendar)
    }
    // Proposal comparison §10.3.7 steps 4–5: compare the reference date and calendar identity.
    pub fn equals<D: CalendarProvider>(self, other: PlainMonthDay<D>) -> bool {
        self.epoch_day == other.epoch_day && self.calendar_id() == other.calendar_id()
    }
    /// ISO reference month, day, year.
    // Proposal comparison §10.5.3 steps 1, 2 and 4.a: Supply ISO month-day reference fields for formatting.
    pub fn fields(self) -> (u8, u8, i32) {
        let (year, month, day) = iso_fields(self.epoch_day);
        (month, day, year)
    }
    // Proposal comparison §13.42 step 2: Project the reference date in the stored calendar.
    pub fn calendar_fields(self) -> Result<Date, Error> {
        self.calendar.date(self.epoch_day).map_err(error)
    }
    // Proposal comparison §10.3.12 steps 7–9: supply the typed year for date construction.
    pub fn to_plain_date(self, year: i32, overflow: Overflow) -> Result<PlainDate<C>, Error> {
        self.to_plain_date_fields(
            DateFields {
                year: Some(year),
                ..DateFields::default()
            },
            overflow,
        )
    }
    // Proposal comparison §10.3.12 steps 5 and 7–9: Combine reference month-day with typed year fields.
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
    // Proposal comparison §10.5.1 steps 4 and 15–16: Route Rust string parsing to typed month-day normalization.
    fn from_str(value: &str) -> Result<Self, Error> {
        Self::parse_in(value, crate::parse::arithmetic_calendar(value)?)
    }
}
impl<C: CalendarProvider> PartialEq for PlainMonthDay<C> {
    // Proposal comparison §10.3.7 steps 4–5: Delegate Rust equality to typed month-day equality.
    fn eq(&self, other: &Self) -> bool {
        self.equals(*other)
    }
}
impl<C: CalendarProvider> Eq for PlainMonthDay<C> {}
impl<C: CalendarProvider> fmt::Display for PlainMonthDay<C> {
    // Proposal comparison §10.3.8 step 5: Format typed month-day with automatic calendar display.
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        self.format(CalendarName::Auto).fmt(f)
    }
}
pub struct FormattedMonthDay<C = Calendar> {
    value: PlainMonthDay<C>,
    calendar_name: CalendarName,
}
impl<C: CalendarProvider> fmt::Display for FormattedMonthDay<C> {
    // Proposal comparison §10.5.3 steps 1–7: Format ISO month-day with conditional reference year.
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

// Proposal comparison §9.5.3 steps 1–4: Check the ISO year-month boundary months.
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
// Proposal comparison §13.42 steps 3, 4.a and 5.a: Carry projected month code, day and year into typed fields.
fn date_fields(date: Date) -> DateFields<'static> {
    DateFields {
        year: Some(date.year),
        month_code: Some(date.month_code),
        day: Some(i32::from(date.day)),
        ..DateFields::default()
    }
}
// Proposal comparison §11.1.2 steps 4–6: Recover ISO reference date fields from an epoch day.
fn iso_fields(epoch: i64) -> (i32, u8, u8) {
    let fields = iso_from_epoch_nanoseconds_raw(i128::from(epoch) * NANOSECONDS_PER_DAY);
    (fields.year, fields.month, fields.day)
}
// Proposal comparison §3.5.10 steps 1–4: Pad ISO years and sign extended years.
fn write_year(f: &mut fmt::Formatter<'_>, year: i32) -> fmt::Result {
    if (0..=9999).contains(&year) {
        write!(f, "{year:04}")
    } else {
        write!(f, "{year:+07}")
    }
}

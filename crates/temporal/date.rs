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
    // Proposal comparison §3.1.1 steps 8, 9, 10. Check typed ISO date fields and encode the date at noon.
    pub fn new(year: i32, month: u8, day: u8) -> Result<Self, Error> {
        // ECMA-262 preview §22.3.9.3 steps 1–2: validate ISO fields before storing the packed date.
        // https://tc39.es/ecma262/pr/3966/#sec-createisodaterecord
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
    // Proposal comparison §3.5.3 steps 1, 4, 5. Check the prepared date day and store ISO calendar data.
    pub fn from_epoch_day(value: i64) -> Result<Self, Error> {
        if !(-100_000_001..=100_000_000).contains(&value) {
            return Err(Error::OutOfRange);
        }
        Ok(Self(value, Calendar::Iso8601))
    }
}
impl<C: CalendarProvider> PlainDate<C> {
    // Proposal comparison §3.3.23 steps 7, 10–11: merge typed updates and construct the date.
    pub fn with_fields(self, fields: DateFields<'_>, overflow: Overflow) -> Result<Self, Error> {
        Self::from_calendar_fields(
            self.1,
            merge_fields(self.1, self.0, fields, DateFieldShape::Date)?,
            overflow,
        )
    }
    // Proposal comparison §3.5.3 steps 1, 4, 5. Check the day and initialize the typed calendar provider.
    pub fn from_epoch_day_in(value: i64, calendar: C) -> Result<Self, Error> {
        PlainDate::from_epoch_day(value)?;
        calendar.date(value).map_err(error)?;
        Ok(Self(value, calendar))
    }
    // Proposal comparison §12.3.12 steps 1, 2, 3. Resolve typed calendar date fields and check the resulting day.
    pub fn from_calendar_fields(
        calendar: C,
        fields: DateFields<'_>,
        overflow: Overflow,
    ) -> Result<Self, Error> {
        Self::from_epoch_day_in(resolve_fields(calendar, fields, overflow)?, calendar)
    }
    // Proposal comparison §3.5.4 steps 4, 10, 11. Parse the ISO fields and create a date in the selected provider.
    pub fn parse_in(value: &str, calendar: C) -> Result<Self, Error> {
        let fields = crate::parse::plain_date_time_fields(value)?;
        crate::parse::check_calendar(value, calendar.id())?;
        PlainDate::new(fields.year, fields.month, fields.day)?.with_calendar(calendar)
    }
    // Proposal comparison §3.5.3 step 5. Read the stored typed calendar provider.
    pub const fn calendar(self) -> C {
        self.1
    }
    // Proposal comparison §3.3.30 step 5. Carry the prepared calendar annotation option into formatting.
    pub fn format(self, calendar_name: CalendarName) -> FormattedDate<C> {
        FormattedDate {
            value: self,
            calendar_name,
        }
    }
    // Proposal comparison §3.3.3 step 3. Return the stored calendar identifier.
    pub fn calendar_id(self) -> &'static str {
        self.1.id()
    }
    // Proposal comparison §3.3.27 steps 4–5: compare the epoch day and calendar identity.
    pub fn equals<D: CalendarProvider>(self, other: PlainDate<D>) -> bool {
        self.0 == other.0 && self.calendar_id() == other.calendar_id()
    }
    // ECMA-262 preview §22.3.9.2 steps 1–7: epoch days follow ISO date order.
    // https://tc39.es/ecma262/pr/3966/#sec-compareisodate
    pub fn compare<D: CalendarProvider>(self, other: PlainDate<D>) -> core::cmp::Ordering {
        self.0.cmp(&other.0)
    }
    // Proposal comparison §3.3.24 step 4. Reuse the ISO day with the selected calendar.
    pub fn with_calendar<D: CalendarProvider>(self, calendar: D) -> Result<PlainDate<D>, Error> {
        PlainDate::from_epoch_day_in(self.0, calendar)
    }
    // Proposal comparison §12.3.26 steps 1, 2. Project the stored ISO day through its calendar.
    pub fn calendar_fields(self) -> Result<crate::calendar::Date, Error> {
        self.1.date(self.0).map_err(error)
    }
    // Proposal comparison §3.3.4 step 3. Project the era for this day and calendar.
    pub fn era(self) -> Result<Option<crate::calendar::Era>, Error> {
        self.1.era(self.0).map_err(error)
    }
    // Proposal comparison §3.3.10 step 3. Return the ISO weekday from the epoch day.
    pub fn day_of_week(self) -> u8 {
        // ECMA-262 preview §22.3.8.7 steps 1–4: offset epoch Thursday and wrap Sunday to 7.
        // https://tc39.es/ecma262/pr/3966/#sec-isodayofweek
        ((self.0 + 3).rem_euclid(7) + 1) as u8
    }
    // Proposal comparison §3.3.14 step 3. Return the seven-day week length.
    pub const fn days_in_week(self) -> u8 {
        7
    }
    // Proposal comparison §3.3.11 step 3. Count days since the start of the selected calendar year.
    pub fn day_of_year(self) -> Result<u16, Error> {
        // ECMA-262 preview §22.3.8.6 steps 1–2: ISO uses January 1 to count days.
        // https://tc39.es/ecma262/pr/3966/#sec-isodayofyear
        Ok((self.0
            - self
                .1
                .start_of_year(self.calendar_fields()?.year)
                .map_err(error)?
            + 1) as u16)
    }
    // Proposal comparison §3.3.15 step 3. Read the month length for the projected calendar fields.
    pub fn days_in_month(self) -> Result<u8, Error> {
        let fields = self.calendar_fields()?;
        self.1
            .days_in_month(fields.year, fields.month)
            .map_err(error)
    }
    // Proposal comparison §3.3.17 step 3. Read the month count of the projected calendar year.
    pub fn months_in_year(self) -> Result<u8, Error> {
        self.1
            .months_in_year(self.calendar_fields()?.year)
            .map_err(error)
    }
    // Proposal comparison §3.3.16 step 3. Measure the distance between successive calendar year starts.
    pub fn days_in_year(self) -> Result<u16, Error> {
        let year = self.calendar_fields()?.year;
        Ok((self.1.start_of_year(year + 1).map_err(error)?
            - self.1.start_of_year(year).map_err(error)?) as u16)
    }
    // Proposal comparison §3.3.18 step 3. Use the calendar's month or year length to detect a leap year.
    pub fn in_leap_year(self) -> Result<bool, Error> {
        Ok(match self.calendar_id() {
            "hebrew" | "chinese" | "dangi" => self.months_in_year()? == 13,
            "islamic-civil" | "islamic-tbla" | "islamic-umalqura" => self.days_in_year()? == 355,
            _ => self.days_in_year()? == 366,
        })
    }
    // Proposal comparison §3.3.12 step 3. Project the ISO week number and week-year together.
    pub fn week_of_year(self) -> Option<(i32, u8)> {
        if self.calendar_id() != "iso8601" {
            return None;
        }
        // ECMA-262 preview §22.3.8.5 steps 8–13: use Thursday to assign the ISO week-year.
        // https://tc39.es/ecma262/pr/3966/#sec-isoweekofyear
        let thursday = self.0 + 4 - i64::from(self.day_of_week());
        let year =
            crate::iso::iso_from_epoch_nanoseconds_raw(i128::from(thursday) * NANOSECONDS_PER_DAY)
                .year;
        Some((
            year,
            ((thursday - crate::iso::epoch_day_from_iso(year, 1, 1)) / 7 + 1) as u8,
        ))
    }
    // Proposal comparison §13.1 step 4. Read the already encoded ISO epoch day.
    pub const fn epoch_day(self) -> i64 {
        self.0
    }
    // Proposal comparison §3.5.11 steps 1, 2, 3. Decode the ISO fields used by date formatting.
    pub fn fields(self) -> (i32, u8, u8) {
        let fields = IsoDateTime::from_epoch_nanoseconds(
            i128::from(self.0) * NANOSECONDS_PER_DAY + NANOSECONDS_PER_DAY / 2,
        )
        .unwrap();
        (fields.year, fields.month, fields.day)
    }
    // Proposal comparison §3.5.15 steps 4, 7–8: add the date fields and whole clock days.
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
    // Proposal comparison §3.5.15 step 3: negate the typed duration before date addition.
    pub fn checked_subtract(self, duration: Duration, overflow: Overflow) -> Result<Self, Error> {
        self.checked_add(duration.negated(), overflow)
    }
    // Proposal comparison §3.5.15 steps 7, 8. Add a prepared typed date duration and return the resulting day.
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

    // Proposal comparison §3.3.28 steps 4, 5. Combine the selected clock with the ISO day and calendar.
    pub fn to_date_time(self, time: PlainTime) -> Result<PlainDateTime<C>, Error> {
        PlainDateTime::from_epoch_nanoseconds_in(
            i128::from(self.0) * NANOSECONDS_PER_DAY + time.nanoseconds(),
            self.1,
        )
    }
    // Proposal comparison §3.3.29 steps 5.a, 6.b–7: resolve the selected local clock or day start.
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
// ECMA-262 preview §22.3.8.3 steps 1–4: return the Gregorian month length.
// https://tc39.es/ecma262/pr/3966/#sec-isodaysinmonth
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
    // Proposal comparison §3.5.4 steps 4, 5, 6, 7, 10, 11. Parse a date string and use its supported arithmetic calendar.
    fn from_str(value: &str) -> Result<Self, Error> {
        let fields = crate::parse::plain_date_time_fields(value)?;
        Self::new(fields.year, fields.month, fields.day)?
            .with_calendar(crate::parse::arithmetic_calendar(value)?)
    }
}
impl<C: CalendarProvider> fmt::Display for PlainDate<C> {
    // Proposal comparison §3.3.32 step 3. Render the default automatic calendar annotation.
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        self.format(CalendarName::Auto).fmt(f)
    }
}
pub struct FormattedDate<C = Calendar> {
    value: PlainDate<C>,
    calendar_name: CalendarName,
}
impl<C: CalendarProvider> fmt::Display for FormattedDate<C> {
    // Proposal comparison §3.5.11 steps 1, 2, 3, 4, 5. Render the ISO date and selected calendar annotation.
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write_date(f, self.value.fields())?;
        write_calendar(f, self.value.calendar_id(), self.calendar_name)
    }
}
// Proposal comparison §3.5.11 steps 1, 2, 3. Write the prepared year, month and day with ISO padding.
pub(crate) fn write_date(f: &mut fmt::Formatter<'_>, fields: (i32, u8, u8)) -> fmt::Result {
    let output = crate::format::IsoString::date(fields);
    f.write_str(output.as_str()?)
}
// Proposal comparison §12.3.15 steps 1, 2, 3, 4. Write the optional calendar annotation and critical flag.
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
    // Proposal comparison §5.1.1 steps 14, 16, 18, 19. Encode typed ISO date-time fields and create the local value.
    pub fn new(fields: IsoDateTime) -> Result<Self, Error> {
        Self::from_epoch_nanoseconds(fields.to_epoch_nanoseconds()?)
    }
    // Proposal comparison §5.5.8 steps 1, 4, 5. Check a prepared local epoch and initialize the ISO datetime.
    pub fn from_epoch_nanoseconds(value: i128) -> Result<Self, Error> {
        crate::iso::check_local(value)?;
        Ok(Self(value, Calendar::Iso8601))
    }
}
impl<C: CalendarProvider> PlainDateTime<C> {
    // Proposal comparison §5.5.5 steps 1, 2, 3. Resolve typed date and clock fields before combining them.
    pub fn from_calendar_fields(
        calendar: C,
        fields: DateTimeFields<'_>,
        overflow: Overflow,
    ) -> Result<Self, Error> {
        let date = PlainDate::from_calendar_fields(calendar, fields.date, overflow)?;
        let time = if fields.time.is_empty() {
            // ECMA-262 preview §22.3.15.7: packed zero represents every midnight field.
            // https://tc39.es/ecma262/pr/3966/#sec-midnighttimerecord
            PlainTime::from_nanoseconds(0)?
        } else {
            PlainTime::from_fields(fields.time, overflow)?
        };
        date.to_date_time(time)
    }
    // Proposal comparison §5.3.25 steps 13, 16–17: merge typed date and clock updates.
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
    // Proposal comparison §5.5.8 steps 1, 4, 5. Check the local epoch and initialize its typed calendar provider.
    pub fn from_epoch_nanoseconds_in(value: i128, calendar: C) -> Result<Self, Error> {
        crate::iso::check_local(value)?;
        calendar
            .date(value.div_euclid(NANOSECONDS_PER_DAY) as i64)
            .map_err(error)?;
        Ok(Self(value, calendar))
    }
    // Proposal comparison §5.5.6 steps 4, 11, 12, 13. Parse ISO date-time fields in the selected provider.
    pub fn parse_in(value: &str, calendar: C) -> Result<Self, Error> {
        let fields = crate::parse::plain_date_time_fields(value)?;
        crate::parse::check_calendar(value, calendar.id())?;
        Self::from_epoch_nanoseconds_in(fields.to_epoch_nanoseconds()?, calendar)
    }
    // Proposal comparison §5.5.8 step 5. Read the stored typed calendar provider.
    pub const fn calendar(self) -> C {
        self.1
    }
    // Proposal comparison §5.3.3 step 3. Return the date-time's stored calendar identifier.
    pub fn calendar_id(self) -> &'static str {
        self.1.id()
    }
    // Proposal comparison §5.3.33 steps 4–5: compare encoded date-time and calendar identity.
    pub fn equals<D: CalendarProvider>(self, other: PlainDateTime<D>) -> bool {
        self.0 == other.0 && self.calendar_id() == other.calendar_id()
    }
    // ECMA-262 preview §22.3.10.2 steps 1–3: epoch day order, then exact clock order.
    // https://tc39.es/ecma262/pr/3966/#sec-compareisodatetime
    pub fn compare<D: CalendarProvider>(self, other: PlainDateTime<D>) -> core::cmp::Ordering {
        self.0.cmp(&other.0)
    }
    // Proposal comparison §5.3.27 step 4. Reuse the same local epoch with the selected calendar.
    pub fn with_calendar<D: CalendarProvider>(
        self,
        calendar: D,
    ) -> Result<PlainDateTime<D>, Error> {
        PlainDateTime::from_epoch_nanoseconds_in(self.0, calendar)
    }
    // Proposal comparison §12.3.26 steps 1, 2. Project the ISO day through the stored calendar.
    pub fn calendar_fields(self) -> Result<crate::calendar::Date, Error> {
        self.date().calendar_fields()
    }
    // Proposal comparison §5.5.4 step 2. Read the exact prepared local epoch.
    pub const fn epoch_nanoseconds(self) -> i128 {
        self.0
    }
    // Proposal comparison §5.5.9 steps 1, 2, 3, 4, 5. Decode local ISO fields for formatting.
    pub fn fields(self) -> IsoDateTime {
        IsoDateTime::from_epoch_nanoseconds(self.0).unwrap()
    }
    // Proposal comparison §5.3.39 step 3. Keep the ISO day and stored calendar.
    pub fn date(self) -> PlainDate<C> {
        PlainDate(self.0.div_euclid(NANOSECONDS_PER_DAY) as i64, self.1)
    }
    // Proposal comparison §5.3.40 step 3. Keep the within-day clock.
    pub fn time(self) -> PlainTime {
        PlainTime::from_nanoseconds(self.0.rem_euclid(NANOSECONDS_PER_DAY)).unwrap()
    }
    // Proposal comparison §5.3.26 steps 4, 5. Replace the local clock and keep the ISO day.
    pub fn with_time(self, time: PlainTime) -> Result<Self, Error> {
        self.date().to_date_time(time)
    }
    // ECMA-262 preview §22.10.5.3 steps 5–10: add the clock carry and date duration.
    // https://tc39.es/ecma262/pr/3966/#sec-adddurationtodatetime
    pub fn checked_add(self, duration: Duration, overflow: Overflow) -> Result<Self, Error> {
        let fields = duration.fields();
        // Steps 5–7: Euclidean division carries negative clock remainders into the date.
        let time = self.time().nanoseconds() + duration.time_nanoseconds(false)?;
        // Steps 8–10: add the adjusted calendar duration, then validate the date-time.
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
    // ECMA-262 preview §22.10.5.3 step 2: negate the typed duration before addition.
    pub fn checked_subtract(self, duration: Duration, overflow: Overflow) -> Result<Self, Error> {
        self.checked_add(duration.negated(), overflow)
    }
    // ECMA-262 preview §22.3.10.5 steps 2–4: round the clock and carry into the date.
    // https://tc39.es/ecma262/pr/3966/#sec-roundisodatetime
    pub fn round(self, unit: TimeUnit, increment: u32, mode: RoundingMode) -> Result<Self, Error> {
        let rounded = self.time().rounded_nanoseconds(unit, increment, mode)?;
        Self::from_epoch_nanoseconds_in(
            i128::from(self.date().0) * NANOSECONDS_PER_DAY + rounded,
            self.1,
        )
    }
    // Proposal comparison §5.5.11 steps 2, 3, 4. Round the local clock to a day and rebuild the date-time.
    pub fn round_day(self, mode: RoundingMode) -> Result<Self, Error> {
        let rounded =
            crate::rounding::round_instant(self.time().nanoseconds(), NANOSECONDS_PER_DAY, mode);
        Self::from_epoch_nanoseconds_in(
            i128::from(self.date().0) * NANOSECONDS_PER_DAY + rounded,
            self.1,
        )
    }
    // Proposal comparison §5.3.30 step 3: forward the prepared until difference.
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
    // Proposal comparison §5.3.31 step 3: forward the prepared since difference.
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
    // Proposal comparison §5.3.34 steps 11, 12, 13, 14. Round to the prepared precision and carry the formatting state.
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
    // Proposal comparison §5.5.6 steps 4, 5, 6, 7, 8, 11, 12, 13. Parse a datetime string with its supported arithmetic calendar.
    fn from_str(value: &str) -> Result<Self, Error> {
        Self::new(crate::parse::plain_date_time_fields(value)?)?
            .with_calendar(crate::parse::arithmetic_calendar(value)?)
    }
}
impl<C: CalendarProvider> fmt::Display for PlainDateTime<C> {
    // Proposal comparison §5.3.36 step 3. Render date-time with automatic precision and calendar annotation.
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
    // Proposal comparison §5.5.9 step 6. Carry the selected annotation mode into rendering.
    pub fn with_calendar_name(mut self, calendar_name: CalendarName) -> Self {
        self.calendar_name = calendar_name;
        self
    }
}
impl<C: CalendarProvider> fmt::Display for FormattedDateTime<C> {
    // Proposal comparison §5.5.9 steps 1, 2, 3, 4, 5, 6, 7. Render the prepared ISO clock and date with calendar annotation.
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

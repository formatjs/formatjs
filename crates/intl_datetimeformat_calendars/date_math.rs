use crate::calendar::{
    Calendar, Date, DateDuration, DateUnit, Error, MonthCode, Overflow, check_year,
};

pub(crate) trait NumericCalendar: Copy {
    fn from_epoch_day_raw(self, epoch: i64) -> Result<Date, Error>;
    fn to_epoch_day_raw(
        self,
        year: i32,
        month: i32,
        day: i32,
        overflow: Overflow,
    ) -> Result<i64, Error>;
    fn month_from_code(self, year: i32, code: MonthCode, overflow: Overflow) -> Result<u8, Error>;
    fn months_before_year(self, year: i32) -> Result<i64, Error>;
    fn year_month(self, serial: i64) -> Result<(i32, u8), Error>;
    // Proposal comparison §12.3.7 step 2.a. Advance the provider year and retain its month code before applying the month delta.
    fn add_year_month(
        self,
        original: Date,
        years: i64,
        months: i64,
        overflow: Overflow,
    ) -> Result<(i32, u8), Error> {
        let year = check_year(
            i64::from(original.year)
                .checked_add(years)
                .ok_or(Error::OutOfRange)?,
        )? as i32;
        let month = self.month_from_code(year, original.month_code, overflow)?;
        let serial = self
            .months_before_year(year)?
            .checked_add(i64::from(month) - 1)
            .and_then(|v| v.checked_add(months))
            .ok_or(Error::OutOfRange)?;
        self.year_month(serial)
    }
    // Proposal comparison §12.3.7 step 2.a. Apply the signed year, month, week and day fields in the provider.
    fn add_raw(self, epoch: i64, duration: DateDuration, overflow: Overflow) -> Result<i64, Error> {
        let values = [
            duration.years,
            duration.months,
            duration.weeks,
            duration.days,
        ];
        if values.iter().any(|v| *v < 0) && values.iter().any(|v| *v > 0) {
            return Err(Error::InvalidDuration);
        }
        let original = self.from_epoch_day_raw(epoch)?;
        let (year, month) =
            self.add_year_month(original, duration.years, duration.months, overflow)?;
        // Proposal comparison §3.5.6 step 10. Shared ISO day regulation in constrain mode.
        self.to_epoch_day_raw(year, i32::from(month), i32::from(original.day), overflow)?
            .checked_add(
                // Proposal comparison §3.5.6 step 11. An ISO week has seven days.
                duration
                    .weeks
                    .checked_mul(7)
                    .and_then(|v| v.checked_add(duration.days))
                    .ok_or(Error::OutOfRange)?,
            )
            .ok_or(Error::OutOfRange)
    }
    // Proposal comparison §12.3.9 step 4. Decompose the signed provider date difference into the requested units.
    fn until_raw(self, one: i64, two: i64, largest: DateUnit) -> Result<DateDuration, Error> {
        let first = self.from_epoch_day_raw(one)?;
        let last = self.from_epoch_day_raw(two)?;
        let sign = (two - one).signum();
        let mut result = DateDuration::default();
        if sign == 0 {
            return Ok(result);
        }
        let surpasses = |duration: DateDuration| -> Result<bool, Error> {
            let first_order = (i64::from(first.year) + duration.years)
                .cmp(&i64::from(last.year))
                .then_with(|| first.month_code.number.cmp(&last.month_code.number))
                .then_with(|| first.month_code.leap.cmp(&last.month_code.leap))
                .then_with(|| first.day.cmp(&last.day));
            let exceeds = |order: core::cmp::Ordering| {
                if sign > 0 {
                    order.is_gt()
                } else {
                    order.is_lt()
                }
            };
            if exceeds(first_order) {
                return Ok(true);
            }
            let (year, month) =
                self.add_year_month(first, duration.years, duration.months, Overflow::Constrain)?;
            // Proposal comparison §3.5.6 step 9. A false ISO prefix comparison ends the zero week/day case.
            Ok(exceeds(
                year.cmp(&last.year)
                    .then_with(|| month.cmp(&last.month))
                    .then_with(|| first.day.cmp(&last.day)),
            ))
        };
        let mut anchor = one;
        if largest == DateUnit::Year {
            result.years = i64::from(last.year) - i64::from(first.year);
            if surpasses(result)? {
                result.years -= sign;
            }
        }
        if matches!(largest, DateUnit::Year | DateUnit::Month) {
            let (year, month) = self.add_year_month(first, result.years, 0, Overflow::Constrain)?;
            result.months = self.months_before_year(last.year)? + i64::from(last.month)
                - self.months_before_year(year)?
                - i64::from(month);
            if surpasses(result)? {
                result.months -= sign;
            }
            anchor = self.add_raw(one, result, Overflow::Constrain)?;
        }
        // Proposal comparison §3.5.6 steps 12–13: With nonzero ISO months, the
        // first signed day past the target is one step beyond this residual.
        result.days = two - anchor;
        if largest == DateUnit::Week {
            result.weeks = result.days / 7;
            result.days %= 7;
        }
        Ok(result)
    }
}
impl NumericCalendar for Calendar {
    // Proposal comparison §12.3.26 steps 1.b, 2. Delegate ISO day projection to the arithmetic calendar.
    fn from_epoch_day_raw(self, epoch: i64) -> Result<Date, Error> {
        Calendar::from_epoch_day_raw(self, epoch)
    }
    // Proposal comparison §12.3.22 steps 1.b, 2. Delegate typed date regulation and epoch-day composition.
    fn to_epoch_day_raw(
        self,
        year: i32,
        month: i32,
        day: i32,
        overflow: Overflow,
    ) -> Result<i64, Error> {
        Calendar::to_epoch_day_raw(self, year, month, day, overflow)
    }
    // Proposal comparison §12.3.31 step 2.a. Delegate calendar month-code resolution.
    fn month_from_code(self, year: i32, code: MonthCode, overflow: Overflow) -> Result<u8, Error> {
        Calendar::month_from_code(self, year, code, overflow)
    }
    // Proposal comparison §12.3.7 step 2.a. Read the provider's serial month prefix for addition.
    fn months_before_year(self, year: i32) -> Result<i64, Error> {
        Calendar::months_before_year(self, year)
    }
    // Proposal comparison §12.3.7 step 2.a. Convert the prepared serial month back to the provider year and ordinal.
    fn year_month(self, serial: i64) -> Result<(i32, u8), Error> {
        Calendar::year_month(self, serial)
    }
}

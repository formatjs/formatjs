use crate::{Error, MAX_EPOCH_NANOSECONDS, NANOSECONDS_PER_DAY};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct IsoDateTime {
    pub year: i32,
    pub month: u8,
    pub day: u8,
    pub hour: u8,
    pub minute: u8,
    pub second: u8,
    pub nanosecond: u32,
}
impl IsoDateTime {
    // Proposal comparison §5.1.1 steps 14, 16. Check typed ISO date fields and clock bounds.
    pub(crate) fn validate(self) -> Result<(), Error> {
        // ECMA-262 preview §22.3.9.6 steps 1–3: validate month and day before the clock.
        // https://tc39.es/ecma262/pr/3966/#sec-isvalidisodate
        let leap = self.year % 4 == 0 && (self.year % 100 != 0 || self.year % 400 == 0);
        let days = match self.month {
            2 => {
                if leap {
                    29
                } else {
                    28
                }
            }
            4 | 6 | 9 | 11 => 30,
            1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
            _ => return Err(Error::InvalidDateTime),
        };
        if self.day == 0
            || self.day > days
            || self.hour > 23
            || self.minute > 59
            || self.second > 59
            || self.nanosecond >= 1_000_000_000
        {
            return Err(Error::InvalidDateTime);
        }
        Ok(())
    }
    // Proposal comparison §5.5.4 steps 2, 3, 4, 5. Encode a local datetime with exact day, clock and nanosecond arithmetic.
    pub fn to_epoch_nanoseconds(self) -> Result<i128, Error> {
        self.validate()?;
        let epoch_day = i128::from(epoch_day_from_iso(self.year, self.month, self.day));
        // ECMA-262 preview §22.1.1.17 steps 2–5: compose the epoch day and
        // clock with exact integer arithmetic, retaining all subsecond digits.
        // https://tc39.es/ecma262/pr/3966/#sec-getutcepochnanoseconds
        let value = epoch_day * NANOSECONDS_PER_DAY
            + (i128::from(self.hour) * 3600
                + i128::from(self.minute) * 60
                + i128::from(self.second))
                * 1_000_000_000
            + i128::from(self.nanosecond);
        check_local(value)?;
        Ok(value)
    }
    // Proposal comparison §11.1.2 steps 14, 15, 16. Validate a local scalar before decoding its ISO date and clock record.
    pub fn from_epoch_nanoseconds(value: i128) -> Result<Self, Error> {
        check_local(value)?;
        Ok(iso_from_epoch_nanoseconds_raw(value))
    }
}

// Calendar differences may round across public date limits.
// ECMA-262 preview §22.2.12 steps 3–15: decode the Gregorian day and clock.
// https://tc39.es/ecma262/pr/3966/#sec-getisodatetimefor
pub(crate) fn iso_from_epoch_nanoseconds_raw(value: i128) -> IsoDateTime {
    // ECMA-262 preview §22.3.10.1 steps 1–5: split the offset-adjusted scalar into its
    // balanced date and within-day clock. The day carry is already in the quotient.
    // https://tc39.es/ecma262/pr/3966/#sec-balanceisodatetime
    // §22.2.12 steps 3–4: exact day/clock division preserves subseconds.
    let days = value.div_euclid(NANOSECONDS_PER_DAY);
    let time = value.rem_euclid(NANOSECONDS_PER_DAY);
    // Steps 5–7: the Gregorian inverse gives the year, one-based month and day.
    let (year, month, day) = crate::calendar::iso_fields(days as i64);
    IsoDateTime {
        year,
        month,
        day,
        // Steps 8–10: select hours, minutes and seconds from the day remainder.
        hour: (time / 3_600_000_000_000) as u8,
        minute: (time / 60_000_000_000 % 60) as u8,
        second: (time / 1_000_000_000 % 60) as u8,
        // Steps 11–14: keep all three subsecond fields in a single remainder.
        nanosecond: (time % 1_000_000_000) as u32,
    }
}

// ECMA-262 preview §22.3.5.3: use the calendar's epoch-day arithmetic for prepared ISO fields.
// https://tc39.es/ecma262/pr/3966/#sec-isodatetoepochdays
pub(crate) fn epoch_day_from_iso(year: i32, month: u8, day: u8) -> i64 {
    crate::calendar::iso_day(year, month, day)
}

// ECMA-262 preview §22.3.10.4 steps 3–4: enforce exclusive local epoch bounds.
// https://tc39.es/ecma262/pr/3966/#sec-isodatetimewithinlimits
pub(crate) fn check_local(value: i128) -> Result<(), Error> {
    // Step 1 needs to allow the first partial day. Keep the epoch interval.
    // https://github.com/tc39/ecma262/pull/3966#discussion_r4283470645
    let bound = MAX_EPOCH_NANOSECONDS + NANOSECONDS_PER_DAY;
    if value <= -bound || value >= bound {
        return Err(Error::OutOfRange);
    }
    Ok(())
}

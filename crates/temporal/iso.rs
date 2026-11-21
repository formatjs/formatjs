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
    pub fn to_epoch_nanoseconds(self) -> Result<i128, Error> {
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
        let epoch_day = i128::from(epoch_day_from_iso(self.year, self.month, self.day));
        let value = epoch_day * NANOSECONDS_PER_DAY
            + (i128::from(self.hour) * 3600
                + i128::from(self.minute) * 60
                + i128::from(self.second))
                * 1_000_000_000
            + i128::from(self.nanosecond);
        check_local(value)?;
        Ok(value)
    }
    pub fn from_epoch_nanoseconds(value: i128) -> Result<Self, Error> {
        check_local(value)?;
        Ok(iso_from_epoch_nanoseconds_raw(value))
    }
}

// Calendar differences may round across public date limits.
// https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L62-L70
// Line tags below refer to this pinned timezone.html.
pub(crate) fn iso_from_epoch_nanoseconds_raw(value: i128) -> IsoDateTime {
    // L62: valid Instant inputs satisfy this raw converter's supported domain.
    // L64: exact day/clock division replaces the integral-millisecond intermediate.
    let days = value.div_euclid(NANOSECONDS_PER_DAY);
    // L63: the nonnegative day remainder retains the modulo-10**6 remainder too.
    let time = value.rem_euclid(NANOSECONDS_PER_DAY);
    // L65: the inverse Gregorian cycle conversion yields the epoch year.
    // L66: its month is already one-based.
    // L67: its day is the Gregorian day of month.
    let (year, month, day) = crate::calendar::iso_fields(days as i64);
    IsoDateTime {
        year,
        month,
        day,
        // L68: select the hour within the nonnegative day remainder.
        hour: (time / 3_600_000_000_000) as u8,
        // L69: discard complete hours when selecting the minute.
        minute: (time / 60_000_000_000 % 60) as u8,
        // L70: discard complete minutes when selecting the second.
        second: (time / 1_000_000_000 % 60) as u8,
        nanosecond: (time % 1_000_000_000) as u32,
    }
}

pub(crate) fn epoch_day_from_iso(year: i32, month: u8, day: u8) -> i64 {
    crate::calendar::iso_day(year, month, day)
}

pub(crate) fn check_local(value: i128) -> Result<(), Error> {
    let bound = MAX_EPOCH_NANOSECONDS + NANOSECONDS_PER_DAY;
    if value <= -bound || value >= bound {
        return Err(Error::OutOfRange);
    }
    Ok(())
}

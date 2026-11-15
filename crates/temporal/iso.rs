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
        let days = value.div_euclid(NANOSECONDS_PER_DAY);
        let time = value.rem_euclid(NANOSECONDS_PER_DAY);
        let shifted = days + 719_468;
        let era = shifted.div_euclid(146_097);
        let day_of_era = shifted.rem_euclid(146_097);
        let year_of_era =
            (day_of_era - day_of_era / 1460 + day_of_era / 36524 - day_of_era / 146096) / 365;
        let day_of_year = day_of_era - (365 * year_of_era + year_of_era / 4 - year_of_era / 100);
        let march_month = (5 * day_of_year + 2) / 153;
        let day = day_of_year - (153 * march_month + 2) / 5 + 1;
        let month = march_month + if march_month < 10 { 3 } else { -9 };
        Ok(Self {
            year: (year_of_era + era * 400 + i128::from(month <= 2)) as i32,
            month: month as u8,
            day: day as u8,
            hour: (time / 3_600_000_000_000) as u8,
            minute: (time / 60_000_000_000 % 60) as u8,
            second: (time / 1_000_000_000 % 60) as u8,
            nanosecond: (time % 1_000_000_000) as u32,
        })
    }
}
pub(crate) fn epoch_day_from_iso(year: i32, month: u8, day: u8) -> i64 {
    let year = i128::from(year) - i128::from(month <= 2);
    let era = year.div_euclid(400);
    let year_of_era = year.rem_euclid(400);
    let month = i128::from(month) + if month > 2 { -3 } else { 9 };
    (era * 146_097 + year_of_era * 365 + year_of_era / 4 - year_of_era / 100
        + (153 * month + 2) / 5
        + i128::from(day)
        - 1
        - 719_468) as i64
}
fn check_local(value: i128) -> Result<(), Error> {
    let bound = MAX_EPOCH_NANOSECONDS + NANOSECONDS_PER_DAY;
    if value <= -bound || value >= bound {
        return Err(Error::OutOfRange);
    }
    Ok(())
}

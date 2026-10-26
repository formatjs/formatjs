use crate::Error;

pub const TIME_CLIP_BOUND: i64 = 8_640_000_000_000_000;
const NANOSECONDS_PER_SECOND: i128 = 1_000_000_000;
const NANOSECONDS_PER_DAY: i128 = 86_400 * NANOSECONDS_PER_SECOND;

pub fn time_clip(value: f64) -> Result<i64, Error> {
    if !value.is_finite() || value.abs() > TIME_CLIP_BOUND as f64 {
        return Err(Error::InvalidDate);
    }
    Ok(value.trunc() as i64)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CivilDateTime {
    pub year: i32,
    pub month: u8,
    pub day: u8,
    pub weekday: u8,
    pub hour: u8,
    pub minute: u8,
    pub second: u8,
    pub nanosecond: u32,
}
impl CivilDateTime {
    pub fn from_epoch_nanoseconds(value: i128) -> Result<Self, Error> {
        // YearMonth reference dates may reach month edges beyond numeric TimeClip.
        let bound = i128::from(TIME_CLIP_BOUND) * 1_000_000 + 31 * NANOSECONDS_PER_DAY;
        if value < -bound || value > bound {
            return Err(Error::InvalidDate);
        }
        let days = value.div_euclid(NANOSECONDS_PER_DAY);
        let time = value.rem_euclid(NANOSECONDS_PER_DAY);
        let shifted = days + 719_468;
        let era = shifted.div_euclid(146_097);
        let day_of_era = shifted.rem_euclid(146_097);
        let year_of_era =
            (day_of_era - day_of_era / 1_460 + day_of_era / 36_524 - day_of_era / 146_096) / 365;
        let day_of_year = day_of_era - (365 * year_of_era + year_of_era / 4 - year_of_era / 100);
        let march_month = (5 * day_of_year + 2) / 153;
        let day = day_of_year - (153 * march_month + 2) / 5 + 1;
        let month = march_month + if march_month < 10 { 3 } else { -9 };
        let year = year_of_era + era * 400 + i128::from(month <= 2);
        Ok(Self {
            year: year as i32,
            month: month as u8,
            day: day as u8,
            weekday: (days + 4).rem_euclid(7) as u8,
            hour: (time / (3_600 * NANOSECONDS_PER_SECOND)) as u8,
            minute: (time / (60 * NANOSECONDS_PER_SECOND) % 60) as u8,
            second: (time / NANOSECONDS_PER_SECOND % 60) as u8,
            nanosecond: (time % NANOSECONDS_PER_SECOND) as u32,
        })
    }

    pub fn era_year(self) -> (&'static str, u32) {
        if self.year > 0 {
            ("AD", self.year as u32)
        } else {
            ("BC", (1 - self.year) as u32)
        }
    }
}

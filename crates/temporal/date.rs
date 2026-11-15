use crate::{
    Duration, Error, IsoDateTime, NANOSECONDS_PER_DAY, PlainTime, Precision, RoundingMode, TimeUnit,
};
use core::{fmt, str::FromStr};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Overflow {
    Constrain,
    Reject,
}
#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct PlainDate(i64);
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
        Ok(Self(value))
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
        use crate::calendar::{Calendar, DateDuration};
        let duration = DateDuration {
            years: years.try_into().map_err(|_| Error::OutOfRange)?,
            months: months.try_into().map_err(|_| Error::OutOfRange)?,
            days: days.try_into().map_err(|_| Error::OutOfRange)?,
            ..DateDuration::default()
        };
        let overflow = match overflow {
            Overflow::Constrain => crate::calendar::Overflow::Constrain,
            Overflow::Reject => crate::calendar::Overflow::Reject,
        };
        let day =
            Calendar::Iso8601
                .add(self.0, duration, overflow)
                .map_err(|error| match error {
                    crate::calendar::Error::InvalidDate => Error::InvalidDateTime,
                    _ => Error::OutOfRange,
                })?;
        Self::from_epoch_day(day)
    }

    pub fn to_date_time(self, time: PlainTime) -> Result<PlainDateTime, Error> {
        PlainDateTime::from_epoch_nanoseconds(
            i128::from(self.0) * NANOSECONDS_PER_DAY + time.nanoseconds(),
        )
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
        Self::new(fields.year, fields.month, fields.day)
    }
}
impl fmt::Display for PlainDate {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let (year, month, day) = self.fields();
        if (0..=9999).contains(&year) {
            write!(f, "{year:04}")?;
        } else {
            write!(f, "{year:+07}")?;
        }
        write!(f, "-{month:02}-{day:02}")
    }
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct PlainDateTime(i128);
impl PlainDateTime {
    pub fn new(fields: IsoDateTime) -> Result<Self, Error> {
        Self::from_epoch_nanoseconds(fields.to_epoch_nanoseconds()?)
    }
    pub fn from_epoch_nanoseconds(value: i128) -> Result<Self, Error> {
        IsoDateTime::from_epoch_nanoseconds(value)?;
        Ok(Self(value))
    }
    pub const fn epoch_nanoseconds(self) -> i128 {
        self.0
    }
    pub fn fields(self) -> IsoDateTime {
        IsoDateTime::from_epoch_nanoseconds(self.0).unwrap()
    }
    pub fn date(self) -> PlainDate {
        PlainDate(self.0.div_euclid(NANOSECONDS_PER_DAY) as i64)
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
        Self::from_epoch_nanoseconds(i128::from(self.date().0) * NANOSECONDS_PER_DAY + rounded)
    }
    pub fn round_day(self, mode: RoundingMode) -> Result<Self, Error> {
        let rounded =
            crate::rounding::round_instant(self.time().nanoseconds(), NANOSECONDS_PER_DAY, mode);
        Self::from_epoch_nanoseconds(i128::from(self.date().0) * NANOSECONDS_PER_DAY + rounded)
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
    ) -> Result<FormattedDateTime, Error> {
        let quantum = match precision {
            Precision::Auto => 1,
            Precision::Minute => 60_000_000_000,
            Precision::Digits(n) if n <= 9 => 10i128.pow(u32::from(9 - n)),
            _ => return Err(Error::InvalidRoundingOptions),
        };
        let value = i128::from(self.date().0) * NANOSECONDS_PER_DAY
            + crate::rounding::round_instant(self.time().nanoseconds(), quantum, mode);
        Ok(FormattedDateTime {
            value: Self::from_epoch_nanoseconds(value)?,
            precision,
        })
    }
}
impl FromStr for PlainDateTime {
    type Err = Error;
    fn from_str(value: &str) -> Result<Self, Error> {
        Self::new(crate::parse::plain_date_time_fields(value)?)
    }
}
impl fmt::Display for PlainDateTime {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        self.format(Precision::Auto, RoundingMode::Trunc)
            .map_err(|_| fmt::Error)?
            .fmt(f)
    }
}
pub struct FormattedDateTime {
    value: PlainDateTime,
    precision: Precision,
}
impl fmt::Display for FormattedDateTime {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "{}T{}",
            self.value.date(),
            self.value
                .time()
                .format(self.precision, RoundingMode::Trunc)
                .map_err(|_| fmt::Error)?
        )
    }
}

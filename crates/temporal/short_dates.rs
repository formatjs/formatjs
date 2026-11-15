use crate::date::month_length;
use crate::iso::epoch_day_from_iso;
use crate::{Duration, Error, Overflow, PlainDate, RoundingMode};
use core::{fmt, str::FromStr};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum YearMonthUnit {
    Year,
    Month,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct PlainYearMonth {
    year: i32,
    month: u8,
    reference_day: u8,
}
impl PlainYearMonth {
    pub fn new(year: i32, month: u8, reference_day: u8) -> Result<Self, Error> {
        if !(1..=12).contains(&month)
            || reference_day == 0
            || reference_day > month_length(year, month)
        {
            return Err(Error::InvalidDateTime);
        }
        if !(-271821..=275760).contains(&year)
            || (year == -271821 && month < 4)
            || (year == 275760 && month > 9)
        {
            return Err(Error::OutOfRange);
        }
        Ok(Self {
            year,
            month,
            reference_day,
        })
    }
    pub const fn fields(self) -> (i32, u8, u8) {
        (self.year, self.month, self.reference_day)
    }
    pub fn days_in_month(self) -> u8 {
        month_length(self.year, self.month)
    }
    pub fn days_in_year(self) -> u16 {
        (epoch_day_from_iso(self.year + 1, 1, 1) - epoch_day_from_iso(self.year, 1, 1)) as u16
    }
    pub fn to_plain_date(self, day: u8, overflow: Overflow) -> Result<PlainDate, Error> {
        if day == 0 || (day > self.days_in_month() && overflow == Overflow::Reject) {
            return Err(Error::InvalidDateTime);
        }
        PlainDate::new(self.year, self.month, day.min(self.days_in_month()))
    }
    pub fn checked_add(self, duration: Duration, overflow: Overflow) -> Result<Self, Error> {
        let fields = duration.fields();
        if fields[2..].iter().any(|value| *value != 0) {
            return Err(Error::InvalidDuration);
        }
        self.to_plain_date(1, overflow)?;
        Self::from_serial(self.serial() + fields[0] * 12 + fields[1])
    }
    pub fn checked_subtract(self, duration: Duration, overflow: Overflow) -> Result<Self, Error> {
        self.checked_add(duration.negated(), overflow)
    }
    fn serial(self) -> i128 {
        i128::from(self.year) * 12 + i128::from(self.month) - 1
    }
    fn from_serial(value: i128) -> Result<Self, Error> {
        Self::new(
            value
                .div_euclid(12)
                .try_into()
                .map_err(|_| Error::OutOfRange)?,
            (value.rem_euclid(12) + 1) as u8,
            1,
        )
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
        if increment == 0
            || increment > 1_000_000_000
            || (largest == YearMonthUnit::Month && smallest == YearMonthUnit::Year)
        {
            return Err(Error::InvalidRoundingOptions);
        }
        if self == other {
            return Duration::new([0; 10]);
        }
        self.to_plain_date(1, Overflow::Constrain)?;
        other.to_plain_date(1, Overflow::Constrain)?;
        let delta = other.serial() - self.serial();
        let sign = if delta < 0 { -1 } else { 1 };
        let since_sign = if since { -1 } else { 1 };
        let quantum = i128::from(increment)
            * if smallest == YearMonthUnit::Year {
                12
            } else {
                1
            };
        let rounded = if smallest == YearMonthUnit::Month && increment == 1 {
            delta
        } else {
            let count = delta / quantum;
            let a = count * quantum;
            let low = Self::from_serial(self.serial() + a)?;
            let high = Self::from_serial(self.serial() + a + sign * quantum)?;
            let low_day = i128::from(epoch_day_from_iso(low.year, low.month, 1));
            let high_day = i128::from(epoch_day_from_iso(high.year, high.month, 1));
            low.to_plain_date(1, Overflow::Constrain)?;
            high.to_plain_date(1, Overflow::Constrain)?;
            let target = i128::from(epoch_day_from_iso(other.year, other.month, 1));
            let span = (high_day - low_day) * sign;
            let distance = (target - low_day) * sign;
            let value = (count * span + sign * distance) * since_sign;
            let expand =
                crate::rounding::round_duration(value, span, mode) != count * span * since_sign;
            a + if expand { sign * quantum } else { 0 }
        } * since_sign;
        let mut fields = [0; 10];
        if largest == YearMonthUnit::Year {
            fields[0] = rounded / 12;
            fields[1] = rounded % 12;
        } else {
            fields[1] = rounded;
        }
        Duration::new(fields)
    }
}
impl FromStr for PlainYearMonth {
    type Err = Error;
    fn from_str(value: &str) -> Result<Self, Error> {
        let fields = crate::parse::short_date_fields(value, true)?;
        Self::new(fields.year, fields.month, 1)
    }
}
impl fmt::Display for PlainYearMonth {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write_year(f, self.year)?;
        write!(f, "-{:02}", self.month)
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct PlainMonthDay {
    month: u8,
    day: u8,
    reference_year: i32,
}
impl PlainMonthDay {
    pub fn new(month: u8, day: u8, reference_year: i32) -> Result<Self, Error> {
        PlainDate::new(reference_year, month, day)?;
        Ok(Self {
            month,
            day,
            reference_year,
        })
    }
    pub const fn fields(self) -> (u8, u8, i32) {
        (self.month, self.day, self.reference_year)
    }
    pub fn to_plain_date(self, year: i32, overflow: Overflow) -> Result<PlainDate, Error> {
        let maximum = month_length(year, self.month);
        if self.day > maximum && overflow == Overflow::Reject {
            return Err(Error::InvalidDateTime);
        }
        PlainDate::new(year, self.month, self.day.min(maximum))
    }
}
impl FromStr for PlainMonthDay {
    type Err = Error;
    fn from_str(value: &str) -> Result<Self, Error> {
        let fields = crate::parse::short_date_fields(value, false)?;
        Self::new(fields.month, fields.day, 1972)
    }
}
impl fmt::Display for PlainMonthDay {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:02}-{:02}", self.month, self.day)
    }
}
fn write_year(f: &mut fmt::Formatter<'_>, year: i32) -> fmt::Result {
    if (0..=9999).contains(&year) {
        write!(f, "{year:04}")
    } else {
        write!(f, "{year:+07}")
    }
}

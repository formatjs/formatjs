use crate::rounding::{round_duration, round_instant};
use crate::{Duration, Error, NANOSECONDS_PER_DAY, Precision, RoundingMode, TimeUnit};
use core::{fmt, str::FromStr};

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct PlainTime(i128);
impl PlainTime {
    pub fn new(hour: u8, minute: u8, second: u8, nanosecond: u32) -> Result<Self, Error> {
        if hour > 23 || minute > 59 || second > 59 || nanosecond >= 1_000_000_000 {
            return Err(Error::InvalidDateTime);
        }
        Ok(Self(
            (i128::from(hour) * 3600 + i128::from(minute) * 60 + i128::from(second))
                * 1_000_000_000
                + i128::from(nanosecond),
        ))
    }
    pub fn from_nanoseconds(value: i128) -> Result<Self, Error> {
        if !(0..NANOSECONDS_PER_DAY).contains(&value) {
            return Err(Error::InvalidDateTime);
        }
        Ok(Self(value))
    }
    pub const fn nanoseconds(self) -> i128 {
        self.0
    }
    pub fn fields(self) -> (u8, u8, u8, u32) {
        (
            (self.0 / 3_600_000_000_000) as u8,
            (self.0 / 60_000_000_000 % 60) as u8,
            (self.0 / 1_000_000_000 % 60) as u8,
            (self.0 % 1_000_000_000) as u32,
        )
    }
    pub fn checked_add(self, duration: Duration) -> Result<Self, Error> {
        Ok(Self(
            (self.0 + duration.time_nanoseconds(false)?).rem_euclid(NANOSECONDS_PER_DAY),
        ))
    }
    pub fn checked_subtract(self, duration: Duration) -> Result<Self, Error> {
        self.checked_add(duration.negated())
    }
    pub fn round(self, unit: TimeUnit, increment: u32, mode: RoundingMode) -> Result<Self, Error> {
        validate_increment(unit, increment)?;
        let parent = match unit {
            TimeUnit::Hour => NANOSECONDS_PER_DAY,
            TimeUnit::Minute => TimeUnit::Hour.nanoseconds(),
            TimeUnit::Second => TimeUnit::Minute.nanoseconds(),
            TimeUnit::Millisecond => TimeUnit::Second.nanoseconds(),
            TimeUnit::Microsecond => TimeUnit::Millisecond.nanoseconds(),
            TimeUnit::Nanosecond => TimeUnit::Microsecond.nanoseconds(),
        };
        let base = self.0 / parent * parent;
        Ok(Self(
            (base
                + round_instant(
                    self.0 - base,
                    unit.nanoseconds() * i128::from(increment),
                    mode,
                ))
            .rem_euclid(NANOSECONDS_PER_DAY),
        ))
    }
    pub fn until(
        self,
        other: Self,
        largest: TimeUnit,
        smallest: TimeUnit,
        increment: u32,
        mode: RoundingMode,
    ) -> Result<Duration, Error> {
        validate_increment(smallest, increment)?;
        if largest.nanoseconds() < smallest.nanoseconds() {
            return Err(Error::InvalidRoundingOptions);
        }
        Duration::from_time_nanoseconds(
            round_duration(
                other.0 - self.0,
                smallest.nanoseconds() * i128::from(increment),
                mode,
            ),
            largest,
        )
    }
    pub fn since(
        self,
        other: Self,
        largest: TimeUnit,
        smallest: TimeUnit,
        increment: u32,
        mode: RoundingMode,
    ) -> Result<Duration, Error> {
        other.until(self, largest, smallest, increment, mode)
    }
    pub fn format(self, precision: Precision, mode: RoundingMode) -> Result<FormattedTime, Error> {
        let quantum = match precision {
            Precision::Auto => 1,
            Precision::Minute => 60_000_000_000,
            Precision::Digits(digits) if digits <= 9 => 10i128.pow(u32::from(9 - digits)),
            _ => return Err(Error::InvalidRoundingOptions),
        };
        Ok(FormattedTime {
            time: Self(round_instant(self.0, quantum, mode).rem_euclid(NANOSECONDS_PER_DAY)),
            precision,
        })
    }
}
fn validate_increment(unit: TimeUnit, increment: u32) -> Result<(), Error> {
    let maximum = match unit {
        TimeUnit::Hour => 24,
        TimeUnit::Minute | TimeUnit::Second => 60,
        _ => 1000,
    };
    if increment == 0 || increment >= maximum || maximum % increment != 0 {
        return Err(Error::InvalidRoundingOptions);
    }
    Ok(())
}
impl FromStr for PlainTime {
    type Err = Error;
    fn from_str(value: &str) -> Result<Self, Error> {
        crate::parse::plain_time(value)
    }
}
pub struct FormattedTime {
    time: PlainTime,
    precision: Precision,
}
impl fmt::Display for PlainTime {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        self.format(Precision::Auto, RoundingMode::Trunc)
            .map_err(|_| fmt::Error)?
            .fmt(f)
    }
}
impl fmt::Display for FormattedTime {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let (hour, minute, second, fraction) = self.time.fields();
        write!(f, "{hour:02}:{minute:02}")?;
        if self.precision != Precision::Minute {
            write!(f, ":{second:02}")?;
            let (mut value, mut digits) = (fraction, 9usize);
            match self.precision {
                Precision::Auto => {
                    while digits > 0 && value % 10 == 0 {
                        value /= 10;
                        digits -= 1;
                    }
                }
                Precision::Digits(count) => {
                    digits = usize::from(count);
                    value /= 10u32.pow(u32::from(9 - count));
                }
                _ => unreachable!(),
            }
            if digits > 0 {
                write!(f, ".{value:0digits$}")?;
            }
        }
        Ok(())
    }
}

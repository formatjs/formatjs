use crate::{Error, Instant, NANOSECONDS_PER_DAY};
use core::str::FromStr;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum TimeUnit {
    Hour,
    Minute,
    Second,
    Millisecond,
    Microsecond,
    Nanosecond,
}
impl TimeUnit {
    pub const fn nanoseconds(self) -> i128 {
        match self {
            Self::Hour => 3_600_000_000_000,
            Self::Minute => 60_000_000_000,
            Self::Second => 1_000_000_000,
            Self::Millisecond => 1_000_000,
            Self::Microsecond => 1000,
            Self::Nanosecond => 1,
        }
    }
}
impl FromStr for TimeUnit {
    type Err = Error;
    fn from_str(value: &str) -> Result<Self, Error> {
        match value.strip_suffix('s').unwrap_or(value) {
            "hour" => Ok(Self::Hour),
            "minute" => Ok(Self::Minute),
            "second" => Ok(Self::Second),
            "millisecond" => Ok(Self::Millisecond),
            "microsecond" => Ok(Self::Microsecond),
            "nanosecond" => Ok(Self::Nanosecond),
            _ => Err(Error::InvalidRoundingOptions),
        }
    }
}
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum RoundingMode {
    Ceil,
    Floor,
    Expand,
    Trunc,
    HalfCeil,
    HalfFloor,
    HalfExpand,
    HalfTrunc,
    HalfEven,
}
impl FromStr for RoundingMode {
    type Err = Error;
    fn from_str(value: &str) -> Result<Self, Error> {
        match value {
            "ceil" => Ok(Self::Ceil),
            "floor" => Ok(Self::Floor),
            "expand" => Ok(Self::Expand),
            "trunc" => Ok(Self::Trunc),
            "halfCeil" => Ok(Self::HalfCeil),
            "halfFloor" => Ok(Self::HalfFloor),
            "halfExpand" => Ok(Self::HalfExpand),
            "halfTrunc" => Ok(Self::HalfTrunc),
            "halfEven" => Ok(Self::HalfEven),
            _ => Err(Error::InvalidRoundingOptions),
        }
    }
}
pub(crate) fn round_instant(value: i128, quantum: i128, mode: RoundingMode) -> i128 {
    let lower = value.div_euclid(quantum);
    let remainder = value.rem_euclid(quantum);
    if remainder == 0 {
        return value;
    }
    let up = match mode {
        RoundingMode::Ceil | RoundingMode::Expand => true,
        RoundingMode::Floor | RoundingMode::Trunc => false,
        _ if 2 * remainder != quantum => 2 * remainder > quantum,
        RoundingMode::HalfCeil | RoundingMode::HalfExpand => true,
        RoundingMode::HalfEven => lower % 2 != 0,
        _ => false,
    };
    (lower + i128::from(up)) * quantum
}
impl Instant {
    pub fn round(self, unit: TimeUnit, increment: u32, mode: RoundingMode) -> Result<Self, Error> {
        let maximum = NANOSECONDS_PER_DAY / unit.nanoseconds();
        if increment == 0
            || increment > 1_000_000_000
            || i128::from(increment) > maximum
            || maximum % i128::from(increment) != 0
        {
            return Err(Error::InvalidRoundingOptions);
        }
        Self::from_epoch_nanoseconds(round_instant(
            self.epoch_nanoseconds(),
            i128::from(increment) * unit.nanoseconds(),
            mode,
        ))
    }
}

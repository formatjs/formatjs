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
// Exact integer counterpart of the TypeScript rounding core.
// https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L932-L947
// https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L996-L1001
// Spec line tags below refer to this pinned abstractops.html.
pub(crate) fn round_instant(value: i128, quantum: i128, mode: RoundingMode) -> i128 {
    // L932: integer input with unit quantum is already an exact multiple.
    if quantum == 1 {
        return value;
    }
    // L996: preserve the quotient with exact quotient/remainder arithmetic.
    // L998: Euclidean division floors negative epoch quotients too.
    let (lower, remainder) = if value >= i128::from(i64::MIN)
        && value <= i128::from(i64::MAX)
        && quantum > 1
        && quantum <= i128::from(i64::MAX)
    {
        let value = value as i64;
        let quantum = quantum as i64;
        (
            i128::from(value.div_euclid(quantum)),
            i128::from(value.rem_euclid(quantum)),
        )
    } else {
        (value.div_euclid(quantum), value.rem_euclid(quantum))
    };
    // L932: exact multiples already equal the lower neighbor.
    if remainder == 0 {
        return value;
    }
    // L933: positive quantum and nonzero remainder strictly bracket the quotient.
    // L934: the typed enum cannot be undefined.
    // L997: exact-time rounding always selects the positive-sign table column.
    // L819: this match encodes all nine entries of that column.
    let up = match mode {
        // L936: infinity selects the upper neighbor.
        RoundingMode::Ceil | RoundingMode::Expand => true,
        // L935: zero selects the lower neighbor.
        RoundingMode::Floor | RoundingMode::Trunc => false,
        // L937: lower distance is remainder / quantum.
        // L938: upper distance is (quantum - remainder) / quantum.
        // L939: twice the remainder below quantum selects the lower neighbor.
        // L940: twice the remainder above quantum selects the upper neighbor.
        _ if 2 * remainder != quantum => 2 * remainder > quantum,
        // L941: the remaining case has equal distances.
        // L943: halfCeil and halfExpand select the upper neighbor.
        RoundingMode::HalfCeil | RoundingMode::HalfExpand => true,
        // L944: the only other explicit tie mode is halfEven.
        // L945: adjacent quotient neighbors differ by one; use lower modulo 2.
        // L946: an even lower neighbor stays selected.
        // L947: an odd lower neighbor selects its even successor.
        RoundingMode::HalfEven => lower % 2 != 0,
        // L942: halfFloor and halfTrunc keep the lower neighbor.
        _ => false,
    };
    // L999: the upper quotient neighbor is lower + 1.
    // L1000: up selects ApplyUnsignedRoundingMode's integer result.
    // L1001: multiply that quotient by the original increment.
    (lower + i128::from(up)) * quantum
}
impl Instant {
    pub fn round(self, unit: TimeUnit, increment: u32, mode: RoundingMode) -> Result<Self, Error> {
        // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L430-L437
        // L430-L431, L435-L437: inclusive day divisor after the separate 1e9 cap.
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

// https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L964-L975
// https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L300-L304
pub(crate) fn round_duration(value: i128, quantum: i128, mode: RoundingMode) -> i128 {
    // L964: quotient sign matches value because quantum is positive.
    // L965: test sign before division; exact arithmetic makes this equivalent.
    // L968: handle the nonnegative branch first.
    // L969: its unsigned-mode column is positive.
    if value >= 0 {
        return round_instant(value, quantum, mode);
    }
    // L966: this branch implicitly carries the negative sign.
    // L970: negating directional modes gives the negative-sign table column.
    let reversed = match mode {
        // L300: reverse this directional mode.
        RoundingMode::Ceil => RoundingMode::Floor,
        // L301: reverse this directional mode.
        RoundingMode::Floor => RoundingMode::Ceil,
        // L302: reverse this directional mode.
        RoundingMode::HalfCeil => RoundingMode::HalfFloor,
        // L303: reverse this directional mode.
        RoundingMode::HalfFloor => RoundingMode::HalfCeil,
        // L304: nondirectional modes keep their identity.
        other => other,
    };
    // L967: the inner value is the absolute numerator.
    // L971: the shared core computes its lower quotient neighbor exactly.
    // L972: its upper neighbor is one greater.
    // L973: the shared core applies the selected unsigned rounding mode.
    // L974: restore the original negative sign.
    // L975: multiplication inside the core commutes with sign restoration.
    -round_instant(-value, quantum, reversed)
}

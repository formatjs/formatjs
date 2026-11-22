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
    // Proposal comparison §8.5.7 step1 / table21: typed unit length.
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
    // Proposal comparison §13.17 step9 / §13.18 steps3/5/6: normal time units.
    // Typed parser only; callers own property reads, defaults and auto.
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
    // Proposal comparison §14.5.2.2 steps1/3/4 / table28: string-to-enum kernel.
    // Callers own ECMAScript coercion, option reads and fallback.
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
// https://tc39.es/proposal-temporal/#sec-applyunsignedroundingmode
// https://tc39.es/proposal-temporal/#sec-temporal-roundnumbertoincrementasifpositive
// Proposal comparison §§13.27–13.28 / §13.30: positive-sign exact rounding.
// Callers supply positive bounded quantum and values within their arithmetic domain.
pub(crate) fn round_instant(value: i128, quantum: i128, mode: RoundingMode) -> i128 {
    // §13.28 step1: integer input with unit quantum is already an exact multiple.
    if quantum == 1 {
        return value;
    }
    // §13.30 step1: preserve the quotient with exact quotient/remainder arithmetic.
    // §13.30 step3: Euclidean division floors negative epoch quotients too.
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
    // §13.28 step1: exact multiples already equal the lower neighbor.
    if remainder == 0 {
        return value;
    }
    // §13.28 step2: positive quantum and nonzero remainder strictly bracket the quotient.
    // §13.28 step3: the typed enum cannot be undefined.
    // §13.30 step2: exact-time rounding always selects the positive-sign table column.
    // §13.27 table22: this match encodes all nine entries of that column.
    let up = match mode {
        // §13.28 step5: infinity selects the upper neighbor.
        RoundingMode::Ceil | RoundingMode::Expand => true,
        // §13.28 step4: zero selects the lower neighbor.
        RoundingMode::Floor | RoundingMode::Trunc => false,
        // §13.28 step6: lower distance is remainder / quantum.
        // §13.28 step7: upper distance is (quantum - remainder) / quantum.
        // §13.28 step8: twice the remainder below quantum selects the lower neighbor.
        // §13.28 step9: twice the remainder above quantum selects the upper neighbor.
        _ if 2 * remainder != quantum => 2 * remainder > quantum,
        // §13.28 step10: the remaining case has equal distances.
        // §13.28 step12: halfCeil and halfExpand select the upper neighbor.
        RoundingMode::HalfCeil | RoundingMode::HalfExpand => true,
        // §13.28 step13: the only other explicit tie mode is halfEven.
        // §13.28 step14: adjacent quotient neighbors differ by one; use lower modulo 2.
        // §13.28 step15: an even lower neighbor stays selected.
        // §13.28 step16: an odd lower neighbor selects its even successor.
        RoundingMode::HalfEven => lower % 2 != 0,
        // §13.28 step11: halfFloor and halfTrunc keep the lower neighbor.
        _ => false,
    };
    // §13.30 step4: the upper quotient neighbor is lower + 1.
    // §13.30 step5: up selects ApplyUnsignedRoundingMode's integer result.
    // §13.30 step6: multiply that quotient by the original increment.
    (lower + i128::from(up)) * quantum
}
impl Instant {
    // Proposal comparison §8.5.7 steps1–3: quantum construction and core dispatch.
    // Typed Instant/unit/mode inputs already passed public conversion and branding.
    pub fn round(self, unit: TimeUnit, increment: u32, mode: RoundingMode) -> Result<Self, Error> {
        // https://tc39.es/proposal-temporal/#sec-validatetemporalroundingincrement
        // Proposal comparison §13.14 steps1.a/3–5: inclusive day divisor.
        // §14.5.2.3 step4: retain the separate 1e9 increment cap.
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

// https://tc39.es/proposal-temporal/#sec-temporal-roundnumbertoincrement
// https://tc39.es/proposal-temporal/#sec-temporal-negateroundingmode
// Proposal comparison §13.29 steps1–9 / §13.8 steps1–5: signed integer kernel.
// Callers supply positive bounded quantum and safely negatable values.
pub(crate) fn round_duration(value: i128, quantum: i128, mode: RoundingMode) -> i128 {
    // §13.29 step1: quotient sign matches value because quantum is positive.
    // §13.29 step2: test sign before division; exact arithmetic makes this equivalent.
    // §13.29 step3: handle the nonnegative branch first.
    // §13.29 step3.a: its unsigned-mode column is positive.
    if value >= 0 {
        return round_instant(value, quantum, mode);
    }
    // §13.29 step2.a: this branch implicitly carries the negative sign.
    // §13.29 step4: negating directional modes gives the negative-sign table column.
    let reversed = match mode {
        // §13.8 step1: reverse this directional mode.
        RoundingMode::Ceil => RoundingMode::Floor,
        // §13.8 step2: reverse this directional mode.
        RoundingMode::Floor => RoundingMode::Ceil,
        // §13.8 step3: reverse this directional mode.
        RoundingMode::HalfCeil => RoundingMode::HalfFloor,
        // §13.8 step4: reverse this directional mode.
        RoundingMode::HalfFloor => RoundingMode::HalfCeil,
        // §13.8 step5: nondirectional modes keep their identity.
        other => other,
    };
    // §13.29 step2.b: the inner value is the absolute numerator.
    // §13.29 step5: the shared core computes its lower quotient neighbor exactly.
    // §13.29 step6: its upper neighbor is one greater.
    // §13.29 step7: the shared core applies the selected unsigned rounding mode.
    // §13.29 step8: restore the original negative sign.
    // §13.29 step9: multiplication inside the core commutes with sign restoration.
    -round_instant(-value, quantum, reversed)
}

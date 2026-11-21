use crate::rounding::{round_duration, round_instant};
use crate::{Duration, Error, NANOSECONDS_PER_DAY, Overflow, Precision, RoundingMode, TimeUnit};
use core::{fmt, str::FromStr};

// https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L833-L845
// L833: a greater hour dominates every lower clock field.
// L834: a lesser hour dominates every lower clock field.
// L835: with equal hours, a greater minute gives greater nanoseconds.
// L836: with equal hours, a lesser minute gives lesser nanoseconds.
// L837: with equal hours/minutes, a greater second gives greater nanoseconds.
// L838: with equal hours/minutes, a lesser second gives lesser nanoseconds.
// L839: with equal higher fields, greater milliseconds give greater nanoseconds.
// L840: with equal higher fields, lesser milliseconds give lesser nanoseconds.
// L841: with equal higher fields, greater microseconds give greater nanoseconds.
// L842: with equal higher fields, lesser microseconds give lesser nanoseconds.
// L843: with equal higher fields, greater nanoseconds compare greater.
// L844: with equal higher fields, lesser nanoseconds compare lesser.
// L845: equal clock totals identify all six normalized clock fields.
#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct PlainTime(i128);

/// Supplied clock fields; omitted fields retain their original values.
#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct TimeFields {
    pub hour: Option<i128>,
    pub minute: Option<i128>,
    pub second: Option<i128>,
    pub millisecond: Option<i128>,
    pub microsecond: Option<i128>,
    pub nanosecond: Option<i128>,
}

impl TimeFields {
    pub(crate) fn is_empty(self) -> bool {
        [
            self.hour,
            self.minute,
            self.second,
            self.millisecond,
            self.microsecond,
            self.nanosecond,
        ]
        .iter()
        .all(Option::is_none)
    }
}

impl PlainTime {
    pub fn from_fields(fields: TimeFields, overflow: Overflow) -> Result<Self, Error> {
        Self(0).with_fields(fields, overflow)
    }
    pub fn with_fields(self, fields: TimeFields, overflow: Overflow) -> Result<Self, Error> {
        let updates = [
            fields.hour,
            fields.minute,
            fields.second,
            fields.millisecond,
            fields.microsecond,
            fields.nanosecond,
        ];
        if fields.is_empty() {
            return Err(Error::InvalidDateTime);
        }
        let (hour, minute, second, fraction) = self.fields();
        let original = [
            i128::from(hour),
            i128::from(minute),
            i128::from(second),
            i128::from(fraction / 1_000_000),
            i128::from(fraction / 1000 % 1000),
            i128::from(fraction % 1000),
        ];
        let mut total = 0;
        // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L622-L632
        // L622: the validated overflow choice selects independent field clamping.
        // L623: index 0 clamps hour to 0..23.
        // L624: index 1 clamps minute to 0..59.
        // L625: index 2 clamps second to 0..59.
        // L626: index 3 clamps millisecond to 0..999.
        // L627: index 4 clamps microsecond to 0..999.
        // L628: index 5 clamps nanosecond to 0..999.
        // L629: the other mode leaves each integer field unchanged.
        // L630: the other validated mode is reject.
        // L631: any unchanged field outside its bounds returns the error mapped to RangeError.
        // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L655-L661
        // L655: index 0 rejects an hour outside 0..23.
        // L656: index 1 rejects a minute outside 0..59.
        // L657: index 2 rejects a second outside 0..59.
        // L658: index 3 rejects a millisecond outside 0..999.
        // L659: index 4 rejects a microsecond outside 0..999.
        // L660: index 5 rejects a nanosecond outside 0..999.
        for (index, (maximum, factor)) in [
            (23, 3_600_000_000_000),
            (59, 60_000_000_000),
            (59, 1_000_000_000),
            (999, 1_000_000),
            (999, 1000),
            (999, 1),
        ]
        .into_iter()
        .enumerate()
        {
            let mut value = updates[index].unwrap_or(original[index]);
            if overflow == Overflow::Constrain {
                value = value.clamp(0, maximum);
            }
            if !(0..=maximum).contains(&value) {
                return Err(Error::InvalidDateTime);
            }
            total += value * factor;
        }
        // L661: all six fields satisfy IsValidTime.
        // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L632
        // L632: exact within-day nanoseconds encode the fields with implicit Days 0.
        Ok(Self(total))
    }
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
        // PlainTime is always within one day.
        let value = self.0 as u64;
        (
            (value / 3_600_000_000_000) as u8,
            (value / 60_000_000_000 % 60) as u8,
            (value / 1_000_000_000 % 60) as u8,
            (value % 1_000_000_000) as u32,
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
        Ok(Self(
            self.rounded_nanoseconds(unit, increment, mode)?
                .rem_euclid(NANOSECONDS_PER_DAY),
        ))
    }
    pub(crate) fn rounded_nanoseconds(
        self,
        unit: TimeUnit,
        increment: u32,
        mode: RoundingMode,
    ) -> Result<i128, Error> {
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
        Ok(base
            + round_instant(
                self.0 - base,
                unit.nanoseconds() * i128::from(increment),
                mode,
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
        // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L529-L537
        // L529: subtract encoded hour contributions.
        // L530: subtract encoded minute contributions.
        // L531: subtract encoded second contributions.
        // L532: subtract encoded millisecond contributions.
        // L533: subtract encoded microsecond contributions.
        // L534: subtract encoded nanosecond contributions.
        // L535: linearity makes their weighted sum equal other minus self.
        // L536: both clocks lie in [0, one day); their difference cannot reach one day.
        // L537: forward the exact difference to rounding and decomposition.
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
// https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L430-L437
// L432-L437: L722 maxima exceed one; reject non-divisors and the dividend itself.
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
        let output = crate::format::IsoString::time(self.time.fields(), self.precision);
        f.write_str(output.as_str()?)
    }
}

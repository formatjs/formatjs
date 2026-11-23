use crate::rounding::round_duration;
use crate::{Error, Instant, Precision, RoundingMode, TimeUnit};
use core::{fmt, str::FromStr};

pub const MAX_DURATION_NANOSECONDS: i128 = 9_007_199_254_740_992_000_000_000;
const FACTORS: [i128; 7] = [
    86_400_000_000_000,
    3_600_000_000_000,
    60_000_000_000,
    1_000_000_000,
    1_000_000,
    1000,
    1,
];

/// Fields follow years through nanoseconds; storage follows Number-representable integers.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct Duration([i128; 10]);

/// Partial duration fields, preserving unbalanced units.
#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct DurationFields {
    pub years: Option<i128>,
    pub months: Option<i128>,
    pub weeks: Option<i128>,
    pub days: Option<i128>,
    pub hours: Option<i128>,
    pub minutes: Option<i128>,
    pub seconds: Option<i128>,
    pub milliseconds: Option<i128>,
    pub microseconds: Option<i128>,
    pub nanoseconds: Option<i128>,
}

impl Duration {
    // Proposal comparison §7.5.12 steps 3, 5–15: fill typed fields over zero defaults.
    pub fn from_fields(fields: DurationFields) -> Result<Self, Error> {
        Self([0; 10]).with_fields(fields)
    }
    // Proposal comparison §7.3.15 steps 4–24: replace supplied typed duration fields.
    pub fn with_fields(self, fields: DurationFields) -> Result<Self, Error> {
        let updates = [
            fields.years,
            fields.months,
            fields.weeks,
            fields.days,
            fields.hours,
            fields.minutes,
            fields.seconds,
            fields.milliseconds,
            fields.microseconds,
            fields.nanoseconds,
        ];
        if updates.iter().all(Option::is_none) {
            return Err(Error::InvalidDuration);
        }
        let mut result = self.0;
        for (index, update) in updates.into_iter().enumerate() {
            if let Some(value) = update {
                result[index] = value;
            }
        }
        Self::new(result)
    }
    // Proposal comparison §7.5.16 steps 1–9: validate signs and normalized duration bounds.
    pub fn new(mut fields: [i128; 10]) -> Result<Self, Error> {
        let mut sign = 0;
        for value in &mut fields {
            *value = (*value as f64) as i128;
            if *value != 0 {
                if sign != 0 && value.signum() != sign {
                    return Err(Error::InvalidDuration);
                }
                sign = value.signum();
            }
        }
        if fields[..3]
            .iter()
            .any(|value| value.unsigned_abs() >= 1u128 << 32)
        {
            return Err(Error::InvalidDuration);
        }
        let result = Self(fields);
        result.time_nanoseconds(true)?;
        Ok(result)
    }
    // Proposal comparison §7.3.22 steps 11.a, 14–18: prepare duration text at requested precision.
    pub fn format(
        self,
        precision: Precision,
        mode: RoundingMode,
    ) -> Result<FormattedDuration, Error> {
        let quantum = match precision {
            Precision::Auto => 1,
            Precision::Digits(d) if d <= 9 => 10i128.pow(u32::from(9 - d)),
            _ => return Err(Error::InvalidRoundingOptions),
        };
        if quantum == 1 {
            return Ok(FormattedDuration {
                duration: self,
                precision,
            });
        }
        let mut time = round_duration_nanoseconds(self.time_nanoseconds(false)?, quantum, mode)?;
        let largest = self.0.iter().position(|v| *v != 0).unwrap_or(9).clamp(3, 6);
        let mut fields = [0; 10];
        for i in largest..10 {
            fields[i] = time / FACTORS[i - 3];
            time %= FACTORS[i - 3];
        }
        fields[..3].copy_from_slice(&self.0[..3]);
        fields[3] += self.0[3];
        Ok(FormattedDuration {
            duration: Self::new(fields)?,
            precision,
        })
    }
    // Proposal comparison §7.5.5 step 1: expose the existing typed duration field record.
    pub const fn fields(self) -> [i128; 10] {
        self.0
    }
    // Proposal comparison §7.5.13 steps 1–2: return the first nonzero field sign.
    pub fn sign(self) -> i8 {
        self.0
            .into_iter()
            .find(|value| *value != 0)
            .unwrap_or(0)
            .signum() as i8
    }
    // ECMA-262 preview §22.15.5.2 step 1: negate every stored duration field.
    // https://tc39.es/ecma262/pr/3966/#sec-createnegatedtemporalduration
    pub fn negated(self) -> Self {
        Self(self.0.map(|value| -value))
    }
    // Proposal comparison §7.3.17 step 3: take the magnitude of each duration field.
    pub fn abs(self) -> Self {
        Self(self.0.map(i128::abs))
    }
    // ECMA-262 preview §22.3.14.6 steps 1–5: fold hours through nanoseconds
    // using exact integer factors for the successive unit conversions.
    // https://tc39.es/ecma262/pr/3966/#sec-timedurationfromcomponents
    pub fn time_nanoseconds(self, include_days: bool) -> Result<i128, Error> {
        let mut sum = 0i128;
        // ECMA-262 preview §22.3.14.1 steps 1–3: fold optional 24-hour days into the checked span.
        // https://tc39.es/ecma262/pr/3966/#sec-add24hourdaystonormalizedtimeduration
        for index in (if include_days { 3 } else { 4 })..10 {
            sum = sum
                .checked_add(
                    self.0[index]
                        .checked_mul(FACTORS[index - 3])
                        .ok_or(Error::InvalidDuration)?,
                )
                .ok_or(Error::InvalidDuration)?;
        }
        // §22.3.14.6 steps 6–7: check the range before returning the sum.
        if sum <= -MAX_DURATION_NANOSECONDS || sum >= MAX_DURATION_NANOSECONDS {
            return Err(Error::InvalidDuration);
        }
        Ok(sum)
    }
    // Proposal comparison §7.5.8 steps 5–12: split typed nanoseconds into clock fields.
    pub fn from_time_nanoseconds(mut value: i128, largest: TimeUnit) -> Result<Self, Error> {
        let index = time_index(largest);
        if value <= -MAX_DURATION_NANOSECONDS || value >= MAX_DURATION_NANOSECONDS {
            return Err(Error::InvalidDuration);
        }
        let mut fields = [0; 10];
        for i in index..10 {
            fields[i] = value / FACTORS[i - 3];
            value %= FACTORS[i - 3];
        }
        Self::new(fields)
    }
    // Proposal comparison §7.2.3 steps 5.a, 15–17: compare fixed duration spans.
    pub fn compare_time(self, other: Self) -> Result<core::cmp::Ordering, Error> {
        if self == other {
            return Ok(core::cmp::Ordering::Equal);
        }
        if self.0[..3]
            .iter()
            .chain(&other.0[..3])
            .any(|value| *value != 0)
        {
            return Err(Error::InvalidDuration);
        }
        Ok(self
            .time_nanoseconds(true)?
            .cmp(&other.time_nanoseconds(true)?))
    }
    // Proposal comparison §7.3.21 step 14.d: total a fixed span in the selected clock unit.
    pub fn total(self, unit: TimeUnit) -> Result<f64, Error> {
        if self.0[..3].iter().any(|value| *value != 0) {
            return Err(Error::InvalidDuration);
        }
        Ok(rational_to_f64(
            self.time_nanoseconds(true)?,
            unit.nanoseconds(),
        ))
    }
    // Proposal comparison §7.3.21 step 14.d: divide the exact fixed span by one day.
    pub fn total_days(self) -> Result<f64, Error> {
        if self.0[..3].iter().any(|value| *value != 0) {
            return Err(Error::InvalidDuration);
        }
        Ok(rational_to_f64(self.time_nanoseconds(true)?, FACTORS[0]))
    }
    // Proposal comparison §7.3.20 steps 29–34: round and rebalance a fixed duration.
    pub fn round(
        self,
        largest: crate::DateTimeUnit,
        smallest: crate::DateTimeUnit,
        increment: u32,
        mode: RoundingMode,
    ) -> Result<Self, Error> {
        if largest < crate::DateTimeUnit::Day || self.0[..3].iter().any(|value| *value != 0) {
            return Err(Error::InvalidDuration);
        }
        crate::calendar_difference::validate_options(largest, smallest, increment)?;
        let quantum =
            i128::from(increment) * smallest.time().map_or(FACTORS[0], TimeUnit::nanoseconds);
        let mut value = round_duration(self.time_nanoseconds(true)?, quantum, mode);
        let mut fields = [0; 10];
        for index in largest as usize..10 {
            fields[index] = value / FACTORS[index - 3];
            value %= FACTORS[index - 3];
        }
        Self::new(fields)
    }
    // Proposal comparison §7.5.41 steps 3–11: add exact fixed spans and rebalance.
    pub fn checked_add(self, other: Self) -> Result<Self, Error> {
        if self.0[..3]
            .iter()
            .chain(&other.0[..3])
            .any(|value| *value != 0)
        {
            return Err(Error::InvalidDuration);
        }
        let largest = self
            .0
            .iter()
            .zip(other.0)
            .position(|(a, b)| *a != 0 || b != 0)
            .unwrap_or(9);
        // ECMA-262 preview §22.3.14.2 steps 1–3: add spans and check the time-duration bounds.
        // https://tc39.es/ecma262/pr/3966/#sec-addtimeduration
        let mut sum = self.time_nanoseconds(true)? + other.time_nanoseconds(true)?;
        if sum <= -MAX_DURATION_NANOSECONDS || sum >= MAX_DURATION_NANOSECONDS {
            return Err(Error::InvalidDuration);
        }
        let mut fields = [0; 10];
        for i in largest..10 {
            fields[i] = sum / FACTORS[i - 3];
            sum %= FACTORS[i - 3];
        }
        Self::new(fields)
    }
    // Proposal comparison §7.5.41 step 2: negate the second duration before addition.
    pub fn checked_subtract(self, other: Self) -> Result<Self, Error> {
        self.checked_add(other.negated())
    }
}
// Proposal comparison §7.5.8 steps 5–10: select the typed decomposition start index.
fn time_index(unit: TimeUnit) -> usize {
    match unit {
        TimeUnit::Hour => 4,
        TimeUnit::Minute => 5,
        TimeUnit::Second => 6,
        TimeUnit::Millisecond => 7,
        TimeUnit::Microsecond => 8,
        TimeUnit::Nanosecond => 9,
    }
}
// Round the exact ratio once, before any float conversion.
// Proposal comparison §7.3.21 step 15: round the exact total ratio to Number once.
pub(crate) fn rational_to_f64(value: i128, divisor: i128) -> f64 {
    if value == 0 {
        return 0.0;
    }
    let negative = value < 0;
    let numerator = value.unsigned_abs();
    let divisor = divisor as u128;
    let mut exponent =
        (128 - numerator.leading_zeros()) as i32 - (128 - divisor.leading_zeros()) as i32;
    if if exponent >= 0 {
        numerator < divisor << exponent
    } else {
        numerator << -exponent < divisor
    } {
        exponent -= 1;
    }
    let shift = 52 - exponent;
    let (n, d) = if shift >= 0 {
        (numerator << shift, divisor)
    } else {
        (numerator, divisor << -shift)
    };
    let (mut mantissa, remainder) = (n / d, n % d);
    if remainder * 2 > d || remainder * 2 == d && mantissa % 2 != 0 {
        mantissa += 1;
    }
    if mantissa == 1u128 << 53 {
        mantissa >>= 1;
        exponent += 1;
    }
    f64::from_bits(
        (u64::from(negative) << 63)
            | ((exponent + 1023) as u64) << 52
            | ((mantissa as u64) & ((1u64 << 52) - 1)),
    )
}
impl Instant {
    // Proposal comparison §8.5.10 steps 4–7: add clock nanoseconds to the Instant.
    pub fn checked_add(self, duration: Duration) -> Result<Self, Error> {
        if duration.0[..4].iter().any(|value| *value != 0) {
            return Err(Error::InvalidDuration);
        }
        // ECMA-262 preview §22.3.6.1 steps 1–3: add nanoseconds and check bounds.
        // https://tc39.es/ecma262/pr/3966/#sec-addepochnanoseconds
        // §22.3.14.3 step 1 adds the time span to the epoch.
        // https://tc39.es/ecma262/pr/3966/#sec-addtimedurationtoepochnanoseconds
        Self::from_epoch_nanoseconds(self.epoch_nanoseconds() + duration.time_nanoseconds(false)?)
    }
    // Proposal comparison §8.5.10 step 2: negate the typed duration for Instant subtraction.
    pub fn checked_subtract(self, duration: Duration) -> Result<Self, Error> {
        self.checked_add(duration.negated())
    }
    // Proposal comparison §8.5.9 steps 4–5: round the exact Instant difference.
    pub fn until(
        self,
        other: Self,
        largest: TimeUnit,
        smallest: TimeUnit,
        increment: u32,
        mode: RoundingMode,
    ) -> Result<Duration, Error> {
        let maximum = match smallest {
            TimeUnit::Hour => 24,
            TimeUnit::Minute | TimeUnit::Second => 60,
            _ => 1000,
        };
        if largest.nanoseconds() < smallest.nanoseconds()
            || increment == 0
            || increment >= maximum
            || maximum % increment != 0
        {
            return Err(Error::InvalidRoundingOptions);
        }
        // ECMA-262 preview §22.3.6.3 steps 1–3: subtract exact epochs and round the span.
        // https://tc39.es/ecma262/pr/3966/#sec-differenceepochnanoseconds
        let rounded = round_duration(
            other.epoch_nanoseconds() - self.epoch_nanoseconds(),
            i128::from(increment) * smallest.nanoseconds(),
            mode,
        );
        Duration::from_time_nanoseconds(rounded, largest)
    }
    // Proposal comparison §8.5.9 step 6: reverse the typed Instant difference for since.
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
}
impl FromStr for Duration {
    type Err = Error;
    // Proposal comparison §13.37 steps 1–3, 23–44: scan and decode duration text.
    fn from_str(input: &str) -> Result<Self, Error> {
        let bytes = input.as_bytes();
        let mut position = 0;
        let negative = bytes.first() == Some(&b'-');
        if negative || bytes.first() == Some(&b'+') {
            position += 1;
        }
        if !bytes
            .get(position)
            .is_some_and(|b| b.eq_ignore_ascii_case(&b'P'))
        {
            return Err(Error::InvalidSyntax);
        }
        position += 1;
        let (mut in_time, mut seen, mut seen_time) = (false, false, false);
        let mut last: Option<usize> = None;
        let mut fields = [0; 10];
        while position < bytes.len() {
            if bytes[position].eq_ignore_ascii_case(&b'T') {
                if in_time {
                    return Err(Error::InvalidSyntax);
                }
                in_time = true;
                position += 1;
                continue;
            }
            let start = position;
            let mut whole = 0i128;
            while bytes.get(position).is_some_and(u8::is_ascii_digit) {
                whole = whole
                    .checked_mul(10)
                    .and_then(|v| v.checked_add(i128::from(bytes[position] - b'0')))
                    .ok_or(Error::InvalidDuration)?;
                position += 1;
            }
            if position == start {
                return Err(Error::InvalidSyntax);
            }
            let mut fraction = None;
            if bytes
                .get(position)
                .is_some_and(|b| *b == b'.' || *b == b',')
            {
                position += 1;
                let (mut digits, mut value) = (0, 0i128);
                while bytes.get(position).is_some_and(u8::is_ascii_digit) {
                    if digits == 9 {
                        return Err(Error::InvalidSyntax);
                    }
                    value = value * 10 + i128::from(bytes[position] - b'0');
                    position += 1;
                    digits += 1;
                }
                if digits == 0 {
                    return Err(Error::InvalidSyntax);
                }
                fraction = Some(value * 10i128.pow(9 - digits));
            }
            let designator = bytes
                .get(position)
                .ok_or(Error::InvalidSyntax)?
                .to_ascii_uppercase();
            position += 1;
            let index = match (in_time, designator) {
                (false, b'Y') => 0,
                (false, b'M') => 1,
                (false, b'W') => 2,
                (false, b'D') => 3,
                (true, b'H') => 4,
                (true, b'M') => 5,
                (true, b'S') => 6,
                _ => return Err(Error::InvalidSyntax),
            };
            if last.is_some_and(|old| old >= index) {
                return Err(Error::InvalidSyntax);
            }
            last = Some(index);
            seen = true;
            seen_time |= in_time;
            fields[index] = whole;
            if let Some(fraction) = fraction {
                if !in_time || position != bytes.len() {
                    return Err(Error::InvalidSyntax);
                }
                let mut extra = fraction
                    * match index {
                        4 => 3600,
                        5 => 60,
                        _ => 1,
                    };
                for i in index + 1..10 {
                    fields[i] += extra / FACTORS[i - 3];
                    extra %= FACTORS[i - 3];
                }
            }
        }
        if !seen || in_time && !seen_time {
            return Err(Error::InvalidSyntax);
        }
        if negative {
            fields = fields.map(|v| -v);
        }
        Self::new(fields)
    }
}
// Proposal comparison §7.5.40 steps 1–17: write duration sign, fields and fraction.
fn write_duration(
    value: Duration,
    precision: Precision,
    f: &mut fmt::Formatter<'_>,
) -> fmt::Result {
    let fields = value.abs().0;
    if value.sign() < 0 {
        f.write_str("-")?;
    }
    f.write_str("P")?;
    for (index, suffix) in ['Y', 'M', 'W', 'D'].into_iter().enumerate() {
        if fields[index] != 0 {
            write!(f, "{}{suffix}", fields[index])?;
        }
    }
    let second_ns =
        fields[6] * 1_000_000_000 + fields[7] * 1_000_000 + fields[8] * 1000 + fields[9];
    if fields[4] != 0
        || fields[5] != 0
        || second_ns != 0
        || fields[..4].iter().all(|v| *v == 0)
        || precision != Precision::Auto
    {
        f.write_str("T")?;
        if fields[4] != 0 {
            write!(f, "{}H", fields[4])?;
        }
        if fields[5] != 0 {
            write!(f, "{}M", fields[5])?;
        }
        if second_ns != 0 || fields[..6].iter().all(|v| *v == 0) || precision != Precision::Auto {
            write!(f, "{}", second_ns / 1_000_000_000)?;
            // ECMA-262 preview §22.5.3 steps 1–3: strip trailing zeroes in auto
            // mode and truncate to the requested width in fixed mode.
            // https://tc39.es/ecma262/pr/3966/#sec-formatfractionalseconds
            let (fraction, digits) = if let Precision::Digits(d) = precision {
                (
                    second_ns % 1_000_000_000 / 10i128.pow(u32::from(9 - d)),
                    usize::from(d),
                )
            } else {
                let (mut fraction, mut digits) = (second_ns % 1_000_000_000, 9usize);
                while digits > 0 && fraction % 10 == 0 {
                    fraction /= 10;
                    digits -= 1;
                }
                (fraction, digits)
            };
            if digits > 0 {
                write!(f, ".{fraction:0digits$}")?;
            }
            f.write_str("S")?;
        }
    }
    Ok(())
}

pub struct FormattedDuration {
    duration: Duration,
    precision: Precision,
}
impl fmt::Display for Duration {
    // Proposal comparison §7.3.23 step 3: supply auto precision for typed duration display.
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write_duration(*self, Precision::Auto, f)
    }
}
impl fmt::Display for FormattedDuration {
    // Proposal comparison §7.3.22 steps 11.a, 18: write the prepared duration and precision.
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write_duration(self.duration, self.precision, f)
    }
}

// ECMA-262 preview §22.3.14.5 steps 1–3: round exact nanoseconds and check the result bound.
// https://tc39.es/ecma262/pr/3966/#sec-roundtimedurationtoincrement
pub fn round_duration_nanoseconds(
    value: i128,
    quantum: i128,
    mode: RoundingMode,
) -> Result<i128, Error> {
    if value <= -MAX_DURATION_NANOSECONDS
        || value >= MAX_DURATION_NANOSECONDS
        || quantum < 1
        || quantum > FACTORS[0]
    {
        return Err(Error::InvalidDuration);
    }
    let rounded = round_duration(value, quantum, mode);
    if rounded <= -MAX_DURATION_NANOSECONDS || rounded >= MAX_DURATION_NANOSECONDS {
        return Err(Error::InvalidDuration);
    }
    Ok(rounded)
}

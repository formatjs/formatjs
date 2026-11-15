use crate::{
    Duration, Error, MAX_EPOCH_NANOSECONDS, NANOSECONDS_PER_DAY, RoundingMode, TimeUnit,
    round_duration_nanoseconds,
};

#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd)]
#[repr(usize)]
pub enum DateTimeUnit {
    Year,
    Month,
    Week,
    Day,
    Hour,
    Minute,
    Second,
    Millisecond,
    Microsecond,
    Nanosecond,
}
impl DateTimeUnit {
    pub(crate) fn time(self) -> Option<TimeUnit> {
        match self {
            Self::Hour => Some(TimeUnit::Hour),
            Self::Minute => Some(TimeUnit::Minute),
            Self::Second => Some(TimeUnit::Second),
            Self::Millisecond => Some(TimeUnit::Millisecond),
            Self::Microsecond => Some(TimeUnit::Microsecond),
            Self::Nanosecond => Some(TimeUnit::Nanosecond),
            _ => None,
        }
    }
}
impl core::str::FromStr for DateTimeUnit {
    type Err = Error;
    fn from_str(value: &str) -> Result<Self, Error> {
        match value.strip_suffix('s').unwrap_or(value) {
            "year" => Ok(Self::Year),
            "month" => Ok(Self::Month),
            "week" => Ok(Self::Week),
            "day" => Ok(Self::Day),
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
impl From<TimeUnit> for DateTimeUnit {
    fn from(value: TimeUnit) -> Self {
        match value {
            TimeUnit::Hour => Self::Hour,
            TimeUnit::Minute => Self::Minute,
            TimeUnit::Second => Self::Second,
            TimeUnit::Millisecond => Self::Millisecond,
            TimeUnit::Microsecond => Self::Microsecond,
            TimeUnit::Nanosecond => Self::Nanosecond,
        }
    }
}
pub(crate) trait RelativeAnchor {
    const ZONED: bool;
    fn origin(&self) -> i128;
    fn date_at(&self, value: i128) -> Result<i64, Error>;
    fn endpoint(&self, fields: [i128; 10]) -> Result<i128, Error>;
}
fn endpoint<A: RelativeAnchor>(start: &A, fields: [i128; 10]) -> Result<i128, Error> {
    start.endpoint(fields)
}
fn date_until(start: i64, end: i64, largest: DateTimeUnit) -> Result<[i128; 10], Error> {
    use crate::calendar::{Calendar, DateUnit};
    let unit = match largest {
        DateTimeUnit::Year => DateUnit::Year,
        DateTimeUnit::Month => DateUnit::Month,
        DateTimeUnit::Week => DateUnit::Week,
        _ => DateUnit::Day,
    };
    let value = Calendar::Iso8601
        .until_raw(start, end, unit)
        .map_err(|_| Error::OutOfRange)?;
    Ok([
        i128::from(value.years),
        i128::from(value.months),
        i128::from(value.weeks),
        i128::from(value.days),
        0,
        0,
        0,
        0,
        0,
        0,
    ])
}
pub(crate) fn unrounded<A: RelativeAnchor>(
    start: &A,
    end: i128,
    largest: DateTimeUnit,
) -> Result<[i128; 10], Error> {
    let origin = start.origin();
    if let Some(time) = largest.time() {
        return Ok(Duration::from_time_nanoseconds(end - origin, time)?.fields());
    }
    let sign = (end - origin).signum();
    if sign == 0 {
        return Ok([0; 10]);
    }
    let begin = start.date_at(origin)?;
    let finish = start.date_at(end)?;
    if !A::ZONED {
        let mut day = finish;
        let mut remainder =
            end.rem_euclid(NANOSECONDS_PER_DAY) - origin.rem_euclid(NANOSECONDS_PER_DAY);
        if remainder * sign < 0 {
            day -= sign as i64;
            remainder += sign * NANOSECONDS_PER_DAY;
        }
        let mut fields = date_until(begin, day, largest)?;
        fields[4..].copy_from_slice(
            &Duration::from_time_nanoseconds(remainder, TimeUnit::Hour)?.fields()[4..],
        );
        return Ok(fields);
    }
    let mut day = if i128::from(finish - begin) * sign < 0 {
        begin
    } else {
        finish
    };
    let mut fields = date_until(begin, day, largest)?;
    let mut anchor;
    loop {
        anchor = match endpoint(start, fields) {
            Ok(value) => value,
            Err(Error::OutOfRange | Error::InvalidDateTime) => {
                sign * (MAX_EPOCH_NANOSECONDS + NANOSECONDS_PER_DAY)
            }
            Err(error) => return Err(error),
        };
        if (anchor - end) * sign <= 0 {
            break;
        }
        day -= sign as i64;
        if i128::from(day - begin) * sign < 0 {
            fields = [0; 10];
            anchor = origin;
            break;
        }
        fields = date_until(begin, day, largest)?;
    }
    let time = Duration::from_time_nanoseconds(end - anchor, TimeUnit::Hour)?.fields();
    fields[4..].copy_from_slice(&time[4..]);
    Ok(fields)
}
pub(crate) fn difference<A: RelativeAnchor>(
    start: &A,
    end: i128,
    largest: DateTimeUnit,
    smallest: DateTimeUnit,
    increment: u32,
    mode: RoundingMode,
    since: bool,
) -> Result<Duration, Error> {
    validate_options(largest, smallest, increment)?;
    let origin = start.origin();
    let since_sign = if since { -1 } else { 1 };
    if !A::ZONED
        && largest >= DateTimeUnit::Week
        && largest <= DateTimeUnit::Day
        && smallest <= DateTimeUnit::Day
    {
        let quantum = NANOSECONDS_PER_DAY
            * i128::from(increment)
            * if smallest == DateTimeUnit::Week { 7 } else { 1 };
        let rounded = crate::rounding::round_duration((end - origin) * since_sign, quantum, mode);
        let mut fields = [0; 10];
        fields[3] = rounded / NANOSECONDS_PER_DAY;
        if largest == DateTimeUnit::Week {
            fields[2] = fields[3] / 7;
            fields[3] %= 7;
        }
        return Duration::new(fields);
    }
    let rounded = if let Some(unit) = smallest.time() {
        let mut fields = if A::ZONED && largest <= DateTimeUnit::Day {
            unrounded(start, end, largest)?
        } else {
            [0; 10]
        };
        fields[4..].fill(0);
        let anchor = endpoint(start, fields)?;
        anchor
            + since_sign
                * round_duration_nanoseconds(
                    (end - anchor) * since_sign,
                    i128::from(increment) * unit.nanoseconds(),
                    mode,
                )?
    } else if origin == end {
        origin
    } else {
        let fields = unrounded(start, end, largest)?;
        let mut prefix = [0; 10];
        prefix[largest as usize..smallest as usize]
            .copy_from_slice(&fields[largest as usize..smallest as usize]);
        let count = if smallest == DateTimeUnit::Week {
            fields[2] + fields[3] / 7
        } else {
            fields[smallest as usize]
        };
        let truncated = count / i128::from(increment) * i128::from(increment);
        prefix[smallest as usize] = truncated;
        let a = endpoint(start, prefix)?;
        if a == end {
            a
        } else {
            let sign = (end - origin).signum();
            prefix[smallest as usize] = truncated + sign * i128::from(increment);
            let b = endpoint(start, prefix)?;
            let positive = sign * since_sign > 0;
            let distance = (end - a) * sign;
            let span = (b - a) * sign;
            let expand = match mode {
                RoundingMode::Expand => true,
                RoundingMode::Trunc => false,
                RoundingMode::Ceil => positive,
                RoundingMode::Floor => !positive,
                _ if distance * 2 != span => distance * 2 > span,
                RoundingMode::HalfExpand => true,
                RoundingMode::HalfTrunc => false,
                RoundingMode::HalfCeil => positive,
                RoundingMode::HalfFloor => !positive,
                RoundingMode::HalfEven => (truncated / i128::from(increment)).abs() % 2 == 1,
            };
            if expand { b } else { a }
        }
    };
    let mut fields = unrounded(start, rounded, largest)?;
    if since {
        for field in &mut fields {
            *field = -*field;
        }
    }
    Duration::new(fields)
}

pub(crate) fn validate_options(
    largest: DateTimeUnit,
    smallest: DateTimeUnit,
    increment: u32,
) -> Result<(), Error> {
    if largest > smallest || increment == 0 || increment > 1_000_000_000 {
        return Err(Error::InvalidRoundingOptions);
    }
    if let Some(time) = smallest.time() {
        let maximum = match time {
            TimeUnit::Hour => 24,
            TimeUnit::Minute | TimeUnit::Second => 60,
            _ => 1000,
        };
        if increment >= maximum || maximum % increment != 0 {
            return Err(Error::InvalidRoundingOptions);
        }
    }
    Ok(())
}

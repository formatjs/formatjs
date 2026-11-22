use crate::{
    CalendarProvider, Duration, Error, MAX_EPOCH_NANOSECONDS, NANOSECONDS_PER_DAY, RoundingMode,
    TimeUnit, round_duration_nanoseconds,
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
    // Proposal comparison §13.23 step 1: select the fixed clock-unit entry.
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
    // Proposal comparison §13.17 step 9: map a prepared singular or plural unit name.
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
    // Proposal comparison §13.17 step 9: retain the selected clock unit in typed settings.
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
    type Calendar: CalendarProvider;
    fn calendar(&self) -> Self::Calendar;
    const ZONED: bool;
    fn origin(&self) -> i128;
    fn date_at(&self, value: i128) -> Result<i64, Error>;
    // Proposal comparison §5.5.12 step 3: supply the plain clock remainder.
    fn clock_at(&self, value: i128) -> Result<i128, Error> {
        Ok(value.rem_euclid(NANOSECONDS_PER_DAY))
    }
    // Proposal comparison §6.5.6 step 11.c: resolve the raw local probe.
    fn resolve_compatible(&self, local: i128) -> Result<i128, Error> {
        Ok(local)
    }
    fn endpoint(&self, fields: [i128; 10]) -> Result<i128, Error>;
}
// Proposal comparison §7.5.33 steps 8.a, 9: delegate calendar window endpoint construction.
fn endpoint<A: RelativeAnchor>(start: &A, fields: [i128; 10]) -> Result<i128, Error> {
    start.endpoint(fields)
}
// Proposal comparison §5.5.12 step 9: obtain the calendar date portion.
fn date_until<A: RelativeAnchor>(
    anchor: &A,
    start: i64,
    end: i64,
    largest: DateTimeUnit,
) -> Result<[i128; 10], Error> {
    use crate::calendar::DateUnit;
    let unit = match largest {
        DateTimeUnit::Year => DateUnit::Year,
        DateTimeUnit::Month => DateUnit::Month,
        DateTimeUnit::Week => DateUnit::Week,
        _ => DateUnit::Day,
    };
    let value = anchor
        .calendar()
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
// Proposal comparison §5.5.12 steps 3–11: split an exact span into date and clock parts.
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
        let mut fields = date_until(start, begin, day, largest)?;
        fields[4..].copy_from_slice(
            &Duration::from_time_nanoseconds(remainder, TimeUnit::Hour)?.fields()[4..],
        );
        return Ok(fields);
    }
    let end_clock = start.clock_at(end)?;
    let origin_clock = start.clock_at(origin)?;
    let mut day = finish;
    if (end_clock - origin_clock) * sign < 0 {
        day -= sign as i64;
    }
    if i128::from(day - begin) * sign < 0 {
        day = begin;
    }
    let (mut fields, anchor);
    loop {
        let date_fields = date_until(start, begin, day, largest);
        let candidate = match date_fields {
            Ok(fields) => match endpoint(start, fields) {
                Ok(value) => value,
                Err(Error::OutOfRange | Error::InvalidDateTime) => {
                    sign * (MAX_EPOCH_NANOSECONDS + NANOSECONDS_PER_DAY)
                }
                Err(error) => return Err(error),
            },
            Err(error) => {
                let calendar = start.calendar();
                if day == begin
                    || calendar.date_extended(begin).is_err()
                    || !matches!(
                        calendar.date_extended(day),
                        Err(crate::calendar::Error::OutOfRange)
                    )
                {
                    return Err(error);
                }
                // Proposal comparison §6.5.6 steps 11.c and 14: Resolve an
                // uncovered probe before deciding whether its date is needed.
                start
                    .resolve_compatible(i128::from(day) * NANOSECONDS_PER_DAY + origin_clock)
                    .map_err(|_| error)?
            }
        };
        if (candidate - end) * sign <= 0 {
            fields = date_fields?;
            anchor = candidate;
            break;
        }
        day -= sign as i64;
        if i128::from(day - begin) * sign < 0 {
            fields = [0; 10];
            anchor = origin;
            break;
        }
    }
    // Proposal comparison §6.5.6 step 11.d: subtract the selected anchor exactly.
    let time = Duration::from_time_nanoseconds(end - anchor, TimeUnit::Hour)?.fields();
    fields[4..].copy_from_slice(&time[4..]);
    Ok(fields)
}
// Proposal comparison §7.5.38 steps 5.a, 6.a, 7.a, 9.b: select typed rounding paths.
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
    let exact_zoned_nanosecond = A::ZONED && smallest == DateTimeUnit::Nanosecond && increment == 1;
    if origin == end && (!A::ZONED || largest.time().is_some() || exact_zoned_nanosecond) {
        return Duration::new([0; 10]);
    }
    if let Some(time) = largest.time() {
        // Duration fields follow Number precision; round the original span first.
        let quantum = i128::from(increment) * smallest.time().unwrap().nanoseconds();
        let delta = if since { origin - end } else { end - origin };
        let rounded = round_duration_nanoseconds(delta, quantum, mode)?;
        return Duration::from_time_nanoseconds(rounded, time);
    }
    let sign = if end < origin { -1 } else { 1 };
    let since_sign = if since { -1 } else { 1 };
    // Proposal comparison §6.5.7 step 2: dispatch the zoned date-unit difference.
    let mut fields = unrounded(start, end, largest)?;
    if exact_zoned_nanosecond {
        if since {
            for field in &mut fields {
                *field = -*field;
            }
        }
        return Duration::new(fields);
    }
    let mut expanded = false;
    let rounded;
    if smallest < DateTimeUnit::Day || A::ZONED && smallest == DateTimeUnit::Day {
        let mut prefix = [0; 10];
        prefix[largest as usize..smallest as usize]
            .copy_from_slice(&fields[largest as usize..smallest as usize]);
        let index = smallest as usize;
        let count = if smallest == DateTimeUnit::Week {
            fields[2] + fields[3] / 7
        } else {
            fields[index]
        };
        let mut truncated = count / i128::from(increment) * i128::from(increment);
        prefix[index] = truncated;
        // Proposal comparison §7.5.33 step 8.d.i: Resolve compatibly when zoned and the rounded unit is nonzero.
        let mut a = endpoint(start, prefix)?;
        prefix[index] = truncated + sign * i128::from(increment);
        // Proposal comparison §7.5.33 step 12.a: Resolve the nonzero date endpoint compatibly when zoned.
        let mut b = endpoint(start, prefix)?;
        if (end - a) * sign < 0 || (b - end) * sign < 0 {
            truncated += sign * i128::from(increment);
            a = b;
            prefix[index] = truncated + sign * i128::from(increment);
            b = endpoint(start, prefix)?;
            expanded = true;
        }
        let expand = if a == end {
            false
        } else if b == end {
            true
        } else {
            let positive = sign * since_sign > 0;
            let distance = (end - a) * sign;
            let span = (b - a) * sign;
            match mode {
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
            }
        };
        prefix[index] = if expand {
            truncated + sign * i128::from(increment)
        } else {
            truncated
        };
        fields = prefix;
        rounded = if expand { b } else { a };
        expanded |= expand;
    } else if A::ZONED && largest <= DateTimeUnit::Day {
        let time = Duration::new(fields)?.time_nanoseconds(false)?;
        let quantum = i128::from(increment) * smallest.time().unwrap().nanoseconds();
        let mut value = since_sign * round_duration_nanoseconds(time * since_sign, quantum, mode)?;
        let mut date = fields;
        date[4..].fill(0);
        let base = endpoint(start, date)?;
        let mut next = date;
        next[3] += sign;
        // Proposal comparison §7.5.35 step 6: The signed day step ensures compatible resolution.
        let span = endpoint(start, next)? - base;
        fields = date;
        expanded = (value - span) * sign >= 0;
        if expanded {
            fields[3] += sign;
            value = since_sign
                * round_duration_nanoseconds((value - span) * since_sign, quantum, mode)?;
            rounded = base + span + value;
        } else {
            rounded = base + value;
        }
        fields[4..].copy_from_slice(
            &Duration::from_time_nanoseconds(value, TimeUnit::Hour)?.fields()[4..],
        );
    } else {
        let time = Duration::new(fields)?.time_nanoseconds(true)?;
        let quantum = i128::from(increment)
            * smallest
                .time()
                .map_or(NANOSECONDS_PER_DAY, |unit| unit.nanoseconds());
        let value = since_sign * crate::rounding::round_duration(time * since_sign, quantum, mode);
        let days = if largest <= DateTimeUnit::Day {
            value / NANOSECONDS_PER_DAY
        } else {
            0
        };
        expanded = (days - fields[3]).signum() == sign;
        rounded = end + value - time;
        let remainder = if largest <= DateTimeUnit::Day {
            value % NANOSECONDS_PER_DAY
        } else {
            value
        };
        fields[3] = days;
        fields[4..].copy_from_slice(
            &Duration::from_time_nanoseconds(remainder, largest.time().unwrap_or(TimeUnit::Hour))?
                .fields()[4..],
        );
    }
    if expanded && smallest != DateTimeUnit::Week {
        let mut index = (smallest as usize).min(DateTimeUnit::Day as usize);
        while index > largest as usize {
            index -= 1;
            if index == DateTimeUnit::Week as usize && largest != DateTimeUnit::Week {
                continue;
            }
            let mut candidate = [0; 10];
            candidate[..index].copy_from_slice(&fields[..index]);
            candidate[index] = fields[index] + sign;
            let boundary = endpoint(start, candidate)?;
            if (rounded - boundary) * sign < 0 {
                break;
            }
            fields = candidate;
        }
    }
    if since {
        for field in &mut fields {
            *field = -*field;
        }
    }
    Duration::new(fields)
}

// Proposal comparison §13.14 steps 3–4: validate typed rounding caps and divisibility.
pub(crate) fn validate_options(
    largest: DateTimeUnit,
    smallest: DateTimeUnit,
    increment: u32,
) -> Result<(), Error> {
    if largest > smallest || increment == 0 || increment > 1_000_000_000 {
        return Err(Error::InvalidRoundingOptions);
    }
    // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L722
    // Date units have no fixed cap; time rows use strict L432-L437 validation.
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

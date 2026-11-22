use crate::{
    CalendarProvider, Duration, Error, NANOSECONDS_PER_DAY, Overflow, PlainDate, RoundingMode,
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
    // Proposal comparison §6.5.6 steps 4.a and 4.b: Use elapsed time when the ISO dates match.
    if A::ZONED && begin == finish {
        return Ok(Duration::from_time_nanoseconds(end - origin, TimeUnit::Hour)?.fields());
    }
    if !A::ZONED {
        let mut day = finish;
        let mut remainder =
            end.rem_euclid(NANOSECONDS_PER_DAY) - origin.rem_euclid(NANOSECONDS_PER_DAY);
        if remainder * sign < 0 {
            day -= sign as i64;
            remainder += sign * NANOSECONDS_PER_DAY;
        }
        // Proposal comparison §5.5.12 step 9 uses the adjusted ISO date.
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
        return Ok(Duration::from_time_nanoseconds(end - origin, TimeUnit::Hour)?.fields());
    }
    let anchor = loop {
        // Proposal comparison §6.5.6 steps 11.a–c: Resolve the raw ISO probe before calendar difference.
        // https://tc39.es/proposal-temporal/#sec-temporal-differencezoneddatetime
        let candidate =
            start.resolve_compatible(i128::from(day) * NANOSECONDS_PER_DAY + origin_clock)?;
        if (candidate - end) * sign <= 0 {
            break candidate;
        }
        if day == begin {
            // Step 12 can fail when a midnight fold makes every compatible probe overshoot.
            // Related backward-shift failure: https://github.com/tc39/proposal-temporal/issues/3311
            return Ok(Duration::from_time_nanoseconds(end - origin, TimeUnit::Hour)?.fields());
        }
        day -= sign as i64;
    };
    // Proposal comparison §6.5.6 step 14 and §12.3.9 step 2: Use the selected date.
    let mut fields = if day == begin {
        [0; 10]
    } else {
        date_until(start, begin, day, largest)?
    };
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
    // Proposal comparison §6.5.7 step 5 uses these fields and the original anchor.
    let mut expanded = false;
    let rounded;
    if smallest < DateTimeUnit::Day || A::ZONED && smallest == DateTimeUnit::Day {
        let mut prefix = [0; 10];
        prefix[largest as usize..smallest as usize]
            .copy_from_slice(&fields[largest as usize..smallest as usize]);
        let index = smallest as usize;
        // ECMA-262 preview §22.15.5.12 steps 3.c–3.e: the signed day delta
        // contributes one whole week per seven days before increment rounding.
        // https://tc39.es/ecma262/pr/3966/#sec-computenudgewindow
        let count = if smallest == DateTimeUnit::Week {
            fields[2] + fields[3] / 7
        } else {
            fields[index]
        };
        let mut truncated = count / i128::from(increment) * i128::from(increment);
        let stride = sign * i128::from(increment);
        prefix[index] = truncated;
        // Proposal comparison §7.5.33 step 8.d.i: Resolve compatibly when zoned and the rounded unit is nonzero.
        let mut a = endpoint(start, prefix)?;
        prefix[index] = truncated + stride;
        // Proposal comparison §7.5.33 step 12.a: Resolve the nonzero date endpoint compatibly when zoned.
        let mut b = endpoint(start, prefix)?;
        let mut rebased_upper = None;
        // Proposal comparison §7.5.34 steps 5–6 require a bracket. A borrowed
        // zone can make the first endpoint overshoot after count truncation.
        if (end - a) * sign < 0 {
            let adjacent = b;
            b = a;
            if A::ZONED
                && truncated == 0
                && (matches!(smallest, DateTimeUnit::Month | DateTimeUnit::Week)
                    || smallest == DateTimeUnit::Day && increment > 1)
            {
                prefix[index] = 0;
                let upper_prefix = prefix;
                rebased_upper = Some(upper_prefix);
                // Zero fields keep the origin, so an overshoot requires a calendar prefix.
                // Borrow from the last nonzero calendar unit to keep one sign.
                let unit = if prefix[2] != 0 {
                    2
                } else if prefix[1] != 0 {
                    1
                } else {
                    0
                };
                prefix[unit] -= sign;
                let calendar = start.calendar();
                let date = PlainDate::from_epoch_day_in(start.date_at(origin)?, calendar)?;
                let upper = date
                    .checked_add(Duration::new(upper_prefix)?, Overflow::Constrain)?
                    .epoch_day();
                let lower = date
                    .checked_add(Duration::new(prefix)?, Overflow::Constrain)?
                    .epoch_day();
                if smallest != DateTimeUnit::Week {
                    let mut probed_lower = None;
                    if smallest == DateTimeUnit::Day {
                        // Proposal comparison §7.5.34 steps 5.a.ii and 6.a.ii.
                        // Gap resolution moves an endpoint by less than two days. A day
                        // four nominal days beyond the retained upper bound cannot fit.
                        let retained_days = i128::from(upper - lower);
                        let checked_days = if retained_days % i128::from(increment) == 0
                            && (end - adjacent) * sign >= 0
                        {
                            stride
                        } else if count == 0 {
                            sign
                        } else {
                            count
                        };
                        truncated =
                            (retained_days + checked_days) * sign / i128::from(increment) * stride;
                        if truncated == retained_days {
                            truncated -= stride;
                        }
                        let outer = (retained_days * sign + 3) / i128::from(increment) * stride;
                        if outer != retained_days && (outer - truncated) * sign > 0 {
                            prefix[index] = outer;
                            match endpoint(start, prefix) {
                                Ok(candidate) if (end - candidate) * sign >= 0 => {
                                    truncated = outer;
                                    probed_lower = Some(candidate);
                                }
                                // An extra probe can fall outside the civil or Instant range.
                                Ok(_) | Err(Error::OutOfRange | Error::InvalidDateTime) => {}
                                Err(error) => return Err(error),
                            }
                        }
                    } else {
                        let last_day = upper + sign as i64;
                        let month_start = |day| {
                            calendar
                                .date_extended(day)
                                .map(|value| day - i64::from(value.day) + 1)
                                .map_err(|_| Error::OutOfRange)
                        };
                        // Starting each date at day one counts months without day clamping.
                        let months = calendar
                            .until_raw(
                                month_start(lower)?,
                                month_start(last_day)?,
                                crate::calendar::DateUnit::Month,
                            )
                            .map_err(|_| Error::OutOfRange)?
                            .months;
                        truncated =
                            i128::from(months) / i128::from(increment) * i128::from(increment);
                        prefix[index] = truncated;
                        let candidate_day = date
                            .checked_add(Duration::new(prefix)?, Overflow::Constrain)?
                            .epoch_day();
                        if candidate_day == upper || i128::from(candidate_day - last_day) * sign > 0
                        {
                            truncated -= stride;
                        }
                    }
                    prefix[index] = truncated;
                    a = match probed_lower {
                        Some(value) => value,
                        None => endpoint(start, prefix)?,
                    };
                    // Proposal comparison §7.5.34 steps 5.a.ii and 6.a.ii require a bracket.
                    // Gap shifts can exceed the raw offset bound. Check the rebased endpoint.
                    while truncated * sign > 0 && (end - a) * sign < 0 {
                        truncated -= stride;
                        prefix[index] = truncated;
                        a = endpoint(start, prefix)?;
                    }
                } else {
                    a = endpoint(start, prefix)?;
                    // Proposal comparison §7.5.34 steps 5.a.ii and 6.a.ii.
                    // Each compatible gap endpoint can move by up to two days.
                    // A nominal week four days past the retained upper bound cannot fit.
                    let mut next_count = truncated + stride;
                    while a != end && (i128::from(lower - upper) + 7 * next_count) * sign < 4 {
                        prefix[index] = next_count;
                        let next = endpoint(start, prefix)?;
                        if (end - next) * sign < 0 {
                            break;
                        }
                        truncated = next_count;
                        a = next;
                        next_count += stride;
                    }
                }
            } else {
                truncated -= stride;
                prefix[index] = truncated;
                a = endpoint(start, prefix)?;
            }
        }
        // §7.5.34 step 5.a retries with the same day bounds across this fold.
        // Advance the bounds until they bracket the target.
        // https://tc39.es/proposal-temporal/#sec-temporal-nudgetocalendarunit
        // https://github.com/tc39/proposal-temporal/issues/3336
        while a != end && (b - end) * sign < 0 {
            truncated += stride;
            a = b;
            prefix[index] = truncated + stride;
            b = endpoint(start, prefix)?;
            expanded = true;
        }
        // §7.5.34 step 13 can divide by zero across a skipped day.
        // https://tc39.es/proposal-temporal/#sec-temporal-nudgetocalendarunit
        // https://github.com/tc39/proposal-temporal/issues/3310
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
                RoundingMode::HalfEven => {
                    rebased_upper.is_some() || (truncated / i128::from(increment)).abs() % 2 == 1
                }
            }
        };
        prefix[index] = if expand {
            truncated + stride
        } else {
            truncated
        };
        fields = if expand {
            rebased_upper.unwrap_or(prefix)
        } else {
            prefix
        };
        rounded = if expand { b } else { a };
        expanded |= expand;
    } else if A::ZONED && largest <= DateTimeUnit::Day {
        let time = Duration::new(fields)?.time_nanoseconds(false)?;
        let quantum = i128::from(increment) * smallest.time().unwrap().nanoseconds();
        let mut value = since_sign * round_duration_nanoseconds(time * since_sign, quantum, mode)?;
        let mut date = fields;
        date[4..].fill(0);
        // Proposal comparison §7.5.35 step 5: Resolve the origin wall clock even for zero date fields.
        // https://tc39.es/proposal-temporal/#sec-temporal-nudgetozonedtime
        let base = if date[..4].iter().all(|field| *field == 0) {
            start.resolve_compatible(
                i128::from(start.date_at(origin)?) * NANOSECONDS_PER_DAY
                    + start.clock_at(origin)?,
            )?
        } else {
            endpoint(start, date)?
        };
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
        let rounded_days = value / NANOSECONDS_PER_DAY;
        let days = if largest <= DateTimeUnit::Day {
            rounded_days
        } else {
            0
        };
        // ECMA-262 preview §22.15.5.15 steps 4–8 compare against the time sign, including zero.
        // https://tc39.es/ecma262/pr/3966/#sec-nudgetodayortime
        expanded = (rounded_days - time / NANOSECONDS_PER_DAY).signum() == time.signum();
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
    // ECMA-262 preview §22.15.5.17 step 9 checks larger calendar boundaries.
    // https://tc39.es/ecma262/pr/3966/#sec-roundrelativeduration
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

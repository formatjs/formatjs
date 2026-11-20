use crate::calendar_difference::{RelativeAnchor, difference, validate_options};
use crate::{
    CalendarProvider, Duration, Error, Overflow, RoundingMode, TimeZone, ZonedDateTime, ZonedUnit,
};

impl<Z: TimeZone + Clone + PartialEq, C: CalendarProvider> ZonedDateTime<Z, C> {
    pub fn total_duration(&self, duration: Duration, unit: ZonedUnit) -> Result<f64, Error> {
        if unit == ZonedUnit::Day {
            self.validate_duration_day(duration)?;
        }
        if duration.sign() == 0 {
            return Ok(0.0);
        }
        let end = self.checked_add(duration, Overflow::Constrain)?;
        let finish = end.instant().epoch_nanoseconds();
        total(self, finish, unit)
    }
    pub fn round_duration(
        &self,
        duration: Duration,
        largest: ZonedUnit,
        smallest: ZonedUnit,
        increment: u32,
        mode: RoundingMode,
    ) -> Result<Duration, Error> {
        if smallest <= ZonedUnit::Day && largest < smallest && increment != 1 {
            return Err(Error::InvalidRoundingOptions);
        }
        if largest == ZonedUnit::Day {
            self.validate_duration_day(duration)?;
        }
        let end = self.checked_add(duration, Overflow::Constrain)?;
        round(
            self,
            end.instant().epoch_nanoseconds(),
            largest,
            smallest,
            increment,
            mode,
        )
    }

    pub fn compare_durations(
        &self,
        one: Duration,
        two: Duration,
    ) -> Result<core::cmp::Ordering, Error> {
        let left = one.fields();
        let right = two.fields();
        // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L89-L104
        if left == right {
            return Ok(core::cmp::Ordering::Equal);
        }
        if left[..4].iter().chain(&right[..4]).all(|&v| v == 0) {
            return Ok(one
                .time_nanoseconds(false)?
                .cmp(&two.time_nanoseconds(false)?));
        }
        Ok(self
            .checked_add(one, Overflow::Constrain)?
            .instant()
            .cmp(&self.checked_add(two, Overflow::Constrain)?.instant()))
    }
    fn validate_duration_day(&self, duration: Duration) -> Result<(), Error> {
        let mut fields = duration.fields();
        fields[4..].fill(0);
        let anchor = self.checked_add(Duration::new(fields)?, Overflow::Constrain)?;
        let mut day = [0; 10];
        day[3] = if duration.sign() == 0 {
            1
        } else {
            i128::from(duration.sign())
        };
        anchor.checked_add(Duration::new(day)?, Overflow::Constrain)?;
        Ok(())
    }
}

pub(crate) fn total<A: RelativeAnchor>(
    start: &A,
    finish: i128,
    unit: ZonedUnit,
) -> Result<f64, Error> {
    let origin = start.origin();
    if let Some(time) = unit.time() {
        return Ok(crate::duration::rational_to_f64(
            finish - origin,
            time.nanoseconds(),
        ));
    }
    let difference = difference(
        start,
        finish,
        unit,
        ZonedUnit::Nanosecond,
        1,
        RoundingMode::Trunc,
        false,
    )?;
    let mut count = difference.fields()[unit as usize];
    let mut fields = [0; 10];
    fields[unit as usize] = count;
    let mut a = start.endpoint(fields)?;
    let sign = (finish - origin).signum();
    while (a - finish) * sign > 0 {
        count -= sign;
        fields[unit as usize] = count;
        a = start.endpoint(fields)?;
    }
    if a == finish {
        return Ok(count as f64);
    }
    fields[unit as usize] = count + sign;
    let mut b = start.endpoint(fields)?;
    while (finish - b) * sign >= 0 {
        count += sign;
        a = b;
        if a == finish {
            return Ok(count as f64);
        }
        fields[unit as usize] = count + sign;
        b = start.endpoint(fields)?;
    }
    let span = (b - a) * sign;
    Ok(crate::duration::rational_to_f64(
        count * span + finish - a,
        span,
    ))
}
pub(crate) fn round<A: RelativeAnchor>(
    start: &A,
    finish: i128,
    largest: ZonedUnit,
    smallest: ZonedUnit,
    increment: u32,
    mode: RoundingMode,
) -> Result<Duration, Error> {
    validate_options(largest, smallest, increment)?;
    if smallest <= ZonedUnit::Day && largest < smallest && increment != 1 {
        return Err(Error::InvalidRoundingOptions);
    }
    if smallest == ZonedUnit::Week && largest < ZonedUnit::Week {
        let full = difference(
            start,
            finish,
            largest,
            ZonedUnit::Nanosecond,
            1,
            RoundingMode::Trunc,
            false,
        )?
        .fields();
        let mut fields = [0; 10];
        fields[..2].copy_from_slice(&full[..2]);
        let count = full[2] + full[3] / 7;
        fields[2] = count;
        let a = start.endpoint(fields)?;
        if a == finish {
            return Duration::new(fields);
        }
        let sign = (finish - start.origin()).signum();
        fields[2] = count + sign;
        let b = start.endpoint(fields)?;
        let span = (b - a) * sign;
        fields[2] = crate::rounding::round_duration(count * span + finish - a, span, mode) / span;
        return Duration::new(fields);
    }
    difference(start, finish, largest, smallest, increment, mode, false)
}

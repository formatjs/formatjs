use crate::calendar_difference::{RelativeAnchor, difference, validate_options};
use crate::{
    CalendarProvider, Duration, Error, Overflow, RoundingMode, TimeZone, ZonedDateTime, ZonedUnit,
};

impl<Z: TimeZone + Clone + PartialEq, C: CalendarProvider> ZonedDateTime<Z, C> {
    // Proposal comparison §7.3.21 steps 12.e–f: add the duration and total the zoned span.
    pub fn total_duration(&self, duration: Duration, unit: ZonedUnit) -> Result<f64, Error> {
        // Zero zoned calendar totals still require the next nudge endpoint.
        if duration.sign() == 0 && unit > ZonedUnit::Day {
            return Ok(0.0);
        }
        let end = self.checked_add(duration, Overflow::Constrain)?;
        let finish = end.instant().epoch_nanoseconds();
        total(self, finish, unit)
    }
    // Proposal comparison §7.3.20 steps 27.e–f: form the zoned duration rounding target.
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

    // Proposal comparison §7.2.3 steps 5.a, 12.c–g: compare zoned endpoints.
    pub fn compare_durations(
        &self,
        one: Duration,
        two: Duration,
    ) -> Result<core::cmp::Ordering, Error> {
        let left = one.fields();
        let right = two.fields();
        // Temporal comparison §7.2.3 steps5/12: only full equality skips date additions.
        if left == right {
            return Ok(core::cmp::Ordering::Equal);
        }
        if left[..4]
            .iter()
            .chain(right[..4].iter())
            .all(|field| *field == 0)
        {
            return Ok(one
                .time_nanoseconds(false)?
                .cmp(&two.time_nanoseconds(false)?));
        }
        Ok(self
            .checked_add(one, Overflow::Constrain)?
            .instant()
            .cmp(&self.checked_add(two, Overflow::Constrain)?.instant()))
    }
}

// Proposal comparison §7.5.39 steps 1.b–c, 3: total the typed relative span.
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
    // Proposal comparison §6.5.8 step 4 uses the unrounded count, exact endpoints and zone.
    let mut count = difference.fields()[unit as usize];
    let mut fields = [0; 10];
    fields[unit as usize] = count;
    let mut a = start.endpoint(fields)?;
    // §7.5.39 step 1.a uses the positive window for zero.
    // https://tc39.es/proposal-temporal/#sec-temporal-totalrelativeduration
    let sign = if finish < origin { -1 } else { 1 };
    // Proposal comparison §7.5.33 steps 8–12: Validate both initial endpoints before retrying.
    fields[unit as usize] = count + sign;
    let mut b = start.endpoint(fields)?;
    while (a - finish) * sign > 0 {
        count -= sign;
        b = a;
        fields[unit as usize] = count;
        a = start.endpoint(fields)?;
    }
    if a == finish {
        return Ok(count as f64);
    }
    // §7.5.34 step 5.a can leave the target outside the day window after a fold.
    // Advance the bounds before computing the total.
    // https://github.com/tc39/proposal-temporal/issues/3336
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
// Proposal comparison §7.5.38 step 5.a: round the retained week prefix or delegate.
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
        // ECMA-262 preview §22.15.5.12 steps 3.c–3.e: count whole weeks
        // in the signed day remainder after retaining years and months.
        // https://tc39.es/ecma262/pr/3966/#sec-computenudgewindow
        let count = full[2] + full[3] / 7;
        fields[2] = count;
        let a = start.endpoint(fields)?;
        if !A::ZONED && start.origin() == finish {
            return Duration::new(fields);
        }
        let sign = if finish < start.origin() { -1 } else { 1 };
        fields[2] = count + sign;
        let b = start.endpoint(fields)?;
        // Exact calendar results still validate the next nudge endpoint.
        if a == finish {
            fields[2] = count;
            return Duration::new(fields);
        }
        let span = (b - a) * sign;
        // Proposal comparison §7.5.34 steps 5–6: Reuse shared rounding outside the week window.
        if (0..=span).contains(&((finish - a) * sign)) {
            fields[2] =
                crate::rounding::round_duration(count * span + finish - a, span, mode) / span;
            return Duration::new(fields);
        }
    }
    difference(start, finish, largest, smallest, increment, mode, false)
}

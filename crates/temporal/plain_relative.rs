use crate::calendar_difference::{RelativeAnchor, difference};
use crate::{
    CalendarProvider, DateTimeUnit, Duration, Error, MAX_DURATION_NANOSECONDS, NANOSECONDS_PER_DAY,
    Overflow, PlainDate, PlainDateTime, RoundingMode,
};

struct PlainAnchor<C> {
    date: PlainDate<C>,
    clock: i128,
}
impl<C: CalendarProvider> From<PlainDate<C>> for PlainAnchor<C> {
    // Proposal comparison §3.5.14 steps 8.a, 8.c: represent a plain date at midnight.
    fn from(date: PlainDate<C>) -> Self {
        Self { date, clock: 0 }
    }
}
impl<C: CalendarProvider> From<PlainDateTime<C>> for PlainAnchor<C> {
    // Proposal comparison §5.5.13 step 5: preserve the origin date and clock.
    fn from(value: PlainDateTime<C>) -> Self {
        Self {
            date: value.date(),
            clock: value.time().nanoseconds(),
        }
    }
}
impl<C: CalendarProvider> RelativeAnchor for PlainAnchor<C> {
    type Calendar = C;
    // Proposal comparison §5.5.12 step 9: supply the anchor calendar to date difference.
    fn calendar(&self) -> C {
        self.date.calendar()
    }
    const ZONED: bool = false;
    // Proposal comparison §5.5.13 step 5: compose exact epoch nanoseconds from day and clock.
    fn origin(&self) -> i128 {
        i128::from(self.date.epoch_day()) * NANOSECONDS_PER_DAY + self.clock
    }
    // Proposal comparison §5.5.12 steps 5–6: recover the date of each plain endpoint.
    fn date_at(&self, value: i128) -> Result<i64, Error> {
        value
            .div_euclid(NANOSECONDS_PER_DAY)
            .try_into()
            .map_err(|_| Error::OutOfRange)
    }
    // Proposal comparison §7.5.33 steps 8.a–8.c.i, 9–11.a: form plain nudge endpoints.
    fn endpoint(&self, mut fields: [i128; 10]) -> Result<i128, Error> {
        let clock = Duration::new(fields)?.time_nanoseconds(false)?;
        fields[4..].fill(0);
        let date = self
            .date
            .checked_add(Duration::new(fields)?, Overflow::Constrain)?;
        let result = i128::from(date.epoch_day()) * NANOSECONDS_PER_DAY + self.clock + clock;
        let normalized = result - self.origin();
        if normalized <= -MAX_DURATION_NANOSECONDS || normalized >= MAX_DURATION_NANOSECONDS {
            return Err(Error::InvalidDuration);
        }
        PlainDate::from_epoch_day(self.date_at(result)?)?;
        Ok(result)
    }
}

// Proposal comparison §5.5.15 steps 2, 6: check calendar identity and route the native difference.
pub(crate) fn date_time_difference<C: CalendarProvider>(
    start: PlainDateTime<C>,
    end: PlainDateTime<C>,
    largest: DateTimeUnit,
    smallest: DateTimeUnit,
    increment: u32,
    mode: RoundingMode,
    since: bool,
) -> Result<Duration, Error> {
    if start.calendar_id() != end.calendar_id() {
        return Err(Error::InvalidDateTime);
    }
    difference(
        &PlainAnchor::from(start),
        end.epoch_nanoseconds(),
        largest,
        smallest,
        increment,
        mode,
        since,
    )
}
impl<C: CalendarProvider> PlainDate<C> {
    // Proposal comparison §3.3.25 step 3: route the typed until difference.
    pub fn until(
        self,
        other: Self,
        largest: DateTimeUnit,
        smallest: DateTimeUnit,
        increment: u32,
        mode: RoundingMode,
    ) -> Result<Duration, Error> {
        self.date_difference(other, largest, smallest, increment, mode, false)
    }
    // Proposal comparison §3.3.26 step 3: route the typed since difference.
    pub fn since(
        self,
        other: Self,
        largest: DateTimeUnit,
        smallest: DateTimeUnit,
        increment: u32,
        mode: RoundingMode,
    ) -> Result<Duration, Error> {
        self.date_difference(other, largest, smallest, increment, mode, true)
    }
    // Proposal comparison §3.5.14 steps 2, 6–8.e: route the native plain-date difference.
    fn date_difference(
        self,
        other: Self,
        largest: DateTimeUnit,
        smallest: DateTimeUnit,
        increment: u32,
        mode: RoundingMode,
        since: bool,
    ) -> Result<Duration, Error> {
        if self.calendar_id() != other.calendar_id() {
            return Err(Error::InvalidDateTime);
        }
        if smallest > DateTimeUnit::Day {
            return Err(Error::InvalidRoundingOptions);
        }
        difference(
            &PlainAnchor::from(self),
            PlainAnchor::from(other).origin(),
            largest,
            smallest,
            increment,
            mode,
            since,
        )
    }
    // Proposal comparison §7.3.21 step 13.h: total a plain-relative span after endpoint checks.
    pub fn total_duration(self, duration: Duration, unit: DateTimeUnit) -> Result<f64, Error> {
        if duration.sign() == 0 {
            return Ok(0.0);
        }
        let anchor = PlainAnchor::from(self);
        PlainDateTime::from_epoch_nanoseconds(anchor.origin())?;
        let fields = duration.fields();
        if fields[0] == 0 && fields[1] == 0 && unit >= DateTimeUnit::Day {
            let value = fields[2] * 7 * NANOSECONDS_PER_DAY + duration.time_nanoseconds(true)?;
            if value <= -MAX_DURATION_NANOSECONDS || value >= MAX_DURATION_NANOSECONDS {
                return Err(Error::InvalidDuration);
            }
            // Temporal comparison §5.5.14 step2 also guards the fixed-unit fast path.
            PlainDateTime::from_epoch_nanoseconds(anchor.origin() + value)?;
            let divisor = unit
                .time()
                .map_or(NANOSECONDS_PER_DAY, |time| time.nanoseconds());
            return Ok(crate::duration::rational_to_f64(value, divisor));
        }
        let end = anchor.endpoint(fields)?;
        // Temporal comparison §5.5.14 steps1–2: equality precedes endpoint limits.
        if end != anchor.origin() {
            PlainDateTime::from_epoch_nanoseconds(end)?;
        }
        if unit == DateTimeUnit::Day {
            return Ok(crate::duration::rational_to_f64(
                end - anchor.origin(),
                NANOSECONDS_PER_DAY,
            ));
        }
        crate::relative_duration::total(&anchor, end, unit)
    }
    // Proposal comparison §7.3.20 step 28.h: round the checked plain-relative endpoints.
    pub fn round_duration(
        self,
        duration: Duration,
        largest: DateTimeUnit,
        smallest: DateTimeUnit,
        increment: u32,
        mode: RoundingMode,
    ) -> Result<Duration, Error> {
        let anchor = PlainAnchor::from(self);
        if duration.sign() != 0 {
            PlainDateTime::from_epoch_nanoseconds(anchor.origin())?;
        }
        let end = anchor.endpoint(duration.fields())?;
        // Temporal comparison §5.5.13 steps1–2 retain equal-zero shortcuts.
        if end != anchor.origin() {
            PlainDateTime::from_epoch_nanoseconds(end)?;
        }
        crate::relative_duration::round(&anchor, end, largest, smallest, increment, mode)
    }
    // Proposal comparison §7.2.3 steps 5.a, 13.b–17: compare exact plain-relative spans.
    pub fn compare_durations(
        self,
        one: Duration,
        two: Duration,
    ) -> Result<core::cmp::Ordering, Error> {
        if one == two {
            return Ok(core::cmp::Ordering::Equal);
        }
        // Temporal comparison §7.5.29 steps1–7: bound only the Y/M/W prefix.
        let value = |duration: Duration| -> Result<i128, Error> {
            let mut fields = duration.fields();
            if fields[..3].iter().any(|field| *field != 0) {
                let mut prefix = fields;
                prefix[3..].fill(0);
                let later = self.checked_add(Duration::new(prefix)?, Overflow::Constrain)?;
                fields[..3].fill(0);
                fields[3] += i128::from(later.epoch_day() - self.epoch_day());
            }
            Duration::new(fields)?.time_nanoseconds(true)
        };
        Ok(value(one)?.cmp(&value(two)?))
    }
}

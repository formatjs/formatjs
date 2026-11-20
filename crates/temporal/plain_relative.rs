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
    fn from(date: PlainDate<C>) -> Self {
        Self { date, clock: 0 }
    }
}
impl<C: CalendarProvider> From<PlainDateTime<C>> for PlainAnchor<C> {
    fn from(value: PlainDateTime<C>) -> Self {
        Self {
            date: value.date(),
            clock: value.time().nanoseconds(),
        }
    }
}
impl<C: CalendarProvider> RelativeAnchor for PlainAnchor<C> {
    type Calendar = C;
    fn calendar(&self) -> C {
        self.date.calendar()
    }
    const ZONED: bool = false;
    fn origin(&self) -> i128 {
        i128::from(self.date.epoch_day()) * NANOSECONDS_PER_DAY + self.clock
    }
    fn date_at(&self, value: i128) -> Result<i64, Error> {
        value
            .div_euclid(NANOSECONDS_PER_DAY)
            .try_into()
            .map_err(|_| Error::OutOfRange)
    }
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
            PlainDate::from_epoch_day(anchor.date_at(anchor.origin() + value)?)?;
            let divisor = unit
                .time()
                .map_or(NANOSECONDS_PER_DAY, |time| time.nanoseconds());
            return Ok(crate::duration::rational_to_f64(value, divisor));
        }
        let end = anchor.endpoint(fields)?;
        if unit <= DateTimeUnit::Week {
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
        crate::relative_duration::round(&anchor, end, largest, smallest, increment, mode)
    }
    pub fn compare_durations(
        self,
        one: Duration,
        two: Duration,
    ) -> Result<core::cmp::Ordering, Error> {
        // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L89-L114
        if one == two {
            return Ok(core::cmp::Ordering::Equal);
        }
        // DateDurationDays: only the calendar portion needs a representable date.
        let days = |value: Duration| -> Result<i128, Error> {
            let mut fields = value.fields();
            let days = fields[3];
            if fields[..3].iter().all(|&v| v == 0) {
                return Ok(days);
            }
            fields[3..].fill(0);
            let later = self.checked_add(Duration::new(fields)?, Overflow::Constrain)?;
            Ok(days + i128::from(later.epoch_day() - self.epoch_day()))
        };
        let days1 = days(one)?;
        let days2 = days(two)?;
        let time = |value: Duration, days: i128| -> Result<i128, Error> {
            let ns = value.time_nanoseconds(false)? + days * NANOSECONDS_PER_DAY;
            if ns <= -MAX_DURATION_NANOSECONDS || ns >= MAX_DURATION_NANOSECONDS {
                return Err(Error::InvalidDuration);
            }
            Ok(ns)
        };
        Ok(time(one, days1)?.cmp(&time(two, days2)?))
    }
}

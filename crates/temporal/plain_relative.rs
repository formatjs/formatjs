use crate::calendar_difference::{RelativeAnchor, difference};
use crate::{
    DateTimeUnit, Duration, Error, MAX_DURATION_NANOSECONDS, NANOSECONDS_PER_DAY, Overflow,
    PlainDate, PlainDateTime, RoundingMode,
};

struct PlainAnchor {
    date: PlainDate,
    clock: i128,
}
impl From<PlainDate> for PlainAnchor {
    fn from(date: PlainDate) -> Self {
        Self { date, clock: 0 }
    }
}
impl From<PlainDateTime> for PlainAnchor {
    fn from(value: PlainDateTime) -> Self {
        Self {
            date: value.date(),
            clock: value.time().nanoseconds(),
        }
    }
}
impl RelativeAnchor for PlainAnchor {
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

pub(crate) fn date_time_difference(
    start: PlainDateTime,
    end: PlainDateTime,
    largest: DateTimeUnit,
    smallest: DateTimeUnit,
    increment: u32,
    mode: RoundingMode,
    since: bool,
) -> Result<Duration, Error> {
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
impl PlainDate {
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
        if one.fields()[..4] == two.fields()[..4] {
            return Ok(one
                .time_nanoseconds(false)?
                .cmp(&two.time_nanoseconds(false)?));
        }
        let anchor = PlainAnchor::from(self);
        Ok(anchor
            .endpoint(one.fields())?
            .cmp(&anchor.endpoint(two.fields())?))
    }
}

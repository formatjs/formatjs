use crate::calendar_difference::{RelativeAnchor, difference};
use crate::{Duration, Error, Instant, Overflow, RoundingMode, TimeZone, ZonedDateTime, ZonedUnit};

impl<Z: TimeZone + Clone + PartialEq> ZonedDateTime<Z> {
    pub fn until(
        &self,
        other: &Self,
        largest: ZonedUnit,
        smallest: ZonedUnit,
        increment: u32,
        mode: RoundingMode,
    ) -> Result<Duration, Error> {
        self.difference(other, largest, smallest, increment, mode, false)
    }
    pub fn since(
        &self,
        other: &Self,
        largest: ZonedUnit,
        smallest: ZonedUnit,
        increment: u32,
        mode: RoundingMode,
    ) -> Result<Duration, Error> {
        self.difference(other, largest, smallest, increment, mode, true)
    }
    fn difference(
        &self,
        other: &Self,
        largest: ZonedUnit,
        smallest: ZonedUnit,
        increment: u32,
        mode: RoundingMode,
        since: bool,
    ) -> Result<Duration, Error> {
        if largest <= ZonedUnit::Day && self.time_zone() != other.time_zone() {
            return Err(Error::InvalidDateTime);
        }
        difference(
            self,
            other.instant().epoch_nanoseconds(),
            largest,
            smallest,
            increment,
            mode,
            since,
        )
    }
}

impl<Z: TimeZone + Clone> RelativeAnchor for ZonedDateTime<Z> {
    const ZONED: bool = true;
    fn origin(&self) -> i128 {
        self.instant().epoch_nanoseconds()
    }
    fn date_at(&self, value: i128) -> Result<i64, Error> {
        Ok(ZonedDateTime::new(
            Instant::from_epoch_nanoseconds(value)?,
            self.time_zone().clone(),
        )
        .local()?
        .date()
        .epoch_day())
    }
    fn endpoint(&self, fields: [i128; 10]) -> Result<i128, Error> {
        Ok(self
            .checked_add(Duration::new(fields)?, Overflow::Constrain)?
            .instant()
            .epoch_nanoseconds())
    }
    fn clock_at(&self, value: i128) -> Result<i128, Error> {
        Ok(ZonedDateTime::new(
            Instant::from_epoch_nanoseconds(value)?,
            self.time_zone().clone(),
        )
        .local()?
        .time()
        .nanoseconds())
    }
}

use crate::calendar_difference::{RelativeAnchor, difference, validate_options};
use crate::{
    CalendarProvider, Duration, Error, Instant, Overflow, RoundingMode, TimeZone, ZonedDateTime,
    ZonedUnit,
};

impl<Z: TimeZone + Clone + PartialEq, C: CalendarProvider> ZonedDateTime<Z, C> {
    // Proposal comparison §6.3.37 step 3: Dispatch typed until to zoned difference.
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
    // Proposal comparison §6.3.38 step 3: Dispatch typed since to zoned difference.
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
    // Proposal comparison §6.5.9 steps 2, 7–9: Check typed calendar and date-unit zone equality, then take the difference.
    fn difference(
        &self,
        other: &Self,
        largest: ZonedUnit,
        smallest: ZonedUnit,
        increment: u32,
        mode: RoundingMode,
        since: bool,
    ) -> Result<Duration, Error> {
        if self.calendar_id() != other.calendar_id() {
            return Err(Error::InvalidDateTime);
        }
        validate_options(largest, smallest, increment)?;
        if largest <= ZonedUnit::Day && self.time_zone() != other.time_zone() {
            return Err(Error::InvalidDateTime);
        }
        if self.instant() == other.instant() {
            return Duration::new([0; 10]);
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

impl<Z: TimeZone + Clone, C: CalendarProvider> RelativeAnchor for ZonedDateTime<Z, C> {
    type Calendar = C;
    // Proposal comparison §6.5.6 step 14: Supply the provider used for calendar date difference.
    fn calendar(&self) -> C {
        self.calendar()
    }
    const ZONED: bool = true;
    // Proposal comparison §6.5.7 steps 2 and 5: Supply the anchor instant in exact nanoseconds.
    fn origin(&self) -> i128 {
        self.instant().epoch_nanoseconds()
    }
    // Proposal comparison §6.5.6 steps 2–4: Project an exact instant to its local ISO day.
    fn date_at(&self, value: i128) -> Result<i64, Error> {
        Ok(ZonedDateTime::new(
            Instant::from_epoch_nanoseconds(value)?,
            self.time_zone().clone(),
        )
        .local()?
        .date()
        .epoch_day())
    }
    // Proposal comparison §6.5.5 steps 3, 6 and 7: Supply exact constrained zoned endpoints for relative arithmetic.
    fn endpoint(&self, fields: [i128; 10]) -> Result<i128, Error> {
        Ok(self
            .checked_add(Duration::new(fields)?, Overflow::Constrain)?
            .instant()
            .epoch_nanoseconds())
    }
    // Proposal comparison §6.5.6 step 8: Project the local clock for time difference.
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

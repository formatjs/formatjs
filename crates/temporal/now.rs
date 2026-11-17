use crate::{
    Error, Instant, MAX_EPOCH_NANOSECONDS, PlainDate, PlainDateTime, PlainTime, TimeZone,
    ZonedDateTime,
};

/// Host wall clock, separate from monotonic performance timers.
pub trait SystemClock {
    fn epoch_nanoseconds(&self) -> i128;
}

pub struct Now<C>(C);
impl<C: SystemClock> Now<C> {
    pub const fn new(clock: C) -> Self {
        Self(clock)
    }
    pub fn instant(&self) -> Instant {
        Instant::from_epoch_nanoseconds(
            self.0
                .epoch_nanoseconds()
                .clamp(-MAX_EPOCH_NANOSECONDS, MAX_EPOCH_NANOSECONDS),
        )
        .unwrap()
    }
    pub fn zoned_date_time_iso<Z: TimeZone>(&self, zone: Z) -> ZonedDateTime<Z> {
        ZonedDateTime::new(self.instant(), zone)
    }
    pub fn plain_date_time_iso<Z: TimeZone>(&self, zone: Z) -> Result<PlainDateTime, Error> {
        self.zoned_date_time_iso(zone).local()
    }
    pub fn plain_date_iso<Z: TimeZone>(&self, zone: Z) -> Result<PlainDate, Error> {
        Ok(self.plain_date_time_iso(zone)?.date())
    }
    pub fn plain_time_iso<Z: TimeZone>(&self, zone: Z) -> Result<PlainTime, Error> {
        Ok(self.plain_date_time_iso(zone)?.time())
    }
}

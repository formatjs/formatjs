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
    // Proposal comparison §2.3.1 step 1: Supply the injected source of current epoch nanoseconds.
    pub const fn new(clock: C) -> Self {
        Self(clock)
    }
    // Proposal comparison §2.3.1 steps 1–2 and §2.2.2 step 2: Read and clamp the injected clock.
    pub fn instant(&self) -> Instant {
        Instant::from_epoch_nanoseconds(
            self.0
                .epoch_nanoseconds()
                .clamp(-MAX_EPOCH_NANOSECONDS, MAX_EPOCH_NANOSECONDS),
        )
        .unwrap()
    }
    // Proposal comparison §2.2.4 steps 3–4: Read the instant and wrap it with the supplied zone and ISO calendar.
    pub fn zoned_date_time_iso<Z: TimeZone>(&self, zone: Z) -> ZonedDateTime<Z> {
        ZonedDateTime::new(self.instant(), zone)
    }
    // Proposal comparison §2.2.3 steps 1–2: Project the injected clock into a local ISO date-time.
    pub fn plain_date_time_iso<Z: TimeZone>(&self, zone: Z) -> Result<PlainDateTime, Error> {
        self.zoned_date_time_iso(zone).local()
    }
    // Proposal comparison §2.2.5 step 2: Take the ISO date from the current local date-time.
    pub fn plain_date_iso<Z: TimeZone>(&self, zone: Z) -> Result<PlainDate, Error> {
        Ok(self.plain_date_time_iso(zone)?.date())
    }
    // Proposal comparison §2.2.6 step 2: Take the time from the current local date-time.
    pub fn plain_time_iso<Z: TimeZone>(&self, zone: Z) -> Result<PlainTime, Error> {
        Ok(self.plain_date_time_iso(zone)?.time())
    }
}

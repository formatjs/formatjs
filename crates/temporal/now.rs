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
        // https://tc39.es/proposal-temporal/#sec-hostsystemutcepochnanoseconds
        // Host steps 1–2: sample once and clamp before creating the instant.
        // Now.instant steps 1–2: i128 represents the mathematical nanoseconds;
        // construction cannot fail after clamping.
        Instant::from_epoch_nanoseconds(
            self.0
                .epoch_nanoseconds()
                .clamp(-MAX_EPOCH_NANOSECONDS, MAX_EPOCH_NANOSECONDS),
        )
        .unwrap()
    }
    pub fn zoned_date_time_iso<Z: TimeZone>(&self, zone: Z) -> ZonedDateTime<Z> {
        // Now.zonedDateTimeISO 1–2 are the caller's zone-selection boundary.
        // Steps 3–4: sample the clock, then construct in the ISO calendar.
        ZonedDateTime::new(self.instant(), zone)
    }
    pub fn plain_date_time_iso<Z: TimeZone>(&self, zone: Z) -> Result<PlainDateTime, Error> {
        // Now.plainDateTimeISO 1–2: project the sampled instant into the
        // supplied zone and return its ISO date and time.
        self.zoned_date_time_iso(zone).local()
    }
    pub fn plain_date_iso<Z: TimeZone>(&self, zone: Z) -> Result<PlainDate, Error> {
        // Now.plainDateISO 1–2: resolve local date-time once, keep its date.
        Ok(self.plain_date_time_iso(zone)?.date())
    }
    pub fn plain_time_iso<Z: TimeZone>(&self, zone: Z) -> Result<PlainTime, Error> {
        // Now.plainTimeISO 1–2: resolve local date-time once, keep its time.
        Ok(self.plain_date_time_iso(zone)?.time())
    }
}

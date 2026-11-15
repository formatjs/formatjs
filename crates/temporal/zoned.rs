use crate::{Duration, Error, Instant, IsoDateTime, NANOSECONDS_PER_DAY, Overflow, PlainDateTime};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Disambiguation {
    Compatible,
    Earlier,
    Later,
    Reject,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum TransitionDirection {
    Next,
    Previous,
}

/// Offsets are exact nanoseconds; visit every offset represented by this zone.
pub trait TimeZone {
    fn offset_nanoseconds(&self, instant: Instant) -> i128;
    fn visit_offsets(&self, visitor: &mut dyn FnMut(i128));
    fn transition(&self, instant: Instant, direction: TransitionDirection) -> Option<Instant>;
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct FixedOffset(i128);
impl FixedOffset {
    pub fn new(nanoseconds: i128) -> Result<Self, Error> {
        if nanoseconds <= -NANOSECONDS_PER_DAY || nanoseconds >= NANOSECONDS_PER_DAY {
            return Err(Error::InvalidDateTime);
        }
        Ok(Self(nanoseconds))
    }
}
impl TimeZone for FixedOffset {
    fn transition(&self, _: Instant, _: TransitionDirection) -> Option<Instant> {
        None
    }
    fn offset_nanoseconds(&self, _: Instant) -> i128 {
        self.0
    }
    fn visit_offsets(&self, visitor: &mut dyn FnMut(i128)) {
        visitor(self.0)
    }
}

#[derive(Clone, Debug)]
pub struct ZonedDateTime<Z> {
    instant: Instant,
    time_zone: Z,
}
impl<Z: TimeZone> ZonedDateTime<Z> {
    pub const fn new(instant: Instant, time_zone: Z) -> Self {
        Self { instant, time_zone }
    }
    pub const fn instant(&self) -> Instant {
        self.instant
    }
    pub const fn time_zone(&self) -> &Z {
        &self.time_zone
    }
    pub fn local(&self) -> Result<PlainDateTime, Error> {
        PlainDateTime::from_epoch_nanoseconds(
            self.instant.epoch_nanoseconds() + self.time_zone.offset_nanoseconds(self.instant),
        )
    }
    pub fn from_local(
        fields: IsoDateTime,
        time_zone: Z,
        disambiguation: Disambiguation,
    ) -> Result<Self, Error> {
        let instant = resolve_local(fields, &time_zone, disambiguation)?;
        Ok(Self::new(instant, time_zone))
    }
}
impl<Z: TimeZone + Clone> ZonedDateTime<Z> {
    pub fn transition(&self, direction: TransitionDirection) -> Option<Self> {
        self.time_zone
            .transition(self.instant, direction)
            .map(|instant| Self::new(instant, self.time_zone.clone()))
    }
    pub fn checked_add(&self, duration: Duration, overflow: Overflow) -> Result<Self, Error> {
        let fields = duration.fields();
        let mut value = self.instant;
        if fields[..4].iter().any(|field| *field != 0) {
            let mut calendar = [0; 10];
            calendar[..4].copy_from_slice(&fields[..4]);
            let local = self
                .local()?
                .checked_add(Duration::new(calendar)?, overflow)?;
            value = resolve_local(local.fields(), &self.time_zone, Disambiguation::Compatible)?;
        }
        let mut clock = fields;
        clock[..4].fill(0);
        let result = Instant::from_epoch_nanoseconds(
            value.epoch_nanoseconds() + Duration::new(clock)?.time_nanoseconds(false)?,
        )?;
        Ok(Self::new(result, self.time_zone.clone()))
    }
    pub fn checked_subtract(&self, duration: Duration, overflow: Overflow) -> Result<Self, Error> {
        self.checked_add(duration.negated(), overflow)
    }
}
fn resolve_local<Z: TimeZone>(
    fields: IsoDateTime,
    zone: &Z,
    disambiguation: Disambiguation,
) -> Result<Instant, Error> {
    let local = fields.to_epoch_nanoseconds()?;
    let mut first: Option<i128> = None;
    let mut last: Option<i128> = None;
    zone.visit_offsets(&mut |offset| {
        if offset <= -NANOSECONDS_PER_DAY || offset >= NANOSECONDS_PER_DAY {
            return;
        }
        let candidate = local - offset;
        if let Ok(instant) = Instant::from_epoch_nanoseconds(candidate) {
            if zone.offset_nanoseconds(instant) == offset {
                first = Some(first.map_or(candidate, |old| old.min(candidate)));
                last = Some(last.map_or(candidate, |old| old.max(candidate)));
            }
        }
    });
    if let (Some(first), Some(last)) = (first, last) {
        if first != last && disambiguation == Disambiguation::Reject {
            return Err(Error::InvalidDateTime);
        }
        return Instant::from_epoch_nanoseconds(if disambiguation == Disambiguation::Later {
            last
        } else {
            first
        });
    }
    if disambiguation == Disambiguation::Reject {
        return Err(Error::InvalidDateTime);
    }
    let mut minimum = i128::MAX;
    let mut maximum = i128::MIN;
    zone.visit_offsets(&mut |offset| {
        minimum = minimum.min(offset);
        maximum = maximum.max(offset);
    });
    let lower = (local - maximum).max(-crate::MAX_EPOCH_NANOSECONDS);
    let upper = (local - minimum).min(crate::MAX_EPOCH_NANOSECONDS);
    let mut cursor =
        Instant::from_epoch_nanoseconds((lower - 1).max(-crate::MAX_EPOCH_NANOSECONDS))?;
    while let Some(event) = zone.transition(cursor, TransitionDirection::Next) {
        let value = event.epoch_nanoseconds();
        if value > upper || value <= cursor.epoch_nanoseconds() {
            break;
        }
        let before = zone.offset_nanoseconds(Instant::from_epoch_nanoseconds(value - 1)?);
        let after = zone.offset_nanoseconds(event);
        if after > before && local >= value + before && local < value + after {
            return Instant::from_epoch_nanoseconds(
                local
                    - if disambiguation == Disambiguation::Earlier {
                        after
                    } else {
                        before
                    },
            );
        }
        cursor = event;
    }
    Err(Error::InvalidDateTime)
}

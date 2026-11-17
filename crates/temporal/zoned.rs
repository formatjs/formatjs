use crate::{
    CalendarProvider, DateTimeFields, Duration, Error, Instant, IsoDateTime, NANOSECONDS_PER_DAY,
    OffsetInput, OffsetOption, Overflow, PlainDateTime, PlainTime, ZonedParseOptions,
};

#[derive(Clone, Copy, Debug, Default)]
pub struct ZonedFields<'a> {
    pub date_time: DateTimeFields<'a>,
    /// Offset hint in nanoseconds; defaults to the source offset.
    pub offset: Option<i128>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct ZonedWithOptions {
    pub disambiguation: Disambiguation,
    pub offset: OffsetOption,
    pub overflow: Overflow,
}
impl Default for ZonedWithOptions {
    fn default() -> Self {
        Self {
            disambiguation: Disambiguation::Compatible,
            offset: OffsetOption::Prefer,
            overflow: Overflow::Constrain,
        }
    }
}

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
    /// Include candidate offsets and both sides of any containing gap/fold.
    /// Extra offsets are allowed; the default scans the full history.
    fn visit_offsets_at(&self, _local_nanoseconds: i128, visitor: &mut dyn FnMut(i128)) {
        self.visit_offsets(visitor);
    }
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
pub struct ZonedDateTime<Z, C = crate::calendar::Calendar> {
    instant: Instant,
    time_zone: Z,
    calendar: C,
}
impl<Z: TimeZone> ZonedDateTime<Z> {
    pub const fn new(instant: Instant, time_zone: Z) -> Self {
        Self {
            instant,
            time_zone,
            calendar: crate::calendar::Calendar::Iso8601,
        }
    }
    pub fn from_local(
        fields: IsoDateTime,
        time_zone: Z,
        disambiguation: Disambiguation,
    ) -> Result<Self, Error> {
        Ok(Self::new(
            resolve_local(fields, &time_zone, disambiguation)?,
            time_zone,
        ))
    }
}
impl<Z: TimeZone, C: CalendarProvider> ZonedDateTime<Z, C> {
    pub const fn new_in_calendar(instant: Instant, time_zone: Z, calendar: C) -> Self {
        Self {
            instant,
            time_zone,
            calendar,
        }
    }
    pub const fn calendar(&self) -> C {
        self.calendar
    }
    pub fn calendar_id(&self) -> &'static str {
        self.calendar.id()
    }
    pub const fn instant(&self) -> Instant {
        self.instant
    }
    pub const fn time_zone(&self) -> &Z {
        &self.time_zone
    }
    pub fn with_time_zone<T: TimeZone>(&self, time_zone: T) -> ZonedDateTime<T, C> {
        ZonedDateTime::new_in_calendar(self.instant, time_zone, self.calendar)
    }
    pub fn local(&self) -> Result<PlainDateTime<C>, Error> {
        PlainDateTime::from_epoch_nanoseconds_in(
            self.instant.epoch_nanoseconds() + self.time_zone.offset_nanoseconds(self.instant),
            self.calendar,
        )
    }
    pub fn from_local_in_calendar(
        fields: IsoDateTime,
        time_zone: Z,
        disambiguation: Disambiguation,
        calendar: C,
    ) -> Result<Self, Error> {
        let instant = resolve_local(fields, &time_zone, disambiguation)?;
        Ok(Self::new_in_calendar(instant, time_zone, calendar))
    }
}
impl<Z: TimeZone + Clone, C: CalendarProvider> ZonedDateTime<Z, C> {
    pub fn with_fields(
        &self,
        fields: ZonedFields<'_>,
        options: ZonedWithOptions,
    ) -> Result<Self, Error> {
        let has_date_time = fields.date_time.date.has_fields(self.calendar_id())
            || !fields.date_time.time.is_empty();
        if !has_date_time && fields.offset.is_none() {
            return Err(Error::InvalidDateTime);
        }
        let current = self.local()?;
        let local = if has_date_time {
            current.with_fields(fields.date_time, options.overflow)?
        } else {
            current
        };
        Self::from_local_with_offset(
            local.fields(),
            self.time_zone.clone(),
            self.calendar,
            OffsetInput::Exact(
                fields
                    .offset
                    .unwrap_or_else(|| self.time_zone.offset_nanoseconds(self.instant)),
            ),
            ZonedParseOptions {
                disambiguation: options.disambiguation,
                offset: options.offset,
            },
        )
    }
    pub fn with_calendar<D: CalendarProvider>(&self, calendar: D) -> ZonedDateTime<Z, D> {
        ZonedDateTime::new_in_calendar(self.instant, self.time_zone.clone(), calendar)
    }
    pub fn with_time(&self, time: Option<PlainTime>) -> Result<Self, Error> {
        match time {
            None => self.start_of_day(),
            Some(time) => Self::from_local_in_calendar(
                self.local()?.with_time(time)?.fields(),
                self.time_zone.clone(),
                Disambiguation::Compatible,
                self.calendar,
            ),
        }
    }
    pub fn start_of_day(&self) -> Result<Self, Error> {
        let day = self.local()?.date().epoch_day();
        Ok(Self::new_in_calendar(
            self.day_boundary(day)?,
            self.time_zone.clone(),
            self.calendar,
        ))
    }
    pub fn hours_in_day(&self) -> Result<f64, Error> {
        let day = self.local()?.date().epoch_day();
        Ok((self.day_boundary(day + 1)?.epoch_nanoseconds()
            - self.day_boundary(day)?.epoch_nanoseconds()) as f64
            / 3_600_000_000_000.0)
    }
    pub fn round(
        &self,
        unit: crate::DateTimeUnit,
        increment: u32,
        mode: crate::RoundingMode,
    ) -> Result<Self, Error> {
        let instant = if unit == crate::DateTimeUnit::Day {
            if increment != 1 {
                return Err(Error::InvalidRoundingOptions);
            }
            let day = self.local()?.date().epoch_day();
            let start = self.day_boundary(day)?.epoch_nanoseconds();
            let end = self.day_boundary(day + 1)?.epoch_nanoseconds();
            let current = self.instant.epoch_nanoseconds().min(end - 1);
            Instant::from_epoch_nanoseconds(
                start + crate::rounding::round_instant(current - start, end - start, mode),
            )?
        } else {
            let time = unit.time().ok_or(Error::InvalidRoundingOptions)?;
            let rounded = self.local()?.round(time, increment, mode)?;
            let offset = self.time_zone.offset_nanoseconds(self.instant);
            let preferred = Instant::from_epoch_nanoseconds(rounded.epoch_nanoseconds() - offset);
            if let Ok(value) = preferred {
                if self.time_zone.offset_nanoseconds(value) == offset {
                    return Ok(Self::new_in_calendar(
                        value,
                        self.time_zone.clone(),
                        self.calendar,
                    ));
                }
            }
            resolve_local(
                rounded.fields(),
                &self.time_zone,
                Disambiguation::Compatible,
            )?
        };
        Ok(Self::new_in_calendar(
            instant,
            self.time_zone.clone(),
            self.calendar,
        ))
    }
    pub(crate) fn day_boundary(&self, day: i64) -> Result<Instant, Error> {
        day_boundary(day, &self.time_zone)
    }
    pub fn transition(&self, direction: TransitionDirection) -> Option<Self> {
        self.time_zone
            .transition(self.instant, direction)
            .map(|instant| Self::new_in_calendar(instant, self.time_zone.clone(), self.calendar))
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
        Ok(Self::new_in_calendar(
            result,
            self.time_zone.clone(),
            self.calendar,
        ))
    }
    pub fn checked_subtract(&self, duration: Duration, overflow: Overflow) -> Result<Self, Error> {
        self.checked_add(duration.negated(), overflow)
    }
}
pub(crate) fn visit_possible_instants<Z: TimeZone>(
    fields: IsoDateTime,
    zone: &Z,
    visitor: &mut dyn FnMut(Instant),
) -> Result<(), Error> {
    let local = fields.to_epoch_nanoseconds()?;
    zone.visit_offsets_at(local, &mut |offset| {
        if offset <= -NANOSECONDS_PER_DAY || offset >= NANOSECONDS_PER_DAY {
            return;
        }
        let candidate = local - offset;
        if let Ok(instant) = Instant::from_epoch_nanoseconds(candidate) {
            if zone.offset_nanoseconds(instant) == offset {
                visitor(instant);
            }
        }
    });
    Ok(())
}

pub(crate) fn day_boundary<Z: TimeZone>(day: i64, zone: &Z) -> Result<Instant, Error> {
    let midnight = i128::from(day) * NANOSECONDS_PER_DAY;
    let fields = IsoDateTime::from_epoch_nanoseconds(midnight)?;
    let candidate = resolve_local(fields, zone, Disambiguation::Compatible)?;
    if candidate.epoch_nanoseconds() + zone.offset_nanoseconds(candidate) == midnight {
        return Ok(candidate);
    }
    let mut cursor = candidate;
    while cursor.epoch_nanoseconds() >= midnight - NANOSECONDS_PER_DAY {
        let value = cursor.epoch_nanoseconds();
        if value > -crate::MAX_EPOCH_NANOSECONDS {
            let before = zone.offset_nanoseconds(Instant::from_epoch_nanoseconds(value - 1)?);
            let after = zone.offset_nanoseconds(cursor);
            if after > before && midnight >= value + before && midnight < value + after {
                return Ok(cursor);
            }
        }
        let Some(previous) = zone.transition(cursor, TransitionDirection::Previous) else {
            break;
        };
        if previous.epoch_nanoseconds() >= value {
            break;
        }
        cursor = previous;
    }
    Err(Error::InvalidDateTime)
}

pub(crate) fn resolve_local<Z: TimeZone>(
    fields: IsoDateTime,
    zone: &Z,
    disambiguation: Disambiguation,
) -> Result<Instant, Error> {
    let mut first: Option<i128> = None;
    let mut last: Option<i128> = None;
    visit_possible_instants(fields, zone, &mut |instant| {
        let candidate = instant.epoch_nanoseconds();
        first = Some(first.map_or(candidate, |old| old.min(candidate)));
        last = Some(last.map_or(candidate, |old| old.max(candidate)));
    })?;
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
    let local = fields.to_epoch_nanoseconds()?;
    let mut minimum = i128::MAX;
    let mut maximum = i128::MIN;
    zone.visit_offsets_at(local, &mut |offset| {
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

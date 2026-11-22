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
    // Proposal comparison §6.3.31 steps 20–22: Supply typed zoned with defaults.
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
    // Proposal comparison §11.1.13 step 3.a: Fall back to full offset enumeration for candidates.
    fn visit_offsets_at(&self, _local_nanoseconds: i128, visitor: &mut dyn FnMut(i128)) {
        self.visit_offsets(visitor);
    }
    /// Return whether an exact round-trip candidate lies outside the Instant range.
    ///
    /// Called with supported local times and their disambiguation shifts.
    /// Providers that can look up offsets beyond either limit can override
    /// this method. The default preserves bounded candidate enumeration.
    fn has_out_of_range_candidate(&self, _local_nanoseconds: i128) -> bool {
        false
    }
    /// Return the first reachable local time after a gap, including raw epochs.
    ///
    /// Override only when the provider covers the complete candidate window,
    /// including epochs outside the Instant range. The default uses the
    /// bounded day-start fallback.
    fn nearest_local_after(&self, _local_nanoseconds: i128) -> Option<i128> {
        None
    }
    /// Return the reachable local times immediately before and after a gap.
    ///
    /// Override only when the provider can include raw epochs outside the
    /// Instant range. The default retains bounded gap disambiguation.
    fn nearest_gap_boundaries(&self, _local_nanoseconds: i128) -> Option<(i128, i128)> {
        None
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
    // Proposal comparison §6.3.46 step 8: Fixed offsets have no transition.
    fn transition(&self, _: Instant, _: TransitionDirection) -> Option<Instant> {
        None
    }
    // Proposal comparison §11.1.9 step 2: Return the stored fixed offset in nanoseconds.
    fn offset_nanoseconds(&self, _: Instant) -> i128 {
        self.0
    }
    // Proposal comparison §11.1.13 step 2.a: Supply the only offset for a fixed-zone candidate.
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
    // Proposal comparison §6.5.3 steps 4–6: Store a typed instant and zone with the ISO calendar.
    pub const fn new(instant: Instant, time_zone: Z) -> Self {
        Self {
            instant,
            time_zone,
            calendar: crate::calendar::Calendar::Iso8601,
        }
    }
    // Proposal comparison §11.1.11 steps 1–2: Resolve an ISO local date-time before storing it.
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
    // Proposal comparison §6.5.3 steps 4–6: Store the typed instant, zone and calendar.
    pub const fn new_in_calendar(instant: Instant, time_zone: Z, calendar: C) -> Self {
        Self {
            instant,
            time_zone,
            calendar,
        }
    }
    // Proposal comparison §6.3.31 step 6: Read the stored calendar provider.
    pub const fn calendar(&self) -> C {
        self.calendar
    }
    // Proposal comparison §6.3.3 step 3: Return the stored calendar provider ID.
    pub fn calendar_id(&self) -> &'static str {
        self.calendar.id()
    }
    // Proposal comparison §6.3.47 step 3: Return the typed instant stored by the zoned value.
    pub const fn instant(&self) -> Instant {
        self.instant
    }
    // Proposal comparison §6.3.46 step 3: Read the stored zone provider.
    pub const fn time_zone(&self) -> &Z {
        &self.time_zone
    }
    // Proposal comparison §6.3.33 step 4: Replace the typed zone while preserving instant and calendar.
    pub fn with_time_zone<T: TimeZone>(&self, time_zone: T) -> ZonedDateTime<T, C> {
        ZonedDateTime::new_in_calendar(self.instant, time_zone, self.calendar)
    }
    // Proposal comparison §11.1.10 steps 1–3: Project the exact instant into local date-time.
    pub fn local(&self) -> Result<PlainDateTime<C>, Error> {
        PlainDateTime::from_epoch_nanoseconds_in(
            self.instant.epoch_nanoseconds() + self.time_zone.offset_nanoseconds(self.instant),
            self.calendar,
        )
    }
    // Proposal comparison §11.1.11 steps 1–2 and §6.5.3 steps 4–6: Resolve a typed local date-time and store its calendar.
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
    // Proposal comparison §6.3.31 steps 18, 23 and 25–26: Merge typed fields and resolve with an exact offset hint.
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
    // Proposal comparison §6.3.34 step 4: Replace the typed calendar while preserving instant and zone.
    pub fn with_calendar<D: CalendarProvider>(&self, calendar: D) -> ZonedDateTime<Z, D> {
        ZonedDateTime::new_in_calendar(self.instant, self.time_zone.clone(), calendar)
    }
    // Proposal comparison §6.3.32 steps 6.a, 7.b–7.c and 8: Replace the local clock or use start of day.
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
    // Proposal comparison §6.3.45 steps 5–7: Resolve the start of the current local day.
    pub fn start_of_day(&self) -> Result<Self, Error> {
        let day = self.local()?.date().epoch_day();
        Ok(Self::new_in_calendar(
            self.day_boundary(day)?,
            self.time_zone.clone(),
            self.calendar,
        ))
    }
    // Proposal comparison §6.3.23 steps 5–10: Take the span between consecutive local day boundaries in hours.
    pub fn hours_in_day(&self) -> Result<f64, Error> {
        let day = self.local()?.date().epoch_day();
        Ok((self.day_boundary(day + 1)?.epoch_nanoseconds()
            - self.day_boundary(day)?.epoch_nanoseconds()) as f64
            / 3_600_000_000_000.0)
    }
    // Proposal comparison §6.3.39 steps 19.c, 19.e, 19.i and 20.a–20.c: Supply typed zoned rounding branches.
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
            crate::time::validate_increment(time, increment)?;
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
    // Proposal comparison §6.3.45 step 6: Delegate day boundary lookup for the stored zone.
    pub(crate) fn day_boundary(&self, day: i64) -> Result<Instant, Error> {
        day_boundary(day, &self.time_zone)
    }
    // Proposal comparison §6.3.46 steps 9.a, 10.b and 11–12: Query a typed transition and preserve zone and calendar.
    pub fn transition(&self, direction: TransitionDirection) -> Option<Self> {
        self.time_zone
            .transition(self.instant, direction)
            .map(|instant| Self::new_in_calendar(instant, self.time_zone.clone(), self.calendar))
    }
    // Proposal comparison §6.5.5 steps 1, 3, 6 and 7: Add date units locally and clock units on the instant.
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
    // Proposal comparison §6.5.10 steps 2 and 8: Negate the typed duration and delegate zoned addition.
    pub fn checked_subtract(&self, duration: Duration, overflow: Overflow) -> Result<Self, Error> {
        self.checked_add(duration.negated(), overflow)
    }
}
// Proposal comparison §11.1.13 step 3.a: Convert typed ISO fields before visiting candidate instants.
pub(crate) fn visit_possible_instants<Z: TimeZone>(
    fields: IsoDateTime,
    zone: &Z,
    visitor: &mut dyn FnMut(Instant),
) -> Result<(), Error> {
    visit_possible_nanoseconds(fields.to_epoch_nanoseconds()?, zone, visitor)
}
// Proposal comparison §11.1.13 steps 3.a, 4.a: Check all candidate ranges before selection.
pub(crate) fn visit_possible_nanoseconds<Z: TimeZone>(
    local: i128,
    zone: &Z,
    visitor: &mut dyn FnMut(Instant),
) -> Result<(), Error> {
    if zone.has_out_of_range_candidate(local) {
        return Err(Error::OutOfRange);
    }
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

// Proposal comparison §11.1.12 steps 2, 3.a–3.b, 9 and 11.
// Track the first and last distinct candidate instants.
fn local_candidate_bounds<Z: TimeZone>(
    local: i128,
    zone: &Z,
) -> Result<Option<(i128, i128)>, Error> {
    let mut first: Option<i128> = None;
    let mut last: Option<i128> = None;
    visit_possible_nanoseconds(local, zone, &mut |instant| {
        let candidate = instant.epoch_nanoseconds();
        first = Some(first.map_or(candidate, |old| old.min(candidate)));
        last = Some(last.map_or(candidate, |old| old.max(candidate)));
    })?;
    Ok(first.zip(last))
}

// Proposal comparison §11.1.14 steps 1–3, 5–7: Select midnight or the nearest later local time.
pub(crate) fn day_boundary<Z: TimeZone>(day: i64, zone: &Z) -> Result<Instant, Error> {
    let midnight = i128::from(day) * NANOSECONDS_PER_DAY;
    crate::iso::check_local(midnight)?;
    if let Some((first, _)) = local_candidate_bounds(midnight, zone)? {
        return Instant::from_epoch_nanoseconds(first);
    }
    let lower = midnight - NANOSECONDS_PER_DAY;
    let mut upper = midnight + 3 * NANOSECONDS_PER_DAY;
    let clipped = upper > crate::MAX_EPOCH_NANOSECONDS;
    upper = upper.min(crate::MAX_EPOCH_NANOSECONDS);
    let nearest = if lower >= -crate::MAX_EPOCH_NANOSECONDS
        && midnight + NANOSECONDS_PER_DAY < crate::MAX_EPOCH_NANOSECONDS
    {
        let mut cursor = Instant::from_epoch_nanoseconds(lower)?;
        let mut nearest = None;
        // Proposal comparison §11.1.14 step 5. At midnight plus one day,
        // the offset projects to a local time within two days of midnight.
        while let Some(next) = zone.transition(cursor, TransitionDirection::Next) {
            let value = next.epoch_nanoseconds();
            if next <= cursor || value >= upper {
                break;
            }
            cursor = next;
            let offset = zone.offset_nanoseconds(next);
            if offset <= -NANOSECONDS_PER_DAY || offset >= NANOSECONDS_PER_DAY {
                continue;
            }
            let local = value + offset;
            if local > midnight && nearest.is_none_or(|previous| local < previous) {
                nearest = Some(local);
                upper = upper.min(local + NANOSECONDS_PER_DAY);
            }
        }
        // Proposal comparison §11.1.14 step 5: Exclude earlier local times beyond the scan.
        nearest
            .filter(|local| !clipped || local + NANOSECONDS_PER_DAY <= crate::MAX_EPOCH_NANOSECONDS)
    } else {
        None
    };
    // Proposal comparison §11.1.14 step 5: Include raw starts when either limit clips the search.
    let nearest = nearest.or_else(|| {
        if lower >= -crate::MAX_EPOCH_NANOSECONDS && !clipped {
            return None;
        }
        zone.nearest_local_after(midnight)
            .filter(|&local| midnight < local && local < midnight + 2 * NANOSECONDS_PER_DAY)
    });
    // Proposal comparison §11.1.14 steps 6–7: Return the sole candidate if representable.
    if let Some(local) = nearest
        && let Some((first, last)) = local_candidate_bounds(local, zone)?
        && first == last
    {
        return Instant::from_epoch_nanoseconds(first);
    }
    // Preserve fallback behavior when the bounded search cannot confirm the nearest local time.
    let candidate = resolve_local_nanoseconds(midnight, zone, Disambiguation::Compatible)?;
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

// Proposal comparison §11.1.11 steps 1–2: Convert local fields and delegate candidate disambiguation.
pub(crate) fn resolve_local<Z: TimeZone>(
    fields: IsoDateTime,
    zone: &Z,
    disambiguation: Disambiguation,
) -> Result<Instant, Error> {
    resolve_local_nanoseconds(fields.to_epoch_nanoseconds()?, zone, disambiguation)
}
// Proposal comparison §11.1.12 steps 2, 3.a–3.d and 5: Select the requested candidate or apply reject.
pub(crate) fn resolve_local_nanoseconds<Z: TimeZone>(
    local: i128,
    zone: &Z,
    disambiguation: Disambiguation,
) -> Result<Instant, Error> {
    if let Some((first, last)) = local_candidate_bounds(local, zone)? {
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
    let earlier = disambiguation == Disambiguation::Earlier;
    let window = 3 * NANOSECONDS_PER_DAY;
    let lower = local - window;
    let upper = (local + window).min(crate::MAX_EPOCH_NANOSECONDS);
    let mut cursor =
        Instant::from_epoch_nanoseconds((lower - 1).max(-crate::MAX_EPOCH_NANOSECONDS))?;
    let mut before: Option<i128> = None;
    let mut after: Option<i128> = None;
    let mut fallback = None;
    // Proposal comparison §11.1.12 steps 6–7. Project each nearby segment
    // boundary to find the nearest reachable local time on either side.
    while let Some(event) = zone.transition(cursor, TransitionDirection::Next) {
        let value = event.epoch_nanoseconds();
        if value > upper || value <= cursor.epoch_nanoseconds() {
            break;
        }
        let old_offset = zone.offset_nanoseconds(Instant::from_epoch_nanoseconds(value - 1)?);
        let new_offset = zone.offset_nanoseconds(event);
        let end = value - 1 + old_offset;
        let start = value + new_offset;
        if end < local {
            before = Some(before.map_or(end, |other| other.max(end)));
        }
        if start > local {
            after = Some(after.map_or(start, |other| other.min(start)));
        }
        if fallback.is_none() && local > end && local < start {
            fallback = Some(local - if earlier { new_offset } else { old_offset });
        }
        cursor = event;
    }
    // Proposal comparison §11.1.12 steps 6–7: Include raw boundaries when the minimum clips the scan.
    if lower <= -crate::MAX_EPOCH_NANOSECONDS
        && let Some((raw_before, raw_after)) = zone.nearest_gap_boundaries(local)
    {
        before = Some(raw_before);
        after = Some(raw_after);
    }
    // Proposal comparison §11.1.12 steps 8–15. Derive the shift from
    // the actual singleton candidates at both local boundaries.
    if let (Some(before), Some(after)) = (before, after) {
        if let (Ok(Some((left, left_last))), Ok(Some((right, right_last)))) = (
            local_candidate_bounds(before, zone),
            local_candidate_bounds(after, zone),
        ) {
            let shift = (after - right) - (before - left);
            if left == left_last
                && right == right_last
                && shift != 0
                && shift.abs() <= NANOSECONDS_PER_DAY
            {
                // Proposal comparison §11.1.12 steps 16.e–16.g and 22–25.
                // The shifted local time can itself have multiple candidates.
                let shifted = local + if earlier { -shift } else { shift };
                if let Some((first, last)) = local_candidate_bounds(shifted, zone)? {
                    return Instant::from_epoch_nanoseconds(if earlier { first } else { last });
                }
            }
        }
    }
    // Preserve the existing gap behavior when the boundary assumptions fail.
    Instant::from_epoch_nanoseconds(fallback.ok_or(Error::InvalidDateTime)?)
}

use crate::{
    Error, Instant, MAX_EPOCH_NANOSECONDS, NANOSECONDS_PER_DAY, TimeZone, TransitionDirection,
};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum TransitionRule {
    Month {
        month: u8,
        week: u8,
        weekday: u8,
        seconds: i32,
    },
    Day {
        day: u16,
        seconds: i32,
    },
    Julian {
        day: u16,
        seconds: i32,
    },
}
// Proposal comparison §11.1.9 step 3: Compute the monthly weekday used by a named-zone footer.
fn monthly_day(first: i64, year: i32, month: u8, week: u8, weekday: u8) -> i64 {
    let mut day = i64::from(weekday) - (first + 4).rem_euclid(7);
    // Validated weekdays keep this difference between -6 and 6.
    if day < 0 {
        day += 7;
    }
    day += 7 * i64::from(week - 1);
    let length = match month {
        2 => 28 + i64::from(year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)),
        4 | 6 | 9 | 11 => 30,
        _ => 31,
    };
    if day >= length {
        day -= 7;
    }
    first + day
}
impl TransitionRule {
    // Proposal comparison §11.1.9 step 3: Check the footer rule fields used for named-zone offsets.
    const fn valid(self) -> bool {
        let (valid, seconds) = match self {
            Self::Month {
                month,
                week,
                weekday,
                seconds,
            } => (
                month >= 1 && month <= 12 && week >= 1 && week <= 5 && weekday <= 6,
                seconds,
            ),
            Self::Day { day, seconds } => (day <= 365, seconds),
            Self::Julian { day, seconds } => (day >= 1 && day <= 365, seconds),
        };
        valid && seconds >= -604_799 && seconds <= 604_799
    }
    // Proposal comparison §11.1.9 step 3: Convert a footer rule into local transition seconds.
    fn event(self, year: i32) -> i64 {
        let leap = year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
        let (day, seconds) = match self {
            Self::Month {
                month,
                week,
                weekday,
                seconds,
            } => {
                let first = crate::iso::epoch_day_from_iso(year, month, 1);
                (monthly_day(first, year, month, week, weekday), seconds)
            }
            Self::Day { day, seconds } => (
                crate::iso::epoch_day_from_iso(year, 1, 1) + i64::from(day),
                seconds,
            ),
            Self::Julian { day, seconds } => (
                crate::iso::epoch_day_from_iso(year, 1, 1) + i64::from(day) - 1
                    + i64::from(leap && day >= 60),
                seconds,
            ),
        };
        day * 86_400 + i64::from(seconds)
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct FutureRule {
    standard: i32,
    daylight: Option<(i32, TransitionRule, TransitionRule)>,
}
impl FutureRule {
    // Proposal comparison §11.1.9 step 3: Validate standard and daylight offsets before footer evaluation.
    pub const fn new(
        standard: i32,
        daylight: Option<(i32, TransitionRule, TransitionRule)>,
    ) -> Result<Self, Error> {
        if standard <= -86_400 || standard >= 86_400 {
            return Err(Error::InvalidDateTime);
        }
        if let Some((offset, start, end)) = daylight {
            if offset <= -86_400 || offset >= 86_400 || !start.valid() || !end.valid() {
                return Err(Error::InvalidDateTime);
            }
        }
        Ok(Self { standard, daylight })
    }
    // Proposal comparison §11.1.9 step 3: Convert footer switches to UTC using the prior offsets.
    fn events(self, year: i32) -> Option<(i64, i64)> {
        let (offset, start, end) = self.daylight?;
        Some((
            start.event(year) - i64::from(self.standard),
            end.event(year) - i64::from(offset),
        ))
    }
    // Proposal comparison §6.3.46 steps 9.a and 10.b: Check whether a footer event changes the offset.
    fn changes_at(self, seconds: i64) -> bool {
        let Some((offset, _, _)) = self.daylight else {
            return false;
        };
        if offset == self.standard {
            return false;
        }
        let (year, month, day) = crate::calendar::iso_fields(seconds.div_euclid(86_400));
        // January 1 can put the two instants in different rule-year windows.
        if month == 1 && day == 1 && seconds.rem_euclid(86_400) == 0 {
            return self.offset(seconds) != self.offset(seconds - 1);
        }
        let mut previous = i64::MIN;
        let mut current = i64::MIN;
        let mut was_dst = false;
        let mut is_dst = false;
        for y in year - 1..=year + 1 {
            let (begin, end) = self.events(y).unwrap();
            if begin < seconds && begin >= previous {
                previous = begin;
                was_dst = true;
            }
            if end < seconds && end > previous {
                previous = end;
                was_dst = false;
            }
            if begin <= seconds && begin >= current {
                current = begin;
                is_dst = true;
            }
            if end <= seconds && end > current {
                current = end;
                is_dst = false;
            }
        }
        was_dst != is_dst
    }
    #[cold]
    // Proposal comparison §11.1.9 step 3: Select the offset in the applicable footer year.
    fn offset_current_year(&self, year: i32, seconds: i64, offset: i32) -> i32 {
        let (begin, end) = self.events(year).unwrap();
        let dst = if begin < end {
            seconds >= begin && seconds < end
        } else {
            seconds >= begin || seconds < end
        };
        if dst { offset } else { self.standard }
    }
    #[cold]
    // Proposal comparison §11.1.9 step 3: Resolve the latest footer switch across neighboring years.
    fn offset_near_year(&self, year: i32, seconds: i64, offset: i32) -> i32 {
        let mut latest = i64::MIN;
        let mut dst = false;
        for y in year - 1..=year + 1 {
            let (begin, end) = self.events(y).unwrap();
            if begin <= seconds && begin >= latest {
                latest = begin;
                dst = true;
            }
            if end <= seconds && end > latest {
                latest = end;
                dst = false;
            }
        }
        if dst { offset } else { self.standard }
    }
    // Proposal comparison §11.1.9 step 3: Select named-zone footer offset for epoch seconds.
    fn offset(&self, seconds: i64) -> i32 {
        let Some((offset, start, end)) = self.daylight else {
            return self.standard;
        };
        let utc_day = seconds.div_euclid(86_400);
        let (year, month, day) = crate::calendar::iso_fields(utc_day);
        if let (
            TransitionRule::Month {
                month: first,
                week: start_week,
                weekday: start_weekday,
                seconds: start_seconds,
            },
            TransitionRule::Month {
                month: last,
                week: end_week,
                weekday: end_weekday,
                seconds: end_seconds,
            },
        ) = (start, end)
            && (2..=11).contains(&first)
            && (2..=11).contains(&last)
            && first.abs_diff(last) >= 2
        {
            // Even with seven-day rule times, these events stay ordered in this UTC year.
            let first_day = utc_day - i64::from(day) + 1;
            if month == first {
                let begin = monthly_day(first_day, year, month, start_week, start_weekday) * 86_400
                    + i64::from(start_seconds)
                    - i64::from(self.standard);
                return if seconds >= begin {
                    offset
                } else {
                    self.standard
                };
            }
            if month == last {
                let end = monthly_day(first_day, year, month, end_week, end_weekday) * 86_400
                    + i64::from(end_seconds)
                    - i64::from(offset);
                return if seconds < end { offset } else { self.standard };
            }
            // Rule times and offsets can move events into adjacent months by less than eight days.
            let near_shifted_event = ((month + 1 == first || month + 1 == last) && day > 20)
                || ((month == first + 1 || month == last + 1) && day <= 8);
            if !near_shifted_event {
                let dst = if first < last {
                    month > first && month < last
                } else {
                    month > first || month < last
                };
                return if dst { offset } else { self.standard };
            }
            return self.offset_current_year(year, seconds, offset);
        }
        self.offset_near_year(year, seconds, offset)
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct OffsetTransition {
    pub epoch_seconds: i64,
    pub offset_seconds: i32,
}

/// Borrowed explicit transitions plus an optional recurring TZif footer rule.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct TransitionZone<'a> {
    initial: i32,
    transitions: &'a [OffsetTransition],
    future: Option<FutureRule>,
}
impl<'a> TransitionZone<'a> {
    // Proposal comparison §11.1.9 step 3: Validate offsets and ordered events for named-zone lookup.
    pub const fn new(
        initial: i32,
        transitions: &'a [OffsetTransition],
        future: Option<FutureRule>,
    ) -> Result<Self, Error> {
        if initial <= -86_400 || initial >= 86_400 {
            return Err(Error::InvalidDateTime);
        }
        let mut previous = i64::MIN;
        let mut index = 0;
        while index < transitions.len() {
            let event = &transitions[index];
            if event.epoch_seconds <= previous
                || event.offset_seconds <= -86_400
                || event.offset_seconds >= 86_400
                || (event.epoch_seconds as i128).abs() * 1_000_000_000 > MAX_EPOCH_NANOSECONDS
            {
                return Err(Error::InvalidDateTime);
            }
            previous = event.epoch_seconds;
            index += 1;
        }
        Ok(Self {
            initial,
            transitions,
            future,
        })
    }
    // Proposal comparison §11.1.9 step 3: Mark the final explicit event before footer lookup.
    fn cutoff(self) -> i64 {
        self.transitions
            .last()
            .map_or(i64::MIN, |event| event.epoch_seconds)
    }

    // ECMA-262 §21.4.1.21: Read the named-zone offset at raw epoch seconds.
    fn offset_seconds(&self, seconds: i64) -> i32 {
        if seconds > self.cutoff() {
            if let Some(future) = &self.future {
                return future.offset(seconds);
            }
        }
        let index = self
            .transitions
            .partition_point(|event| event.epoch_seconds <= seconds);
        if index == 0 {
            self.initial
        } else {
            self.transitions[index - 1].offset_seconds
        }
    }

    // ECMA-262 §21.4.1.20: Include initial, explicit and footer candidate offsets.
    fn visit_offset_seconds_window(&self, lower: i128, upper: i128, visitor: &mut dyn FnMut(i128)) {
        let first = self
            .transitions
            .partition_point(|event| i128::from(event.epoch_seconds) <= lower);
        let last = self
            .transitions
            .partition_point(|event| i128::from(event.epoch_seconds) <= upper);
        let initial = if first == 0 {
            self.initial
        } else {
            self.transitions[first - 1].offset_seconds
        };
        let future = if upper > i128::from(self.cutoff()) {
            self.future
        } else {
            None
        };
        visit_distinct_offsets(initial, &self.transitions[first..last], future, visitor);
    }
}
impl TimeZone for TransitionZone<'_> {
    // Proposal comparison §11.1.9 step 3: Look up a named-zone offset with exact instant boundaries.
    fn offset_nanoseconds(&self, instant: Instant) -> i128 {
        let nanoseconds = instant.epoch_nanoseconds();
        let seconds = if let Ok(value) = u64::try_from(nanoseconds) {
            (value / 1_000_000_000) as i64
        } else {
            match i64::try_from(nanoseconds) {
                Ok(value) => value.div_euclid(1_000_000_000),
                Err(_) => {
                    // Split the wide timestamp so both divisions use 64-bit integers.
                    let upper = (nanoseconds >> 32) as i64;
                    let lower = u64::from(nanoseconds as u32);
                    let quotient = upper.div_euclid(1_000_000_000);
                    let remainder = upper.rem_euclid(1_000_000_000) as u64;
                    (quotient << 32) + (((remainder << 32) | lower) / 1_000_000_000) as i64
                }
            }
        };
        i128::from(self.offset_seconds(seconds)) * 1_000_000_000
    }
    // Proposal comparison §11.1.13 step 3.a: Supply the full offset list for named-zone candidate checks.
    fn visit_offsets(&self, visitor: &mut dyn FnMut(i128)) {
        visit_distinct_offsets(self.initial, self.transitions, self.future, visitor);
    }
    // Proposal comparison §11.1.13 step 3.a: Supply offsets near the requested local timestamp.
    fn visit_offsets_at(&self, local: i128, visitor: &mut dyn FnMut(i128)) {
        let seconds = local.div_euclid(1_000_000_000);
        let limit = MAX_EPOCH_NANOSECONDS / 1_000_000_000;
        let lower = (seconds - 86_400).max(-limit);
        let upper = (seconds + 86_400).min(limit);
        if lower > upper {
            self.visit_offsets(visitor);
            return;
        }
        self.visit_offset_seconds_window(lower, upper, visitor);
    }

    // Proposal comparison §11.1.13 steps 3.a, 4.a: Verify the raw candidate before checking its range.
    fn has_out_of_range_candidate(&self, local: i128) -> bool {
        let limit = MAX_EPOCH_NANOSECONDS;
        // A supported local time and its gap shift can each extend one day past an Instant limit.
        let bound = limit + 2 * NANOSECONDS_PER_DAY;
        if !(-bound..=bound).contains(&local)
            || (-limit + NANOSECONDS_PER_DAY..=limit - NANOSECONDS_PER_DAY).contains(&local)
        {
            return false;
        }
        let seconds = local.div_euclid(1_000_000_000);
        let mut found = false;
        self.visit_offset_seconds_window(seconds - 86_400, seconds + 86_400, &mut |offset| {
            let candidate = local - offset;
            if !found && !(-limit..=limit).contains(&candidate) {
                let seconds = candidate.div_euclid(1_000_000_000) as i64;
                found = i128::from(self.offset_seconds(seconds)) * 1_000_000_000 == offset;
            }
        });
        found
    }

    // Proposal comparison §6.3.46 steps 9.a and 10.b: Search strict next or previous offset changes.
    fn transition(&self, instant: Instant, direction: TransitionDirection) -> Option<Instant> {
        let next = direction == TransitionDirection::Next;
        let value = instant.epoch_nanoseconds();
        let mut best: Option<Instant> = None;
        let mut consider = |seconds: i64| {
            let raw = i128::from(seconds) * 1_000_000_000;
            if if next { raw <= value } else { raw >= value } {
                return false;
            }
            if best.is_some_and(|old| {
                if next {
                    raw >= old.epoch_nanoseconds()
                } else {
                    raw <= old.epoch_nanoseconds()
                }
            }) {
                return false;
            }
            let Ok(candidate) = Instant::from_epoch_nanoseconds(raw) else {
                return false;
            };
            // ECMA-262 §21.4.1.21: Use raw offsets on both sides of the boundary.
            if self.offset_seconds(seconds) != self.offset_seconds(seconds - 1) {
                best = Some(candidate);
                return true;
            }
            false
        };
        let index = self
            .transitions
            .partition_point(|event| i128::from(event.epoch_seconds) * 1_000_000_000 <= value);
        if next {
            for event in &self.transitions[index..] {
                if consider(event.epoch_seconds) {
                    break;
                }
            }
        } else {
            for event in self.transitions[..index].iter().rev() {
                if consider(event.epoch_seconds) {
                    break;
                }
            }
        }
        // Proposal comparison §6.3.46 steps 9.a and 10.b: Include the footer handoff.
        if self.future.is_some()
            && let Some(last) = self.transitions.last()
            && let Some(seam) = last.epoch_seconds.checked_add(1)
        {
            consider(seam);
        }
        let explicit = best;
        let Some(future) = self.future else {
            return best;
        };
        let Some((offset, _, _)) = future.daylight else {
            return best;
        };
        if offset == future.standard
            || (!next && value.div_euclid(1_000_000_000) < i128::from(self.cutoff()))
            || (next && explicit.is_some())
        {
            return best;
        }
        let year = instant.to_iso().year;
        let edge = Instant::from_epoch_nanoseconds(i128::from(self.cutoff()) * 1_000_000_000)
            .ok()
            .map_or(year, |value| value.to_iso().year);
        let year = if next { year.max(edge) } else { year };
        let mut recurring = None;
        for distance in -1..=401 {
            let y = year + if next { distance } else { -distance };
            let (begin, end) = future.events(y).unwrap();
            for event in [begin, end] {
                if event <= self.cutoff() {
                    continue;
                }
                let raw = i128::from(event) * 1_000_000_000;
                let Ok(candidate) = Instant::from_epoch_nanoseconds(raw) else {
                    continue;
                };
                if (if next { raw > value } else { raw < value })
                    && recurring.is_none_or(|old: Instant| {
                        if next {
                            raw < old.epoch_nanoseconds()
                        } else {
                            raw > old.epoch_nanoseconds()
                        }
                    })
                    && (if event > self.cutoff() + 1 {
                        future.changes_at(event)
                    } else {
                        self.offset_seconds(event) != self.offset_seconds(event - 1)
                    })
                {
                    recurring = Some(candidate);
                }
            }
            if distance >= 1 && recurring.is_some() {
                break;
            }
            if !next && !self.transitions.is_empty() && y < edge - 1 {
                break;
            }
        }
        recurring.or(best)
    }
}

// Proposal comparison §11.1.13 step 3.a: Visit possible initial, explicit and footer offsets.
fn visit_distinct_offsets(
    initial: i32,
    transitions: &[OffsetTransition],
    future: Option<FutureRule>,
    visitor: &mut dyn FnMut(i128),
) {
    // IANA histories repeat a few offsets across hundreds of transitions.
    let mut seen = [0i32; 16];
    let mut count = 0;
    let mut visit = |offset: i32| {
        if !seen[..count].contains(&offset) {
            visitor(i128::from(offset) * 1_000_000_000);
            if count < seen.len() {
                seen[count] = offset;
                count += 1;
            }
        }
    };
    visit(initial);
    for event in transitions {
        visit(event.offset_seconds);
    }
    if let Some(future) = future {
        visit(future.standard);
        if let Some((offset, _, _)) = future.daylight {
            visit(offset);
        }
    }
}

use crate::{Error, Instant, MAX_EPOCH_NANOSECONDS, TimeZone, TransitionDirection};

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
impl TransitionRule {
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
    fn event(self, year: i32) -> i64 {
        let start = crate::iso::epoch_day_from_iso(year, 1, 1);
        let leap = year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
        let (day, seconds) = match self {
            Self::Month {
                month,
                week,
                weekday,
                seconds,
            } => {
                let first = crate::iso::epoch_day_from_iso(year, month, 1);
                let mut day = first
                    + (i64::from(weekday) - (first + 4).rem_euclid(7)).rem_euclid(7)
                    + 7 * i64::from(week - 1);
                let next = if month == 12 {
                    crate::iso::epoch_day_from_iso(year + 1, 1, 1)
                } else {
                    crate::iso::epoch_day_from_iso(year, month + 1, 1)
                };
                if day >= next {
                    day -= 7;
                }
                (day, seconds)
            }
            Self::Day { day, seconds } => (start + i64::from(day), seconds),
            Self::Julian { day, seconds } => (
                start + i64::from(day) - 1 + i64::from(leap && day >= 60),
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
    fn events(self, year: i32) -> Option<(i64, i64)> {
        let (offset, start, end) = self.daylight?;
        Some((
            start.event(year) - i64::from(self.standard),
            end.event(year) - i64::from(offset),
        ))
    }
    fn changes_at(self, instant: Instant, before: Instant) -> bool {
        let Some((offset, _, _)) = self.daylight else {
            return false;
        };
        if offset == self.standard {
            return false;
        }
        let seconds = (instant.epoch_nanoseconds() / 1_000_000_000) as i64;
        let (year, month, day) = crate::calendar::iso_fields(seconds.div_euclid(86_400));
        // January 1 can put the two instants in different rule-year windows.
        if month == 1 && day == 1 && seconds.rem_euclid(86_400) == 0 {
            return self.offset(instant) != self.offset(before);
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
    fn offset(self, instant: Instant) -> i32 {
        let Some((offset, _, _)) = self.daylight else {
            return self.standard;
        };
        let year = instant.to_iso().year;
        let seconds = instant.epoch_nanoseconds().div_euclid(1_000_000_000);
        let mut latest = i128::MIN;
        let mut dst = false;
        for y in year - 1..=year + 1 {
            let (begin, end) = self.events(y).unwrap();
            if i128::from(begin) <= seconds && i128::from(begin) >= latest {
                latest = i128::from(begin);
                dst = true;
            }
            if i128::from(end) <= seconds && i128::from(end) > latest {
                latest = i128::from(end);
                dst = false;
            }
        }
        if dst { offset } else { self.standard }
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
    fn cutoff(self) -> i64 {
        self.transitions
            .last()
            .map_or(i64::MIN, |event| event.epoch_seconds)
    }
}
impl TimeZone for TransitionZone<'_> {
    fn offset_nanoseconds(&self, instant: Instant) -> i128 {
        let seconds = instant.epoch_nanoseconds().div_euclid(1_000_000_000);
        if seconds > i128::from(self.cutoff()) {
            if let Some(future) = self.future {
                return i128::from(future.offset(instant)) * 1_000_000_000;
            }
        }
        let index = self
            .transitions
            .partition_point(|event| i128::from(event.epoch_seconds) <= seconds);
        i128::from(if index == 0 {
            self.initial
        } else {
            self.transitions[index - 1].offset_seconds
        }) * 1_000_000_000
    }
    fn visit_offsets(&self, visitor: &mut dyn FnMut(i128)) {
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
        visit(self.initial);
        for event in self.transitions {
            visit(event.offset_seconds);
        }
        if let Some(future) = self.future {
            visit(future.standard);
            if let Some((offset, _, _)) = future.daylight {
                visit(offset);
            }
        }
    }

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
            let (Ok(candidate), Ok(before)) = (
                Instant::from_epoch_nanoseconds(raw),
                Instant::from_epoch_nanoseconds(raw - 1),
            ) else {
                return false;
            };
            if self.offset_nanoseconds(candidate) != self.offset_nanoseconds(before) {
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
                let (Ok(candidate), Ok(before)) = (
                    Instant::from_epoch_nanoseconds(raw),
                    Instant::from_epoch_nanoseconds(raw - 1),
                ) else {
                    continue;
                };
                if (if next { raw > value } else { raw < value })
                    && (if event > self.cutoff() + 1 {
                        future.changes_at(candidate, before)
                    } else {
                        self.offset_nanoseconds(candidate) != self.offset_nanoseconds(before)
                    })
                    && recurring.is_none_or(|old: Instant| {
                        if next {
                            raw < old.epoch_nanoseconds()
                        } else {
                            raw > old.epoch_nanoseconds()
                        }
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

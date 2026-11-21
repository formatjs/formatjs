use crate::{
    Error, Instant, NamedTimeZoneIdentifier, TimeZone, TransitionDirection, TransitionZone,
    named_time_zone_identifier,
};

/// Validated primary IANA record. UTC is supplied by the registry itself.
#[derive(Clone, Copy, Debug)]
pub struct TimeZoneRecord<'a> {
    identifier: &'static str,
    provider: TransitionZone<'a>,
}
impl<'a> TimeZoneRecord<'a> {
    pub fn new(identifier: &str, provider: TransitionZone<'a>) -> Result<Self, Error> {
        let identity = named_time_zone_identifier(identifier).ok_or(Error::InvalidTimeZoneData)?;
        if identity.identifier != identity.primary || identity.primary == "UTC" {
            return Err(Error::InvalidTimeZoneData);
        }
        Ok(Self {
            identifier: identity.primary,
            provider,
        })
    }
    pub const fn identifier(&self) -> &'static str {
        self.identifier
    }
}

/// Immutable borrowed records. Lookup never substitutes UTC for missing data.
#[derive(Clone, Copy, Debug)]
pub struct TimeZoneRegistry<'a> {
    records: &'a [TimeZoneRecord<'a>],
}
impl<'a> TimeZoneRegistry<'a> {
    pub const fn empty() -> Self {
        Self { records: &[] }
    }
    /// Records must be sorted by canonical primary identifier, without duplicates.
    pub fn new(records: &'a [TimeZoneRecord<'a>]) -> Result<Self, Error> {
        if records
            .windows(2)
            .any(|pair| pair[0].identifier >= pair[1].identifier)
        {
            return Err(Error::InvalidTimeZoneData);
        }
        Ok(Self { records })
    }
    pub const fn records(&self) -> &'a [TimeZoneRecord<'a>] {
        self.records
    }
    pub fn resolve(&self, identifier: &str) -> Result<ResolvedTimeZone<'a>, Error> {
        if identifier.starts_with(['+', '-']) {
            let (seconds, name) = offset_identifier(identifier)?;
            return Ok(ResolvedTimeZone {
                identity: Identity::Offset(name),
                provider: TransitionZone::new(seconds, &[], None)?,
            });
        }
        let identity = named_time_zone_identifier(identifier).ok_or(Error::InvalidTimeZone)?;
        let provider = if identity.primary == "UTC" {
            TransitionZone::new(0, &[], None)?
        } else {
            let index = self
                .records
                .binary_search_by_key(&identity.primary, |record| record.identifier)
                .map_err(|_| Error::MissingTimeZoneData)?;
            self.records[index].provider
        };
        Ok(ResolvedTimeZone {
            identity: Identity::Named(identity),
            provider,
        })
    }
    /// SystemTimeZoneIdentifier: always a primary or offset zone, never an error.
    /// https://tc39.es/proposal-temporal/#sec-systemtimezoneidentifier
    /// Steps 2–3 use the normalized host identifier. Step 1 requires UTC for a
    /// UTC-only implementation; UTC on failed discovery is our fallback policy.
    pub fn system(&self, host: Option<&str>) -> ResolvedTimeZone<'a> {
        host.and_then(|value| self.resolve(value).ok())
            .and_then(|zone| self.resolve(zone.primary_identifier()).ok())
            .unwrap_or_else(|| self.resolve("UTC").expect("UTC needs no records"))
    }
}
impl TimeZoneRegistry<'static> {
    /// All pinned IANA zones and footer rules, compiled by Bazel.
    #[cfg(feature = "compiled_time_zones")]
    pub const fn compiled() -> Self {
        Self {
            records: compiled::ZONES,
        }
    }
}
impl Default for TimeZoneRegistry<'_> {
    fn default() -> Self {
        Self::empty()
    }
}

#[derive(Clone, Copy, Debug)]
enum Identity {
    Named(NamedTimeZoneIdentifier),
    Offset([u8; 6]),
}
#[derive(Clone, Copy, Debug)]
pub struct ResolvedTimeZone<'a> {
    identity: Identity,
    provider: TransitionZone<'a>,
}
impl<'a> ResolvedTimeZone<'a> {
    pub fn identifier(&self) -> &str {
        match &self.identity {
            Identity::Named(identity) => identity.identifier,
            Identity::Offset(name) => core::str::from_utf8(name).unwrap(),
        }
    }
    pub fn primary_identifier(&self) -> &str {
        match &self.identity {
            Identity::Named(identity) => identity.primary,
            Identity::Offset(_) => self.identifier(),
        }
    }
    pub const fn provider(&self) -> TransitionZone<'a> {
        self.provider
    }
}
impl PartialEq for ResolvedTimeZone<'_> {
    fn eq(&self, other: &Self) -> bool {
        self.primary_identifier() == other.primary_identifier()
    }
}
impl Eq for ResolvedTimeZone<'_> {}
impl core::fmt::Display for ResolvedTimeZone<'_> {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        f.write_str(self.identifier())
    }
}
impl TimeZone for ResolvedTimeZone<'_> {
    fn offset_nanoseconds(&self, instant: Instant) -> i128 {
        self.provider.offset_nanoseconds(instant)
    }
    fn visit_offsets(&self, visitor: &mut dyn FnMut(i128)) {
        self.provider.visit_offsets(visitor);
    }
    fn visit_offsets_at(&self, local: i128, visitor: &mut dyn FnMut(i128)) {
        self.provider.visit_offsets_at(local, visitor);
    }
    fn transition(&self, instant: Instant, direction: TransitionDirection) -> Option<Instant> {
        self.provider.transition(instant, direction)
    }
}
fn offset_identifier(value: &str) -> Result<(i32, [u8; 6]), Error> {
    let bytes = value.as_bytes();
    let (hours, minutes) = match bytes {
        [b'+' | b'-', a, b] => ([*a, *b], [b'0', b'0']),
        [b'+' | b'-', a, b, c, d] | [b'+' | b'-', a, b, b':', c, d] => ([*a, *b], [*c, *d]),
        _ => return Err(Error::InvalidTimeZone),
    };
    if !hours.iter().chain(minutes.iter()).all(u8::is_ascii_digit) {
        return Err(Error::InvalidTimeZone);
    }
    let hour = (hours[0] - b'0') * 10 + hours[1] - b'0';
    let minute = (minutes[0] - b'0') * 10 + minutes[1] - b'0';
    if hour > 23 || minute > 59 {
        return Err(Error::InvalidTimeZone);
    }
    let mut seconds = i32::from(hour) * 3600 + i32::from(minute) * 60;
    if bytes[0] == b'-' {
        seconds = -seconds;
    }
    Ok((
        seconds,
        [
            if seconds < 0 { b'-' } else { b'+' },
            hours[0],
            hours[1],
            b':',
            minutes[0],
            minutes[1],
        ],
    ))
}

#[cfg(feature = "compiled_time_zones")]
const fn checked_future(
    standard: i32,
    daylight: Option<(i32, crate::TransitionRule, crate::TransitionRule)>,
) -> crate::FutureRule {
    match crate::FutureRule::new(standard, daylight) {
        Ok(value) => value,
        Err(_) => panic!("Invalid generated future rule"),
    }
}
#[cfg(feature = "compiled_time_zones")]
const fn checked_zone(
    initial: i32,
    events: &'static [crate::OffsetTransition],
    future: Option<crate::FutureRule>,
) -> TransitionZone<'static> {
    match TransitionZone::new(initial, events, future) {
        Ok(value) => value,
        Err(_) => panic!("Invalid generated time zone"),
    }
}
#[cfg(feature = "compiled_time_zones")]
mod compiled {
    use super::{TimeZoneRecord, checked_future, checked_zone};
    use crate::{OffsetTransition, TransitionRule};
    include!(env!("FORMATJS_TEMPORAL_TIME_ZONES"));
}

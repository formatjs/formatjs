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
    // Proposal comparison §11.1.1 step 1.a: bind a borrowed provider to its primary identifier.
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
    // Proposal comparison §11.1.1 step 1.a: expose the canonical key of the provider record.
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
    // Proposal comparison §11.1.9 step 3: Supply a registry with no external named-zone records.
    pub const fn empty() -> Self {
        Self { records: &[] }
    }
    /// Records must be sorted by canonical primary identifier, without duplicates.
    // Proposal comparison §11.1.9 step 3: require ordered, unique provider keys before lookup.
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
    // Proposal comparison §11.1.8 steps 5, 7–9: resolve the typed offset or named zone.
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
    /// Hosts can report no zone or one this registry can't resolve; treat those
    /// like a UTC-only host (step 1).
    // Proposal comparison §14.6.4 steps 1–3: normalize the supplied host zone or use UTC.
    pub fn system(&self, host: Option<&str>) -> ResolvedTimeZone<'a> {
        host.and_then(|value| self.resolve(value).ok())
            .and_then(|zone| self.resolve(zone.primary_identifier()).ok())
            .unwrap_or_else(|| self.resolve("UTC").expect("UTC needs no records"))
    }
}
impl TimeZoneRegistry<'static> {
    /// All pinned IANA zones and footer rules, compiled by Bazel.
    #[cfg(feature = "compiled_time_zones")]
    // Proposal comparison §11.1.9 step 3: supply the compiled IANA provider records.
    pub const fn compiled() -> Self {
        Self {
            records: compiled::ZONES,
        }
    }
}
impl Default for TimeZoneRegistry<'_> {
    // Proposal comparison §11.1.9 step 3: Default to the registry without external zone data.
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
    // Proposal comparison §11.1.8 steps 5, 9: return the normalized offset or named spelling.
    pub fn identifier(&self) -> &str {
        match &self.identity {
            Identity::Named(identity) => identity.identifier,
            Identity::Offset(name) => core::str::from_utf8(name).unwrap(),
        }
    }
    // Proposal comparison §11.1.15 step 2.e: read the primary identity used for equality.
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
    // Proposal comparison §11.1.15 steps 2.e, 4: compare resolved zone identities.
    fn eq(&self, other: &Self) -> bool {
        self.primary_identifier() == other.primary_identifier()
    }
}
impl Eq for ResolvedTimeZone<'_> {}
impl core::fmt::Display for ResolvedTimeZone<'_> {
    // Proposal comparison §11.1.8 steps 5 and 9: Display the normalized resolved zone identifier.
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        f.write_str(self.identifier())
    }
}
impl TimeZone for ResolvedTimeZone<'_> {
    // Proposal comparison §11.1.9 steps 2–3: query the resolved provider for the offset.
    fn offset_nanoseconds(&self, instant: Instant) -> i128 {
        self.provider.offset_nanoseconds(instant)
    }
    // Proposal comparison §11.1.13 step 3.a: delegate enumeration of possible offsets.
    fn visit_offsets(&self, visitor: &mut dyn FnMut(i128)) {
        self.provider.visit_offsets(visitor);
    }
    // Proposal comparison §11.1.13 step 3.a: delegate offsets near the requested local time.
    fn visit_offsets_at(&self, local: i128, visitor: &mut dyn FnMut(i128)) {
        self.provider.visit_offsets_at(local, visitor);
    }
    // Proposal comparison §6.3.46 steps 9.a, 10.b: dispatch the selected transition direction.
    fn transition(&self, instant: Instant, direction: TransitionDirection) -> Option<Instant> {
        self.provider.transition(instant, direction)
    }
}
// Minute-precision zone identifiers are a subset of ECMA-262 §21.4.1.33 UTCOffset.
// https://tc39.es/ecma262/#sec-time-zone-offset-strings
// Proposal comparison §11.1.16 steps 1–2, 6–8: parse a minute-precision identifier.
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
// Proposal comparison §11.1.9 step 3: validate generated future rules for named offsets.
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
// Proposal comparison §11.1.9 step 3: validate generated transition providers.
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

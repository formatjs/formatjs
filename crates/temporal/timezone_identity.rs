use crate::{Error, Instant, TimeZone, TransitionDirection};

#[path = "identifiers_generated.rs"]
mod data;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct NamedTimeZoneIdentifier {
    pub identifier: &'static str,
    pub primary: &'static str,
}

pub fn named_time_zone_identifier(value: &str) -> Option<NamedTimeZoneIdentifier> {
    let index = data::IDENTIFIERS
        .binary_search_by(|entry| {
            entry
                .0
                .bytes()
                .map(|byte| byte.to_ascii_lowercase())
                .cmp(value.bytes().map(|byte| byte.to_ascii_lowercase()))
        })
        .ok()?;
    let (identifier, primary) = data::IDENTIFIERS[index];
    Some(NamedTimeZoneIdentifier {
        identifier,
        primary,
    })
}

/// Attach IANA identity to provider data. The provider must describe this zone.
#[derive(Clone, Copy, Debug)]
pub struct NamedTimeZone<Z> {
    identity: NamedTimeZoneIdentifier,
    provider: Z,
}
impl<Z> NamedTimeZone<Z> {
    pub fn new(identifier: &str, provider: Z) -> Result<Self, Error> {
        Ok(Self {
            identity: named_time_zone_identifier(identifier).ok_or(Error::InvalidDateTime)?,
            provider,
        })
    }
    pub const fn identifier(&self) -> &'static str {
        self.identity.identifier
    }
    pub const fn primary_identifier(&self) -> &'static str {
        self.identity.primary
    }
    pub const fn provider(&self) -> &Z {
        &self.provider
    }
}
impl<Z, W> PartialEq<NamedTimeZone<W>> for NamedTimeZone<Z> {
    fn eq(&self, other: &NamedTimeZone<W>) -> bool {
        self.identity.primary == other.identity.primary
    }
}
impl<Z> Eq for NamedTimeZone<Z> {}
impl<Z: TimeZone> TimeZone for NamedTimeZone<Z> {
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

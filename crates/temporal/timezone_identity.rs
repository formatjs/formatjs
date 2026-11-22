use crate::{Error, Instant, TimeZone, TransitionDirection};

#[path = "identifiers_generated.rs"]
mod data;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct NamedTimeZoneIdentifier {
    pub identifier: &'static str,
    pub primary: &'static str,
}

// Proposal comparison §11.1.1 steps 1.a and 2: Look up spelling and primary ID by ASCII-insensitive name.
pub fn named_time_zone_identifier(value: &str) -> Option<NamedTimeZoneIdentifier> {
    // ECMA-262 preview §22.2.6: generated names pair each available identifier with its primary.
    // https://tc39.es/ecma262/pr/3966/#sec-availablenamedtimezoneidentifiers
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
    // Proposal comparison §11.1.8 steps 7–9: Bind a recognized name to the supplied provider.
    pub fn new(identifier: &str, provider: Z) -> Result<Self, Error> {
        Ok(Self {
            identity: named_time_zone_identifier(identifier).ok_or(Error::InvalidDateTime)?,
            provider,
        })
    }
    // Proposal comparison §11.1.8 step 9: Return the stored identifier spelling.
    pub const fn identifier(&self) -> &'static str {
        self.identity.identifier
    }
    // Proposal comparison §11.1.15 step 2.e: Read the primary ID used for named-zone comparison.
    pub const fn primary_identifier(&self) -> &'static str {
        self.identity.primary
    }
    pub const fn provider(&self) -> &Z {
        &self.provider
    }
}
impl<Z, W> PartialEq<NamedTimeZone<W>> for NamedTimeZone<Z> {
    // Proposal comparison §11.1.15 steps 2.e and 4: Compare named zones by primary ID.
    fn eq(&self, other: &NamedTimeZone<W>) -> bool {
        self.identity.primary == other.identity.primary
    }
}
impl<Z> Eq for NamedTimeZone<Z> {}
impl<Z: TimeZone> TimeZone for NamedTimeZone<Z> {
    // Proposal comparison §11.1.9 step 3: Delegate exact named-zone offset lookup.
    fn offset_nanoseconds(&self, instant: Instant) -> i128 {
        self.provider.offset_nanoseconds(instant)
    }
    // Proposal comparison §11.1.13 step 3.a: Delegate full offset enumeration for candidate checks.
    fn visit_offsets(&self, visitor: &mut dyn FnMut(i128)) {
        self.provider.visit_offsets(visitor);
    }
    // Proposal comparison §11.1.13 step 3.a: Delegate local offset enumeration for candidate checks.
    fn visit_offsets_at(&self, local: i128, visitor: &mut dyn FnMut(i128)) {
        self.provider.visit_offsets_at(local, visitor);
    }
    // Proposal comparison §11.1.13 step 4.a: Delegate named-zone candidate range checks.
    fn has_out_of_range_candidate(&self, local: i128) -> bool {
        self.provider.has_out_of_range_candidate(local)
    }
    // Proposal comparison §11.1.14 step 5: Delegate raw named-zone day-start lookup.
    fn nearest_local_after(&self, local: i128) -> Option<i128> {
        self.provider.nearest_local_after(local)
    }
    // Proposal comparison §11.1.12 steps 6–7: Delegate raw named-zone gap lookup.
    fn nearest_gap_boundaries(&self, local: i128) -> Option<(i128, i128)> {
        self.provider.nearest_gap_boundaries(local)
    }
    // Proposal comparison §6.3.46 steps 9.a and 10.b: Delegate named-zone transition lookup.
    fn transition(&self, instant: Instant, direction: TransitionDirection) -> Option<Instant> {
        self.provider.transition(instant, direction)
    }
}

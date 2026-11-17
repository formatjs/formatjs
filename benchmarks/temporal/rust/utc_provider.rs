use std::borrow::Cow;
use timezone_provider::{
    TimeZoneProviderError,
    epoch_nanoseconds::EpochNanoseconds,
    provider::{
        CandidateEpochNanoseconds, EpochNanosecondsAndOffset, IsoDateTime, TimeZoneId,
        TimeZoneProvider, TransitionDirection, UtcOffsetSeconds,
    },
};

/// UTC-only benchmark provider. No IANA history or system discovery.
pub struct UtcProvider;
type Result<T> = core::result::Result<T, TimeZoneProviderError>;
impl TimeZoneProvider for UtcProvider {
    fn get(&self, identifier: &[u8]) -> Result<TimeZoneId> {
        if identifier.eq_ignore_ascii_case(b"UTC") {
            Ok(TimeZoneId::default())
        } else {
            Err(TimeZoneProviderError::Range("UTC-only benchmark provider"))
        }
    }
    fn identifier(&self, _: TimeZoneId) -> Result<Cow<'_, str>> {
        Ok(Cow::Borrowed("UTC"))
    }
    fn canonicalized(&self, id: TimeZoneId) -> Result<TimeZoneId> {
        Ok(id)
    }
    fn candidate_nanoseconds_for_local_epoch_nanoseconds(
        &self,
        _: TimeZoneId,
        value: IsoDateTime,
    ) -> Result<CandidateEpochNanoseconds> {
        Ok(CandidateEpochNanoseconds::One(EpochNanosecondsAndOffset {
            ns: value.as_nanoseconds(),
            offset: UtcOffsetSeconds(0),
        }))
    }
    fn transition_nanoseconds_for_utc_epoch_nanoseconds(
        &self,
        _: TimeZoneId,
        _: i128,
    ) -> Result<UtcOffsetSeconds> {
        Ok(UtcOffsetSeconds(0))
    }
    fn get_time_zone_transition(
        &self,
        _: TimeZoneId,
        _: i128,
        _: TransitionDirection,
    ) -> Result<Option<EpochNanoseconds>> {
        Ok(None)
    }
}

# Relative preparation and early zoned rounding validation

Reviewed 2026-11-21. These are bounded implementation corrections; complete
Temporal methods remain open. Requested ECMA-262 snapshot lacks Temporal API
chapters. Published proposal citations below are comparison/navigation only,
not adopted ECMA-262 authority or chapter signoff. No historical line credit.

## Private relativeTo record

[Field preparation:96](../../packages/temporal/relative-duration.ts#L96) reads the public calendar,
allocates a null-prototype record, then prepares public fields in the existing
Get/coercion order. The previous zoned path spread that record into an ordinary
object before calling toZonedDateTimeSlot. Its second field scan could observe
Object.prototype for omitted fields, despite the original input inheriting null.

A public Duration.total/round regression reproduced two calls to an inherited
Object.prototype.hour getter with the private copied record as receiver, throwing
the same sentinel. The [corrected delegation:112](../../packages/temporal/relative-duration.ts#L112)
stores the already normalized calendar as an own property and passes the original
private record directly. Prepared field values remain primitive; no user field
access or conversion is skipped. Missing fields continue to yield undefined.

Positive controls verify inherited public calendar/hour getter receiver identity,
Get then immediate number coercion, and one read per operation. A throwing public
hour getter still propagates the identical exception. Shared oracle controls run
the private-record mutation through TS and native Hermes round/total; descriptors
restore before comparisons. Native Rust typed input tests alone cannot establish
this JavaScript property-access contract.

## Rounding validation before local conversion

Published comparison [§6.3.39](https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.round)
reads roundingIncrement, roundingMode and smallestUnit in steps 7–9, validates
allowed units in step 10 and unit-specific increment in steps 11–13, then handles
identity in step 14 and computes local fields in step 18.

[TS options:938](../../packages/temporal/zoned-date-time.ts#L929) preserve the
existing reads/coercions. [Unit/increment checks:941](../../packages/temporal/zoned-date-time.ts#L932)
now precede identity, native dispatch and local conversion. Day requires increment
1; timeUnit rejects missing/date units; the existing
[time validator:280](../../packages/temporal/plain-time.ts#L280) enforces strict
maxima 24/60/60/1000/1000/1000 and exact divisibility. Its positive-integer input
contract is established by roundingIncrement before this call. Other PlainTime
callers keep their checks. No new unit algorithm or rounding formula is added.

[Rust:219](../../crates/temporal/zoned.rs#L235) reuses
[validate_increment:239](../../crates/temporal/time.rs#L239) before local().
Typed Rust additionally rejects zero directly. Existing local/time validation
remains as defense for other callers. Day validation already preceded local work.

Before correction, invalid public TS options reached a replaced Map.prototype.get
in local-time cache access, and typed Rust invalid increments queried the offset
provider once. Regressions now require RangeError/InvalidRoundingOptions with
zero cache/provider calls. The TS cases retain all three option reads in order
for year, nanosecond increment 3, hour increment 24 and day increment 2.

This fixes premature reachability under invalid options. Capturing every zone
cache operation for valid calls is separate work; no broader cache isolation
claim is made. Original pending #8055 difference/format ordering and #8058
plain-time conversion work are not duplicated.

## Validation and remaining work

All seven focused gates pass (four executed, three cached), including public
getter controls, relevant typechecks, PlainTime controls and Rust core. Expanded
validation passes all 21 tests (20 executed, one cached), including 15 affected
class/backend gates, native Duration/ZonedDateTime Hermes source/bytecode and
independent relative/precision controls. Temporal and DurationFormat assemblies
pass. No baseline, exclusions or timeout changes. No new specification issue established.
Complete parser, realm, calendar/provider and public caller contracts remain open.

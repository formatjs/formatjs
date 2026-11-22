# Temporal specification issues

Reviewed: 2026-11-21. First six citation mappings rechecked 2026-11-22.

Implementation gaps stay in [the audit ledger](temporal-spec-audit.md).
[Test/data conflicts](temporal-conformance-discrepancies.md) are separate from
specification algorithm defects. Normative ambiguities and editorial
inconsistencies are recorded below.

Requested authority remains [ECMA-262](https://tc39.es/ecma262/), whose checked
snapshot has no Temporal API chapters. Numbered Temporal clauses below identify
separately published proposal comparisons, not adopted ECMA-262 authority or
completed audit sections. Pinned revision/line references preserve historical
evidence; technical comparisons use rendered clauses. ECMA-402 citations retain
their own published authority for demonstrated shared dependencies.

## Published Zone-primary rule versus pending legacy-POSIX policy

Status: open standards-policy inconsistency; upstream
[ECMA-402 #1103](https://github.com/tc39/ecma402/issues/1103).

[Published ECMA-402 §6.5](https://tc39.es/ecma402/#sec-use-of-iana-time-zone-database)
requires IANA Zone names to be primary, with enumerated exceptions. IANA 2026d
restored `EST5EDT`, `CST6CDT`, `MST7MDT` and `PST8PDT` as Zones; pinned 2026f
retains them. The published exceptions do not cover those four names.

The [TG2 2026-10-08 decision](https://github.com/tc39/ecma402/issues/1103#issuecomment-6066913704)
agreed that a future specification change should retain their previous alias
behavior. That decision also gave interim browser guidance, but the published
normative algorithm still preserves their primary identities. The proposal and
published rule therefore differ for the pinned data.

Audit decision: follow the published rule and pinned data. Keep the upstream
policy question open; reassess when the normative text changes. Do not silently
implement unpublished alias policy merely to satisfy the older Test262 fixture.
No upstream issue or PR was filed by this audit.

## Range-guard removal note versus lower-bound offset behavior

Status: editorial inconsistency in pinned Temporal revision
`b038883fe9c6aa871ccab3238c90daf9eb5e9b17`; normative behavior is unambiguous.

The [proposal §13.4 editorial note](https://tc39.es/proposal-temporal/#sec-checkisodaysrange)
says resolving [ECMA-262 #1087](https://github.com/tc39/ecma262/issues/1087) would
allow removing this operation without observable effects. That upstream issue
remains open. But
[proposal §6.5.1 step 7](https://tc39.es/proposal-temporal/#sec-temporal-interpretisodatetimeoffset)
checks the unadjusted local date for `prefer`/`reject`. Step 4.b checks the
balanced UTC date for `use`; step 3.a gives `ignore` wall-clock resolution.
These clauses retain the historical guard distinction when rechecked 2026-11-22.

```js
const text = '-271821-04-19T23:00-01:00[-01:00]'
Temporal.ZonedDateTime.from(text, {offset: 'use'}).epochNanoseconds
// -8640000000000000000000n
Temporal.ZonedDateTime.from(text, {offset: 'ignore'}).epochNanoseconds
// -8640000000000000000000n
Temporal.ZonedDateTime.from(text, {offset: 'prefer'}) // RangeError
Temporal.ZonedDateTime.from(text, {offset: 'reject'}) // RangeError
```

Exact arithmetic gives local nanoseconds `nsMinInstant - 3600000000000` and a
matching offset of `-3600000000000`; subtracting it yields valid `nsMinInstant`.
Removing only the local-day guard lets `prefer`/`reject` reach that matching
candidate. Its rejection therefore has an observable policy effect independent
of numeric precision. Resolving the MakeDay ambiguity alone does not establish
that deleting this guard preserves current behavior; preserve the rejection
elsewhere or explicitly choose a normative change.

Audit decision: retain the pinned rejection. Node
[zoned controls](../../packages/temporal/tests/zoned.test.ts) and Rust
[pinned bound controls](../../crates/temporal/zoned_string.test.rs) preserve the
four-mode distinction. This is an editorial-removal claim needing qualification,
not permission to change the current algorithm or a claim about how #1087 will
be resolved. No upstream issue or PR was filed by this audit.

Historical evidence: [pinned removal note](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L125-L128)
and [pinned offset branches](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L923-L935).

## MakeDay witness range at the minimum Instant

Status: unresolved witness-range wording, related to open
[ECMA-262 #1087](https://github.com/tc39/ecma262/issues/1087). Rechecked 2026-11-21.

[Proposal §14.6.1 steps 1–4](https://tc39.es/proposal-temporal/#sec-getutcepochnanoseconds)
uses MakeDay, composes milliseconds and asserts integrality. Read the inserted
`isoDateTime` fields in this rendered change-marked clause; deleted positional
parameters are historical text. Published ECMA-262
[§21.4.1.28 step 8](https://tc39.es/ecma262/#sec-makeday)
asks for a finite time value on the first day of the month. Its
[§21.4.1.1 time-value range](https://tc39.es/ecma262/#sec-time-values-and-time-range)
is ±8,640,000,000,000,000 milliseconds.

The minimum Instant is -271821-04-20, epoch day -100000000. April 1 of that
month is day -100000019, or -8640001641600000 milliseconds. Every millisecond
on April 1 lies below the supported range. A reading that restricts the witness
to that range finds none, so MakeDay returns NaN and the later assertion fails.
[Proposal §8.5.3 step 9](https://tc39.es/proposal-temporal/#sec-temporal-totemporalinstant)
applies [§13.4 step 1](https://tc39.es/proposal-temporal/#sec-checkisodaysrange)
to the balanced date. It accepts April 20 and does not address this month-start
witness.

An extended-intermediate reading permits the witness and produces the intended
minimum. TS and Rust use exact arithmetic and retain that behavior:

```js
Temporal.ZonedDateTime.from('-271821-04-20T00:00Z[UTC]').epochNanoseconds
// -8640000000000000000000n
```

Audit decision: preserve valid minimum parsing, document both readings, and keep
mainadditions.html line 355 and plaindatetime.html line 763 open. Independent
clock/composition/range substeps can be reviewed under their valid intermediate
contracts. This is a specification ambiguity, not evidence of an implementation
arithmetic defect. No upstream issue or PR was filed by this audit.

Historical evidence: [pinned UTC composition](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L355-L359).
Historical line numbers above remain ledger locators, not current clause numbers.

## CompareTimeRecord description reverses the algorithm's signs

Status: editorial inconsistency in pinned Temporal revision
`b038883fe9c6aa871ccab3238c90daf9eb5e9b17`; also present in the
[proposal §4.5.14](https://tc39.es/proposal-temporal/#sec-temporal-comparetimerecord)
when rechecked on 2026-11-22.

The description of proposal §4.5.14
assigns -1 when the second clock is earlier and 1 when the first is earlier.
Its steps 1–13
assign 1 when the first clock is later, -1 when it is earlier. These disagree.
For example, first hour 12 and second hour 11 returns 1 at the first step;
the description implies -1.

Audit decision: preserve the numbered algorithm's chronological ordering,
consistent with CompareISODate and CompareEpochNanoseconds. This is a prose sign
error, not an implementation comparison bug. TS, Rust and native Hermes controls
check both directions and equality, including every lower-field carry boundary.
Input conversion remains separate audit work. No upstream issue or PR was filed
by this audit.

Historical evidence: [pinned description and algorithm](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L830-L845).

## Partial time records use a different missing-field sentinel than with()

Status: inconsistent producer/consumer contract in historical Temporal revision
`b038883fe9c6aa871ccab3238c90daf9eb5e9b17`; still present in separately published
proposal clauses rechecked 2026-11-22.

[Proposal §4.5.12 step 3.a](https://tc39.es/proposal-temporal/#sec-temporal-totemporaltimerecord)
initializes absent partial fields to enum `unset`. Steps 5–16 leave it unchanged
when property Gets return undefined. But
[proposal §4.3.11 steps 5, 7, 9, 11, 13 and 15](https://tc39.es/proposal-temporal/#sec-temporal.plaintime.prototype.with)
compare the six fields with ECMAScript undefined before merging; step 19 calls
[§4.5.8 RegulateTime](https://tc39.es/proposal-temporal/#sec-temporal-regulatetime).
Those are distinct specification values. Taken literally, an absent field
passes the test, gets copied into the clock, and reaches RegulateTime outside
its integer-input contract. For example, setting only minute leaves hour and
four lower fields unset. The algorithm cannot justify a valid integer clock.

```js
new Temporal.PlainTime(12, 34, 56, 123, 456, 789).with({minute: 1}).toJSON()
// Existing behavior: '12:01:56.123456789'
```

Audit decision: preserve the receiver's missing fields, including properties
whose Get returns undefined. The implementation fuses this merge by seeding its
private field list from the receiver before reading the partial input. Node and
installed native Hermes controls cover all six independently supplied fields,
undefined inputs, inherited fields and coercion/throw ordering. These tests
preserve behavior; they do not resolve the normative inconsistency.

A candidate spec repair is to test `~unset~` in all six with() branches, or to
make the producer use undefined consistently. Keep ToTemporalTimeRecord lines
728–732 and 759, and the with() merge lines 207–230, open pending a consistent
contract. The independently reviewed Gets, defined guards, conversions and
supplied-field flag at lines 733–758 do not depend on which missing sentinel is
chosen. No upstream issue or PR was filed by this audit.

Historical evidence: [pinned partial producer](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L728-L759)
and [pinned with merge](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L206-L230).
The former default-branch blob observation (`6ad3d7e4a0207642286ad2d771a55f9de34762e9`,
2026-11-21) is historical provenance; current comparison uses clauses above.

## PartitionPattern literal placeholder versus result description

Status: editorial inconsistency in published ECMA-402; algorithm behavior is
unambiguous. No upstream issue or PR filed by this audit.

[§6.10 Pattern String Types](https://tc39.es/ecma402/#sec-pattern-string-types)
allows the nonempty ASCII word placeholder name `literal`.
[§9.2.15 PartitionPattern](https://tc39.es/ecma402/#sec-partitionpattern)
therefore accepts `{literal}`. Step 4.f produces the Record
`{ [[Type]]: "literal", [[Value]]: undefined }`.
The introductory return-field description instead requires a String value
whenever the type is `literal`. Those statements disagree for this valid input.

Audit decision: follow step 4.f. Do not rename keys, coerce undefined, or reject
the input to repair the introductory description. The shared parser test retains
this witness. Current formatter schemas use their own placeholder vocabularies;
this finding does not establish a public formatter failure. The specification
could reserve the name in §6.10 or describe literal segments by their origin
rather than by the type field alone.

## Day-rounding upper-bound assertion on repeated civil dates

Status: algorithm inconsistency in historical Temporal revision
`b038883fe9c6aa871ccab3238c90daf9eb5e9b17`; also present in the separately
published proposal checked 2026-11-21. No upstream issue filed by this review.
This is not a numbered ECMA-262 Temporal finding: the requested ECMA-262 snapshot
has no Temporal API chapters. The proposal comparison below does not change the
requested authority or grant section completion.

Historical `zoneddatetime.html:651–661` obtains the earliest starts of the
receiver's local date and the following date, then asserts `thisNs < endNs`
at line 657. The separately published
[proposal §6.3.39 step 19.f](https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.round)
still contains that assertion. Its
[§11.1.14 step 3](https://tc39.es/proposal-temporal/#sec-temporal-getstartofday)
selects the first possible midnight instant when midnight exists.

Pinned [IANA tzdb 2026f, `antarctica`, Zone Antarctica/Casey](https://data.iana.org/time-zones/tzdb-2026f/antarctica)
uses UTC+11 until 2010-03-05 02:00 local, then UTC+08. Thus at
2010-03-04T15:00Z the clock moves from March 5 at 02:00 back to March 4 at 23:00.

For receiver `2010-03-04T23:10+08:00[Antarctica/Casey]`, exact offset subtraction
gives:

| Quantity                             | UTC instant       |
| ------------------------------------ | ----------------- |
| Receiver, `thisNs`                   | 2010-03-04T15:10Z |
| Earliest March 4 midnight, `startNs` | 2010-03-03T13:00Z |
| Earliest March 5 midnight, `endNs`   | 2010-03-04T13:00Z |

March 5 midnight occurs again at 2010-03-04T16:00Z, but the first candidate is
13:00Z. Therefore `thisNs = endNs + 7_800_000_000_000 ns`: the asserted upper
bound fails on a valid instant with an available named zone. The elapsed progress
from `startNs` is 26 hours 10 minutes, exceeding the calculated 24-hour interval.
This arithmetic does not depend on FormatJS rounding output.

[Existing Casey controls](../../packages/temporal/tests/zoned.test.ts#L241)
already cover this receiver. The
[TS day branch](../../packages/temporal/zoned-date-time.ts#L966) and
[Rust day branch](../../crates/temporal/zoned.rs#L211) clamp the receiver to
`endNs - 1 ns` before rounding. That is an existing fallback, not a consequence
of the failed assertion. Keep its behavior separate from the ordinary-day proof;
this finding does not prescribe a replacement rule or establish a new runtime
regression. Day rounding retains open status pending an authoritative resolution.

## Day-window retry ignores shift after Apia's skipped date

Reviewed 2026-11-21. Published proposal comparison only, not adopted ECMA-262
Temporal authority. [ComputeNudgeWindow §7.5.33 steps 4.c–4.d](https://tc39.es/proposal-temporal/#sec-temporal-computenudgewindow)
ignore additionalShift for day units, although year/month branches use it.
[NudgeToCalendarUnit §7.5.34 step 6.a.i](https://tc39.es/proposal-temporal/#sec-temporal-nudgetocalendarunit)
retries with that flag after an unbracketed destination.

The [independent Apia endpoints](temporal-calendar-count-window-audit.md#apia-adjacent-day-counts-need-not-have-distinct-endpoints)
give a reachable backward difference of -1 day and -2 hours. Initial day counts
-1/-2 resolve to the same instant; retry recomputes that identical pair, still
not bracketing the destination. Step 6.a.ii's bracket assertion fails; step 13's
distinct-endpoint assertion would also fail if execution continued.

FormatJS already advances both counts for every irregular date unit. Its -2/-3
window brackets this destination; new TS/native Hermes controls preserve that
behavior. This practical fallback is not derived from the published day branch.
General retry sufficiency remains open. No runtime change or upstream issue
filing is included.

An ordinary New York overlap also reaches the positive retry. Start at
2020-10-31T01:30-04:00 (1604122200000000000 ns); end at
2020-11-01T01:00-05:00 (1604210400000000000 ns). Comparison §6.5.6 gives
zero date days plus 24h30m. The initial day window ends at the first
2020-11-01T01:30-04:00 (1604208600000000000 ns), only 24 hours after start.
Destination lies 30 minutes beyond it. §7.5.34 step 5.a.i retries, but the day
branch ignores additionalShift and repeats the same endpoints; step 5.a.ii's
bracketing assertion fails. This strengthens the retry inconsistency without
assuming a skipped date. The separate [minute-carry correction](temporal-day-window-engine-audit.md)
uses NudgeToZonedTime; it does not resolve this calendar/day-total specification
issue. No day-total expectation is inferred from another implementation.

## Reverse-fold intermediate changes a zero-date time difference

[Separate derivation](temporal-reverse-fold-spec-issue.md): published comparison
§6.5.6 steps 11.b–11.d selects the earlier fold occurrence while zero-date
addition preserves the later instant. Result misses its target by one hour when
added back. Literal source/comparison divergence remains unresolved; no disputed
expected result or runtime change adopted.

## Zero rounded component loses a retained calendar prefix

Open published comparison inconsistency: [complete witness](temporal-zero-component-prefix-spec-issue.md).
ComputeNudgeWindow §7.5.33 step 7.a uses the original epoch whenever the rounded
component is zero, even when its retained year/month prefix is nonzero.
P1M from 2020-01-01 then rounds to P1M1W in the literal comparison and native
Node. Source uses the complete prefix endpoint and retains P1M. No runtime
policy change or complete rounding signoff; intended coordinates remain open.

# Temporal specification issues

Reviewed: 2026-11-21.

Implementation gaps stay in [the audit ledger](temporal-spec-audit.md).
[Test/data conflicts](temporal-conformance-discrepancies.md) are separate from
specification algorithm defects. Normative ambiguities and editorial
inconsistencies are recorded below.

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

The [CheckISODaysRange note](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L125-L128)
says resolving [ECMA-262 #1087](https://github.com/tc39/ecma262/issues/1087) would
allow removing this operation without observable effects. That upstream issue
remains open. But [InterpretISODateTimeOffset](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L923-L935)
uses the guard on the unadjusted local date for `prefer`/`reject`. `use` checks
the balanced UTC date instead; `ignore` follows wall-clock resolution.

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

## MakeDay witness range at the minimum Instant

Status: unresolved witness-range wording, related to open
[ECMA-262 #1087](https://github.com/tc39/ecma262/issues/1087). Rechecked 2026-11-21.

Pinned [GetUTCEpochNanoseconds](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L355-L359)
uses MakeDay, then asserts an integral millisecond result. Frozen ECMA-262
[MakeDay's witness step](https://github.com/tc39/ecma262/blob/b7865f0eed2021720f84d561289401bc414874d0/spec.html#L34685)
asks for a finite time value on the first day of the month. Its
[supported time-value range](https://github.com/tc39/ecma262/blob/b7865f0eed2021720f84d561289401bc414874d0/spec.html#L34073-L34075)
is ±8,640,000,000,000,000 milliseconds.

The minimum Instant is -271821-04-20, epoch day -100000000. April 1 of that
month is day -100000019, or -8640001641600000 milliseconds. Every millisecond
on April 1 lies below the supported range. A reading that restricts the witness
to that range finds none, so MakeDay returns NaN and the later assertion fails.
The earlier [CheckISODaysRange](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L416-L417)
accepts April 20 and does not address this month-start witness.

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

## CompareTimeRecord description reverses the algorithm's signs

Status: editorial inconsistency in pinned Temporal revision
`b038883fe9c6aa871ccab3238c90daf9eb5e9b17`; also present in the
[current rendered clause](https://tc39.es/proposal-temporal/#sec-temporal-comparetimerecord)
when checked on 2026-11-21.

The [description](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L830)
assigns -1 when the second clock is earlier and 1 when the first is earlier.
The [numbered algorithm](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L833-L845)
assigns 1 when the first clock is later, -1 when it is earlier. These disagree.
For example, first hour 12 and second hour 11 returns 1 at the first step;
the description implies -1.

Audit decision: preserve the numbered algorithm's chronological ordering,
consistent with CompareISODate and CompareEpochNanoseconds. This is a prose sign
error, not an implementation comparison bug. TS, Rust and native Hermes controls
check both directions and equality, including every lower-field carry boundary.
Input conversion remains separate audit work. No upstream issue or PR was filed
by this audit.

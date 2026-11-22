# Candidate filtering at Instant endpoints

Frozen Temporal comparison §11.1.13 step4.a requires an actual invalid candidate
to throw. Private candidate filtering is not standalone helper equivalence.
This proof resolves the shipped-data premise; current host-provider binding stays
conditional. No production code change or normative closure credit.

Two actual candidates for one local time differ by their offsets. Since each
valid offset has magnitude below one day, candidates differ by less than two
days. A pair straddling an Instant endpoint requires an offset decrease within
two days of that endpoint. Excluding negative transitions there excludes a mixed
valid/invalid fold. Existing public single-invalid RangeError transport remains
a separate reused contract.

## Consumed generated profiles

Root cquery binds five outputs from these live targets:

- `//packages/intl-datetimeformat:tz_all_tz`
- `//packages/intl-datetimeformat:tz_temporal_compact`
- `//crates/temporal:time_zones_data`

[Generated summary](generated-summary.json) records exact input hashes, 457
packed/compact zones, 448 native records and 63 deduplicated footer rules.
All explicit events lie far from the endpoints. Actual footer transition times
lie between -3,600 and 180,000 seconds; boundary years plus/minus one cover their
possible events. Dynamic footers have finite historical cutoffs, so the lower
endpoint uses constant prehistory. Nearest upper negative event is 3,625,200
seconds away, beyond the 172,800-second window. No failing windows.

[Endpoint rows](generated-endpoints.tsv) preserve each zone's bounds and rule
identity; native records match packed endpoints/footer expressions. Compact
analysis reuses the generator's complete reconstruction check and monotone
same-rule Gregorian spans. [Source hashes](source-hashes.json) bind those owners.

Integral seconds, offsets and milliseconds remain below 2^53. Fractional seconds
division need not be exact: maximum half-ULP is 0.48828125ms, below the minimum
1ms distance to an adjacent whole-second transition. Rounding cannot cross that
comparison. Existing Gregorian integer/floor proofs supply rule-day conversion.

## Current Node host endpoint guarantee

The earlier [host observations](host-observations.tsv) check offsets and
transitions for 457 requested zone names. The exact interval proof now binds
Node 26.5.1 built-in Intl and ICU transition enumeration to the same loaded
2026b resource. The 638 system identifiers contain no transitions in either
complete endpoint interval, including outside Instant bounds.
[Provider proof and reproduction](node-icu/temporal-node-icu-endpoint-proof.md).
The same bound binary and resource also supply a
[six-day offset-spread certificate](node-icu/temporal-node-icu-six-day-spread-proof.md)
for relative rounding. Its [11-day endpoint scan](retained-week-window-summary.json)
also establishes the [retained-prefix week range bound](../temporal-retained-week-endpoint-validity.md).

The [pinned-toolchain proof](node-icu/temporal-pinned-node-icu-proof.md)
adds exact Linux x64 Node 24.14.0 and 26.8.1 builds and the compiled Hermes
formatter. Other host binaries, timezone resources and replacement Intl providers
keep their own boundary premise. The full row stays conditional.

## Unbound host Intl provider

Numeric `formatToParts` applies `TimeClip`. On Node 26.5.1, both exact limits
±8,640,000,000,000,000 ms are accepted and the adjacent outside millisecond
throws at each end. The [host offset provider](../../../packages/temporal/host-timezone.ts)
uses numeric parts. Its probes cannot read the offset outside those limits.
[ECMA-402 §11.5.5 steps 1–2](https://tc39.es/ecma402/#sec-partitiondatetimepattern).
[ECMA-262 §21.4.1.31 step 2](https://tc39.es/ecma262/#sec-timeclip).

At the upper limit E, consider two synthetic offset models. Both report +02:00
at every permitted instant. The second changes to +00:00 at E+15 minutes.
The local time E+30 minutes maps to valid instant E−90 minutes in both models.
Only the second model also maps it to invalid instant E+30 minutes.
The lower limit has a symmetric witness. Numeric Intl observations agree for
the two models, while comparison §11.1.13 step 4.a requires different results.
The exact integers for both witnesses are in [host-unbound-witness.json](host-unbound-witness.json).

An unbound host profile needs an out-of-range candidate capability or an exact
certificate for its actual data and overrides. No backward offset change within
two days of either limit, with the existing single-invalid rejection proof,
suffices. The shipped and pinned profile proofs already have those guarantees.
The default package also accepts other installed Intl providers and timezone
resources, so the full provider premise remains open. [Default provider contract](../../../packages/temporal/README.md#L18).

## Owned FormatJS candidate validation

A public package-to-package regression installs the FormatJS DateTimeFormat
and loads the synthetic upper and lower folds. Before the fix,
`ZonedDateTime.from` returned the sole visible instant for all four
disambiguation modes. The comparison requires RangeError when either
actual candidate is outside the Instant limits.

The [offset provider](../../../packages/temporal/host-timezone.ts#L72) reuses
the installed formatter's private candidate check within one day of either
limit. The [candidate validator](../../../packages/intl-datetimeformat/core.ts#L391)
enumerates decoded historical and recurring offsets and round-trips each
outside instant through the same `TimeZoneOffset` reader. It uses bigint
for the candidate and rounds down to an exact integer millisecond for the
whole-second offset lookup. Nonapplicable offsets never cause rejection.
Numeric Intl without this capability retains the separate provider premise.

Bazel `//packages/temporal:host_candidate_range_test` failed before the
correction and passes both mixed candidates and nonapplicable-offset controls
for all four modes. All five focused Intl and Temporal targets pass.

- Before-fix log SHA-256 `9c01708fa9a9dce8011ffe9d699a1880f4258787c84119d02e5073bb2e32210f`
- After-fix log SHA-256 `fb615856daa7aa1aec8e6e9d6e7ffac547e5d8e02df11c1af904fbd83e3b89a8`

## Reproduce analysis

Use `bazel cquery --output=files` for the three targets above; do not guess
transitioned paths. Run `proof.py` with explicit `--packed`, `--compact`, `--native`
and `--output` paths. Then run `node host.mjs GENERATED_JSON HOST_JSON` on a
runtime supplying native Temporal. Scripts only read supplied data/runtime and
write requested analysis output. They do not execute the production polyfill or
replace Bazel conformance tests. Recheck on timezone-data/runtime changes.

The source hashes above bind the original proof. Later numbered comments in
the two TypeScript providers preserve their source behavior, as shown by the
[comment evidence](../temporal-timezone-provider12-annotation-source-proof.json).

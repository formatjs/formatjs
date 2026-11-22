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

Other host binaries, timezone resources and replacement Intl providers
keep their own boundary premise. The full row stays conditional.

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

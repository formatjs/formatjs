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

## Current host remains conditional

[Host observations](host-observations.tsv) cover all 457 requested names on
Node26.5.1, ICU78.3, tz2026b, separately from shipped tz2026f. Native transition
queries and six Intl endpoint/mapped offset samples show no mismatch.
[Host summary](host-summary.json) defines array fields and shared coordinates;
the compact table round-trips every observed record without loss.

These observations do not prove continuous outside-endpoint neighborhoods or
Intl/native-Temporal provider correspondence. ICU documents
[annual rules](https://unicode-org.github.io/icu-docs/apidoc/released/icu4c/classicu_1_1AnnualTimeZoneRule.html)
and [Gregorian SimpleTimeZone rules](https://unicode-org.github.io/icu-docs/apidoc/released/icu4c/classicu_1_1SimpleTimeZone.html).
Those class contracts do not bind actual runtime zone construction, database
final-rule decoding or out-of-history offset paths. That exact source binding
remains required. Do not promote the current host, parent clause or chapter.

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

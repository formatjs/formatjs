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

[Chromium 156 resource replay and browser comparison](chromium-provider-audit.md)
record additional 2026e evidence for a browser profile.

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

### Published legacy formatter replay

The released FormatJS DateTimeFormat 7.8.1 installs through
`polyfill-force.js` and its English locale entry. Its public formatter
reads the synthetic rows supplied through `__addTZData`. Its
`formatToParts` lacks the private candidate query used by the current
owned formatter. The same Temporal package therefore reaches both provider
paths without changing formatter methods. [Published formatter](https://www.npmjs.com/package/@formatjs/intl-datetimeformat/v/7.8.1).

- A six-hour +12:00 pulse gives local 15:00 two actual candidates at 03:00
  and 15:00 UTC. Legacy sampling returns 15:00 in all four modes, including
  `reject`. This exercises §11.1.13 step 3.a.
- A six-hour +04:00 pulse makes local 01:00 unreachable. The nearest
  reachable locals are −1 ns and 04:00. The legacy provider throws in all
  four modes. The owned provider returns 21:00 UTC on the previous day for
  `earlier`, 01:00 UTC for `later` and `compatible`, and throws for
  `reject`. This exercises §11.1.12 steps 6–7.
- A fold straddles each Instant limit. Legacy sampling accepts the one
  visible candidate in all four modes. The owned provider throws in every
  mode after round-tripping the out-of-range candidate. This exercises
  §11.1.13 step 4.a.

The replay asserts raw public offset readings and TimeClip before running
Temporal. Under a stable exact offset reader, every candidate emitted by
the fallback list round-trips inside the Instant range. The failures are
omissions from that list and its gap boundary probes. They concern the
synthetic custom data accepted by the released formatter. The shipped IANA
data and the other certified profiles retain their own evidence.
[Replay fixture](legacy-provider-replay.mjs).

- Legacy result SHA-256 `1652f3f5071c91146bfe455a82feb8c2cdf6f42e69c83152ad0275a2c97747df`
- Owned result SHA-256 `56efd3a337c89b3c71339ffb887fe847bc8dc01e4ff9e09304c788e98092b1a8`

Run with Node 26.5.1. Install the pinned release into a scratch directory
and resolve the current package directories from the Bazel targets.

```sh
replay=knowledge-base/audits/temporal-timezone-boundary-proof/legacy-provider-replay.mjs
replay_dir=$(mktemp -d)
npm install --prefix "$replay_dir" --ignore-scripts --no-audit --no-fund \
  --save-exact @formatjs/intl-datetimeformat@7.8.1
temporal_pkg=$(bazel cquery --output=files //packages/temporal:pkg)
datetime_pkg=$(bazel cquery --output=files //packages/intl-datetimeformat:pkg)
matcher_pkg=$(bazel cquery --output=files //packages/intl-localematcher:pkg)
memoize_pkg=$(bazel cquery --output=files //packages/fast-memoize:pkg)
node "$replay" legacy "$replay_dir/node_modules/@formatjs/intl-datetimeformat" "$temporal_pkg"
node "$replay" owned "$datetime_pkg" "$temporal_pkg" "$matcher_pkg" "$memoize_pkg"
```

## Owned FormatJS candidate validation

A public package-to-package regression installs the FormatJS DateTimeFormat
and loads the synthetic upper and lower folds. Before the fix,
`ZonedDateTime.from` returned the sole visible instant for all four
disambiguation modes. The comparison requires RangeError when either
actual candidate is outside the Instant limits.

The [offset provider](../../../packages/temporal/host-timezone.ts#L72) reuses
the installed formatter's private candidate check within one day of either
limit. The [candidate validator](../../../packages/intl-datetimeformat/core.ts#L441)
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

## Owned FormatJS candidate enumeration

A six-hour +12:00 pulse produces two actual candidates for local 15:00.
The former host samples all observed zero offset, so compatible selected
15:00 UTC instead of 03:00 UTC. The package regression now covers compatible,
earlier, later, reject, and a matching explicit offset. It also exercises
both endpoint folds, nanosecond precision near the limits and a transition,
and a forward gap.

The [candidate interval search](../../../packages/ecma402-abstract/DateTimeFormat/TimeZoneOffset.ts#L92)
visits the first active historical offset, every intersecting transition,
and reachable recurring offsets. The [owned lookup](../../../packages/intl-datetimeformat/core.ts#L415)
subtracts each candidate offset from exact local nanoseconds and confirms
it through the same provider. Subtracting an integral offset commutes with
flooring to milliseconds, and the lookup interval stays below 2^53 ms.
It rejects actual invalid instants and returns the distinct valid ones for
sorting. An empty List still reaches the existing gap disambiguation path.

Native Intl without the hook still needs an exact sampling premise. The
owned correction closes the demonstrated boundary and interior cases.
All six focused Bazel targets pass.

- Interior before-fix log SHA-256 `b4c0d818d2de119ffcd850e4cb68c868826e8389a239fd88e1628bb3834a1cbf`
- Interior after-fix log SHA-256 `8b8cd9b46bf696acace232da4e47cb9942e752d062c885f0b2410411ed40c2d9`

## Owned FormatJS gap disambiguation

The short four-hour offset pulse makes local 01:00 unreachable. Its nearest
reachable locals are −1 ns and 04:00, with offsets 0 and +04:00. Sampling a
day on either side sees zero twice and formerly throws for every mode.
The exact path returns 21:00 UTC on the previous day for earlier and 01:00
UTC for later and compatible. Local 03:00 also tests the shifted query: local 07:00 is a fold
with two candidates. Later and compatible select 07:00 UTC.

The [owned resolver](../../../packages/intl-datetimeformat/core.ts#L458) enumerates
UTC boundaries around the gap and projects the last nanosecond before and
first nanosecond after each boundary. With offsets under one day, reachable
locals within two days bound the nearest choices. Candidate instants for
those choices are therefore within three days. The resolver confirms
singleton boundary candidates, shifts by their offset difference, and
re-queries the exact list. The fallback still handles native Intl and
cases without valid boundary candidates or matching gap assumptions.

A separate +12-hour pulse lasting six hours yields a zero shift because both
nearest boundaries have offset zero. The requery remains empty, so the
comparison assertions in steps 16.f and 24 fail for this synthetic provider.
The existing fallback remains in place for such a window.

The public Bazel regression failed before the correction. All six focused
Temporal and DateTimeFormat targets passed afterward.
[Proposal comparison §11.1.12](https://tc39.es/proposal-temporal/#sec-temporal-disambiguatepossibleepochnanoseconds).

- Short gap before-fix log SHA-256 `7288268ca20ea81bb86fb36202b71d137564ffa9d682b5715b65600ce3e9fa19`
- Short gap after-fix log SHA-256 `75cc28d542197b2824625daa410711a4424f4693a38835a97291048e596d3469`

### Owned gaps near the Instant limits

A pulse less than one day from either Instant limit used to bypass the
owned boundary lookup. Legacy ±day sampling then missed the short offset
change. A public packaged regression reproduces the RangeError on the old
build. It now verifies earlier, later, compatible and reject independently
at both limits.

The boundary visitor reads the same decoded zone rows that supply offsets.
The resolver checks the actual candidates for each nearest reachable local
boundary, including the inclusive Instant bounds. Both boundaries must
have one valid candidate. The shifted public query still throws if any of
its actual candidates is outside the range. The positive-limit regression
checks that earlier succeeds while later and compatible throw for that case.

[Public boundary regression](../../../packages/temporal/tests/host-candidate-range.test.mjs#L294).
[Exact boundary checks](../../../packages/intl-datetimeformat/core.ts#L491).
[Public candidate validation](../../../packages/intl-datetimeformat/core.ts#L441).
[Temporal comparison §11.1.12 steps 6–7](https://tc39.es/proposal-temporal/#sec-temporal-disambiguatepossibleepochnanoseconds).
[Temporal comparison §11.1.13 steps 3.a and 4.a](https://tc39.es/proposal-temporal/#sec-temporal-getpossibleepochnanoseconds).

The focused Bazel host-candidate target passes. Numeric Intl without this
owned lookup still requires separate coverage evidence.

## Reload the owned timezone data

The public regression warms offsets and transitions, then replaces timezone
data with `__addTZData`. Intl formatting and exact candidate lookup see the
replacement immediately. Before the correction, existing and newly resolved
ZonedDateTime values still reported the warmed offset and next transition.

The owned formatter publishes an opaque generation token after replacing its
decoded data. The host adapter checks it before reading offsets, cached
transition results or unchanged search intervals. Native Intl without this
private hook retains its original cache. The regression checks warm and fresh
values, the local hour, and both transition directions after reload.

- Reload before-fix log SHA-256 `f6981566d05596a97351a02f97e3a09355e2ecdf359b4ac06524f16ffb192266`
- Reload after-fix log SHA-256 `bafa7b15ec3cb402d20bf215dcc1316b1c13f84cc7b546ae959534773473c858`

## Exact owned next and previous transition

A six-hour packed offset pulse returned null from either side even though
each transition was within the supported Instant range. Equal sampled offsets
hid the pulse. With a discontinuous custom footer, the old adapter observed
the switch at the next second. The same formatter used the footer from the
first millisecond after its last explicit row.

The owned path walks the sorted explicit rows from the indexed query
position, then considers recurring footer events and the footer handoff.
It compares offsets on both sides of each boundary. Direction is strict at
nanosecond precision and both Instant limits are inclusive. The offset
reader uses those same decoded rows at floored epoch milliseconds.
[Transition lookup](../../../packages/ecma402-abstract/DateTimeFormat/TimeZoneOffset.ts#L171).
[Owned offset and transition query](../../../packages/intl-datetimeformat/core.ts#L539).
[Temporal transition dispatch](../../../packages/temporal/host-timezone.ts#L318).
[Proposal comparison §6.3.46 steps 9.a and 10.b](https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.gettimezonetransition).
The implementation-defined boundary contract is in
[§11.1.3](https://tc39.es/proposal-temporal/#sec-temporal-getnamedtimezonenexttransition)
and [§11.1.4](https://tc39.es/proposal-temporal/#sec-temporal-getnamedtimezoneprevioustransition).

The public regression checks the pulse, both Instant limits, a handoff at
+1 ms, and seasonal recurrence. Eight focused Bazel targets passed. Other
Intl providers need data evidence for their sampled transition path.
Explicit `__addTZData` replacement changes the provider input. Stability
across such replacements is separate from immutable-provider correctness.

- Short transition before-fix log SHA-256 `105496d7dd204f19499193797e1a4bad8fda66075cde062caf779b7d4563a10c`
- Owned transition after-fix log SHA-256 `260f79fceb44720c8f60f3aad23337831257420b884e4d5867b87ff05a8e5186`

## Finite future history in native Intl

Pinned Node 24.14.0 (ICU 78.2, tzdata 2025c) exposed a previous-transition
lookup from 2100 in Casablanca and El_Aaiun that returned a 2029 transition.
The exact loaded ICU previous-transition query returns 2087-05-11T02:00Z
for both zones. The old shortcut jumped to a date near the current year,
skipping the remaining Ramadan changes.

The host adapter now includes the last explicit transition from the shipped
TZif data in the scan before it uses the recurring-tail shortcut. The bound
comes from the same pack as the sampling intervals. Both directions add the
existing three-year margin. Offsets come from the installed Intl provider.
[Generated bound](../../../packages/intl-datetimeformat/scripts/temporal-timezones.ts#L58).
[Host search](../../../packages/temporal/host-timezone.ts#L346).
[Proposal comparison §6.3.46 steps 9.a and 10.b](https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.gettimezonetransition).

The package regression asserts the exact BigInt epoch through the ordinary
Temporal entry point. Eight focused Bazel targets passed. Provider data
outside the shipped bound or recurrence premise remain conditional.

The packed maximum is 2086-10-25T23:00Z. All three bound ICU profiles have
638 IDs, with finite rules through 2087-10-24T23:00Z and recurring joins
through 2088-01-01. The padded bound covers the later ICU history and at
least one full recurring year. The [ICU scanner](node-icu/temporal-node-icu-transition-separation.mjs)
reports these inputs as `lastFinite` and `tailStarts`.

- Finite future history before-fix log SHA-256 `ace686c3c2001058594d9ed9c068fbc116de86dc76a6a7f671e41f95ff760119`
- Finite future history after-fix log SHA-256 `b2ccf02c9ced5c729d7536fb6b27219a07dfb93af3165fead6e600f129da0557`

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

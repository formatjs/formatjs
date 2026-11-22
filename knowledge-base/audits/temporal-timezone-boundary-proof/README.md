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
[Debian JavaScriptCoreGTK replay](jsc-provider-audit.md) binds a separate
JavaScript engine and its loaded ICU 76.1 timezone profile.
[Debian SpiderMonkey replay](spidermonkey-provider-audit.md) binds the shell's
hidden bundled ICU 73 reader and 2025a timezone resource.

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

The 7.8.1 root export and `polyfill-force.js` create different constructors,
`formatToParts` functions, and timezone registries. The force entry installs
its constructor without exporting it. Registration replaces that
constructor's writable `tzData` property, and the separately imported root
constructor retains its own table. Importing the root export therefore
cannot bind the dataset used by the installed formatter. An exact adapter
would need an explicit contract for installed constructor identity, row
interpretation, and data replacement.

The direct replay also warms the legacy provider with fixed UTC offset for Chicago,
then installs a single +01:00 jump at epoch zero in Chicago and Los Angeles.
The raw formatter sees the jump. The cold Los Angeles query resolves
00:30 to −30 min for `earlier` and +30 min for `later` and `compatible`,
and throws for `reject`. The warm Chicago query returns +30 min in every
mode because the fallback offset cache retains the earlier data. This
failure is separate from overlapping transitions and TimeClip. The installed
7.8.1 constructor declares `tzData` and replaces it on `__addTZData`.
The host adapter's direct import leaves that property unread.

### Legacy reload after installing Temporal

The Temporal installer recognizes the captured legacy formatter using static
data descriptors it already acquires when installing its Intl bridge.
The host adapter then scopes offset and transition samples from that exact
formatter and parts method to a single lookup. A reload through either the
retained original registrar or the wrapper is visible on the next lookup.
Native Intl still reuses samples across calls. The current owned formatter
continues to use its generation hook.

The installed replay warms the Chicago kernel before installing Temporal,
warms both transition directions, then replaces data twice. It checks the
offset, candidate and gap paths as well as both transitions. Direct imports
that skip the installer still reproduce stale samples. Arbitrary custom
data still require spacing and endpoint evidence.

The legacy replay checks that all four public single and range formatting
methods reject Number inputs just outside TimeClip and reject BigInt
inputs. The captured Temporal readers require branded values. Instant and
ZonedDateTime construction rejects epochs one nanosecond outside the same
limits, so those public inputs have the same endpoint constraint.

- Legacy result SHA-256 `1652f3f5071c91146bfe455a82feb8c2cdf6f42e69c83152ad0275a2c97747df`
- Installed legacy result SHA-256 `01df826851d86677d918205bf227fbf6682a16d62ac190d827336152b82264a2`
- Owned result SHA-256 `56efd3a337c89b3c71339ffb887fe847bc8dc01e4ff9e09304c788e98092b1a8`

Run with Node 26.5.1. Install the pinned release into a scratch directory
and resolve the current package directories from the Bazel targets.

```sh
replay=knowledge-base/audits/temporal-timezone-boundary-proof/legacy-provider-replay.mjs
replay_dir=$(mktemp -d)
npm install --prefix "$replay_dir" --ignore-scripts --no-audit --no-fund \
  --save-exact @formatjs/intl-datetimeformat@7.8.1
temporal_pkg=$(bazel cquery 'config(//packages/temporal:pkg, target)' --output=files)
datetime_pkg=$(bazel cquery 'config(//packages/intl-datetimeformat:pkg, target)' --output=files)
matcher_pkg=$(bazel cquery 'config(//packages/intl-localematcher:pkg, target)' --output=files)
memoize_pkg=$(bazel cquery 'config(//packages/fast-memoize:pkg, target)' --output=files)
node "$replay" legacy "$replay_dir/node_modules/@formatjs/intl-datetimeformat" "$temporal_pkg"
node "$replay" legacy-installed "$replay_dir/node_modules/@formatjs/intl-datetimeformat" "$temporal_pkg"
node "$replay" owned "$datetime_pkg" "$temporal_pkg" "$matcher_pkg" "$memoize_pkg"
```

### Function source recognition for direct imports

The captured `Function.prototype.toString` returns exact source for the
published 7.8.1 constructor and `formatToParts` on Node 26.5.1. Native,
bound, live proxy and revoked proxy controls return `NativeFunction` text
without invoking any proxy trap. The explicit `tzData` descriptor control
invokes the armed descriptor trap. The exact released source can therefore
precede descriptor inspection on this V8 profile. Source text alone leaves
the provider's captured state and repackaged builds unverified.
[ECMA-262 §20.2.3.5 steps 2–4](https://tc39.es/ecma262/#sec-function.prototype.tostring).

The pinned Hermes runner reports `[bytecode]` for both exact source
expressions and its native formatter. The same captured reflection invokes
the live callable proxy's `get name` trap and throws `TypeError` for the
revoked proxy. A check of the returned text would happen after that get.
These behaviors prevent a shared source-reflection gate on arbitrary host
constructors. Direct-import legacy cache applicability remains conditional.

```sh
reflection=knowledge-base/audits/temporal-timezone-boundary-proof/legacy-source-reflection.mjs
legacy_pkg="$replay_dir/node_modules/@formatjs/intl-datetimeformat"
bazel build -c opt //native/hermes:hermes_runner
hermes=$(bazel cquery -c opt 'config(//native/hermes:hermes_runner, target)' --output=files)
node "$reflection" fixture "$legacy_pkg" > "$replay_dir/reflect.js"
"$hermes" --native-datetimeformat "$replay_dir/reflect.js" > "$replay_dir/hermes-reflect.json"
node "$reflection" verify "$legacy_pkg" "$hermes" "$replay_dir/hermes-reflect.json"
```

The replay pins the published bundle and both extracted source hashes. Its
result SHA-256 is `7a6596b724af97ecf2f0bd539550af3d711998d57d692e12278b814a114652a8`
with Node ELF `fb48e77df2f8e92fedfec39afa60a5f41563441f6b61316ada5fb295a431c2c6`
and Hermes ELF `0589610953acf7d6f5b7cf3ccb1f30bbd117e69931b5eae62698ab57586e0a81`.

### Released formatter with its shipped data

The custom rows in the replay above exercise capabilities beyond the two
datasets shipped with 7.8.1. A separate scan loads the published force entry,
English locale and one data entry per Node 26.5.1 process. It reads the actual
decoded table on the installed constructor. The pinned tarball is
[intl-datetimeformat-7.8.1.tgz](https://registry.npmjs.org/@formatjs/intl-datetimeformat/-/intl-datetimeformat-7.8.1.tgz)
with npm integrity
`sha512-tGVZ3KdbHQwmA8wBn7gEJeOE9zo0InoyrbJWsD4VYdHGJfXykflOpdNC69+QaZShxfEQ6dwUfXjDfNzxe4AO4A==`.
The scanner pins the installed formatter, locale and data file bytes.

- `add-all-tz.js` has 452 tables and 43,846 effective offset changes.
  SHA-256 `a7742ee85beefcdae55f60cafcab5caabf9d1101b6009d2c1415e06aece8ef2d`.
- `add-golden-tz.js` has 246 tables and 26,726 effective offset changes.
  SHA-256 `2c2094c54fc26c8b43f1afae3748e939d06520f6d327b7e81c08eac149c22e2d`.

The released formatter takes the row preceding the first timestamp greater
than the input. The scan collapses raw rows sharing the same running timestamp
maximum before counting changes. This preserves the formatter's lookup for
the 311 non-increasing rows in the full table and 205 in the golden table.
A resolved alias uses its target table, and a missing target gives zero offset.
Public `formatToParts` probes check both sides of the closest changes and
whole-day jumps, plus four Instant-limit positions per installed table key.
All 1,886 full-table probes and 1,030 golden-table probes pass.

Both tables have minimum effective change separation 601,200 seconds, maximum
offset magnitude 57,368 seconds, maximum jump 86,400 seconds and zero changes
within two days of either Instant limit. This supplies the four conditional
premises for those fixed formatter/data pairs:

- Every candidate for local epoch scalar `x` lies in `(x − day, x + day)`.
  Over that interval the rule changes at most once, so the endpoint offsets
  include every possible offset and the runtime round-trip filters the list.
  Near either Instant limit the corresponding two-day neighborhoods are
  constant, so a clipped probe still reads the offset that applies outside.
  A single outside candidate leaves an empty list and equal fallback offsets,
  producing RangeError. No mixed valid/invalid fold is possible.
  [Proposal comparison §11.1.13 steps 3.a and 4.a](https://tc39.es/proposal-temporal/#sec-temporal-getpossibleepochnanoseconds).
- For a forward change at `t` from offset `a` to `b`, a gap input `x` lies in
  `[t + a, t + b)`. The two day-radius probes straddle `t` and see `a` and `b`.
  Earlier segments end before `t − day` in local time, and later segments start
  after `t + day`, because adjacent changes are more than two days away and
  every offset magnitude is below one day. Thus the latest reachable local
  before the gap is `t + a − 1 ns`, and the earliest after is `t + b`. Both
  have one candidate. The shift is `b − a`, and the exact earlier/later epochs
  are `x − b` and `x − a`. The no-change endpoint neighborhoods ensure these
  gap windows stay inside the Instant range.
  [Proposal comparison §11.1.12 steps 6 and 7](https://tc39.es/proposal-temporal/#sec-temporal-disambiguatepossibleepochnanoseconds).

Reproduce with the same npm install command above. Run each data entry in
a fresh process.

```sh
scan=knowledge-base/audits/temporal-timezone-boundary-proof/legacy-shipped-data-scan.mjs
legacy_pkg="$replay_dir/node_modules/@formatjs/intl-datetimeformat"
node "$scan" "$legacy_pkg" add-all-tz.js
node "$scan" "$legacy_pkg" add-golden-tz.js
```

The bounds describe the shipped legacy data as read by that release. Replacing
the table can invalidate them, as the custom replay demonstrates.

## Owned FormatJS candidate validation

A public package-to-package regression installs the FormatJS DateTimeFormat
and loads the synthetic upper and lower folds. Before the fix,
`ZonedDateTime.from` returned the sole visible instant for all four
disambiguation modes. The comparison requires RangeError when either
actual candidate is outside the Instant limits.

The [offset provider](../../../packages/temporal/host-timezone.ts#L93) reuses
the installed formatter's private candidate check within one day of either
limit. The [candidate validator](../../../packages/intl-datetimeformat/core.ts#L442)
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
and reachable recurring offsets. The [owned lookup](../../../packages/intl-datetimeformat/core.ts#L416)
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

The [owned resolver](../../../packages/intl-datetimeformat/core.ts#L459) enumerates
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

[Public boundary regression](../../../packages/temporal/tests/host-candidate-range.test.mjs#L359).
[Exact boundary checks](../../../packages/intl-datetimeformat/core.ts#L497).
[Public candidate validation](../../../packages/intl-datetimeformat/core.ts#L442).
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

### Canonical timezone rows after an alias reload

Intl preserves the display identifier while reading its canonical data
zone. Both private Temporal hooks now use that same data-zone slot. A warm
`US/Eastern` lookup previously missed an overlap and two transitions after
the reload supplied only `America/New_York`. It returned 15:00 UTC for local
15:00, whose first real candidate was 03:00 UTC. With a conflicting alias
row, the old hooks could return +01:00 while Intl showed +04:00.

The packaged regression checks the exact earlier overlap candidate,
rejection, both transition directions, the formatter offset, and both gap
directions across reloads. Temporal retains the public alias identifier.

- Packaged before-fix result SHA-256 `e406db75a1b80294a60395fca2abf51d3f630d212c2076d13ec09e5154e2711f`
- Packaged after-fix result SHA-256 `0080eac6c3a4e4db32fe079506cfe62cc217de4a78d0a7d79626cdd3c362372a`
- Six-target Bazel log SHA-256 `4e87cead8a895b596c9ef7876b053e27a5482cc48368f3ae502334ec32ddc61b`

### Host capability descriptors

The host bridge reads three private capabilities from the captured
`formatToParts` function. Accessor descriptors have no own `value`. The
old bridge read a getter inherited from `Object.prototype` in that case.
The bridge now checks the descriptor's own fields. The regression observes
zero getter calls and the same Kathmandu offset of 19,800,000,000,000 ns.

[Descriptor check](../../../packages/temporal/host-timezone.ts#L64).
[Regression](../../../packages/temporal/tests/host-timezone.test.ts#L98).
[ECMA-262 §7.3.12 steps 1–3](https://tc39.es/ecma262/#sec-hasownproperty).

- Before-fix SHA-256 `55082834f541861ed229a117a7b1f0aafb54475ab8f9b058c2de8fa640a65bb7`
- Six-target Bazel SHA-256 `8fdbfb6500b5246608d777a856663f572468a391262a3b10539375a8bea560f7`

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
[Transition lookup](../../../packages/ecma402-abstract/DateTimeFormat/TimeZoneOffset.ts#L208).
[Owned offset and transition query](../../../packages/intl-datetimeformat/core.ts#L558).
[Temporal transition dispatch](../../../packages/temporal/host-timezone.ts#L374).
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

### Fixed-footer handoff in loaded zones

Both loaded kernels previously read the new offset at a discontinuous
fixed-footer handoff but missed the boundary in next and previous
queries. Compact TypeScript now delegates to the packed formatter's
transition search. Its offset reader switches at the first millisecond
after the explicit cutoff. Rust's borrowed offset reader switches at the
first whole second after the cutoff, and its transition search now checks
that same instant. Both tests query one nanosecond before and after the
handoff and verify strict direction at the handoff itself.

[Compact delegation](../../../packages/temporal/kernel.ts#L280).
[Rust handoff check](../../../crates/temporal/timezone.rs#L485).

- Before-fix Bazel SHA-256 `4413a6ddc2e8a0fd563f9cf390be32878f5b00d727670e5133be548ab37a1bd5`
- Combined nine-target Bazel SHA-256 `78daf4411c68153d468dc61a45cdaca6e8dd00582929d7ee9cb880def95fa8d0`

### Rust transition at the minimum Instant

The explicit and recurring Rust searches used two typed Instants to
compare offsets across a boundary. A transition at the minimum Instant
has a predecessor outside that type's range. The search now reads raw
epoch seconds on each side, then returns the valid boundary. At one
nanosecond above the minimum, both test zones return the minimum as
their previous transition. The strict query from the minimum returns
null. An unchanged offset at the same timestamp returns null too.
[Rust offset check](../../../crates/temporal/timezone.rs#L462).
[Regression](../../../crates/temporal/lib.test.rs#L4394).
[§11.1.4](https://tc39.es/proposal-temporal/#sec-temporal-getnamedtimezoneprevioustransition).

- Before-fix Bazel SHA-256 `18fa17e034ea575ab2d357c25f1845f3f30750f429669e65d1682362a61b45d4`
- Six-target Bazel SHA-256 `61797368758b5479318f96850fcdbf44ae11fa739a7b66870aca64831bb742a5`

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
[Host search](../../../packages/temporal/host-timezone.ts#L400).
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

### Host transition cache writes

A native New York lookup one nanosecond before the spring 2024 change
reaches the result cache directly. A January lookup also writes an
unchanged interval. Both used the captured Array push, which still calls an
inherited index setter. Both now append an own data property to the private
array. The first and repeated lookups return the transition at the exact
nanosecond in both cases.
[Host cache writes](../../../packages/temporal/host-timezone.ts#L456).
[Native regression cases](../../../packages/temporal/tests/host-timezone.test.ts#L434).

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

## Overlapping owned gap boundaries

Take an initial offset of zero, then +04:00 at 00:00 UTC and +02:00 at
01:00 UTC. Local 01:30 lies in a gap. The nearest earlier local clock is
−1 ns and the nearest later local clock is 03:00. Those bounds come from
different transitions, giving a two-hour shift. Earlier selects 1969-12-31T23:30Z. Later and compatible select
1970-01-01T01:30Z. The old borrowed
Rust and compact TypeScript paths selected UTC −02:30 for earlier.
Mirrored rows test the nearest earlier side. A third control checks a
later shift with two valid candidates. Translated controls also test both
Instant limits with every relevant candidate inside the range.

The exact interior search projects segment boundaries within three days
of the requested local scalar. A valid epoch one day before or after
projects to the corresponding side, because each offset magnitude is
less than a day. This bounds the nearest local clock by two days and its
epoch by three. The shifted local is resolved again through the candidate
list. When the comparison's singleton and shifted-list assumptions fail,
existing gap behavior supplies the fallback. Clipped limits and host
provider completeness retain their separate evidence.

- [Compact TypeScript lookup](../../../packages/temporal/kernel.ts#L368).
- [Borrowed Rust lookup](../../../crates/temporal/zoned.rs#L477).
- [Temporal comparison §11.1.12 steps 6–7](https://tc39.es/proposal-temporal/#sec-temporal-disambiguatepossibleepochnanoseconds).

Five focused Bazel gates pass. Before-fix log SHA-256 `060e0dabd0f0a411c115def738840bf7e89fbd85f74c900101fd1614b8e09331`.
Passing log SHA-256 `fcf449ff0ddbe8ef681dcb22a4a0f280df62199c84cac58c334fea1b35c38bab`.

### Shifted clock still inside a gap

An owned zone changes from +7h to −4h at epoch hour −86, to +16h
at −62, then to −3h at −58. For local hour −65, the nearest boundary
offsets are −4h and −3h. Their one-hour shift leaves the clock inside
the same gap. The owned Intl path used to drop to numeric sampling and
throw. It now uses the exact containing transition, matching the loaded
TypeScript and Rust policy. Earlier returns epoch hour −81. Later and
compatible return −61. Reject still throws.

The regression uses this gap as a day-rounding endpoint and translates
it to check the minimum Instant and one earlier result. This exercises
the fallback when the comparison's nonempty shifted-list assertion fails.
[§11.1.12 steps 16.f and 24](https://tc39.es/proposal-temporal/#sec-temporal-disambiguatepossibleepochnanoseconds).

- Before-fix Bazel SHA-256 `cb4c8dc7cc869d3c2b77be248205ef1ca939deaeae0b11611dd9f5f24da5dafc`
- Pinned Node 26.8.1 package replay SHA-256 `bf5ca9418c93f957cbb62458c7057466006748bbb1007876f5d7c98f39c2306e`

### Folded nearest gap boundary

An initial −03:00 changes to −04:00 at epoch hour −4, then +04:00 at
−3. Local midnight is missing. Its nearest earlier local clock, 17:00
minus 1 ns the previous day, has two candidates at epoch hours −4 and
−3 minus 1 ns. Its nearest later local clock, 01:00, has one candidate
at epoch hour −3. This falsifies the singleton assertion in step 9.
Choosing the earlier or later candidate there would shift midnight
to local 07:00 or 08:00, giving different results. The package currently
uses the containing transition and returns epoch hour +3 for later.
[§11.1.12 steps 8–14](https://tc39.es/proposal-temporal/#sec-temporal-disambiguatepossibleepochnanoseconds).
[Package replay](owned-wide-rounding-replay.mjs).

Pinned Node 26.8.1 replay SHA-256
`643e9172bda35b8064159eec5be6f83f9835f283633ed201b36ca31a8c65efa9`.

### Compact gap crossing the minimum Instant

Start at zero offset, then change to +04:00 at the minimum Instant,
−02:00 one hour after it and +03:00 three hours after it. Local minimum
plus two hours is missing. The nearest local clocks before and after it
have unique, valid candidates. The right boundary comes from the
transition exactly at the minimum. Compact lookup previously skipped
that transition and resolved later one hour too early.

The compact scan now includes the minimum and reads the raw offset
before it. Later and compatible return minimum plus five hours, matching
owned Intl. Earlier selects an out-of-range result and throws. Reject
continues to throw for the gap.
[Compact scan](../../../packages/temporal/kernel.ts#L362).
[Regression](../../../packages/temporal/tests/compact-timezone.test.ts#L89).
[§11.1.12 steps 6–7](https://tc39.es/proposal-temporal/#sec-temporal-disambiguatepossibleepochnanoseconds).

- Before-fix Bazel SHA-256 `b7c774a8bdd1ba433d151fed376a88b57170d3f0d31e06e48eafa02bb84ac975`
- Passing Bazel SHA-256 `05014b2339970719e62ece5796bb6e117a78e0216f750a91ccd6a8ca6d1121c0`
- Pinned packaged replay SHA-256 `7991fec1d1a8fa72f1e9bd492e5f225ab9be7f10a4c8e548d1e2821c8236480a`

A separate custom profile adds a +03:00 row one hour before the
minimum, keeping the same later rows. For local minimum plus 3.5h
the nearest earlier wall time maps to minimum minus 1 ns.
The old compact approximation returned minimum plus 5.5h for later.
The exact lookup now rejects the out-of-range auxiliary candidate.
Owned Intl also throws. The comparison's infallible lookup in step 8
does not hold for this profile.
Replay SHA-256 `d2772152785fe0ed15d8f627520065d4487f3153c0c7feeb0ca1b0ca7a5abf08`.

### Gap auxiliary candidate outside the Instant range

Let M be the maximum Instant. Start at +02:00 and change to −04:00 at
M−26h, +16:00 at M, then −03:00 at M+4h. Local M−3h has no candidate.
Its closest later local clock is M+1h, with sole raw candidate M+4h.
GetPossibleEpochNanoseconds rejects that candidate, so the infallible call
in step 10 cannot complete. Adding +18:00 at M+5h preserves this witness.
The public replay checks both profiles and the raw rejection.
[§11.1.12 steps 6–11](https://tc39.es/proposal-temporal/#sec-temporal-disambiguatepossibleepochnanoseconds).
[§11.1.13 step 4.a](https://tc39.es/proposal-temporal/#sec-temporal-getpossibleepochnanoseconds).

Owned Intl rejects the auxiliary lookup as a shift source and falls back
to the clipped day samples (+02:00, +16:00). It returns M−19h for earlier,
M−5h for compatible and later, and RangeError for reject. The compact
kernel enumerates only in-range events, so it tries M+16h as its later
boundary. With no final +18:00 row, the complete candidate set there
contains M and M+19h. The compact auxiliary lookup throws for earlier,
compatible and later. With the final row the only candidate there is M.
The +20h shift then returns M−19h for earlier and rejects M+1h for
compatible and later. Both compact profiles reject the original gap in
reject mode.
[Owned Intl gap lookup](../../../packages/intl-datetimeformat/core.ts#L490).
[Host day samples](../../../packages/temporal/host-timezone.ts#L348).
[Compact gap lookup](../../../packages/temporal/kernel.ts#L383).

A clipped retry can reproduce the compact result in the second profile
when both clipped boundaries have complete, valid singleton candidate
sets and a nonzero shift within one day. The first profile lacks that
proof. The existing fallback remains scoped policy, and these witnesses
leave the rendered comparison conditional. The explicit post-limit rows
are valid packed Intl inputs. Borrowed Rust TransitionZone rejects such
explicit rows, so this replay establishes no Rust parity result.
[Rust transition table validation](../../../crates/temporal/timezone.rs#L256).
[Package replay](owned-wide-rounding-replay.mjs).

Node 26.8.1 public replay output SHA-256
`99e322258cdc06e4f0d642d1a7369d3ae1162e77c86b5ff70bfd0766fbce6343`.

### Start of day after intersecting transitions

With initial offset +5h, an offset change to −5h at epoch hour −5 is
followed by +4h at −3. Local midnight is absent. The first reachable
local clock after it is 01:00 at epoch hour −3. Ordinary compatible
resolution instead selects −6, before that transition. Starting a
backward scan from −6 misses the day boundary. PlainDate also used to
rederive the requested date from that disambiguated instant.

The public replay distinguishes those operations and checks ZonedDateTime
start of day, date-only parsing and PlainDate conversion. The Rust fixture
uses the same offsets and transitions.
[§11.1.14 steps 5–7](https://tc39.es/proposal-temporal/#sec-temporal-getstartofday).

With exact transition queries and a fully representable search interval,
the forward scan projects each transition to local time. UTC midnight
plus one day projects above midnight and within two local days. Any
earlier reachable wall time must occur less than three epoch days past
midnight. The scan tightens that bound when it finds a nearer local
time, then checks for a sole round-trip candidate. At the upper limit it
can also accept a clipped scan when the best local time plus one day
is at most the maximum Instant. Any later epoch would project above
that local time. The translated September 11, 275760 fixture confirms
this bound across packaged, compact and Rust paths. The fallback remains
for a clipped lower search or an upper search that cannot prove the
closest local clock.
[TypeScript scan](../../../packages/temporal/kernel.ts#L70).
[Rust scan](../../../crates/temporal/zoned.rs#L374).

- Before-fix TypeScript Bazel SHA-256 `7a8d461a2e1b4cad672a83f634c8a67ea2ecf1ec6038ed31998b42ea46cdb650`
- Before-fix Rust Bazel SHA-256 `fb73f1d84265386c0963821cf5f63f8efec592efb9d045adfd2da26c29361189`
- Combined nine-target Bazel SHA-256 `c51b8181552a78383751b901b35637d34f906014c8000ec86c686baba53697c2`
- Passing public replay SHA-256 `1b46c8e3f99ffadea3b5c64f917f8c3fb4ca072d40f395875b9a4d83c6970867`
- Upper bound before-fix Bazel SHA-256 `dc419ed72442997425fd11e35ac552f812eaef7b469bf2f9d0e9e83d4e82f6d7`
- Combined upper bound and handoff Bazel SHA-256 `78daf4411c68153d468dc61a45cdaca6e8dd00582929d7ee9cb880def95fa8d0`

### Exact start of day at the minimum Instant

An offset jump from zero to +01:00 at the minimum Instant leaves
midnight missing. The first reachable local clock is 01:00, and
its sole candidate is the minimum itself. With offsets −01:00,
−11:00 at minimum plus one hour and −02:00 at minimum plus three
hours, the first local clock is again 01:00. Its sole candidate is
minimum plus three hours. The old bounded search could reject both
dates.

Exact providers now project raw transition boundaries across the
lower clip. The search window covers any earlier reachable wall clock
because every offset is strictly under one day. The existing
candidate check rejects a raw-only earlier clock outside the range,
even if a later clock has a valid Instant. Numeric Intl and custom
Rust providers without raw coverage retain their fallback.

[Shared packed lookup](../../../packages/ecma402-abstract/DateTimeFormat/TimeZoneOffset.ts#L165).
[TypeScript dispatch](../../../packages/temporal/kernel.ts#L99).
[Zone wrapper](../../../packages/temporal/zones.ts#L128).
[Rust provider](../../../crates/temporal/timezone.rs#L389).
[§11.1.14 steps 5–7](https://tc39.es/proposal-temporal/#sec-temporal-getstartofday).

- Before-fix packaged Bazel SHA-256 `558fa5e7d9aa696087c738131f3a163f37558cc80deb201e8e78a881d11b0df3`
- Before-fix Rust Bazel SHA-256 `b1efa9232c9be1ed9285e405756640653f1647dea39a8b6d46946c87426f3ee5`
- Combined nine-target Bazel SHA-256 `a5e214a8de28285da87d6863687e06dd9d7c55d3dc186658bec66be8d1326b8a`

### Borrowed mixed-range candidate

An initial offset of +02:00 changes to zero at the lower Instant limit.
A local clock 30 minutes above that limit has raw candidates 90 minutes
before and 30 minutes after it. At the upper limit an explicit +02:00 row
followed by a zero footer gives the corresponding mixed pair. Both original
kernels accepted the one visible candidate. Compact TypeScript and borrowed
Rust now reject both pairs under every disambiguation mode.

Compact TypeScript reuses the packed offset lookup at the proposed raw
epoch. Its reachable raw window extends at most three days past either
Instant limit after a gap shift and offset subtraction. Flooring to
milliseconds remains exact below 2⁵³. Rust uses the same transition and
footer rules for both checked and raw offsets. It widens the candidate
window before checking for an exact round trip, then rejects a genuine
invalid candidate before selection. Registered zones reuse the check.
The FFI list, day boundary and explicit-offset matching use the same
validation. The explicit `use` path retains its direct offset calculation.

An offset that proposes an invalid epoch but does not match the actual
raw offset is ignored. The controls keep their one valid candidate on
both sides. Unknown providers retain bounded enumeration by default and
the existing provider applicability condition.

- [Compact matching and range check](../../../packages/temporal/kernel.ts#L307).
- [Borrowed raw lookup](../../../crates/temporal/timezone.rs#L367).
- [Rust candidate validation](../../../crates/temporal/zoned.rs#L329).
- [Rust explicit offset matching](../../../crates/temporal/zoned_string.rs#L124).
- [Temporal comparison §11.1.13 steps 3.a and 4.a](https://tc39.es/proposal-temporal/#sec-temporal-getpossibleepochnanoseconds).

Failing compact log SHA-256 `23a7f7077a3f27dd2e0aa840a4217143c107106eeaa7f84bdf17c6b86e71f2b2`.
Failing Rust log SHA-256 `886cac7f06c00a56bf15c5a9961f44dc4c4e0d2610aff8366618a93b172c22e8`.
Passing Rust provider log SHA-256 `fd0754773c991efd3e187de679010c007078ec828fbcee9a0f36c8b6185a2f22`.

### Wide-transition rounding replay

On Node 26.5.1, assemble the four packages with Bazel, then run the public
replay with synthetic rows in the owned formatter.

```sh
bazel build //packages/temporal:pkg //packages/intl-datetimeformat:pkg \
  //packages/intl-localematcher:pkg //packages/fast-memoize:pkg
pkg() { bazel cquery --output=files "config(//packages/$1:pkg, target)"; }
node knowledge-base/audits/temporal-timezone-boundary-proof/owned-wide-rounding-replay.mjs \
  "$(pkg temporal)" "$(pkg intl-datetimeformat)" \
  "$(pkg intl-localematcher)" "$(pkg fast-memoize)"
```

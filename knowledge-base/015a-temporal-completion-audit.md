# Temporal completion audit

Current delivery scope: pure TypeScript, native Rust and native Hermes bindings.
Temporal WASM runtime entries, assets, build targets and test variants are removed.
WASM measurements and ABI notes below are historical. New native Rust/TS comparison:
`bazel run -c opt //benchmarks/temporal:native_ts_benchmark`. It checks matched
outputs and reports per-workload samples; native timings exclude binding costs.

Current ISO field checkpoint: TS wins 41/48 basic and
48/48 official medians using the preceding checkpoint's reference samples.
Rust wins 25/25 original and 7/7 additional named-zone cases against current TS,
reported separately. All 56 focused Rust/Node/ICU/package/Hermes targets pass.
Consumer is 40,652 gzip bytes (+109 this checkpoint). Final fresh repeated
references, remaining slower cases and earlier baseline audit keep the goal open.
See [immutable-slot experiments](../benchmarks/temporal/immutable-slots-experiments.json).

Short-date factories retain owned slots. Parsed ISO strings and year-month
addition retain validated ISO fields; formatting reuses those fields. Explicit
`dateFieldsView` returns a readonly ISO view after backend/range guards. General
pure-TS `dateFields` keeps fresh records. Arithmetic inputs are readonly.

Six full profiles compare three processes per state against `6588cdf` before
the provisional parser change. Combined medians improve YearMonth parsing ~17%,
MonthDay parsing ~38%, YearMonth addition ~12% and date addition ~4%.
Largest paired median increase is ~1.6%; Instant and PlainTime rounding medians improve slightly.
All initial outliers remain recorded. Smaller variations and earlier baselines
still need final verification. A broad readonly reader was replaced with the
explicit view after MonthDay conversion regressed.

Eager ISO fields cost ~88 extra retained bytes per unread parsed value in a
200,000-value Node diagnostic. After a getter read, candidate retains ~32 fewer
bytes/value. Arrays/WeakMap capacity are included; one process per state/kind/read
mode gives approximate heap evidence, not universal bounds. No native/Hermes heap
claim. CPU profiles and raw controls remain available.

Preceding short-date checkpoint: TS wins 38/48 basic and
48/48 official medians in a fresh comparison. Two TS processes,
one process per reference; final repeated references still required. Rust wins
25/25 original and 7/7 additional named-zone cases, reported separately.
All 54 focused Rust/Node/ICU/package/Hermes targets pass. Consumer is 40,543 gzip bytes.
See [validated-short experiments](../benchmarks/temporal/validated-short-experiments.json).

ISO short-date parsing uses already validated fields for shared Gregorian
conversion. Native dispatch, parsed reference-year handling and year-month bounds
remain. Full controls improve short-date parsing ~8–10%; scoped controls ~11–16%.
Parsed-field caching and three rounding variants showed no useful extra gain and
were discarded. Chronological benchmark samples now accompany sorted samples.

Goal remains open: reference losses, fresh repeated-reference verification and
regression audit. Unchanged rounding spans 456–566 ns in full controls
(aggregate +8.6%); longer scoped controls show +4.5% medians/~3% means.
Attribution remains unresolved. Original rounding code stays.
Raw runs and separate baseline/candidate V8 profiles remain available.

Preceding normalized-addition/getter checkpoint: 54 focused Rust/Node/ICU/package/
Hermes targets pass. TS wins 36/48 raw medians versus basic and 48/48 versus official
using retained reference samples. Native Rust wins 25/25 original and
7/7 additional named-zone cases, reported separately. Consumer size is
40,529 gzip bytes. Remaining reference losses, close cases and small paired timing
differences keep the goal open. See
[`normalized-addition-experiments.json`](../benchmarks/temporal/normalized-addition-experiments.json).

Calendar addition consumes normalized fields and returns epoch day plus validated
target fields, preserving calendar availability checks. Pure-TS DateTime clock
getters avoid eager private date records; native SDK keeps its direct path.
Sparse field records use captured Object.create and a frozen empty prototype with
null parent, retaining provided keys and isolation from Object.prototype.
Alternating controls show ~25% faster date addition, ~38% faster DateTime parsing
and ~18–30% faster updates. Full-matrix checks rejected numeric clock variants
that regressed rounding; original BigInt clock remains. Final paired medians have
no increase above 5%, but small differences still need fresh repeated controls.
Independent precision and inherited-metadata regressions guard public behavior.

Preceding calendar/transition checkpoint: 49 focused Rust/Node/ICU/package/Hermes
targets pass. TS wins 34/48 raw medians versus basic and 47/48 versus official,
using the preceding checkpoint's reference samples. Native Rust wins
25/25 original cases and 7/7 additional named-zone cases, reported separately.
Named cases cover New York gap/fold, Lord Howe half-hour change and year-2400
future rules. Full signed outputs match TS; no temporal_rs named-zone claim.
Consumer size is 40,470 gzip bytes. Close cases, earlier rounding variability
and remaining reference losses keep the goal open. See
[`calendar-arithmetic-experiments.json`](../benchmarks/temporal/calendar-arithmetic-experiments.json).

Shared calendar conversion uses Gregorian month prefixes after field validation.
Other arithmetic calendars skip repeated outer validation while summing months.
Rust recurring-transition search checks whether a candidate can improve the best
result before evaluating its rules. Alternating controls confirm faster date
addition and roughly 2x faster native transition lookup. Per-input native timing
diagnostics and separate V8 CPU profiles retain the evidence; no new caches/data.

Preceding direct-path checkpoint: 44 focused Node/ICU/package/Hermes targets pass.
Fresh isolated processes put TS ahead on 34/48 raw medians versus basic and
46/48 versus official. Native Rust wins 25/25 against this TS version.
Consumer size is 40,399 gzip bytes. One full reference round is a snapshot;
close cases, prior rounding variability and broader native named-zone coverage
keep the goal open. See
[`direct-path-experiments.json`](../benchmarks/temporal/direct-path-experiments.json).

ISO field reading reuses fixed key lists. PlainTime serialization uses exact
numeric clock arithmetic without formatting an epoch date. ISO validation checks
Gregorian month length directly; short-date parsing skips redundant calendar
roundtrips after syntax validation. Alternating controls retain raw samples;
Test262, independent ICU cases and both Hermes modes cover behavior.

Preceding record-preparation checkpoint: 42 focused targets pass, including eight
full Node suites, sixteen pure-TS Hermes source/bytecode suites, ten native SDK
Hermes suites, ICU/public unit checks and package/type/export checks. Native Rust
still wins 25/25 against this TS version. JS raw-median wins rise to 33/48 basic,
45/48 official using frozen reference samples. Consumer size is 40,219 gzip bytes;
startup is 22.90 ms. Remaining losses and rounding variability keep the performance
goal open. See
[`record-preparation-experiments.json`](../benchmarks/temporal/record-preparation-experiments.json).

Preceding ISO optimization checkpoint: 94 Rust/TS/ICU/Hermes/Test262 targets pass,
including full TS Hermes source/bytecode and Intl compatibility gates.
One-pass Gregorian conversion, private ISO field reuse and date-only formatting
improve date getters about 7x and formatting 5x in alternating controls.
Native Rust still wins 25/25 matched cases against optimized TS. JS raw-median
wins rise to 28/48 against basic and 44/48 against official, using frozen
reference samples. DateTime rounding controls vary from +2% to +11%; that possible
regression remains open. Consumer size grows by 326 gzip bytes; startup remains
about 23 ms. Performance goal is incomplete. The matrices have different coverage
and do not establish universal performance. See
[`iso-date-experiments.json`](../benchmarks/temporal/iso-date-experiments.json).

The preceding no-WASM checkpoint passed 67 targets and retained the original TS
executable AST (2,560 normalized bindings). Its independent baseline and raw
samples remain in
[`native-ts-experiments.json`](../benchmarks/temporal/native-ts-experiments.json).

The completion evidence below predates WASM removal and remains historical.
Scope: Rust and TS Temporal, Hermes, Test262 with justified exclusions,
independent ICU controls, temporal-polyfill comparisons, WASM/TS size and speed,
package migration and stacked PR delivery. Implementation and validation are
complete; final review remains separate from release publication.

Machine-readable evidence: `packages/temporal/completion-audit-results.json` and
`packages/temporal/conformance-results.json`. Runtime basis is commit
`c6bb171f5ce805d2eeec139bed32977323e426a8`; this final layer changes validation,
benchmarks and documentation. Earlier implementation stages remain in 015.

## Requirement evidence

| Requirement             | Evidence                                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Package migration       | 48 runtime source files owned by `packages/temporal`; AST audit finds no foreign Temporal/benchmark imports or dynamic imports. Assembled namespace and both WASM entries run through package tests and the startup benchmark. |
| Rust semantics          | Eight typed values, Now, sixteen calendars and timezone providers; routes below. Six Rust test targets pass, including independent calendar/timezone controls.                                                                 |
| TS conformance          | Complete feature-selected Test262 result sets on Node and Hermes source/HBC; no tracked failures.                                                                                                                              |
| Rust-backed conformance | Native-data WASM and native SDK run the same complete selections. Both published WASM profiles successfully exercise all 62 normalized operations.                                                                             |
| Independent authority   | ICU4J calendar fields/arithmetic, offsets/transitions, parsing, rounding and formatting; separate HKO/KASI lunar controls. Oracle bounds remain explicit in 015 and the crate records.                                         |
| Hermes                  | Pure TS and installed SDK source/HBC profiles pass. Fresh packaged SDK consumer installs Temporal and native Intl without Rust tools.                                                                                          |
| Reference benchmark     | Forced temporal-polyfill 1.0.7 basic/full implementations; output equality checks and versioned snapshots.                                                                                                                     |
| WASM versus TS          | Matched hot workloads, complete consumer/module payloads, fresh-process setup and memory measurements.                                                                                                                         |
| Delivery                | Incremental `gh stack` branches; final validation layer follows PR #8008. Packages remain private pending release.                                                                                                             |

## Exact Test262 coverage

Pin: `2e58f87d8350ad51224617a041c6e041d52f8444`. Parsing every candidate's YAML
metadata finds 6,738 Temporal-feature files, 13,476 scenarios. Outside the original
three roots are 65 DateTimeFormat files, six DurationFormat files and three
staging files. All belong to the final selection.

| Profile                                          | Unique files | Passing scenarios | Excluded scenarios |
| ------------------------------------------------ | -----------: | ----------------: | -----------------: |
| Node default TS + host Intl                      |        6,737 |            13,474 |                  2 |
| Node native-data WASM + host Intl                |        6,737 |            13,474 |                  2 |
| Hermes default TS + native Intl, source/HBC each |        6,736 |            13,472 |                  4 |
| Hermes SDK + native Intl, source/HBC each        |        6,736 |            13,472 |                  4 |

Each profile uses one Temporal build and formatter provider throughout its twelve
namespace suites, full Intl compatibility, DateTimeFormat and DurationFormat.
The 90 coherent gates contain 98,716 overlapping suite executions. Exact
file/scenario unions reject duplicates within reports, failed results, extra
files and missing scenarios beyond the recorded exclusions. Two additional
legacy formatter gates pass, giving 92 distinct targets. SDK class gates were
rechecked after enabling full native Intl; bare-runtime locale fallback is not
used as proof of native formatter integration.

Only data-version conflicts are excluded:

- `intl402/Temporal/ZonedDateTime/links.js`: pinned CST6CDT/Chicago alias assumption
  predates IANA's separated POSIX-rule zones. All profiles exclude its two cases.
- `intl402/Temporal/ZonedDateTime/prototype/toLocaleString/offset-time-zones.js`:
  pinned bare-GMT expectation differs from CLDR49 numeric zero. Native Intl
  profiles exclude its two cases; host Node profiles pass them.

Manifests record reasons and primary sources; unfiltered diagnostics retain both
files. No implementation failure is excluded. No pinned Temporal-feature file
requires createRealm/evalScript, so no Realm exclusion is applied. Hermes eshost
lacks those hooks; this does not establish untested cross-Realm semantics.

Current official spec headings describe 249 properties across seventeen owners.
The built namespace has all names and getter kinds, plus sixteen implicit
constructor name/length properties. Source URL/hash and results are recorded.
This shape check complements executed tests; it does not prove algorithms alone.

## Rust routes and JS responsibilities

| Value                        | Rust implementation                                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Instant                      | `lib.rs`, `parse.rs`, `rounding.rs`, `duration.rs`, `format.rs`; epoch ordering via Rust traits.                            |
| Duration                     | `duration.rs`, `plain_relative.rs`, `relative_duration.rs`; exact rational totals and calendar/zoned anchors.               |
| PlainTime                    | `time.rs`; fields, updates, arithmetic, differences, rounding and formatting.                                               |
| PlainDate/PlainDateTime      | `date.rs`, `calendar_provider.rs`, `plain_relative.rs`; calendar fields, merging, arithmetic and composition.               |
| PlainYearMonth/PlainMonthDay | `short_dates.rs`; reference dates, leap-month handling, arithmetic and date conversion.                                     |
| ZonedDateTime                | `zoned.rs`, `zoned_difference.rs`, `zoned_string.rs`; resolution, updates, boundaries, arithmetic, differences and strings. |
| Now                          | `now.rs`; injected clock and explicit timezone provider.                                                                    |

Paths are relative to `crates/temporal`. Public records and method composition
supply derived fields: calendar_fields, PlainDateTime date/time projections,
zoned local projections and relative Duration operations on anchors. Equality
uses epoch/calendar/primary-zone identity as required; zone identity is not
inferred from matching offsets.

PlainDate's omitted-time zoned conversion shares the earliest civil-day
algorithm; explicit time uses compatible gap/fold resolution. ICU boundaries,
a completely skipped day, a cross-midnight 24-hour gap and Instant bounds check
this public route. Providers need not implement Clone.

ABI 9 declares and handles the same 62 operations. Runtime observers forward real
Rust calls and count only successful results through both WASM entries. Public
ICU/Duration controls reach 58 operations; independent fixtures separately check
`addISODays`, `calendarAdd`, `calendarMonthSerial` and `calendarUntil`, across all
sixteen calendars where applicable. Reachability alone is not semantic proof.

JS owns ECMAScript coercion, observable property order, brands, slots and object
allocation. Intl supplies locale rendering; system discovery belongs to the
embedding. `completeTemporalBackend: false` still describes that normalized ABI,
which does not itself implement an ECMAScript object runtime. Typed Rust semantic coverage is recorded independently of this ABI flag.

## Host data and independent controls

Host Intl is allowed. Default TS now captures installed Intl for named timezones
and Umm al-Qura, retaining verified compact Chinese/Dangi arithmetic/data.
Standalone owns calendar packs and IANA histories; Rust WASM and SDK keep owned
timezone data. Native-data WASM omits duplicate TS packs. See the host Intl default
follow-up below for fresh validation and measurements.

Legacy formatting corrects stale/missing host zone rules using owned local fields
and localized numeric offset labels. Matching host output stays native. Shared
171-case owned-data controls run before/after installation on normal/stale
standalone TS, both WASM
entries and Hermes source/HBC. They include independent ICU rows, historical
seconds and clipping boundaries. Reversed ranges preserve endpoint order.

Calendar controls retain documented ICU/HKO/KASI authority ranges. Full-range
Chinese/Dangi port equivalence and extreme lunar formatting consistency are
separate evidence; neither is presented as independent astronomy outside those
ranges. Data updates remain necessary when timezone law or calendar data changes.

## Measurements and distribution

`completion-startup-results.json`: nine fresh Node 24 processes per profile,
rotating order, persistent compile caches disabled and checked, warm filesystem.
Ready time includes import, WASM setup and matched Instant/New York/Chinese
operations; excludes Node bootstrap and global installation. Medians: TS 12.11 ms,
full reference 22.71, native-data WASM 26.16, hybrid 28.99. Basic reference omits
Chinese and stays separate. Memory figures are process measurements, not payload.

The pre-migration completion snapshot measured 69,657 bytes gzip for TS, 23,083 for full
reference, 479,552 for native-data WASM including binary, 515,283 for hybrid.
In that snapshot, TS owned IANA histories. Separate module graphs
and installation bundles have different totals. WASM binary contributes 443,098.

`completion-hermes-results.json`: 43 ISO workloads, identical checked outputs and
checksum 30956984. Source/HBC median wins versus forced basic reference: TS 14/7,
normalized Rust 25/16, installed SDK 25/14, each out of 43. Native Rust bindings
are used; pinned Hermes has no WASM. Existing Node full-calendar and WASM hot
snapshots remain versioned separately. These are local samples, not universal
performance rankings.

The fresh desktop SDK archive includes Linux x64 and both macOS Rust archives,
headers, adapters and JS setup. Its standalone Linux consumer passes source/HBC
installation, native state lifetime and public Temporal/Intl checks without Rust
tools. macOS archives are cross-built; macOS execution is not claimed. Archive
hash and component sizes are recorded separately from Temporal runtime payloads.

## Host Intl default follow-up

Default TS now uses installed Intl timezone data; standalone/Rust retain owned
histories. No formatter package dependency or cycle. Load Intl polyfills/data
before Temporal captures intrinsics. Verified lunar engine remains unchanged.

All 52 affected gates pass, with exact report unions unchanged: Node 13,474;
Hermes source/HBC 13,472 each. No exclusions added. Strict Hermes ICU checks
17,640 offsets and 1,900 gap/fold windows plus transition boundaries; Node also
compares host behavior with forced temporal-polyfill. Standalone retains owned
stale/missing-host formatting controls. Evidence and report hashes:
`packages/temporal/host-intl-default-audit-results.json`.

New consumer/startup snapshot: TS 38,639 gzip bytes (44.5% below 69,657), standalone
339,338, full reference 23,083. Native-data WASM 479,583; hybrid 484,339, each
including 443,098 binary bytes. Nine-process ready medians: TS 20.84 ms, full
reference 22.58, native-data WASM 26.09, hybrid 26.11. Previous owned-data TS was
12.11 ms. New snapshot does not refresh earlier hot-operation rankings.
See `benchmarks/temporal/host-intl-default-startup-results.json` and the provider
search limits in [implementation record](015-temporal.md#default-installed-intl-timezone-provider).

## Remaining size justification audit

Review follow-up: host transition probes now cap generated intervals at seven
days. A synthetic host-only two-week season in otherwise fixed Abidjan verifies
both search directions and strict boundaries. Host transitions closer than one
probe interval remain outside the search guarantee; standalone owns exact records.
Overlapping searches reuse up to 64 sampled unchanged intervals. A fixed-host
regression cuts repeated history probes from 115,092 to 67. All-zone boundary
checks get a 120-second per-case budget; the local 418-zone workload takes 11 seconds.

Runtime audited: `6d55edf0f473aac8b6fce314f7a7f7d345452972` (PR #8015).
`bazel run -c opt //benchmarks/temporal:size_audit` reproduces the published
38,639-byte TS and 23,083-byte reference consumers exactly. TypeScript AST
rewrites remove selected code/data before consumer tree shaking and minification;
rewrite coverage is asserted. Results: `benchmarks/temporal/size-audit-results.json`.
Altered builds are intentionally incomplete, not conformance claims.

Independent removal savings: timezone metadata 6,317 gzip bytes; all locale
formatting 5,838; lunar/Umm al-Qura engines 2,139; native dispatch 324. Calendar
formatting corrections alone account for 3,678 within the locale paths. Removing
all four groups together leaves 24,065 bytes (14,574 saved), only 982 above the
full reference. Savings are non-additive; runtime capabilities differ after removal.

Verdict: measured payload has concrete purposes, with existing independent and
regression evidence for lunar/calendar repairs. Default does not accidentally
include full standalone calendar packs, owned timezone offset histories, WASM
binary, or full formatter/locale data packages. Backend dispatch is a small cost
for the supported optional backend model. Locale methods are standard behavior
in both implementations; their entire cost cannot be called extra functionality.

Timezone metadata remains the largest compression candidate, not proof that
6,317 bytes are irreducible. It keeps exact IANA spellings, aliases and primary
identity independent of host naming, plus intervals guarding closely spaced
changes. The pinned reference normalizes spellings heuristically and uses host
identities. Removing ours loses validation/identity or search guarantees; a
smaller equivalent encoding needs separate validation. The remaining core gap
is not proven minimal either. No production change or new exclusion in this audit.

## temporal_rs benchmark follow-up

Review follow-up: `benchmarks/temporal/legacy-date-results.json` measures ordinary
Date callers before/after importing published `polyfill.js`, separating existing
and newly constructed formatters. Exact strings/parts pass for eight 2024 Dates
across four 24-hour locale/calendar/zone profiles. Nine fresh processes per mode
exclude startup/construction. Existing formatters stay within 3% of native; new
Gregorian format/parts take 5.1–6.3/2.6–2.7 times native time, Hebrew 15.2/6.2.
No optimization, range, heap or Hermes performance claim. This exposes an open
cost for non-Temporal callers, rather than establishing acceptable overhead.

`temporal_rs` 0.2.6 is benchmarked through an isolated dependency workspace and
Bazel repository; production crate/npm dependencies do not change. Default host
features are disabled; ICU4X calendar 2.3.0 is pinned to match our calendar generator.
Native comparison covers all eight types, 25 workloads, five non-ISO calendars,
four inputs and nine alternating samples with preflight/timed checksum controls.
Calendar fields compare our aggregate API with three upstream public getters.
Parsed operands and registries are constructed outside timing.

Upstream wins 22/25 local native medians. Our Instant parse/round paths win;
formatting is effectively tied. Upstream Chinese/Dangi month addition is about
26 times faster, Hebrew month addition about 3.1 times faster. This is meaningful
counterevidence to keeping custom calendar math for speed. Raw samples and methods:
`benchmarks/temporal/temporal-rs-native-results.json`.

Identical minimal WASM ABI/bridge comparisons verify ordinary and boundary
outputs against forced temporal-polyfill, plus invalid-input controls. Upstream
Instant cases are 8–19% slower, Duration cases 31–32% faster. Primitive gzip:
ours 19,470, upstream 24,653. Both have zero WASM imports. Upstream uses Writeable
for Instant and allocating String output for Duration; ours uses buffer output.
See `benchmarks/temporal/temporal-rs-wasm-results.json`.

These are primitive binary sizes, not complete backends: calendar/named-zone data,
full operation reachability, JS facade, Intl and embedding costs are excluded.
Native UTC/fixed-offset parsing is covered; named-zone/DST provider performance
is unmeasured. No new full Test262/independent ICU claim for upstream. Earlier
owned implementation conformance records remain unchanged. A full temporal_rs
adapter/provider/conformance experiment is still needed to choose replacement.

## ABI 10 follow-up (2026-11-17)

The historical evidence above covers ABI 9. ABI 10 adds complete calendar/zoned
snapshots and five date-like partial-update routes (69 operations total).
WASM now uses binary records and reusable buffers; native SDK JSON controls
retain scalar result shapes. Current implementation and benchmark evidence lives
in [015-temporal.md](015-temporal.md#whole-wasm-operations-and-binary-results-2026-11-17).

## ABI 11 performance follow-up (2026-11-17)

Seven hot routes use typed requests; Instant results use signed 128-bit values
or streamed text. Calendar/clock/zone snapshots share fixed Rust storage instead
of temporary JSON maps. All 69 operations remain available; SDK JSON result
shapes and conformance exclusions stay unchanged. See the
[hillclimb record](015-temporal.md#typed-wasm-hillclimb-2026-11-17).

Final follow-up passes 62 focused targets, including all six previously failing
PR CI targets. Raw matched performance/startup/size evidence is in
`benchmarks/temporal/hillclimb-results.json` and
`hillclimb-startup-results.json`; kept/discarded iterations are in
`hillclimb-experiments.json`. Native-data namespace payload is 493,058 gzip bytes
(5,288 more than ABI 10); Instant parse/format improve about 4.1x. TS remains
default; WASM has lower sampled medians in 5/48 workloads against TS.

## Profile-guided performance follow-up

WASM ABI 12 keeps the conformance requirements above. Extra overflow controls
exercise finite calendar fields up to Number.MAX_VALUE through all date-like
constructors/updates, with reject and non-finite controls. They exposed and fixed
premature safe-integer narrowing in Rust bindings; default TS already passed.
A poisoned Array iterator control also guards duration coercion. Existing ICU row
counts and Test262 exclusions are unchanged. See 015's CPU-profile follow-up and
`benchmarks/temporal/profile-*.json` for the ongoing performance work; it is not a
claim that WASM beats TS on every workload.

ABI 13 follow-up adds complete typed DateTime results and shared Rust ASCII
formatting. Rust/core, public types, DateTime/Instant Test262, WASM package/ICU and
Hermes source/bytecode gates pass. New public inherited-setter/getter controls
caught decoder regressions and now pass in both WASM profiles. TS executable AST
remains equivalent to the recorded baseline. No new exclusions; performance goal
still open at 16/48 median wins against TS. Full owned-Intl WASM gate remains in CI.

### ABI 14 clock follow-up

Typed clock/duration transport, exact-number native slots and lazy BigInt interop
retain the conformance requirements above. 63 focused targets pass; final controls
add memory-growth ownership, captured WeakMap access and legacy SDK midnight
rounding. Signed rounding boundaries preserve wide results. Pure TS executable
structure still matches baseline through the checked-in Bazel audit, with a
negative control proving changed intrinsic captures are rejected. No new
exclusions. All five PlainTime benchmarks beat TS in the current isolated run;
the all-workload objective remains open. See time-*.json in benchmarks/temporal.

### ABI 15 Instant follow-up

Compact integer responses and checked scalar rounding keep public Rust validation
and full-width buffer fallback. Controls cover signed 64-bit crossings, reserved
sentinel results, full Temporal bounds, invalid requests and engines without i64
interop. Native factories wrap validated Rust results/private branded values;
numeric user constructors retain checks and JS option order is unchanged.
All 63 focused Rust/TS/WASM/ICU/Hermes targets pass. The executable TS AST still
matches baseline; its intrinsic-capture negative control still fails as intended.
No new exclusions. Current isolated WASM medians win 24/48 against TS; longer
rounding controls disagree with that workload's apparent win. The objective stays
open. See instant-*.json and the benchmark README for measurements and limits.

### ABI 16 timezone-transition follow-up

Typed transition requests/results and paired recurring-rule state calculations
retain full-range and strict-boundary semantics. Controls cover January 1's
rule-year windows, the explicit/footer join, fixed/UTC zones, null transitions
and malformed requests. Twelve focused Rust/WASM Test262/ICU/Hermes/type targets
pass; targets are recorded in benchmarks/temporal/zoned-experiments.json. Broader
conformance remains a CI gate. Default TS AST and its negative control pass.
No new exclusions. Isolated transition time falls from 4.535 to 1.515 microseconds;
TS remains faster at 0.459. Overall sampled WASM wins 23/48 versus TS; goal open.

### ABI 17 zoned parsing follow-up

Typed parsing/resolution and compact complete ISO zoned results reduce isolated
parse time from 27.256 to 9.907 microseconds; TS remains 3.969. All 48 workloads
are retained in zoned-parse-hillclimb-results.json; all 24 slower workloads/ratios
are explicit in zoned-parse-experiments.json. Current medians win 24/48 versus TS;
close results are not stable-win proof. Complete Rust fields are retained despite
the epoch-only parse consumer. Goal remains open.

Twelve focused Rust/WASM/Test262/ICU/Hermes/type targets pass, including new raw
codec bounds/error recovery, complete ISO/Gregorian getter reuse, aliases,
poisoned Array iteration and calendar/zone/options ordering. No new exclusions.
Pure TS executable AST still matches the baseline; negative control is rejected.
Native namespace payload is 509,609 gzip bytes (+3,577); TS 39,692 with host Intl.
Nine-process ISO/timezone startup is 17.01 ms native versus 19.39 ms TS. The fresh
CPU profile identifies recurring-rule construction and repeated offset scans as
remaining Rust costs. Full conformance remains a CI gate.

### Bounded Rust timezone resolution

TimeZone::visit_offsets_at defaults to full-history visitation; compiled transition
providers narrow to local plus/minus one day. Offset bounds prove candidate/gap/fold
coverage; entering state and relevant footer offsets remain included. Monthly
future events avoid redundant ISO conversions; direct year extraction uses exact
floor-divided i64 seconds. Adjacent-year/tie behavior, complete snapshots, ABI 17
and 29 typed routes remain unchanged. No new cache/data/dependency or TS source edit.

All 63 focused Rust/TS/WASM/Test262/ICU/Hermes targets pass against final formatted
Rust sources. New differential controls compare public local resolution against
the full-history default across dense transitions, deduplication overflow, gaps,
folds, extreme offsets, footer joins, signed nanoseconds and timestamp bounds.
Literal short/leap-February last-weekday controls cover recurrence month length.
No new exclusions. Final timings/startup/size and slower-workload inventory live
in benchmarks/temporal/bounded-zone-*.json. All-workload goal remains open.

Isolated parsing improves from 9.907 to 7.235 microseconds, versus TS 3.905.
Current medians win 23/48; all 25 slower cases are recorded. Longer Instant
rounding loses at 0.653 versus TS 0.601. Native namespace is 507,887 gzip bytes
(down 1,722; raw WASM grows 318). ISO/timezone readiness is 16.96 versus TS
19.48 ms. Pure TS/native JS bundles match the prior checkpoint byte-for-byte;
TS AST/negative-control checks pass. Fresh profiles retain generic zoned rounding
transport as a next target. This is partial progress, not goal completion.

### ABI 18 typed zoned operations

Typed zoned addition/subtraction, rounding and day-start requests return complete
results directly. ISO records are built on the stack; non-ISO/deferred-error paths
remain general. ABI 18 has 32 typed routes, the same 69 operations and unchanged
SDK JSON/data/dependencies. Private resolution works on validated nanoseconds;
public field/range/calendar checks remain. Native-only private-slot construction
keeps user numeric validation and standard prototypes.

All 66 focused Rust/TS/WASM/Test262/ICU/Hermes and Rust public provider/calendar
checks pass against recorded final source hashes. Added field/packet boundary,
recovery, offset-hint, week/year/BCE, memory-growth ownership, prototype, numeric
constructor and poisoned-iterator controls. No new exclusions. Pure TS executable
AST matches the independent baseline. Alternating controls retain the resolution
refactor and modest construction changes; copied lazy snapshots, a flat decoder
and Rust duration prevalidation are discarded. Final measurements/profiles live
in benchmarks/temporal/zoned-operations-*.json. All-workload goal stays open.

Current isolated rounding/addition/day-start times are 3.870/5.834/3.818
microseconds, versus preceding WASM 11.415/15.134/10.416 and current TS
2.869/6.243/2.075. Parsing is 6.339 versus TS 3.999. DateTime parsing remains
slower and rises from 2.762 to 2.901 in this checkpoint. Median wins are 24/48;
all 24 slower cases remain explicit. Native namespace is 513,202 bytes gzip
(+5,315), no new data/dependency. ISO/timezone readiness is 16.70 versus TS
19.40 ms. Fresh profiles prioritize Duration construction/transport next.
This is partial progress; the all-workload objective remains unfulfilled.

### ABI 19 typed Duration operations

Current ABI 19 isolated checkpoint: Duration parsing 1.19 µs versus TS 2.36; addition 3.77 versus 4.88. WASM wins 25/48 medians; 23 workloads still lose. All 66 focused Rust/TS/WASM/Test262/ICU/Hermes/provider targets pass. Default TS executable AST matches baseline. Native Node namespace is 513,908 gzip bytes (+706); TS 39,692, using host Intl. Native owns calendar/timezone data. ISO/timezone readiness: native 17.38 ms, TS 19.54 ms. Full native calendar readiness 27.99 ms.

35 typed routes preserve all ten fields, unbalanced values, Number rounding and positive zero. Numeric user constructors remain checked. Full targets, source hashes, raw-packet controls, public memory/prototype/clone controls, all slower workloads and fresh production metrics live in `benchmarks/temporal/duration-*.json`. No new exclusions. All-workload goal remains open.

### ABI 20 typed differences

Current ABI 20 isolated checkpoint: YearMonth difference 3.29 µs versus TS 5.53; Date difference 3.54 versus 6.15; DateTime difference 4.10 versus 6.39; Instant difference 2.54 versus 2.50. Full matrix records 27/48 median wins; rounding win fails longer controls. All 21 raw slower workloads plus rounding remain unresolved. All 66 focused Rust/TS/WASM/Test262/ICU/Hermes/provider targets pass. Default TS executable AST matches baseline.

Native Node namespace is 516,007 gzip bytes (+2,099); TS 39,692, using host Intl. Native owns calendar/timezone data. ISO/timezone readiness: native 17.57 ms, TS 19.53 ms. Full native calendar readiness 28.21 ms. Raw WASM grows 9,249 bytes.

39 typed routes return complete validated Duration records. Public methods, all rounding modes/signs/directions, malformed packet recovery, numeric bounds, memory ownership and public prototypes remain checked. Full targets, source hashes, slower workloads and production metrics live in `benchmarks/temporal/differences-*.json`. No new exclusions. All-workload goal remains open.

Longer fresh TS/native/native/TS controls use 100,000 warmup and nine samples of
300,000 calls. Instant rounding is still slower: native 0.624/0.647 µs versus
TS 0.594/0.575. Its full-matrix median win is noisy and unproven. Instant difference
wins those controls at 2.474/2.486 versus TS 2.646/2.535, but loses the full matrix
at 2.538 versus TS 2.501. Keep it unresolved. The 27/48 raw median count is not a
stable-win claim: all 21 raw slower cases plus rounding remain explicit.

### ABI 21 typed zoned formatting

Current ABI 21 isolated checkpoint: zoned format 1.93 µs versus TS 2.10; DateTime parse 2.00 versus 2.40; DateTime round/format 2.50 versus 1.64. Full matrix records 31/48 median wins; 17 workloads remain slower. Close rounding/difference controls stay explicit; median count is not stable-win proof. All 66 focused Rust/TS/WASM/Test262/ICU/Hermes/provider targets pass. Default TS executable AST matches baseline.

Native Node namespace is 516,755 gzip bytes (+748); TS 39,692, using host Intl. Native owns calendar/timezone data. ISO/timezone readiness: native 17.39 ms, TS 19.60 ms. Full native calendar readiness 28.05 ms. Raw WASM grows 3,679 bytes.

40 typed routes retain complete results. Zoned formatting policies, compact/UTF-8 calendar identifiers, public memory/prototype/clone/numeric bounds and all 66 targets pass against recorded code hashes. Alternating controls support modest DateTime rounding and short-format encoding gains; shared-process parsing gains were not stable proof. Evidence: `benchmarks/temporal/format-*.json`. No new exclusions. All-workload goal remains open.

Current fresh TS/native/native/TS controls use 100,000 warmup and nine samples of
300,000 calls. DateTime parsing wins: native 1.821/1.833 µs versus TS 2.569/2.625.
Instant rounding remains slower: native 0.624/0.648 versus TS 0.597/0.581. Its
full-matrix median win is unproven. Instant difference remains mixed: native
2.507/2.572 versus TS 2.611/2.517, while full matrix loses at 2.521 versus TS
2.429. All 17 raw slower workloads plus rounding stay explicit. Raw 31/48 median
wins do not establish all-workload completion.

### ABI 22 typed short-date operations

Current ABI 22 isolated checkpoint: YearMonth add 2.99 µs versus TS 5.62; YearMonth projection 1.42 versus 2.39; MonthDay projection 2.21 versus 2.73; date field construction 1.50 versus 1.45. Full matrix records 34/48 median wins; 14 workloads remain slower. Close-workload controls stay explicit; median counts are not stable-win proof. All 66 focused Rust/TS/WASM/Test262/ICU/Hermes/provider targets pass. Default TS executable AST matches baseline.

Native Node namespace is 517,885 gzip bytes (+1,130); TS 39,692, using host Intl. Native owns calendar/timezone data. ISO/timezone readiness: native 17.62 ms, TS 19.50 ms. Full native calendar readiness 28.31 ms. Raw WASM changes +4,391 bytes.

43 typed routes retain complete metadata and general/deferred snapshots. All calendars, arithmetic/projection semantics, extended ISO records, malformed packet recovery, public memory/prototype/getter behavior and all 66 targets pass against recorded hashes. Evidence: `benchmarks/temporal/short-date-*.json`. No new exclusions. All-workload goal remains open.

Fresh TS/native/native/TS controls use 100,000 warmup and nine samples of 300,000
calls. MonthDay projection wins at 2.268/2.168 µs versus TS 2.692/2.593. Date field
construction nearly ties at 1.376/1.391 versus TS 1.392/1.421 but loses the full
matrix at 1.500 versus TS 1.450; unresolved. Instant difference also overlaps in
longer controls and loses the full matrix. Instant rounding remains slower:
0.622/0.619 versus TS 0.585/0.586, rejecting its raw median win. All 14 raw slower
workloads plus rounding remain explicit. Raw 34/48 medians are not stable-win proof.

### Native Instant storage

Native-only Instant slots use private fields instead of WeakMap entries. Rust still
returns complete epoch nanoseconds. Public constructor coercion precedes exactly
one newTarget prototype lookup; subclass/clone/brand behavior stays intact. ABI 22,
43 typed routes, 69 operations and SDK JSON unchanged. No new exclusions.

Current native Instant storage checkpoint (ABI 22 unchanged): round 0.139 µs versus TS 0.475; parse 0.475 versus 1.578; add 0.787 versus 2.244. Full matrix records 36/48 raw median wins; 12 workloads remain slower. Close controls remain explicit; all-workload goal open. All 66 focused Rust/TS/WASM/Test262/ICU/Hermes/provider targets pass. Default TS executable bundle unchanged.

Native Node namespace is 518,004 gzip bytes (+119); TS 39,692, using host Intl. Rust binary unchanged. ISO/timezone readiness: native 17.64 ms, TS 19.53 ms. Full native calendar readiness 28.32 ms.

Evidence: `benchmarks/temporal/instant-storage-*.json`; benchmark README covers
profiles, alternating storage controls, close margins and fresh reference scope.

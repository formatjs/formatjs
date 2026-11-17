# Temporal completion audit

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

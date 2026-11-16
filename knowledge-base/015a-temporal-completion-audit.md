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

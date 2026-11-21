# Temporal spec audit index

Repository audit ledger. Imported from the supplied index; inherited traces belong
to the linked PRs and remain pending until their implementation is present and
verified. Open ranges stay open until individually reviewed. Counts describe
numbered source lines, including editorial material, not normative requirements.
Unnumbered prose, grammar, tables, property attributes and realm requirements
remain open unless an audit entry supplies explicit evidence. A clause with no
numbered algorithm is not signed off by having an empty line inventory.

Requested citation authority: [ECMA-262](https://tc39.es/ecma262/), using numbered
sections and steps. The fetched 2026-11-21 document has no Temporal API chapters;
its Temporal-prefixed productions are shared date/time grammar. Temporal chapter
selection and the broader citation migration remain pending clarification. The
source-line inventory below is historical evidence, not section completion.
A provisional mapping onto the separately published proposal has 64 sections
with prior partial evidence and 588 without mapped evidence; none is fully signed
off. These are proposal inventory counts, not ECMA-262 section completion.

Scope: Temporal APIs and dependencies they actually exercise. This is not an
audit or reimplementation of all ECMA-262 or ECMA-402. Shared fixes require a
demonstrated Temporal call path; unrelated formatter/language work stays outside
this audit. Current priority returns to Duration and ZonedDateTime contracts.

## ECMA-262 dependency sections touched

Execution estimate, 2026-11-21: **7–14 calendar days of sustained parallel work**,
low confidence; allow 2–3 weeks if calendar/time-zone defects expand the scope.
This assumes continuous agent work, not eight-hour workdays, and resolution of
the Temporal chapter authority above. It is a planning range, not a compliance
deadline. Of 4,221 historical numbered lines, 3,795 remain individually untraced.
The 252 new traces over roughly 18.5 active hours imply about 279 serial hours
at the observed rate; inherited traces are excluded from that throughput.
Effective 2–2.5-fold parallelism plus additional prose/grammar, fixes and
integration work motivates the range. Historical lines include editorial text;
this calculation cannot measure compliance or bound undiscovered defects.

Parallel review now covers Duration conversion/arithmetic/stringification and
ZonedDateTime rounding/offset matching. Runtime edits, ledger reconciliation and Bazel runs
remain coordinated in the shared checkout. Re-estimate after the first day of
parallel results, using completed operation contracts and discovered defects
alongside historical line counts.

This is a partial dependency index, not a complete Temporal chapter inventory.
Reviewed operation contracts below do not sign off their Temporal callers.
The historical/provisional Temporal inventory above remains unchanged.

| Section                                                                                                                                                                                 | Status                              | Evidence or gap                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [§6.1 language types](https://tc39.es/ecma262/#sec-ecmascript-language-types)                                                                                                           | Reviewed classification             | [IsObject/Type mapping](temporal-object-contract-audit.md#language-type-classification), including host Objects and revoked Proxies.                                                                                     |
| [§6.1.7.2 internal slots](https://tc39.es/ecma262/#sec-object-internal-methods-and-internal-slots)                                                                                      | Selected storage reviewed           | [Captured private formatter WeakMap operations](temporal-private-format-cache-audit.md) and [native bridge state](temporal-legacy-bridge-state-audit.md); other stores, collections and complete algorithms remain open. |
| [§7.1.1 ToPrimitive](https://tc39.es/ecma262/#sec-toprimitive)                                                                                                                          | Reviewed helper                     | [Complete step mapping](temporal-coercion-contract-audit.md#toprimitive), including fused GetMethod, all hints, abrupt completions and realms. Temporal callers remain open.                                             |
| [§7.1.1.1 OrdinaryToPrimitive](https://tc39.es/ecma262/#sec-ordinarytoprimitive)                                                                                                        | Reviewed helper                     | [Complete step mapping](temporal-coercion-contract-audit.md#ordinarytoprimitive), callable/host boundaries and ordered Get/Call traces. Browser document.all run remains absent.                                         |
| [§7.1.4 ToNumber](https://tc39.es/ecma262/#sec-tonumber)                                                                                                                                | Reviewed helper                     | [All ten steps delegated to native unary plus](temporal-number-conversion-audit.md). Primitive return replaces Decimal adapter; full callers remain open.                                                                |
| [§7.1.19 ToString](https://tc39.es/ecma262/#sec-tostring)                                                                                                                               | Reviewed helper                     | [Twelve-step delegation proof](temporal-coercion-contract-audit.md#tostring) through captured %String%, excluding its primitive-Symbol exception. Caller contracts remain open.                                          |
| [§7.1.20 ToObject](https://tc39.es/ecma262/#sec-toobject)                                                                                                                               | Reviewed helper                     | [All eight runtime steps](temporal-object-contract-audit.md#toobject) through strict nullish rejection and captured %Object%.                                                                                            |
| [§7.2.9 SameValue](https://tc39.es/ecma262/#sec-samevalue)                                                                                                                              | Reviewed helper                     | [Complete pure-comparison proof](temporal-object-contract-audit.md#samevalue), Number/non-Number dependencies and 361 native controls.                                                                                   |
| [§7.3.12 HasOwnProperty](https://tc39.es/ecma262/#sec-hasownproperty)                                                                                                                   | Reviewed helper                     | [All three steps](temporal-object-contract-audit.md#hasownproperty), String/Symbol keys and descriptor traps.                                                                                                            |
| [§7.3.13 Call](https://tc39.es/ecma262/#sec-call), [§7.3.14 Construct](https://tc39.es/ecma262/#sec-construct), [§28.1.1–2 Reflect helpers](https://tc39.es/ecma262/#sec-reflect.apply) | Selected native delegation reviewed | [Bridge source mapping](temporal-legacy-bridge-state-audit.md); complete wrapper algorithms remain open.                                                                                                                 |
| [§7.3.21 OrdinaryHasInstance](https://tc39.es/ecma262/#sec-ordinaryhasinstance)                                                                                                         | Reviewed helper                     | [All six steps via captured intrinsic](temporal-instance-check-audit.md). Bound slots, host Objects and mutation controls; full formatter callers remain open.                                                           |
| [§10.4.2.2 ArrayCreate](https://tc39.es/ecma262/#sec-arraycreate)                                                                                                                       | Reviewed helper                     | [All seven steps](temporal-object-contract-audit.md#arraycreate), sparse lengths, maximum bound, custom/host prototypes and intrinsic captures.                                                                          |
| [§21.4.1.33 UTCOffset grammar](https://tc39.es/ecma262/#sec-time-zone-offset-strings)                                                                                                   | Reviewed grammar                    | [Production mapping, ASCII bounds and full-input recognition](temporal-offset-grammar-audit.md). Other ISO productions remain open.                                                                                      |
| [§21.4.1.33.1 IsTimeZoneOffsetString](https://tc39.es/ecma262/#sec-istimezoneoffsetstring)                                                                                              | Reviewed operation                  | All three steps mapped to TS/Rust recognition; caller contracts remain open.                                                                                                                                             |
| [§21.4.1.33.2 ParseTimeZoneOffsetString](https://tc39.es/ecma262/#sec-parsetimezoneoffsetstring)                                                                                        | Reviewed operation                  | All 17 top-level steps and substeps mapped to TS/Rust parsing and exact arithmetic. Caller algorithms remain open.                                                                                                       |
| [§21.4.1.3, §21.4.1.5, §21.4.1.7–§21.4.1.16 UTC date helpers](https://tc39.es/ecma262/#sec-day)                                                                                         | Reviewed bounded arithmetic         | [Twelve section mappings](temporal-date-operations-audit.md) for supported finite time values and needed year origins. MakeDay/range wording and full callers remain open.                                               |
| [§21.4.1.31 TimeClip](https://tc39.es/ecma262/#sec-timeclip)                                                                                                                            | Reviewed operation                  | [All three steps in TS/Rust](temporal-timeclip-audit.md), Number-input truncation dependency and numeric Intl boundary. Full callers remain open.                                                                        |
| [§21.4.1.28 MakeDay](https://tc39.es/ecma262/#sec-makeday)                                                                                                                              | Open                                | Step 8 witness ambiguity; [separate issue](temporal-spec-issues.md#makeday-witness-range-at-the-minimum-instant).                                                                                                        |
| [§21.4.1.1 Time Values and Time Range](https://tc39.es/ecma262/#sec-time-values-and-time-range)                                                                                         | Open                                | Range checked as issue evidence; implementation coverage remains open.                                                                                                                                                   |
| [§24.1.3.6 Map.prototype.get](https://tc39.es/ecma262/#sec-map.prototype.get), [§24.1.3.11 Map.prototype.set](https://tc39.es/ecma262/#sec-map.prototype.set)                           | Captured native delegation reviewed | [Five private timezone stores](temporal-zone-cache-relative-routing-audit.md) preserve native receivers/key/value semantics through captured operations. Other collections and complete Temporal callers remain open.    |

## ECMA-402 parts dependencies

Projection review below assumes the partition producer's specified private List
and Record contract. Producers and complete public methods remain open.

| Section                                                                                         | Status                                                                     | Evidence or gap                                                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [§9.2.15 PartitionPattern](https://tc39.es/ecma402/#sec-partitionpattern)                       | Reviewed for valid Pattern Strings                                         | [Complete seven-step helper mapping](temporal-pattern-partition-audit.md); caller schemas and complete producers remain open.                                                                                                                                                                                               |
| [§11.5.4 FormatDateTimePattern](https://tc39.es/ecma402/#sec-formatdatetimepattern)             | Record appends and selected numeric steps reviewed; dependencies open      | [Producer step map](temporal-date-pattern-audit.md); constructor, calendar and locale-data work remain open.                                                                                                                                                                                                                |
| [§11.5.5 PartitionDateTimePattern](https://tc39.es/ecma402/#sec-partitiondatetimepattern)       | Numeric steps mapped; dependencies open                                    | [Eight-step correspondence and cache proof](temporal-private-format-cache-audit.md); constructor selection and complete producer remain open.                                                                                                                                                                               |
| [§11.5.11 ToLocalTime](https://tc39.es/ecma402/#sec-tolocaltime)                                | Bounded Gregorian records/offset parsing reviewed; complete operation open | [Gregorian record mapping](temporal-local-time-record-audit.md), [shared offset parsing](temporal-offset-grammar-audit.md#shared-scanner-and-datetimeformat-integration) and [precision controls](temporal-local-offset-precision-audit.md); public input preparation, range/brand callers and other calendars remain open. |
| [§11.5.12 ToLocalTime Records](https://tc39.es/ecma402/#sec-datetimeformat-tolocaltime-records) | Bounded Gregorian correspondence reviewed                                  | [All twelve fields mapped](temporal-local-time-record-audit.md); named-zone data policy and non-Gregorian contracts remain open.                                                                                                                                                                                            |
| [§11.5.7 FormatDateTimeToParts](https://tc39.es/ecma402/#sec-formatdatetimetoparts)             | Projection reviewed; producer open                                         | [Five-step source mapping](temporal-parts-result-audit.md) and protected type/value result construction. PartitionDateTimePattern remains open.                                                                                                                                                                             |
| [§16.5.6 FormatNumericToParts](https://tc39.es/ecma402/#sec-formatnumbertoparts)                | Projection reviewed; producer open                                         | Same shared projection; PartitionNumberPattern and public input handling remain open.                                                                                                                                                                                                                                       |

## Historical passes and current fixes

Current pass:

- Timezone private caches and relativeTo routing: [bounded audit](temporal-zone-cache-relative-routing-audit.md)
  captures the constructor/get/set used by five private Maps and replaces an
  extra lexical RegExp test with indexed scanning. Three cache mutation and two
  routing hook/statics regressions failed before correction. All six focused
  gates pass; all 53 expanded tests pass (52 executed, one cached), including
  40 class/backend and five Now gates. Two assemblies pass. All three final native
  malformed-routing oracle gates pass (two executed, one cached). Downstream parsers, String/Object
  helpers, providers and complete callers remain open; no chapter credit.

- [Relative preparation and zoned rounding validation #8119](https://github.com/formatjs/formatjs/pull/8119): [bounded audit](temporal-relative-preparation-validation-audit.md)
  preserves null-prototype private relativeTo records and validates rounding
  unit/increment before local-time work in TS/Rust. Public/private getter and
  provider-counter regressions failed before correction. Seven focused gates pass;
  all 21 expanded tests pass (20 executed, one cached), including native Hermes
  mutation controls and 15 affected class/backend gates. Two package assemblies
  pass; no baseline, exclusions or timeout changes. Complete callers/parser/cache/realm
  contracts remain open; no chapter credit or new specification issue.

- [Relative difference rounding #8118](https://github.com/formatjs/formatjs/pull/8118): [private mode audit](temporal-relative-rounding-contract-audit.md)
  replaces mutable startsWith with exact half-mode comparisons. Two public tests
  reproduced the hook before correction. Shared controls add native Duration
  field-bag ordering and Apia's collapsed day window across all nine modes and
  both operation directions. Seven focused gates pass (five executed, two cached);
  all 27 expanded tests and two package assemblies pass. The separate
  [Apia retry inconsistency](temporal-spec-issues.md#day-window-retry-ignores-shift-after-apias-skipped-date)
  concerns the published proposal comparison; existing FormatJS fallback is
  preserved. No baseline, exclusions or timeout changes.
  [Count/window proof](temporal-calendar-count-window-audit.md) and
  [precision bounds](temporal-date-largest-precision-audit.md) retain provider,
  decomposition and complete window contracts as open; no chapter credit.

- [Conversion boundary controls #8117](https://github.com/formatjs/formatjs/pull/8117): [Duration.from field bags](temporal-duration-from-caller-audit.md)
  and [zoned offset matching](temporal-zoned-offset-match-audit.md) add independent
  public/typed evidence for inherited Get/coercion ordering, abrupt completion,
  signed minute ties, earliest fold matching and exclusive day bounds. No runtime
  defect found in these slices. All six gates pass (four executed, two cached),
  including historical Monrovia TS/native Hermes source/bytecode controls. Complete callers and
  provider/realm contracts remain open; no historical/Temporal chapter credit.

- [Exact clock-unit differences #8116](https://github.com/formatjs/formatjs/pull/8116): [precision audit](temporal-difference-precision-audit.md)
  rounds original integer epoch spans before Number-valued Duration construction
  in TS/Rust PlainDateTime and ZonedDateTime until/since. Both backends reproduced
  the wrong 10 ns tie above 2**53 before correction. All 49 expanded tests pass
  (46 executed, three cached), including 40 class/backend gates; Temporal and
  DurationFormat assemblies pass. All five final leading-unit/native Hermes
  validation gates pass (three executed, two cached). Calendar/day paths and complete callers remain open;
  no historical line or authoritative Temporal section credit added.

- [Duration private totals/field selection #8115](https://github.com/formatjs/formatjs/pull/8115): [bounded audit](temporal-duration-private-operations-audit.md)
  captures BigInt bit-length conversion and replaces private findIndex with an
  indexed scan. Two public regressions failed before correction. All twelve
  relevant gates pass (eight executed, four cached), including five Duration
  backends and independent precision controls; two package assemblies pass.
  No baseline, exclusions or timeout changes. Exact-ratio proof assumes exact
  input nanoseconds; rounded-difference intermediates and full callers stay open.

- [ZonedDateTime identity rounding #8114](https://github.com/formatjs/formatjs/pull/8114): [source/boundary audit](temporal-zoned-identity-rounding-audit.md)
  restores a fresh equivalent object for nanosecond increment 1 after option
  validation. Two public tests failed before correction at the lower local-date
  guard; all twelve relevant expanded gates pass (ten executed, two cached),
  including five ZonedDateTime backends and native Hermes. Temporal assembly
  passes; no baseline, exclusions or timeout changes.
  The separately recorded [Casey repeated-date assertion](temporal-spec-issues.md#day-rounding-upper-bound-assertion-on-repeated-civil-dates)
  is an algorithm inconsistency in the historical/published proposal comparison,
  not a numbered ECMA-262 Temporal finding. Complete rounding remains open.

- [Duration string parsing #8113](https://github.com/formatjs/formatjs/pull/8113): [grammar/arithmetic and hook audit](temporal-duration-parser-audit.md)
  maps the TS/Rust parser contracts without adding Temporal chapter credit.
  Indexed ASCII scanning removes mutable RegExp/String methods and legacy RegExp
  state changes. Five regressions failed before correction; three focused gates
  pass with exact calendar/time limits and malformed-input prototype controls.
  Expanded validation passes all 45 tests (44 executed, one cached), including
  all 40 Temporal class/backend gates; Temporal and DurationFormat assemblies
  pass. No baseline, exclusions or timeout changes. Complete callers and
  authoritative Temporal API section mapping stay open; no new spec issue.

- [Local-time conversion hooks #8112](https://github.com/formatjs/formatjs/pull/8112): [bounded audit](temporal-local-time-intrinsics-audit.md)
  traces Temporal Instant formatting to ECMA-402 §11.5.11 step 3. Captured
  conversions and indexed tuple reads remove extra public hooks; three direct
  regressions failed before correction. Ten focused gates and DateTimeFormat
  package assembly pass, including public Instant mutation controls across all
  four rendering methods. Fractional Decimal internals,
  complete public iterator isolation and complete callers stay open.
  [Explicit transition lookup](temporal-transition-lookup-audit.md) has a separate
  conditional proof for valid generated-data contracts; no new chapter credit.

- [Shared UTC-offset scanner #8111](https://github.com/formatjs/formatjs/pull/8111):
  [Grammar/integration audit](temporal-offset-grammar-audit.md#shared-scanner-and-datetimeformat-integration)
  connects ECMA-262 §21.4.1.33–§21.4.1.33.2 with ECMA-402 §11.5.11 step 1/1.a.
  Temporal and ToLocalTime now use the same leaf scanner; its audited body is
  unchanged. This fixes comma fractions being treated as zero offset by the
  independent formatter scanner. Expanded 72-vector cancellation matrix passes,
  including both signs and both Date limits. Original epoch Decimal path and
  public minute-only timezone option validation stay unchanged. Eight focused
  gates pass; original/provisional Temporal chapter credit stays unchanged.
  Full 42-case pattern replay passes in isolation (322.3 seconds). Expanded run:
  205/207 pass (99 executed, 108 cached); raw ListFormat/PluralRules failures
  exactly match existing constructor-realm baseline keys/messages across 162/106
  scenarios. Both baseline-aware gates pass. All ten package assemblies, all 40
  Temporal class/backend gates, unchanged 12,808-case ICU snapshot and native
  DateTimeFormat comparison (9,440 cases / 40,284 assertions per source/bytecode
  run) pass. The formerly missed extended-calendar Hermes gate also passes all
  300 checks in source/bytecode. No baseline, exclusions or timeout changes.
  Named-zone policy and complete callers remain open; no new specification issue.
  Parent #8110 at 7b1e3aae9cc634b61910f580f3af66c3e41eb0b4 passes hooks,
  cross-build, native smoke and
  [all-target CI](https://formatjs.buildbuddy.io/invocation/bdcb3592-cc5d-4187-b5ef-7028751980ca).

- [Gregorian local-time records #8110](https://github.com/formatjs/formatjs/pull/8110):
  [Record audit](temporal-local-time-record-audit.md) maps ECMA-402 §11.5.11 steps
  and §11.5.12 Table 17 to TS/Rust. Gregorian/ISO record producers now retain signed
  years, with separate era labels; display normalization stays in the pattern
  renderer. New TS and Rust controls failed before correction. All seven focused
  gates pass, including 108 Date-oracle local records and twelve Rust provider
  records at BCE/era/date bounds. Existing all-zone/golden-zone comparisons use
  signed fields directly. Offset/data policy, non-Gregorian records and complete
  caller contracts remain open. No new spec issue or historical source-line
  credit. Full 42-case pattern replay passes in isolation (323.5 seconds).
  Expanded run: 202/204 pass (65 executed, 139 cached); both raw strict failures
  exactly match existing ListFormat/PluralRules baseline keys/messages. Ten
  assemblies, 40 Temporal backend/class gates and the unchanged 12,808-case ICU
  snapshot pass. Native formatter comparison passes 9,440 cases / 40,284 assertions
  per source/bytecode run. Parent #8109 CI identified a missed extended-calendar
  Hermes oracle expecting a raw negative Buddhist display year. Reproduced locally,
  corrected to the published display rule; 300 checks pass in source/bytecode and
  both owning runtime/compiler gates pass. Those three gates expand the inventory
  to 207: combined validation covers 205 passing targets and two existing raw
  strict baseline failures. Runtime/other tested source hashes unchanged after
  the broad run; no fixture, baseline, exclusion or timeout changes.

- [Native Intl bridge display years #8109](https://github.com/formatjs/formatjs/pull/8109):
  [Year audit follow-up](temporal-calendar-year-audit.md#native-intl-bridge-follow-up)
  applies published ECMA-402 §11.5.4 step 15.f.iv before bridge numeric/two-digit
  rendering. Buddhist −1/0/1 now displays 2/1/1; stored Temporal fields and raw ICU
  fixtures stay unchanged. New public regression failed before the correction.
  All 124 new controls pass across locale methods, Number/Date/Instant/plain
  inputs, cold/warm formatting and ranges, including supplementary-plane digits.
  Seven focused gates pass, including independent ICU and native Hermes.
  Complete bridge and calendar algorithms remain open. No new specification
  issue or historical source-line credit.
  Expanded matrix: 202/204 pass (79 executed, 125 cached); two raw strict failures
  exactly match existing ListFormat/PluralRules baseline keys/messages. All ten
  assemblies and 40 Temporal class/backend gates pass. Full 42-case pattern
  oracle and unchanged 12,808-case ICU snapshot pass from cache. Final cleanup
  removes a redundant year condition from month/day oracle assertions; all five
  affected oracle/compiler gates pass on rerun. Runtime and other tested inputs
  remain unchanged. Native Hermes passes 936 ICU-era plus 24 lunar checks in both
  source/bytecode runs; the formatter comparison passes 9,440 cases and 40,284
  assertions per run. Parent #8108 at e54185b34cc5c7b4290d7954192e2d937256aceb has
  successful hooks, cross-build, native smoke and
  [all-target test](https://formatjs.buildbuddy.io/invocation/ea8c55a2-d323-4237-b2e4-e4a35c593b80)
  statuses.

- [Native Intl bridge private state #8108](https://github.com/formatjs/formatjs/pull/8108):
  [Source audit](temporal-legacy-bridge-state-audit.md) maps selected storage and
  native delegation to ECMA-262 §6.1.7.2, §7.3.13–14 and §28.1.1–2.
  Captured WeakMap/Map operations and Reflect helpers protect the installed
  bridge. All 98 packaged cold/warm controls pass, including ±1 ns projection
  misses/hits and zero hook-call assertions. Three focused gates pass; native
  host compatibility preserves 20 existing diagnostics across 362 executions.
  Expanded matrix: 195/197 pass (75 executed, 122 cached); both raw strict failures
  exactly match existing ListFormat/PluralRules baseline keys and messages.
  Ten assemblies, all 40 Temporal class/backend gates, unchanged ICU snapshot
  and full cached 42-case pattern oracle pass. Strengthened test rerun passes;
  runtime/BUILD unchanged. Complete bridge algorithms remain open. No new spec
  issue or historical source-line credit.
  Parent #8107 at e82b5c9ddf67516621b0d390d11d176cb75a1aea has successful hooks,
  cross-build, native smoke and
  [all-target test](https://formatjs.buildbuddy.io/invocation/9ea8f8eb-474b-4356-972f-86f7a997dfb2)
  statuses.

- [Private formatter caches and numeric dispatch #8107](https://github.com/formatjs/formatjs/pull/8107):
  [Source audit](temporal-private-format-cache-audit.md) for
  ECMA-262 §6.1.7.2 storage privacy and ECMA-402 §11.5.5 steps 1–8 mapped to
  current code. Captured WeakMap operations protect sixteen storage families in
  directly exercised formatter, locale and number dependencies. Five initial
  controls failed before fixes; further lookup/number traces identified remaining
  paths. All fourteen focused gates pass, including owned/native Temporal and
  native Hermes (9,440 cases / 40,284 assertions). Full 42-case pattern replay
  passes in isolation. Expanded run: 193/195 targets pass (60 executed, 135 cached).
  Raw ListFormat and PluralRules strict diagnostics exactly match both existing
  constructor-realm baseline keys/messages per package (162/106 scenarios).
  Both baseline-aware gates and the native PluralRules control pass. Ten package
  assemblies build; all 40 Temporal backend/class gates and the unchanged ICU
  snapshot pass. No corpus, baseline or timeout changes.
  Other collections and complete caller algorithms stay open.
  No new specification issue or historical Temporal source-line credit.
  Parent #8106 at ca23f8c94bb3352e96dca9f42ed5e210fc366421 has successful
  hooks, cross-build, native smoke and
  [all-target test](https://formatjs.buildbuddy.io/invocation/ed921975-f1de-45dd-b7a2-06fe0d60d0fa)
  statuses.

- [Calendar display-year normalization #8106](https://github.com/formatjs/formatjs/pull/8106):
  [Source audit](temporal-calendar-year-audit.md) for
  ECMA-402 §11.5.4 step 15.f.iv applies without a calendar guard in TS/Rust.
  Real Buddhist-provider controls reproduce the previous −1/0 output and require
  the published 2/1 result before numeric and two-digit rendering. Native ICU's
  disagreement is recorded separately; no specification defect is inferred.
  Complete calendar and ToLocalTime contracts remain open. Four focused gates
  pass, followed by the isolated full 42-case pattern oracle and 170/171 targets
  in the expanded consumer matrix (65 executed, 106 cached). Sole failure matches
  both existing raw ListFormat constructor-realm baseline keys/messages exactly;
  the baseline-aware gate passes. Eight package assemblies build, all 40 Temporal
  backend/class gates pass, and the ICU snapshot passes unchanged. No baseline,
  exclusions or timeout changes. Owned Temporal integration passes 22 cases.

- [Local-offset precision #8105](https://github.com/formatjs/formatjs/pull/8105):
  [Precision evidence](temporal-local-offset-precision-audit.md) for
  ECMA-402 §11.5.11 steps 1–3 retain partial status. Thirty-six new boundary
  vectors pass with the existing runtime; deliberately converting nanoseconds
  through Number before Decimal construction fails the new test while the four
  prior target tests pass. Runtime restored unchanged. Added timezone runtime
  and two compiler gates to the inventory (170 targets); this does not imply
  that the full expanded matrix has been rerun. All six focused runtime/compiler
  gates pass (four executed, two cached). No baseline, exclusion or timeout changes.
  Exact-head checkpoint 7d7ea217fd123459189e7e6f7d6f2cbaad068591: hooks,
  [all-target tests](https://formatjs.buildbuddy.io/invocation/869731c6-62d4-4dea-a1c1-7429d368c664),
  cross-build and native smoke statuses are successful.

- [Date pattern producer #8104](https://github.com/formatjs/formatjs/pull/8104): [ECMA-402 §11.5.4 step map](temporal-date-pattern-audit.md)
  records every top-level step and separates reviewed record/numeric paths from
  open dependencies. TS now uses indexed traversal, own List writes, captured
  floor and private Unicode truncation. TS/Rust retain required unknown fields
  using identical exact-epoch fallback text. Nine TS controls and one Rust witness
  reproduced before fixes; five focused gates pass. All 166 regression targets
  pass across the broad run and an isolated 42-case pattern replay after a timeout.
  The 167th target is raw ListFormat strict diagnostics matching both existing
  baseline failures. Eight package assemblies build; no baseline, exclusion or
  test timeout changed.
  No new specification issue or Temporal historical line credit.

- Parent CI checkpoints: #8102 at 1cb4aa456ba5d1af0db2c3ebeab7dad2a6280659
  ([all-target tests](https://formatjs.buildbuddy.io/invocation/671df843-c583-4530-8fd4-9f05dfc70667))
  and #8103 at 83b453070eae4cb972799825018bb1c85ce09696
  ([all-target tests](https://formatjs.buildbuddy.io/invocation/fc26c998-053f-4519-9608-4ccc7625d8f5))
  passed tests, cross-build, native smoke and hooks. Later heads retain their own CI gate.

- [Shared Pattern String parser #8103](https://github.com/formatjs/formatjs/pull/8103): [ECMA-402 §9.2.15](temporal-pattern-partition-audit.md)
  now maps every step to source lines. Captured String operations and private
  own-property appends remove four reproduced mutable-hook regressions. Twenty
  focused gates pass. Expanded validation finished: 164/165 targets pass; the sole
  failure is raw ListFormat strict diagnostics matching both existing baseline
  constructor failures exactly. All eight package assemblies build. No baseline
  or exclusion changed. The `{literal}` prose
  inconsistency is [recorded separately](temporal-spec-issues.md#partitionpattern-literal-placeholder-versus-result-description).
  Caller and producer audits remain open; Temporal historical line credit unchanged.

- [Single-value formatter parts #8102](https://github.com/formatjs/formatjs/pull/8102): [ECMA-402 §11.5.7 / §16.5.6 source mapping](temporal-parts-result-audit.md)
  traces producer delegation and moves shared result construction to CreatePartsArray.
  Indexed traversal and captured own-property creation remove iterator, push and
  inherited-index-setter hooks. Three regression controls reproduced before the
  fix; 21 focused gates and the 145-target consumer matrix pass (27 executed,
  118 cached); seven package assemblies build. Partition
  producers and public method contracts remain open; no Temporal line credit added.

- Parent CI checkpoint: #8101 at aa8e3b0300381a7ab9730245d9163a95612632aa passed
  [all-target tests](https://formatjs.buildbuddy.io/invocation/6971c41b-844f-4a67-8bee-fb2ede88f35b),
  cross-build, native smoke and hooks. Later heads retain their own CI gate.

- Foundation object contracts: [six helper mappings](temporal-object-contract-audit.md)
  cover ArrayCreate, SameValue, HasOwnProperty, ToObject and language-type
  classification. Sparse array allocation and pure equality remove mutable
  Array.from/Object.is hooks. Symbol own keys and host prototypes are covered.
  Seven regressions reproduced; all 135 consumer targets and seven package
  assemblies pass (85 executed, 50 cached). The foundation suite has 100 passing
  cases. Formatter iteration/appending remains open; no complete public caller
  or new historical Temporal line credit assigned.

- Primitive Number conversion: [ECMA-262 §7.1.4 and ECMA-402 §13.5.2](temporal-number-conversion-audit.md)
  now have complete shared helper mappings. ToNumber returns a primitive;
  DurationFormat integrality uses captured Number.isInteger and normalizes zero.
  Private Decimal construction no longer inserts numeric hooks between field
  Gets. Twelve helper/public regressions reproduced before the fix. All 124
  consumer targets and five package assemblies pass (74 executed, 50 cached),
  including standalone/transitive helper compiler gates. Full callers remain
  open; no new historical Temporal line credit assigned.

- Numeric timestamp integration: [composite compiler and package repair](temporal-timeclip-audit.md#composite-build-and-package-integration)
  preserves exact BigInt scaling under the existing ES2018 target and narrows a
  type assertion without changing unary-plus conversion. Bazel regenerates the
  package manifest; pnpm removes only its stale lockfile dependency entry.
  The three exact full-CI failures are added to the [checked-in consumer matrix](temporal-validation-targets.txt).
  All 116 targets, five package assemblies and frozen lockfile validation pass.
  Full-suite, cross-build and native smoke CI passed for #8099 at
  da293123a2d9d7db37657e2f86047de04cf9b954. Later heads retain their own CI gate.
  No historical line credit added.

- Shared constructor checks: [ECMA-262 §7.3.21 step mapping](temporal-instance-check-audit.md)
  replaces manual traversal with captured §20.2.3.6 delegation. Actual bound
  functions and host Objects follow engine internal slots; replacing mutable
  Object.prototype.isPrototypeOf no longer breaks Temporal formatter creation.
  Three helper regressions and one public formatter regression reproduced before
  the fix. All 110 consumer targets and five package assemblies pass (33 executed,
  77 cached). Parent full CI separately exposed numeric-layer composite typecheck
  and package-manifest gaps, repaired by the integration follow-up above. These
  focused results do not establish full CI success.
  Full constructor callers remain open; no historical line credit added.

- Shared primitive conversion: [ECMA-262 §7.1.1, §7.1.1.1 and §7.1.19](temporal-coercion-contract-audit.md)
  now have complete helper mappings, including GetMethod fusion and captured
  %String% delegation. Added Proxy ordering, abrupt-completion, non-callable,
  revoked-callable, cross-realm and Symbol boundary evidence. All 79 helper tests
  and both typecheck gates pass. Runtime unchanged; Temporal callers and chapter
  selection remain open. No historical line credit added.

- ECMA-262 [§21.4.1.31 TimeClip](https://tc39.es/ecma262/#sec-timeclip), steps 1–3:
  [full helper mapping](temporal-timeclip-audit.md) in TS/Rust. Numeric formatter
  timestamps now stay primitive Numbers, avoiding private Decimal re-coercion.
  Default formatting captures intrinsic Date.now. Four public mutation
  regressions reproduced both gaps; focused helper/provider tests pass.
  All 98 validation targets and both Temporal/DateTimeFormat package assemblies
  pass (74 executed, 24 cached), including native comparisons and root Rust/TS
  interoperability. Full Temporal callers remain open; no historical credit added.

- Shared UTC date arithmetic: [twelve published ECMA-262 section mappings](temporal-date-operations-audit.md)
  cover Day, DayFromYear, YearFromTime, DayWithinYear, IsLeapYear, MonthFromTime,
  DateFromTime, WeekDay and four clock extractions in their supported bounded
  domain. Every branch, step and numeric bound maps to source lines. New builtin
  UTC controls cover 19,200 month/interior vectors across a Gregorian cycle and
  extreme time values. Executable arithmetic unchanged; MakeDay witness ambiguity
  and full Temporal callers remain open. All ten focused/consumer Bazel targets
  and Temporal package assembly pass (four executed, six cached).

- ECMA-262 [§21.4.1.33 UTCOffset grammar](https://tc39.es/ecma262/#sec-time-zone-offset-strings),
  §21.4.1.33.1 steps 1–3 and §21.4.1.33.2 steps 1–17:
  [complete helper contract mapping](temporal-offset-grammar-audit.md).
  Bounded ASCII scanning removes private RegExp hooks; fixed-zone constructor
  gates and canonicalization avoid mutable RegExp/String methods. Rust parser,
  full-input FFI guard and minute-only registry paths reviewed. Public caller
  clauses remain open. All 75 Bazel targets and Temporal package assembly pass
  (61 executed, 14 cached); no historical Temporal line credit added.

- ECMA-262 [§21.4.1.33.2 steps 15.a and 16.b–16.d](https://tc39.es/ecma262/#sec-parsetimezoneoffsetstring):
  private nine-digit fraction padding replaces mutable padEnd calls in four
  shared parser sites. Five public mutation regressions reproduced the gap.
  The [offset fraction audit](temporal-offset-fraction-audit.md) records the
  bounded-digit equivalence and independent controls. This dependency review
  adds no credit to historical Temporal source-line counts. The later helper
  review above supersedes its offset-specific open status; other parser hooks
  remain open.
  All 75 validation targets and Temporal package assembly pass.

- `ParseMonthCode` syntax and coercion, `calendar.html` lines 83–85.
  Implementation: `dateFieldValue` in [date-core.ts](../../packages/temporal/date-core.ts).
  Reject `M00` before later field getters; preserve rejection of trailing terminators;
  keep `M00L` and calendar-invalid but syntactically valid codes for calendar resolution.
  Remaining result construction and downstream calendar checks stay open.
  Regression first failed with `year getter reached`; date/time, short-date and
  calendar suites plus implementation/test typechecks pass after the fix.
- `GetTemporalRelativeToOption` internal-slot branches, `abstractops.html` lines 607–613.
  Implementation: `toRelativeTo` in [relative-duration.ts](../../packages/temporal/relative-duration.ts).
  PlainDateTime copies its internal ISO date and calendar without reading public
  fields. Date and zoned anchors retain their existing internal records.
  Regression first failed with `Unexpected hour read`; relative-duration tests,
  implementation/test typechecks and installed native Hermes regressions pass.
  The final pre-epoch vector passes. Affected Node Date, DateTime, YearMonth,
  MonthDay and Duration Test262 targets pass. Full Date/Duration Test262 suites
  pass on both TS and SDK Hermes in source and bytecode modes. No exclusions changed.
  Typed Rust receives prepared anchors; JS getter/coercion requirements live here.

- Calendar-total nudge bounds, `duration.html` lines 1631 and 1908.
  Implementation: `relativeTotal` in [relative-duration.ts](../../packages/temporal/relative-duration.ts)
  and `total`/`total_duration` in [Rust](../../crates/temporal/relative_duration.rs).
  Validate the next interpolation endpoint before returning an exact year/month/week
  total. Zero zoned calendar totals use the positive window; plain zero totals keep
  the explicit shortcut from `plaindatetime.html` line 1023.
  Both public TS and Rust regressions failed before the fix and pass after it;
  boundary cases cover both signs, exact totals and zero anchor differences.
  Rust public tests, TS relative and plain-relative oracles, implementation/test
  typechecks, Node Duration Test262 and installed native Hermes regressions pass.
  Calendar-provider tests and full TS/SDK Hermes Duration suites pass in source
  and bytecode modes. No exclusions changed.
  Remaining nudge construction, rounding and ratio lines stay open.

- Short-date string option ordering, `plainyearmonth.html` lines 474–479 and
  `plainmonthday.html` lines 302–307.
  Implementation: `parseShortSlot` in [short-date-core.ts](../../packages/temporal/short-date-core.ts).
  Parse syntax and canonicalize the calendar before options; read `overflow`
  before representability checks and calendar projection. Undefined native options
  retain the direct parser because normalization has no observable reads.
  The public regression failed before the fix. Short-date ICU controls, Node
  YearMonth/MonthDay Test262, typechecks and installed native Hermes checks pass.
  Full YearMonth/MonthDay suites pass on TS and SDK Hermes in source and bytecode
  modes. No exclusions changed.
  Malformed syntax and unknown calendars still fail before the overflow getter.
  Remaining conversion steps stay open. Trailing-terminator cases are controls;
  their rejection was already correct before this audit.

- Date/date-time string option ordering, `plaindate.html` lines 683–688 and
  `plaindatetime.html` lines 824–830.
  Implementation: `prepareDateTimeString` in [date-core.ts](../../packages/temporal/date-core.ts),
  called by `toPlainDateSlot` and `toPlainDateTimeSlot` before bounds checks.
  Syntax and calendar errors precede options; representability errors follow them.
  Native calls without options retain direct parsing. Explicit native options
  use the same preparation order as pure TS.
  Public regression failed before the fix. Focused tests, typechecks and installed
  native Hermes checks pass. Node Date/DateTime Test262 and all eight TS/SDK
  Hermes Date/DateTime source/bytecode suites pass. No exclusions changed.
  Remaining conversion and creation steps stay open.

- Calendar identifier conversion, `calendar.html` lines 675–678 and 696–700;
  calendar-string syntax delegation, `abstractops.html` line 1619.
  Implementation: `calendarId`/`calendarFromObject` in [date-core.ts](../../packages/temporal/date-core.ts)
  and `parseCalendarString` in [instant-string.ts](../../packages/temporal/instant-string.ts).
  Calendar extraction parses ISO fields without creating a bounded date. Valid
  six-digit years outside Temporal's range remain usable as calendar strings;
  malformed dates, times, annotations and unsupported calendars still fail.
  All five calendar-bearing slots bypass public calendar/coercion getters.
  Field bags read `calendar` once and default undefined to ISO; all three
  `withCalendar` methods already reject missing/undefined arguments before the
  shared helper. Public controls cover these distinct defaults.
  The range regression failed before the fix. Focused tests and installed native
  Hermes checks pass. Full Node suites for all five calendar-bearing classes and
  all 20 TS/SDK Hermes source/bytecode suites pass. No exclusions changed.
  Remaining calendar grammar details and bare-identifier fallback stay open.

- Internal object allocation: remove observable reads of mutable `Object.create`
  from constructors, factories, option records and Intl adapters. Shared capture:
  [intrinsics.ts](../../packages/temporal/intrinsics.ts). The native transport
  already captures its allocator during initialization.
  Public regression failed with `Mutable Object.create reached`; all eight
  constructors and all eight `from` factories pass after the fix, on pure TS and
  installed native Hermes. 46 focused/conformance test targets pass, including
  full Node class suites, all 32 TS/SDK Hermes class suites, legacy Intl host and
  owned formatter/ICU controls. Package assembly passes.
  The three unfiltered Intl diagnostics each execute 4,080 scenarios: 4,076 pass;
  four existing IANA2026f/CLDR49 data conflicts remain. See the separate
  [discrepancy record](temporal-conformance-discrepancies.md). No new failures,
  exclusions or accepted-failure count changes.
  Allocation lines reviewed here: `instant.html` 387, `duration.html` 1277,
  `plaindate.html` 642, `plaindatetime.html` 877, `plaintime.html` 710,
  `plainyearmonth.html` 549, `plainmonthday.html` 336, `zoneddatetime.html` 1028.
  These lines stay open: this fixes the observable allocator dependency, while
  complete prototype selection and cross-realm requirements still need review.
  Formatter-provider `Object.create` calls and other mutable intrinsic dependencies
  remain open. Shared `ToPrimitive` call dependencies are addressed below.
  Constructor and formatter `Reflect.get` dependencies are addressed below.
  No new line signoffs.

- Internal property reads: constructor prototype selection and formatter option
  proxies use direct property access instead of mutable `Reflect.get`.
  Implementation: the eight constructor facades, [locale.ts](../../packages/temporal/locale.ts)
  and [legacy-intl.ts](../../packages/temporal/legacy-intl.ts).
  Ordinary property access preserves getter receivers and abrupt completions
  without consulting user replacements of the reflection helper. Symbol keys
  remain valid through `Record<PropertyKey, unknown>` option-source typing.
  Both public constructor and locale-option regressions failed before the fix;
  all 49 test targets pass: focused public/type checks, installed native Hermes,
  legacy Intl host, all 40 full Node/TS-Hermes/SDK-Hermes class suites, the
  three 306-case locale gates and owned formatter/ICU controls. Package assembly
  passes. Locale-gate exclusions and data-conflict records remain unchanged.
  The same eight allocation lines above remain open for full prototype and
  cross-realm review. Other mutable intrinsic dependencies remain open.

- Shared primitive coercion dependencies: [ToPrimitive](../../packages/ecma262-abstract/ToPrimitive.ts)
  and [ToString](../../packages/ecma262-abstract/ToString.ts) retain their realm's
  call helper, well-known primitive-conversion symbol and string/error constructors.
  Ordinary conversion traverses its private method list by index, preserving
  receiver, hint, getter/call order, fallback and abrupt completion behavior.
  The reference contracts are ECMA-262
  [ToPrimitive](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-toprimitive),
  [OrdinaryToPrimitive](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-ordinarytoprimitive)
  and [ToString](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-tostring).
  All five independent mutation regressions failed before the fix and pass after
  it. Shared helper/type checks and public Temporal/installed Hermes integration
  pass, including simultaneous `Reflect.apply`, `Symbol` and `String` replacement.
  All 60 test targets pass: shared helper/type checks, Temporal public/native
  integration, all 40 full class suites, three locale gates, owned formatter/ICU
  controls, legacy Intl host and eight shared Intl consumer suites. Package
  assembly passes. Existing exclusions and data-conflict records are unchanged.
  These auxiliary ECMA-262 operations are outside the 14-file line-count index.
  No new Temporal line signoffs. Other intrinsic dependencies remain open;
  host-exotic object classification is addressed below.

- Host-exotic object classification: [IsObject](../../packages/ecma262-abstract/IsObject.ts),
  [Type](../../packages/ecma262-abstract/Type.ts) and
  [ToPrimitive](../../packages/ecma262-abstract/ToPrimitive.ts) preserve object
  semantics for `document.all`-style values. ECMA-262
  [Annex B.3.6](https://tc39.es/ecma262/multipage/additional-ecmascript-features-for-web-browsers.html#sec-IsHTMLDDA-internal-slot)
  changes Boolean, loose-equality and `typeof` behavior, not object identity.
  Temporal field-bag, options and constructor-prototype checks share this
  classification. Formatter option-source caches use strict undefined checks.
  Ordinary conversion recognizes callable host objects through a captured
  `Function.prototype.toString`, without invoking the candidate or reading its
  public properties. Host objects returned from conversion hooks remain objects,
  so exotic conversion rejects them and ordinary conversion continues fallback.
  Tests use V8's real undetectable callable object, created through its test
  intrinsic; native-syntax access is disabled before invoking implementation code.
  Three initial shared-helper regressions failed before the fix. Public checks
  cover all seven field-bag conversions, Duration.with, options, Instant coercion
  and all eight constructor prototypes. All 60 focused, typecheck, full class,
  locale, installed native Hermes and shared Intl consumer test targets pass;
  package assembly passes. No exclusions changed. Full prototype/cross-realm allocation
  lines remain open. Provider option and duration-field checks are addressed
  below; other provider object checks remain open.
  No new line signoffs.

- Provider host-object coercion: [ToObject](../../packages/ecma262-abstract/ToObject.ts)
  rejects only strict undefined/null; [CoerceOptionsToObject](../../packages/ecma402-abstract/CoerceOptionsToObject.ts)
  and [GetOptionsObject](../../packages/ecma402-abstract/GetOptionsObject.ts)
  distinguish undefined from undetectable host objects. [GetOption](../../packages/ecma402-abstract/GetOption.ts)
  and [ToDurationRecord](../../packages/ecma402-abstract/DurationFormat/ToDurationRecord.ts)
  use shared object classification. Owned DurationFormat accepts host-exotic
  options through `Duration.toLocaleString` and reads duration-like host fields
  once, with the original getter receiver and specified order.
  The contracts are ECMA-262 [ToObject](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-toobject)
  and [GetOptionsObject](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-getoptionsobject),
  plus ECMA-402 [CoerceOptionsToObject](https://tc39.es/ecma402/#sec-coerceoptionstoobject),
  [GetOption](https://tc39.es/ecma402/#sec-getoption) and
  [ToDurationRecord](https://tc39.es/ecma402/#sec-todurationrecord).
  Seven real-engine regressions failed before the fix; all eight focused helper,
  provider integration and typecheck targets pass after it. All 36 broad targets
  also pass: twelve Intl Test262 baseline gates, thirteen Intl consumer unit
  suites, owned formatter controls and Temporal provider/locale gates. Existing
  accepted failures and exclusions are unchanged. Temporal, DurationFormat and
  DateTimeFormat package assembly passes.
  `intl.html`'s ToDurationRecord block is deleted editorial content in the pinned
  Temporal proposal. Its retained provider helper backs ordinary inputs; do not
  count this fix as signoff of that deleted block or of the full replacement
  ToTemporalDuration/format algorithms. Provider receiver/legacy-constructor checks
  (`OrdinaryHasInstance` and formatter facades) and mutable intrinsic dependencies
  remain open. No new line signoffs.

- Exact rounding arithmetic: [TypeScript](../../packages/temporal/rounding.ts)
  and [Rust](../../crates/temporal/rounding.rs) now carry individual pinned-line
  explanations for 40 source lines. Newly traced: NegateRoundingMode (300–304),
  GetUnsignedRoundingMode (819), ApplyUnsignedRoundingMode (932–947) and
  RoundNumberToIncrement (964–975). The six already indexed
  RoundNumberToIncrementAsIfPositive lines (996–1001) are reverified, not counted
  as new. All 18 signed table entries were compared with the positive-column
  branches and directional-mode reversal.
  Exact quotient/remainder arithmetic replaces fractional division; a nonzero
  remainder brackets the quotient. Comparing twice that remainder with quantum
  compares both distances without division. Tie parity uses the lower quotient;
  testing `lower % 2 != 0` preserves parity for negative Euclidean quotients too.
  Signed rounding applies the same core to the absolute numerator and reverses
  only ceil/floor and halfCeil/halfFloor; outer sign restoration commutes with
  multiplication by the positive increment. Calendar callers can represent their
  rational quotient with an integer numerator and positive span; caller endpoint
  selection/scaling and option/range validation remain separate open work.
  The Rust i64 fast path widens quotient/remainder before addition and product,
  retaining results across signed-64-bit boundaries. Temporal's validated bounds
  fit i128; this signoff does not claim arbitrary unbounded Rust integer inputs.
  Existing independent ICU oracles cover all nine modes, both signs, exact
  multiples, midpoint neighbors, even/odd quotient ties and wide values. The
  exact-time oracle shifts by an even quantum multiple before ICU rounding;
  the duration oracle uses signed ICU rounding directly. No algorithm defect
  found in these reviewed arithmetic steps. Rounding-core executable tokens are unchanged.
  Fixture review exposed a coverage gap: existing half-even midpoint rows all
  rounded to zero. Extended ICU sample inputs with three-half/five-half quanta and
  Instant limit-adjacent midpoints; expected outputs still come from ICU. Current
  fixtures contain 3,987 Instant rows and 7,130 signed Duration rounding/total rows.
  Both now include nonzero half-even results for each sign/parity combination.
  Updated the shared duration-oracle count and current Rust coverage summary;
  historical WASM measurement records retain their original counts.
  All ten validation targets pass: TS ICU/public clock/relative controls, the
  Rust public suite, full Node Instant/Duration Test262, installed Hermes and
  native ISO/Duration ICU oracles in source and optimized bytecode modes.
  No exclusions or accepted-failure baselines changed.

- Numeric floor dependency: [captured floor](../../packages/ecma262-abstract/intrinsics.ts)
  replaces 50 dynamic calls across 15 Temporal/shared date and calendar modules,
  including the shared timezone-transition search. Internal floor operations no
  longer consult a replacement `Math.floor` installed by user code after import.
  Seven shared date-operation regressions and eight public Temporal regressions
  failed before the fix. Installed native Hermes also checks formatting, week
  calculation and precision under the replacement. Other numeric/global/prototype
  dependencies and formatter-provider floor calls remain open.
  The ISO range review also found an editorial inconsistency in the
  CheckISODaysRange removal note, recorded separately in
  [spec issues](temporal-spec-issues.md#range-guard-removal-note-versus-lower-bound-offset-behavior).
  Pinned `prefer`/`reject` lower-date rejection stays intact; `use`/`ignore` still
  reach the valid minimum instant. Node/Rust controls cover this distinction.
  All 89 validation targets pass: focused regressions/typechecks, installed
  native Hermes, Rust bound controls, all 40 class Test262 backend gates, shared
  Intl consumer units and baseline gates, locale gates and ICU oracles. Temporal,
  DateTimeFormat and DurationFormat package assembly passes. Existing exclusions
  and accepted-failure baselines are unchanged.
  Remaining ISO arithmetic/range clauses stay open. No new line signoffs.

- Numeric intrinsic dependencies: [shared captures](../../packages/ecma262-abstract/intrinsics.ts)
  now retain abs/min/max/trunc/sign, finite/integer/safe-integer predicates and
  Number/BigInt constructor calls. Replace 249 runtime references in 34 modules;
  existing native transport and clock captures remain intact. Constructor
  conversions preserve their original semantics, including Number(BigInt);
  unary-plus and explicit ToBigInt validation are unchanged.
  Ten independent public mutation regressions failed before the fix and pass
  after it. Installed native Hermes also replaces all ten dependency classes
  simultaneously while constructing, formatting, rounding and comparing values.
  Other intrinsic, error-constructor, prototype and provider dependencies remain
  open; this does not sign off complete public operations.

- ISO reverse conversion: [TS kernel](../../packages/temporal/kernel.ts),
  [Rust ISO conversion](../../crates/temporal/iso.rs) and
  [native record packing](../../crates/temporal/ffi.rs) now individually trace
  GetISOPartsFromEpoch, `timezone.html` lines 62–77. Its valid-Instant domain is
  contained in the implementation's wider local-time domain; no extra public
  range is claimed. Exact Euclidean day/clock division produces the same fields
  as the spec's integral-millisecond intermediate, which is exact below 2**53.
  Every discarded hour/minute/second is a multiple of 10**6 nanoseconds, so the
  remaining clock keeps the original nonnegative sub-millisecond remainder.
  Splitting it into millisecond/microsecond/nanosecond digits preserves 0..999
  bounds even at negative epochs. Flat private/transport records preserve the
  conceptual ISO date/time record fields.
  Gregorian inversion was reviewed through the March-based 400-year cycle and
  the Rust 128-day block lookup. New TS controls compare all 292,194 days across
  two complete eras around year zero with builtin UTC fields. Existing Rust
  full-era checks and independent ICU Gregorian controls cover the corresponding
  native conversion; current sub-millisecond/boundary vectors remain in place.
  The native request uses a null-prototype flat record, captured bigint text,
  call/JSON helpers and a trusted backend result with own numeric fields.
  Input parsing, forward conversion, local-time range policy and other calendar
  algorithms remain open. No arithmetic defect found in these reviewed reverse
  conversion steps.
  All 89 validation targets pass: public mutation/type checks, installed native
  Hermes, all 40 Temporal class backend gates, Intl consumer units/baseline gates,
  locale and ICU oracles, kernel controls and Rust era/public tests. Temporal,
  DateTimeFormat and DurationFormat package assembly passes. Existing exclusions
  and accepted-failure baselines are unchanged.

- Intrinsic exceptions: [shared captures](../../packages/ecma262-abstract/intrinsics.ts)
  retain Error, TypeError and RangeError constructors. Replace 348 value references
  in 59 Temporal/shared helper modules, including explicit throws, constructors
  passed to invariant and exception classification. Existing primitive/string
  conversion and native transport captures remain intact.
  Replacing a global constructor after module initialization no longer invokes user
  code instead of throwing the specified intrinsic error. Twenty-two public/helper
  regressions failed before the fix and pass afterward: all eight Temporal
  constructor bounds and receiver brands, nonfinite/nonpositive date inputs,
  object/options coercion, duration integrality and invariant diagnostics.
  Two additional public controls cover numeric coercion hint/count, truncation,
  user abrupt completions and BigInt/Symbol rejection for date and time inputs.
  Capturing constructors does not finish error classification: mutable
  Symbol.hasInstance, proxy behavior and cross-realm policy remain open.

- Integer coercion: `ToIntegerWithTruncation`, abstractops.html lines 1796–1798,
  now has individual traces in both [date-core.ts](../../packages/temporal/date-core.ts)
  and [plain-time.ts](../../packages/temporal/plain-time.ts). Unary plus delegates
  ToNumber to the engine, preserving numeric-hint conversion and abrupt completion.
  Captured truncation may precede the finite check: NaN/infinities remain
  nonintegral, while every finite result is an integer. Returning zero normalizes
  negative zero to the mathematical value.
  Month/day field preparation individually traces `ToPositiveIntegerWithTruncation`,
  lines 1779–1781: perform that conversion, reject nonpositive results, return the
  positive integer. Typed Rust receives already-coerced numeric inputs.
  These six new signoffs cover the coercion operations; field enumeration,
  constructor sequencing and ToIntegerIfIntegral's provider path stay open.
  All 91 validation targets pass: focused public/helper regressions and typechecks,
  all 40 Temporal class Test262 backend gates, native Hermes, Rust/kernel controls,
  Intl consumer units and accepted-failure gates, locale gates and ICU oracles.
  Temporal, DateTimeFormat and DurationFormat package assembly passes. Existing
  exclusions and accepted-failure baselines are unchanged.

- Private-list predicates: [shared captures](../../packages/ecma262-abstract/intrinsics.ts)
  retain Array.prototype.every, Array.prototype.some and Reflect.apply. Replace
  51 predicate-method calls across 20 Temporal and formatter/foundation modules:
  ISO validation, duration parsing/comparison, calendar signs, locale projections,
  DateTimeFormat patterns/options/ranges, DurationFormat validation/partitioning,
  NumberFormat range affixes, canonical variant aliases and locale-cache checks.
  Locale matcher's existing dependency direction is preserved with a local capture.
  Internal Lists no longer look up those mutable Array.prototype properties.
  Calling the original methods also preserves callback ordering, short-circuiting
  and array traversal semantics without adding a mutable call/apply lookup.
  Six regressions failed before their fixes: two public Temporal mutation cases,
  two owned-formatter cases, canonical variant aliases and cached locale matching.
  Owned formatter cases cover DateTimeFormat.format/formatRange plus Temporal
  date/duration locale methods. Temporal/formatter cases also replace Reflect.apply; installed
  native Hermes replaces both predicates and Reflect.apply simultaneously.
  Other array methods/iterators and full intrinsic isolation remain open. No
  complete public operation is signed off by this fix.
  All 95 validation targets pass: six mutation regressions and changed test
  typechecks, all 40 Temporal class Test262 backend gates, native Hermes,
  Rust/kernel controls, Intl consumer units and accepted-failure gates, locale
  gates and ICU oracles. Temporal, DateTimeFormat, DurationFormat,
  getCanonicalLocales and locale-matcher package assembly passes. Existing
  exclusions and accepted-failure baselines are unchanged.

- Forward ISO arithmetic review: compare the TS DayFromYear/month-offset formula
  and Rust March-based 400-year formula with GetUTCEpochNanoseconds' day/clock
  composition. New controls use builtin UTC dates for all 292,194 days across two
  Gregorian eras around year zero, including a fixed 13:14:15.987654321 clock.
  These expected dates come from the builtin oracle, independently of the
  implementation's reverse conversion; existing negative-epoch, leap-day and
  extreme-instant controls remain in place.
  The range/caller review below now traces clock/composition substeps and the
  independent limit conditions. MakeDay's witness range and its call from the
  limit predicate stay open; the boundary ambiguity is documented separately.

- Zoned string option ordering: `ToTemporalZonedDateTime`, zoneddatetime.html
  lines 992–995, now has individual traces in
  [zoned-date-time.ts](../../packages/temporal/zoned-date-time.ts). Parse syntax,
  time-zone and calendar identifiers first; resolve options and validate
  disambiguation, offset and overflow before local epoch/range conversion.
  [Native field parsing](../../crates/temporal/ffi.rs) now calls separate ISO
  field validation rather than converting to a representable local epoch.
  Invalid dates still fail before option getters; valid far-future/past fields
  survive parsing so options can run first. Native backend contract comments
  make this distinction explicit.
  Seven public getter/abrupt-completion cases, native Hermes checks and the Rust
  FFI regression failed before the fix and pass afterward. Controls preserve
  malformed-date/unknown-identifier precedence, minimum-Instant parsing and
  strict PlainDateTime limits through string, bag and constructor inputs.
  Other ToTemporalZonedDateTime steps remain open.

- Forward arithmetic/range traces: mainadditions.html lines 356–359 are mapped
  individually in [TS](../../packages/temporal/kernel.ts) and
  [Rust](../../crates/temporal/iso.rs). Valid clock fields make each MakeTime
  product/sum exact. For day-range candidates, the millisecond intermediate has
  magnitude below (100000002 * 86400000), which is below 2**53. Bigint/i128
  composition then preserves all sub-millisecond digits. Native transport packs
  each 0..999 digit into its checked subsecond field without rounding.
  ISODateTimeWithinLimits lines 762 and 764–766 are mapped in those converters
  and [prepared-epoch validation](../../packages/temporal/date-core.ts).
  Write n = d*D + t, D = nsPerDay, 0 <= t < D. If |d| > 100000001, the final
  interval necessarily rejects n; computing exact private arithmetic before
  that rejection has no user callbacks. Thus the fused guard subsumes the early
  day predicate. Equality at either local boundary is rejected; success maps to
  true, while the actual callers turn false into RangeError. Assert-only callers
  already require representable input. Producer calendar/time-zone algorithms
  retain their own open status.
  MakeDay line 355 and the dependent UTC-conversion call at line 763 remain open:
  the minimum-Instant month-start witness exposes an upstream range ambiguity,
  recorded in [spec issues](temporal-spec-issues.md#makeday-witness-range-at-the-minimum-instant).
  Preserve exact intended minimum behavior; do not claim the ambiguous calls
  are signed off. These eight arithmetic/range traces plus four option traces
  add 12 source lines, without signing off complete public methods.
  All 105 test gates pass: focused option/boundary tests and typechecks, every
  Rust Temporal test, all 40 Temporal class Test262 backend gates, native Hermes,
  kernel/ICU controls, locale profiles and Intl consumer/baseline gates. Five
  package assemblies pass. Arithmetic tokens and the extracted validation
  predicates are unchanged. Exclusions and accepted-failure baselines stay intact.

- Private clock defaults now test own fields in both JS and native adapters.
  Missing hour/minute/second/subsecond fields become zero without inherited
  Object.prototype getters. This repairs PlainDate's private noon conversion;
  user field bags still perform inherited Get operations. NoonTimeRecord
  (plaintime.html line 505) and the date/noon combination (plaindate.html line 890)
  gain individual traces. The dependent limit call at line 891 remains open.
  Constructor wrappers now bound every private argument access by the dense
  Proxy argument array's length: 32 former unguarded reads across eight classes.
  Omitted arguments cannot come from Array.prototype. All ten private Proxy
  handlers have null prototypes, using captured Proxy/Object.setPrototypeOf;
  inherited get/apply traps cannot affect constructor or formatter adapters.
  Shared HasOwnProperty captures its bound intrinsic. Fourteen direct own-field
  queries in Temporal and its formatter/locale providers now use captured checks;
  locale matcher keeps a local capture to preserve dependency direction.
  Public, helper, locale-matcher and installed-native regressions failed before
  these fixes. Controls preserve user getters, Proxy descriptor traps and normal
  omitted-argument errors/defaults. Other intrinsic dependencies stay open.

- ZonedDateTime constructor lines 30–33 now have individual traces: class-call
  rejection, ToBigInt, instant-range validation and strict String timezone check.
  Range validation now precedes timezone/calendar validation; three mixed-invalid
  argument regressions previously threw TypeError instead of RangeError.
  Constructor handlers cannot inherit an apply trap; ToPrimitive retains the
  number hint, native BigInt parsing and user abrupt completions. Bounds use
  exact inclusive bigint comparisons. Identifier parsing, calendar handling,
  prototype allocation and the remaining constructor steps stay open.

  All 105 test gates pass: focused regressions/typechecks, every Rust Temporal
  test, all 40 Temporal class Test262 backend gates, native Hermes, kernel/ICU
  controls, locale profiles and Intl consumer/accepted-failure gates. Temporal,
  DateTimeFormat, DurationFormat, getCanonicalLocales and locale-matcher package
  assembly passes. No exclusions or accepted-failure baselines changed.

- Comparison cores gain 32 individual source-line traces: CompareISODate
  (plaindate.html 909–915), CompareTimeRecord (plaintime.html 833–845),
  CompareISODateTime (plaindatetime.html 920–922), CompareEpochNanoseconds
  (instant.html 435–437), inclusive Instant bounds (instant.html 369), and the
  five public comparison return steps. TS facade comparisons and typed Rust
  comparators use exact chronological scalar encodings; executable code is
  unchanged. Dates use integral epoch days, clocks use normalized within-day
  nanoseconds. Each larger clock unit outweighs all possible lower fields;
  equal totals therefore imply equality of every field. Date-time values use
  d*nsPerDay + t with 0 <= t < nsPerDay, so different dates dominate the clock.
  Bigint/i128 comparisons preserve adjacent nanoseconds, including at both
  Instant bounds. Calendar/timezone metadata cannot affect these comparisons.
  Public Number results are exactly -1, positive zero or 1. Number epoch-day
  values in the Temporal domain fit exactly far below 2**53.
  Ordered vectors cover each clock carry, BCE/year zero, century/leap days,
  local endpoints, adjacent signed nanoseconds and inclusive Instant limits.
  Typed Rust checks the same chronology; installed-native Hermes checks every
  clock field and date/epoch sign. Public input conversions, record producers
  and the remaining comparison callers retain their own open status. This is
  conditional verification of the comparison cores, not complete-method signoff.
  CompareTimeRecord's prose reverses its algorithm's signs; preserve the numbered
  algorithm and record the editorial error in [spec issues](temporal-spec-issues.md#comparetimerecord-description-reverses-the-algorithms-signs).
  All 107 test gates pass, including the new comparison test/typecheck, every
  Rust Temporal test, native Hermes, all 40 Temporal class Test262 backend gates,
  kernel/ICU controls, locale profiles and Intl consumer/accepted-failure gates.
  Five package assemblies pass. No exclusions or accepted-failure baselines changed.

- PlainTime private six-field lists no longer use array map, spread or for-of.
  A six-element literal evaluates private field callbacks in index order;
  field-bag reads use an indexed private order list. Construction, field access
  and with() therefore avoid mutable map/iterator/next hooks and Array species.
  Four Node mutation regressions and the installed-native Hermes regression
  failed before the fix. Controls retain one public Get per supplied clock field
  in hour/microsecond/millisecond/minute/nanosecond/second order. Other private
  lists, array methods and provider dependencies remain open.
  RegulateTime lines 622–632 and IsValidTime lines 655–661 gain 18 individual
  TS/Rust traces. The six bounds are 23/59/59/999/999/999; constrain clamps each
  integer separately before packing, reject leaves inputs unchanged and throws
  on any invalid field. Finite/integer coercion remains a caller precondition.
  Independent indexed guards use the same predicate; the exact weighted total
  lies in 0..86399999999999, encoding six fields and implicit Days 0 without carry.
  Private Boolean/enum modes exhaust constrain/reject. The Rust FFI's saturating
  f64-to-i128 conversion preserves both choices: out-of-i128 values remain outside
  every clock bound under reject; constrain chooses the same endpoint. Every
  already-bounded integer converts exactly. Rust error mapping retains RangeError.
  New Node and JSON-FFI controls cover every field at zero, its upper bound,
  one step outside and huge signed finite values, including the largest finite
  JS Number. Installed-native controls test huge signed values; exact boundaries
  also retain existing construction/oracle/Test262 coverage.
  Other record producers, calendar regulation and full public conversions remain
  open. CreateTimeRecord's other callers and nonzero day-carry behavior are not
  signed off by the within-day result proof.
  The unnumbered descriptions at [617–618](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L617-L618)
  and [650–651](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L650-L651)
  also agree with these integer guards: clamp versus RangeError, ordinary
  time-of-day bounds and exclusion of numeric second 60. Leap-second string
  parsing remains separate work. These prose checks do not inflate numbered counts.
  All 109 test gates pass: mutation/boundary regressions and typechecks, every
  Rust Temporal test, native Hermes, all 40 Temporal class Test262 backend gates,
  kernel/ICU controls, locale profiles and Intl consumer/accepted-failure gates.
  Five package assemblies pass. Exclusions and accepted-failure baselines unchanged.

- Private array membership/index searches now retain original Array intrinsics
  and Reflect.apply: 76 calls (39 includes, 37 indexOf) across 32 runtime modules.
  Temporal calendar/field/unit checks and shared formatter/locale providers no
  longer consult replaced search methods. Five locale-matcher calls use local
  captures, preserving dependency layering. The helpers retain SameValueZero
  versus strict equality, first-match indices and original sparse-slot behavior.
  [Current callsite inventory](temporal-list-search-inventory.md) links the retained
  searches; locale entry classification subsequently replaces one of the 76 with IsObject.
  Two Temporal, two owned-formatter and two locale-matcher mutation cases plus
  native Hermes failed before the fix. Owned/native controls also replace
  Reflect.apply; ordinary fields, calendars, exact rounding and locale extension
  resolution remain covered. New helper controls distinguish NaN, signed zero,
  duplicate values, missing values and sparse slots.
  AST comparison verifies all classified array calls were replaced and all 55
  remaining direct string searches in the inspected scope are unchanged. String
  searches, other list methods/iterators and cross-realm behavior remain open.
  No new formal spec-line traces or complete public methods are claimed here;
  ISO date regulation and its remaining callers retain their open status.
  The locale-entry type guard is resolved by the companion input audit below.
  All 109 gates and five package assemblies pass: regression/helper checks and
  typechecks, all 40 Temporal class Test262 backend gates, native Hermes,
  Rust/kernel/ICU controls, locale profiles and Intl consumer/accepted-failure
  gates. Exclusions and accepted-failure baselines are unchanged.

- Locale-list input conversion now accepts undetectable host objects through
  IsObject and preserves string-hint coercion and abrupt completions. Shared
  ToObject retains the original Object constructor; primitive boxing and object
  identity no longer depend on global replacement. Locale-list length uses one
  Get/ToNumber followed by captured truncation/clamping and a pure NaN check.
  Invalid entries and null input use intrinsic TypeError.
  Nine regressions failed before these fixes; focused tests/typechecks, the
  76-case getCanonicalLocales Test262 run (zero failures) and native Hermes
  package conformance pass. Native controls exercise ordinary input cases;
  real undetectable host values are checked with V8's engine test object.
  [Companion ECMA-402 audit](temporal-locale-list-audit.md) maps lines 54, 55 and
  62 individually. These are outside the 14 Temporal files, so the Temporal
  count remains 171. Brand selection is addressed in the next pass below;
  parser/canonicalization internals, list allocation and full caller algorithms
  remain open. The search inventory now has 75 active calls because the typeof
  whitelist is replaced by IsObject, with all remaining source links refreshed.
  All 111 gates pass: new host/coercion regressions and typechecks, all 40
  Temporal class Test262 backend gates, native Hermes, Rust/kernel/ICU controls,
  locale profiles, getCanonicalLocales Test262 and Intl consumer/baseline gates.
  Temporal, DateTimeFormat, DurationFormat, getCanonicalLocales, locale matcher
  and Locale package assemblies pass. Exclusions/baselines are unchanged.

- Locale brand queries now use captured native access or registered private
  WeakMap readers, avoiding mutable global/prototype reads, call methods and
  iterators. Installers connect private brands; independent bundles exchange
  leaf readers without registry cycles and retain earlier native/polyfill values.
  Thirteen failing regressions now pass, including five bundle/load-order cases.
  [Companion audit](temporal-locale-list-audit.md) traces ECMA-402 lines 51, 63
  and 64 individually; six companion lines are now traced. Temporal stays at
  171 new source-line traces. Trusted initialization and completed registered
  instances bound this proof; Locale constructor production, unregistered brands,
  realms and complete callers remain open. All 114 selected gates pass after
  removing ten stale Locale Test262 baseline entries and rechecking that gate;
  raw Locale improves to 378/380 with constructor-realm failures retained.
  getCanonicalLocales is 76/76. Both native package conformance modes and all
  six public package assemblies pass. No exclusions added; Temporal's documented
  Intl data discrepancies remain visible in the accepted-failure gates.

- ToTemporalTimeRecord field reading, `plaintime.html` lines 733–758.
  Implementation: `timeFields` in [plain-time.ts](../../packages/temporal/plain-time.ts).
  Source comments map each Get, undefined guard, integer conversion and supplied
  flag to its numbered line. Private indexed lists fix the alphabetical order;
  coercion finishes before the next Get and propagates the exact abrupt value.
  A supplied zero counts; all six undefined Gets finish before TypeError and
  before overflow options. Complete conversion defaults missing fields to zero;
  with() retains receiver values through its existing fused merge.
  New public Node and installed native Hermes controls cover all six fields,
  inherited values, number hints, no HasProperty/enumeration, every getter and
  coercion failure position, and option suppression after failure.
  No runtime defect was found in this loop. The separate
  [spec issue log](temporal-spec-issues.md) records the producer's `~unset~`
  versus with()'s `undefined` tests, confirmed in upstream source. Initialization,
  returned-record representation and caller merge clauses stay open. This pass
  adds 26 independent substeps, bringing new Temporal traces to 197; no complete
  public operation is signed off. Nine focused gates pass: 25 Node time tests
  including 12 new cases (with all getter/coercion failure positions), source/test
  typechecks, installed native Hermes and all five PlainTime Test262 backend
  gates. Existing ICU controls still check 25,269 fields, 7,740 rounds and
  2,934 differences. No exclusions or accepted-failure baselines changed.

- String unit shorthand no longer reads mutable Object.assign in five round()
  methods and Duration.total(). `unitOptions` in
  [rounding.ts](../../packages/temporal/rounding.ts) allocates a fresh ordinary
  null-prototype record through the retained Object.create, then stores one own
  data property. Internal literal keys and primitive strings introduce no
  coercion callbacks; ordinary creation/assignment gives writable, enumerable,
  configurable data properties without prototype setters. Object-form options
  retain their ordinary Get semantics.
  Individual callsite comments map string selection, value retention, null
  allocation and property creation. Newly traced: duration.html 395–398 and
  468–471; plaindatetime.html 495–498; plaintime.html 265–268; zoneddatetime.html
  626–629. Instant 186–189 is reverified from the inherited trace inventory;
  its other inherited caller steps retain their pending status. This adds 20
  new Temporal source lines, bringing this goal's count to 217.
  All six public mutation cases failed before the fix; six inherited-option
  getter/setter cases are passing negative controls. Installed native Hermes
  exercises all six methods with both mutations combined. Other option parsing,
  validation, object copies, host/provider Object.assign calls and realms remain
  open. No complete public method is signed off. All 114 selected gates and
  six public package assemblies pass, including all 40 Temporal class backend
  gates, source/test typechecks, installed native Hermes, Rust/kernel checks,
  locale profiles and Intl consumers. Existing Intl data discrepancies remain
  visible in the accepted-failure gates. Exclusions and baselines are unchanged.

- Remaining host and formatter Object.assign copies are removed: six fresh
  null-prototype literal/spread records and four captured own data-property
  writes. Slot copies also bypass inherited setters; the internal descriptor's
  null prototype avoids inherited get/set hooks. Public option/source Gets
  retain their semantics. The [copy inventory](temporal-record-copy-audit.md)
  maps all ten original sites to current code and records the proof boundary.
  Ten new regressions reproduced before the fix: host/legacy adapters, eager/lazy
  skeletons, owned formatter branches, a slot setter and public cold construction.
  Helper controls cover mutable definition, descriptor getters, symbols, zero
  and prototype-sensitive names. No new formal Temporal traces are claimed;
  the count stays 217. Complete callers and other record operations remain open.
  All 122 selected gates and six package assemblies pass across the expanded
  matrix and an unchanged isolated Rust oracle rerun. The parallel run passed
  121 gates; the oracle hit existing 300s/5s limits, then passed all 42 tests
  alone. No timeout limits widened. Native DateTimeFormat package conformance
  passes 355 tests / 806 assertions per source/bytecode mode with ten existing
  skips and zero failures. Intl discrepancies remain visible; no exclusions or
  failure baselines changed.

- Exact clock differences now have nine independent substep traces:
  `plaintime.html` 529–537 in [TS difference](../../packages/temporal/plain-time.ts#L306)
  and [Rust PlainTime::until](../../crates/temporal/time.rs#L207).
  The scalar encoding is linear in all six fields, so subtracting encoded
  clocks equals composing their component differences, including mixed borrows.
  Each clock lies in [0, 86400000000000) nanoseconds; the difference's magnitude
  is strictly below one day. BigInt/i128 subtraction is exact, and every native
  input integer fits below 2**47, preserving one-nanosecond transport precision.
  TimeDurationFromComponents arithmetic/return lines 1327–1331 and 1333 in
  duration.html are traced to the time-only terms of
  [TS durationNanoseconds](../../packages/temporal/duration-core.ts#L79)
  and [Rust Duration::time_nanoseconds](../../crates/temporal/duration.rs#L138). Their weighted sum expands the specified
  successive 60/60/1000/1000/1000 fold. Optional days are a separate term.
  The caller-bound assertion at 1332 and complete caller algorithms remain open.
  Shared Node/Rust clock vectors check exact nanoseconds, all ten result fields,
  both operand orders, since/until, every largest time unit, mixed borrows,
  endpoints and positive zero. Public Node/native controls reject public clock
  getter/coercion reads and check both duration-boundary signs, including a
  one-nanosecond overflow after composing all six fields. No arithmetic defect
  was found; this adds 15 source lines, bringing new Temporal traces to 232.
  Input conversion, option/settings ordering, rounding/decomposition callers,
  allocation and realms retain their separate open status. Twelve focused gates
  pass: 27 Node clock tests, 112 tests in the Duration-owning instant target,
  source/test typechecks, 55 Rust tests, installed native Hermes and all five
  PlainTime Test262 backend gates. Temporal package assembly passes. Existing
  ICU clock controls still cover 25,269 fields, 7,740 rounds and 2,934 differences.
  No exclusions or failure baselines changed.

- Normal unit matching no longer reads String.prototype.endsWith or slice.
  Private indexed singular/plural pairs cover every normal table name; exact
  matching returns the canonical unit after one string conversion. Sixteen
  regressions reproduced both hooks separately across eight public paths.
  Controls retain all twenty spellings, unknown-name rejection, string hints
  and abrupt completions; native Hermes covers the same eight paths.
  The [unit audit](temporal-unit-option-audit.md) records the table comparison
  and all 24 runtime callsites. Abstractops lines 549 and 559 gain independent
  traces; total new Temporal traces rise to 234. Auto/default handling, GetOption,
  group validation, remaining string methods, realms and complete callers stay
  open. The source search inventory now has 74 calls, since matching no longer
  needs its former arrayIncludes query. All 114 selected gates and six public
  package assemblies pass, including all 40 Temporal class backend gates,
  source/test typechecks, native Hermes, Rust/kernel checks and Intl consumers.
  Existing Intl data discrepancies remain visible; exclusions and failure
  baselines are unchanged.

- Rounding-increment validation: `abstractops.html` lines 430–437 and 722.
  Strict time-unit limits, inclusive Instant day divisors and all ten maximum
  duration increment rows match the pinned specification. Source comments map
  the distributed TS/Rust validators; the [increment audit](temporal-rounding-increment-audit.md)
  records the positive-integer contract and table evidence. No runtime change.
  Thirty-four new Node cases, one Rust matrix and native Hermes controls pass;
  22 focused/unit/typecheck/Test262 targets pass, including cached backend gates.
  The inherited increment coercion trace is rechecked without new trace credit.
  Nine new Temporal traces bring this audit's total to 243. Full callers, option
  ordering beyond these controls, other table columns and realm requirements stay open.

- Fractional-second formatting: `abstractops.html` lines 762–770.
  The [fractional formatting audit](temporal-fractional-format-audit.md) maps
  [format-digits.ts](../../packages/temporal/format-digits.ts), which now shares the
  bounded decimal prefix/trim operation among Instant, PlainTime and Duration.
  Captured primitive conversion and indexed string access replace mutable
  String, padStart, slice and replace calls in these three formatting paths.
  Eleven public mutation regressions failed before the fix; a twelfth control
  already passed. Six fraction vectors compare all eleven precision choices
  against an independent JS implementation, covering 198 serializations.
  Native Hermes repeats mutation and precision controls; Rust implementations
  retain their equivalent integer digit trimming/truncation algorithms.
  All 72 Temporal matrix targets pass, including all 40 class/backend gates;
  three additional ICU string-oracle/typecheck targets and package assembly pass.
  Nine new traces bring the audit total to 252. Parsing, other formatting
  methods, surrounding callers and realm requirements stay open.

Published layers: [MonthCode grammar](https://github.com/formatjs/formatjs/pull/8060),
[relativeTo slots](https://github.com/formatjs/formatjs/pull/8061),
[calendar-total bounds](https://github.com/formatjs/formatjs/pull/8063),
[short-date option order](https://github.com/formatjs/formatjs/pull/8064),
[date/date-time option order](https://github.com/formatjs/formatjs/pull/8065),
[calendar-string bounds](https://github.com/formatjs/formatjs/pull/8066),
[intrinsic object allocation](https://github.com/formatjs/formatjs/pull/8067),
[internal property reads](https://github.com/formatjs/formatjs/pull/8068),
[primitive coercion intrinsics](https://github.com/formatjs/formatjs/pull/8069),
[host-exotic objects](https://github.com/formatjs/formatjs/pull/8070),
[provider host objects](https://github.com/formatjs/formatjs/pull/8071),
[exact rounding audit](https://github.com/formatjs/formatjs/pull/8072),
[captured numeric floor](https://github.com/formatjs/formatjs/pull/8073),
[numeric intrinsics and ISO reverse conversion](https://github.com/formatjs/formatjs/pull/8074),
[intrinsic exceptions and integer coercion](https://github.com/formatjs/formatjs/pull/8075),
[private-list predicates](https://github.com/formatjs/formatjs/pull/8076),
[zoned string option order and range audit](https://github.com/formatjs/formatjs/pull/8077),
[private defaults and constructor order](https://github.com/formatjs/formatjs/pull/8080),
[chronological comparison audit](https://github.com/formatjs/formatjs/pull/8081),
[private clock lists and regulation audit](https://github.com/formatjs/formatjs/pull/8082),
[private list search intrinsics](https://github.com/formatjs/formatjs/pull/8083),
[locale-list input coercion](https://github.com/formatjs/formatjs/pull/8084),
[private Locale brand readers](https://github.com/formatjs/formatjs/pull/8085),
[time-record field conversion audit](https://github.com/formatjs/formatjs/pull/8086),
[string unit option records](https://github.com/formatjs/formatjs/pull/8087),
[private formatter record copies](https://github.com/formatjs/formatjs/pull/8088),
[exact clock difference audit](https://github.com/formatjs/formatjs/pull/8089),
[private unit-name matching](https://github.com/formatjs/formatjs/pull/8090),
[rounding-increment validation audit](https://github.com/formatjs/formatjs/pull/8091),
[intrinsic fractional formatting](https://github.com/formatjs/formatjs/pull/8092),
[private parsed fraction padding](https://github.com/formatjs/formatjs/pull/8093),
[UTC-offset grammar and operation audit](https://github.com/formatjs/formatjs/pull/8094),
[shared UTC date arithmetic audit](https://github.com/formatjs/formatjs/pull/8095),
[primitive numeric timestamp clipping](https://github.com/formatjs/formatjs/pull/8096),
[shared primitive conversion contracts](https://github.com/formatjs/formatjs/pull/8097),
[intrinsic constructor instance checks](https://github.com/formatjs/formatjs/pull/8098),
[timestamp build integration repair](https://github.com/formatjs/formatjs/pull/8099),
[primitive Number conversion and duration integrality](https://github.com/formatjs/formatjs/pull/8100),
[foundation array/object/equality contracts](https://github.com/formatjs/formatjs/pull/8101).

New traces: 252 source lines. The six existing RoundNumberToIncrementAsIfPositive
traces are reverified here; other baseline traces retain their linked PR status.
Ledger integrity checked across all 14 pinned spec files: every numbered line is
indexed, counts match the table, and traced/open sets are disjoint.

Pinned revision: [`b038883fe9c6aa871ccab3238c90daf9eb5e9b17`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec). This is a navigation index, not a conformance report. Each clause links to its source, including prose, grammar, tables, and nested clauses. Numbered lines include notes and editorial redlines; do not treat their count as a count of normative requirements.

“Traced” means this pass compared that line and placed a line-specific implementation comment. “Open” means not individually signed off here, even when tests pass or an earlier comment cites a group of steps. Typed Rust paths do not implement JS coercion. Review host policy and engine-only requirements separately.

Standards-policy inconsistencies are recorded in [spec issues](temporal-spec-issues.md);
external test/data conflicts are recorded in [conformance discrepancies](temporal-conformance-discrepancies.md).
No unambiguous new algorithm defect is claimed; the MakeDay witness ambiguity
is documented separately and its dependent lines stay open.

Implementation: [Now, Instant and option reads](https://github.com/formatjs/formatjs/pull/8055/files); [Duration.compare, TypeScript and Rust](https://github.com/formatjs/formatjs/pull/8056/files). The `Now` and Date bridge review uses some grouped comments, so those lines are not automatically marked traced here.

Time conversion stack, bottom to top: [plain dates and internal clock conversion](https://github.com/formatjs/formatjs/pull/8057/files), then [zoned clock conversion and property access](https://github.com/formatjs/formatjs/pull/8058/files). Coverage of a caller does not imply coverage of all calendar or time-zone algorithms it invokes.

| Spec file                                                                                                                          | Numbered source lines | Individually traced here | Not individually signed off |
| ---------------------------------------------------------------------------------------------------------------------------------- | --------------------: | -----------------------: | --------------------------: |
| [abstractops](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html)       |                   441 |                       83 |                         358 |
| [calendar](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html)             |                   219 |                       12 |                         207 |
| [duration](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html)             |                   702 |                       56 |                         646 |
| [instant](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html)               |                   157 |                       51 |                         106 |
| [intl](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html)                     |                   736 |                        0 |                         736 |
| [mainadditions](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html)   |                   160 |                       13 |                         147 |
| [plaindate](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html)           |                   272 |                       41 |                         231 |
| [plaindatetime](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html)   |                   315 |                       24 |                         291 |
| [plainmonthday](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html)   |                   103 |                        6 |                          97 |
| [plaintime](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html)           |                   285 |                       75 |                         210 |
| [plainyearmonth](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html) |                   183 |                        6 |                         177 |
| [temporal](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html)             |                    29 |                        0 |                          29 |
| [timezone](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html)             |                   132 |                       16 |                         116 |
| [zoneddatetime](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html)   |                   487 |                       43 |                         444 |

## `abstractops`

- [`sec-temporal-abstract-ops`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L4)
- [`sec-isodatetoepochdays`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L7)
  - Open: [20–23](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L20-L23).
- [`sec-epochdaystoepochms`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L28)
  - Open: [40](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L40).
- [`sec-date-equations`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L45)
- [`sec-checkisodaysrange`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L111)
  - Open: [122–123](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L122-L123).
- [`sec-temporal-units`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L132)
- [`sec-temporal-gettemporaloverflowoption`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L253)
  - Open: [264–266](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L264-L266).
- [`sec-temporal-gettemporaldisambiguationoption`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L270)
  - Open: [281–285](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L281-L285).
- [`sec-temporal-negateroundingmode`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L289)
  - Traced: [300–304](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L300-L304).
- [`sec-temporal-gettemporaloffsetoption`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L308)
  - Open: [320–328](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L320-L328).
- [`sec-temporal-gettemporalshowcalendarnameoption`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L332)
  - Open: [346–350](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L346-L350).
- [`sec-temporal-gettemporalshowtimezonenameoption`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L354)
  - Open: [369–372](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L369-L372).
- [`sec-temporal-gettemporalshowoffsetoption`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L376)
  - Open: [391–393](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L391-L393).
- [`sec-temporal-getdirectionoption`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L397)
  - Open: [408–410](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L408-L410).
- [`sec-validatetemporalroundingincrement`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L414)
  - Traced: [430–437](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L430-L437).
- [`sec-temporal-gettemporalfractionalseconddigitsoption`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L441)
  - Traced: [452–460](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L452-L460).
- [`sec-temporal-tosecondsstringprecisionrecord`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L464)
  - Open: [480](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L480), [485](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L485), [490](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L490), [495](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L495), [500](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L500), [505–506](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L505-L506), [511](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L511), [516](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L516), [521](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L521), [526–527](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L526-L527).
- [`sec-temporal-gettemporalunitvaluedoption`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L535)
  - Traced: [549](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L549), [559](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L559).
  - Open: [550–558](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L550-L558).
- [`sec-temporal-validatetemporalunitvaluedoption`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L563)
  - Open: [576–581](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L576-L581).
- [`sec-temporal-gettemporalrelativetooption`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L585)
  - Traced: [607–613](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L607-L613).
  - Open: [602–606](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L602-L606), [614–655](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L614-L655).
- [`sec-temporal-largeroftwotemporalunits`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L659)
  - Open: [671–674](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L671-L674).
- [`sec-temporal-iscalendarunit`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L678)
  - Open: [689–692](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L689-L692).
- [`sec-temporal-temporalunitcategory`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L696)
  - Open: [707](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L707).
- [`sec-temporal-maximumtemporaldurationroundingincrement`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L711)
  - Traced: [722](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L722).
- [`sec-temporal-ispartialtemporalobject`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L726)
  - Open: [737–743](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L737-L743).
- [`sec-temporal-formatfractionalseconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L747)
  - Traced: [762–770](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L762-L770).
- [`sec-temporal-formattimestring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L774)
  - Open: [795–801](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L795-L801).
- [`sec-getunsignedroundingmode`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L807)
  - Traced: [819](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L819).
- [`sec-applyunsignedroundingmode`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L918)
  - Traced: [932–947](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L932-L947).
- [`sec-temporal-roundnumbertoincrement`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L951)
  - Traced: [964–975](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L964-L975).
- [`sec-temporal-roundnumbertoincrementasifpositive`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L979)
  - Traced: [996–1001](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L996-L1001).
- [`sec-temporal-iso8601grammar`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1005)
- [`sec-temporal-iso8601grammar-static-semantics-isvalidmonthday`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1299)
  - Open: [1311–1313](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1311-L1313).
- [`sec-temporal-iso8601grammar-static-semantics-isvaliddate`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1317)
  - Open: [1325–1328](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1325-L1328).
- [`sec-temporal-iso8601grammar-static-semantics-early-errors`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1332)
- [`sec-temporal-iso-string-time-zone-parse-records`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1377)
- [`sec-temporal-time-zone-identifier-parse-records`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1413)
- [`sec-temporal-iso-date-time-parse-records`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1443)
- [`sec-temporal-parseisodatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1504)
  - Open: [1516–1594](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1516-L1594).
- [`sec-temporal-parsetemporalcalendarstring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1605)
  - Traced: [1619](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1619).
  - Open: [1620–1626](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1620-L1626).
- [`sec-temporal-parsetemporaldurationstring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1630)
  - Open: [1643–1730](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1643-L1730).
- [`sec-temporal-parsetemporaltimezonestring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1734)
  - Open: [1757–1764](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1757-L1764).
- [`sec-topositiveintegerwithtruncation`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1768)
  - Traced: [1779–1781](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1779-L1781).
- [`sec-tointegerwithtruncation`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1785)
  - Traced: [1796–1798](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1796-L1798).
- [`sec-temporal-tooffsetstring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1802)
  - Open: [1816–1819](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1816-L1819).
- [`sec-temporal-isodatetofields`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1823)
  - Open: [1836–1843](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1836-L1843).
- [`sec-temporal-getdifferencesettings`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1847)
  - Open: [1863–1883](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L1863-L1883).

## `calendar`

- [`sec-temporal-calendars`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L4)
- [`sec-calendar-types`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L7)
- [`sec-temporal-canonicalizecalendar`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L20)
  - Open: [31–33](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L31-L33).
- [`sec-availablecalendars`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L37)
- [`sec-temporal-month-codes`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L46)
- [`sec-temporal-parsemonthcode`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L68)
  - Traced: [83–85](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L83-L85).
  - Open: [86–92](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L86-L92).
- [`sec-temporal-createmonthcode`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L102)
  - Open: [117–121](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L117-L121).
- [`sec-temporal-calendar-abstract-ops`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L126)
- [`sec-temporal-calendar-date-records`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L129)
- [`sec-temporal-calendar-fields-records`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L255)
- [`sec-temporal-preparecalendarfields`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L440)
  - Open: [460–495](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L460-L495).
- [`sec-temporal-calendarfieldkeyspresent`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L499)
  - Open: [510–515](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L510-L515).
- [`sec-temporal-calendarmergefields`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L519)
  - Open: [532–544](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L532-L544).
- [`sec-temporal-nonisodateadd`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L548)
- [`sec-temporal-calendardateadd`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L566)
  - Open: [583–591](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L583-L591).
- [`sec-temporal-nonisodateuntil`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L595)
- [`sec-temporal-calendardateuntil`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L613)
  - Open: [630–658](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L630-L658).
- [`sec-temporal-totemporalcalendaridentifier`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L662)
  - Traced: [675–678](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L675-L678).
- [`sec-temporal-gettemporalcalendarslotvaluewithisodefault`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L682)
  - Traced: [696–700](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L696-L700).
- [`sec-temporal-calendardatefromfields`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L704)
  - Open: [717–720](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L717-L720).
- [`sec-temporal-calendaryearmonthfromfields`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L724)
  - Open: [737–741](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L737-L741).
- [`sec-temporal-calendarmonthdayfromfields`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L745)
  - Open: [758–761](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L758-L761).
- [`sec-temporal-formatcalendarannotation`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L768)
  - Open: [783–786](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L783-L786).
- [`sec-temporal-calendarequals`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L790)
  - Open: [802–803](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L802-L803).
- [`sec-temporal-isodaysinmonth`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L807)
  - Open: [819–822](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L819-L822).
- [`sec-temporal-isoweekofyear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L826)
  - Open: [837–862](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L837-L862).
- [`sec-temporal-isodayofyear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L868)
  - Open: [879–880](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L879-L880).
- [`sec-temporal-isodayofweek`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L884)
  - Open: [895–898](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L895-L898).
- [`sec-temporal-nonisocalendardatetoiso`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L902)
- [`sec-temporal-calendardatetoiso`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L928)
  - Open: [945–948](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L945-L948).
- [`sec-temporal-nonisomonthdaytoisoreferencedate`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L952)
- [`sec-temporal-calendarmonthdaytoisoreferencedate`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L989)
  - Open: [1006–1012](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L1006-L1012).
- [`sec-temporal-nonisocalendarisotodate`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L1022)
- [`sec-temporal-calendarisotodate`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L1038)
  - Open: [1050–1052](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L1050-L1052), [1068](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L1068).
- [`sec-temporal-calendarextrafields`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L1075)
  - Open: [1087–1088](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L1087-L1088).
- [`sec-temporal-nonisofieldkeystoignore`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L1092)
- [`sec-temporal-calendarfieldkeystoignore`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L1156)
  - Open: [1171–1179](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L1171-L1179).
- [`sec-temporal-nonisoresolvefields`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L1183)
- [`sec-temporal-calendarresolvefields`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L1227)
  - Open: [1242–1259](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/calendar.html#L1242-L1259).

## `duration`

- [`sec-temporal-duration-objects`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L4)
- [`sec-temporal-duration-constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L15)
- [`sec-temporal.duration`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L33)
  - Open: [37–48](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L37-L48).
- [`sec-properties-of-the-temporal-duration-constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L53)
- [`sec-temporal.duration.prototype`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L61)
- [`sec-temporal.duration.from`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L73)
  - Open: [77](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L77).
- [`sec-temporal.duration.compare`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L81)
  - Traced: [85–114](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L85-L114).
- [`sec-properties-of-the-temporal-duration-prototype-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L119)
- [`sec-temporal.duration.prototype.constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L129)
- [`sec-temporal.duration.prototype-%symbol.tostringtag%`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L134)
- [`sec-get-temporal.duration.prototype.years`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L140)
  - Open: [147–149](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L147-L149).
- [`sec-get-temporal.duration.prototype.months`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L153)
  - Open: [160–162](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L160-L162).
- [`sec-get-temporal.duration.prototype.weeks`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L166)
  - Open: [173–175](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L173-L175).
- [`sec-get-temporal.duration.prototype.days`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L179)
  - Open: [186–188](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L186-L188).
- [`sec-get-temporal.duration.prototype.hours`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L192)
  - Open: [199–201](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L199-L201).
- [`sec-get-temporal.duration.prototype.minutes`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L205)
  - Open: [212–214](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L212-L214).
- [`sec-get-temporal.duration.prototype.seconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L218)
  - Open: [225–227](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L225-L227).
- [`sec-get-temporal.duration.prototype.milliseconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L231)
  - Open: [238–240](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L238-L240).
- [`sec-get-temporal.duration.prototype.microseconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L244)
  - Open: [251–253](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L251-L253).
- [`sec-get-temporal.duration.prototype.nanoseconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L257)
  - Open: [264–266](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L264-L266).
- [`sec-get-temporal.duration.prototype.sign`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L270)
  - Open: [277–279](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L277-L279).
- [`sec-get-temporal.duration.prototype.blank`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L283)
  - Open: [290–293](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L290-L293).
- [`sec-temporal.duration.prototype.with`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L297)
  - Open: [301–344](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L301-L344).
- [`sec-temporal.duration.prototype.negated`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L348)
  - Open: [352–354](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L352-L354).
- [`sec-temporal.duration.prototype.abs`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L358)
  - Open: [362–364](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L362-L364).
- [`sec-temporal.duration.prototype.add`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L368)
  - Open: [372–374](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L372-L374).
- [`sec-temporal.duration.prototype.subtract`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L378)
  - Open: [382–384](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L382-L384).
- [`sec-temporal.duration.prototype.round`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L388)
  - Traced: [395–398](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L395-L398).
  - Open: [392–394](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L392-L394), [399–457](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L399-L457).
- [`sec-temporal.duration.prototype.total`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L461)
  - Traced: [468–471](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L468-L471).
  - Open: [465–467](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L465-L467), [472–501](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L472-L501).
- [`sec-temporal.duration.prototype.tostring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L505)
  - Open: [509–527](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L509-L527).
- [`sec-temporal.duration.prototype.tojson`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L531)
  - Open: [535–537](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L535-L537).
- [`sec-temporal.duration.prototype.tolocalestring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L541)
  - Open: [549–551](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L549-L551).
- [`sec-temporal.duration.prototype.valueof`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L555)
  - Open: [559](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L559).
- [`sec-properties-of-temporal-duration-instances`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L571)
- [`sec-temporal-duration-abstract-ops`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L686)
- [`sec-temporal-date-duration-records`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L689)
- [`sec-temporal-partial-duration-records`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L735)
- [`sec-temporal-internal-duration-records`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L823)
- [`sec-temporal-zerodateduration`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L862)
  - Open: [869](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L869).
- [`sec-temporal-tointernaldurationrecord`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L873)
  - Open: [884–886](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L884-L886).
- [`sec-temporal-tointernaldurationrecordwith24hourdays`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L890)
  - Open: [901–904](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L901-L904).
- [`sec-temporal-todatedurationrecordwithouttime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L908)
  - Open: [919–921](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L919-L921).
- [`sec-temporal-temporaldurationfrominternal`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L925)
  - Open: [943–997](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L943-L997).
- [`sec-temporal-createdatedurationrecord`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1001)
  - Open: [1015–1016](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1015-L1016).
- [`sec-temporal-adjustdatedurationrecord`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1025)
  - Open: [1039–1041](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1039-L1041).
- [`sec-temporal-combinedateandtimeduration`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1045)
  - Open: [1057–1060](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1057-L1060).
- [`sec-temporal-totemporalduration`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1067)
  - Open: [1078–1095](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1078-L1095).
- [`sec-durationsign`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1099)
  - Open: [1110–1113](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1110-L1113).
- [`sec-temporal-datedurationsign`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1117)
  - Open: [1128–1131](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1128-L1131).
- [`sec-temporal-internaldurationsign`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1135)
  - Open: [1146–1148](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1146-L1148).
- [`sec-isvalidduration`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1152)
  - Open: [1172–1187](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1172-L1187).
- [`sec-temporal-defaulttemporallargestunit`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1191)
  - Open: [1202–1211](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1202-L1211).
- [`sec-temporal-totemporalpartialdurationrecord`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1215)
  - Open: [1226–1250](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1226-L1250).
- [`sec-temporal-createtemporalduration`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1254)
  - Open: [1275–1288](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1275-L1288).
- [`sec-temporal-createnegatedtemporalduration`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1292)
  - Open: [1303](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1303).
- [`sec-temporal-timedurationfromcomponents`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1307)
  - Traced: [1327–1331](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1327-L1331), [1333](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1333).
  - Open: [1332](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1332).
- [`sec-temporal-addtimeduration`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1337)
  - Open: [1349–1351](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1349-L1351).
- [`sec-temporal-add24hourdaystonormalizedtimeduration`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1355)
  - Traced: [1370–1372](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1370-L1372).
- [`sec-temporal-addtimedurationtoepochnanoseconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1376)
  - Open: [1391](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1391).
- [`sec-temporal-comparetimeduration`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1395)
  - Open: [1407–1409](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1407-L1409).
- [`sec-temporal-timedurationfromepochnanosecondsdifference`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1413)
  - Open: [1425–1427](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1425-L1427).
- [`sec-temporal-roundtimedurationtoincrement`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1431)
  - Open: [1444–1446](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1444-L1446).
- [`sec-temporal-timedurationsign`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1450)
  - Open: [1461–1463](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1461-L1463).
- [`sec-temporal-datedurationdays`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1467)
  - Traced: [1479–1485](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1479-L1485).
- [`sec-temporal-roundtimeduration`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1489)
  - Open: [1505–1506](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1505-L1506).
- [`sec-temporal-totaltimeduration`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1510)
  - Open: [1522–1524](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1522-L1524).
- [`sec-temporal-duration-nudge-result-records`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1528)
- [`sec-temporal-computenudgewindow`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1564)
  - Traced: [1631](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1631).
  - Open: [1585–1630](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1585-L1630), [1632–1639](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1632-L1639).
- [`sec-temporal-nudgetocalendarunit`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1643)
  - Open: [1665–1705](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1665-L1705).
- [`sec-temporal-nudgetozonedtime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1709)
  - Open: [1729–1751](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1729-L1751).
- [`sec-temporal-nudgetodayortime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1755)
  - Open: [1773–1790](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1773-L1790).
- [`sec-temporal-bubblerelativeduration`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1794)
  - Open: [1814–1845](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1814-L1845).
- [`sec-temporal-roundrelativeduration`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1849)
  - Open: [1871–1886](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1871-L1886).
- [`sec-temporal-totalrelativeduration`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1890)
  - Traced: [1908](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1908).
  - Open: [1907](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1907), [1909–1912](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1909-L1912).
- [`sec-temporal-temporaldurationtostring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1916)
  - Open: [1928–1954](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1928-L1954).
- [`sec-temporal-adddurations`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1958)
  - Open: [1974–1984](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/duration.html#L1974-L1984).

## `instant`

- [`sec-temporal-instant-objects`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L4)
- [`sec-temporal-instant-constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L8)
- [`sec-temporal.instant`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L26)
  - Open: [30–33](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L30-L33).
- [`sec-properties-of-the-temporal-instant-constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L38)
- [`sec-temporal.instant.prototype`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L43)
- [`sec-temporal.instant.from`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L49)
  - Open: [53](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L53).
- [`sec-temporal.instant.fromepochmilliseconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L57)
  - Open: [61–65](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L61-L65).
- [`sec-temporal.instant.fromepochnanoseconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L69)
  - Open: [73–75](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L73-L75).
- [`sec-temporal.instant.compare`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L79)
  - Traced: [85](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L85).
  - Open: [83–84](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L83-L84).
- [`sec-properties-of-the-temporal-instant-prototype-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L90)
- [`sec-temporal.instant.prototype.constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L100)
- [`sec-temporal.instant.prototype-%symbol.tostringtag%`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L105)
- [`sec-get-temporal.instant.prototype.epochmilliseconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L111)
  - Open: [118–122](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L118-L122).
- [`sec-get-temporal.instant.prototype.epochnanoseconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L126)
  - Open: [133–135](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L133-L135).
- [`sec-temporal.instant.prototype.add`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L139)
  - Open: [143–145](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L143-L145).
- [`sec-temporal.instant.prototype.subtract`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L149)
  - Open: [153–155](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L153-L155).
- [`sec-temporal.instant.prototype.until`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L159)
  - Open: [163–165](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L163-L165).
- [`sec-temporal.instant.prototype.since`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L169)
  - Open: [173–175](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L173-L175).
- [`sec-temporal.instant.prototype.round`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L179)
  - Traced: [183–212](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L183-L212).
- [`sec-temporal.instant.prototype.equals`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L216)
  - Open: [220–224](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L220-L224).
- [`sec-temporal.instant.prototype.tostring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L228)
  - Traced: [232–247](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L232-L247).
- [`sec-temporal.instant.prototype.tolocalestring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L251)
  - Open: [260–262](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L260-L262).
- [`sec-temporal.instant.prototype.tojson`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L266)
  - Open: [270–272](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L270-L272).
- [`sec-temporal.instant.prototype.valueof`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L276)
  - Open: [280](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L280).
- [`sec-temporal.instant.prototype.tozoneddatetimeiso`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L291)
  - Open: [295–298](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L295-L298).
- [`sec-properties-of-temporal-instant-instances`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L303)
- [`sec-temporal-instant-range`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L339)
- [`sec-temporal-instant-abstract-ops`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L355)
- [`sec-temporal-isvalidepochnanoseconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L358)
  - Traced: [369](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L369).
- [`sec-temporal-createtemporalinstant`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L373)
  - Open: [385–389](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L385-L389).
- [`sec-temporal-totemporalinstant`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L393)
  - Open: [404–419](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L404-L419).
- [`sec-temporal-compareepochnanoseconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L423)
  - Traced: [435–437](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L435-L437).
- [`sec-temporal-addinstant`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L441)
  - Open: [453–455](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L453-L455).
- [`sec-temporal-differenceinstant`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L459)
  - Open: [474–476](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L474-L476).
- [`sec-temporal-roundtemporalinstant`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L480)
  - Open: [494–496](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L494-L496).
- [`sec-temporal-temporalinstanttostring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L500)
  - Open: [513–523](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L513-L523).
- [`sec-temporal-differencetemporalinstant`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L527)
  - Open: [541–547](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L541-L547).
- [`sec-temporal-adddurationtoinstant`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L551)
  - Open: [564–570](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L564-L570).

## `intl`

- [`sec-temporal-intl`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L4)
- [`sup-case-sensitivity-and-case-mapping`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L16)
- [`sec-calendar-types-deleted`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L36)
- [`sec-availablecalendars-deleted`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L41)
- [`sec-ecma402-abstract-operations`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L53)
- [`sec-getoption-deleted`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L65)
  - Open: [82–92](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L82-L92).
- [`sec-getunsignedroundingmode-deleted`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L205)
  - Open: [219](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L219).
- [`sec-applyunsignedroundingmode-deleted`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L319)
  - Open: [335–350](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L335-L350).
- [`sec-intl-datetimeformat-constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L356)
- [`sec-createdatetimeformat`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L361)
  - Open: [379–514](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L379-L514).
- [`sec-properties-of-intl-datetimeformat-constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L519)
- [`sec-intl.datetimeformat-internal-slots`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L524)
- [`sec-datetimeformat-abstracts`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L572)
- [`sec-getdatetimeformat`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L577)
  - Open: [593–642](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L593-L642).
- [`sec-adjustdatetimestyleformat`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L646)
  - Open: [664–677](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L664-L677).
- [`sec-datetime-format-functions`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L682)
  - Open: [689–695](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L689-L695).
- [`sec-formatdatetimepattern`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L701)
  - Open: [716–800](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L716-L800).
- [`sec-partitiondatetimepattern`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L804)
  - Open: [816–828](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L816-L828).
- [`sec-formatdatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L832)
  - Open: [842–846](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L842-L846).
- [`sec-formatdatetimetoparts`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L850)
  - Open: [860–869](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L860-L869).
- [`sec-partitiondatetimerangepattern`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L873)
  - Open: [886–958](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L886-L958).
- [`sec-formatdatetimerange`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L962)
  - Open: [973–977](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L973-L977).
- [`sec-formatdatetimerangetoparts`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L981)
  - Open: [992–1002](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L992-L1002).
- [`sec-todatetimeformattable`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1008)
  - Open: [1019–1020](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1019-L1020).
- [`sec-temporal-istemporalobject`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1024)
  - Open: [1035–1037](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1035-L1037).
- [`sec-temporal-sametemporaltype`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1041)
  - Open: [1053–1061](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1053-L1061).
- [`sec-datetimeformat-value-format-records`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1065)
- [`sec-temporal-handledatetimetemporaldate`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1095)
  - Open: [1107–1112](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1107-L1112).
- [`sec-temporal-handledatetimetemporalyearmonth`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1120)
  - Open: [1132–1137](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1132-L1137).
- [`sec-temporal-handledatetimetemporalmonthday`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1145)
  - Open: [1157–1162](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1157-L1162).
- [`sec-temporal-handledatetimetemporaltime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1170)
  - Open: [1182–1187](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1182-L1187).
- [`sec-temporal-handledatetimetemporaldatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1195)
  - Open: [1207–1210](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1207-L1210).
- [`sec-temporal-handledatetimetemporalinstant`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1218)
  - Open: [1230–1231](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1230-L1231).
- [`sec-temporal-handledatetimeothers`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1239)
  - Open: [1251–1255](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1251-L1255).
- [`sec-temporal-handledatetimevalue`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1263)
  - Open: [1275–1283](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1275-L1283).
- [`sec-tolocaltime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1288)
  - Open: [1303–1312](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1303-L1312).
- [`sec-properties-of-intl-datetimeformat-prototype-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1328)
- [`sec-Intl.DateTimeFormat.prototype.formatToParts`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1331)
  - Open: [1337–1343](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1337-L1343).
- [`sec-intl.datetimeformat.prototype.formatRange`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1347)
  - Open: [1353–1358](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1353-L1358).
- [`sec-Intl.DateTimeFormat.prototype.formatRangeToParts`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1362)
  - Open: [1368–1373](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1368-L1373).
- [`sec-properties-of-intl-datetimeformat-instances`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1378)
- [`sec-ecma402-intl-durationformat-abstracts`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1406)
- [`sec-duration-records-deleted`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1415)
- [`sec-tointegerifintegral-deleted`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1492)
  - Open: [1505–1507](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1505-L1507).
- [`sec-todurationrecord-deleted`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1514)
  - Open: [1526–1553](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1526-L1553).
- [`sec-durationsign-deleted`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1560)
  - Open: [1573–1576](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1573-L1576).
- [`sec-isvalidduration-deleted`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1583)
  - Open: [1605–1620](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1605-L1620).
- [`sec-computefractionaldigits`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1625)
  - Open: [1638–1648](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1638-L1648).
- [`sec-formatnumericunits`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1652)
  - Open: [1667–1708](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1667-L1708).
- [`sec-partitiondurationformatpattern`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1712)
  - Open: [1725–1772](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1725-L1772).
- [`sec-ecma402-properties-of-intl-durationformat-prototype-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1777)
- [`sec-Intl.DurationFormat.prototype.format`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1780)
  - Open: [1786–1793](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1786-L1793).
- [`sec-Intl.DurationFormat.prototype.formatToParts`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1797)
  - Open: [1803–1816](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1803-L1816).
- [`locale-sensitive-functions`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1821)
- [`sup-properties-of-the-temporal-duration-prototype-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1826)
- [`sup-temporal.duration.prototype.tolocalestring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1829)
  - Open: [1834–1841](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1834-L1841).
- [`sup-properties-of-the-temporal-instant-prototype-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1846)
- [`sup-temporal.instant.prototype.tolocalestring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1849)
  - Open: [1854–1857](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1854-L1857).
- [`sup-properties-of-the-temporal-plaindate-prototype-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1862)
- [`sup-temporal.plaindate.prototype.tolocalestring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1865)
  - Open: [1870–1873](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1870-L1873).
- [`sup-properties-of-the-temporal-plaindatetime-prototype-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1878)
- [`sup-temporal.plaindatetime.prototype.tolocalestring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1881)
  - Open: [1886–1889](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1886-L1889).
- [`sup-properties-of-the-temporal-plainmonthday-prototype-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1894)
- [`sup-temporal.plainmonthday.prototype.tolocalestring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1897)
  - Open: [1902–1905](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1902-L1905).
- [`sup-properties-of-the-temporal-plaintime-prototype-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1910)
- [`sup-temporal.plaintime.prototype.tolocalestring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1913)
  - Open: [1918–1921](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1918-L1921).
- [`sup-properties-of-the-temporal-plainyearmonth-prototype-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1926)
- [`sup-temporal.plainyearmonth.prototype.tolocalestring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1929)
  - Open: [1934–1937](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1934-L1937).
- [`sup-properties-of-the-temporal-zoneddatetime-prototype-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1942)
- [`sup-temporal.zoneddatetime.prototype.tolocalestring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1945)
  - Open: [1950–1955](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/intl.html#L1950-L1955).

## `mainadditions`

- [`sec-temporal-legacy-date-objects`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L4)
- [`sec-ecmascript-language-types-string-type`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L15)
- [`sec-object-type`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L31)
- [`sec-well-known-intrinsic-objects`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L34)
- [`sec-year-week-record-specification-type`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L57)
- [`sec-mathematical-operations`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L89)
- [`sec-ecma262-abstract-operations`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L99)
- [`sec-ecma262-type-conversion`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L102)
- [`sec-tointegerifintegral`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L111)
  - Open: [122–124](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L122-L124).
- [`sec-operations-for-reading-options`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L134)
- [`sec-getoption`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L139)
  - Open: [154–164](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L154-L164).
- [`sec-temporal-getroundingmodeoption`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L168)
  - Traced: [180–183](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L180-L183).
- [`sec-temporal-getroundingincrementoption`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L306)
  - Traced: [319–323](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L319-L323).
- [`sec-overview-of-date-objects-and-definitions-of-abstract-operations`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L330)
- [`sec-getutcepochnanoseconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L335)
  - Traced: [356–359](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L356-L359).
  - Open: [355](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L355).
- [`sec-time-zone-identifiers`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L363)
- [`sec-getnamedtimezoneepochnanoseconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L401)
  - Open: [430–432](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L430-L432).
- [`sec-systemtimezoneidentifier`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L441)
  - Open: [451–453](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L451-L453).
- [`sec-time-zone-offset-strings`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L465)
- [`sec-localtime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L491)
  - Open: [505–512](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L505-L512).
- [`sec-utc-t`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L526)
  - Open: [540–557](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L540-L557).
- [`sec-timestring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L584)
  - Open: [593–597](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L593-L597).
- [`sec-timezoneestring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L603)
  - Open: [612–632](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L612-L632).
- [`sec-isoffsettimezoneidentifier`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L636)
  - Open: [656–658](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L656-L658).
- [`sec-parsedatetimeutcoffset`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L662)
  - Open: [685–715](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L685-L715).
- [`sec-temporal-date-constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L720)
- [`sec-temporal-date`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L723)
  - Open: [727–760](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L727-L760).
- [`sec-temporal-properties-of-the-date-constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L765)
- [`sec-temporal-date.now`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L768)
  - Open: [776](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L776).
- [`sec-temporal-properties-of-the-legacy-date-prototype-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L782)
- [`sec-date.prototype.totemporalinstant`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L787)
  - Open: [791–795](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L791-L795).

## `plaindate`

- [`sec-temporal-plaindate-objects`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L4)
- [`sec-temporal-plaindate-constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L12)
- [`sec-temporal.plaindate`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L30)
  - Open: [34–43](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L34-L43).
- [`sec-properties-of-the-temporal-plaindate-constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L48)
- [`sec-temporal.plaindate.prototype`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L56)
- [`sec-temporal.plaindate.from`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L62)
  - Open: [66](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L66).
- [`sec-temporal.plaindate.compare`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L70)
  - Traced: [76](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L76).
  - Open: [74–75](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L74-L75).
- [`sec-properties-of-the-temporal-plaindate-prototype-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L81)
- [`sec-temporal.plaindate.prototype.constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L95)
- [`sec-temporal.plaindate.prototype-%symbol.tostringtag%`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L100)
- [`sec-get-temporal.plaindate.prototype.calendarid`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L106)
  - Open: [113–115](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L113-L115).
- [`sec-get-temporal.plaindate.prototype.era`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L119)
  - Open: [126–128](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L126-L128).
- [`sec-get-temporal.plaindate.prototype.erayear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L132)
  - Open: [139–143](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L139-L143).
- [`sec-get-temporal.plaindate.prototype.year`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L147)
  - Open: [154–156](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L154-L156).
- [`sec-get-temporal.plaindate.prototype.month`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L160)
  - Open: [167–169](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L167-L169).
- [`sec-get-temporal.plaindate.prototype.monthcode`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L173)
  - Open: [180–182](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L180-L182).
- [`sec-get-temporal.plaindate.prototype.day`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L186)
  - Open: [193–195](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L193-L195).
- [`sec-get-temporal.plaindate.prototype.dayofweek`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L199)
  - Open: [206–208](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L206-L208).
- [`sec-get-temporal.plaindate.prototype.dayofyear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L212)
  - Open: [219–221](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L219-L221).
- [`sec-get-temporal.plaindate.prototype.weekofyear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L225)
  - Open: [232–236](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L232-L236).
- [`sec-get-temporal.plaindate.prototype.yearofweek`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L240)
  - Open: [247–251](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L247-L251).
- [`sec-get-temporal.plaindate.prototype.daysinweek`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L255)
  - Open: [262–264](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L262-L264).
- [`sec-get-temporal.plaindate.prototype.daysinmonth`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L268)
  - Open: [275–277](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L275-L277).
- [`sec-get-temporal.plaindate.prototype.daysinyear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L281)
  - Open: [288–290](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L288-L290).
- [`sec-get-temporal.plaindate.prototype.monthsinyear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L294)
  - Open: [301–303](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L301-L303).
- [`sec-get-temporal.plaindate.prototype.inleapyear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L307)
  - Open: [314–316](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L314-L316).
- [`sec-temporal.plaindate.prototype.toplainyearmonth`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L320)
  - Open: [324–330](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L324-L330).
- [`sec-temporal.plaindate.prototype.toplainmonthday`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L334)
  - Open: [338–344](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L338-L344).
- [`sec-temporal.plaindate.prototype.add`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L348)
  - Open: [352–354](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L352-L354).
- [`sec-temporal.plaindate.prototype.subtract`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L358)
  - Open: [362–364](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L362-L364).
- [`sec-temporal.plaindate.prototype.with`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L368)
  - Open: [372–382](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L372-L382).
- [`sec-temporal.plaindate.prototype.withcalendar`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L386)
  - Open: [390–393](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L390-L393).
- [`sec-temporal.plaindate.prototype.until`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L397)
  - Open: [401–403](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L401-L403).
- [`sec-temporal.plaindate.prototype.since`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L407)
  - Open: [411–413](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L411-L413).
- [`sec-temporal.plaindate.prototype.equals`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L417)
  - Open: [421–425](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L421-L425).
- [`sec-temporal.plaindate.prototype.toplaindatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L429)
  - Traced: [433–437](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L433-L437).
- [`sec-temporal.plaindate.prototype.tozoneddatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L441)
  - Traced: [445–465](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L445-L465).
- [`sec-temporal.plaindate.prototype.tostring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L469)
  - Open: [473–477](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L473-L477).
- [`sec-temporal.plaindate.prototype.tolocalestring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L481)
  - Open: [490–492](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L490-L492).
- [`sec-temporal.plaindate.prototype.tojson`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L496)
  - Open: [500–502](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L500-L502).
- [`sec-temporal.plaindate.prototype.valueof`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L506)
  - Open: [510](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L510).
- [`sec-properties-of-temporal-plaindate-instances`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L522)
- [`sec-temporal-plaindate-abstract-ops`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L566)
- [`sec-temporal-iso-date-records`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L569)
- [`sec-temporal-create-iso-date-record`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L609)
  - Open: [622–623](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L622-L623).
- [`sec-temporal-createtemporaldate`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L627)
  - Open: [640–645](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L640-L645).
- [`sec-temporal-totemporaldate`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L649)
  - Traced: [683–688](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L683-L688).
  - Open: [661–682](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L661-L682), [689–690](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L689-L690).
- [`sec-temporal-comparesurpasses`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L694)
  - Open: [711–722](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L711-L722).
- [`sec-temporal-isodatesurpasses`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L726)
  - Open: [747–759](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L747-L759).
- [`sec-temporal-regulateisodate`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L766)
  - Open: [784–791](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L784-L791).
- [`sec-temporal-isvalidisodate`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L795)
  - Open: [811–813](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L811-L813).
- [`sec-temporal-adddaystoisodate`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L817)
  - Open: [832–834](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L832-L834).
- [`sec-temporal-padisoyear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L838)
  - Open: [849–852](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L849-L852).
- [`sec-temporal-temporaldatetostring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L856)
  - Open: [868–872](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L868-L872).
- [`sec-temporal-isodatewithinlimits`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L876)
  - Traced: [890](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L890).
  - Open: [891](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L891).
- [`sec-temporal-compareisodate`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L895)
  - Traced: [909–915](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L909-L915).
- [`sec-temporal-differencetemporalplaindate`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L919)
  - Open: [933–949](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L933-L949).
- [`sec-temporal-adddurationtodate`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L953)
  - Open: [967–974](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindate.html#L967-L974).

## `plaindatetime`

- [`sec-temporal-plaindatetime-objects`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L4)
- [`sec-temporal-plaindatetime-constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L8)
- [`sec-temporal.plaindatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L26)
  - Open: [30–48](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L30-L48).
- [`sec-properties-of-the-temporal-plaindatetime-constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L53)
- [`sec-temporal.plaindatetime.prototype`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L58)
- [`sec-temporal.plaindatetime.from`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L64)
  - Open: [68](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L68).
- [`sec-temporal.plaindatetime.compare`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L72)
  - Traced: [78](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L78).
  - Open: [76–77](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L76-L77).
- [`sec-properties-of-the-temporal-plaindatetime-prototype-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L83)
- [`sec-temporal.plaindatetime.prototype.constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L98)
- [`sec-temporal.plaindatetime.prototype-%symbol.tostringtag%`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L103)
- [`sec-get-temporal.plaindatetime.prototype.calendarid`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L109)
  - Open: [116–118](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L116-L118).
- [`sec-get-temporal.plaindatetime.prototype.era`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L122)
  - Open: [129–131](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L129-L131).
- [`sec-get-temporal.plaindatetime.prototype.erayear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L135)
  - Open: [142–146](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L142-L146).
- [`sec-get-temporal.plaindatetime.prototype.year`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L150)
  - Open: [157–159](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L157-L159).
- [`sec-get-temporal.plaindatetime.prototype.month`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L163)
  - Open: [170–172](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L170-L172).
- [`sec-get-temporal.plaindatetime.prototype.monthcode`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L176)
  - Open: [183–185](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L183-L185).
- [`sec-get-temporal.plaindatetime.prototype.day`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L189)
  - Open: [196–198](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L196-L198).
- [`sec-get-temporal.plaindatetime.prototype.hour`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L202)
  - Open: [209–211](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L209-L211).
- [`sec-get-temporal.plaindatetime.prototype.minute`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L215)
  - Open: [222–224](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L222-L224).
- [`sec-get-temporal.plaindatetime.prototype.second`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L228)
  - Open: [235–237](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L235-L237).
- [`sec-get-temporal.plaindatetime.prototype.millisecond`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L241)
  - Open: [248–250](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L248-L250).
- [`sec-get-temporal.plaindatetime.prototype.microsecond`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L254)
  - Open: [261–263](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L261-L263).
- [`sec-get-temporal.plaindatetime.prototype.nanosecond`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L267)
  - Open: [274–276](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L274-L276).
- [`sec-get-temporal.plaindatetime.prototype.dayofweek`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L280)
  - Open: [287–289](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L287-L289).
- [`sec-get-temporal.plaindatetime.prototype.dayofyear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L293)
  - Open: [300–302](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L300-L302).
- [`sec-get-temporal.plaindatetime.prototype.weekofyear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L306)
  - Open: [313–317](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L313-L317).
- [`sec-get-temporal.plaindatetime.prototype.yearofweek`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L321)
  - Open: [328–332](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L328-L332).
- [`sec-get-temporal.plaindatetime.prototype.daysinweek`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L336)
  - Open: [343–345](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L343-L345).
- [`sec-get-temporal.plaindatetime.prototype.daysinmonth`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L349)
  - Open: [356–358](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L356-L358).
- [`sec-get-temporal.plaindatetime.prototype.daysinyear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L362)
  - Open: [369–371](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L369-L371).
- [`sec-get-temporal.plaindatetime.prototype.monthsinyear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L375)
  - Open: [382–384](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L382-L384).
- [`sec-get-temporal.plaindatetime.prototype.inleapyear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L388)
  - Open: [395–397](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L395-L397).
- [`sec-temporal.plaindatetime.prototype.with`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L401)
  - Open: [405–421](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L405-L421).
- [`sec-temporal.plaindatetime.prototype.withplaintime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L425)
  - Traced: [429–433](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L429-L433).
- [`sec-temporal.plaindatetime.prototype.withcalendar`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L437)
  - Open: [441–444](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L441-L444).
- [`sec-temporal.plaindatetime.prototype.add`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L448)
  - Open: [452–454](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L452-L454).
- [`sec-temporal.plaindatetime.prototype.subtract`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L458)
  - Open: [462–464](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L462-L464).
- [`sec-temporal.plaindatetime.prototype.until`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L468)
  - Open: [472–474](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L472-L474).
- [`sec-temporal.plaindatetime.prototype.since`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L478)
  - Open: [482–484](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L482-L484).
- [`sec-temporal.plaindatetime.prototype.round`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L488)
  - Traced: [495–498](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L495-L498).
  - Open: [492–494](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L492-L494), [499–517](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L499-L517).
- [`sec-temporal.plaindatetime.prototype.equals`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L521)
  - Open: [525–529](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L525-L529).
- [`sec-temporal.plaindatetime.prototype.tostring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L533)
  - Open: [537–550](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L537-L550).
- [`sec-temporal.plaindatetime.prototype.tolocalestring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L554)
  - Open: [563–565](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L563-L565).
- [`sec-temporal.plaindatetime.prototype.tojson`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L569)
  - Open: [573–575](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L573-L575).
- [`sec-temporal.plaindatetime.prototype.valueof`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L579)
  - Open: [583](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L583).
- [`sec-temporal.plaindatetime.prototype.tozoneddatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L594)
  - Open: [598–604](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L598-L604).
- [`sec-temporal.plaindatetime.prototype.toplaindate`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L608)
  - Open: [612–614](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L612-L614).
- [`sec-temporal.plaindatetime.prototype.toplaintime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L618)
  - Open: [622–624](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L622-L624).
- [`sec-properties-of-temporal-plaindatetime-instances`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L629)
- [`sec-temporal-plaindatetime-abstract-ops`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L673)
- [`sec-temporal-iso-date-time-records`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L676)
- [`sec-temporal-timevaluetoisodatetimerecord`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L707)
  - Open: [720–722](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L720-L722).
- [`sec-temporal-combineisodateandtimerecord`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L726)
  - Open: [740–741](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L740-L741).
- [`sec-temporal-isodatetimewithinlimits`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L745)
  - Traced: [762](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L762).
  - Traced: [764–766](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L764-L766).
  - Open: [763](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L763).
- [`sec-temporal-interprettemporaldatetimefields`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L770)
  - Open: [783–785](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L783-L785).
- [`sec-temporal-totemporaldatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L789)
  - Traced: [824–830](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L824-L830).
  - Open: [801–823](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L801-L823), [831–833](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L831-L833).
- [`sec-temporal-balanceisodatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L837)
  - Open: [856–858](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L856-L858).
- [`sec-temporal-createtemporaldatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L862)
  - Open: [875–880](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L875-L880).
- [`sec-temporal-isodatetimetostring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L884)
  - Open: [898–904](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L898-L904).
- [`sec-temporal-compareisodatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L908)
  - Traced: [920–922](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L920-L922).
- [`sec-temporal-roundisodatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L926)
  - Open: [940–943](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L940-L943).
- [`sec-temporal-differenceisodatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L947)
  - Open: [964–978](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L964-L978).
- [`sec-temporal-differenceplaindatetimewithrounding`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L982)
  - Open: [999–1005](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L999-L1005).
- [`sec-temporal-differenceplaindatetimewithtotal`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L1009)
  - Open: [1023–1029](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L1023-L1029).
- [`sec-temporal-differencetemporalplaindatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L1033)
  - Open: [1047–1055](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L1047-L1055).
- [`sec-temporal-adddurationtodatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L1059)
  - Open: [1073–1082](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L1073-L1082).

## `plainmonthday`

- [`sec-temporal-plainmonthday-objects`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L4)
- [`sec-temporal-plainmonthday-constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L8)
- [`sec-temporal.plainmonthday`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L26)
  - Open: [30–41](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L30-L41).
- [`sec-properties-of-the-temporal-plainmonthday-constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L46)
- [`sec-temporal.plainmonthday.prototype`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L51)
- [`sec-temporal.plainmonthday.from`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L57)
  - Open: [61](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L61).
- [`sec-properties-of-the-temporal-plainmonthday-prototype-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L66)
- [`sec-temporal.plainmonthday.prototype.constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L80)
- [`sec-temporal.plainmonthday.prototype-%symbol.tostringtag%`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L85)
- [`sec-get-temporal.plainmonthday.prototype.calendarid`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L91)
  - Open: [98–100](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L98-L100).
- [`sec-get-temporal.plainmonthday.prototype.monthcode`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L104)
  - Open: [111–113](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L111-L113).
- [`sec-get-temporal.plainmonthday.prototype.day`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L117)
  - Open: [124–126](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L124-L126).
- [`sec-temporal.plainmonthday.prototype.with`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L130)
  - Open: [134–144](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L134-L144).
- [`sec-temporal.plainmonthday.prototype.equals`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L148)
  - Open: [152–156](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L152-L156).
- [`sec-temporal.plainmonthday.prototype.tostring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L160)
  - Open: [164–168](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L164-L168).
- [`sec-temporal.plainmonthday.prototype.tolocalestring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L172)
  - Open: [181–183](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L181-L183).
- [`sec-temporal.plainmonthday.prototype.tojson`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L187)
  - Open: [191–193](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L191-L193).
- [`sec-temporal.plainmonthday.prototype.valueof`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L197)
  - Open: [201](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L201).
- [`sec-temporal.plainmonthday.prototype.toplaindate`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L212)
  - Open: [216–224](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L216-L224).
- [`sec-properties-of-temporal-plainmonthday-instances`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L229)
- [`sec-temporal-plainmonthday-abstract-ops`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L274)
- [`sec-temporal-totemporalmonthday`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L277)
  - Traced: [302–307](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L302-L307).
  - Open: [289–301](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L289-L301), [308–317](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L308-L317).
- [`sec-temporal-createtemporalmonthday`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L321)
  - Open: [334–339](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L334-L339).
- [`sec-temporal-temporalmonthdaytostring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L343)
  - Open: [355–363](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainmonthday.html#L355-L363).

## `plaintime`

- [`sec-temporal-plaintime-objects`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L4)
- [`sec-temporal-plaintime-constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L11)
- [`sec-temporal.plaintime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L29)
  - Open: [33–42](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L33-L42).
- [`sec-properties-of-the-temporal-plaintime-constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L47)
- [`sec-temporal.plaintime.prototype`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L55)
- [`sec-temporal.plaintime.from`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L61)
  - Open: [65](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L65).
- [`sec-temporal.plaintime.compare`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L69)
  - Traced: [75](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L75).
  - Open: [73–74](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L73-L74).
- [`sec-properties-of-the-temporal-plaintime-prototype-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L80)
- [`sec-temporal.plaintime.prototype.constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L90)
- [`sec-temporal.plaintime.prototype-%symbol.tostringtag%`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L95)
- [`sec-get-temporal.plaintime.prototype.hour`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L101)
  - Open: [108–110](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L108-L110).
- [`sec-get-temporal.plaintime.prototype.minute`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L114)
  - Open: [121–123](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L121-L123).
- [`sec-get-temporal.plaintime.prototype.second`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L127)
  - Open: [134–136](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L134-L136).
- [`sec-get-temporal.plaintime.prototype.millisecond`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L140)
  - Open: [147–149](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L147-L149).
- [`sec-get-temporal.plaintime.prototype.microsecond`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L153)
  - Open: [160–162](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L160-L162).
- [`sec-get-temporal.plaintime.prototype.nanosecond`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L166)
  - Open: [173–175](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L173-L175).
- [`sec-temporal.plaintime.prototype.add`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L179)
  - Open: [183–185](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L183-L185).
- [`sec-temporal.plaintime.prototype.subtract`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L189)
  - Open: [193–195](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L193-L195).
- [`sec-temporal.plaintime.prototype.with`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L199)
  - Open: [203–234](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L203-L234).
- [`sec-temporal.plaintime.prototype.until`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L238)
  - Open: [242–244](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L242-L244).
- [`sec-temporal.plaintime.prototype.since`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L248)
  - Open: [252–254](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L252-L254).
- [`sec-temporal.plaintime.prototype.round`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L258)
  - Traced: [265–268](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L265-L268).
  - Open: [262–264](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L262-L264), [269–280](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L269-L280).
- [`sec-temporal.plaintime.prototype.equals`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L284)
  - Open: [288–292](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L288-L292).
- [`sec-temporal.plaintime.prototype.tostring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L296)
  - Open: [300–311](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L300-L311).
- [`sec-temporal.plaintime.prototype.tolocalestring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L315)
  - Open: [324–326](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L324-L326).
- [`sec-temporal.plaintime.prototype.tojson`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L330)
  - Open: [334–336](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L334-L336).
- [`sec-temporal.plaintime.prototype.valueof`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L340)
  - Open: [344](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L344).
- [`sec-properties-of-temporal-plaintime-instances`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L356)
- [`sec-temporal-plaintime-abstract-ops`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L392)
- [`sec-temporal-time-records`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L395)
- [`sec-temporal-createtimerecord`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L448)
  - Open: [465–467](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L465-L467).
- [`sec-temporal-midnighttimerecord`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L479)
  - Open: [486](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L486).
- [`sec-temporal-noontimerecord`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L498)
  - Traced: [505](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L505).
- [`sec-temporal-differencetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L517)
  - Traced: [529–537](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L529-L537).
- [`sec-temporal-totemporaltime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L541)
  - Open: [553–580](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L553-L580).
- [`sec-temporal-totimerecordormidnight`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L584)
  - Traced: [595–597](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L595-L597).
- [`sec-temporal-regulatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L601)
  - Traced: [622–632](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L622-L632).
- [`sec-temporal-isvalidtime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L636)
  - Traced: [655–661](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L655-L661).
- [`sec-temporal-balancetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L665)
  - Open: [681–693](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L681-L693).
- [`sec-temporal-createtemporaltime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L697)
  - Open: [709–712](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L709-L712).
- [`sec-temporal-totemporaltimerecord`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L716)
  - Traced: [733–758](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L733-L758).
  - Open: [728–732](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L728-L732), [759](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L759).
- [`sec-temporal-timerecordtostring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L804)
  - Open: [816–817](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L816-L817).
- [`sec-temporal-comparetimerecord`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L821)
  - Traced: [833–845](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L833-L845).
- [`sec-temporal-addtime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L849)
  - Open: [861–862](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L861-L862).
- [`sec-temporal-roundtime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L866)
  - Open: [880–902](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L880-L902).
- [`sec-temporal-differencetemporalplaintime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L906)
  - Open: [920–928](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L920-L928).
- [`sec-temporal-adddurationtotime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L932)
  - Open: [945–949](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaintime.html#L945-L949).

## `plainyearmonth`

- [`sec-temporal-plainyearmonth-objects`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L4)
- [`sec-temporal-plainyearmonth-constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L8)
- [`sec-temporal.plainyearmonth`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L26)
  - Open: [30–41](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L30-L41).
- [`sec-properties-of-the-temporal-plainyearmonth-constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L46)
- [`sec-temporal.plainyearmonth.prototype`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L51)
- [`sec-temporal.plainyearmonth.from`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L57)
  - Open: [61](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L61).
- [`sec-temporal.plainyearmonth.compare`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L65)
  - Open: [69–71](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L69-L71).
- [`sec-properties-of-the-temporal-plainyearmonth-prototype-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L76)
- [`sec-temporal.plainyearmonth.prototype.constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L90)
- [`sec-temporal.plainyearmonth.prototype-%symbol.tostringtag%`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L95)
- [`sec-get-temporal.plainyearmonth.prototype.calendarid`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L101)
  - Open: [108–110](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L108-L110).
- [`sec-get-temporal.plainyearmonth.prototype.era`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L114)
  - Open: [121–123](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L121-L123).
- [`sec-get-temporal.plainyearmonth.prototype.erayear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L127)
  - Open: [134–138](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L134-L138).
- [`sec-get-temporal.plainyearmonth.prototype.year`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L142)
  - Open: [149–151](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L149-L151).
- [`sec-get-temporal.plainyearmonth.prototype.month`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L155)
  - Open: [162–164](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L162-L164).
- [`sec-get-temporal.plainyearmonth.prototype.monthcode`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L168)
  - Open: [175–177](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L175-L177).
- [`sec-get-temporal.plainyearmonth.prototype.daysinyear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L181)
  - Open: [188–190](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L188-L190).
- [`sec-get-temporal.plainyearmonth.prototype.daysinmonth`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L194)
  - Open: [201–203](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L201-L203).
- [`sec-get-temporal.plainyearmonth.prototype.monthsinyear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L207)
  - Open: [214–216](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L214-L216).
- [`sec-get-temporal.plainyearmonth.prototype.inleapyear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L220)
  - Open: [227–229](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L227-L229).
- [`sec-temporal.plainyearmonth.prototype.with`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L233)
  - Open: [237–247](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L237-L247).
- [`sec-temporal.plainyearmonth.prototype.add`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L251)
  - Open: [255–257](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L255-L257).
- [`sec-temporal.plainyearmonth.prototype.subtract`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L261)
  - Open: [265–267](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L265-L267).
- [`sec-temporal.plainyearmonth.prototype.until`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L271)
  - Open: [275–277](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L275-L277).
- [`sec-temporal.plainyearmonth.prototype.since`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L281)
  - Open: [285–287](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L285-L287).
- [`sec-temporal.plainyearmonth.prototype.equals`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L291)
  - Open: [295–299](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L295-L299).
- [`sec-temporal.plainyearmonth.prototype.tostring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L303)
  - Open: [307–311](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L307-L311).
- [`sec-temporal.plainyearmonth.prototype.tolocalestring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L315)
  - Open: [324–326](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L324-L326).
- [`sec-temporal.plainyearmonth.prototype.tojson`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L330)
  - Open: [334–336](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L334-L336).
- [`sec-temporal.plainyearmonth.prototype.valueof`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L340)
  - Open: [344](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L344).
- [`sec-temporal.plainyearmonth.prototype.toplaindate`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L355)
  - Open: [359–367](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L359-L367).
- [`sec-properties-of-temporal-plainyearmonth-instances`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L372)
- [`sec-temporal-plainyearmonth-abstract-ops`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L417)
- [`sec-temporal-iso-year-month-records`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L420)
- [`sec-temporal-totemporalyearmonth`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L449)
  - Traced: [474–479](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L474-L479).
  - Open: [461–473](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L461-L473), [480–485](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L480-L485).
- [`sec-temporal-isoyearmonthwithinlimits`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L489)
  - Open: [500–503](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L500-L503).
- [`sec-temporal-balanceisoyearmonth`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L513)
  - Open: [525–527](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L525-L527).
- [`sec-temporal-createtemporalyearmonth`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L534)
  - Open: [547–552](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L547-L552).
- [`sec-temporal-temporalyearmonthtostring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L556)
  - Open: [568–576](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L568-L576).
- [`sec-temporal-differencetemporalplainyearmonth`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L580)
  - Open: [594–617](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L594-L617).
- [`sec-temporal-adddurationtoyearmonth`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L621)
  - Open: [635–649](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plainyearmonth.html#L635-L649).

## `temporal`

- [`sec-temporal-objects`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L4)
- [`sec-value-properties-of-the-temporal-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L17)
- [`sec-temporal-%symbol.tostringtag%`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L20)
- [`sec-constructor-properties-of-the-temporal-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L27)
- [`sec-temporal-instant`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L30)
- [`sec-temporal-plaindatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L35)
- [`sec-temporal-plaindate`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L40)
- [`sec-temporal-plaintime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L45)
- [`sec-temporal-plainyearmonth`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L50)
- [`sec-temporal-plainmonthday`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L55)
- [`sec-temporal-duration`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L60)
- [`sec-temporal-zoneddatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L65)
- [`sec-other-properties-of-the-temporal-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L71)
- [`sec-temporal-now`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L74)
- [`sec-temporal-now-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L81)
- [`sec-value-properties-of-the-temporal-now-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L92)
- [`sec-temporal-now-%symbol.tostringtag%`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L95)
- [`sec-function-properties-of-the-temporal-now-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L102)
- [`sec-temporal.now.timezoneid`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L105)
  - Open: [109](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L109).
- [`sec-temporal.now.instant`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L113)
  - Open: [117–118](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L117-L118).
- [`sec-temporal.now.plaindatetimeiso`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L122)
  - Open: [126–127](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L126-L127).
- [`sec-temporal.now.zoneddatetimeiso`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L131)
  - Open: [135–140](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L135-L140).
- [`sec-temporal.now.plaindateiso`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L144)
  - Open: [148–149](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L148-L149).
- [`sec-temporal.now.plaintimeiso`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L153)
  - Open: [157–158](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L157-L158).
- [`sec-temporal-now-abstract-ops`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L163)
- [`sec-hostsystemutcepochnanoseconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L166)
  - Open: [192–193](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L192-L193).
- [`sec-temporal-systemutcepochmilliseconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L198)
  - Open: [205–207](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L205-L207).
- [`sec-temporal-systemutcepochnanoseconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L211)
  - Open: [218–220](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L218-L220).
- [`sec-temporal-systemdatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L224)
  - Open: [235–240](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/temporal.html#L235-L240).

## `timezone`

- [`sec-temporal-timezones`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L4)
- [`sec-temporal-timezone-abstract-ops`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L7)
- [`sec-getavailablenamedtimezoneidentifier`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L23)
  - Open: [37–39](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L37-L39).
- [`sec-temporal-getisopartsfromepoch`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L51)
  - Traced: [62–77](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L62-L77).
- [`sec-temporal-getnamedtimezonenexttransition`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L81)
  - Open: [102–103](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L102-L103).
- [`sec-temporal-getnamedtimezoneprevioustransition`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L107)
  - Open: [128–129](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L128-L129).
- [`sec-temporal-formatoffsettimezoneidentifier`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L133)
  - Open: [149–154](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L149-L154).
- [`sec-temporal-formatutcoffsetnanoseconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L158)
  - Open: [172–180](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L172-L180).
- [`sec-temporal-formatdatetimeutcoffsetrounded`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L184)
  - Open: [195–197](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L195-L197).
- [`sec-temporal-totemporaltimezoneidentifier`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L201)
  - Open: [212–220](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L212-L220).
- [`sec-temporal-getoffsetnanosecondsfor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L224)
  - Open: [238–240](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L238-L240).
- [`sec-temporal-getisodatetimefor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L244)
  - Open: [256–258](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L256-L258).
- [`sec-temporal-getepochnanosecondsfor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L262)
  - Open: [275–276](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L275-L276).
- [`sec-temporal-disambiguatepossibleepochnanoseconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L280)
  - Open: [294–329](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L294-L329).
- [`sec-temporal-getpossibleepochnanoseconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L333)
  - Open: [347–357](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L347-L357).
- [`sec-temporal-getstartofday`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L361)
  - Open: [373–379](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L373-L379).
- [`sec-temporal-timezoneequals`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L383)
  - Open: [395–403](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L395-L403).
- [`sec-parsetimezoneidentifier`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L407)
  - Open: [420–430](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/timezone.html#L420-L430).

## `zoneddatetime`

- [`sec-temporal-zoneddatetime-objects`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L4)
- [`sec-temporal-zoneddatetime-constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L8)
- [`sec-temporal.zoneddatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L26)
  - Traced: [30–33](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L30-L33).
  - Open: [34–44](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L34-L44).
- [`sec-properties-of-the-temporal-zoneddatetime-constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L49)
- [`sec-temporal.zoneddatetime.prototype`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L54)
- [`sec-temporal.zoneddatetime.from`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L60)
  - Open: [64](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L64).
- [`sec-temporal.zoneddatetime.compare`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L68)
  - Traced: [74](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L74).
  - Open: [72–73](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L72-L73).
- [`sec-properties-of-the-temporal-zoneddatetime-prototype-object`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L79)
- [`sec-temporal.zoneddatetime.prototype.constructor`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L93)
- [`sec-temporal.zoneddatetime.prototype-%symbol.tostringtag%`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L98)
- [`sec-get-temporal.zoneddatetime.prototype.calendarid`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L104)
  - Open: [111–113](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L111-L113).
- [`sec-get-temporal.zoneddatetime.prototype.timezoneid`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L117)
  - Open: [124–126](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L124-L126).
- [`sec-get-temporal.zoneddatetime.prototype.era`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L130)
  - Open: [137–140](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L137-L140).
- [`sec-get-temporal.zoneddatetime.prototype.erayear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L144)
  - Open: [151–156](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L151-L156).
- [`sec-get-temporal.zoneddatetime.prototype.year`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L160)
  - Open: [167–170](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L167-L170).
- [`sec-get-temporal.zoneddatetime.prototype.month`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L174)
  - Open: [181–184](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L181-L184).
- [`sec-get-temporal.zoneddatetime.prototype.monthcode`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L188)
  - Open: [195–198](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L195-L198).
- [`sec-get-temporal.zoneddatetime.prototype.day`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L202)
  - Open: [209–212](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L209-L212).
- [`sec-get-temporal.zoneddatetime.prototype.hour`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L216)
  - Open: [223–226](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L223-L226).
- [`sec-get-temporal.zoneddatetime.prototype.minute`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L230)
  - Open: [237–240](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L237-L240).
- [`sec-get-temporal.zoneddatetime.prototype.second`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L244)
  - Open: [251–254](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L251-L254).
- [`sec-get-temporal.zoneddatetime.prototype.millisecond`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L258)
  - Open: [265–268](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L265-L268).
- [`sec-get-temporal.zoneddatetime.prototype.microsecond`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L272)
  - Open: [279–282](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L279-L282).
- [`sec-get-temporal.zoneddatetime.prototype.nanosecond`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L286)
  - Open: [293–296](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L293-L296).
- [`sec-get-temporal.zoneddatetime.prototype.epochmilliseconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L300)
  - Open: [307–311](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L307-L311).
- [`sec-get-temporal.zoneddatetime.prototype.epochnanoseconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L315)
  - Open: [322–324](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L322-L324).
- [`sec-get-temporal.zoneddatetime.prototype.dayofweek`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L328)
  - Open: [335–338](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L335-L338).
- [`sec-get-temporal.zoneddatetime.prototype.dayofyear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L342)
  - Open: [349–352](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L349-L352).
- [`sec-get-temporal.zoneddatetime.prototype.weekofyear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L356)
  - Open: [363–368](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L363-L368).
- [`sec-get-temporal.zoneddatetime.prototype.yearofweek`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L372)
  - Open: [379–384](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L379-L384).
- [`sec-get-temporal.zoneddatetime.prototype.hoursinday`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L388)
  - Open: [395–404](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L395-L404).
- [`sec-get-temporal.zoneddatetime.prototype.daysinweek`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L408)
  - Open: [415–418](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L415-L418).
- [`sec-get-temporal.zoneddatetime.prototype.daysinmonth`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L422)
  - Open: [429–432](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L429-L432).
- [`sec-get-temporal.zoneddatetime.prototype.daysinyear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L436)
  - Open: [443–446](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L443-L446).
- [`sec-get-temporal.zoneddatetime.prototype.monthsinyear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L450)
  - Open: [457–460](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L457-L460).
- [`sec-get-temporal.zoneddatetime.prototype.inleapyear`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L464)
  - Open: [471–474](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L471-L474).
- [`sec-get-temporal.zoneddatetime.prototype.offsetnanoseconds`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L478)
  - Open: [485–487](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L485-L487).
- [`sec-get-temporal.zoneddatetime.prototype.offset`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L491)
  - Open: [498–501](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L498-L501).
- [`sec-temporal.zoneddatetime.prototype.with`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L505)
  - Open: [509–534](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L509-L534).
- [`sec-temporal.zoneddatetime.prototype.withplaintime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L538)
  - Traced: [542–553](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L542-L553).
- [`sec-temporal.zoneddatetime.prototype.withtimezone`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L557)
  - Open: [561–564](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L561-L564).
- [`sec-temporal.zoneddatetime.prototype.withcalendar`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L568)
  - Open: [572–575](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L572-L575).
- [`sec-temporal.zoneddatetime.prototype.add`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L579)
  - Open: [583–585](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L583-L585).
- [`sec-temporal.zoneddatetime.prototype.subtract`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L589)
  - Open: [593–595](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L593-L595).
- [`sec-temporal.zoneddatetime.prototype.until`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L599)
  - Open: [603–605](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L603-L605).
- [`sec-temporal.zoneddatetime.prototype.since`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L609)
  - Open: [613–615](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L613-L615).
- [`sec-temporal.zoneddatetime.prototype.round`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L619)
  - Traced: [626–629](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L626-L629).
  - Open: [623–625](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L623-L625), [630–666](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L630-L666).
- [`sec-temporal.zoneddatetime.prototype.equals`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L670)
  - Open: [674–679](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L674-L679).
- [`sec-temporal.zoneddatetime.prototype.tostring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L683)
  - Traced: [687–700](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L687-L700).
- [`sec-temporal.zoneddatetime.prototype.tolocalestring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L704)
  - Open: [713–715](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L713-L715).
- [`sec-temporal.zoneddatetime.prototype.tojson`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L719)
  - Open: [723–725](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L723-L725).
- [`sec-temporal.zoneddatetime.prototype.valueof`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L729)
  - Open: [733](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L733).
- [`sec-temporal.zoneddatetime.prototype.startofday`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L744)
  - Open: [748–754](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L748-L754).
- [`sec-temporal.zoneddatetime.prototype.gettimezonetransition`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L758)
  - Open: [762–780](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L762-L780).
- [`sec-temporal.zoneddatetime.prototype.toinstant`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L784)
  - Open: [788–790](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L788-L790).
- [`sec-temporal.zoneddatetime.prototype.toplaindate`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L794)
  - Open: [798–801](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L798-L801).
- [`sec-temporal.zoneddatetime.prototype.toplaintime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L805)
  - Traced: [809–812](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L809-L812).
- [`sec-temporal.zoneddatetime.prototype.toplaindatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L816)
  - Open: [820–823](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L820-L823).
- [`sec-properties-of-temporal-zoneddatetime-instances`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L828)
- [`sec-temporal-zoneddatetime-abstract-ops`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L880)
- [`sec-temporal-interpretisodatetimeoffset`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L883)
  - Open: [910–935](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L910-L935).
- [`sec-temporal-totemporalzoneddatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L939)
  - Traced: [992–995](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L992-L995).
  - Open: [953–991](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L953-L991).
  - Open: [996–1008](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L996-L1008).
- [`sec-temporal-createtemporalzoneddatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L1012)
  - Open: [1026–1032](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L1026-L1032).
- [`sec-temporal-temporalzoneddatetimetostring`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L1036)
  - Open: [1056–1075](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L1056-L1075).
- [`sec-temporal-addzoneddatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L1079)
  - Open: [1097–1103](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L1097-L1103).
- [`sec-temporal-differencezoneddatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L1107)
  - Open: [1124–1148](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L1124-L1148).
- [`sec-temporal-differencezoneddatetimewithrounding`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L1152)
  - Open: [1170–1174](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L1170-L1174).
- [`sec-temporal-differencezoneddatetimewithtotal`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L1178)
  - Open: [1193–1198](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L1193-L1198).
- [`sec-temporal-differencetemporalzoneddatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L1202)
  - Open: [1216–1231](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L1216-L1231).
- [`sec-temporal-adddurationtozoneddatetime`](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L1235)
  - Open: [1249–1257](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L1249-L1257).

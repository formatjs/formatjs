# Native Intl bridge private state and dispatch

Reviewed 2026-11-21 against published ECMA-262 dependency sections below.
Temporal API chapter authority remains pending in the main ledger. This review
covers the bridge's private storage and selected native delegation, not its
complete public methods or projection semantics.

## Reproduced gap

After package installation, replacing WeakMap.prototype.get intercepted the
installed DateTimeFormat format getter's private bound-state lookup. Private
state writes, projection-cache Map methods, lazy Map construction and mutable
Reflect.apply/construct dispatch exposed additional callbacks.

The bridge now captures those constructors, methods and invocation helpers when
its module loads. Later replacements cannot observe these private accesses.
Ordinary public option getters retain their existing behavior. Pre-import realm
modification is outside this review.

## Section and source correspondence

All source links refer to the current bridge implementation.

| Published section                                                                                                                                              | Source correspondence                                                                                                                                                                                                                                                                                                                                                                                                                                        | Review boundary                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [§6.1.7.2 internal slots](https://tc39.es/ecma262/#sec-object-internal-methods-and-internal-slots)                                                             | [Captured bindings](../../packages/temporal/legacy-intl.ts#L27), [private stores](../../packages/temporal/legacy-intl.ts#L64), [projection cache read](../../packages/temporal/legacy-intl.ts#L87), [write](../../packages/temporal/legacy-intl.ts#L110), [lazy cache allocation and state writes](../../packages/temporal/legacy-intl.ts#L177), [receiver lookups](../../packages/temporal/legacy-intl.ts#L186)                                             | Two WeakMaps and per-formatter Map stay private under tested post-import replacements. Other private stores and complete algorithms remain open.                                                                                                                                                |
| [§7.3.13 Call](https://tc39.es/ecma262/#sec-call), steps 1–3; [§28.1.1 Reflect.apply](https://tc39.es/ecma262/#sec-reflect.apply), steps 1–4                   | [Captured apply](../../packages/temporal/legacy-intl.ts#L27), [native constructor probe](../../packages/temporal/legacy-intl.ts#L68), [private reads](../../packages/temporal/legacy-intl.ts#L87), [fallback parts dispatch](../../packages/temporal/legacy-intl.ts#L206), [range](../../packages/temporal/legacy-intl.ts#L214), [range parts](../../packages/temporal/legacy-intl.ts#L229), [resolved options](../../packages/temporal/legacy-intl.ts#L239) | Native Reflect.apply validates callable target, creates its argument List, then delegates to Call. Dense private argument arrays preserve target, receiver and ordered argument references. Captured helper preserves abrupt completions. This is delegation, not a new Reflect implementation. |
| [§7.3.14 Construct](https://tc39.es/ecma262/#sec-construct), steps 1–3; [§28.1.2 Reflect.construct](https://tc39.es/ecma262/#sec-reflect.construct), steps 1–4 | [Captured construct](../../packages/temporal/legacy-intl.ts#L28), [native formatter construction](../../packages/temporal/legacy-intl.ts#L166)                                                                                                                                                                                                                                                                                                               | Native helper validates constructors, creates argument List and invokes Construct with the existing explicit newTarget. Original target and argument references remain unchanged. Complete wrapper construction and option-order rules remain open.                                             |

All apply sites supply explicit argument arrays, including the empty array where
needed. Native Call's missing-argument-list default therefore adds no behavior
here. Construct receives explicit arguments and newTarget; its defaults likewise
are not separately reimplemented. Existing Function.prototype.call sites, Object
reflection and other bridge operations remain open.

## Public evidence

[Packaged controls](../../packages/temporal/tests/legacy-intl-storage.test.mjs)
load the assembled package and assert that the installed DateTimeFormat differs
from the original native constructor. Native outputs captured before installation
provide text, parts, range and range-parts references.

Seven payloads cover six Temporal types: PlainDate, PlainDateTime, PlainTime,
PlainYearMonth, PlainMonthDay and Instant, including a second Instant vector at
−1 ns and +1 ns. Seven independent replacements cover WeakMap get/set, Map
get/set, Reflect.apply/construct and global Map. Cold/warm scenarios exercise
all four formatting APIs plus fresh construction: 98 controls. Each requires
zero hook calls, including calls swallowed by other code, and unchanged output.
Assertions run after restoring original property descriptors.

The initial control failed at the private bound-state read before runtime fixes.
The final strengthened 98-control test passes. Nanosecond conversion is unchanged:
BigInt division plus negative-remainder adjustment floors to integer milliseconds
before Number conversion. The ±1 ns vector checks −1 ms versus 0 ms on cache misses
and hits. Other numeric conversion obligations retain their own audit status.

## Validation and remaining scope

Three focused packaged/native-host/compiler gates pass. Native-host compatibility
covers 362 non-Temporal executions and preserves 20 existing native diagnostics;
this is regression comparison, not a claim of zero native failures.

The full 42-case pattern oracle passes from unchanged cached inputs. The expanded
matrix has 197 tests: 195 pass, two raw strict targets fail (75 executed, 122 cached).
Both failures exactly match existing ListFormat and PluralRules constructor-realm
baseline keys and messages, across 162 and 106 scenarios respectively. Their
baseline-aware gates pass. Ten package assemblies build, all 40 Temporal
class/backend gates pass, and the unchanged 12,808-case ICU snapshot passes.
After that run, only this new test was strengthened to require zero hook calls;
its focused rerun passes. Runtime and BUILD hashes remain unchanged.

No baseline, exclusion, timeout or arithmetic change. Complete bridge option
normalization, brand conversion, projection semantics, realm/bootstrap behavior,
remaining dynamic calls and existing native diagnostics remain open. No new
specification inconsistency or historical Temporal source-line credit.

## Projection cache reuse inspection

The current bridge rejects ZonedDateTime before cache lookup and checks each
value's calendar against the fixed formatter calendar before either hit or miss.
For the six accepted types, legacyDateTimeProjection's formatter selection uses
kind, fixed locale/options and resolved calendar/timezone. Its value-dependent
ZonedDateTime host-offset fallback requires localNanoseconds, which this bridge
does not supply. Thus it cannot create a timezone-name override in this path.
A cache hit retains the selected formatter, reconstructs plain from kind, and
uses the same BigInt floor-to-millisecond expression as a miss. No per-value
projection metadata is lost on these branches. The 98 packaged controls above
exercise misses/hits; this inspection establishes reuse equivalence for those
branches, not the complete projection/option-selection contract.

## Zoned locale offset cache

The public TypeScript package called replaceable collection methods on a warm
`ZonedDateTime.toLocaleString` cache. Replacing each of `Map.prototype.has`,
`Map.prototype.get` and `WeakMap.prototype.get` intercepted one private lookup.
The test now requires the same formatted output and zero hook calls.

Captured collection operations preserve lookup order and distinguish a cached
undefined offset reader from a miss. Provider selection and validation stay in
the original order. The cache is an implementation dependency of
[ECMA-402 §11.5.11 step 2.b](https://tc39.es/ecma402/#sec-tolocaltime).
[Temporal comparison §6.3.42](https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.tolocalestring)
delegates the Intl-supported method to ECMA-402.

[Captured cache operations](../../packages/temporal/legacy-zoned-date.ts#L36).
[Warm package regressions](../../packages/temporal/tests/legacy-intl-storage.test.mjs#L93).
`legacy_intl_storage_test` reproduced all three callbacks before the fix and
passes afterward. The combined eight-target run also passes.

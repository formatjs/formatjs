# Private formatter caches and numeric partition dispatch

Reviewed 2026-11-21 against published
[ECMA-262 §6.1.7.2](https://tc39.es/ecma262/#sec-object-internal-methods-and-internal-slots)
and [ECMA-402 §11.5.5 PartitionDateTimePattern](https://tc39.es/ecma402/#sec-partitiondatetimepattern).
This maps the numeric dispatch steps and protects the private WeakMap operations
on the tested formatter paths. Complete constructors, producers, Temporal brand
conversion and other private collections remain open.

## Observable gap

Replacing WeakMap.prototype.get or set after importing the polyfill could stop
DateTimeFormat during private slot access, pattern parsing or numeric rendering.
Locale reloads also consulted a replacement delete method. None of these private
implementation caches is a specified user callback in the formatting algorithm.

Public regressions traced further calls through locale matching and the
NumberFormat/PluralRules instances used to render date fields. Capturing only
DateTimeFormat's own cache methods left those constructor/renderer paths exposed.
The fixes capture the operations at each implicated store.

## Storage mapping

| Private storage                                                 | Current source                                                                                                   | Captured operations                                             |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| DateTimeFormat receiver slots                                   | [get_internal_slots.ts:13](../../packages/intl-datetimeformat/get_internal_slots.ts#L13)                         | get, set                                                        |
| Partitioned date patterns                                       | [PartitionDateTimePattern.ts:22](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimePattern.ts#L22) | get, set                                                        |
| Date-field number formatters                                    | [FormatDateTimePattern.ts:161](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L162)     | get, set                                                        |
| Parsed skeleton fields                                          | [skeleton.ts:55](../../packages/ecma402-abstract/DateTimeFormat/skeleton.ts#L55)                                 | get, set                                                        |
| Interval candidates                                             | [core.ts:478](../../packages/intl-datetimeformat/core.ts#L481)                                                   | get, set, delete                                                |
| Calendar preference records                                     | [core.ts:668](../../packages/intl-datetimeformat/core.ts#L699)                                                   | get, set                                                        |
| Explicit locale registration                                    | [registerLocaleData.ts:4](../../packages/ecma402-abstract/registerLocaleData.ts#L4)                              | get, set                                                        |
| Available-locale array snapshots                                | [ResolveLocale.ts:28](../../packages/intl-localematcher/abstract/ResolveLocale.ts#L28)                           | get, set                                                        |
| Prepared best-fit matching data                                 | [utils.ts:349](../../packages/intl-localematcher/abstract/utils.ts#L349)                                         | get, set                                                        |
| Lookup array-to-Set cache                                       | [BestAvailableLocale.ts:3](../../packages/intl-localematcher/abstract/BestAvailableLocale.ts#L3)                 | get, set                                                        |
| NumberFormat receiver slots                                     | [get_internal_slots.ts:6](../../packages/intl-numberformat/get_internal_slots.ts#L6)                             | get, set, has                                                   |
| PluralRules receiver slots                                      | [get_internal_slots.ts:7](../../packages/intl-pluralrules/get_internal_slots.ts#L7)                              | get, set                                                        |
| Raw/generated/composed number plans and nested composition maps | [number-patterns.ts:20](../../packages/ecma402-abstract/NumberFormat/number-patterns.ts#L20)                     | captured Reflect.apply, native get/set and lazy-map constructor |

These are sixteen storage families across twelve runtime files: the last row
contains three outer maps and one family of lazily allocated nested maps.
Bound methods retain the original map receiver and method. Number-plan helpers
use captured Reflect.apply with the original native get/set functions, including
maps allocated later. Their map/key/value arguments follow the existing cache
operations exactly. The nested allocator uses the captured WeakMap constructor.
Bindings retain the store, not individual keys; entries retain native weak-key
semantics.

Captures assume ordinary intrinsic functions when the modules load. This is not
a review of arbitrary pre-import realm modification. Other WeakMap stores,
Map, Set and WeakSet operations and complete locale-matching algorithms remain open.
Locale registration/reload is a FormatJS extension regression, not an additional
normative ECMA-402 operation.

## §11.5.5 step mapping

The published operation accepts a Number. The extra Temporal record branch in
HandleDateTimeValue is separate integration work and is not signed off here.

| Step                     | Source and correspondence                                                                                                                                                                                          | Status                                                                                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1: TimeClip              | [HandleDateTimeValue.ts:32](../../packages/ecma402-abstract/DateTimeFormat/HandleDateTimeValue.ts#L32)                                                                                                             | Reviewed by the [TimeClip audit](temporal-timeclip-audit.md).                                                                                                                                                                           |
| 2: NaN rejection         | [33](../../packages/ecma402-abstract/DateTimeFormat/HandleDateTimeValue.ts#L33)                                                                                                                                    | Captured RangeError constructor; comparison detects NaN without conversion.                                                                                                                                                             |
| 3: exact nanoseconds     | [36](../../packages/ecma402-abstract/DateTimeFormat/HandleDateTimeValue.ts#L36)                                                                                                                                    | Clipped integer milliseconds fit below 2**53. BigInt conversion precedes multiplication, preserving the mathematical integer.                                                                                                           |
| 4: selected format       | [35](../../packages/ecma402-abstract/DateTimeFormat/HandleDateTimeValue.ts#L35), [PartitionDateTimePattern.ts:36](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimePattern.ts#L36)                  | Numeric records retain the initialized flattened private format profile. Full constructor selection remains open.                                                                                                                       |
| 5 / 5.a: h11/h12 pattern | [InitializeDateTimeFormat.ts:550](../../packages/ecma402-abstract/DateTimeFormat/InitializeDateTimeFormat.ts#L551), [partition:38](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimePattern.ts#L38) | Pattern selection occurs during initialization and is stored at line 569. The partition helper reads that selected pattern. Constructor hour-cycle resolution remains a dependency.                                                     |
| 6 / 6.a: other pattern   | [554](../../packages/ecma402-abstract/DateTimeFormat/InitializeDateTimeFormat.ts#L555), [560](../../packages/ecma402-abstract/DateTimeFormat/InitializeDateTimeFormat.ts#L561)                                     | Other hour cycles, including the no-hour profile, select the ordinary pattern. Same initialization dependency.                                                                                                                          |
| 7: render                | [partition:39](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimePattern.ts#L39), [47](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimePattern.ts#L47)                               | Private pattern cache invokes reviewed PartitionPattern on a miss, then passes parts, epoch and profile to FormatDateTimePattern. Cache methods are captured. The [producer](temporal-date-pattern-audit.md) retains open dependencies. |
| 8: return                | [47](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimePattern.ts#L47)                                                                                                                               | Returns the producer's List directly, preserving order and completion.                                                                                                                                                                  |

The cached representation stores parsed pattern parts instead of repeatedly
passing the String to the producer. Private profile identity and the pattern
String guard cache reuse. The [parser proof](temporal-pattern-partition-audit.md)
covers the transformation. Preselecting the hour-cycle pattern is equivalent for
an initialized profile; this does not sign off every constructor option or locale
data selection rule.

## Evidence

[Public numeric controls](../../packages/intl-datetimeformat/tests/pattern-records.test.ts)
replace get/set independently, exercise cold/warm formatters and fresh
construction, and cover both best-fit and lookup matching. They check format,
formatToParts, formatRange and formatRangeToParts against fixed English output.
A separate reload control replaces get/set/delete together and reloads real
locale data. Assertions execute after restoring methods.

[Native Temporal inputs](../../packages/intl-datetimeformat/tests/temporal.test.ts)
repeat those public formatting/constructor controls with a branded PlainDate.
[Owned Temporal controls](../../packages/intl-datetimeformat/tests/temporal-owned.test.ts)
check the pure TypeScript PlainDate through formatting, parts and toLocaleString.
No calendar or renderer is mocked. Five initial controls failed before fixes;
lookup and polyfilled-number rendering exposed additional cache call sites.

[Native consumer controls](../../native/hermes/tests/datetimeformat.ts)
replace get/set/has while exercising installed APIs and the TypeScript reference.
That target's Node preflight exposed the number-pattern cache path. The final
Node/native Hermes comparison passes 9,440 cases and 40,284 assertions in each
run, including the new storage controls.

All fourteen focused runtime/compiler gates pass across two invocations
(nine executed, five cached). Current suites pass 401 DateTimeFormat cases with
three existing skips, 21 native-Temporal integration cases and 24 owned-Temporal
cases. Locale-matcher, NumberFormat and PluralRules owner units/compiler checks
also pass. Their full public algorithms retain separate review status.

## Validation and remaining scope

The full 42-case pattern replay passes in isolation (322.9 seconds). The expanded
consumer invocation passes 193/195 targets (60 executed, 135 cached) and builds
all ten Temporal/Intl package assemblies.
The inventory adds 24 leaf gates for the two newly changed dependency owners,
including raw/native PluralRules diagnostics. No corpus exclusions, baseline
acceptances or timeout limits changed.

Its raw ListFormat and newly included raw PluralRules strict diagnostics fail with
exactly their existing constructor-realm baseline cases/messages: two of 162
ListFormat scenarios and two of 106 PluralRules scenarios. Both raw results were
checked against the current baseline files. Both baseline-aware gates pass,
as does the PluralRules native control. All 40 Temporal class/backend gates pass.
The unchanged 12,808-case ICU snapshot gate passes (34.1 seconds).

This is partial dependency evidence, not full Temporal or formatter compliance.
The requested Temporal chapter source remains unresolved; historical Temporal
source-line credit is unchanged. No specification inconsistency found here.

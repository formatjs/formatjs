# Temporal formatter record-copy audit

Dependency inventory after the string-unit shorthand pass. Ten direct
Object.assign calls remained across six runtime modules: nine operation-time
copies and one Temporal bridge setup record. All ten are replaced. AST scans of
Temporal, ECMA-402 DateTimeFormat helpers and the DateTimeFormat package now find
no direct Object.assign calls outside tests. This is a classified copy inventory,
not a signoff of every object operation or complete formatter algorithm.

| Private record/write                | Code line                                                                                                          | Replacement                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Host timezone options               | [host-timezone.ts:52](../../packages/temporal/host-timezone.ts#L52)                                                | Null-prototype literal; fixed own option fields.                                      |
| Legacy zoned projection             | [legacy-zoned-date.ts:65](../../packages/temporal/legacy-zoned-date.ts#L65)                                        | Null-prototype literal/spread; copies own enumerable fields, then overrides timeZone. |
| Temporal string options (setup)     | [TemporalDateTime.ts:61](../../packages/ecma402-abstract/DateTimeFormat/TemporalDateTime.ts#L61)                   | Null-prototype literal with own calendarName.                                         |
| Best-fit pattern fields             | [BestFitFormatMatcher.ts:117](../../packages/ecma402-abstract/DateTimeFormat/BestFitFormatMatcher.ts#L117)         | Null-prototype literal/spread; partial record completed before return.                |
| Skeleton record                     | [skeleton.ts:389](../../packages/ecma402-abstract/DateTimeFormat/skeleton.ts#L389)                                 | Null-prototype literal; required pattern/range fields stay own.                       |
| Lazy interval record                | [skeleton.ts:433](../../packages/ecma402-abstract/DateTimeFormat/skeleton.ts#L433)                                 | Null-prototype literal; private patternParts list stays own.                          |
| Style-selected Temporal options     | [InitializeDateTimeFormat.ts:631](../../packages/ecma402-abstract/DateTimeFormat/InitializeDateTimeFormat.ts#L631) | Captured data-property definition.                                                    |
| Component-selected Temporal options | [InitializeDateTimeFormat.ts:646](../../packages/ecma402-abstract/DateTimeFormat/InitializeDateTimeFormat.ts#L646) | Captured data-property definition.                                                    |
| Default Temporal components         | [InitializeDateTimeFormat.ts:657](../../packages/ecma402-abstract/DateTimeFormat/InitializeDateTimeFormat.ts#L657) | Captured data-property definition.                                                    |
| Temporal format slots               | [InitializeDateTimeFormat.ts:674](../../packages/ecma402-abstract/DateTimeFormat/InitializeDateTimeFormat.ts#L674) | Captured data-property definition; bypasses inherited setters on copied slot objects. |

Fresh record literals set their prototype to null through language semantics,
without consulting Object.assign or Object.create. Literal and spread fields
create own writable, enumerable, configurable data properties. The special
prototype declaration creates no own `__proto__` field; an own enumerable source
field with that name remains data when spread. Source property reads and their
order are retained; ordinary public option Gets are unchanged.

[intrinsics.ts:62](../../packages/ecma262-abstract/intrinsics.ts#L62) captures
Object.defineProperty during trusted module setup. Its descriptor has a null
prototype, so inherited get/set properties cannot change descriptor conversion.
Four callsites use it only for private record fields. This bypasses inherited
setters, including missing fields on the ordinary object produced by copying
internal slots; capturing Object.assign alone would retain that bug. Private
records here are fresh and extensible, with ordinary configurable data fields.
This helper is not a replacement for public object Set operations.

Ten new regressions reproduced before the fix: two host adapter copies, two
eager/lazy skeleton copies, four owned Temporal formatter paths, one inherited
slot setter, and one public cold-constructor case. The helper additionally checks
captured property definition, inherited descriptor getters, zero values, symbols,
and an own `__proto__` field without changing the target's prototype. The public
cold-constructor case also runs in native Hermes package conformance; native
compatibility does not establish that Rust uses this JavaScript helper.

Validation: all 122 selected gates pass across the expanded matrix and an
unchanged isolated oracle rerun. The parallel matrix passed 121 gates; its Rust
oracle hit the existing 300-second CLDR and 5-second resolved-options test
limits. Running that complete oracle alone passes all 42 tests, including both
new skeleton cases; the previously timed-out cases take 183 seconds and 2.9
seconds. No timeouts were widened. This supports resource contention rather
than a value mismatch and preserves the original failed-run evidence.

Native Hermes DateTimeFormat package conformance passes in source and bytecode:
355 tests / 806 assertions per mode, with ten existing skips and zero failures.
All six public package assemblies pass. Existing remaining Intl data discrepancies,
exclusions and failure baselines are retained. Initialization under already
modified primordials, other private record probes/copy mechanisms, all descriptor
uses, source producers, realms and complete caller algorithms remain open.
No new Temporal numbered-line traces are claimed; this goal's count stays 217.
No specification defect is claimed by this copy fix.

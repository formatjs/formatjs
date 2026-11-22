# Temporal unit-name dependency audit

Pinned Temporal revision: `b038883fe9c6aa871ccab3238c90daf9eb5e9b17`.
This pass covers normal unit names at GetTemporalUnitValuedOption lines 549
and 559, not the full operation or any complete caller.

The Value, Singular property name and Plural property name columns of the
[pinned unit table](https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L143-L247)
were parsed with an HTML parser and compared to the implementation's AST pairs.
All ten rows match exactly, with twenty distinct spellings. The maximum-increment
column is reviewed separately in the [increment audit](temporal-rounding-increment-audit.md).
Category and length columns remain open. The implementation uses private
dense pairs and indexed strict comparisons; each accepted form returns the
first element. Neither matching nor normalization reads String.prototype methods,
array iterators or mutable array methods. Unknown strings still reject.

ToString remains one shared intrinsic conversion with the string hint. Ordinary
public option Gets and coercion hooks keep their behavior. The helper accepts a
raw property value; it does not implement the entire options-object operation.
Undefined/default handling, required-unit errors, appended auto handling,
GetOption and group validation remain open. Existing largest-unit auto policies
and the pending option-order changes in #8055 are retained; no new credit is
claimed for that unmerged PR (head rechecked: 3494da68ef2380368349e16123ce668086fd0373).

Sixteen regressions failed with the intended private string-hook error before
the fix: endsWith and slice replacement tested separately through Instant,
PlainTime, PlainDateTime, ZonedDateTime and Duration rounding, Duration.total,
PlainDate.until and PlainYearMonth.until. Controls cover all twenty spellings,
unknown/case/trailing-character/prototype-like names, one coercion and exact
abrupt-completion identity. Native Hermes checks the same eight paths under
each mutation and verifies eight string hints. Other string methods and the
full caller algorithms remain open.

All 24 runtime helper callsites are indexed below. Locations do not mean their
surrounding algorithms have been signed off.

| Module                                                                               | Calls                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [packages/temporal/duration.ts](../../packages/temporal/duration.ts)                 | [268](../../packages/temporal/duration.ts#L268), [272](../../packages/temporal/duration.ts#L272), [345](../../packages/temporal/duration.ts#L345), [374](../../packages/temporal/duration.ts#L374)                             |
| [packages/temporal/instant.ts](../../packages/temporal/instant.ts)                   | [172](../../packages/temporal/instant.ts#L172), [175](../../packages/temporal/instant.ts#L175), [315](../../packages/temporal/instant.ts#L315)                                                                                 |
| [packages/temporal/plain-date-time.ts](../../packages/temporal/plain-date-time.ts)   | [281](../../packages/temporal/plain-date-time.ts#L281), [287](../../packages/temporal/plain-date-time.ts#L287), [472](../../packages/temporal/plain-date-time.ts#L472), [504](../../packages/temporal/plain-date-time.ts#L504) |
| [packages/temporal/plain-date.ts](../../packages/temporal/plain-date.ts)             | [243](../../packages/temporal/plain-date.ts#L243), [249](../../packages/temporal/plain-date.ts#L249)                                                                                                                           |
| [packages/temporal/plain-time.ts](../../packages/temporal/plain-time.ts)             | [320](../../packages/temporal/plain-time.ts#L320), [323](../../packages/temporal/plain-time.ts#L323), [559](../../packages/temporal/plain-time.ts#L559), [574](../../packages/temporal/plain-time.ts#L574)                     |
| [packages/temporal/plain-year-month.ts](../../packages/temporal/plain-year-month.ts) | [190](../../packages/temporal/plain-year-month.ts#L190), [193](../../packages/temporal/plain-year-month.ts#L193)                                                                                                               |
| [packages/temporal/rounding.ts](../../packages/temporal/rounding.ts)                 | [186](../../packages/temporal/rounding.ts#L186)                                                                                                                                                                                |
| [packages/temporal/zoned-date-time.ts](../../packages/temporal/zoned-date-time.ts)   | [582](../../packages/temporal/zoned-date-time.ts#L582), [599](../../packages/temporal/zoned-date-time.ts#L599), [748](../../packages/temporal/zoned-date-time.ts#L748), [939](../../packages/temporal/zoned-date-time.ts#L939) |

Validation: all 114 selected gates and six public package assemblies pass.
This includes all 40 Temporal class backend gates, source/test typechecks,
installed native Hermes, Rust/kernel controls, locale profiles and Intl consumers.
The four documented Temporal Intl data discrepancies remain visible through
accepted-failure checks; those gates passing does not mean zero raw failures.
No exclusions or failure baselines changed.
No specification defect is claimed. Only lines 549 and 559 gain new numbered
trace credit; new Temporal traces total 234. Initialization under already
modified primordials and realm behavior remain separate audit work.

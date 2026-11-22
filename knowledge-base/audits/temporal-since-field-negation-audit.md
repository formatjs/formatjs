# Since result fields and zoned endpoint preparation

Reviewed 2026-11-22. Requested ECMA-262 snapshot lacks Temporal API chapters.
Temporal section references below are separately published proposal comparisons,
not replacement authority or complete caller signoff.

## Public failure and paths

Replacing `Object.keys` after constructing the operands made calendar-relative
`since` invoke user code while enumerating a private result. Shared negation
must process ten known Duration components; the comparison algorithms do not
request a public enumeration operation there.

| Comparison caller                                                                                                                 | Actual path                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| [§3.5.14 DifferenceTemporalPlainDate](https://tc39.es/proposal-temporal/#sec-temporal-differencetemporalplaindate)                | plain-date.ts difference delegates to roundedDateTimeDifference, then the shared engine.                       |
| [§5.5.15 step 8 DifferenceTemporalPlainDateTime](https://tc39.es/proposal-temporal/#sec-temporal-differencetemporalplaindatetime) | plain-date-time.ts difference follows the same engine with original clock coordinates.                         |
| [§9.5.7 DifferenceTemporalPlainYearMonth](https://tc39.es/proposal-temporal/#sec-temporal-differencetemporalplainyearmonth)       | Rounded year/month cases enter the engine; exact month/increment 1 has a separate fixed-field shortcut.        |
| [§6.5.9 DifferenceTemporalZonedDateTime](https://tc39.es/proposal-temporal/#sec-temporal-differencetemporalzoneddatetime)         | Date-largest rounding enters roundRelativeDifference; time-largest and exact nanosecond routes return earlier. |

[Shared final negation:1055](../../packages/temporal/date-core.ts#L1177)
now indexes the private unit list, negates all ten own fields and canonicalizes
zero. It cannot call replaced `Object.keys` or an array iterator. The existing
zoned nanosecond identity branch has its own indexed negation. Time-largest
rounding applies the operation sign before exact rounding and returns earlier;
this change adds no second negation to either early route. Rounding-direction
correctness remains covered by the existing precision/relative-rounding audits.

The zoned regression exposed a second call before final negation:
unroundedZonedDifference calls addZonedDuration, which delegates to the public
addition implementation with a private Duration record. That implementation
also enumerated fields through mutable `Object.keys`.
[Zoned addition:488](../../packages/temporal/zoned-date-time.ts#L491) now indexes
the existing durationFieldNames list. Public add/subtract share this correction.
Actual duration input conversion still precedes field processing; public getters
retain their existing order and errors. No new generic record-copy helper added.

[§7.5.20 CreateNegatedTemporalDuration](https://tc39.es/proposal-temporal/#sec-temporal-createnegatedtemporalduration)
negates fixed internal components and creates a fresh Duration. The indexed TS
loop preserves that field transformation. It does not prove all construction,
realm, private-slot, range or allocation requirements. Native callers dispatch
before these TS loops; their Rust field arrays already avoid JS enumeration.

## Evidence and limits

Public controls prepare operands before replacing Object.keys, restore it in
finally, then inspect results. PlainDate, PlainDateTime and rounded PlainYearMonth
produce -P2D/-P2D/-P1Y; zoned UTC day-largest/minute-smallest produces -P2D.
Controls also check positive zero in the nanosecond field. Expected results use
literal two-day/year spans, not production helper calculations.

Before correction, both TS owning gates failed. Both native Hermes controls
passed. After shared final negation changed, plain controls passed while zoned
still failed; its captured stack identified nested addition at zoned-date-time.ts.
After both corrections, all eight focused public/native/compiler gates pass.
Fixture contents and expected counts stay intact. All 31 expanded tests and
the Temporal package assembly pass, including all 20 affected class/backend
gates and TS/native owning oracles. Exact targets:
[validation manifest](temporal-since-validation-targets.txt).

Full public coercion/order, other addition callers, provider/window/bubbling,
realm and native adapter contracts remain open. The
[bubbling body map](temporal-bubble-relative-duration-audit.md) is conditional on
valid endpoint/count/expansion producers. The separate
[zero-component prefix inconsistency](temporal-zero-component-prefix-spec-issue.md)
prevents full calendar-window equivalence claims. No historical trace credit added.

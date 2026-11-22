# Difference settings and private preparation

Reviewed: 2026-11-22. Current source/AST map for all six difference APIs. Requested [ECMA-262](https://tc39.es/ecma262/) has no Temporal API chapters in the checked published text. Numbered Temporal references below identify separately published proposal comparisons, not adopted authority or complete-method signoff.

## Corrected private operations

PlainDateTime `until`/`since` formerly spread private clockNames into its unit list, invoking replaced Array.prototype[Symbol.iterator] after option reads, including equal operands. [Current preparation](../../packages/temporal/plain-date-time.ts#L286) uses the complete ten-unit literal with indexed lookup. Defaults and canonical unit ordering stay identical.

PlainYearMonth's two [private reference-date records](../../packages/temporal/plain-year-month.ts#L233) formerly inherited Object.prototype. Preparing those records could read inherited era/eraYear after branded operand conversion. Both now have null prototypes while retaining their own prepared date fields. Actual public input bags still observe inherited era/eraYear getters; only private records change.

Both public regressions failed before repair. Neither correction changes rounding arithmetic or provider data. The earlier largest-unit spelling/negative-index fixes remain documented in [option-order audit](temporal-difference-option-order-audit.md).

## Complete numbered settings map

Comparison: [proposal §13.43 GetDifferenceSettings](https://tc39.es/proposal-temporal/#sec-temporal-getdifferencesettings). Current caller starts: [Instant161](../../packages/temporal/instant.ts#L161), [PlainTime306](../../packages/temporal/plain-time.ts#L306), [PlainDate232](../../packages/temporal/plain-date.ts#L232), [PlainDateTime270](../../packages/temporal/plain-date-time.ts#L270), [PlainYearMonth181](../../packages/temporal/plain-year-month.ts#L181), [ZonedDateTime569](../../packages/temporal/zoned-date-time.ts#L583).

1. Alphabetical independent-read order is preserved: largestUnit, roundingIncrement, roundingMode, smallestUnit.
2. Largest unit is read once and string-coerced before later reads. Auto is handled separately; [unitOption93](../../packages/temporal/rounding.ts#L93) validates and normalizes exact singular/plural spellings immediately. Reprocessing the resulting primitive string cannot cause another object coercion.
3. [roundingIncrement109](../../packages/temporal/rounding.ts#L109) defaults1; otherwise applies number-hint numeric coercion, truncation, finite/range validation1..1e9. BigInt/Symbol throw TypeError. This matches [§14.5.2.3 GetRoundingIncrementOption](https://tc39.es/proposal-temporal/#sec-temporal-getroundingincrementoption) and §13.40 ToIntegerWithTruncation. Abrupt/invalid increment prevents later reads.
4. [roundingMode83](../../packages/temporal/rounding.ts#L83) defaults trunc, otherwise string-coerces and validates all nine modes before smallestUnit access.
5. Smallest unit is read/string-coerced and exact spellings normalized. Explicit auto rejects in unitOption rather than the subsequent pure category check; no later public option access is skipped.
6. Largest category is restricted to time for Instant/PlainTime, date for PlainDate, datetime for PlainDateTime/ZonedDateTime. PlainYearMonth accepts only year/month. Category checks occur after four reads.
7. Undefined largest unit selects the same automatic path as explicit auto.
8. PlainYearMonth rejects recognized disallowed largest units week/day/time. Other callers' category restrictions exclude their unsupported units.
9. Smallest category follows the same groups. Some pure category checks occur in a different internal order after all reads; no public callback intervenes.
10. Smallest defaults: nanosecond for Instant/PlainTime/PlainDateTime/ZonedDateTime; day for PlainDate; month for PlainYearMonth.
11. PlainYearMonth also rejects recognized disallowed smallest units week/day/time.
12. Automatic largest takes the larger of smallest and each caller's base default: second for Instant, hour for PlainTime/ZonedDateTime, day for PlainDate/PlainDateTime, year for PlainYearMonth.
13. Auto/unset largest is replaced with that computed default. Only validated date indices reach PlainDate's lookup. PlainDateTime now constructs its list without public iteration.
14. Each caller rejects largest smaller than smallest, using canonical unit indices or the explicit YearMonth month-largest/year-smallest guard.
15. [§13.23 MaximumTemporalDurationRoundingIncrement](https://tc39.es/proposal-temporal/#sec-temporal-maximumtemporaldurationroundingincrement) gives no additional fixed maximum for year/month/week/day; time maxima are24/60/60/1000/1000/1000.
16. [§13.14 ValidateTemporalRoundingIncrement](https://tc39.es/proposal-temporal/#sec-validatetemporalroundingincrement) requires a strict cap and exact divisibility. Instant checks directly at192; PlainTime calls [validateTimeIncrement280](../../packages/temporal/plain-time.ts#L280); PlainDateTime uses [shared validation900](../../packages/temporal/date-core.ts#L903). Date/YearMonth smallest units require only generic1..1e9. Public equal ZonedDateTime checks time increments explicitly at607; other paths validate in the shared/native engine. Rust [validate_options327](../../crates/temporal/calendar_difference.rs#L500) and [validate_increment239](../../crates/temporal/time.rs#L239) preserve corresponding constraints.
17. Since preserves the original calendar anchor and applies sign while rounding, equivalent to negating directional mode before rounding and negating the resulting duration. Exact-scalar Instant/PlainTime paths use round(−x,mode)=−round(x,negate(mode)); calendar paths use signed endpoint/tie comparisons and sign-wrapped time rounding in [date-core959](../../packages/temporal/date-core.ts#L968). YearMonth's exact month/increment1 fast path only negates fields. This maps mode handling; existing rounding/precision audits retain arithmetic proof obligations.
18. Callers transport canonical units, validated mode, bounded integer increment and operation sign into direct/native engines. Public JavaScript coercion remains in shared frontends; typed Rust is not a replacement for those reads.

## Equal results and bounds

Instant/PlainTime validate before producing zero. Plain shared engine validates time increments before equal-zero. YearMonth checks increment range, mode, categories and order before its equal-epoch shortcut; year/month have no further fixed cap. Public ZonedDateTime applies calendar checks, settings, required zone equality, then its explicit equal-route increment check before zero. Duration.round's private route intentionally has a different equal-window contract and is outside these six public difference methods.

For date-largest ZonedDateTime, canonical zone identity currently precedes downstream fixed time-increment validation internally. The published settings operation validates increment earlier. This review found no ordinary input getter/coercion witness from that internal timing; both invalid cases reject with RangeError. Native identity transport observability remains a separate bound, so strict internal step equivalence is not claimed.

AST review found no remaining array spread/public array method/for-of inside the six difference preparation functions. This excludes downstream engines and operand conversion helpers from any blanket intrinsic-closure claim.

## Controls and validation

[PlainDateTime iterator controls](../../packages/temporal/tests/public-calendar-oracle.ts#L219) precreate branded operands, poison the public array iterator, run until/since with equal/unequal operands, then restore before assertions. They require zero hooks, no error, literal `PT0S`/`PT1H`/`-PT1H` results.

[YearMonth record controls](../../packages/temporal/tests/public-calendar-oracle.ts#L118) cover Gregorian/Hebrew, distinct reference days for the same month, until/since, increments1/2 and independent inherited era/eraYear poison. Literal results and zero-hook assertions run after exact descriptor restoration. A separate inherited public bag verifies intended era/eraYear getters remain observable.

Controls run through public_calendar_test, source/bytecode public_calendar_hermes_oracle_test and native_iso_hermes_oracle_test after native configuration. They remain explicit FormatJS calls outside the independent reference oracle. Two regressions red before correction; seven focused targets green. Expanded validation:84 tests pass (69 executed,15 cached), plus Temporal and DurationFormat package builds. [Manifest](temporal-difference-private-validation-targets.txt).

Remaining contracts: complete operand/brand/realm conversion, public field preparation, calendar/zone mismatch, host transport, output construction, full arithmetic/provider behavior and authoritative Temporal API chapters. A complete equal/boundary increment matrix is not established by these hook controls. No additional settings defect found in this review.

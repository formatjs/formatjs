# Non-ISO CalendarDateUntil contract and provider policy

Reviewed: 2026-11-22. AST/source review. No concrete implementation defect found
in this slice; final policy controls/validation recorded below.

## Authority and actual requirements

Requested authority remains [ECMA-262](https://tc39.es/ecma262/), whose checked published text has no Temporal API chapters. Following clauses are separately published proposal comparisons, not adopted ECMA-262 authority or completed audit credit.

[Proposal §12.3.8 NonISODateUntil](https://tc39.es/proposal-temporal/#sec-temporal-nonisodateuntil), live checked 2026-11-22, specifies implementation-defined calendar reckoning and a Date Duration Record with no nonzero field larger than largestUnit. It contains no numbered inner algorithm, prescribed maximal-year/month decomposition, mandatory ICU agreement, or antisymmetry rule. [§12.3.9 step 4](https://tc39.es/proposal-temporal/#sec-temporal-calendardateuntil) delegates to it. Equal inputs return zero earlier in step 2. [§7.5.1](https://tc39.es/proposal-temporal/#sec-temporal-date-duration-records) describes four float64-representable integer fields; its field table alone does not state a common-sign invariant. [§7.5.9 CreateDateDurationRecord](https://tc39.es/proposal-temporal/#sec-temporal-createdatedurationrecord) validates through IsValidDuration. Common sign also matters when the result becomes a public Temporal.Duration and when the implementation adds its prefix back. Keep those caller/result obligations distinct from inventing an internal §12.3.8 algorithm.

## Actual policy and matching implementations

TS `packages/temporal/calendar.ts:531` and Rust `crates/intl_datetimeformat_calendars/date_math.rs:60` use the same decomposition:

- Compare proleptic calendar years, original month identities, original day. Years start at target minus origin, with at most one signed correction. A second comparison resolves the retained original month identity in the candidate year and compares ordinal month plus original day. Neither comparison substitutes a constrained day for the original day.
- Resolve the original month identity in the retained-year base using constrain. Compute target-minus-base month serial; correct by at most one signed month if original day surpasses the target day. Add retained years/months with constrained day to obtain the anchor.
- Return exact epoch-day residual. Largest week uses truncating division/remainder by seven. Year/month paths leave weeks zero. Largest month never sets years; largest week never sets years/months; largest day never sets any larger field. Equality leaves four positive zero fields.

TS `addYearMonth:403`, `monthFromCode:222`; Rust `NumericCalendar::add_year_month:17`, arithmetic `core.rs:254`, table `table_calendar.rs:251`:

- Fixed calendars retain numeric month, then use fixed 12/13-month serials.
- Hebrew retains M05L as ordinal 6 in either target year. In a non-leap year this is ordinary M06. Ordinary codes M06 onward gain one ordinal in leap years. Months subsequently advance by the serial, not by month-code string arithmetic.
- Chinese/Dangi retain the ordinary month number for an absent leap identity under constrain. A present matching leap month is the ordinal immediately following its ordinary month. Other later ordinals shift by one. Reject policy is irrelevant here: differences deliberately call constrain internally.
- Rust compares typed month number then leap flag; TS compares canonical padded strings. For generated codes these order identically: M05 < M05L < M06, and analogous pairs. No observable public comparison/coercion hooks involved.

Era is not a serial coordinate. `packages/ecma402-abstract/Calendar/Arithmetic.ts:224` and Rust `core.rs:326` return monotone extended year fields: Japanese uses Gregorian year; Buddhist/ROC use constant offsets. Era/eraYear labels are produced separately. Difference never subtracts eraYear, so a Japanese era boundary cannot reset its year estimate.

## Serial monotonicity and sign argument

Fixed 12/13-month serials increase by one per ordinal month. Hebrew `HebrewElapsedMonths` at `Arithmetic.ts:49` and Rust `core.rs:389` use floor((235*y−234)/19); consecutive year starts differ by 12 or 13, matching the leap-year cycle. The inverse estimate corrects against adjacent elapsed-month starts. This establishes serial ordering independently of ICU samples, conditional on the already separate conversion/month-length contracts.

TS `calendar-table.ts:109` accumulates 12/13-month years from immutable month checkpoints; `tableYearMonth:125` inverts those serials. Rust `table_calendar.rs:67–115` validates every packed year's positive month lengths, allowed leap ordinal, accumulated day checkpoints and accumulated month checkpoints before constructing a provider; `months_before_year:307` and `year_month:428` then use those same positive counts. Thus table month serials are strictly increasing by calendar ordinal month. TS generated checkpoint integrity and host modes retain their generator/host evidence; Rust validation alone does not prove those separate paths.

Given chronological conversion and these strictly increasing serials, the sign argument is bounded:

1. The initial year difference has travel sign. If its mapped month/original day surpasses the target, one correction moves into the preceding year in travel direction; it cannot cross the origin year.
2. The retained-year base cannot lie beyond the target: same-year mapped-month/day overshoot was tested; a corrected year lies strictly before the target year in travel direction. Therefore target-minus-base month serial has travel sign.
3. The serial estimate resolves exactly the target year/month. If original day would overshoot, one month correction moves to the immediately preceding month in travel direction. A zero month count cannot require such correction: that would have made the retained-year base itself surpass the target (or would contradict origin/target day order when retained years are zero).
4. Constraining the original day in that final month cannot cross the target: either target month has original day on the permitted side, or the corrected month lies wholly on the permitted side. Consequently day residual has travel sign. Truncating division/remainder preserves that sign for weeks/days.

This proves decomposition invariants conditional on provider conversion/order contracts; it does not prove every calendar field formula or host data point. Numeric magnitude/float64 exactness is separately bounded by `temporal-calendar-count-window-audit.md`.

## Public policy controls

[Shared public controls](../../packages/temporal/tests/public-calendar-oracle.ts#L118)
isolate retained-year leap policy in source TS/Hermes and native bridge profiles:

- Chinese/Dangi: 2023 M02L day29 to 2024 M02 day29, largest year. Expected 0 years, 12 months, 0 days, despite adding one constrained year reaching the target. Original M02L sorts after target M02, so the year prefix is not retained. Existing `table-calendars.test.ts:30` proves the add-year fallback, not this difference decomposition.
- Hebrew: 5784 M05L day29 to 5785 M06 day29, largest year: expected 1 year, 0 months/days. Reverse: expected −1 year, −1 month, 0 days, because ordinary M06 retained backward resolves after the leap M05L and needs one negative month. This deliberate lack of antisymmetry is not a defect; both must add back exactly. Test actual fields and literal calendar dates; do not generate expectations by calling production until/add helpers.

The controls require literal forward/reverse duration strings, exact add-back in
both directions, and a constrained one-year addition reaching the same target.
They demonstrate why constrained addition alone cannot define the retained year
prefix. These are FormatJS policy checks, called separately from the independent
reference oracle so another allowed non-ISO policy is not mislabeled a defect.
All 12 focused targets pass (three executed, nine cached); runtime arithmetic is
unchanged. Targets are listed in `temporal-date-until-validation-targets.txt`.

## Evidence and remaining bounds

- Existing arithmetic controls: `packages/temporal/tests/arithmetic-calendar.test.ts:79`, Rust `core.test.rs:260`; 2,080 signed/endpoint cases include Hebrew, but do not explicitly prove the leap examples or maximal-prefix policy.
- Existing table fixtures: TS `table-calendars.test.ts:25` counts 6,720 differences. Rust `table_calendar.test.rs:268` checks an extended-endpoint year difference; :299 checks equal-date zero for all units across broad dates. These do not exhaust all distinct leap-remapping pairs.
- `crates/temporal/calendar_provider.rs:11` seals CalendarProvider; only arithmetic engines, validated tables and CalendarRef wrapper participate. External arbitrary provider outputs are outside the actual public architecture. The count-window audit now identifies this closed provider set.
- Remaining full closure: generator/host checkpoint integrity, complete conversion chronology/month-code identity, all supported boundary coordinates and caller range policies. No concrete public sign, larger-field, era or leap-remapping violation found. No justification to replace this implementation-defined policy merely to match another provider.

# CalendarDateUntil: full operation comparison and remaining proof

Reviewed: 2026-11-22. Source AST and numbered operation map. New prefix controls
and final validation are recorded below; runtime arithmetic is unchanged.

## Authority and scope

Requested authority remains [ECMA-262](https://tc39.es/ecma262/). Its checked published text contains no Temporal API CalendarDateUntil clause. Numbered operations below are explicitly separately published proposal comparisons, not adopted ECMA-262 authority or completed audit sections.

Comparison: [proposal §12.3.9 CalendarDateUntil](https://tc39.es/proposal-temporal/#sec-temporal-calendardateuntil), [§3.5.6 ISODateSurpasses](https://tc39.es/proposal-temporal/#sec-temporal-isodatesurpasses), [§3.5.5 CompareSurpasses](https://tc39.es/proposal-temporal/#sec-temporal-comparesurpasses), and [§12.3.8 NonISODateUntil](https://tc39.es/proposal-temporal/#sec-temporal-nonisodateuntil). Existing ECMA-262 shared Gregorian leaves remain the actual published authority identified in the Gregorian closure audit; they do not supply a missing Temporal difference contract.

## Complete operation map

1. **§12.3.9 steps 1–2: comparison and zero.** TS `packages/temporal/calendar.ts:531` computes `sign(two-one)`; Rust `crates/intl_datetimeformat_calendars/date_math.rs:60` computes the same direction. This combines the proposal's CompareISODate and step 3.a negation. Both return four positive-zero fields for equal valid raw dates. Both convert raw endpoints before this shortcut; the abstract operation has no public coercion here. Public plain equal differences shortcut in `date-core.ts:881` before entering this provider operation. No demonstrated public getter/error-order defect follows from private raw conversion ordering.

2. **Steps 3.b–3.c: maximal years.** TS directly starts at `last.year-first.year`, then subtracts direction once if `surpasses()`; Rust mirrors it. The local helper first compares year, original month code, and original day, then normalized year/month with original day. It deliberately does not compare clamped day-of-month. This corresponds to the prefix comparisons in §3.5.6 steps 1–8 and §3.5.5, rather than taking a clamped addition as the definition of a complete month/year.

3. **Steps 3.d–3.e: maximal months.** TS adds retained years using constrain, computes target minus base month serial, then makes at most one signed adjustment using the same prefix helper. `calendarMonthSerial` is at `calendar.ts:517`; lunisolar tables use `tableMonthDifference`. Rust uses `months_before_year` plus ordinal months. The resulting anchor is rebuilt with constrained calendar addition. ISO's fixed twelve-month serial gives the target year/month directly; comparing original days decides whether one preceding month is needed. The prior year prefix has already passed. Consequently the direct estimate needs at most one correction for ISO, without scanning potentially millions of months. Leap-month remapping and provider serial consistency require their separate non-ISO proofs.

4. **Steps 3.f–3.j: weeks and remaining days.** TS computes `two-anchor`, then truncating division by seven and signed remainder only when largest unit is week. Rust mirrors this with integer `/` and `%`. With no year/month prefix, anchor remains `one`, giving exact bounded epoch-day subtraction. This is terminating arithmetic, but literal equivalence to the current published loops cannot be claimed: ISODateSurpasses step 5 drops every weeks/days candidate when months is zero. See [separate issue](temporal-isodatesurpasses-zero-month-spec-issue.md). The defect is present for epoch 0 to 1 with largest day/week. Preserve working implementation rather than reproducing nontermination.

5. **Step 3.k: date-duration result.** Both implementations return exactly years/months/weeks/days, with larger fields initialized to zero and no negative zero. Bounded input/count evidence is in `temporal-calendar-count-window-audit.md`; common sign and exact add-back receive the existing 2,080-case arithmetic controls. The record adapter is TS `date-core.ts:781`; Rust `crates/temporal/calendar_difference.rs:77` promotes the four fields to i128 and fills clock fields with zero.

6. **Step 4 / §12.3.8: non-ISO delegation.** Same built-in algorithms service arithmetic and packed-table calendars. NonISODateUntil is implementation-defined prose, not a numbered inner month-selection algorithm. Its explicit larger-than-largest zero restriction is structurally preserved. Full provider calendar semantics, leap mapping and range errors are not established merely by sharing the ISO algorithm or by exact arithmetic bounds.

## Caller and native transport

TS `packages/temporal/native.ts:1101` sends calendar ID, two epoch days and largest unit unchanged. Rust `crates/temporal/ffi.rs:760` validates the four date-unit strings, calls provider `until_raw`, and serializes exactly four date fields. The native and direct Rust operations share `NumericCalendar::until_raw`; table providers implement the same trait. Normal Rust arithmetic `core.rs:447` and table `table_calendar.rs:349` methods check ordinary public days; raw paths admit the demonstrated extended rounding coordinates through their raw conversions.

`crates/temporal/calendar_provider.rs:11` seals CalendarProvider. Actual arithmetic engines, validated table calendars and their CalendarRef wrapper are the providers; arbitrary external implementations are excluded. The count-window audit now identifies this closed provider set; DateDuration field types alone do not establish actual result bounds. Host-calendar modes retain their separate host-data boundaries.

## Existing evidence; limits

- `packages/temporal/tests/arithmetic-calendar.test.ts:79` and Rust `crates/intl_datetimeformat_calendars/core.test.rs:260`: 13 arithmetic calendars, five origins, eight signed displacements, four largest units. Check all fields have travel sign, no negative zero (TS), and adding the result recovers the exact destination. This includes epoch 0 and ±1, largest day/week, already adequate protection for the new specification issue. These are helper contracts, not 2,080 public Temporal invocations.
- Arithmetic oracle fixtures additionally check 32,352 differences against ICU. Their breadth is evidence, not an exhaustive extended-domain proof or authority override.
- `packages/temporal/tests/plain-relative-oracle.ts:93` onward invokes actual PlainDate until/since for date fixture rows; native/Hermes harnesses consume the shared oracle. Fixture round/total coverage is not automatically CalendarDateUntil coverage for every largest unit.
- `temporal-calendar-gregorian-closure-audit.md` proves bounded forward/inverse Gregorian conversion; `temporal-iso-calendar-add-bounds-audit.md` proves calendar-add numeric bounds and common-sign carries; `temporal-calendar-date-add-iso-contract-audit.md` maps regulation/overflow ordering. Do not reopen these as unproved solely because this operation calls them.

## Bounded proof and new controls

[ISO finite-prefix proof](temporal-iso-date-until-prefix-proof-audit.md) establishes
maximal unregulated year/month prefixes, constrained anchor placement, common sign,
exact raw add-back and finite arithmetic for all valid raw±110million-day ISO
endpoints. This is explicitly conditional on intended terminating week/day handling;
it does not adopt a repair to the published helper. Ten literal field controls
cover cases for which mere sign/add-back checks would accept incorrect prefixes.
[Non-ISO policy](temporal-noniso-date-until-policy-audit.md) separates actual
implementation-defined choices from provider conversion/data dependencies.
Validation: all 12 focused targets pass (three executed, nine cached).
[Target manifest](temporal-date-until-validation-targets.txt) records TS/typechecks,
TS Hermes, native ISO transport, public calendar/relative routes and Rust core/table.

## Remaining obligations

1. Zero-month specification defect is recorded separately. Literal §12.3.9 loop equivalence is blocked until published comparison changes; no runtime repair justified by this defect.
2. ISO finite decomposition proof is supplied above. Keep its validated endpoints, valid date units and intended terminating week/day premises; full public caller coercion/native/realm contracts remain separate.
3. New literal boundary/prefix controls cover leap/month ends and extended raw extrema. They complement the algebraic proof; broader provider/calendar validity is not inferred from those passing samples.
4. Non-ISO implementation-defined contract: calendar-specific ordinal/month-code ordering, leap-month remapping when retained years change, serial monotonicity, era transitions, and validated table endpoints. ICU examples plus add-back do not prove maximal prefix or complete extended coverage. This is separate from the published ISO defect.
5. Validate the actual public/native caller routes when changing decomposition. Focus owning arithmetic and plain-relative targets first; no broad new intrinsic-hook sweep warranted here.

Owning focused targets already declared in BUILD: `//packages/temporal:arithmetic_calendar_test`, `//packages/temporal:plain_relative_test`, `//crates/intl_datetimeformat_calendars:calendar_core_test`, `//crates/intl_datetimeformat_calendars:table_calendar_test`; actual native public transport has `//packages/temporal:plain_relative_hermes_oracle_test`. All 12 focused targets pass (three executed, nine cached);
[target manifest](temporal-date-until-validation-targets.txt).

# Arithmetic provider chronology and month identity

Reviewed: 2026-11-22. AST/source audit. No concrete implementation defect found. Runtime arithmetic is unchanged. Exact-integer finite analysis described below is a proof aid, not execution of production TS/Rust or an independent calendar-authority oracle.

## Authority boundary

Requested [ECMA-262](https://tc39.es/ecma262/) currently has no Temporal API clauses. Its Gregorian leaves retain the authority and bounded proofs in `temporal-calendar-gregorian-closure-audit.md`: §21.4.1.5 DayFromYear, §21.4.1.7 YearFromTime and §21.4.1.9 IsLeapYear. No new Hebrew algorithm is attributed to ECMA-262 or ECMA-402.

Separately published comparison [proposal §12.3.25 NonISOCalendarISOToDate](https://tc39.es/proposal-temporal/#sec-temporal-nonisocalendarisotodate) leaves non-ISO correspondence implementation-defined, subject to Calendar Date Record field meanings. [§12.3.26](https://tc39.es/proposal-temporal/#sec-temporal-calendarisotodate) delegates to it for non-ISO calendars. [§12.3.21 NonISOCalendarDateToISO](https://tc39.es/proposal-temporal/#sec-temporal-nonisocalendardatetoiso) supplies corresponding implementation-defined inverse/overflow behavior; [§12.3.22](https://tc39.es/proposal-temporal/#sec-temporal-calendardatetoiso) delegates. These are comparison references, not adopted Temporal authority. Matching another provider is evidence, not a prescribed non-ISO algorithm.

## Source and caller domain

AST anchors, `packages/ecma402-abstract/Calendar/Arithmetic.ts`:

- HebrewLeapYear46; HebrewElapsedMonths49; hebrewDelay53.
- CalendarISOYear66; ArithmeticCalendarStartOfYear69.
- ArithmeticCalendarToEpochDay112; MonthsInYear133; DaysInMonth142; MonthCode180.
- ArithmeticGregorianFromEpochDay191; ArithmeticCalendarFromEpochDay224; ArithmeticCalendarEra309.

`packages/temporal/calendar.ts:372` bounds raw integral input epochs to ±110000000. Public date bounds remain narrower. `addYearMonth:403` checks calendar years ±400000. Existing count bounds and ISO Gregorian closure are dependencies already proved; this report does not reopen them.

## Hebrew finite internal closure

The exact-integer analysis script is [finite proof notebook](temporal-arithmetic-provider-proof-notebook.md#hebrew-finite-domain). It uses integer floor division and nonnegative modulo to evaluate the recorded start-of-year/month-shape equations, independently of binary64 rounding. It is not a repository test proposal: it mirrors the calendar equations as bounded proof work, not a production-vs-copy regression oracle.

Across **800001 years −400000 through 400000**, checked:

- `elapsedMonths(y+1)−elapsedMonths(y)` equals 12/13 exactly when the calendar's leap predicate says ordinary/leap.
- Every year's month lengths are positive and sum exactly to `start(y+1)−start(y)`.
- Only ordinary lengths 353/354/355 occur; only leap lengths 383/384/385 occur.
- All **9894749 ordinal month identities** round trip through generated month code and the existing inverse identity rule.

Zero failures. Year-length counts: 353:80321, 354:194348, 355:230595, 383:123776, 384:42105, 385:128856. Outer year starts are −148191690 and 144006128 (exclusive end), strictly enclosing the raw epoch domain.

For raw epochs ±110000000, containing Hebrew years are **−295436 through 306896**. Evaluated the inverse estimate at both clipped endpoints of every containing year. Its error relative to exact containing year is within **−1..+1**. The estimate is monotone within a year, so endpoint checks bound every intermediate day. Hence the two correction loops in `ArithmeticCalendarFromEpochDay` need at most one decrement or increment over this domain, provided the recorded equations are evaluated exactly.

Exactness bridge to TS binary64:

- All integer sums/products in elapsed-month and postponement calculations for years through the necessary ±400002 neighbors stay below 2^37 in magnitude; exact integers remain representable.
- Divisions by19 and25920 have noninteger remainder distances at least1/19 and1/25920. Their quotient magnitudes are below2^23, so binary64 half-spacing is at most2^−31, far smaller than either distance. Integral quotients themselves are exactly representable.
- Modulo7/19 is implemented as `value−floor(value/divisor)*divisor` on these bounded exact integers; its remainder decision is likewise exact. Postponement day totals, year-start sums and month-length accumulations stay below2^29; elapsed-month/postponement numerators use the prior2^37 bound. For modulo7, quotient magnitude is below2^26 and half-spacing at most2^−28, still far below1/7.
- Hebrew inverse estimate numerator `(epoch+2092590)*492480` is below2^46; quotient magnitude below2^19. Minimum nonintegral distance1/179876755 exceeds binary64 half-spacing2^−35. Its floor therefore agrees with the integer analysis.

Consequences: starts are strictly increasing, correction finds the unique containing year, positive months partition that year, inverse subtraction returns the unique valid ordinal month/day, and forward start-plus-month-prefix-plus-day recovers the same epoch. This establishes internal chronology/representation coherence on the stated finite domain. It does **not** establish external historical correctness of the Hebrew postponement/epoch choice.

Month identity is especially simple: leap ordinal6 generates M05L; later ordinals subtract1 for ordinary code numbering. Inverse M05L returns ordinal6; ordinary code M06 onward adds1 only in a leap year. Non-leap ordinals map directly. Canonical padded code order agrees with ordinal chronology within every year. The distinct retained-year fallback M05L→ordinary M06 in absent-leap years is intentional policy already documented/tested, not same-year identity failure.

## Era calendars

Gregorian/Gregory/Japanese share the existing bounded Gregorian chronology proof. Buddhist and ROC apply constant label offsets +543 and −1911 on inverse, then opposite offsets on forward; both preserve ordering and exact inverse identity. All use ordinary padded M01..M12, preserving identity and month ordering.

Japanese era metadata is separate from this year coordinate: `ArithmeticCalendarEra:341` chooses newest applicable era boundary, but `ArithmeticCalendarFromEpochDay` continues to report proleptic Gregorian year. Buddhist/ROC era labels likewise do not replace extended year. CalendarDateUntil therefore cannot acquire a negative year jump at era reset. Rust `crates/intl_datetimeformat_calendars/core.rs:326` uses matching constant year offsets; Hebrew postponement at :567–586 uses Euclidean integer operations corresponding to the exact TS equations.

This closes the chronology concern needed by difference for these era calendars, conditional on the already proved Gregorian conversion. Full historical era-name/boundary policy, input era/eraYear resolution and cross-field validation are different public contracts; no claim that this review proves them follows.

## Compact proof by periods

Exact-integer proof aid: [finite proof notebook](temporal-arithmetic-provider-proof-notebook.md#other-arithmetic-periods). It checks two complete periods around year zero for each formula, including endpoint inverse estimates and positive month partitions. No failures. This is algebra/finite proof work; it is not a proposed mirrored-formula unit test or production TS/Rust execution.

For each calendar, start(y+P)=start(y)+D; all month shapes repeat after P. The initial inverse estimate satisfies estimate(epoch+D)=estimate(epoch)+P. Therefore checking every residue-year in one period extends to every integer year, including negatives. Two periods were evaluated as an additional check. Within each year the initial estimate is monotone, so evaluating the first/last day bounds every intervening day.

- **Coptic/Ethiopic/Ethioaa:** P=4, D=1461. Starts are constant+365*z+floor(z/4), with z=y or y−5500. Consecutive year lengths are365/366. First12 months total360; month13 is remaining5/6. Inverse estimate error is identically0. Algebraically z=4q+r yields start=constant+1461q+365r, r∈0..3. The inverse floor((4*(epoch−constant)+3)/1461) returns exactly4q+r for every day of the corresponding365/366-day interval. Ethioaa's5500 label offset cancels before estimation and returns afterward.
- **Islamic-civil/islamic-tbla:** P=30, D=10631. Year length354/355 follows the increment of floor((3+11*y)/30). Six odd months contribute180; five ordinary even months145; final month29/30 gives354/355. Exact finite30-residue check gives inverse estimate error0 at both endpoints of every year; monotonicity and period extend this globally. Tabular epoch differs by one day, and the inverse adds the same one-day correction before its estimate.
- **Persian:** P=33, D=12053. Increment of floor((8*y+21)/33) gives year365/366. First6 months total186, next5 total150; last month length−336 gives29/30. Inverse error0 at both endpoints of all33 residues; monotonicity/period prove exact containing-year estimate throughout.
- **Indian:** P=400, D=146097, inherited from Gregorian. Start(y)=GregorianJan1(y+78)+80. This is March21 in Gregorian leap years, March22 otherwise, matching Rust's explicit March date. Year length365/366 equals the same civil Gregorian year's length. First month30/31, next5 months155, last6 months180 total365/366. Estimate civilYear−78 is y from the March start through December, y+1 during following January-to-start. Therefore error0/+1; at most one decrement, no increment. The Gregorian chronology proof supplies civilYear ordering and400-year periodicity.

Strictly increasing starts and positive month lengths whose sum equals the consecutive-start difference partition all epochs into unique year/month/day triples. The inverse's bounded correction and month-subtraction loop locate that unique triple. Forward start+month-prefix+day−1 reverses it exactly. Codes M01..M12 (M13 for the three13-month calendars) preserve ordinal ordering and invert directly through existing month-code parsing. No leap suffix is generated here.

## Actual raw-domain bounds

Exact containing years at epochs −110000000 and +110000000:

- Coptic: −299478..302849.
- Ethiopic: −299202..303125.
- Ethioaa: −293702..308625.
- Indian: −299278..303061.
- Islamic-civil and Islamic-tbla: −309024..311802.
- Persian: −299822..302518.

All estimated/corrected years and required adjacent starts stay comfortably within checked ±400000. Year correction is zero except Indian's possible single decrement. Month subtraction takes at most12 iterations for13-month calendars,11 for12-month calendars; positivity and exact partition prevent an invalid month request before termination.

## Binary64 bridge and Rust

On this raw domain all non-Gregorian start/estimate integer products/sums are below2^33 in magnitude, so they are exactly representable. Divisors are4/30/33 for starts and1461/10631/12053 for estimates; absolute quotient magnitudes stay below2^20. Nonintegral quotient distance to an integer is at least1/12053, vastly greater than binary64 half-spacing2^−34. Thus floor decisions agree with the exact-integer proof, including negative years. Integer quotients are representable exactly. Gregorian leaf arithmetic and Indian civilYear use their existing bounded proof; Indian's raw civil years remain within that domain.

The generic inverse computes epoch milliseconds first. Magnitude is below2^54 but every product is divisible by1024, so binary64 multiplication remains exact. YearFromTime does not TimeClip; division back to an integral day is exact. This is not a lossy-conversion witness.

Rust uses i64 with Euclidean division for the same start/estimate equations; all bounded products are far below i64 limits. Indian's explicit March21/22 is equal to the TS Jan1+80 expression. Month lengths and canonical codes match. No new transport or public-field coercion claim follows from that equality.

## Audit implication and remaining scope

This closes the listed arithmetic providers' internal chronology, month-identity and inverse-termination dependencies for valid raw epoch inputs, conditional on existing Gregorian leaves and exact source equations. Together with the Hebrew argument above and the separate Gregorian proof, it supplies the provider-order premise used by the non-ISO CalendarDateUntil sign proof. It does not establish external historical correctness of each epoch/leap convention, generated/host table completeness, public era resolution, field preparation, overflow/error order or every caller.

No runtime patch is warranted by this review. Existing literal/public fixtures remain execution evidence. The exact-integer notebook records bounded mathematical analysis, separate from independent conformance and ECMA-262 Temporal section completion.

## Production evidence and limits

Existing ICU arithmetic/public fixture targets remain the execution evidence.
This pass adds table/fallback boundary controls, not duplicate formula tests.
All nine focused targets pass (two executed, seven cached in the final run).
See [manifest](temporal-provider-closure-validation-targets.txt).
No historical audit counts or complete public methods are signed off.

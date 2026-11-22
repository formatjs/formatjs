# Host Chinese/Dangi chronology closure

Closes chosen host Chinese/Dangi positive-partition, adjacent-year continuity and forward/inverse premise underlying comparison §13.42 step2. Requested ECMA-262 remains authority; Temporal numbered sections are pinned rendered proposal comparison only. No astronomy/ICU parity assertion, full402 audit, checkout edits, production execution or builds. Existing public host/native tests remain runtime evidence.

## Reviewed source and artifacts

AST: `source-ast.json`. Exact source hashes: `source-hashes.json`.

- lunisolar.ts:13–22: exact BigInt constants, Euclidean floor, onOrBefore.
- lunisolar.ts:38–107: fixed offset selection; exact solar/lunar progression, leap choice, positive month construction and cumulative starts.
- host-calendar-data.ts:19–69: compact cumulative decoding/selection.
- host-calendar.ts:83–97: compact preferred, approximation otherwise; :133–146 inverse; :149–185 month serial addition/difference.
- calendar-table.ts:58–70/:90–99/:150–154: provider transport.
- calendar.ts:125–128/:315–363/:373–395: year guard, forward composition, epoch bound/inverse.
- DateOperations.ts:22–46: DayFromYear/YearFromTime arithmetic.

Existing generated artifact paths and complete SHA256 manifest appear in `compact-join-result.json`. Each calendar's five existing configured copies have identical bytes. Root should confirm consumed artifact through Bazel cquery; this review read existing outputs only. Chinese hash `030595d260c92b371c5a1278bb9ab19ce132b71bbb588a76beed8522e574a5ee`; Dangi hash appears in manifest. Provenance: host_lunisolar.rs generates complete1900..2102 years from pinned ICU4X, checks year/month/day identity,29/30 lengths and leap count; source hash included. No new data policy introduced.

## Finite exact proof and source correspondence

Reviewable proof code:

- `temporal_lunisolar_partition_proof.py`: direct equations/loop transcription with Python mathematical floor.
- `finite.py`: finite invariant enumeration, output `finite-result.json`.
- `compact_join.py`: actual numeric generated compact data decoding and joins, output `compact-join-result.json`.

BigInt positive divisions in TS constants equal Python integer division. TS floor corrects negative truncation exactly; Python // is same Euclidean floor because every divisor is positive. onOrBefore source expression and offset branches match exactly. Both loops preserve source order: store length at solarTerm+(leap!=0), choose leap or advance term, then advance moon. Python missing own length raises KeyError, so successful complete sums establish every accessed length exists. Cumulative starts/end preserve source loop exactly. These are proof aids; they are not mirrored-formula unit tests or a claim of production TS execution.

Each calendar checks800003 consecutive years, −400001..400001: every yearCheck-admitted year plus one neighboring year each side. This strictly contains all Gregorian related years touching raw epoch±110000000 and public Temporal range. Each calendar checks9894659 month identities. Zero failures:

- Every year contains12 or13 own lengths; every length29 or30; leap ordinal0..12;13 iff leap nonzero.
- For every adjacent checked pair, end(y)=start(y+1). Positive lengths therefore form complete strictly increasing partitions.
- New Year lies Gregorian day offset21..52; source bitmask never shifts computed New Year (800003 zero shifts per calendar).
- Lunar month serial at each start equals base serial+ordinal−1; serial(end)=base+count. This establishes month serial adjacency within and across approximation years.

Year-length counts (sum800003): Chinese383:31169,354:318857,355:186523,384:263454; Dangi383:31174,354:318852,355:186528,384:263449.

Compact decoding checks203 years/2511 month starts per calendar: leap ordinal0..12; no unused length bits beyond chosen12/13 months; all lengths29/30; cumulative range algorithm agrees with per-year expansion. New Year Gregorian day offset20..50. All compact month starts retain same consecutive lunar serial identity. Exact joins for both calendars:

- approximation1899 end=−25537=compact1900 start;
- compact2102 end=48614=approximation2103 start.

Thus actual compact+approx provider is one continuous positive partition with consecutive month serials across whole supported domain. Existing boundary test's2102 probes start of final compact year, not upper join2103; this exact artifact proof supplies actual upper-join evidence. Optional2103 public transport regression useful, not necessary to establish arithmetic identity.

## TS Number correspondence

Python exact arithmetic alone is insufficient. Every Number operation affecting these invariants is bounded as follows; lunar/solar large products remain BigInt throughout.

1. For |relatedYear|≤400001, DayFromYear's integer multiply365*(y−1970), additions and floors have magnitude<2^28, hence all integer arithmetic exact in binary64. Division by4 is binary exact. Division by100/400 has absolute rounding error<2^−34; any nonzero fractional distance to an integer is at least1/400, far larger. Exact integer quotients are representable. Therefore Math.floor after those correctly rounded divisions equals mathematical integer floor, including negative years.
2. DayFromYear+719162, earliest=DayFromYear+18, earliest+719163 and epoch+719178 remain integers<2^28 in magnitude; additions and Number-to-BigInt conversion exact.
3. Constants day=86400000, month=2551442876, year=31556952000, term=2629746000 are BigInt. All onOrBefore/floor products and lunar/solar additions exact, including negative values. There is no Number multiply of astronomical periods.
4. Number conversions of lunar floor differences yield29/30; Boolean leap offset yields0/1; masked displacement lies0..63. These are exact. starts/end accumulate≤13 lengths onto integral epoch days<2^28, so sums exact. Counts/index increments are exact small integers.
5. Month serial converts a BigInt quotient with magnitude<2^23 over checked years; exact. lunisolarMonthEpoch converts only after explicit BigInt epoch guard±110000400, so exact. Safe-integer serial guard and BigInt composition avoid lossy conversion even for rejected huge deltas.
6. hostCalendarDate passes epoch*86400000 to YearFromTime. Raw |epoch|≤110000000; product may exceed2^53 but is a multiple of1024, while binary64 spacing is at most2 at magnitude<2^54. Therefore product exact. Dividing by86400000 has exact representable integer result epoch; correctly rounded division returns it exactly. Math.floor leaves it unchanged. YearFromTime's365.2425 division supplies only a finite nearby initial estimate; monotone exact DayFromYear comparisons adjust to unique enclosing Gregorian year. No correctness relies on that floating estimate being exact.
7. Number comparisons, own array indexing and prefix subtraction then compare/subtract exact integral epoch days. Packed compact values fit32bits; shifts/masks and small popcount/year sums are exact. Existing captured intrinsics/private own-data list proof supplies hook isolation, not an extra arithmetic assumption.

## Forward/inverse consequence

For any accepted raw epoch, let g be exact Gregorian enclosing year. start(g) lies20..52 days after Gregorian January1, and end(g)=start(g+1) lies after next January1. Therefore hostCalendarDate needs at most its single decrement into g−1; the increment alternative is harmless. It selects unique containing calendar year. Descending month search terminates in1..13 because start0≤epoch<end and starts strictly increase. Returned day=epoch−monthStart+1 lies1..29/30. Forward converter computes start+preceding lengths+day−1, exactly same monthStart+day−1, so recovers epoch. Conversely each valid year/month/day returns same fields under inverse. Existing monthCode/leap helper proof supplies canonical code identity; this chronology argument does not silently close unrelated era parsing.

Consecutive month serial identities imply hostCalendarAddMonths/difference transport uses unique month positions. Bounded epoch guard prevents unsafe extrapolation; private search moves monotonically until chosen year contains target serial. No alternate astronomical model needed.

This removes Chinese/Dangi structural condition from §13.42 step2 and related provider gates. Host Umm stitching, availability, era conversion, grammar, and foreign-copy contracts remain separately owned unless parent has independent closure evidence.

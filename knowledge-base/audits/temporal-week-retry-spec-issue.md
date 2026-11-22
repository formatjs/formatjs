# Week retry ignores shift across New York's fold

Confirmed mathematical counterexample to rendered comparison, rechecked 2026-11-22. No new runtime defect claimed; current TS/Rust shared engine shifts week correctly. Requested ECMA-262 authority boundary unchanged. Separately published Temporal proposal remains comparison/navigation.

[ComputeNudgeWindow §7.5.33 steps3.f–g](https://tc39.es/proposal-temporal/#sec-temporal-computenudgewindow) use the same week bounds regardless of additionalShift. [NudgeToCalendarUnit §7.5.34 step5.a.ii](https://tc39.es/proposal-temporal/#sec-temporal-nudgetocalendarunit) requires the retried window to bracket destination. Reachable positive week input violates that assertion.

## Witness with ordinary Gregorian date difference

Use America/New_York and the Gregorian calendar:

- Origin: 2020-10-25T01:30-04:00, UTC05:30, epoch1603603800000000000ns.
- Destination: 2020-11-01T01:00-05:00, UTC06:00, epoch1604210400000000000ns.
- Origin plus six calendar days: Oct31 01:30-04:00, epoch1604122200000000000ns.
- Origin plus one week, compatible: Nov1 first01:30-04:00, epoch1604208600000000000ns.
- Origin plus two weeks: Nov8 01:30-05:00, epoch1604817000000000000ns.

These offsets follow [IANA tzdb2026f northamerica](https://data.iana.org/time-zones/tzdb-2026f/northamerica), US rules lines179–180 and America/New_York lines323–328. DST ends at02:00 on first November Sunday; Nov1 2020 repeats01:00–01:59. Compatible chooses earlier occurrence for Nov1 01:30.

The unrounded date target borrows one local day because destination clock01:00 precedes origin clock01:30. Oct31 anchor is before destination; no overshoot adjustment applies. Result date prefix is0weeks6days with remaining24h30m. Week truncation count is 0. Gregorian date difference is supplied by the
non-ISO provider in §12.3.8. The literal ISO date difference stalls earlier
because its zero-month shortcut ignores candidate weeks and days.
[CalendarDateUntil](https://tc39.es/proposal-temporal/#sec-temporal-calendardateuntil).
[ISO nontermination proof](temporal-isodatesurpasses-zero-month-spec-issue.md).

Initial bounds are [0weeks,1week]. Destination exceeds upper endpoint by1800000000000ns, so retry is required. Published additionalShift=true produces identical bounds. Its bracket assertion fails. No retained year/month prefix, zero-component-prefix inconsistency or arbitrary timezone provider is needed.

The initial upper count agrees with §7.5.33 step 3.g. The source advances it
on retry, while the published formula still evaluates `weeks + increment × sign`.
Current source shifts to [1 week, 2 weeks]. Signed span608400000000000ns (169h), distance1800000000000ns (30m). Trunc/floor/half modes select P1W; ceil/expand select P2W. `since` uses same anchor: trunc/ceil/half modes select -P1W; floor/expand select -P2W.

## Source and minimal public control

Reviewed implementation ranges (source versions retained in the audit manifests):

- `packages/temporal/zoned-date-time.ts:545-598`: local clock borrow, date until and exact remainder.
- `packages/temporal/date-core.ts:1005-1067`: week count, signed window check and one increment retry.
- `crates/temporal/calendar_difference.rs:114-174`: same unrounded decomposition.
- `crates/temporal/calendar_difference.rs:211-232`: same week retry.

Suggested insertion in existing `checkZonedArithmeticOracle`, which already receives Temporal and equal. Literal instants avoid making string offset conversion part of this regression:

```ts
const weekOrigin = new Temporal.ZonedDateTime(
  1_603_603_800_000_000_000n,
  'America/New_York'
)
const weekEnd = new Temporal.ZonedDateTime(
  1_604_210_400_000_000_000n,
  'America/New_York'
)
equal(
  weekOrigin
    .until(weekEnd, {
      largestUnit: 'week',
      smallestUnit: 'week',
      roundingMode: 'trunc',
    })
    .toString(),
  'P1W',
  'Week retry crosses New York fold'
)
equal(
  weekOrigin
    .until(weekEnd, {
      largestUnit: 'week',
      smallestUnit: 'week',
      roundingMode: 'ceil',
    })
    .toString(),
  'P2W',
  'Week retry directed rounding uses shifted upper bound'
)
```

These ISO controls exercise the implementation after its bounded calendar
difference. The Gregorian witness was replayed on Node 26.5.1 using the Bazel
standalone package (SHA-256
`01ff9950d7bdb854481e3af92ab1340e87da791d576531490ed5ace685c14bf0`).
Truncation returned P1W and ceiling returned P2W. Runtime policy stays unchanged.

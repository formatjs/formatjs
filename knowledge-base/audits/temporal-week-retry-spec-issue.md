# Week retry ignores shift across New York's fold

Confirmed mathematical counterexample to rendered comparison, rechecked 2026-11-22. No new runtime defect claimed; current TS/Rust shared engine shifts week correctly. Requested ECMA-262 authority boundary unchanged. Separately published Temporal proposal remains comparison/navigation.

[ComputeNudgeWindow §7.5.33 steps3.f–g](https://tc39.es/proposal-temporal/#sec-temporal-computenudgewindow) use the same week bounds regardless of additionalShift. [NudgeToCalendarUnit §7.5.34 step5.a.ii](https://tc39.es/proposal-temporal/#sec-temporal-nudgetocalendarunit) requires the retried window to bracket destination. Reachable positive week input violates that assertion.

## Literal witness

Use America/New_York, ISO calendar:

- Origin: 2020-10-25T01:30-04:00, UTC05:30, epoch1603603800000000000ns.
- Destination: 2020-11-01T01:00-05:00, UTC06:00, epoch1604210400000000000ns.
- Origin plus six calendar days: Oct31 01:30-04:00, epoch1604122200000000000ns.
- Origin plus one week, compatible: Nov1 first01:30-04:00, epoch1604208600000000000ns.
- Origin plus two weeks: Nov8 01:30-05:00, epoch1604817000000000000ns.

These offsets follow [IANA tzdb2026f northamerica](https://data.iana.org/time-zones/tzdb-2026f/northamerica), US rules lines179–180 and America/New_York lines323–328. DST ends at02:00 on first November Sunday; Nov1 2020 repeats01:00–01:59. Compatible chooses earlier occurrence for Nov1 01:30.

The unrounded date target borrows one local day because destination clock01:00 precedes origin clock01:30. Oct31 anchor is before destination; no overshoot adjustment applies. Result date prefix is0weeks6days with remaining24h30m. Week truncation count is0.

Initial bounds are [0weeks,1week]. Destination exceeds upper endpoint by1800000000000ns, so retry is required. Published additionalShift=true produces identical bounds. Its bracket assertion fails. No retained year/month prefix, zero-component-prefix inconsistency or arbitrary timezone provider is needed.

Current source shifts to [1week,2weeks]. Signed span608400000000000ns (169h), distance1800000000000ns (30m). Trunc/floor/half modes select P1W; ceil/expand select P2W. `since` uses same anchor: trunc/ceil/half modes select -P1W; floor/expand select -P2W.

## Source and minimal public control

Reviewed implementation ranges (source versions retained in the audit manifests):

- `packages/temporal/zoned-date-time.ts:515-568`: local clock borrow, date until and exact remainder.
- `packages/temporal/date-core.ts:882-1063`: week count, signed window check and one increment retry.
- `crates/temporal/calendar_difference.rs:107-167`: same unrounded decomposition.
- `crates/temporal/calendar_difference.rs:168-325`: same week retry.

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

No test executed here. These are preservation controls for handled behavior, not a failing-runtime claim. Parent owns execution/integration. Do not change runtime to repeat invalid published window.

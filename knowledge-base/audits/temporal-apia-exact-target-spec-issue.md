# Apia exact target collapses the final day window

At noon on January 1, 2012 in Pacific/Apia, subtracting either one or two
calendar days lands on December 31 at noon. IANA skipped December 30 by
changing the active offset from −10h to +14h. Compatible resolution sends the
missing December 30 noon to December 31 noon. The origin is
`1325368800000000000n` and both endpoints are `1325282400000000000n`.
[Shipped tzdb 2026f](https://data.iana.org/time-zones/tzdb-2026f/australasia).

With that common endpoint as the target, ordinary Gregorian date difference
gives −1 day and zero time. The literal ISO path stalls before rounding. The
ISO public replay below uses the implementation’s bounded date difference.
[ISO nontermination proof](temporal-isodatesurpasses-zero-month-spec-issue.md). The day branch of §7.5.33 steps 4.b–f and 8–12 builds the −1 and
−2 day endpoints. Their equality with the target satisfies the inclusive
backward bracket in §7.5.34 step 6.a, so there is no retry. The distinctness
assertion in step 13 fails. Step 14 would divide 0 by 0 and therefore supplies
no mathematical progress to step 17. This witness differs from the existing
10:00 target, which lies outside the initial collapsed window and requests a
retry. The published text supplies no result for the exact-target case.
[§7.5.33](https://tc39.es/proposal-temporal/#sec-temporal-computenudgewindow)
[§7.5.34](https://tc39.es/proposal-temporal/#sec-temporal-nudgetocalendarunit).

Current FormatJS picks the exact first endpoint before distance arithmetic.
The TypeScript and Rust rounders return −1 day, and their total paths validate
the second endpoint before returning −1. These observations record FormatJS's
current behavior while the published assertion remains unresolved.
[TS unrounded decomposition](../../packages/temporal/zoned-date-time.ts#L545)
[TS rounding](../../packages/temporal/date-core.ts#L1035)
[Rust rounding](../../crates/temporal/calendar_difference.rs#L263)
[TS total](../../packages/temporal/relative-duration.ts#L198)
[Rust total](../../crates/temporal/relative_duration.rs#L77).

Run this with the FormatJS Temporal namespace:

```js
const origin = new Temporal.ZonedDateTime(1325368800000000000n, 'Pacific/Apia')
const target = new Temporal.ZonedDateTime(1325282400000000000n, 'Pacific/Apia')
for (const days of [1, 2]) {
  console.log(origin.subtract({days}).epochNanoseconds) // 1325282400000000000n
}
for (const roundingMode of [
  'ceil',
  'floor',
  'expand',
  'trunc',
  'halfCeil',
  'halfFloor',
  'halfExpand',
  'halfTrunc',
  'halfEven',
]) {
  const options = {largestUnit: 'day', smallestUnit: 'day', roundingMode}
  console.log(origin.until(target, options).toString()) // '-P1D'
  console.log(origin.since(target, options).toString()) // 'P1D'
}
for (const days of [-1, -2]) {
  const duration = Temporal.Duration.from({days})
  console.log(duration.total({relativeTo: origin, unit: 'day'})) // -1
  console.log(
    duration
      .round({
        relativeTo: origin,
        largestUnit: 'day',
        smallestUnit: 'day',
      })
      .toString()
  ) // '-P1D'
}
```

All listed results reproduced in Node 26.5.1 by installing the existing
Bazel opt `typescript-hermes-payload.js` through `vm.runInThisContext`
and verifying the global namespace changed. Artifact SHA256 is
`6dfc4db43c6d2c1c730a5691ffceb3e4e35f84e61561e7d586a48ab2921f527e`.
This artifact predates audit checkpoint `63a94b021` and provides observed
corroboration of the current source analysis. Node's built-in Temporal, with
tzdb 2026b, agrees on the endpoints and throws a non-finite-value RangeError
for each of the tested rounding and total calls. That divergence is an
observation, since the comparison assertion already fails.

The shared oracle now covers both the 10:00 nonexact target and the noon exact
target. It checks the common endpoint, all nine exact `until` and `since` modes,
and exact `Duration.round` and `Duration.total` for both original day counts.
The TypeScript zoned-difference and native Hermes zoned targets both pass.
This verifies the implementation's exact-endpoint policy on both backends.
The published assertion remains unresolved.
[Shared oracle](../../packages/temporal/tests/zoned-arithmetic-oracle.ts#L292).

For nonexact windows, exact arithmetic gives progress in [0,1] given a
nonzero signed span and final bracketing. For fixed-clock zoned day increment
one, finite closure still requires checking transition cells where compatible
gap/fold resolution alters the endpoints. Bind that check to actual shipped
transition and recurring-rule data and the owner's unrounded day selection.
Cover both signs, exact boundaries and the strict retry guards. The near-limit
timezone certificate and the single repaired Apia retry leave those
nonexact-window premises open.

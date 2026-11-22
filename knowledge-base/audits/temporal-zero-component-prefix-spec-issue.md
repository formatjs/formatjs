# Zero rounded component with a retained calendar prefix

Open published-proposal comparison issue, 2026-11-22. Requested ECMA-262
snapshot lacks Temporal API chapters; Temporal references remain comparison only.
No runtime policy change adopted. Separate from reverse-fold, skipped-date retry
and Casey assertions.

## Ordinary witness

```js
Temporal.Duration.from('P1M').round({
  relativeTo: '2020-01-01',
  largestUnit: 'month',
  smallestUnit: 'week',
})
```

The UTC-zoned counterpart uses `2020-01-01T00:00[UTC]`. Origin is January 1;
exact destination is February 1. Source resolves the complete retained prefix:
a = February 1, b = February 8. After validating both, it returns P1M.
No transition or supported-range boundary is involved.

Native Node v26.5.1 returns P1M1W for both inputs. These observations support the
comparison below; they are not adopted expected-value tests.

## Numbered derivation

[ComputeNudgeWindow §7.5.33 steps 3.a–i](https://tc39.es/proposal-temporal/#sec-temporal-computenudgewindow)
produce r1 = 0, r2 = 1, StartDuration = P1M and EndDuration = P1M1W.
Step 7.a uses original January 1 for StartEpochNs because r1 is zero.
Steps 9–12 resolve EndEpochNs to February 8. StartDuration itself lands on
February 1, so the returned duration and coordinate describe different starts.

[NudgeToCalendarUnit §7.5.34 steps 14–23](https://tc39.es/proposal-temporal/#sec-temporal-nudgetocalendarunit)
then compute progress 31/38 for destination February 1. Default halfExpand
chooses r2 and returns P1M1W. This reproduces Node's result. The suspected defect
is using the rounded component alone to recognize an empty start prefix.
No independent universal duration-identity rule is assumed here.

[Duration.round §7.3.20](https://tc39.es/proposal-temporal/#sec-temporal.duration.prototype.round)
reaches this comparison through the plain/zoned relative branches. Wider Node
observations include P1Y becoming P1Y1M for year/month rounding, and UTC-zoned P1M
becoming P1M1D for month/day rounding. However, native until callers can return
P1Y for the corresponding exact-year span. Those callers were not fully mapped
in this issue; do not project Duration.round observations onto all differences.

## Audit decision

TS shared irregular rounding, Rust calendar_difference and Duration's special
week route resolve the complete retained prefix. Preserve that behavior pending
clarification of intended coordinates and requested Temporal authority. This
leaves literal comparison equivalence open; it is not a complete rounding proof.
Provider progress, retries, bubbling and range behavior remain separate.

Potential upstream question: should the origin shortcut require the complete
StartDateDuration to be zero? No upstream issue filed or amendment adopted.
The exact-week boundary correction remains valid independently: the required
second endpoint must be checked before an exact result returns.

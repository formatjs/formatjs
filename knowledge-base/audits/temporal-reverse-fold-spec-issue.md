# Reverse-fold intermediate instant

Confirmed implementation divergence from the published comparison,
reviewed 2026-11-22. Requested
ECMA-262 lacks Temporal API chapters; proposal references here do not adopt a
replacement authority. No runtime change or disputed-value regression.

In America/New_York, start at 2020-11-01T01:00-05:00 (later occurrence,
1604210400000000000 ns). Target 2020-10-31T01:30-04:00 is
1604122200000000000 ns. Physical difference is −24h30m.
Compatible resolution of the start's local 01:00 instead chooses the earlier
occurrence at 1604206800000000000 ns.

[DifferenceZonedDateTime §6.5.6](https://tc39.es/proposal-temporal/#sec-temporal-differencezoneddatetime)
step 4's same-date shortcut does not apply. Steps 5–9 set backward correction
sign +1 and dayCorrection 1. Step 11.a chooses target date plus one day: Nov 1.
Steps 11.b–11.c combine it with original 01:00 and resolve compatible, selecting
05:00Z rather than actual start 06:00Z. Step 11.d therefore produces −23h30m;
step 14 gives zero date fields. The result is pure-time -PT23H30M.
[§6.5.7 step 3](https://tc39.es/proposal-temporal/#sec-temporal-differencezoneddatetimewithrounding)
returns it without nudge for nanosecond/increment 1.

[AddZonedDateTime §6.5.5 step 1](https://tc39.es/proposal-temporal/#sec-temporal-addzoneddatetime)
requires exact Instant arithmetic when date fields are zero. Adding that result
to the actual start lands at 1604125800000000000 ns, one hour after target.
The different add-back result helps explain the current implementation policy.
No separate normative universal add-back requirement has been established.
The literal algorithm is executable on this witness, so the ledger records
an open implementation divergence alongside the comparison-policy question.

Inspected TS unroundedZonedDifference and Rust RelativeAnchor::endpoint reuse
public addition for intermediate date fields. Zero date addition preserves the
later-fold instant and yields -PT24H30M here. This preserves elapsed time/add-back,
but differs from the literal published comparison. NudgeToZonedTime independently
resolves compatible endpoints even for zero date fields, so its construction is
also a separate obligation. Do not globally change zero-date public addition:
that would contradict §6.5.5 step 1.

Read-only native Node v26.5.1 comparison returns -PT23H30M for both nanosecond and
minute smallest units, and adding it back produces the same one-hour discrepancy.
That observation corroborates the derivation; native output is not spec authority
or an adopted FormatJS expectation.

The packaged polyfill and Node v26.8.1 both preserve the later fold occurrence
on zero-duration addition. Both give -PT30M for a same-local-date difference
from the later occurrence to 1604208600000000000 ns, exercising §6.5.6 step 4.
For the distinct-date witness above, the polyfill returns -PT24H30M and native
returns -PT23H30M. A difference-only compatible probe can implement step 11.c
while preserving both controls. Review every attempted probe and its range
handling before applying such a change.

Keep difference/nudge intermediate construction, intended invariant and requested
Temporal authority unresolved. No implementation signoff or upstream filing.

## Same-date clock rounding

The clock carry has an independent confirmed comparison divergence.
Havana's later 2020-11-01 midnight at −05:00 and its 23:15 endpoint are
on the same local date. Both native Node 26.8.1 and FormatJS compute an
unrounded 23h15m difference. Ceiling to hours with largest unit day
returns `P1D` in FormatJS and `PT24H` in native Node. They add back to
the same instant. The earlier −04:00 occurrence returns `P1D` on both.

In the synthetic replay, offsets +1h, zero and +0.5h apply before
epoch −0.5h, from −0.5h to +22h, and from +22h onward. The origin
is the later midnight at epoch zero and the target is epoch +23.25h.
Same-date elapsed subtraction gives +23.25h before any nudge. Both day
spans are positive. Step 5 chooses the compatible earlier midnight
at epoch −1h, giving a 24.5h day span and a clock-only `PT24H` result.
The literal intermediate nudged epoch is +23h. Public addition of that
duration to the actual origin lands at +24h. FormatJS keeps the actual
origin, sees a 23.5h day span, carries to `P1DT1H`, and lands at +24.5h.

This witness reaches the clock carry without the reverse-date probe or
a failed day-span assertion. It leaves the choice of published behavior
and actual-receiver anchoring open.
[Comparison §7.5.35 step 5](https://tc39.es/proposal-temporal/#sec-temporal-nudgetozonedtime).
[Pinned replay](temporal-timezone-boundary-proof/owned-wide-rounding-replay.mjs#L496).

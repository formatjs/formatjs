# Reverse-fold intermediate instant

Unresolved published-comparison inconsistency, reviewed 2026-11-21. Requested
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
This is arithmetic tension between the specified algorithms; a separate normative
universal add-back requirement has not been established here.

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

Keep difference/nudge intermediate construction, intended invariant and requested
Temporal authority unresolved. No implementation signoff or upstream filing.

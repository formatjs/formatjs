# Zero-month ISO date difference cannot terminate in rendered comparison

Checked 2026-11-22 against the live rendered Temporal comparison. Requested
ECMA-262 authority remains unchanged; it contains no Temporal API chapter in the
checked snapshot. This is a separately recorded comparison-text defect, not an
adopted runtime policy or a completed Temporal API clause.

## Clauses and minimal witness

[§3.5.6 ISODateSurpasses](https://tc39.es/proposal-temporal/#sec-temporal-isodatesurpasses),
step 5, returns false whenever months=0. That shortcut runs before the operation
considers nonzero weeks or days in steps 9–13.
[§12.3.9 CalendarDateUntil](https://tc39.es/proposal-temporal/#sec-temporal-calendardateuntil)
step 3.j repeats while that predicate is false; its week loop at step 3.g uses
the same predicate.

Take ISO one=1970-01-01, two=1970-01-02, largestUnit=day:

1. CalendarDateUntil steps 1–3.a produce positive direction.
2. Years, months and weeks remain zero. Step 3.i starts candidateDays=1.
3. In ISODateSurpasses, step 4 compares unchanged January 1 against January 2;
   it does not surpass the target.
4. Step 5 returns false because months=0, regardless of candidateDays.
5. CalendarDateUntil step 3.j increments candidateDays and repeats. Steps 3–4
   above stay identical for every candidate: the loop never terminates.

At candidateDays=2 the intended added date is January 3, beyond January 2, yet
its predicate still returns false. This finite two-candidate trace demonstrates
the defect without executing an unbounded literal loop. largestUnit=week gets
stuck in step 3.g for the same reason, before residual days are calculated.
Reverse direction has the analogous problem.

## Current implementation and evidence

The source directly computes bounded epoch-day residuals and truncated whole
weeks; it terminates with one residual day for this pair. Existing
[arithmetic difference controls](../../packages/temporal/tests/arithmetic-calendar.test.ts#L79)
include origin epoch day0, displacement+1 and−1, and both day/week largest units.
They require common sign and exact add-back across arithmetic calendars. The
owning arithmetic-calendar gate passes in this review; this is existing executable
coverage, not a claim that a literal infinite specification loop was run.

No runtime change should reproduce nontermination. No test exclusion or baseline
change is justified. Full CalendarDateUntil correspondence remains under audit.

## Resolution to clarify

Step 5 must not discard nonzero weeks/days. Removing that early shortcut, or
restricting it to months=weeks=days=0, would allow existing later comparison steps
to run. This is a proposed textual repair, not an adopted authority change or a
claim that every effect of a revised algorithm has been verified. Recheck the
complete helper and caller algorithm after an authoritative correction.

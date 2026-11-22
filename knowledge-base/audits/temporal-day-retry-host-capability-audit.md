# Day retry and host capability audit

## Exact rebased day endpoints

In the retained-prefix inward retry, the rounded day component can be
zero while timezone displacement puts the retained upper endpoint after
the target. The old seed used one nominal day beyond that bound. Three
exact-data cases need two or three nominal days. They cover increment
three with an already validated nominal endpoint, increment three with
the checked adjacent endpoint and increment two with an endpoint beyond
the original adjacent one. For increment two the exact result is
`P34D` even when that duration's nominal endpoint lands at the maximum
Instant and its resolved target is 27 hours earlier.

Each compatible endpoint moves by less than two days under the exact
provider's shift and offset bounds. Any nominal candidate four or more
signed days beyond the retained upper endpoint is physically after that
endpoint and cannot be a lower bound. The day increment is at least two,
so between the checked seed and that cutoff there is at most one new
candidate, excluding the retained upper endpoint itself. Both engines
probe that candidate and accept it only on the correct side of the
target. A range failure disqualifies an extra probe under the same error
policy as the unrounded difference. The initial adjacent endpoint still
validates before the retry, and failed mandatory lookups still propagate.
[Comparison §7.5.34 steps 5.a.ii and 6.a.ii](https://tc39.es/proposal-temporal/#sec-temporal-nudgetocalendarunit).

## Host timezone capability admission

Own `formatToParts` descriptors may expose FormatJS offset, candidate,
or data-generation hooks. A plain object under any hook symbol previously
looked present and failed when called. The adapter now admits only
callable own data values while continuing to ignore accessors. The native
Intl path returns Kathmandu's +05:45 offset in the regression. This
verifies capability admission and retains the four open exactness
conditions for unbound Intl profiles.
[ECMA-262 §7.2.3 step 2](https://tc39.es/ecma262/#sec-iscallable).
[Capability reader](../../packages/temporal/host-timezone.ts#L64).
[Host regressions](../../packages/temporal/tests/host-timezone.test.ts#L147).

## Exact helper locations

All five formerly enclosing anchors now point directly to their callbacks.
The installer has a separate anchor for its property definition.

| Row | Exact comment                                                             | Local scope                                                                                   |
| --- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 588 | [calendar.ts:502](../../packages/temporal/calendar.ts#L502)               | Detects a negative value in the prepared four-field date duration.                            |
| 589 | [calendar.ts:507](../../packages/temporal/calendar.ts#L507)               | Detects a positive value in the prepared four-field date duration.                            |
| 600 | [compact-timezone.ts:54](../../packages/temporal/compact-timezone.ts#L54) | Orders compact transition rows for named offset lookup.                                       |
| 684 | [host-timezone.ts:312](../../packages/temporal/host-timezone.ts#L312)     | Existing comparator directly orders collected exact candidate nanoseconds.                    |
| 691 | [install.ts:19](../../packages/temporal/install.ts#L19)                   | Defines the selected global namespace and its property attributes with the runtime operation. |
| 692 | [install.ts:56](../../packages/temporal/install.ts#L56)                   | Supplies the installed Instant constructor to the Date bridge.                                |

[Packaged day regression](../../packages/temporal/tests/host-candidate-range.test.mjs#L558).
[Rust day regression](../../crates/temporal/lib.test.rs#L4236).

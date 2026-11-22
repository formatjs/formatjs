# Zoned clock rounding with raw offsets

Reviewed 2026-11-21. Scope: the integer offset passed from TS clock rounding to
local-time resolution. Requested ECMA-262 snapshot has no Temporal API chapters;
the separately published [proposal §6.3.39 steps 20.b–c](https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.round)
is comparison/navigation only. The [whole-method matrix](temporal-zoned-round-contract-audit.md)
records every compared branch and unresolved dependencies. Those steps obtain the original integer offset
and interpret rounded fields with prefer/exact matching. No authoritative API
section completion or historical line credit is added.

## Removed representation round trip

Previously clock rounding called offsetText, then the string resolver parsed its
result. Valid offsets survived that BigInt format/parse round trip exactly; this
was not a Number precision defect. It nevertheless introduced observable String,
padStart, replace and RegExp operations into a private numeric calculation.

[Raw offset acquisition:975](../../packages/temporal/zoned-date-time.ts#L986)
now obtains the original bigint directly. [Resolution:979](../../packages/temporal/zoned-date-time.ts#L990)
passes it with the rounded local coordinate, prepared kernel and ISO fields to
the extracted integer resolver. No Number or Decimal conversion is introduced.

## Preserved contracts

- [String wrapper:282](../../packages/temporal/zoned-date-time.ts#L282) still
  prepares kernel and ISO fields first, handles Z/undefined/ignore, then parses
  the supplied offset before dispatch. Existing string callers keep syntax,
  coercion and rejection ordering. Their interface is unchanged.
- [Integer resolver:305](../../packages/temporal/zoned-date-time.ts#L305) retains
  use handling, the lower local-date guard, ordered candidate lookup, exact or
  minute comparison, reject handling and compatible fallback. Its arithmetic
  body is unchanged. [Offset matching proof](temporal-zoned-offset-match-audit.md)
  remains conditional on valid, complete provider candidates.
- In the changed TS clock branch, local projection reads the original offset
  once. The explicit raw acquisition remains the second read, after local
  rounding and before interpreting rounded fields. Kernel lookup and ISO-field
  construction retain their order. Public option validation precedes both.
- Snapshot profiles return through native round before entering the TS clock
  branch. NativeTemporal requires roundZonedDateTime; an absent direct fast
  capability uses the generic native operation, not TS fallback. Therefore the
  cached offsetText shortcut cannot remove a read in this changed TS branch
  under a stable installed backend. Native rounding remains unchanged.
- Identity rounding, day rounding, fresh result construction and final Instant
  bounds retain their existing paths. The documented repeated-date assertion
  and lower local-date range policy remain open. No arbitrary malformed-provider
  or reentrant backend mutation contract is signed off.

## Public evidence

Five public controls fail before correction and pass afterward. They replace
global String, String.prototype.padStart/replace and RegExp.prototype.test/exec
individually after creating the receiver. UTC and historical Monrovia receivers
at epoch 1 ns round to literal epoch 0 ns. Monrovia's seconds-bearing offset
exercises the former replace branch. Each case verifies increment, mode and unit
getter order; mutations restore before assertions.

Public offset string getters and general ISO/calendar parsing remain separate.
No new specification issue is claimed.

## Validation

All four focused gates pass (two executed, two cached): zoned regressions,
owning test typecheck, Temporal typecheck and kernel tests. All eleven expanded
tests and Temporal/DurationFormat assemblies pass. A shared zoned field-parity
control also checks a 20-minute halfEven tie. All three final owning gates pass
(two executed, one cached), including native Hermes. No baselines, exclusions or timeout changes.

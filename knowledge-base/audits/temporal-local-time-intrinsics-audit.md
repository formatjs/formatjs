# Temporal local-time conversion hooks

Reviewed 2026-11-21 against [ECMA-402 §11.5.11](https://tc39.es/ecma402/#sec-tolocaltime).
Scope is conversion used by Temporal formatting, not a general Intl audit.

## Contract and correction

Step 3 adds mathematical epoch nanoseconds and offset nanoseconds. It does not
call public Number/String functions or iterate a JavaScript array. The local
adapter previously performed those extra lookups while preparing calendar fields.

- [ToLocalTime:102](../../packages/ecma402-abstract/DateTimeFormat/ToLocalTime.ts#L102)
  now uses captured `numberFrom`. Supported Temporal instants floor to integer
  milliseconds within the safe-integer range; this conversion is exact there.
- [Safe-integer branch:110](../../packages/ecma402-abstract/DateTimeFormat/ToLocalTime.ts#L110)
  uses captured `numberIsSafeInteger`. A replacement cannot redirect the branch.
  The existing exact-addition/floor argument remains in the
  [precision audit](temporal-local-offset-precision-audit.md).
- [Named-zone result:57](../../packages/ecma402-abstract/DateTimeFormat/ToLocalTime.ts#L57)
  and [local result:103](../../packages/ecma402-abstract/DateTimeFormat/ToLocalTime.ts#L103)
  use own indexed tuple reads. Dense private tuples need no public Array iterator.
- [Fractional path:114](../../packages/ecma402-abstract/DateTimeFormat/ToLocalTime.ts#L114)
  passes the original BigInt through captured ToString to Decimal. This preserves
  the epoch digits; it does not establish intrinsic isolation inside Decimal.

The public path is Temporal Instant branding, ToDateTimeFormattable, pattern/range
partitioning, then ToLocalTime. Tests use an actual branded `Temporal.Instant(-1n)`
and all four DateTimeFormat rendering methods. Ordinary object-input getters and
coercions retain their separate public contracts.

## Evidence and limits

Three new direct controls failed before correction: global Number replacement,
Number.isSafeInteger replacement and Array iterator replacement. Each preserves
the full local record for both a fixed offset and named UTC after correction.
Inputs and expected records are prepared before mutation; descriptors are
restored before assertions. Existing fractional-offset cancellation and signed
Gregorian boundary controls remain unchanged.

Public iterator isolation is not signed off: brand-reader and result loops have
other iterator lookups. The fractional Decimal path also has mutable operations
inside its dependency. Non-Instant Temporal bridge conversions, named-zone data
policy, non-Gregorian providers and complete public algorithms remain open.
No historical Temporal chapter line credit or new specification issue follows
from this correction.

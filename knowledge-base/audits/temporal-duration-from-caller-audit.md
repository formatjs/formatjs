# Duration.from field-bag conversion

Reviewed 2026-11-21. Bounded caller evidence, not complete Temporal clause
signoff. The requested ECMA-262 snapshot lacks Temporal API chapters; historical
operation names remain navigation only. Numeric conversion follows
[ECMA-262 §7.1.4 ToNumber](https://tc39.es/ecma262/#sec-tonumber).

## Dispatch and ordered conversion

[Duration.from:199](../../packages/temporal/duration.ts#L199) calls
[toDurationFields:87](../../packages/temporal/duration.ts#L87). Branded slots
bypass public getters; strings enter the separately reviewed parser. Other
inputs enter [toNativeDurationFields:94](../../packages/temporal/duration.ts#L94).
IsObject rejects other primitives while accepting callable/host objects. Field
bags undergo no top-level ToPrimitive.

Ordinary Get includes inherited properties, in this order: days, hours,
microseconds, milliseconds, minutes, months, nanoseconds, seconds, weeks, years.
Each defined value immediately enters
[integralDurationNumber:111](../../packages/temporal/duration-core.ts#L111):
unary plus performs ToNumber; integer validation rejects nonintegral/nonfinite
results; zero normalization removes negative zero. Undefined remains absent;
at least one defined field is required. Getter/coercion abrupt completions
propagate before later reads. After conversion,
[validateDuration:88](../../packages/temporal/duration-core.ts#L88) checks signs
and bounds. Allocation creates a fresh intrinsic Duration.

## Public controls and remaining work

New controls assert inherited getter receivers, exact Get/coercion interleaving
with number hints, no whole-bag Symbol.toPrimitive, original abrupt exception
identity with no later reads, and undefined versus null/positive/negative zero.
The existing branded-copy test already bypasses an own throwing seconds getter;
that case is not duplicated. No runtime defect was found in this slice.

Pending #8055 covers partialDuration/Duration.with, a different loop; #8056
compare bounds does not establish this caller contract. Typed Rust Duration::new
accepts numeric fields and cannot establish JavaScript Get/coercion ordering.

All six conversion gates pass (four executed, two cached): public Duration
controls/typecheck, typed Rust offset tests, shared zoned controls/typecheck and
native Hermes source/bytecode. Duration field-bag controls execute in TS; typed
Rust offsets and the shared zoned controls do not establish native JavaScript
field-bag ordering. No runtime source changed.

Complete type/realm/allocation, arithmetic/range and parser
contracts retain separate status. No new historical line or Temporal chapter
credit, baseline change or specification issue.

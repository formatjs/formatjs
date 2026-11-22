# Duration private totals and field selection

Reviewed 2026-11-21. Scope: exact-ratio conversion used by Duration.total and
private field selection used by fixed-precision Duration.toString/round.
Relevant published dependencies are [ECMA-262 §6.1.6.1 Number](https://tc39.es/ecma262/#sec-ecmascript-language-types-number-type)
and [§21.2.3.3 BigInt.prototype.toString](https://tc39.es/ecma262/#sec-bigint.prototype.tostring).
This is not complete Temporal API signoff; the requested ECMA-262 snapshot lacks
those chapters. No historical line credit is added.

## Observable hooks

[Bit lengths:258](../../packages/temporal/duration-core.ts#L258) now invoke captured
BigInt.prototype.toString through captured Reflect.apply. Primitive BigInt
receivers and radix 2 need no user coercion. The fresh argument array has own
indices; no iterator is consulted. Capture occurs before untrusted post-import
mutation, matching the package's initialization contract.

[largestDurationField:241](../../packages/temporal/duration-core.ts#L241) now scans
the private dense field-name array by index. First nonzero field wins; zero falls
back to index 9. This preserves the former findIndex result without looking up
Array.prototype.findIndex. Public field-bag getters/coercions run before these
private records are used and retain their separate contracts.

The public paths are [total:367](../../packages/temporal/duration.ts#L367) and
[fixed-precision stringification:405](../../packages/temporal/duration.ts#L405).
Two public regressions failed before correction: BigInt.toString mutation during
total and findIndex mutation during stringification. A separate Reflect.apply
control also passes. Expected totals cover signed 1 ns/day, half-even ties at
2**53 + 1 and 2**53 + 3 nanoseconds, and maximum-duration significand carry.
Formatting controls cover automatic/nine-digit paths, negative floor, unbalanced
minute/second carry and zero. Descriptors restore before assertions.

## Exact-ratio rounding

[durationTotalNumber:251](../../packages/temporal/duration-core.ts#L251) converts
integer N divided by positive integer D. Zero returns positive zero. For A=abs(N)>0,
let L=bitLength(A)-bitLength(D). The exact exponent e=floor(log2(A/D)) is L or L-1;
the integer shift comparison selects it exactly.

With s=52-e, shifted integer division produces q=floor((A/D)_2**s), where
2**52 <= q < 2**53. Comparing twice the remainder with the denominator selects
nearest rounding; an exact tie increments only odd q. Rounded q is at most
2**53 and remains exactly representable as Number. Scaling by 2_*(e-52) introduces
no second rounding for normal results: the scaled rounded significand is already
a binary64 value. q=2**53 carries naturally. Restoring the sign gives symmetric
nearest-even rounding.

[Rust rational_to_f64:257](../../crates/temporal/duration.rs#L257) uses the same
integer quotient/remainder rule, carries q=2**53 explicitly and constructs the
binary64 bits.

## Caller bounds and open obligations

The fixed-unit path supplies 0<abs(N)<2**53\*10**9<2**83 and
1<=D<=86,400,000,000,000<2**47. Nonzero ratios have -47<=e<=82, excluding
subnormal, underflow and overflow cases. This proof assumes the supplied integer
nanosecond sum is exact; it does not establish every caller's intermediates.

[Relative totals](../../packages/temporal/relative-duration.ts#L183) use fixed
divisors or a positive endpoint span. Under existing endpoint and bracketing
validation, supported endpoints have magnitude below 2**73, spans below 2**74,
and bounded calendar counts. A nonzero integer ratio then has e>=-74. Full
calendar/zone endpoint, count, multiplication and bracketing proofs remain open.

For Rust, D<2**74 keeps normalized numerator below 2**127; shifted denominator
and doubled remainder also fit u128. Arbitrary positive i128 divisors are outside
this proof: tiny N and D near 2**126 can require an oversized shift. Zero/negative
divisors are outside the reviewed contract.

All twelve relevant gates pass (eight executed, four cached), including five
Duration backends, precision oracles, relative/zoned consumers and Rust core.
Temporal and DurationFormat assemblies pass. No baseline, exclusions or timeout
changes. Complete Duration operations, other dynamic lookups and precision before
rounded-difference construction remain open.

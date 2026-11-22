# Primitive Number conversion and duration integrality

Reviewed 2026-11-21 against published ECMA-262 and ECMA-402 dependency sections.
Temporal chapter selection remains open. This reviews shared helper contracts;
it does not sign off full formatter input conversion or Temporal callers.

## Defect and fix

The ToNumber adapter performed native unary-plus conversion, then wrapped its
result in Decimal. Its sole production caller, DurationFormat's
ToIntegerIfIntegral, converted that private object back to Number after checking
Decimal methods. Decimal construction could call mutable Number.isNaN, Object.is
or BigInt even after the public argument was already a Number. These extra hooks
could throw between consecutive duration field Gets. Public format and
formatToParts controls reproduced the altered failure and access order.

ToNumber now returns the primitive Number directly. ToIntegerIfIntegral checks
captured Number.isInteger, throws captured RangeError when needed, and normalizes
zero. The internal ecma262-abstract library consequently has no Decimal dependency.
Decimal arithmetic elsewhere retains its existing ownership and audit status.

The native bridge's [separate Number alias](../../packages/temporal/native.ts#L93)
does not call this helper. Its [clock result conversion](../../packages/temporal/native.ts#L546)
intentionally accepts a BigInt reduced to the nonnegative sub-day interval,
whose upper bound is below 2^53. Number constructor conversion is appropriate
there; the public abstract operation must reject BigInt. Broader native transport
validation retains its existing audit status.

## ECMA-262 §7.1.4 ToNumber

[ToNumber.ts:3](../../packages/ecma262-abstract/ToNumber.ts#L3) uses unary plus.
[§13.5.4.1 step 2](https://tc39.es/ecma262/#sec-unary-plus-operator-runtime-semantics-evaluation)
delegates directly to the engine's ToNumber operation. Evaluating the local
parameter and getting its binding value adds no input property access.
The TypeScript assertion is erased. No mutable Number constructor is called.

Every [§7.1.4](https://tc39.es/ecma262/#sec-tonumber) step therefore uses engine
semantics at that source line:

| Step | Requirement                                                                                                      |
| ---- | ---------------------------------------------------------------------------------------------------------------- |
| 1    | Return a Number input unchanged, preserving NaN, both zero signs and infinities.                                 |
| 2    | Reject primitive Symbol and BigInt with intrinsic TypeError. Number(value) would incorrectly accept BigInt here. |
| 3    | Undefined becomes NaN.                                                                                           |
| 4    | Null and false become positive zero.                                                                             |
| 5    | True becomes one.                                                                                                |
| 6    | Delegate Strings to StringToNumber, including numeric grammar and binary64 rounding.                             |
| 7    | Remaining inputs are Objects, including undetectable host Objects.                                               |
| 8    | Invoke ToPrimitive once with numeric hint, preserving getter/call order, receiver and abrupt completions.        |
| 9    | The primitive result is not an Object; invalid object coercion already throws.                                   |
| 10   | Recursively convert that primitive, including rejection of BigInt/Symbol results from object hooks.              |

String grammar and conversion under
[§7.1.4.1](https://tc39.es/ecma262/#sec-tonumber-applied-to-the-string-type)
are delegated, not reimplemented. Controls cover binary/octal/hex strings,
non-ASCII whitespace and line terminators, invalid separators/BigInt suffixes,
invalid signed hexadecimal, overflow, signed underflow and rounding beyond the
safe integer range. Existing tests preserve exact user exceptions from all
coercion hooks and check numeric hint/count.

## ECMA-402 §13.5.2 ToIntegerIfIntegral

| [Published requirement](https://tc39.es/ecma402/#sec-tointegerifintegral) | Code and reasoning                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Step 1: ToNumber once                                                     | [ToIntegerIfIntegral.ts:9](../../packages/ecma402-abstract/DurationFormat/ToIntegerIfIntegral.ts#L9) calls the primitive helper. User exceptions and BigInt/Symbol TypeErrors propagate unchanged.                                                                                         |
| Step 2: require an integral Number                                        | [Lines 10–11](../../packages/ecma402-abstract/DurationFormat/ToIntegerIfIntegral.ts#L10) use captured Number.isInteger and realm RangeError. NaN, infinities and finite nonintegral Numbers reject.                                                                                        |
| Step 3: return the mathematical value                                     | [Line 13](../../packages/ecma402-abstract/DurationFormat/ToIntegerIfIntegral.ts#L13) maps either zero sign to positive zero. Every other accepted finite Number already represents an exact integer, including values beyond the safe integer range. No safe-integer restriction is added. |

The predicate's [ECMA-262 §21.1.2.3](https://tc39.es/ecma262/#sec-number.isinteger)
contract is exactly the required integral-Number test. Capturing it before user
conversion avoids observing a replacement installed during field coercion.
The mathematical integer remains represented by its corresponding Number in
the formatter record; no additional object conversion occurs.

## Evidence and limits

[262.test.ts](../../packages/ecma402-abstract/tests/262.test.ts) checks primitive
return types and values, signed zero, string grammar boundaries, fractional and
nonfinite rejection, huge finite integers, BigInt/Symbol rejection and three
mutable numeric helpers. Existing coercion exception and hint/count tests now
assert primitive results. Eleven helper regressions failed before the fix.

[DurationFormat tests](../../packages/intl-durationformat/tests/index.test.ts)
check that a valid days conversion reaches the throwing hours getter without
an extra Number.isNaN call. Both public methods preserve the exact thrown value
and ordered Gets. This public regression also failed before the fix.
[Native Hermes controls](../../native/hermes/tests/durationformat.ts)
repeat the contract for TS and Rust-installed formatters, in source and bytecode
modes. Existing formatter exclusions and accepted conformance profiles are unchanged.

This field-conversion evidence does not sign off complete ToDurationRecord,
Temporal namespace registration, branded Duration conversion or private Decimal
uses elsewhere. No new specification inconsistency identified. Historical
Temporal line credits remain unchanged.

Validation: all 124 declared consumer targets pass (74 executed, 50 cached),
including all Temporal class/backend profiles, Node/Hermes controls and Intl
consumers. All five Temporal/Intl package assemblies pass. Standalone and
transitive compiler gates for both changed helper packages are included in the
[checked-in target list](temporal-validation-targets.txt). Gazelle, published
section anchors, source links and ledger integrity pass. Full published-head CI
retains its separate status.

Full-suite, cross-build and native smoke CI subsequently passed for integration
layer #8100 at 2bd58b1a28a1b1f4ae9cf73f3c18cc376b50c1d9; see the
[full-suite invocation](https://formatjs.buildbuddy.io/invocation/b937cefb-1978-4a78-ab80-d1f5617339c2).
Later stack heads require their own CI result.

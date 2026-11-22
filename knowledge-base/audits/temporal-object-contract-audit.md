# Foundation object, array and equality contracts

Reviewed 2026-11-21 against published ECMA-262. This pass maps six foundation
helpers; complete Temporal and formatter callers retain separate audit status.
Captures below occur at module initialization, before user argument hooks.

## ArrayCreate

The old Array.from implementation created own undefined elements instead of
holes for positive lengths, ignored a supplied prototype, and consulted mutable
Array.from and an inherited iterator on its private array-like argument.
It could therefore interrupt Temporal formatToParts during private allocation.

[ArrayCreate.ts:1](../../packages/ecma262-abstract/ArrayCreate.ts#L1) now captures
the realm Array constructor and Object.setPrototypeOf. Its input contract is a
non-negative integer represented as a Number and an optional Object prototype,
matching [§10.4.2.2](https://tc39.es/ecma262/#sec-arraycreate).

| Step                                                           | Code and proof                                                                                                                                                                                                                                                               |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1: enforce maximum length                                      | [Line 6](../../packages/ecma262-abstract/ArrayCreate.ts#L6) delegates to native Array construction. Every valid representable length through 2^32−1 is accepted; greater non-negative integers throw intrinsic RangeError. No array-like object is materialized or iterated. |
| 2: default prototype                                           | Native construction uses captured %Array%. Its prototype property is an immutable data property under [§23.1.2.5](https://tc39.es/ecma262/#sec-array.prototype), so this reads no user getter.                                                                               |
| 3–5: allocate extensible Array exotic object and set prototype | Native allocation at line 6 supplies the Array internal methods. [Line 7](../../packages/ecma262-abstract/ArrayCreate.ts#L7) sets an explicitly supplied Object prototype through the captured intrinsic. Strict undefined comparison retains undetectable host Objects.     |
| 6: own length descriptor                                       | Native allocation creates writable, non-enumerable, non-configurable length with the requested value. Positive lengths retain holes. Defining an indexed element subsequently grows length through Array exotic semantics.                                                   |
| 7: return array                                                | [Line 8](../../packages/ecma262-abstract/ArrayCreate.ts#L8) returns that fresh object.                                                                                                                                                                                       |

Native construction may allocate privately before rejecting an excessive length;
no user operation intervenes. Prototype replacement also acts on an unexposed,
fresh extensible array. Its ordinary chain cannot contain that array yet;
[§10.1.2.1 step 7.c.i](https://tc39.es/ecma262/#sec-ordinarysetprototypeof)
stops the cycle search at a Proxy without calling its GetPrototypeOf trap.
Thus custom prototype application adds no user callback. Null prototypes and
non-integral/negative lengths are outside this abstract operation's input contract.

## SameValue

[SameValue.ts:3](../../packages/ecma262-abstract/SameValue.ts#L3) now uses the
existing pure comparison path directly, removing both mutable Object.is reads.

| [§7.2.9](https://tc39.es/ecma262/#sec-samevalue) requirement | Code and proof                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Step 1: reject different language types                      | Strict equality cannot equate different types. The fallback self-inequality test can succeed only for two Number NaNs. No cross-type coercion occurs.                                                                                                                                                                                                                                                |
| Step 2.a: Number::sameValue                                  | [Lines 3–4](../../packages/ecma262-abstract/SameValue.ts#L3) accept identical nonzero Numbers. For zeros, reciprocal signs distinguish positive and negative zero. [Line 6](../../packages/ecma262-abstract/SameValue.ts#L6) accepts two NaNs and rejects every other unequal Number pair. This covers all five steps of [§6.1.6.1.14](https://tc39.es/ecma262/#sec-numeric-types-number-sameValue). |
| Step 3: SameValueNonNumber                                   | Strict equality implements undefined/null equality, Boolean values, String code-unit equality, BigInt value equality and Symbol/Object identity under [§7.2.11](https://tc39.es/ecma262/#sec-samevaluenonnumber). Reciprocal arithmetic is reached only when both operands are Number zero; BigInt zero and Objects never undergo division or coercion.                                              |

## HasOwnProperty

The parameter annotation now accepts both valid property-key types, String and
Symbol. Runtime behavior retains the captured bound intrinsic at
[HasOwnProperty.ts:1](../../packages/ecma262-abstract/HasOwnProperty.ts#L1).
[§20.1.3.2](https://tc39.es/ecma262/#sec-object.prototype.hasownproperty)
converts its key and receiver before invoking the abstract operation. For this
helper's valid property-key/Object inputs both conversions are identities.

[Line 7](../../packages/ecma262-abstract/HasOwnProperty.ts#L7) therefore delegates
all three [§7.3.12](https://tc39.es/ecma262/#sec-hasownproperty) steps: obtain an own
descriptor, return false when absent, otherwise true. It never reads the property
value or traverses inherited properties. Proxy descriptor traps and invariant
failures retain engine behavior; user-thrown values propagate unchanged.
Existing controls cover replaced hasOwnProperty, call, bind and Reflect.apply.

## ToObject

[ToObject.ts:11](../../packages/ecma262-abstract/ToObject.ts#L11) implements
[§7.1.20 step 1](https://tc39.es/ecma262/#sec-toobject) with strict nullish checks
and captured realm TypeError. [Line 16](../../packages/ecma262-abstract/ToObject.ts#L16)
calls captured %Object% with no NewTarget. Its
[§20.1.1.1 step 3](https://tc39.es/ecma262/#sec-object-value) delegates directly
to ToObject because the earlier nullish constructor branch has been excluded.

Steps 2–6 consequently create fresh Boolean, Number, String, Symbol and BigInt
wrappers with their input slot values and realm prototypes. Steps 7–8 preserve
Object identity, including foreign Objects, functions, revoked Proxies and host
Objects. No ToPrimitive hook or input property access occurs. Existing generic
annotations are unchanged; this review establishes the runtime boxing contract.

## Language-type classification

[Type.ts:16](../../packages/ecma262-abstract/Type.ts#L16) handles null and strict
undefined, then [line 22](../../packages/ecma262-abstract/Type.ts#L22) delegates
Object membership to [IsObject.ts:2](../../packages/ecma262-abstract/IsObject.ts#L2).
The remaining typeof branches cover Number, Boolean, String, Symbol and BigInt.
Together these exhaust the eight language types in
[§6.1](https://tc39.es/ecma262/#sec-ecmascript-language-types). Type is an internal
label helper, not a separately numbered current-spec abstract operation.

IsObject excludes null, accepts ordinary/callable Objects, and retains values
whose typeof is undefined while strict equality distinguishes them from undefined.
That last case preserves Object membership for
[§B.3.6 host Objects](https://tc39.es/ecma262/#sec-IsHTMLDDA-internal-slot).
Classification invokes no input getters, Proxy traps or primitive coercion.

## Evidence and remaining callers

[object-contracts.test.ts](../../packages/ecma262-abstract/tests/object-contracts.test.ts)
covers sparse lengths/descriptors, maximum length, custom Proxy prototypes,
inherited iterator mutation, 361 native SameValue comparisons, primitive wrapper
slots/prototypes/freshness, foreign and revoked Objects, and all type labels.
[Host controls](../../packages/ecma262-abstract/tests/host-exotic.test.ts) cover
undetectable Object identity, Symbol fields and array prototypes using V8's test
Object; this is not a browser document.all run. Own-property controls additionally
cover Symbol keys and exact descriptor-trap exceptions.

Five helper regressions and public Temporal formatToParts / Locale numeric
collation regressions failed before the fix. Node and native Hermes controls
exercise these public paths; ordinary conformance profiles remain unchanged.

Caller inventory: ArrayCreate is used by FormatDateTimeToParts and
FormatNumericToParts; SameValue is used by date-range comparison, relative-time
sign handling and Locale numeric collation. Their facade iteration/appending is
addressed by the [parts-result projection audit](temporal-parts-result-audit.md).
Private-list operations in partition producers remain open.
No complete public algorithm is signed off by this helper review.

Validation: all 135 declared targets pass (85 executed, 50 cached), including
all Temporal backend profiles and the additional Locale/RelativeTimeFormat
consumers. All seven Temporal/Intl package assemblies pass. The foundation suite
has 100 passing cases. Node/Hermes mutation controls, standalone/transitive
compiler gates, Gazelle, source links, published anchors and ledger integrity pass.
Full published-head CI remains separate. No new specification issue found;
historical Temporal source-line credits remain unchanged.

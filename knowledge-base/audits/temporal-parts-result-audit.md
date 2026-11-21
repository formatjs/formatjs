# Single-value formatter parts results

Reviewed 2026-11-21 against published
[ECMA-402 §11.5.7 FormatDateTimeToParts](https://tc39.es/ecma402/#sec-formatdatetimetoparts)
and [§16.5.6 FormatNumericToParts](https://tc39.es/ecma402/#sec-formatnumbertoparts).
Result-projection steps are reviewed here. Partition producers, public
receiver/input conversion and Temporal chapter selection remain open; this is
not full public-method signoff.

## Gaps and shared implementation

Both helpers iterated a private List through Array.prototype[Symbol.iterator]
and appended through Array.prototype.push. Those public hooks could execute
user code during result projection. Native push also used Set for array indices,
allowing an inherited numeric setter to intercept a required own data property.

[CreatePartsArray.ts](../../packages/ecma402-abstract/CreatePartsArray.ts) owns
their identical type/value projection. Its readonly array input models an ordered
dense private List of Records with own type/value fields. It returns a fresh
array of fresh ordinary objects, exposing only those two fields. Range and
duration parts with additional required fields are outside this helper's scope.

The shared boundary makes the actual projection testable under prototype mutation
without mocking either partition producer or running unrelated formatting steps
while hooks are installed. Existing public formatter and native comparisons
exercise the complete composed paths.

## Step mapping

Both published operations have the same five top-level steps.

| Requirement                                                    | Implementation and reasoning                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Step 1: partition input                                        | [FormatDateTimeToParts.ts:12](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimeToParts.ts#L12) calls PartitionDateTimePattern; [FormatNumericToParts.ts:18](../../packages/ecma402-abstract/NumberFormat/FormatNumericToParts.ts#L18) calls PartitionNumberPattern with the private slots adapter. Argument order and exception propagation remain intact. Producer contracts remain open.            |
| Step 2: ArrayCreate(0)                                         | Facades delegate their remaining work at [date-time line 13](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimeToParts.ts#L13) / [numeric line 19](../../packages/ecma402-abstract/NumberFormat/FormatNumericToParts.ts#L19). [CreatePartsArray.ts:13](../../packages/ecma402-abstract/CreatePartsArray.ts#L13) creates the result through the previously reviewed ArrayCreate helper.                 |
| Step 3: start n at zero                                        | [Line 14](../../packages/ecma402-abstract/CreatePartsArray.ts#L14) initializes indexed traversal at positive zero.                                                                                                                                                                                                                                                                                                |
| Step 4: visit Records in order                                 | Lines 14–15 read the private array's own length and dense indices. No iterator lookup or public array method occurs.                                                                                                                                                                                                                                                                                              |
| Step 4.a–c: ordinary part object and own type/value properties | [Line 16](../../packages/ecma402-abstract/CreatePartsArray.ts#L16) creates an object literal per iteration, with the realm Object prototype and own data fields in type/value order. [ECMA-262 §13.2.5.5](https://tc39.es/ecma262/#sec-object-initializer-runtime-semantics-evaluation) supplies object creation and property-definition evaluation, bypassing inherited setters and mutable Object constructors. |
| Step 4.d: own indexed result property                          | Line 16 uses captured data-property creation. Index interpolation uses language ToString on the Number counter, matching ToString(𝔽(n)). Private array indices stay below 2^32, so arithmetic and conversion are exact.                                                                                                                                                                                           |
| Step 4.e: increment n                                          | Line 14 increments once per Record, without skipping or reordering.                                                                                                                                                                                                                                                                                                                                               |
| Step 5: return result                                          | [Line 18](../../packages/ecma402-abstract/CreatePartsArray.ts#L18) returns the array. Empty Lists still produce a fresh array.                                                                                                                                                                                                                                                                                    |

## Data-property creation

[setDataProperty](../../packages/ecma262-abstract/intrinsics.ts#L59) captures
Object.defineProperty and builds a descriptor with a null prototype, own value,
and true writable/enumerable/configurable flags. It invokes that captured
intrinsic at [line 74](../../packages/ecma262-abstract/intrinsics.ts#L74).

For the fresh extensible result array, this implements
[ECMA-262 §7.3.5 CreateDataProperty](https://tc39.es/ecma262/#sec-createdataproperty)
and [§7.3.6 CreateDataPropertyOrThrow](https://tc39.es/ecma262/#sec-createdatapropertyorthrow)
through [§20.1.2.4 Object.defineProperty](https://tc39.es/ecma262/#sec-object.defineproperty).
The target is already an Object, key already a String, and descriptor fields
own data properties. Descriptor conversion cannot reach inherited get/set
accessors. Array exotic DefineOwnProperty updates length while bypassing numeric
setters. Index and part fields have all three flags true; length retains its
standard separate flags.

Projection does not coerce values or copy implementation metadata. Repeated
source references produce distinct part objects. Frozen inputs remain unchanged.

## Evidence and remaining producers

[CreatePartsArray.test.ts](../../packages/ecma402-abstract/tests/CreatePartsArray.test.ts)
checks freshness, source preservation, field projection, prototypes, descriptors,
empty input, and seven mutation boundaries. Iterator, push and inherited
index-setter controls failed before the fix. Other controls cover type/value
setters, descriptor getters and replacement Object.defineProperty. No partition
function is mocked.

This closes the facade loops recorded in the
[foundation object audit](temporal-object-contract-audit.md). It does not close
private-list handling inside PartitionDateTimePattern, FormatDateTimePattern,
PartitionNumberPattern or their dependencies. Those producers must separately
prove that their arrays and records satisfy this helper's input model. Temporal
brand routing and complete formatToParts methods retain their own audit status.

Validation: 21 focused gates passed, then all 145 targets in the checked-in
[consumer matrix](temporal-validation-targets.txt) passed (27 executed, 118 cached).
The same Bazel invocation built the seven Temporal, DateTimeFormat, Collator,
DurationFormat, NumberFormat, Locale and RelativeTimeFormat package assemblies.
Existing conformance baselines remain unchanged. No new specification issue
identified; historical Temporal source-line credits remain unchanged.

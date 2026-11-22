# Shared constructor instance checks

Reviewed 2026-11-21 against published
[ECMA-262 §7.3.21 OrdinaryHasInstance](https://tc39.es/ecma262/#sec-ordinaryhasinstance).
This is a shared dependency review, not a full formatter or Temporal API signoff.

## Gaps and fix

The old helper read mutable Object.prototype.isPrototypeOf and its call property
while walking the instance chain. Replacing that method could stop construction
of DateTimeFormat and its formatting of a Temporal.PlainDate. New public and
helper controls reproduced this failure before the fix.

The helper also emulated bound dispatch through an optional caller-supplied
record, without recognizing actual bound functions. None of its seven repository
call sites supplied that record. Real bound constructors therefore reached the
missing prototype check and threw, including constructors from another realm.
The old typeof checks additionally excluded undetectable host Objects in the
constructor, instance and prototype positions.

[OrdinaryHasInstance.ts:1](../../packages/ecma262-abstract/OrdinaryHasInstance.ts#L1)
now captures Reflect.apply and Function.prototype[Symbol.hasInstance].
[Line 9](../../packages/ecma262-abstract/OrdinaryHasInstance.ts#L9) calls that
intrinsic with the supplied constructor as receiver and one instance argument.
[§20.2.3.6 steps 1–2](https://tc39.es/ecma262/#sec-function.prototype-%25symbol.hasinstance%25)
delegate directly to OrdinaryHasInstance. The wrapper therefore uses actual
engine internal slots and object classification. It does not read the supplied
constructor's Symbol.hasInstance override. Bound-target dispatch still invokes
the target's InstanceofOperator, including its custom Symbol.hasInstance behavior.
The unused synthetic-slot parameter is removed from this internal module.

## Step mapping

Every row delegates through the captured intrinsic at line 9; no hand-written
prototype traversal remains.

| ECMA-262 §7.3.21 requirement                             | Evidence                                                                                                                                                                                                                      |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Step 1: return false for non-callable constructors       | Non-callable Proxy never receives a Get; callable host constructor control succeeds.                                                                                                                                          |
| Step 2.a–b: retrieve bound target and InstanceofOperator | Nested bound functions accept target instances and reject unrelated Objects. A custom target Symbol.hasInstance receives the target as receiver and a primitive instance unchanged. Foreign-realm bound constructor succeeds. |
| Step 3: return false for primitive instances             | All primitive types return false without a constructor prototype Get. This shortcut follows bound dispatch, as the custom target test verifies. Host Objects do not take this shortcut.                                       |
| Step 4: Get prototype                                    | Proxy trace records one prototype Get before any instance traversal; getters propagate their exact thrown value. Constructor Symbol.hasInstance is not read.                                                                  |
| Step 5: require Object prototype                         | Every primitive prototype throws TypeError before visiting the instance; arrow-function prototype absence rejects. Host prototype control accepts an Object inheriting from it.                                               |
| Step 6.a: GetPrototypeOf repeatedly                      | Proxy instance and intermediate prototype traps run in order, without instance property Gets. Exact thrown values propagate. Revoked callable constructor rejects when its prototype is needed.                               |
| Step 6.b: null terminates with false                     | Unrelated Object and prototype-self controls return false after chain termination.                                                                                                                                            |
| Step 6.c: SameValue prototype match                      | Matching prototype returns true, including foreign-realm and host-object controls. The original instance itself is not compared before its first GetPrototypeOf.                                                              |

The captured realm intrinsic supplies specified error construction. User getters,
Proxy traps and bound-target handlers keep their own thrown values. Private
argument arrays have own length and element properties, so invoking Reflect.apply
does not consult an inherited array iterator or array-like user input.

## Callers and validation

AST call-site inventory: DateTimeFormat construction, DurationFormat construction,
NumberFormat construction and legacy unwrapping, plus Collator construction and
two Collator methods. These seven sites pass two arguments. Their complete
public algorithms retain separate audit status; this pass does not sign off
legacy constructor receiver handling.

[ordinary-has-instance.test.ts](../../packages/ecma262-abstract/tests/ordinary-has-instance.test.ts)
covers eight helper contracts, including Proxy ordering and bound targets.
[host-exotic.test.ts](../../packages/ecma262-abstract/tests/host-exotic.test.ts)
adds callable constructor, instance and prototype controls using V8's
undetectable host test Object. This is not a browser document.all run.
[temporal-owned.test.ts:49](../../packages/intl-datetimeformat/tests/temporal-owned.test.ts#L49)
checks public Temporal formatting during prototype-method mutation.
[native Hermes controls](../../native/hermes/tests/datetimeformat.ts#L253)
repeat formatter construction and output checks for TS and Rust installed APIs.

Validation: all 110 targets pass (33 executed, 77 cached), covering all Temporal
backend profiles, four Intl consumers and native Hermes comparisons. All five
Temporal/Intl package assemblies pass. The shared-helper suite has 88 passing
cases. The DateTimeFormat native comparison retains 9,440 cases with 40,268
assertions. Gazelle, audit ledger integrity and source-link bounds pass.

Full CI on parent #8097 separately exposed stale DateTimeFormat package metadata
and two composite typecheck gates from the numeric timestamp change. These were
outside the earlier matrix and remain pending repair; local consumer results do
not establish full CI success. No new specification issue identified; historical
Temporal source-line credits remain unchanged.

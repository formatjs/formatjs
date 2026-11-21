# Shared primitive conversion contracts

Reviewed 2026-11-21 against published ECMA-262. This pass closes the
shared TypeScript helper mapping left partial by the earlier intrinsic and
host-exotic fixes. Executable helpers are unchanged. Temporal callers, Rust
conversion adapters and unrelated coercion operations retain their own status.

## ToPrimitive

[§7.1.1](https://tc39.es/ecma262/#sec-toprimitive) accepts any language value,
with string, number or absent preferred type. Runtime `undefined` represents
absence; the existing TypeScript signature requires a hint, so tests explicitly
cast the absent case. No Temporal call site currently omits its hint.
Invalid hint strings are outside this operation's contract.

| Requirement                                      | Code and reasoning                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Step 1: distinguish Objects                      | [ToPrimitive.ts:67](../../packages/ecma262-abstract/ToPrimitive.ts#L67) uses [IsObject.ts:2](../../packages/ecma262-abstract/IsObject.ts#L2). Null and strict undefined are primitives; callable values and undetectable host objects are Objects. No input property is read for primitive arguments.                    |
| Step 1.a: GetMethod                              | [Line 68](../../packages/ecma262-abstract/ToPrimitive.ts#L68) performs one property Get with the input receiver and captured well-known Symbol. [Line 70](../../packages/ecma262-abstract/ToPrimitive.ts#L70) handles both nullish method values. A non-callable value throws through captured Reflect.apply at line 82. |
| Step 1.b.i–iii: select hint                      | [Lines 71–80](../../packages/ecma262-abstract/ToPrimitive.ts#L71) select default, string or number. Hint selection contains no user-observable operation for valid preferred types.                                                                                                                                      |
| Step 1.b.iv: Call                                | [Line 82](../../packages/ecma262-abstract/ToPrimitive.ts#L82) invokes captured Reflect.apply with input as receiver and exactly one hint argument. It does not inspect method.apply, method.call or method properties.                                                                                                   |
| Step 1.b.v–vi: accept primitive or throw         | [Lines 83–88](../../packages/ecma262-abstract/ToPrimitive.ts#L83) preserve primitive results, including Symbol, BigInt, NaN and negative zero; reject every Object using the captured realm TypeError. There is no ordinary fallback after an exotic method returns an Object or throws.                                 |
| Step 1.c–d: default hint and ordinary conversion | [Lines 90–93](../../packages/ecma262-abstract/ToPrimitive.ts#L90) select number when absent, then invoke the private ordinary helper.                                                                                                                                                                                    |
| Step 2: return primitive input                   | [Line 95](../../packages/ecma262-abstract/ToPrimitive.ts#L95) returns the original value without coercion.                                                                                                                                                                                                               |

The GetMethod implementation is fused rather than a separate helper call.
[§7.3.10 steps 1–4](https://tc39.es/ecma262/#sec-getmethod) require callable
validation before hint selection. Here Reflect.apply validates at the later Call.
For valid hints, intervening work is only local branching and primitive
assignment; there are no property reads, calls or allocations visible to user
code. Non-callable methods therefore throw the same realm TypeError after the
same single property Get, without invoking or reading an ordinary fallback.
Revoked callable Proxies and class constructors have [[Call]]; their Call throws
and must propagate, rather than being treated as absent ordinary methods.

## OrdinaryToPrimitive

The private helper implements
[§7.1.1.1](https://tc39.es/ecma262/#sec-ordinarytoprimitive).

| Requirement                    | Code and reasoning                                                                                                                                                                                                                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Steps 1–2: choose method order | [ToPrimitive.ts:41](../../packages/ecma262-abstract/ToPrimitive.ts#L41) creates a private two-element list: toString/valueOf for string, valueOf/toString for number.                                                                                                                        |
| Step 3 and 3.a: ordered Get    | [Lines 48–50](../../packages/ecma262-abstract/ToPrimitive.ts#L48) index own array elements, avoiding mutable iteration hooks. Each input method is read only when reached, with the original receiver.                                                                                       |
| Step 3.b: IsCallable           | [Line 51](../../packages/ecma262-abstract/ToPrimitive.ts#L51) skips non-callables. [Lines 26–35](../../packages/ecma262-abstract/ToPrimitive.ts#L26) classify normal functions without reading properties, and probe undetectable host callables using captured Function.prototype.toString. |
| Step 3.b.i: Call               | [Line 52](../../packages/ecma262-abstract/ToPrimitive.ts#L52) calls with original receiver and zero arguments through captured Reflect.apply. Exceptions propagate unchanged.                                                                                                                |
| Step 3.b.ii: accept primitive  | [Lines 53–54](../../packages/ecma262-abstract/ToPrimitive.ts#L53) return any primitive; Objects continue to the next method.                                                                                                                                                                 |
| Step 4: exhaustion             | [Line 58](../../packages/ecma262-abstract/ToPrimitive.ts#L58) throws the captured realm TypeError after both methods fail to yield a primitive.                                                                                                                                              |

Callability follows [§7.2.3](https://tc39.es/ecma262/#sec-iscallable).
The special host probe uses
[§20.2.3.5](https://tc39.es/ecma262/#sec-function.prototype.tostring): it
does not execute the candidate or read its properties. ECMAScript functions and
built-in functions covered by its earlier branches are callable too. Other
Objects reach the callable check or throw. Existing V8 undetectable-object tests
exercise the supported host path; they are not a browser document.all test run.

## ToString

[§7.1.19](https://tc39.es/ecma262/#sec-tostring) has twelve steps.
[ToString.ts:8](../../packages/ecma262-abstract/ToString.ts#L8) implements step 2,
rejecting a primitive Symbol with captured TypeError. All other input types
delegate at [line 11](../../packages/ecma262-abstract/ToString.ts#L11) to captured
%String%, called with one argument and no NewTarget.

This delegation is exact because
[§22.1.1.1 step 2.b](https://tc39.es/ecma262/#sec-string-constructor-string-value)
calls the engine's ToString. Its step 1 (absent argument) cannot apply because
an argument is always passed, including undefined. Its step 2.a special case for
primitive Symbols is excluded by the explicit guard. Steps 1 and 3–8 of
ToString, including Number and BigInt decimal conversion, therefore use engine
semantics. Steps 9–12 use the engine's object classification and string-hint
ToPrimitive, then recursively ToString its result. Boxed Symbols and Objects
returning Symbols still throw; String's primitive-Symbol exception does not
recur inside this operation. Exceptions propagate unchanged.

## Evidence and limits

[coercion.test.ts:222](../../packages/ecma262-abstract/tests/coercion.test.ts#L222)
adds primitive identity, six nullish-method/hint combinations with Proxy Get
and Call traces, all six conversion Get/Call abrupt-completion boundaries,
non-callable exotic rejection, revoked callable Proxies, class constructors,
foreign-realm built-ins, thrown-value identity, error realm and ToString's Symbol
boundary. Existing tests cover ordinary Object-result exhaustion, exotic
Object-result rejection, receiver/hint behavior and five mutable intrinsics.
[host-exotic.test.ts](../../packages/ecma262-abstract/tests/host-exotic.test.ts)
adds six undetectable-host controls, including callable methods and rejection of
host Objects returned by either conversion path.

Validation: all 79 shared-helper tests pass, including 21 coercion cases, plus
test and library typecheck gates. Only tests and audit documents change; no
runtime behavior or dependency graph changes. No new specification inconsistency
found. Earlier Temporal line credits are unchanged; full public Temporal
algorithms and chapter citation selection remain open.

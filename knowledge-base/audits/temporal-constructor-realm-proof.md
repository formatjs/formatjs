# Constructor realm fallback: finite unresolved obligation

All 16 `constructor-realm-fallback` rows remain conditional. The direct revoked-proxy cases now pass. Existing code supports ordinary local fallback and supplied object prototypes. Missing runtime realm access prevents signoff; this is an observable semantic gap, not an applicability exclusion.

## Required runtime behavior

[ECMA-262 §10.1.14](https://tc39.es/ecma262/#sec-getprototypefromconstructor) steps 2–3 read `newTarget.prototype` once, returning an Object immediately. Step 5 obtains the constructor realm; step 6 selects that realm's intrinsic fallback. [§7.3.24](https://tc39.es/ecma262/#sec-getfunctionrealm) step 2 unwraps bound functions; step 3.a validates a Proxy, then step 3.d recurses through its target. [§10.1.13](https://tc39.es/ecma262/#sec-ordinarycreatefromconstructor) delegates prototype selection to this operation.

## Original witness and verified correction

Before the correction, AST `newTarget.prototype` matches: instant.ts:439; duration.ts:509; plain-date.ts:503; plain-date-time.ts:646; plain-time.ts:668/677; plain-year-month.ts:437; plain-month-day.ts:251; zoned-date-time.ts:1231, all under packages/temporal. Every branch substitutes local `target.prototype` for primitive prototype. Hashes: `temporal-constructor-realm-source-hashes.json`.

```js
const pair = Proxy.revocable(function Target() {}, {
  get(target, key, receiver) {
    if (key !== 'prototype') throw Error('Unexpected Get')
    pair.revoke()
    return null
  },
})
Reflect.construct(Temporal.Instant, [0n], pair.proxy)
```

Required: TypeError during fallback realm lookup. Before the correction, construction succeeded with local Instant.prototype. Positive control: return `{}` instead of null; construction must succeed with that exact prototype despite revocation. Original receiver remains `pair.proxy`; exactly one Get. No constructor body call.

`temporal-constructor-realm-reproduction.patch` supplies these two branches across eight public constructors plus one descriptor-observation control. Applied through Bazel instant_test: all eight revoked/primitive witnesses failed as predicted;288 existing/positive controls passed. Object-prototype branch ran before primitive branch in every constructor case. The same cases now run in the owning suite. All 296 controls pass after the correction, and the nine focused Bazel targets pass, including strict Instant Test262 on Hermes source and bytecode.

The shared constructor helper returns an object prototype before any further
work. For a primitive prototype, captured Array.isArray rejects revoked Proxy
chains through [ECMA-262 §7.2.2 step 3](https://tc39.es/ecma262/#sec-isarray).
It traverses Proxy targets without property reads or descriptor traps. The
resulting TypeError supplies the revocation part of §7.3.24. The boolean result
is unused. [Current source ranges and validation](temporal-constructor-revocation-validation.json).

IsArray stops at a bound function. GetFunctionRealm unwraps it under §7.3.24
step 2. A bound constructor around a revoked Proxy can therefore still succeed
incorrectly. A live foreign constructor with primitive prototype still needs
the intrinsic prototype from its realm. Existing `host-exotic` Bazel test wiring is packages/temporal/BUILD.bazel:1007.

## Rejected partial runtime fix

A private `Proxy(newTarget, {get: cachedPrototype})` used as Object's newTarget appears to delegate realm validation without repeating Get. It introduces an extra observable operation: Proxy [[Get]] invariant checking queries original newTarget.[[GetOwnProperty]]("prototype"). Nested public Proxy can throw or record it. Read-only Node probe produced `['get prototype', 'descriptor prototype']`; required trace contains only first entry. Added control prevents this regression. No runtime patch proposed.

Direct captured `Reflect.construct(Object, [], newTarget)` correctly delegates its own Get/realm lookup. Its result cannot distinguish explicitly supplied foreign Object.prototype from fallback chosen for a primitive prototype. A preceding manual Get duplicates observation. Calling Function.prototype.bind adds observable getPrototypeOf/name/length work. Neither is a safe bridge.

## Cross-realm witness and boundary

Read-only Node v26.5.1 probe with a node:vm foreign ordinary constructor having prototype=null: native Temporal.Instant construction obtains foreign Temporal.Instant.prototype; native Object construction obtains foreign Object.prototype. This demonstrates accessible native intrinsic behavior, not an executed polyfill regression. Current source chooses local Temporal prototype.

Engine realm records and intrinsic tables lack general JavaScript reflection. Prototype-chain/global/eval inference adds user hooks and cannot reliably recover them. Capturing native Temporal allocation could delegate correctly on engines already supplying compatible native classes, but current NativeInstant is a private JavaScript facade, not native Temporal.Instant. Brand, provider, installation, and duplicate-Get behavior need a separately bounded design. Cooperative realm registration/host hooks would require an explicit contract; none assumed here.

Unwrapping bound functions and selecting the foreign intrinsic remain open within the current runtime interface. Runtime support or agreed installation architecture required; no whole-family promotion.

## Affected checklist IDs

- 3.1.1/algorithm-1/step-10; 3.5.3/algorithm-1/step-3
- 4.1.1/algorithm-1/step-10; 4.5.11/algorithm-1/step-2
- 5.1.1/algorithm-1/step-19; 5.5.8/algorithm-1/step-3
- 6.1.1/algorithm-1/step-11; 6.5.3/algorithm-1/step-3
- 7.1.1/algorithm-1/step-12; 7.5.19/algorithm-1/step-3
- 8.1.1/algorithm-1/step-4; 8.5.2/algorithm-1/step-3
- 9.1.1/algorithm-1/step-11; 9.5.5/algorithm-1/step-3
- 10.1.1/algorithm-1/step-11; 10.5.2/algorithm-1/step-3

Temporal section numbers above identify frozen rendered-comparison checklist rows; ECMA-262 shared operations supply actual runtime dependency. Mapping does not imply implementation verified.

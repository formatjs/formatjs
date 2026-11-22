# Bound newTarget revocation and foreign fallback

A bound constructor can keep an accessible own prototype getter after its
bound target Proxy is revoked. A getter returning an Object is the final
prototype. A getter returning a primitive requires realm lookup, which
unwraps the bound target and throws on the revoked Proxy.
[GetPrototypeFromConstructor §10.1.14 steps 2–6](https://tc39.es/ecma262/#sec-getprototypefromconstructor)
[GetFunctionRealm §7.3.24 steps 2–3](https://tc39.es/ecma262/#sec-getfunctionrealm).

The public control constructs Instant through a bound constructor wrapped by
two Proxies. The bound getter checks the receiver, optionally revokes the
inner target and returns the chosen prototype. The wrapper rejects unexpected
property, descriptor, prototype, call and construction hooks. The expected
profiles are live/primitive with local fallback, revoked/primitive with
TypeError, and revoked/Object with the supplied prototype. All three require
one Get. Node 26.5.1's built-in passes. The pre-fix FormatJS Bazel opt TS
artifact, SHA256 `6dfc4db43c6d2c1c730a5691ffceb3e4e35f84e61561e7d586a48ab2921f527e`,
returned the local fallback in the revoked/primitive case on both Node
and pinned Hermes. The older artifact is independent corroboration.
The current Bazel public Node and Hermes checks reproduced the failure before
the patch. After the patch the installation test passes Hermes source and
bytecode, and the Node control preserves the exact trace.
[Validation and ranges](temporal-bound-constructor-realm-evidence.json).

On engines with complete Array species handling, call captured slice with
a private empty array and an own wrapped constructor. Species creation
validates the constructor realm first. The private wrapper cannot equal
the realm's Array intrinsic, so a live chain reaches a private species Get
that throws an identity marker. Abrupt completion stops before any
underlying descriptor lookup. Revocation instead propagates its TypeError
from the earlier realm lookup. A captured Reflect.apply and null-prototype
handler/descriptor avoid mutable private operations.
[ArraySpeciesCreate §10.4.2.3 steps 4.b–5.a](https://tc39.es/ecma262/#sec-arrayspeciescreate)
[Proxy Get §10.5.8 steps 7–8](https://tc39.es/ecma262/#sec-proxy-object-internal-methods-and-internal-slots-get-p-receiver).

The pinned Hermes slice allocates a JSArray directly without species
lookup. Hermes instead validates the bound/Proxy chain during its
IsConstructor implementation before a Reflect.construct call. Captured
Reflect.construct with an empty private argument list and a private
construct-trap Proxy reaches a marker for a live chain and throws before
the marker for revocation. The private callable Proxy supplies its own
construction and accesses no newTarget properties. Read-only probes against
the Bazel runner returned marker/TypeError, with empty traces. Node's
standards IsConstructor reaches the marker in both cases.
[Hermes slice](https://github.com/formatjs/hermes/blob/338ff13ff1e996934ae615952d174f8c621844d9/lib/VM/JSLib/Array.cpp#L2420-L2525)
[Hermes IsConstructor](https://github.com/formatjs/hermes/blob/338ff13ff1e996934ae615952d174f8c621844d9/lib/VM/Operations.cpp#L1863-L1886)
[Hermes allocation](https://github.com/formatjs/hermes/blob/338ff13ff1e996934ae615952d174f8c621844d9/lib/VM/Callable.cpp#L501-L547).

Both candidate checks are selected using a private live and bound-revoked
probe. An engine without either capability keeps the existing captured
IsArray validation of direct Proxy chains. On selected engines, bound
validation occurs only after the single public prototype Get returns a
primitive.

Foreign intrinsic selection remains open. ArraySpeciesCreate exposes a
realm-dependent result only for the foreign intrinsic Array identity
special case. A private wrapper is never that identity. Running it with
another realm's slice has the same observation for an arbitrary live
constructor. A direct Reflect.construct(Object, [], Target) returns an
allocated object whose prototype could be the foreign Object intrinsic
or an explicitly supplied object identical to that intrinsic. Reading
the prototype first repeats the public Get. Returning a cached value
from a private wrapper's prototype trap invokes target descriptor
invariants. The ordinary bound instanceof path reads user Symbol.hasInstance
after unwrapping. Promise jobs catch realm lookup errors and enqueue
callbacks, so they supply no synchronous observation with the required
trace.
[OrdinaryHasInstance §7.3.21](https://tc39.es/ecma262/#sec-ordinaryhasinstance)
[Reflect.construct §28.1.2](https://tc39.es/ecma262/#sec-reflect.construct)
[Promise jobs §27.5.2](https://tc39.es/ecma262/#sec-promise-jobs).

The minimal outstanding live-realm case uses a foreign ordinary function
with prototype null. The native constructor selects the foreign Temporal
intrinsic prototype and the current FormatJS helper returns its local
class prototype. General coverage needs a runtime operation returning a
realm key and an installed intrinsic registry. A captured native Temporal
constructor can select its runtime intrinsic, but a force-installed
polyfill's own prototype and internal slots require a separate allocation
contract. Keep all shared realm fallback rows open until this is resolved.

Pinned Hermes has a separate pre-entry limitation. A previously revoked
Proxy under a bound newTarget makes Reflect.construct reject before any
prototype Get, even when the bound object owns an Object-valued prototype.
The same Object constructor control succeeds with one Get on Node.
This follows from Hermes IsConstructor's recursive validation. Revocation
inside the prototype getter reaches the polyfill and is the profile
covered by the proposed patch.

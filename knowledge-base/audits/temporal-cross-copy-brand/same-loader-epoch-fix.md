# Same-loader Instant and ZonedDateTime copies

Ordinary `index.js` and `standalone.js` imports now share private epoch
storage through their existing `native.js` dependency. Each export keeps
its own local constructors and selected data providers. Fresh allocation
validates the prepared epoch, zone and calendar. A slot cannot be attached
to an existing object, and a Proxy does not acquire its target's slot.
The native backend retains its existing storage.

The package regression creates Instant and ZonedDateTime values at
1234567890123456789 ns, poisons their coercion properties, and checks
copies in both directions. Construction preserves the target entry's
prototype. It also checks exact Proxy Gets, a custom newTarget prototype
and preparation errors before that prototype read.
[§8.5.3 step 1.a](https://tc39.es/proposal-temporal/#sec-temporal-totemporalinstant).
[§8.5.2](https://tc39.es/proposal-temporal/#sec-temporal-createtemporalinstant).
[§6.5.3](https://tc39.es/proposal-temporal/#sec-temporal-createtemporalzoneddatetime).

Before the fix, the Bazel package test threw the poisoned coercion error.
The same checks pass with the shared storage. Both packaged providers reuse the same generated links and primary records.
The compact profile still enumerates its generated transition-table names. Both pinned Node reference targets still pass on their built-in
Intl data. The strict manual target retains exact fixture comparison
for a host using the fixture's timezone rules.

[Validation and artifact hashes](same-loader-epoch-validation.json).
[Current allocator](../../../packages/temporal/epoch-slots.ts).
[Package regression](../../../packages/temporal/tests/package.test.mjs).

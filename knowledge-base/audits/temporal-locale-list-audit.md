# Temporal locale-list dependency audit

Pinned ECMA-402: `b1c961988b9a07894b1dc3dc2b5626ea48387d61`,
CanonicalizeLocaleList in negotiation.html. This companion covers a dependency
of Temporal's owned formatter path. Its source-line counts are separate from
the 14-file Temporal ledger; no complete public operation is signed off.

| Source line                                                                                                   | Status | Implementation / evidence                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [51](https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L51) | Traced | [index.ts](../../packages/intl-getcanonicallocales/index.ts#L39). Private native/FormatJS readers test the Locale brand without public property reads or coercion.          |
| [54](https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L54) | Traced | [index.ts](../../packages/intl-getcanonicallocales/index.ts#L47). Shared ToObject retains original Object; objects keep identity, primitives box and nullish inputs reject. |
| [55](https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L55) | Traced | [index.ts](../../packages/intl-getcanonicallocales/index.ts#L55). One length Get/ToNumber, NaN-to-zero, truncation and clamp use captured numeric intrinsics.               |
| [62](https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L62) | Traced | [index.ts](../../packages/intl-getcanonicallocales/index.ts#L66). String or IsObject accepts undetectable host objects; other primitives throw intrinsic TypeError.         |
| [63](https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L63) | Traced | [index.ts](../../packages/intl-getcanonicallocales/index.ts#L73). Private brand lookup uses captured native access or registered FormatJS slot readers.                     |
| [64](https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L64) | Traced | [index.ts](../../packages/intl-getcanonicallocales/index.ts#L73). Genuine Locale values supply their stored tag without visible coercion.                                   |

Open numbered ranges: 48–50, 52–53, 56–61, 65–71. Six reviewed lines have
individual source comments; all 24 numbered lines are accounted for. Prose,
list/array creation, grammar, duplicate handling, complete callers and realms
remain open. Brand-query traces assume trusted package initialization and
completed native or registered FormatJS Locale instances; constructor production
and unregistered third-party/cross-version private brands remain open.

Length proof: unary plus performs ToNumber with the number hint and propagates
user abrupt completions, including BigInt/Symbol rejection. For NaN return zero;
otherwise truncate and clamp. Negative values and negative infinity become zero, positive
infinity becomes 2**53-1, and nonnegative finite results below that bound are
unchanged integers. The NaN self-comparison and captured Math functions have no
user callbacks after conversion. Sparse lookup and canonicalization remain the
existing subsequent steps, outside this signoff.

Nine regressions failed before the fixes: two real V8 undetectable-object cases,
four numeric-global mutations, locale-list boxing, shared ToObject boxing and
TypeError replacement. Trunc replacement is a passing negative control. Host
cases test the published getCanonicalLocales package, string-hint receiver and
abrupt completion before later entries. Existing tests retain ordinary/callable
objects, sparse properties, length coercion and native Locale controls.

Brand queries now use a private linked registry. Setup captures the original
native Locale toString with Reflect.apply; FormatJS Locale registers a reader of
its private WeakMap through a captured get. Ordinary queries read neither
Intl.Locale nor user properties, mutable call/apply methods or private iterators.
Snapshots share leaf readers across independent bundles; forwarding registry
functions would create cycles. The non-enumerable setup capabilities on the
canonicalizer and Locale constructor are internal package interoperability,
not a public registration API. Initialization under modified primordials and
untrusted registration are outside this proof.

Installing the Locale polyfill connects its private slots to the installed
canonicalizer. If that canonicalizer has no compatible reader registry, the
installer replaces it with the imported FormatJS canonicalizer; native
canonicalizers cannot inspect the polyfill's WeakMap. A ponyfill import registers
with compatible FormatJS packages without replacing a native global. No-op
Locale polyfill installation preserves native globals. Bootstrap also retains
readers for native instances created before Locale replacement.

Thirteen regressions failed before this fix: six global/prototype/call/iterator
mutations, two standalone/private-WeakMap cases, and five independent IIFE
bundle/load-order cases. Reflect.apply replacement is a passing negative
control. Bundle cases retain native instances and earlier polyfill copies,
poison instance coercion, global/prototype Locale reads and WeakMap.get, and
reject a prototype-only fake brand. Node-only VM tests do not enter Hermes's
package test list; compatible mutation tests run in both Hermes modes.

Validation: 114 selected gates pass after removing ten stale Locale Test262
baseline entries and rerunning that gate. Raw Locale is 378/380, retaining two
constructor-realm failures; getCanonicalLocales is 76/76. Native Hermes package
checks pass in both source and bytecode: Locale 345 tests / 665 assertions with
five existing skips; getCanonicalLocales 55 tests / 86 assertions with no skips.
All six public package assemblies pass. The 40 Temporal class backend gates,
Rust/kernel checks, Intl consumers and locale profiles retain their coverage.
Temporal Intl accepted-failure gates still expose the four documented
IANA/CLDR expectation differences; a passing baseline gate does not mean zero
raw failures. No exclusions added or remaining failures hidden. No spec defect
claimed here.

# Temporal locale-list dependency audit

Pinned ECMA-402: `b1c961988b9a07894b1dc3dc2b5626ea48387d61`,
CanonicalizeLocaleList in negotiation.html. This companion covers a dependency
of Temporal's owned formatter path. Its source-line counts are separate from
the 14-file Temporal ledger; no complete public operation is signed off.

| Source line                                                                                                   | Status | Implementation / evidence                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [54](https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L54) | Traced | [index.ts](../../packages/intl-getcanonicallocales/index.ts#L69). Shared ToObject retains the original Object intrinsic; objects keep identity, primitives box and nullish inputs reject.    |
| [55](https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L55) | Traced | [index.ts](../../packages/intl-getcanonicallocales/index.ts#L77). One length Get and ToNumber, NaN-to-zero, truncation and clamp to 0..2**53-1 use captured numeric intrinsics.              |
| [62](https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L62) | Traced | [index.ts](../../packages/intl-getcanonicallocales/index.ts#L88). String or IsObject accepts undetectable host objects; other primitives throw intrinsic TypeError before string conversion. |

Open numbered ranges: 48–53, 56–61 and 63–71. The three reviewed lines have
individual source comments; all 24 numbered lines are accounted for. Prose,
list/array creation, grammar, duplicate handling, all other callers and realms
still need their own evidence.

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

The direct getCanonicalLocales Test262 run executes 76 cases with zero failures.
Native Hermes package conformance runs 48 tests and 79 assertions in each of
source and bytecode modes, with no skips or failures, including the added
non-V8 controls. These
results do not sign off Locale brand detection: localeString still probes the
current Intl.Locale.prototype.toString, including mutable global/property reads
and a private for-of list. Fixing that requires preserving real polyfill Locale
brands across installation and bundled packages without trusting replacement
methods. Brand selection lines 51 and 63–64 remain open; no workaround or
exclusion hides that requirement. No spec defect is claimed here.

Validation: all 111 selected gates and six public package assemblies pass.
Exclusions and accepted-failure baselines are unchanged.

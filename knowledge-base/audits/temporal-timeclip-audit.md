# Numeric timestamp clipping

Reviewed 2026-11-21 against published
[ECMA-262 §21.4.1.31 TimeClip](https://tc39.es/ecma262/#sec-timeclip).
All three steps are mapped below for the full Number input domain. The Rust
adapter represents the invalid-date result as an error rather than a JS NaN.
Temporal object conversion and complete Intl formatter algorithms remain open.

## Composite build and package integration

Full CI for the timestamp layer exposed gates missing from the earlier focused
matrix: DateTimeFormat-esm_typecheck_test, DateTimeFormat:typecheck_typecheck_test,
and intl-datetimeformat:package_json_sync_test. All three failures reproduced
locally. This corrects the validation scope; earlier 98-target results remain
evidence for those targets only.

[HandleDateTimeValue.ts:36](../../packages/ecma402-abstract/DateTimeFormat/HandleDateTimeValue.ts#L36)
now creates the exact million-nanosecond scale through captured BigInt rather
than a BigInt literal, preserving the composite package's ES2018 compiler
target. Both constructor arguments are primitive finite integers; neither
conversion invokes object hooks. The exact arithmetic and TimeClip bounds are
unchanged.

[TemporalDateTime.ts:80](../../packages/ecma402-abstract/DateTimeFormat/TemporalDateTime.ts#L80)
casts through unknown before the numeric assertion. Unary plus still performs
the same engine ToNumber operation on the original Date object; emitted runtime
behavior is unchanged. The cast accommodates the narrower Object type used by
the standalone composite project's strict checks.

Bazel package_json_sync regenerates DateTimeFormat's checked-in manifest after
removal of the direct bigdecimal BUILD dependency. pnpm install --lockfile-only
updates only the corresponding three-line lockfile dependency entry. Shared
formatter arithmetic still uses its existing transitive dependencies. Inspection
of the cquery-located package found no external bigdecimal import in its 664
JavaScript files; AST checks covered static, dynamic and CommonJS imports.

The checked-in [consumer target list](temporal-validation-targets.txt) now includes
these three integration gates plus package metadata/export validation. Reproduce
with the repository's Bazel command:

```bash
bazel test $(cat knowledge-base/audits/temporal-validation-targets.txt) \
  //packages/temporal:pkg //packages/intl-datetimeformat:pkg \
  //packages/intl-collator:pkg //packages/intl-durationformat:pkg \
  //packages/intl-numberformat:pkg --test_output=errors
```

This is a focused consumer matrix; full repository CI remains a separate gate.
Post-repair validation: all 116 declared targets and five package assemblies
pass. This includes both previously failing standalone compiler gates, package
manifest sync, package metadata/exports, release manifests, all Temporal backend
profiles and four Intl consumers. The frozen lockfile check passes. Full CI on
the published stack head still needs its own result; these are local results.
No new historical Temporal line credit assigned.

## Defect and fix

DateTimeFormat converted a numeric timestamp into a private Decimal, then
TimeClip called ToNumber on that object again. Inherited Symbol.toPrimitive or
valueOf getters could observe or stop formatting even when the public argument
was already a primitive Number. This is extra observable work absent from
TimeClip's Number-input contract.

The numeric path now retains primitive Numbers from argument conversion through
clipping. Temporal values retain their existing private records. The type union
is number | TemporalDateTimeValue, so internal classification uses typeof rather
than object-property probing. Legacy Intl projection passes numeric milliseconds
directly to its captured native formatter.

## Step mapping

| Published requirement                                | TypeScript                                                                                                                | Rust                                                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| §21.4.1.31 step 1: reject non-finite Numbers         | [TimeClip.ts:11](../../packages/ecma262-abstract/TimeClip.ts#L11), captured Number.isFinite                               | [civil.rs:10](../../crates/intl_datetimeformat/civil.rs#L10), f64::is_finite                           |
| Step 2: reject absolute values above the exact bound | [TimeClip.ts:13](../../packages/ecma262-abstract/TimeClip.ts#L13), captured abs and integer literal 8,640,000,000,000,000 | [civil.rs:10](../../crates/intl_datetimeformat/civil.rs#L10), exact i64 constant converted to f64      |
| Step 3: truncate and return Number                   | [TimeClip.ts:15](../../packages/ecma262-abstract/TimeClip.ts#L15), captured trunc followed by positive-zero normalization | [civil.rs:13](../../crates/intl_datetimeformat/civil.rs#L13), trunc then checked-domain i64 conversion |

The bound is integral and below 2^53, so its Number/f64 representation is exact.
Every accepted truncated value also fits exactly in Number and well within i64.
The Rust cast therefore cannot saturate. NaN and both infinities fail before
truncation; every finite value outside either endpoint fails the strict bound
comparison. Both endpoints remain accepted.

Step 3 invokes [§7.1.5 ToIntegerOrInfinity](https://tc39.es/ecma262/#sec-tointegerorinfinity).
Its step 1 is identity for the already converted Number. Step 2 maps either zero
sign to mathematical zero. Steps 3–4 cannot be reached because TimeClip rejected
infinities. Step 5 truncates the finite mathematical value. Math.trunc preserves
negative zero, so the final `|| 0` also normalizes negative fractions whose
truncation is zero. No extra argument conversion is permitted or performed.
This proves the Number-input subdomain of that dependency, not its general
object-conversion contract.

## Caller boundary

The fallback in [TemporalDateTime.ts:141](../../packages/ecma402-abstract/DateTimeFormat/TemporalDateTime.ts#L141)
delegates public numeric conversion to unary plus, preserving numeric hints,
receivers, abrupt completions and BigInt/Symbol rejection. That is the engine's
[§7.1.4 ToNumber](https://tc39.es/ecma262/#sec-tonumber) operation via
[§13.5.4.1](https://tc39.es/ecma262/#sec-unary-plus-operator-runtime-semantics-evaluation).
Brand detection and Temporal serialization retain their separate open status.

[HandleDateTimeValue.ts:32](../../packages/ecma402-abstract/DateTimeFormat/HandleDateTimeValue.ts#L32)
clips the Number, detects NaN without mutable helpers, and throws the captured
RangeError. A valid integral millisecond value converts exactly through captured
BigInt, then multiplies by 1,000,000n without losing precision. Temporal records
continue through their own branch and retain nanoseconds beyond Date's range.
Both range arguments still convert before partitioning/clipping; existing
abrupt-completion controls retain that ordering.

The default clock now captures Date.now once in
[core.ts:59](../../packages/intl-datetimeformat/core.ts#L59). This supplies the
intrinsic call required by published ECMA-402
[§11.3.3 step 4.a.i](https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.format)
and [§11.3.6 step 3.a](https://tc39.es/ecma402/#sec-Intl.DateTimeFormat.prototype.formatToParts),
rather than consulting the mutable Date.now property on each call. This maps
only those clock substeps; the complete methods remain open.

## Evidence

Four public regressions failed before the fix: numeric formatting under inherited
Symbol.toPrimitive/valueOf getters, and omitted-date format/formatToParts under
a replaced Date.now getter. All four now pass. The coercion controls exercise
single output, parts, ranges and range parts, restoring properties before
assertions. Native Hermes repeats the same public controls.

Twenty-one direct TimeClip vectors compare with builtin Date, including NaN,
infinities, huge finite values, both exact endpoints and adjacent milliseconds,
fractions, subnormals and both zero signs. A separate control replaces
Number.isFinite, Math.abs and Math.trunc after capture. Rust boundary tests
cover the same branch classes and zero normalization. Public BigInt/Symbol
rejection controls include primitive, boxed and object-conversion forms across
all four formatting methods.

No spec inconsistency found. This dependency review adds no historical Temporal
source-line credit. Other private Decimal uses in Intl and the full Temporal
chapter/caller audits remain open.

The 95-target affected matrix passes (72 executed, 23 cached), as do Temporal
and DateTimeFormat package assembly. This includes all 40 Temporal class/backend
Test262 gates, shared units/typechecks, Intl integration/profile gates, Rust,
native Hermes and legacy formatter integrations. The native DateTimeFormat
comparison checks 9,440 cases and 40,264 assertions against the TS implementation.
The helper suite passes 65 cases; DateTimeFormat passes 382 with three pre-existing
skips. Existing raw Intl data differences remain separate from profile-gate
success. No exclusions, baselines or timeouts change.

The final root Rust/TypeScript pattern interoperability test and both compiler
checks also pass. Total: 98 distinct targets, 74 executed and 24 cached.

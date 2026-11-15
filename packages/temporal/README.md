# @formatjs/temporal

Independent TypeScript and Rust Temporal implementations in progress.
Native Hermes integration remains pending. Initial WASM primitive measurements live in
[benchmark notes](../../benchmarks/temporal/README.md#wasm-baseline). Private until implementation and
conformance coverage are ready.

```ts
import {Temporal} from '@formatjs/temporal'

const instant = Temporal.Instant.fromEpochNanoseconds(1n)
instant.epochNanoseconds // 1n
```

Current API: partial `Temporal.Instant`, `Temporal.Duration` and `Temporal.PlainTime`. Instant supports
construction, parsing, comparison, rounding, serialization, add/subtract and
differences. Duration supports construction, ISO parsing, getters, immutable
field changes, negation/absolute value, add/subtract, serialization and time-only
comparison/totals. Calendar-relative methods, Duration.round, locale formatting
and remaining Temporal classes are incomplete. PlainTime supports construction,
ISO parsing, field updates, comparison, rounding, arithmetic, differences and
serialization; other-class conversions and locale formatting remain pending. Importing installs no global.

Internal modules provide ISO/Hebrew calendar arithmetic and IANA timezone
resolution using FormatJS data, including recurring future rules. Runtime
imports shared primitives; `temporal-polyfill` is only a test/benchmark control.

## Validation

```sh
bazel build -c opt //packages/temporal:pkg
bazel test -c opt //packages/temporal:kernel_test //packages/temporal:calendar_test //packages/temporal:instant_test //packages/temporal:instant_test262
# Raw diagnostic; remaining Instant API currently fails.
bazel test -c opt //packages/temporal:instant_test262_full
bazel run -c opt //benchmarks/temporal:facade_benchmark
```

The strict Test262 slice covers 346 executions. The full Instant diagnostic has
934 executions: 882 pass, 52 fail. See
[recorded results](conformance-results.json). This is not full Temporal compliance.
ICU timezone/calendar oracles, benchmark methods and their limits are recorded
in the [benchmark notes](../../benchmarks/temporal/README.md).

## Completion plan

Track work in [Temporal implementation](../../knowledge-base/015-temporal.md).

The independent `formatjs_temporal` Rust core shares parser vectors and matches
ICU4J Gregorian fields across the full instant range. Rust Hermes bindings and a complete WASM facade remain pending; the core now
builds to WASM for matched primitive benchmarks.

The same 346-execution strict slice passes on real Hermes in source and optimized
bytecode modes without reference Temporal or test exclusions. This verifies the
current TS slice, not a native Rust backend or complete Hermes Temporal support.

Rounding supports all nine modes with Instant’s positive-direction semantics.
`toString` accepts owned IANA zones and aliases, fixed offsets, ISO timezone
strings and precision/rounding options. The complete serialization/rounding
selection still has two missing-family helper failures (454/456 pass);
it remains a failing manual diagnostic.

Duration has a separate 468-execution strict core gate, passing on Node and
Hermes source/bytecode. Its raw full diagnostic passes 698/1086. The complete
implemented-method selection is 554/556; string helper scenarios need the
remaining class constructors. No individual files or raw failures are hidden.

Both cores match 5,430 independent ICU signed rounding/rational-total cases.
Hermes bytecode uses `-Xes6-block-scoping`, matching source runtime semantics.

PlainTime adds a 234-execution strict construction/getter/arithmetic selection on
Node and Hermes source/optimized bytecode. Its full 986-execution diagnostic
passes 954; 32 failures retain missing PlainDateTime/ZonedDateTime/Intl integration
and class-dependent helpers. No implementation gap is an allowed exclusion.
TS and Rust independently match 7,740 ICU clock-rounding cases, including
half-even parity within fields and midnight wrapping.

```sh
bazel test -c opt //packages/temporal:plain_time_test //packages/temporal:plain_time_test262 //packages/temporal:plain_time_hermes_test262_strict //packages/temporal:plain_time_hermes_bytecode_test262_strict
# Raw diagnostic, currently failing.
bazel test -c opt //packages/temporal:plain_time_test262_full
```

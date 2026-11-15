# @formatjs/temporal

Independent TypeScript and Rust Temporal implementations in progress.
Native Hermes integration and WASM comparison remain pending. Private until implementation and
conformance coverage are ready.

```ts
import {Temporal} from '@formatjs/temporal'

const instant = Temporal.Instant.fromEpochNanoseconds(1n)
instant.epochNanoseconds // 1n
```

Current public API: partial `Temporal.Instant` constructor, numeric factories,
epoch getters, `from`, `equals`, `compare`, `round`, `toString`, `toJSON` and `valueOf`. String parsing supports
basic/extended ISO forms, fractional offsets and RFC 9557 annotations. Other Temporal classes, ZonedDateTime input, duration arithmetic and locale
formatting are not implemented. Importing this package does not install a global.

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

The strict Test262 slice covers 154 executions. The full Instant diagnostic has
934 executions: 502 pass, 432 fail. See
[recorded results](conformance-results.json). This is not full Temporal compliance.
ICU timezone/calendar oracles, benchmark methods and their limits are recorded
in the [benchmark notes](../../benchmarks/temporal/README.md).

## Completion plan

Track work in [Temporal implementation](../../knowledge-base/015-temporal.md).

The independent `formatjs_temporal` Rust core shares parser vectors and matches
ICU4J Gregorian fields across the full instant range. Rust bindings and WASM are
still pending.

The same 154-execution strict slice passes on real Hermes in source and optimized
bytecode modes without reference Temporal or test exclusions. This verifies the
current TS slice, not a native Rust backend or complete Hermes Temporal support.

Rounding supports all nine modes with Instant’s positive-direction semantics.
`toString` accepts owned IANA zones and aliases, fixed offsets, ISO timezone
strings and precision/rounding options. The complete serialization/rounding
selection still has six missing-family integration failures (340/346 pass);
it remains a failing manual diagnostic.

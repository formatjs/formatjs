# @formatjs/temporal

Work in progress: TypeScript Temporal implementation with a planned Rust core,
Hermes integration and WASM comparison. Private until implementation and
conformance coverage are ready.

```ts
import {Temporal} from '@formatjs/temporal'

const instant = Temporal.Instant.fromEpochNanoseconds(1n)
instant.epochNanoseconds // 1n
```

Current public API: partial `Temporal.Instant` constructor, numeric factories,
epoch getters, `from`, `equals` and `valueOf`. String parsing covers a limited
ISO subset. Other Temporal classes, arithmetic, rounding and serialization
are not implemented. Importing this package does not install a global.

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

The strict Test262 slice covers 94 executions. The full Instant diagnostic has
934 executions: 202 pass, 732 fail. These counts predate the package move; see
[recorded results](conformance-results.json). This is not full Temporal compliance.
ICU timezone/calendar oracles, benchmark methods and their limits are recorded
in the [benchmark notes](../../benchmarks/temporal/README.md).

## Completion plan

Track work in [Temporal implementation](../../knowledge-base/015-temporal.md).

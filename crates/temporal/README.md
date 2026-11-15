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

Current API: partial `Temporal.Instant`, `Temporal.Duration`, `Temporal.PlainTime`,
`Temporal.PlainDate`, `Temporal.PlainDateTime`, `Temporal.PlainYearMonth` and
`Temporal.PlainMonthDay`. Instant supports
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
Hermes source/bytecode. Its raw full diagnostic passes 710/1086. The complete
implemented-method selection is 554/556; string helper scenarios need the
remaining class constructors. No individual files or raw failures are hidden.

Both cores match 5,430 independent ICU signed rounding/rational-total cases.
Hermes bytecode uses `-Xes6-block-scoping`, matching source runtime semantics.

PlainTime adds a 234-execution strict construction/getter/arithmetic selection on
Node and Hermes source/optimized bytecode. Its full 986-execution diagnostic
passes 958; 28 failures retain missing PlainDateTime/ZonedDateTime/Intl integration
and class-dependent helpers. No implementation gap is an allowed exclusion.
TS and Rust independently match 7,740 ICU clock-rounding cases, including
half-even parity within fields and midnight wrapping.

```sh
bazel test -c opt //packages/temporal:plain_time_test //packages/temporal:plain_time_test262 //packages/temporal:plain_time_hermes_test262_strict //packages/temporal:plain_time_hermes_bytecode_test262_strict
# Raw diagnostic, currently failing.
bazel test -c opt //packages/temporal:plain_time_test262_full
```

PlainDate/PlainDateTime add owned date fields, parsing, updates, arithmetic,
comparison, differences/rounding and serialization. Conversions share private
slots with PlainTime. TS currently uses ISO/Hebrew arithmetic and Gregorian
fields; other calendar engines and full non-ISO conformance remain pending.
Rust provides ISO date/date-time foundations; native calendar-relative APIs
remain incomplete. Both cores match 840 independent ICU arithmetic cases.

Strict date/date-time selections pass 364 and 518 executions on Node and Hermes
source/optimized bytecode. Full raw diagnostics pass 1144/1308 and 1444/1552.
Missing classes, Intl integration and relative Duration paths remain failing.

```sh
bazel test -c opt //packages/temporal:plain_date_time_test //packages/temporal:plain_date_test262 //packages/temporal:plain_date_time_test262
```

PlainYearMonth/PlainMonthDay add validated reference ISO fields, parsing,
updates, comparisons, date conversion and serialization. YearMonth supports
year/month arithmetic and relative rounding/differences. The Rust ISO cores and
TS implementation independently match 2,028 ICU short-date cases. TS Hebrew
reference-date/month-code controls also pass against the forced full polyfill.

Strict selections pass 348 YearMonth and 150 MonthDay executions on Node and
Hermes source/optimized bytecode. Raw diagnostics pass 1002/1022 and 388/398;
missing ZonedDateTime, Intl and relative Duration paths remain visible failures.
Other calendar engines and full native/WASM integration remain incomplete.

```sh
bazel test -c opt //packages/temporal:short_date_test //packages/temporal:year_month_test262 //packages/temporal:month_day_test262
```

## ISO short-date cores

`PlainYearMonth`/`PlainMonthDay` preserve reference ISO fields, parse short/full
ISO strings and convert to checked dates. YearMonth supports year/month-only
arithmetic and differences with actual calendar-span rounding. Year-month bounds
include reference days outside PlainDate's domain; operations requiring a real
date still validate that intermediate. MonthDay parsing uses the input year only
for validation, then chooses the ISO reference year 1972.

Both cores match 2,028 independent ICU calendar/decimal controls, including
BCE, range edges, metadata, leap days and all nine rounding modes. The shared ISO
epoch-day calculation remains protected by the full Gregorian conversion oracle.
Non-ISO/native object-model integration remains pending.

`ZonedDateTime<Z>` keeps an Instant with a `TimeZone` provider. The dependency-free
core resolves local fields with all four disambiguation modes, retains exact
nanosecond offsets, and separates calendar addition from elapsed clock addition.
`FixedOffset` supplies the constant-offset case. ICU offset and transition rows
verify local conversion, gap/fold choices and day-versus-24-hour arithmetic. A
production IANA provider, calendar-aware zoned differences and Hermes bindings
remain pending. Gap resolution currently uses the same two-day offset window as
the TS kernel.

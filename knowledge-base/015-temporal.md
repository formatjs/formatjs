# Temporal implementation

Goal: complete Temporal in TypeScript and Rust, support Hermes, validate against
Test262 and independent ICU oracles, compare `temporal-polyfill`, measure WASM
versus TypeScript size and speed. Deliver incremental stacked PRs using `gh stack`.

## Current state

`packages/temporal` owns the TypeScript implementation and tests. Its workspace
name is `@formatjs/temporal`; it remains private while incomplete.
`benchmarks/temporal` owns comparisons and measurement records.

The public entry exports a partial `Temporal.Instant`. ISO/Hebrew arithmetic
and owned IANA timezone primitives are internal. `crates/temporal` now supplies a dependency-free `no_std` Rust Instant/ISO
core and parser. Native Hermes Temporal installation does not exist yet. Existing Intl Rust/Hermes infrastructure
is reusable; existing Temporal-based formatter calendars are not independent
Temporal implementations.

## Delivery order

1. Move runtime/tests into the package; preserve existing strict gates and
   independent ICU controls. Share timezone decoding below formatter packages.
2. Complete Instant parsing, serialization, comparison, arithmetic, rounding
   and differences; introduce shared duration/options machinery. Add the Rust
   instant/date/time core with identical boundary and oracle cases.
3. Implement Duration, PlainDate, PlainTime, PlainDateTime, PlainYearMonth,
   PlainMonthDay, ZonedDateTime and Now; Date/Intl integration and global
   installation/detection entries. Complete all specification calendars,
   calendar arithmetic and timezone identifier/transition semantics.
4. Expose Rust through the repository's Hermes JSI/C ABI model; retain JavaScript
   coercion, property access order, brands, descriptors and exception behavior
   in facades. Test source and optimized Hermes bytecode.
5. Build a WASM variant of the same Rust operations with JavaScript glue;
   compare equivalent public behavior, data and workloads before choosing any
   default backend.

Each step expands strict Test262 gates. Steps may split into smaller stacked PRs;
no completed slice establishes complete Temporal compliance.

## Completion criteria

- Complete pinned Temporal Test262 suite for TS and Hermes/native paths,
  including supported Date/Intl integration. Keep a raw strict diagnostic.
  Document every exclusion by upstream path, host limitation and rationale.
  Realm/host limitations may follow existing polyfill policy; missing methods,
  calendars or coercion semantics are implementation gaps, not exclusions.
- Rust core tests cover the same range, overflow, calendar, duration, rounding,
  timezone and ambiguity semantics as TS. Cross-language agreement alone is
  insufficient: use independently generated ICU expectations too.
- ICU calendar conversion/arithmetic and timezone transition/offset controls
  cover normal and extreme dates where ICU is reliable. Record versions,
  timezone differences and unsupported oracle ranges explicitly.
- Actual Hermes execution passes supported conformance in source and optimized
  bytecode modes. Check install order, repeated installation and native lifetime
  behavior using the existing Hermes integration infrastructure.
- Forced `temporal-polyfill` controls use matched API coverage, calendars,
  timezone policy and inputs; verify output equality before timing. Record
  engine/compiler/data versions, warmup and repeated batches.
- TS and WASM comparisons include raw/minified/compressed bytes, JS glue,
  owned calendar/timezone data, cold load/first use and steady-state timing.
  Separate code/data and shared/standalone profiles. Report native Hermes
  artifact size separately from WASM. Missing WASM support in a host is a host
  constraint, not a measured performance result.

## Existing evidence

The package README and benchmark notes record the current 134-execution strict
Instant slice, failing full Instant diagnostic, bounded ICU calendar controls,
post-2100 timezone controls and early TS-only measurements. Rust and TS also consume independent ICU4J 79.1 proleptic Gregorian fixtures
across the full instant range, including the adjacent local-date window. These
validate ISO fields in both directions, separate from the bounded Hebrew oracle.
The same 134-execution slice passes on real Hermes in source and optimized
bytecode modes, without reference Temporal, exclusions or tracked failures.
The owned TS payload is compiled with the pinned engine compiler for the bytecode
control. Native Rust Hermes bindings remain pending.
Neither complete Temporal nor Rust/WASM/Hermes Temporal performance has been
measured yet.

Parsing follows the [Temporal ISO grammar](https://tc39.es/proposal-temporal/#sec-temporal-iso8601grammar)
and [ParseISODateTime](https://tc39.es/proposal-temporal/#sec-temporal-parseisodatetime).
Test262 remains pinned in `MODULE.bazel`; update counts and diagnostics when the
pin or selected surface changes.

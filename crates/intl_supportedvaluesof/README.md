# formatjs_intl_supportedvaluesof

Rust enumeration core for `Intl.supportedValuesOf`. Uses the same generated
CLDR/IANA candidates as the TypeScript polyfill. No locale data is loaded at
runtime; this API has six static candidate categories.

The caller supplies formatter observations. Returning every candidate would
advertise values absent from the caller's formatter backend. Each callback
receives a `Key`, candidate identifier and probe locale, and returns:

- `resolved`: the formatter's resolved calendar, collation, numbering system,
  time zone or unit.
- `formatted`: NumberFormat output for `123`, used for currency names and
  numbering systems.
- `None`: unsupported value, including a failed formatter call.

Collations use CLDR candidate locales, including non-English collations.
Rust filters observations, expands compact currency ranges, sorts and removes
duplicates. Every call returns its own list. Callers choose their own backend
and loaded data; no process-global capability cache leaks between runtimes.

The C ABI in `supported_values.h` borrows callback observations and owns its
result buffer. Callback exceptions must be caught before returning to Rust.
Release successful output exactly once with `formatjs_values_free`.

Build and test on Linux:

```sh
bazel test //crates/intl_supportedvaluesof:intl_supportedvaluesof_test
bazel test //packages/intl-supportedvaluesof:rust_conformance_test
```

The conformance test observes the real host Intl formatters, then compares
every Rust output list with the TypeScript source. It also checks invalid
keys and isolation between backends. Rust tests port the existing package's
sorted/unique lists, aliases, currency names, numbering systems, non-English
collations, primary time zones and fresh-output cases. JS coercion and
property descriptors belong at the Hermes boundary.

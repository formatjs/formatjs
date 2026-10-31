# NumberFormat constructor locale snapshots

The constructor profile after arithmetic optimizations attributed about 48% of
sampled `InitializeNumberFormat` time to `localeArray` and `prepare`. Both checked
the same locale list: first the public mutable Set, then its private array copy.
This profile percentage concerns initialization, not every constructor operation.

`ResolveLocale` now retains a private validation buffer plus a frozen matcher
snapshot. Set contents and iteration order are still checked every call. When
unchanged, best fit trusts the factory-created snapshot and reuses its prepared
indexes without another element comparison or defensive copy.

Only snapshots created by the internal factory get this treatment. Public arrays
retain existing validation, including frozen arrays whose indexed getters can
return different values. Private cache fields ignore inherited snapshot
accessors. No Set method interception or size-only invalidation:
`Set.prototype` mutation and same-size reordering remain supported. Canonical
alias ties retain the first supported entry and that entry's locale data.

The validation buffer remains an ordinary private array because indexed reads
from the frozen array regressed the first prototype. Best-fit retains two arrays,
as before; its prepared state shares the frozen snapshot. Lookup uses the
validation buffer directly and does not create a best-fit snapshot. Warm matching still
scans a mutable Set once. This is not an O(1) mutable-registry guarantee.

Rust, CLDR data and number arithmetic are unchanged.

## Measurements

Optimized Bazel runs compare production main `b567ec806` with this change on macOS
Apple Silicon, Node 24.14. The same benchmark harness adds `--constructors-only`
and `--constructor-iterations`; ordinary benchmark defaults stay unchanged.
Seven warm rounds, 10,000 constructor + `resolvedOptions()` calls per round,
657 generated NumberFormat locale packs loaded (976 available locale IDs,
including aliases). Host and JS PluralRules are separate
lanes. Lookup is a control because it does not use best-fit's prepared indexes.
These isolated runs are not directly comparable with older mixed-format runs.
Cold per-Set preparation uses `--fresh-locale-sets` and 100 calls per round. Sets
are allocated before timing; canonical tag caches are warmed where used. This
measures new supported-list state, not process startup or data loading.

Median µs/call:

| Lane              | Workload           |  Before |   After | Speedup |
| ----------------- | ------------------ | ------: | ------: | ------: |
| Warm host         | construct exact    |   5.099 |   4.144 |   1.23× |
| Warm host         | construct fallback |   6.015 |   5.140 |   1.17× |
| Warm host         | construct lookup   |   5.092 |   4.970 |   1.02× |
| Warm JS plurals   | construct exact    |   5.217 |   4.243 |   1.23× |
| Warm JS plurals   | construct fallback |   6.127 |   5.266 |   1.16× |
| Warm JS plurals   | construct lookup   |   5.153 |   5.047 |   1.02× |
| Cold per-Set host | construct exact    |   8.233 |   6.953 |   1.18× |
| Cold per-Set host | construct fallback | 713.614 | 683.841 |   1.04× |
| Cold per-Set host | construct lookup   |  17.070 |  16.903 |   1.01× |

Warm best-fit construction improves 1.16–1.23×. Lookup remains a control;
cold preparation is recorded separately, without a general cold-start claim.

Raw timings and checksums:
[numberformat-constructor-snapshots-results.json](numberformat-constructor-snapshots-results.json).
These are Node microbenchmarks, not Hermes/mobile latency. Formatting speed is
not measured by the constructor-only lane.

```sh
bazel run -c opt //packages/intl-numberformat/benchmark:audit -- \
  --all-locales --constructors-only --constructor-iterations=10000
bazel run -c opt //packages/intl-numberformat/benchmark:audit -- \
  --all-locales --constructors-only --constructor-iterations=10000 --polyfill-plurals
bazel run -c opt //packages/intl-numberformat/benchmark:audit -- \
  --all-locales --constructors-only --constructor-iterations=100 --fresh-locale-sets
```

## Validation

Tests retain array/Set replacement, same-size reordering, canonical-alias ties,
changes through native Set prototype methods, cross-realm Sets, and frozen public
arrays with changing getters. The matcher suite compares shared fixtures and the
independent ICU4J matching grid; formatter suites and unchanged ICU snapshots
guard the NumberFormat path. Existing exact-plural/range findings are unaffected.

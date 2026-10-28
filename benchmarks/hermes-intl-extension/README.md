# Hermes Intl extension benchmark

Build Hermes with the [FormatJS contrib package](../../native/hermes/package/contrib/README.md),
then build and run the benchmark bundle:

```sh
bazel build //benchmarks/hermes-intl-extension:suite_bundle
/path/to/hermes bazel-bin/benchmarks/hermes-intl-extension/suite_bundle.js
```

The bundle registers English locale data in the TypeScript constructors, restores
the native constructors, checks matching output, then times 10,000 repeated calls
per round. Each result uses the median of seven rounds. Both implementations run
in the same Hermes process with the same locale and input.

Pinned Hermes `393a539e6`, Linux x86_64, Intel Xeon Platinum 8488C:

| Operation               | Native / 10k | TypeScript / 10k | Native speedup |
| ----------------------- | -----------: | ---------------: | -------------: |
| `NumberFormat.format`   |        36 ms |         3,428 ms |          95.2x |
| `ListFormat.format`     |        73 ms |            38 ms |          0.52x |
| `DateTimeFormat.format` |        73 ms |         1,497 ms |          20.5x |

These are one host's steady-state timings, not startup or package-size results.

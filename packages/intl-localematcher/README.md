# Intl LocaleMatcher

[Documentation](https://formatjs.github.io/docs/polyfills/intl-localematcher).

Best fit uses CLDR language distances, requested-locale ordering and supported
locale preferences. Lookup uses RFC 4647 prefix matching.

## Performance

Canonical tags, maximized locales and supported-list indexes are cached for
repeated matches. Mutable best-fit arrays remain checked before cache reuse.
`ResolveLocale` checks Set contents and order before reusing its private snapshot;
matching that snapshot avoids a second validation scan. Later mutations retain
first-match ordering and locale-data selection.

[Constructor measurements](../../knowledge-base/audits/2026-10-31-numberformat-constructor-snapshots.md)
compare warm construction with the same supported locales. Keep cold preparation,
matching, construction and formatting measurements separate.

## Current measurements

Measured 2026-10-31 on Apple M4 Max, macOS arm64, Node 24.14.0 / ICU 78.2; source `56d15e997`. Median of seven warmed rounds.

| Operation           | TS ops/s | TS full helpers ops/s | Native JS ops/s |
| ------------------- | -------: | --------------------: | --------------: |
| best fit en         | 917,471† |               62,277† |               — |
| best fit en-US      |  470,600 |                72,354 |               — |
| best fit zh-TW      |  455,547 |                71,873 |               — |
| best fit sr-Latn-BA |  391,251 |                71,347 |               — |
| best fit en-XZ      |  456,567 |                72,177 |               — |
| fresh array         |   38,101 |                25,985 |               — |

[Methodology and raw results](../../benchmarks/polyfills/README.md).

Latest full Rust core coverage: [all-polyfill report](../../benchmarks/polyfills/README.md#rust-core-suite).

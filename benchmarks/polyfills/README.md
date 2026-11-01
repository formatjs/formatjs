# Polyfill benchmarks

```sh
bazel run -c opt //benchmarks/polyfills:benchmark -- --revision=$(git rev-parse HEAD) > /tmp/polyfills-host.json
bazel run -c opt //benchmarks/polyfills:benchmark -- --polyfill-dependencies --revision=$(git rev-parse HEAD) > /tmp/polyfills-full.json
```

Measured 2026-10-31 on Apple M4 Max, macOS arm64, Node 24.14.0 / ICU 78.2; source `56d15e997`. Median of seven warmed rounds.

[Host-helper results](./host-results.json) and [full-helper results](./full-results.json)
include per-round iteration counts, median/min/max microseconds, output samples,
and runtime metadata. This suite covers all 12 polyfills plus LocaleMatcher.

Each workload calibrates a batch to at least 50 ms, then measures seven batches.
Throughput is 1,000,000 / median microseconds per call, including loop and result
consumption overhead. Setup, imports, English locale registration, timezone data,
and calibration are excluded. Run sequentially without competing builds.
Construction includes `resolvedOptions()` to consume the resulting instance.
These warmed measurements do not measure startup, cold caches, or mobile devices.

Dynamic formatters register only English. Other packages use their bundled data.
LocaleMatcher uses all 657 CLDR locales; cached-array and fresh-array rows differ.
NumberFormat rotates nine values (including -0, fractions, small/large exponents);
its x60 row is one batch of integers 0–59, not one formatted number.
DateTimeFormat rotates two fixed 2024 timestamps and explicit UTC/New York zones.
Segmenter iterates complete short English/emoji and Japanese strings; containing
rows create a segments object and inspect index 7. Collator rows perform one
comparison. DurationFormat uses 1h 23m 45.123s; remaining cases are in the source.

TS columns call FormatJS exports with host Intl helpers still available.
TS full helpers installs all FormatJS Intl APIs before constructing timed objects;
native controls retain original built-ins. Native ICU and FormatJS CLDR data can
differ. Results describe these workloads, not conformance or universal speedups.
Min/max spread includes GC/JIT effects; small differences need repeated runs.
† marks noisy rows whose seven-round max/min exceeds 1.5; treat them as rough estimates.

## Collator

| Operation                   |  TS ops/s | TS full helpers ops/s | Native JS ops/s |
| --------------------------- | --------: | --------------------: | --------------: |
| compare Latin               | 1,737,941 |             1,730,040 |      24,294,971 |
| compare accent              | 1,518,781 |             1,571,911 |      15,283,545 |
| compare numeric             | 1,056,659 |             1,087,461 |      10,675,164 |
| compare normalization       | 1,225,996 |             1,260,143 |      11,569,382 |
| compare Swedish             |   844,532 |               833,611 |      17,516,847 |
| compare CJK                 |     5,823 |                 5,840 |      21,267,978 |
| construct + resolvedOptions |   751,190 |               623,669 |         477,774 |

## DateTimeFormat

| Operation                   | TS ops/s | TS full helpers ops/s | Native JS ops/s |
| --------------------------- | -------: | --------------------: | --------------: |
| format date                 |  849,803 |               772,347 |       2,578,151 |
| formatToParts               |  822,550 |               727,054 |         996,306 |
| formatRange                 |  306,935 |               286,979 |          90,907 |
| formatRangeToParts          |  296,790 |               286,306 |          81,258 |
| format date time            |  600,028 |               507,938 |       1,761,259 |
| format fractional seconds   |  673,757 |               586,938 |       1,965,520 |
| format zone name            |  448,480 |               394,450 |         990,488 |
| construct + resolvedOptions |    2,837 |                 3,085 |          43,700 |

## DisplayNames

| Operation                   |  TS ops/s | TS full helpers ops/s | Native JS ops/s |
| --------------------------- | --------: | --------------------: | --------------: |
| of language                 | 2,313,876 |               132,623 |         924,125 |
| construct + resolvedOptions |  434,929† |               434,551 |        342,502† |

## DurationFormat

| Operation                   | TS ops/s | TS full helpers ops/s | Native JS ops/s |
| --------------------------- | -------: | --------------------: | --------------: |
| format long                 |   89,664 |                89,675 |          31,950 |
| formatToParts long          |   91,340 |                89,470 |          29,683 |
| format digital              |  132,696 |               176,617 |          77,434 |
| formatToParts digital       |  134,372 |               172,715 |          65,289 |
| construct + resolvedOptions |  184,968 |               175,152 |          33,707 |

## getCanonicalLocales

| Operation               | TS ops/s | TS full helpers ops/s | Native JS ops/s |
| ----------------------- | -------: | --------------------: | --------------: |
| aliases + deduplication |   49,249 |                49,423 |         200,113 |

## ListFormat

| Operation                   |  TS ops/s | TS full helpers ops/s | Native JS ops/s |
| --------------------------- | --------: | --------------------: | --------------: |
| format                      | 3,400,324 |             3,216,479 |       2,220,136 |
| formatToParts               | 3,097,416 |             3,041,058 |         972,724 |
| construct + resolvedOptions |   917,700 |               826,297 |         823,913 |

## Locale

| Operation                   | TS ops/s | TS full helpers ops/s | Native JS ops/s |
| --------------------------- | -------: | --------------------: | --------------: |
| construct + resolvedOptions |  153,508 |               212,989 |         495,987 |
| maximize                    |  129,910 |               167,115 |         926,798 |

## LocaleMatcher

| Operation           | TS ops/s | TS full helpers ops/s | Native JS ops/s |
| ------------------- | -------: | --------------------: | --------------: |
| best fit en         | 917,471† |               62,277† |               — |
| best fit en-US      |  470,600 |                72,354 |               — |
| best fit zh-TW      |  455,547 |                71,873 |               — |
| best fit sr-Latn-BA |  391,251 |                71,347 |               — |
| best fit en-XZ      |  456,567 |                72,177 |               — |
| fresh array         |   38,101 |                25,985 |               — |

## NumberFormat

| Operation                   |  TS ops/s | TS full helpers ops/s | Native JS ops/s |
| --------------------------- | --------: | --------------------: | --------------: |
| format decimal              | 1,599,170 |             1,587,734 |       3,831,639 |
| formatToParts               | 1,485,792 |             1,448,501 |         830,322 |
| formatRange                 |   585,925 |               584,530 |          63,138 |
| formatRangeToParts          |   621,251 |               627,891 |          55,439 |
| time values x60             |    79,629 |                80,705 |          98,065 |
| format currency             | 1,212,590 |             1,200,218 |       3,460,517 |
| format unit                 |   847,284 |               510,565 |       3,103,808 |
| format percent              | 1,484,939 |             1,473,882 |       3,439,826 |
| format scientific           |   821,324 |               831,359 |       3,729,988 |
| format compact              |   320,403 |               271,129 |       3,385,488 |
| format significant digits   |   728,792 |               760,763 |       3,430,845 |
| construct + resolvedOptions |   414,271 |               388,558 |         212,664 |

## PluralRules

| Operation                   | TS ops/s | TS full helpers ops/s | Native JS ops/s |
| --------------------------- | -------: | --------------------: | --------------: |
| select cardinal             |  932,544 |               919,918 |       4,552,086 |
| select ordinal              |  861,028 |               875,162 |       2,645,170 |
| construct + resolvedOptions |  685,222 |               621,338 |         316,752 |

## RelativeTimeFormat

| Operation                   |  TS ops/s | TS full helpers ops/s | Native JS ops/s |
| --------------------------- | --------: | --------------------: | --------------: |
| format                      | 1,837,679 |             1,279,280 |       5,014,887 |
| formatToParts               | 1,957,444 |             1,314,708 |       2,128,231 |
| construct + resolvedOptions |   655,920 |               584,223 |         221,976 |

## Segmenter

| Operation                   |   TS ops/s | TS full helpers ops/s | Native JS ops/s |
| --------------------------- | ---------: | --------------------: | --------------: |
| iterate grapheme            |    124,953 |               125,293 |         408,686 |
| containing grapheme         | 1,249,213† |            1,012,022† |      1,690,622† |
| iterate word                |     83,901 |                80,581 |        415,554† |
| containing word             |    462,305 |               451,576 |      1,123,222† |
| iterate sentence            |     49,657 |                50,576 |      1,085,707† |
| containing sentence         |     99,709 |               100,245 |      1,950,412† |
| construct + resolvedOptions |     11,380 |                11,391 |         221,330 |

## supportedValuesOf

| Operation | TS ops/s | TS full helpers ops/s | Native JS ops/s |
| --------- | -------: | --------------------: | --------------: |
| calendar  |   29,875 |                45,964 |        319,540† |
| timeZone  |    1,193 |                 1,702 |          16,757 |
| unit      |   10,122 |                39,207 |         519,946 |

## Earlier focused Rust suites

```sh
bazel run -c opt //crates/intl_numberformat:benchmark
bazel run -c opt //crates/intl_datetimeformat:audit -- --benchmark --iterations=12000
bazel run -c opt //crates/intl_localematcher:matcher_bench
```

Same machine/source revision, optimized builds. [Raw Rust results](./rust-results.json).
These are separate workloads, not direct JS/native comparisons. NumberFormat and
DateTimeFormat report seven-round medians; LocaleMatcher reports one 100,000-call
batch per request against 11 supported tags. It constructs the matcher before timing.

| Suite / operation                         | µs/call |   Calls/s |
| ----------------------------------------- | ------: | --------: |
| numberformat / decimal                    |   0.450 | 2,222,051 |
| numberformat / currency                   |   0.681 | 1,469,178 |
| numberformat / unit                       |   1.002 |   998,298 |
| numberformat / scientific                 |   0.558 | 1,791,881 |
| numberformat / compact                    |   0.731 | 1,367,554 |
| numberformat / compact currency           |   0.806 | 1,240,454 |
| numberformat / compact significant digits |   0.723 | 1,383,790 |
| datetimeformat / date format              |   1.234 |   810,120 |
| datetimeformat / date parts               |   1.157 |   864,626 |
| datetimeformat / date range               |   1.406 |   711,176 |
| datetimeformat / date range parts         |   1.374 |   727,933 |
| datetimeformat / date time format         |   1.875 |   533,336 |
| datetimeformat / date time parts          |   1.802 |   554,852 |
| datetimeformat / date time range          |   4.278 |   233,729 |
| datetimeformat / date time range parts    |   4.225 |   236,713 |
| datetimeformat / fractional format        |   1.857 |   538,613 |
| datetimeformat / fractional parts         |   1.871 |   534,403 |
| datetimeformat / fractional range         |   5.164 |   193,638 |
| datetimeformat / fractional range parts   |   5.053 |   197,884 |
| datetimeformat / zone name format         |   2.750 |   363,642 |
| datetimeformat / zone name parts          |   2.573 |   388,582 |
| datetimeformat / zone name range          |   7.165 |   139,571 |
| datetimeformat / zone name range parts    |   6.851 |   145,963 |
| datetimeformat / arab digits format       |   2.145 |   466,143 |
| datetimeformat / arab digits parts        |   2.033 |   491,957 |
| datetimeformat / arab digits range        |   4.940 |   202,412 |
| datetimeformat / arab digits range parts  |   4.673 |   214,002 |
| localematcher / en                        |   0.267 | 3,745,318 |
| localematcher / en-US                     |   0.313 | 3,194,888 |
| localematcher / zh-TW                     |   0.320 | 3,125,000 |
| localematcher / es-MX                     |   0.320 | 3,125,000 |
| localematcher / sr-Latn-BA                |   0.333 | 3,003,003 |
| localematcher / en-XZ                     |   0.307 | 3,257,329 |

## Rust core suite

```sh
bazel run -c opt //benchmarks/polyfills:rust_benchmark -- --revision=$(git rev-parse HEAD) > /tmp/polyfills-rust.json
```

[All Rust results](./rust-all-results.json): all 12 Rust polyfills plus LocaleMatcher,
61 workloads, seven rounds after at least 50 ms of calibration. Same machine/source
revision as the TS suite; optimized `-c opt` build. Results retain all seven samples,
median/min/max, throughput, checksums, supported-locale count, and machine metadata.

TS and native JS measurements include their JavaScript API calls. Rust measures
crate APIs directly: no Hermes/JSI calls, observable JS coercion, or JS result-object
materialization. Numeric inputs are decimal strings; list/collation inputs are
pre-encoded UTF-16. Segmenter clones an owned UTF-16 input per call. Rust output
allocations and destruction remain timed; input option decoding during DateTimeFormat
construction/probes is timed too. Constructors also read resolved options.

All dynamic Rust registries load only English JSON packs before timing, including
DurationFormat's native NumberFormat/ListFormat dependencies. This is a Rust core
workload, not an end-to-end compiled-data SDK or mobile benchmark. supportedValuesOf
uses real Rust formatter probes against those registries and Gregorian/timezone
data; it does not use an accept-all callback. Enumeration results may differ from
TS/native JS because installed data and capabilities differ.

The representative values, date timestamps, strings, styles, and 657-locale supported
set match TS where APIs permit. Rust LocaleMatcher reuses a prepared matcher; TS
still validates its mutable supported array. Rust has no corresponding fresh-array
row. These boundary/preparation differences prevent direct cross-language speedup
claims. † uses the same seven-round max/min > 1.5 noise marker.

### Rust Collator

| Rust core operation         | µs/call | Rust core ops/s |
| --------------------------- | ------: | --------------: |
| compare Latin               |   1.039 |         962,836 |
| compare accent              |   0.923 |       1,083,543 |
| compare numeric             |   1.358 |         736,517 |
| compare normalization       |   1.213 |         824,714 |
| compare Swedish             |   1.905 |         524,860 |
| compare CJK                 | 124.791 |           8,013 |
| construct + resolvedOptions |   0.910 |       1,098,627 |

### Rust DateTimeFormat

| Rust core operation         | µs/call | Rust core ops/s |
| --------------------------- | ------: | --------------: |
| format date                 |   1.151 |         868,526 |
| formatToParts               |   1.153 |         867,064 |
| formatRange                 |   3.349 |         298,607 |
| formatRangeToParts          |   3.245 |         308,131 |
| format date time            |   2.283 |         438,087 |
| format fractional seconds   |   1.978 |         505,553 |
| format zone name            |   2.599 |         384,765 |
| construct + resolvedOptions |  44.814 |          22,314 |

### Rust DisplayNames

| Rust core operation         | µs/call | Rust core ops/s |
| --------------------------- | ------: | --------------: |
| of language                 |  0.194† |      5,154,025† |
| construct + resolvedOptions |   0.039 |      25,669,577 |

### Rust DurationFormat

| Rust core operation         | µs/call | Rust core ops/s |
| --------------------------- | ------: | --------------: |
| format long                 |   4.084 |         244,837 |
| formatToParts long          |   3.996 |         250,227 |
| format digital              |   1.719 |         581,591 |
| formatToParts digital       |   1.628 |         614,293 |
| construct + resolvedOptions |   0.806 |       1,241,261 |

### Rust getCanonicalLocales

| Rust core operation | µs/call | Rust core ops/s |
| ------------------- | ------: | --------------: |
| aliases             |   0.758 |       1,319,086 |

### Rust ListFormat

| Rust core operation         | µs/call | Rust core ops/s |
| --------------------------- | ------: | --------------: |
| format                      |   0.038 |      26,195,586 |
| formatToParts               |   0.159 |       6,294,216 |
| construct + resolvedOptions |   0.045 |      22,265,695 |

### Rust Locale

| Rust core operation         | µs/call | Rust core ops/s |
| --------------------------- | ------: | --------------: |
| construct + resolvedOptions |   0.168 |       5,948,875 |
| maximize                    |   0.218 |       4,578,961 |

### Rust LocaleMatcher

| Rust core operation | µs/call | Rust core ops/s |
| ------------------- | ------: | --------------: |
| best fit en         |   0.213 |       4,701,052 |
| best fit en-US      |   0.307 |       3,252,047 |
| best fit zh-TW      |   0.302 |       3,313,115 |
| best fit sr-Latn-BA |   0.289 |       3,461,826 |
| best fit en-XZ      |   0.294 |       3,396,469 |

### Rust NumberFormat

| Rust core operation         | µs/call | Rust core ops/s |
| --------------------------- | ------: | --------------: |
| format decimal              |   0.430 |       2,326,815 |
| formatToParts               |   0.409 |       2,442,026 |
| formatRange                 |   1.035 |         966,362 |
| formatRangeToParts          |   0.950 |       1,052,147 |
| time values x60             |  14.991 |          66,706 |
| format currency             |   0.675 |       1,480,993 |
| format unit                 |   1.022 |         978,777 |
| format percent              |   0.549 |       1,820,686 |
| format scientific           |   0.565 |       1,770,631 |
| format compact              |   0.717 |       1,394,030 |
| format significant digits   |   0.483 |       2,068,331 |
| construct + resolvedOptions |   1.057 |         945,655 |

### Rust PluralRules

| Rust core operation         | µs/call | Rust core ops/s |
| --------------------------- | ------: | --------------: |
| select cardinal             |   0.059 |      16,854,579 |
| select ordinal              |   0.065 |      15,323,842 |
| construct + resolvedOptions |   0.073 |      13,781,888 |

### Rust RelativeTimeFormat

| Rust core operation         | µs/call | Rust core ops/s |
| --------------------------- | ------: | --------------: |
| format                      |   0.229 |       4,372,361 |
| formatToParts               |   0.288 |       3,467,085 |
| construct + resolvedOptions |   0.544 |       1,839,359 |

### Rust Segmenter

| Rust core operation         | µs/call | Rust core ops/s |
| --------------------------- | ------: | --------------: |
| iterate grapheme            |   0.603 |       1,659,686 |
| containing grapheme         |   0.547 |       1,828,818 |
| iterate word                |   0.669 |       1,493,850 |
| containing word             |   0.643 |       1,556,216 |
| iterate sentence            |   0.222 |       4,503,509 |
| containing sentence         |   0.216 |       4,622,556 |
| construct + resolvedOptions |   0.749 |       1,335,186 |

### Rust supportedValuesOf

| Rust core operation |   µs/call | Rust core ops/s |
| ------------------- | --------: | --------------: |
| calendar            |   878.891 |           1,138 |
| timeZone            | 20653.490 |              48 |
| unit                |    60.491 |          16,531 |

# Shipped Umm al-Qura fallback joins

2026-11-22. Generated-data/source audit with literal production controls below. Runtime arithmetic is unchanged. No shipped inverse failure found at either fallback join. Arbitrary accepted custom packs are not used to justify a runtime rejection change.

## Exact artifacts checked

Located by enumerating existing bazel-bin files, not guessing transitioned output paths:

- bazel-bin/packages/intl-datetimeformat/scripts/calendar-data/umm-al-qura.ts SHA256 `073bdb8641d224a74bdb21a92ee917d679f5e249e7efbe78d45d3bd9c5f2af45`.
- bazel-bin/crates/intl_datetimeformat_calendars/calendar-data/islamic-umalqura.json SHA256 `1c3b9e776cdd623501c43301ababc7169843bb6d3499bd5413c62b9aab1c8534`.

Rechecked with `bazel cquery --output=files` for `//packages/intl-datetimeformat/scripts/calendar-data:umm_al_qura_data` and `//crates/intl_datetimeformat_calendars:calendar-data/islamic-umalqura.json`; all available resolved outputs match these hashes.

Parsed generated numeric literals; TS data equals Rust JSON data exactly. AST scan also inspected generated TS declaration. Pack has firstYear1299,304 month-length words covering1299..1602 inclusive,305 starts ending at sentinel1603. Independent data arithmetic verified every word<4096 and every `starts[i+1] = starts[i]+348+popcount(word[i])`.

Civil formula from existing arithmetic source (core.rs:141; same TS Arithmetic.ts):

`civilStart(y) = -492148 +354*(y-1)+floor((3+11*y)/30)`.

No production conversion helper was executed to derive expected coordinates.

|                           Year | Generated start | Civil start | Difference | ISO date   |
| -----------------------------: | --------------: | ----------: | ---------: | ---------- |
|          1299 first table year |          -32180 |      -32180 |          0 | 1881-11-23 |
|     1300 official range begins |          -31826 |      -31826 |          0 | 1882-11-12 |
|       1600 final official year |           74485 |       74484 |          1 | 2173-12-07 |
|  1601 first post-official year |           74839 |       74839 |          0 | 2174-11-26 |
|       1602 final supplied year |           75193 |       75193 |          0 | 2175-11-15 |
| 1603 exclusive length sentinel |           75547 |       75547 |          0 | 2176-11-03 |

ISO dates for first/final joins independently computed by ordinary Gregorian day counting. Interior year1600 intentionally differs from civil; table correctness does not require every internal year to equal civil. Both physical supplied-data joins do align.

First/final complete supplied years1299 and1602 both have packed1365: alternating30/29 days,354days total, identical to civil lengths for those years. Previous year1298 is also354days, so its final month has29days. Sentinel year1603 uses civil355days outside length table.

## Why this closes shipped join consistency

TS calendar-table.ts:72–77 supplies starts through **sentinel1603**, while :100–105 supplies month lengths only through1602; callers fall back to IslamicCivil outside. Rust table_calendar.rs:199–205/:228–233 implements same split. Input conversion uses civil initial estimate then start-of-year adjustment, followed by positive month lengths (Rust:359–400; TS calendar.ts:388 onward).

Internal table starts are strictly increasing and match exact sums of positive month lengths. At first table year1299 its start equals civil1299, so preceding civil1298 ends exactly there. At final sentinel1603 its start equals civil1603, so civil1603 begins exactly where supplied1602 ends. Global chosen year-start sequence therefore has no overlap/hole across either join. Every chosen year's lengths sum to next chosen start, including adjacent fallback years.

Consequently year search and month subtraction form disjoint complete intervals; forward and inverse conversion agree across these joins under existing integer/range premises. This is a structural proof for **these shipped bytes**, not validation of Saudi astronomical accuracy or arbitrary borrowed packs. Original custom counterexample only limited what constructor checks alone establish; it is not a shipped failure or proposed rejection policy.

Host mode has a separate interval: starts use host years1300..1601; month
lengths use1300..1600. All six literal rows below lie outside that host interval,
so the host-profile run checks civil-fallback compatibility, not host-data
handoff continuity. Those host joins remain separate from this shipped-byte proof.

## Prior coverage gap

- Generator umm_al_qura.rs:20–44 deliberately begins1882-01-01, ends2176-01-01, includes complete adjacent years, and asserts sequential years/month ordinals. Source intent matches actual1299..1602 bytes.
- TemporalTableCalendarOracle.java:134–159 emits Umm fields only AH1300..1600, additions/differences avoid first/final three years. Therefore it does not exercise actual1299/1603 storage joins.
- Cached temporal-table-calendar-fixtures.tsv contains no Umm rows at epochs-32181,-32180,-32179,75546,75547,75548.
- host-calendar-boundary.test.mjs checks Temporal global extrema for Umm, but named compact/host joins loop only Chinese/Dangi. Host_calendar.test.mjs samples civil fallback AH1200/1700; no literal1299/1603 storage joins.
- Prior Rust table tests sampled global public epochs and raw±110million until, with no literal join dates. New literal controls below fill that specific gap.

## Literal production controls

Six literal rows, `islamic-umalqura`, now run through public Temporal classes and Rust shipped TableCalendar:

|  Epoch | ISO        | Year | Month/code | Day |
| -----: | ---------- | ---: | ---------- | --: |
| -32181 | 1881-11-22 | 1298 | 12 / M12   |  29 |
| -32180 | 1881-11-23 | 1299 | 1 / M01    |   1 |
| -32179 | 1881-11-24 | 1299 | 1 / M01    |   2 |
|  75546 | 2176-11-02 | 1602 | 12 / M12   |  29 |
|  75547 | 2176-11-03 | 1603 | 1 / M01    |   1 |
|  75548 | 2176-11-04 | 1603 | 1 / M01    |   2 |

Controls assert hardcoded year/month/code/day and forward reject-overflow conversion to the literal ISO date (TS) or epoch (Rust). Two public crossing controls add one day at each join and subtract it back; one-day differences also retain P1D. Distinguishes actual table/civil handoff from repeating out-of-range civil samples. The shared public helper uses ISO constructors and hardcoded expected fields. It runs only in implementation profiles; independent ICU reference tests do not inherit this chosen-data policy.

Rust controls reuse the [existing shipped loader](../../crates/intl_datetimeformat_calendars/table_calendar.test.rs#L121). TS controls are a separate
[checkUmmAlQuraJoins](../../packages/temporal/tests/public-calendar-oracle.ts#L256), explicitly called by
table-calendars.test.ts, table-calendar-host.ts and native-iso-host.ts. The
independent reference checker remains unchanged. All nine focused targets pass
(two executed, seven cached in the final run);
[manifest](temporal-provider-closure-validation-targets.txt).

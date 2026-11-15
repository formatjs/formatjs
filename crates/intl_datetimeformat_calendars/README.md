# formatjs_intl_datetimeformat_calendars

Shared numeric calendars and optional providers for native DateTimeFormat. The base
`formatjs_intl_datetimeformat` crate does not depend on this crate or its tables.
The standalone crate lets applications register selected calendars; the
`with_compiled_data` variant registers all calendars for Hermes. Locale patches
load separately through `Runtime::add_calendar_locale_data`.

`Provider::arithmetic(name)` constructs Buddhist, Coptic, Ethiopic, Amete Alem,
ROC, Japanese, Indian, civil/tabular Islamic, Persian or Hebrew arithmetic.
`Provider::from_json` accepts the selected calendar pack, including Umm al-Qura,
Chinese and Dangi tables. `register` installs it into a runtime. Providers receive
timezone-adjusted milliseconds and retain the TS calendar contract's zero-based
month indices, era keys and optional leap/related/cyclic-year fields.

```rust
use formatjs_intl_datetimeformat::Runtime;
use formatjs_intl_datetimeformat_calendars::Provider;

let runtime = Runtime::default();
Provider::arithmetic("hebrew").unwrap().register(&runtime);
```

`//crates/intl_datetimeformat_calendars:calendar_data` generates one JSON pack per
calendar. The eleven arithmetic packs contain only a calendar identifier. Table
packs reuse the pinned TS ICU4X generators. The `with_compiled_data` target embeds
all packs in the Rust archive and registers them when Hermes creates a
DateTimeFormat registry. Loads validate table indices, bit widths, year/checkpoint counts,
checkpoint positions and final bounds before registration.

Umm al-Qura uses the same official month data and civil fallback as TS.
Chinese/Dangi retain dictionary compression and checkpoints every 64 years.
Persian uses the pinned TS 33-year arithmetic cycle. Gregorian-aligned calendars,
negative years and era transitions use the same formulas as the pinned Temporal
adapter; no host Date/Intl/ICU runs in the provider.

Differential coverage compares all fourteen providers over Date bounds, negative
submilliseconds, era boundaries, seeded full-range instants, every table
checkpoint and modern lunar month transitions. Rendering checks eight language
families, localized digits, standalone names, leap/cyclic years, styles, exact
Temporal values and range parts. Malformed packs reject before registration.

```sh
bazel test -c opt //:rust_datetime_pattern_test \
  //:rust_datetime_pattern_test_typecheck_typecheck_test \
  //crates/intl_datetimeformat_calendars/scripts:typecheck_typecheck_test
```

`datetimeformat_calendars.h` exposes `formatjs_datetime_calendar_load` for the
core DateTimeFormat registry. It validates a selected pack before replacement;
failed loads leave the previous provider installed. Locale patches still load
separately. Both ABIs export through the single Rust SDK archive. Hermes loads
compiled packs at startup; other embedders may call the selected-pack loader.

## Numeric calendar kernel

`calendar` exposes 13 allocation-free arithmetic engines: ISO, Gregorian,
Buddhist, Japanese, ROC, Coptic, Ethiopic, Amete Alem, Hebrew, Indian, civil/tabular
Islamic and Persian. It supplies signed years, ordinal months/month codes, eras,
checked epoch-day conversion, constrained/rejected addition and calendar
differences. Fixed 13-month calendars accept M13; Hebrew uses M05L.

```rust
use formatjs_intl_datetimeformat_calendars::calendar::{Calendar, Overflow};
let calendar = Calendar::Hebrew;
let day = calendar.to_epoch_day(5784, 6, 30, Overflow::Reject).unwrap();
assert!(calendar.from_epoch_day(day).unwrap().month_code.leap);
```

Default `provider` feature retains DateTimeFormat registration, JSON and C ABI.
`default-features = false` selects only the dependency-free `no_std` numeric
kernel; explicitly disabling defaults no longer exposes Provider. Bazel's
`:calendar_core` variant has no formatter/serde dependencies. `compiled_data`
enables `provider`. Native Temporal reuses this kernel for ISO conversion,
addition and differences; public non-ISO Temporal types remain pending.

Public epoch-day operations enforce -100000001 through 100000000. `until_raw`
accepts internal rounding coordinates within ±110000000 days; `iso_day` and
`iso_fields` are unchecked numeric helpers for validated coordinates. Era input
normalizes signed era years, including regnal years outside their era's dates.
Persian retains the existing 33-year approximation outside official years
1206–1498 AP. Chinese, Dangi and Umm al-Qura remain separate provider tables.

Independent ICU4J controls cover 34,366 fields and 32,352 additions, plus 176
range rejections, in Rust and TS on Node/Hermes source/bytecode. Hebrew ICU
controls use epoch days ±1000000; Persian uses its official range. Full-range
proleptic roundtrip and addition/difference invariants run separately.
Lengths and clamping derive from ICU forward fields and binary-searched month/
year boundaries. ICU's negative-year Coptic/Ethiopic month-length calculation
and reverse Indian field setting are unsuitable controls at those extremes.
These oracle limits do not exclude Temporal conformance tests.

Difference prefixes compare unregulated days and month codes before constraining
the final anchor. `add` and `until` are not inverses at clamped month ends.
Independent ICU forward-field controls now include 32,352 differences as well as
addition. The oracle compares calendar tuples before day clamping instead of
assuming Calendar.add can be inverted. Day-of-year and weekday fields are checked
in both languages too.

## Borrowed table calendars

`table_calendar::TableCalendar` adds Chinese, Dangi and Umm al-Qura numeric
engines. `LunisolarData` and `UmmAlQuraData` borrow caller-owned packs. Constructors
validate dictionary entries, encoding, month/day checkpoints and end bounds before
use. The backend allocates nothing and embeds no tables into arithmetic-only
consumers. Native Temporal date classes still need non-ISO integration.

Both backends share checked addition and difference algorithms through private
`NumericCalendar`. Table lookup uses checkpoints every 64 years for days and
elapsed months. Chinese/Dangi use related Gregorian years, leap codes M01L–M12L,
and backward constraint to the corresponding common month. Umm al-Qura keeps
civil-calendar fallback outside its data range.

Independent table controls combine ICU4J with published HKO/KASI facts. Raw ICU79
has known Chinese astronomical and February 2017 Dangi boundary disagreements;
the raw diagnostic stays visible. See
[authority provenance](../../conformance-tests/calendar-authorities/README.md).
Official month starts additionally exercise inverse conversion, month lengths
and next-month addition directly in Rust and TS. Internal table coordinates cover
±110000000 epoch days; public constructors retain Temporal date limits.

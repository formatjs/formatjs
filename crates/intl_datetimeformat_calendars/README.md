# formatjs_intl_datetimeformat_calendars

Optional arithmetic providers for the native DateTimeFormat runtime. The base
`formatjs_intl_datetimeformat` crate does not depend on this crate or its tables.
Register only the calendar requested by the application; locale patches load
separately through `Runtime::add_calendar_locale_data`.

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
packs reuse the pinned TS ICU4X generators; nothing compiles their data into the
provider library. Loads validate table indices, bit widths, year/checkpoint counts,
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

C ABI, Hermes registration and SDK packaging remain unfinished.

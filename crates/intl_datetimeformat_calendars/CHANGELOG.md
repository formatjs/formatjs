# Changelog

## [1.0.0](https://github.com/formatjs/formatjs/compare/formatjs_intl_datetimeformat_calendars_v0.3.0...formatjs_intl_datetimeformat_calendars_v1.0.0) (2026-11-19)


### ⚠ BREAKING CHANGES

* **@formatjs/temporal:** removes @formatjs/temporal/wasm.js, wasm-native.js, temporal-backend.wasm, and Rust's WASM binary module.

### Performance Improvements

* **@formatjs/temporal:** drop WASM and speed up Rust and TS ([1e56b50](https://github.com/formatjs/formatjs/commit/1e56b50d533d08c1c2d6a05e909d4414c2562eaa))

## [0.3.0](https://github.com/formatjs/formatjs/compare/formatjs_intl_datetimeformat_calendars_v0.2.3...formatjs_intl_datetimeformat_calendars_v0.3.0) (2026-11-17)


### Features

* **@formatjs/temporal:** add Temporal for TypeScript, Rust and Hermes ([#8016](https://github.com/formatjs/formatjs/issues/8016)) ([8d5f2a4](https://github.com/formatjs/formatjs/commit/8d5f2a4064cd0bb6e9310b9d91f4daf4f1399582))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_datetimeformat bumped from 1.0.2 to 1.1.0

## [0.2.3](https://github.com/formatjs/formatjs/compare/formatjs_intl_datetimeformat_calendars_v0.2.2...formatjs_intl_datetimeformat_calendars_v0.2.3) (2026-11-08)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_datetimeformat bumped from 1.0.1 to 1.0.2

## [0.2.2](https://github.com/formatjs/formatjs/compare/formatjs_intl_datetimeformat_calendars_v0.2.1...formatjs_intl_datetimeformat_calendars_v0.2.2) (2026-10-31)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_datetimeformat bumped from 1.0.0 to 1.0.1

## [0.2.1](https://github.com/formatjs/formatjs/compare/formatjs_intl_datetimeformat_calendars_v0.2.0...formatjs_intl_datetimeformat_calendars_v0.2.1) (2026-10-31)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_datetimeformat bumped from 0.2.0 to 1.0.0

## [0.2.0](https://github.com/formatjs/formatjs/compare/formatjs_intl_datetimeformat_calendars_v0.1.0...formatjs_intl_datetimeformat_calendars_v0.2.0) (2026-10-30)


### Features

* **intl_datetimeformat:** compile calendars into Hermes runtime ([#7716](https://github.com/formatjs/formatjs/issues/7716)) ([0e547ec](https://github.com/formatjs/formatjs/commit/0e547ec8b34561d6f1f2278110faa6e355d87724))
* **intl_datetimeformat:** port DateTimeFormat to Rust and Hermes ([#7698](https://github.com/formatjs/formatjs/issues/7698)) ([270aa61](https://github.com/formatjs/formatjs/commit/270aa61c835bfc96499843345242710508952777))


### Bug Fixes

* release Intl crates through Bazel and shared workflow ([#7727](https://github.com/formatjs/formatjs/issues/7727)) ([53de4af](https://github.com/formatjs/formatjs/commit/53de4af2e5a1b0c9c56a6fde05304274b43f188b))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_datetimeformat bumped from 0.1.0 to 0.2.0

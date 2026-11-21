# Changelog

## [2.0.1](https://github.com/formatjs/formatjs/compare/formatjs_temporal_v2.0.0...formatjs_temporal_v2.0.1) (2026-11-21)


### Bug Fixes

* **@formatjs/temporal:** never throw from Temporal.Now.timeZoneId() ([#8050](https://github.com/formatjs/formatjs/issues/8050)) ([d52bef4](https://github.com/formatjs/formatjs/commit/d52bef495ad4d76b722f47b41680e053694f9631))

## [2.0.0](https://github.com/formatjs/formatjs/compare/formatjs_temporal_v1.1.0...formatjs_temporal_v2.0.0) (2026-11-19)


### ⚠ BREAKING CHANGES

* **@formatjs/temporal:** removes @formatjs/temporal/wasm.js, wasm-native.js, temporal-backend.wasm, and Rust's WASM binary module.

### Performance Improvements

* **@formatjs/temporal:** drop WASM and speed up Rust and TS ([1e56b50](https://github.com/formatjs/formatjs/commit/1e56b50d533d08c1c2d6a05e909d4414c2562eaa))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_datetimeformat_calendars bumped from 0.3.0 to 1.0.0

## [1.1.0](https://github.com/formatjs/formatjs/compare/formatjs_temporal_v1.0.0...formatjs_temporal_v1.1.0) (2026-11-17)


### Features

* **@formatjs/temporal:** add Temporal for TypeScript, Rust and Hermes ([#8016](https://github.com/formatjs/formatjs/issues/8016)) ([8d5f2a4](https://github.com/formatjs/formatjs/commit/8d5f2a4064cd0bb6e9310b9d91f4daf4f1399582))
* **@formatjs/temporal:** publish npm and Rust packages ([#8023](https://github.com/formatjs/formatjs/issues/8023)) ([6403c3f](https://github.com/formatjs/formatjs/commit/6403c3fa94a9e2b57272a163534e1fe18af2572e))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_datetimeformat_calendars bumped from 0.2.3 to 0.3.0

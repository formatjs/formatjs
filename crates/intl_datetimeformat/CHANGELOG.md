# Changelog

## [1.0.1](https://github.com/formatjs/formatjs/compare/formatjs_intl_datetimeformat_v1.0.0...formatjs_intl_datetimeformat_v1.0.1) (2026-10-31)


### Performance Improvements

* **@formatjs/intl-datetimeformat:** streamline numeric rendering ([cc09570](https://github.com/formatjs/formatjs/commit/cc09570af93673c056f2766cdf12d2951df5d949))

## [1.0.0](https://github.com/formatjs/formatjs/compare/formatjs_intl_datetimeformat_v0.2.0...formatjs_intl_datetimeformat_v1.0.0) (2026-10-31)


### ⚠ BREAKING CHANGES

* Locale-data exports follow CLDR 49: five locales added, 114 removed upstream.

### Features

* upgrade CLDR data to v49 ([#7827](https://github.com/formatjs/formatjs/issues/7827)) ([1618c29](https://github.com/formatjs/formatjs/commit/1618c29b7984ab04e56799284014e058e530b4bb))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_numberformat bumped from 0.2.0 to 0.2.1
    * formatjs_intl_getcanonicallocales bumped from 0.2.0 to 1.0.0
    * formatjs_intl_locale bumped from 0.2.0 to 1.0.0

## [0.2.0](https://github.com/formatjs/formatjs/compare/formatjs_intl_datetimeformat_v0.1.0...formatjs_intl_datetimeformat_v0.2.0) (2026-10-30)


### Features

* **intl_datetimeformat:** port DateTimeFormat to Rust and Hermes ([#7698](https://github.com/formatjs/formatjs/issues/7698)) ([270aa61](https://github.com/formatjs/formatjs/commit/270aa61c835bfc96499843345242710508952777))


### Bug Fixes

* **@formatjs/intl-localematcher:** align best fit with ICU defaults ([#7745](https://github.com/formatjs/formatjs/issues/7745)) ([9898211](https://github.com/formatjs/formatjs/commit/98982117414e6e658a141e71f837a0142894673f))
* **intl_datetimeformat:** compile IANA zones for Hermes Test262 ([#7720](https://github.com/formatjs/formatjs/issues/7720)) ([7fc5699](https://github.com/formatjs/formatjs/commit/7fc5699f75795d88b4d5dd63bffd6aa172955b07))
* **intl_locale:** prefer likely script for locale aliases ([#7744](https://github.com/formatjs/formatjs/issues/7744)) ([f6103eb](https://github.com/formatjs/formatjs/commit/f6103eb58f802295a1a14d779ae415bff25b5f64))
* release Intl crates through Bazel and shared workflow ([#7727](https://github.com/formatjs/formatjs/issues/7727)) ([53de4af](https://github.com/formatjs/formatjs/commit/53de4af2e5a1b0c9c56a6fde05304274b43f188b))


### Performance Improvements

* **intl_locale:** retain prepared matchers in native registries ([#7768](https://github.com/formatjs/formatjs/issues/7768)) ([a395be7](https://github.com/formatjs/formatjs/commit/a395be797f2c05387045451e4e3b7420abf4b929))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_data bumped from 0.1.0 to 0.2.0
    * formatjs_intl_numberformat bumped from 0.1.0 to 0.2.0
    * formatjs_intl_getcanonicallocales bumped from 0.1.0 to 0.2.0
    * formatjs_intl_locale bumped from 0.1.0 to 0.2.0

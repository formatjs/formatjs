# Changelog

## [0.2.1](https://github.com/formatjs/formatjs/compare/formatjs_intl_displaynames_v0.2.0...formatjs_intl_displaynames_v0.2.1) (2026-10-31)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_getcanonicallocales bumped from 0.2.0 to 1.0.0
    * formatjs_intl_locale bumped from 0.2.0 to 1.0.0

## [0.2.0](https://github.com/formatjs/formatjs/compare/formatjs_intl_displaynames_v0.1.0...formatjs_intl_displaynames_v0.2.0) (2026-10-30)


### Features

* **intl_datetimeformat:** port DateTimeFormat to Rust and Hermes ([#7698](https://github.com/formatjs/formatjs/issues/7698)) ([270aa61](https://github.com/formatjs/formatjs/commit/270aa61c835bfc96499843345242710508952777))
* **intl_displaynames:** port Intl.DisplayNames to Rust with Hermes integration ([#7693](https://github.com/formatjs/formatjs/issues/7693)) ([517f0c2](https://github.com/formatjs/formatjs/commit/517f0c247c9ef4973c4d41f7ae46ae6f3e49bf31))


### Bug Fixes

* **intl_locale:** prefer likely script for locale aliases ([#7744](https://github.com/formatjs/formatjs/issues/7744)) ([f6103eb](https://github.com/formatjs/formatjs/commit/f6103eb58f802295a1a14d779ae415bff25b5f64))
* release Intl crates through Bazel and shared workflow ([#7727](https://github.com/formatjs/formatjs/issues/7727)) ([53de4af](https://github.com/formatjs/formatjs/commit/53de4af2e5a1b0c9c56a6fde05304274b43f188b))


### Performance Improvements

* **intl_locale:** retain prepared matchers in native registries ([#7768](https://github.com/formatjs/formatjs/issues/7768)) ([a395be7](https://github.com/formatjs/formatjs/commit/a395be797f2c05387045451e4e3b7420abf4b929))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_data bumped from 0.1.0 to 0.2.0
    * formatjs_intl_getcanonicallocales bumped from 0.1.0 to 0.2.0
    * formatjs_intl_locale bumped from 0.1.0 to 0.2.0

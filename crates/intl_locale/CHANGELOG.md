# Changelog

## [1.0.0](https://github.com/formatjs/formatjs/compare/formatjs_intl_locale_v0.2.0...formatjs_intl_locale_v1.0.0) (2026-10-31)


### ⚠ BREAKING CHANGES

* Locale-data exports follow CLDR 49: five locales added, 114 removed upstream.

### Features

* upgrade CLDR data to v49 ([#7827](https://github.com/formatjs/formatjs/issues/7827)) ([1618c29](https://github.com/formatjs/formatjs/commit/1618c29b7984ab04e56799284014e058e530b4bb))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_localematcher bumped from 0.1.1 to 1.0.0
    * formatjs_intl_getcanonicallocales bumped from 0.2.0 to 1.0.0

## [0.2.0](https://github.com/formatjs/formatjs/compare/formatjs_intl_locale_v0.1.0...formatjs_intl_locale_v0.2.0) (2026-10-30)


### Features

* **intl_collator:** add Rust Hermes Collator extension ([#7695](https://github.com/formatjs/formatjs/issues/7695)) ([d51402b](https://github.com/formatjs/formatjs/commit/d51402bcd5108550a3b6533a7d89bfdcd322b62a))
* **intl_locale:** port Locale to Rust with Hermes extension ([#7689](https://github.com/formatjs/formatjs/issues/7689)) ([bb2c829](https://github.com/formatjs/formatjs/commit/bb2c8297af744191d7842497d23c15389135c550))
* **intl_pluralrules:** port Intl.PluralRules to Rust with Hermes integration ([#7691](https://github.com/formatjs/formatjs/issues/7691)) ([ef5451f](https://github.com/formatjs/formatjs/commit/ef5451fd646969e8b8b10464fd151d8b6c6cbd85))


### Bug Fixes

* **@formatjs/intl-localematcher:** align best fit with ICU defaults ([#7745](https://github.com/formatjs/formatjs/issues/7745)) ([9898211](https://github.com/formatjs/formatjs/commit/98982117414e6e658a141e71f837a0142894673f))
* **intl_locale:** prefer likely script for locale aliases ([#7744](https://github.com/formatjs/formatjs/issues/7744)) ([f6103eb](https://github.com/formatjs/formatjs/commit/f6103eb58f802295a1a14d779ae415bff25b5f64))
* release Intl crates through Bazel and shared workflow ([#7727](https://github.com/formatjs/formatjs/issues/7727)) ([53de4af](https://github.com/formatjs/formatjs/commit/53de4af2e5a1b0c9c56a6fde05304274b43f188b))


### Performance Improvements

* **intl_locale:** avoid repeated canonicalization and JSON trees ([#7746](https://github.com/formatjs/formatjs/issues/7746)) ([f3dad91](https://github.com/formatjs/formatjs/commit/f3dad91012f4eb96fae0cce57ac6cb8ab0cd4740))
* **intl_locale:** compact records and fix private-use updates ([#7794](https://github.com/formatjs/formatjs/issues/7794)) ([0ceaf91](https://github.com/formatjs/formatjs/commit/0ceaf91aa8c21158ec78355434cf02c2386ea5fa))
* **intl_locale:** retain prepared matchers in native registries ([#7768](https://github.com/formatjs/formatjs/issues/7768)) ([a395be7](https://github.com/formatjs/formatjs/commit/a395be797f2c05387045451e4e3b7420abf4b929))
* **intl_locale:** return exact locale before indexing ([#7740](https://github.com/formatjs/formatjs/issues/7740)) ([fab99c4](https://github.com/formatjs/formatjs/commit/fab99c4f2b631ef73126908b278e369d96efaabf))
* **intl_locale:** reuse immutable Hermes locale models ([#7767](https://github.com/formatjs/formatjs/issues/7767)) ([427eb62](https://github.com/formatjs/formatjs/commit/427eb62d9d9668d0b9eeb97b5a02b1422fffa1fc))
* **intl_locale:** skip empty constructor option parsing ([#7789](https://github.com/formatjs/formatjs/issues/7789)) ([77e298b](https://github.com/formatjs/formatjs/commit/77e298bbf869e719ca53ab3c7a5e39c61c1669b2))
* **intl_locale:** stream canonical locale subtags without scratch vectors ([#7799](https://github.com/formatjs/formatjs/issues/7799)) ([b707198](https://github.com/formatjs/formatjs/commit/b707198c1c21c61e91668f072e300c6ce9dc7d03))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_localematcher bumped from 0.1.0 to 0.1.1
    * formatjs_intl_getcanonicallocales bumped from 0.1.0 to 0.2.0

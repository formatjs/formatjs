# Changelog

## [0.2.0](https://github.com/formatjs/formatjs/compare/formatjs_intl_getcanonicallocales_v0.1.0...formatjs_intl_getcanonicallocales_v0.2.0) (2026-10-30)


### Features

* **intl_getcanonicallocales:** add Rust polyfill and Hermes SDK ([#7687](https://github.com/formatjs/formatjs/issues/7687)) ([9e91be2](https://github.com/formatjs/formatjs/commit/9e91be2686383ab389c90d1e6294de446aa0e6d0))
* **intl_supportedvaluesof:** add Rust polyfill and Hermes integration ([#7688](https://github.com/formatjs/formatjs/issues/7688)) ([193b196](https://github.com/formatjs/formatjs/commit/193b1961ab1935dc8ce7b618cfbbc9419bc471d8))


### Bug Fixes

* release Intl crates through Bazel and shared workflow ([#7727](https://github.com/formatjs/formatjs/issues/7727)) ([53de4af](https://github.com/formatjs/formatjs/commit/53de4af2e5a1b0c9c56a6fde05304274b43f188b))


### Performance Improvements

* **intl_getcanonicallocales:** borrow extension boundaries and copy private use ([#7783](https://github.com/formatjs/formatjs/issues/7783)) ([1088775](https://github.com/formatjs/formatjs/commit/1088775e586832c47a3dfbc55c177d967bd3cbc7))
* **intl_getcanonicallocales:** bypass constant language alias dispatch ([#7798](https://github.com/formatjs/formatjs/issues/7798)) ([e04b4f9](https://github.com/formatjs/formatjs/commit/e04b4f94c925814bb7db1fb1944624624f1e3a2f))

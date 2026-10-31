# Changelog

## [0.2.2](https://github.com/formatjs/formatjs/compare/formatjs_intl_collator_v0.2.1...formatjs_intl_collator_v0.2.2) (2026-10-31)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_getcanonicallocales bumped from 0.2.0 to 1.0.0
    * formatjs_intl_locale bumped from 0.2.0 to 1.0.0

## [0.2.1](https://github.com/formatjs/formatjs/compare/formatjs_intl_collator_v0.2.0...formatjs_intl_collator_v0.2.1) (2026-10-30)


### Performance Improvements

* **intl_collator:** compare borrowed UTF-16 without JSON ([c41b617](https://github.com/formatjs/formatjs/commit/c41b6171e12e91904a32536c941c43e22f6dfe14))

## [0.2.0](https://github.com/formatjs/formatjs/compare/formatjs_intl_collator_v0.1.0...formatjs_intl_collator_v0.2.0) (2026-10-30)


### Features

* **intl_collator:** add Rust Hermes Collator extension ([#7695](https://github.com/formatjs/formatjs/issues/7695)) ([d51402b](https://github.com/formatjs/formatjs/commit/d51402bcd5108550a3b6533a7d89bfdcd322b62a))


### Bug Fixes

* **@formatjs/intl-localematcher:** align best fit with ICU defaults ([#7745](https://github.com/formatjs/formatjs/issues/7745)) ([9898211](https://github.com/formatjs/formatjs/commit/98982117414e6e658a141e71f837a0142894673f))
* **intl_collator:** inherit root collation types and ordering rules ([#7766](https://github.com/formatjs/formatjs/issues/7766)) ([86cbca8](https://github.com/formatjs/formatjs/commit/86cbca8c58492f3018d442dca50f3ab302eb4c52))
* release Intl crates through Bazel and shared workflow ([#7727](https://github.com/formatjs/formatjs/issues/7727)) ([53de4af](https://github.com/formatjs/formatjs/commit/53de4af2e5a1b0c9c56a6fde05304274b43f188b))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_getcanonicallocales bumped from 0.1.0 to 0.2.0
    * formatjs_intl_locale bumped from 0.1.0 to 0.2.0

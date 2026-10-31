# Changelog

## [1.0.0](https://github.com/formatjs/formatjs/compare/formatjs_intl_listformat_v0.2.0...formatjs_intl_listformat_v1.0.0) (2026-10-31)


### ⚠ BREAKING CHANGES

* Locale-data exports follow CLDR 49: five locales added, 114 removed upstream.

### Features

* upgrade CLDR data to v49 ([#7827](https://github.com/formatjs/formatjs/issues/7827)) ([1618c29](https://github.com/formatjs/formatjs/commit/1618c29b7984ab04e56799284014e058e530b4bb))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_getcanonicallocales bumped from 0.2.0 to 1.0.0
    * formatjs_intl_locale bumped from 0.2.0 to 1.0.0

## [0.2.0](https://github.com/formatjs/formatjs/compare/formatjs_intl_listformat_v0.1.0...formatjs_intl_listformat_v0.2.0) (2026-10-30)


### Features

* **intl_datetimeformat:** port DateTimeFormat to Rust and Hermes ([#7698](https://github.com/formatjs/formatjs/issues/7698)) ([270aa61](https://github.com/formatjs/formatjs/commit/270aa61c835bfc96499843345242710508952777))
* **intl_listformat:** port Intl.ListFormat to Rust with Hermes integration ([#7692](https://github.com/formatjs/formatjs/issues/7692)) ([864b212](https://github.com/formatjs/formatjs/commit/864b2129998daf005f1d98e0c8a139fa9696c6b5))


### Bug Fixes

* **@formatjs/intl-listformat:** match ICU contextual joins ([#7751](https://github.com/formatjs/formatjs/issues/7751)) ([e0eec27](https://github.com/formatjs/formatjs/commit/e0eec27559d1a0d59316cf241fdd419867d7dd33))
* **intl_locale:** prefer likely script for locale aliases ([#7744](https://github.com/formatjs/formatjs/issues/7744)) ([f6103eb](https://github.com/formatjs/formatjs/commit/f6103eb58f802295a1a14d779ae415bff25b5f64))
* release Intl crates through Bazel and shared workflow ([#7727](https://github.com/formatjs/formatjs/issues/7727)) ([53de4af](https://github.com/formatjs/formatjs/commit/53de4af2e5a1b0c9c56a6fde05304274b43f188b))


### Performance Improvements

* **intl_listformat:** assemble strings without parts ([#7735](https://github.com/formatjs/formatjs/issues/7735)) ([8c54ba9](https://github.com/formatjs/formatjs/commit/8c54ba90dc9d3c90bdd1a8cca5cb3fb2f527567f))
* **intl_listformat:** authorize fixed string joins in Rust ([#7796](https://github.com/formatjs/formatjs/issues/7796)) ([d6a9b7d](https://github.com/formatjs/formatjs/commit/d6a9b7d7d606186add24eba0ac523679e1d5eba8))
* **intl_listformat:** bind templates and reserve complete output ([#7792](https://github.com/formatjs/formatjs/issues/7792)) ([1dc9907](https://github.com/formatjs/formatjs/commit/1dc99077305337b372c8defc4d98514e9d69146c))
* **intl_listformat:** fuse default Hermes construction ([#7769](https://github.com/formatjs/formatjs/issues/7769)) ([c443d60](https://github.com/formatjs/formatjs/commit/c443d6071ec97ac136fa671bdb34d43192ce7a49))
* **intl_listformat:** keep short list inputs on stack ([#7787](https://github.com/formatjs/formatjs/issues/7787)) ([9be86f8](https://github.com/formatjs/formatjs/commit/9be86f80c27b2eb4a67d7455b11bd5c128392dc9))
* **intl_listformat:** stream forward patterns without traversal storage ([#7781](https://github.com/formatjs/formatjs/issues/7781)) ([6fb76fc](https://github.com/formatjs/formatjs/commit/6fb76fc25fc441cc2bb0ba68201bfdbb8a8142da))
* **intl_locale:** retain prepared matchers in native registries ([#7768](https://github.com/formatjs/formatjs/issues/7768)) ([a395be7](https://github.com/formatjs/formatjs/commit/a395be797f2c05387045451e4e3b7420abf4b929))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_data bumped from 0.1.0 to 0.2.0
    * formatjs_intl_getcanonicallocales bumped from 0.1.0 to 0.2.0
    * formatjs_intl_locale bumped from 0.1.0 to 0.2.0

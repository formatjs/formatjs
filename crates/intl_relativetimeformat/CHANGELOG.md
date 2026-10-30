# Changelog

## [0.2.0](https://github.com/formatjs/formatjs/compare/formatjs_intl_relativetimeformat_v0.1.0...formatjs_intl_relativetimeformat_v0.2.0) (2026-10-30)


### Features

* **intl_datetimeformat:** port DateTimeFormat to Rust and Hermes ([#7698](https://github.com/formatjs/formatjs/issues/7698)) ([270aa61](https://github.com/formatjs/formatjs/commit/270aa61c835bfc96499843345242710508952777))
* **intl_relativetimeformat:** port RelativeTimeFormat to Rust and Hermes ([#7697](https://github.com/formatjs/formatjs/issues/7697)) ([e777afa](https://github.com/formatjs/formatjs/commit/e777afa74ebfb7062b953dee8a05698314a51b31))


### Bug Fixes

* **@formatjs/intl-localematcher:** align best fit with ICU defaults ([#7745](https://github.com/formatjs/formatjs/issues/7745)) ([9898211](https://github.com/formatjs/formatjs/commit/98982117414e6e658a141e71f837a0142894673f))
* **intl_locale:** prefer likely script for locale aliases ([#7744](https://github.com/formatjs/formatjs/issues/7744)) ([f6103eb](https://github.com/formatjs/formatjs/commit/f6103eb58f802295a1a14d779ae415bff25b5f64))
* release Intl crates through Bazel and shared workflow ([#7727](https://github.com/formatjs/formatjs/issues/7727)) ([53de4af](https://github.com/formatjs/formatjs/commit/53de4af2e5a1b0c9c56a6fde05304274b43f188b))


### Performance Improvements

* **intl_locale:** retain prepared matchers in native registries ([#7768](https://github.com/formatjs/formatjs/issues/7768)) ([a395be7](https://github.com/formatjs/formatjs/commit/a395be797f2c05387045451e4e3b7420abf4b929))
* **intl_relativetimeformat:** pass numbers directly from Hermes ([#7786](https://github.com/formatjs/formatjs/issues/7786)) ([448bef3](https://github.com/formatjs/formatjs/commit/448bef30b57f57c41fcddcd81ebd60cdfa5f8f9f))
* **intl_relativetimeformat:** pass parts inputs without JSON ([#7776](https://github.com/formatjs/formatjs/issues/7776)) ([c91f0fc](https://github.com/formatjs/formatjs/commit/c91f0fc4a73809bf47a2a73fcdab5dd42bf484eb))
* **intl_relativetimeformat:** render strings through borrowed number pieces ([#7785](https://github.com/formatjs/formatjs/issues/7785)) ([fa48b30](https://github.com/formatjs/formatjs/commit/fa48b30e2f1a4faf8c67d128cc9b73021aacae07))
* **intl_relativetimeformat:** reuse decimal text buffers ([#7790](https://github.com/formatjs/formatjs/issues/7790)) ([776107a](https://github.com/formatjs/formatjs/commit/776107a1815358fd8e4e8cff270ac35f11f2467e))
* **intl_relativetimeformat:** reuse immutable number plans ([#7771](https://github.com/formatjs/formatjs/issues/7771)) ([1a778f1](https://github.com/formatjs/formatjs/commit/1a778f120c0bf2cfa2573ef7784d04cb9c84e11d))
* **intl_relativetimeformat:** reuse number part buffers ([#7775](https://github.com/formatjs/formatjs/issues/7775)) ([254ef50](https://github.com/formatjs/formatjs/commit/254ef505cd30647fb97104a92e018f21b33d0d5e))
* **intl_relativetimeformat:** share numeric rounding ([#7739](https://github.com/formatjs/formatjs/issues/7739)) ([b81a827](https://github.com/formatjs/formatjs/commit/b81a8275d6554d474b44a44df28f4d25abc25973))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_data bumped from 0.1.0 to 0.2.0
    * formatjs_intl_getcanonicallocales bumped from 0.1.0 to 0.2.0
    * formatjs_intl_locale bumped from 0.1.0 to 0.2.0
    * formatjs_intl_numberformat bumped from 0.1.0 to 0.2.0
    * formatjs_intl_pluralrules bumped from 0.1.0 to 0.2.0

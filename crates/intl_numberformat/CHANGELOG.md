# Changelog

## [0.2.1](https://github.com/formatjs/formatjs/compare/formatjs_intl_numberformat_v0.2.0...formatjs_intl_numberformat_v0.2.1) (2026-10-31)


### Performance Improvements

* **@formatjs/intl-numberformat:** precompile shared number pattern plans ([#7834](https://github.com/formatjs/formatjs/issues/7834)) ([39e4ba7](https://github.com/formatjs/formatjs/commit/39e4ba7b3f03fd1b90e1d5b61a0f9f35736276aa))
* **@formatjs/intl-numberformat:** reuse exponent preview rounding ([#7836](https://github.com/formatjs/formatjs/issues/7836)) ([448a46b](https://github.com/formatjs/formatjs/commit/448a46b5c66d41455342e9c5ed211576d6642bc0))
* **@formatjs/intl-numberformat:** reuse matching data and add ICU audit ([#7832](https://github.com/formatjs/formatjs/issues/7832)) ([6e26b50](https://github.com/formatjs/formatjs/commit/6e26b50cb70b5d07c8b2c4e54f2e8bec3bd23bc7))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_getcanonicallocales bumped from 0.2.0 to 1.0.0
    * formatjs_intl_locale bumped from 0.2.0 to 1.0.0
    * formatjs_intl_pluralrules bumped from 0.2.0 to 0.2.1

## [0.2.0](https://github.com/formatjs/formatjs/compare/formatjs_intl_numberformat_v0.1.0...formatjs_intl_numberformat_v0.2.0) (2026-10-30)


### Features

* **intl_datetimeformat:** port DateTimeFormat to Rust and Hermes ([#7698](https://github.com/formatjs/formatjs/issues/7698)) ([270aa61](https://github.com/formatjs/formatjs/commit/270aa61c835bfc96499843345242710508952777))
* **intl_numberformat:** port NumberFormat to Rust and Hermes ([#7696](https://github.com/formatjs/formatjs/issues/7696)) ([9951dec](https://github.com/formatjs/formatjs/commit/9951dec91f7e153fd87e21ed20217d9b8eb805ee))


### Bug Fixes

* **@formatjs/intl-localematcher:** align best fit with ICU defaults ([#7745](https://github.com/formatjs/formatjs/issues/7745)) ([9898211](https://github.com/formatjs/formatjs/commit/98982117414e6e658a141e71f837a0142894673f))
* **@formatjs/intl-numberformat:** use latn compact currency patterns when a numbering system has none ([#7703](https://github.com/formatjs/formatjs/issues/7703)) ([dd0f9fe](https://github.com/formatjs/formatjs/commit/dd0f9fe5b4972a10202ac14276bb2877a1955fc2))
* **intl_locale:** prefer likely script for locale aliases ([#7744](https://github.com/formatjs/formatjs/issues/7744)) ([f6103eb](https://github.com/formatjs/formatjs/commit/f6103eb58f802295a1a14d779ae415bff25b5f64))
* release Intl crates through Bazel and shared workflow ([#7727](https://github.com/formatjs/formatjs/issues/7727)) ([53de4af](https://github.com/formatjs/formatjs/commit/53de4af2e5a1b0c9c56a6fde05304274b43f188b))


### Performance Improvements

* **intl_locale:** retain prepared matchers in native registries ([#7768](https://github.com/formatjs/formatjs/issues/7768)) ([a395be7](https://github.com/formatjs/formatjs/commit/a395be797f2c05387045451e4e3b7420abf4b929))
* **intl_numberformat:** skip simple decimal pattern parsing ([#7737](https://github.com/formatjs/formatjs/issues/7737)) ([9406ed1](https://github.com/formatjs/formatjs/commit/9406ed197fa3b7416a9f6d7bf1a6aed7496fae7c))
* **intl_numberformat:** skip standard exponent preview ([#7738](https://github.com/formatjs/formatjs/issues/7738)) ([a4d5a67](https://github.com/formatjs/formatjs/commit/a4d5a67206942b685585bb949de51a38cfe7ab7d))
* **intl_numberformat:** stream grouping without temporary vectors ([#7784](https://github.com/formatjs/formatjs/issues/7784)) ([b472423](https://github.com/formatjs/formatjs/commit/b4724233fe65bfe773fa81367f82eec020213ca3))
* **intl_pluralrules:** reuse canonical decimal text ([#7778](https://github.com/formatjs/formatjs/issues/7778)) ([9892a41](https://github.com/formatjs/formatjs/commit/9892a4109c68270fd4017be55cfad25ba1ff6adb))
* **intl_relativetimeformat:** render strings through borrowed number pieces ([#7785](https://github.com/formatjs/formatjs/issues/7785)) ([fa48b30](https://github.com/formatjs/formatjs/commit/fa48b30e2f1a4faf8c67d128cc9b73021aacae07))
* **intl_relativetimeformat:** reuse decimal text buffers ([#7790](https://github.com/formatjs/formatjs/issues/7790)) ([776107a](https://github.com/formatjs/formatjs/commit/776107a1815358fd8e4e8cff270ac35f11f2467e))
* **intl_relativetimeformat:** reuse number part buffers ([#7775](https://github.com/formatjs/formatjs/issues/7775)) ([254ef50](https://github.com/formatjs/formatjs/commit/254ef505cd30647fb97104a92e018f21b33d0d5e))
* **intl_relativetimeformat:** share numeric rounding ([#7739](https://github.com/formatjs/formatjs/issues/7739)) ([b81a827](https://github.com/formatjs/formatjs/commit/b81a8275d6554d474b44a44df28f4d25abc25973))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_data bumped from 0.1.0 to 0.2.0
    * formatjs_intl_getcanonicallocales bumped from 0.1.0 to 0.2.0
    * formatjs_intl_locale bumped from 0.1.0 to 0.2.0
    * formatjs_intl_pluralrules bumped from 0.1.0 to 0.2.0

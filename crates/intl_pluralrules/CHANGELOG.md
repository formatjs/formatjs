# Changelog

## [0.2.0](https://github.com/formatjs/formatjs/compare/formatjs_intl_pluralrules_v0.1.0...formatjs_intl_pluralrules_v0.2.0) (2026-10-30)


### Features

* **intl_datetimeformat:** port DateTimeFormat to Rust and Hermes ([#7698](https://github.com/formatjs/formatjs/issues/7698)) ([270aa61](https://github.com/formatjs/formatjs/commit/270aa61c835bfc96499843345242710508952777))
* **intl_numberformat:** port NumberFormat to Rust and Hermes ([#7696](https://github.com/formatjs/formatjs/issues/7696)) ([9951dec](https://github.com/formatjs/formatjs/commit/9951dec91f7e153fd87e21ed20217d9b8eb805ee))
* **intl_pluralrules:** port Intl.PluralRules to Rust with Hermes integration ([#7691](https://github.com/formatjs/formatjs/issues/7691)) ([ef5451f](https://github.com/formatjs/formatjs/commit/ef5451fd646969e8b8b10464fd151d8b6c6cbd85))


### Bug Fixes

* **intl_locale:** prefer likely script for locale aliases ([#7744](https://github.com/formatjs/formatjs/issues/7744)) ([f6103eb](https://github.com/formatjs/formatjs/commit/f6103eb58f802295a1a14d779ae415bff25b5f64))
* **intl_pluralrules:** keep Chinese rules and cross-check ICU4C/J/X ([#7756](https://github.com/formatjs/formatjs/issues/7756)) ([2b28e39](https://github.com/formatjs/formatjs/commit/2b28e39b9e53b2b673977ae2b9d3586287fe977d))
* release Intl crates through Bazel and shared workflow ([#7727](https://github.com/formatjs/formatjs/issues/7727)) ([53de4af](https://github.com/formatjs/formatjs/commit/53de4af2e5a1b0c9c56a6fde05304274b43f188b))


### Performance Improvements

* **intl_locale:** retain prepared matchers in native registries ([#7768](https://github.com/formatjs/formatjs/issues/7768)) ([a395be7](https://github.com/formatjs/formatjs/commit/a395be797f2c05387045451e4e3b7420abf4b929))
* **intl_pluralrules:** pass range inputs without JSON ([#7777](https://github.com/formatjs/formatjs/issues/7777)) ([cf80587](https://github.com/formatjs/formatjs/commit/cf805872b1b588d2bd20bb65ffee83c1cda3a47a))
* **intl_pluralrules:** retain already formatted decimal text ([#7791](https://github.com/formatjs/formatjs/issues/7791)) ([34257e6](https://github.com/formatjs/formatjs/commit/34257e63b87775549aa82ed2d2c41e04f25dd161))
* **intl_pluralrules:** reuse canonical decimal text ([#7778](https://github.com/formatjs/formatjs/issues/7778)) ([9892a41](https://github.com/formatjs/formatjs/commit/9892a4109c68270fd4017be55cfad25ba1ff6adb))
* **intl_pluralrules:** select without JSON bridge ([#7736](https://github.com/formatjs/formatjs/issues/7736)) ([efaa2e2](https://github.com/formatjs/formatjs/commit/efaa2e251f521a12ecf465b5d222147d3fb1b15e))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_data bumped from 0.1.0 to 0.2.0
    * formatjs_intl_getcanonicallocales bumped from 0.1.0 to 0.2.0
    * formatjs_intl_locale bumped from 0.1.0 to 0.2.0

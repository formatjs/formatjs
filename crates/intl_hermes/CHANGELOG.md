# Changelog

## [0.3.1](https://github.com/formatjs/formatjs/compare/formatjs_intl_hermes_v0.3.0...formatjs_intl_hermes_v0.3.1) (2026-10-31)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_displaynames bumped from 0.2.0 to 0.2.1
    * formatjs_intl_listformat bumped from 0.2.0 to 1.0.0
    * formatjs_intl_locale bumped from 0.2.0 to 1.0.0
    * formatjs_intl_pluralrules bumped from 0.2.0 to 0.2.1
    * formatjs_intl_getcanonicallocales bumped from 0.2.0 to 1.0.0
    * formatjs_intl_supportedvaluesof bumped from 0.2.0 to 1.0.0
    * formatjs_intl_segmenter bumped from 0.2.0 to 1.0.0
    * formatjs_intl_collator bumped from 0.2.1 to 0.2.2
    * formatjs_intl_numberformat bumped from 0.2.0 to 0.2.1
    * formatjs_intl_relativetimeformat bumped from 0.2.0 to 0.2.1
    * formatjs_intl_datetimeformat bumped from 0.2.0 to 1.0.0
    * formatjs_intl_datetimeformat_calendars bumped from 0.2.0 to 0.2.1
    * formatjs_intl_durationformat bumped from 0.2.0 to 1.0.0

## [0.3.0](https://github.com/formatjs/formatjs/compare/formatjs_intl_hermes_v0.2.0...formatjs_intl_hermes_v0.3.0) (2026-10-30)


### Features

* distribute Hermes Intl SDK with one-call installation ([f5ed01b](https://github.com/formatjs/formatjs/commit/f5ed01b13718c5ad03419d1c2ee2ecadb9200d32))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_collator bumped from 0.2.0 to 0.2.1

## [0.2.0](https://github.com/formatjs/formatjs/compare/formatjs_intl_hermes_v0.1.0...formatjs_intl_hermes_v0.2.0) (2026-10-30)


### Features

* **intl_collator:** add Rust Hermes Collator extension ([#7695](https://github.com/formatjs/formatjs/issues/7695)) ([d51402b](https://github.com/formatjs/formatjs/commit/d51402bcd5108550a3b6533a7d89bfdcd322b62a))
* **intl_datetimeformat:** compile calendars into Hermes runtime ([#7716](https://github.com/formatjs/formatjs/issues/7716)) ([0e547ec](https://github.com/formatjs/formatjs/commit/0e547ec8b34561d6f1f2278110faa6e355d87724))
* **intl_datetimeformat:** port DateTimeFormat to Rust and Hermes ([#7698](https://github.com/formatjs/formatjs/issues/7698)) ([270aa61](https://github.com/formatjs/formatjs/commit/270aa61c835bfc96499843345242710508952777))
* **intl_displaynames:** port Intl.DisplayNames to Rust with Hermes integration ([#7693](https://github.com/formatjs/formatjs/issues/7693)) ([517f0c2](https://github.com/formatjs/formatjs/commit/517f0c247c9ef4973c4d41f7ae46ae6f3e49bf31))
* **intl_durationformat:** add Rust Hermes duration formatting ([#7707](https://github.com/formatjs/formatjs/issues/7707)) ([c7e5f35](https://github.com/formatjs/formatjs/commit/c7e5f35922fd5018f3ad73f32df29b1d43d01076))
* **intl_listformat:** port Intl.ListFormat to Rust with Hermes integration ([#7692](https://github.com/formatjs/formatjs/issues/7692)) ([864b212](https://github.com/formatjs/formatjs/commit/864b2129998daf005f1d98e0c8a139fa9696c6b5))
* **intl_locale:** port Locale to Rust with Hermes extension ([#7689](https://github.com/formatjs/formatjs/issues/7689)) ([bb2c829](https://github.com/formatjs/formatjs/commit/bb2c8297af744191d7842497d23c15389135c550))
* **intl_numberformat:** port NumberFormat to Rust and Hermes ([#7696](https://github.com/formatjs/formatjs/issues/7696)) ([9951dec](https://github.com/formatjs/formatjs/commit/9951dec91f7e153fd87e21ed20217d9b8eb805ee))
* **intl_pluralrules:** port Intl.PluralRules to Rust with Hermes integration ([#7691](https://github.com/formatjs/formatjs/issues/7691)) ([ef5451f](https://github.com/formatjs/formatjs/commit/ef5451fd646969e8b8b10464fd151d8b6c6cbd85))
* **intl_relativetimeformat:** port RelativeTimeFormat to Rust and Hermes ([#7697](https://github.com/formatjs/formatjs/issues/7697)) ([e777afa](https://github.com/formatjs/formatjs/commit/e777afa74ebfb7062b953dee8a05698314a51b31))
* **intl_segmenter:** port Intl.Segmenter to Rust with Hermes integration ([#7694](https://github.com/formatjs/formatjs/issues/7694)) ([d5d8512](https://github.com/formatjs/formatjs/commit/d5d8512ca7205354ec2caf1a6eac10396012d01a))
* **intl_supportedvaluesof:** add Rust polyfill and Hermes integration ([#7688](https://github.com/formatjs/formatjs/issues/7688)) ([193b196](https://github.com/formatjs/formatjs/commit/193b1961ab1935dc8ce7b618cfbbc9419bc471d8))


### Bug Fixes

* release Intl crates through Bazel and shared workflow ([#7727](https://github.com/formatjs/formatjs/issues/7727)) ([53de4af](https://github.com/formatjs/formatjs/commit/53de4af2e5a1b0c9c56a6fde05304274b43f188b))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_displaynames bumped from 0.1.0 to 0.2.0
    * formatjs_intl_listformat bumped from 0.1.0 to 0.2.0
    * formatjs_intl_locale bumped from 0.1.0 to 0.2.0
    * formatjs_intl_pluralrules bumped from 0.1.0 to 0.2.0
    * formatjs_intl_getcanonicallocales bumped from 0.1.0 to 0.2.0
    * formatjs_intl_supportedvaluesof bumped from 0.1.0 to 0.2.0
    * formatjs_intl_segmenter bumped from 0.1.0 to 0.2.0
    * formatjs_intl_collator bumped from 0.1.0 to 0.2.0
    * formatjs_intl_numberformat bumped from 0.1.0 to 0.2.0
    * formatjs_intl_relativetimeformat bumped from 0.1.0 to 0.2.0
    * formatjs_intl_datetimeformat bumped from 0.1.0 to 0.2.0
    * formatjs_intl_datetimeformat_calendars bumped from 0.1.0 to 0.2.0
    * formatjs_intl_durationformat bumped from 0.1.0 to 0.2.0

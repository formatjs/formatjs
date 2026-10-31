# Changelog

## [1.0.0](https://github.com/formatjs/formatjs/compare/formatjs-hermes-intl_v0.2.0...formatjs-hermes-intl_v1.0.0) (2026-10-31)


### ⚠ BREAKING CHANGES

* Locale-data exports follow CLDR 49: five locales added, 114 removed upstream.

### Features

* upgrade CLDR data to v49 ([#7827](https://github.com/formatjs/formatjs/issues/7827)) ([1618c29](https://github.com/formatjs/formatjs/commit/1618c29b7984ab04e56799284014e058e530b4bb))


### Bug Fixes

* build Hermes SDK releases with BuildBuddy RBE ([#7811](https://github.com/formatjs/formatjs/issues/7811)) ([f7f2540](https://github.com/formatjs/formatjs/commit/f7f25405e5805a1072f3cf7e4303266ba36112ad))

## [0.2.0](https://github.com/formatjs/formatjs/compare/formatjs-hermes-intl_v0.1.0...formatjs-hermes-intl_v0.2.0) (2026-10-30)


### Features

* distribute Hermes Intl SDK with one-call installation ([f5ed01b](https://github.com/formatjs/formatjs/commit/f5ed01b13718c5ad03419d1c2ee2ecadb9200d32))
* **intl_collator:** add Rust Hermes Collator extension ([#7695](https://github.com/formatjs/formatjs/issues/7695)) ([d51402b](https://github.com/formatjs/formatjs/commit/d51402bcd5108550a3b6533a7d89bfdcd322b62a))
* **intl_datetimeformat:** compile calendars into Hermes runtime ([#7716](https://github.com/formatjs/formatjs/issues/7716)) ([0e547ec](https://github.com/formatjs/formatjs/commit/0e547ec8b34561d6f1f2278110faa6e355d87724))
* **intl_datetimeformat:** port DateTimeFormat to Rust and Hermes ([#7698](https://github.com/formatjs/formatjs/issues/7698)) ([270aa61](https://github.com/formatjs/formatjs/commit/270aa61c835bfc96499843345242710508952777))
* **intl_displaynames:** port Intl.DisplayNames to Rust with Hermes integration ([#7693](https://github.com/formatjs/formatjs/issues/7693)) ([517f0c2](https://github.com/formatjs/formatjs/commit/517f0c247c9ef4973c4d41f7ae46ae6f3e49bf31))
* **intl_durationformat:** add Rust Hermes duration formatting ([#7707](https://github.com/formatjs/formatjs/issues/7707)) ([c7e5f35](https://github.com/formatjs/formatjs/commit/c7e5f35922fd5018f3ad73f32df29b1d43d01076))
* **intl_getcanonicallocales:** add Rust polyfill and Hermes SDK ([#7687](https://github.com/formatjs/formatjs/issues/7687)) ([9e91be2](https://github.com/formatjs/formatjs/commit/9e91be2686383ab389c90d1e6294de446aa0e6d0))
* **intl_listformat:** port Intl.ListFormat to Rust with Hermes integration ([#7692](https://github.com/formatjs/formatjs/issues/7692)) ([864b212](https://github.com/formatjs/formatjs/commit/864b2129998daf005f1d98e0c8a139fa9696c6b5))
* **intl_locale:** port Locale to Rust with Hermes extension ([#7689](https://github.com/formatjs/formatjs/issues/7689)) ([bb2c829](https://github.com/formatjs/formatjs/commit/bb2c8297af744191d7842497d23c15389135c550))
* **intl_numberformat:** port NumberFormat to Rust and Hermes ([#7696](https://github.com/formatjs/formatjs/issues/7696)) ([9951dec](https://github.com/formatjs/formatjs/commit/9951dec91f7e153fd87e21ed20217d9b8eb805ee))
* **intl_pluralrules:** port Intl.PluralRules to Rust with Hermes integration ([#7691](https://github.com/formatjs/formatjs/issues/7691)) ([ef5451f](https://github.com/formatjs/formatjs/commit/ef5451fd646969e8b8b10464fd151d8b6c6cbd85))
* **intl_relativetimeformat:** port RelativeTimeFormat to Rust and Hermes ([#7697](https://github.com/formatjs/formatjs/issues/7697)) ([e777afa](https://github.com/formatjs/formatjs/commit/e777afa74ebfb7062b953dee8a05698314a51b31))
* **intl_segmenter:** port Intl.Segmenter to Rust with Hermes integration ([#7694](https://github.com/formatjs/formatjs/issues/7694)) ([d5d8512](https://github.com/formatjs/formatjs/commit/d5d8512ca7205354ec2caf1a6eac10396012d01a))
* **intl_supportedvaluesof:** add Rust polyfill and Hermes integration ([#7688](https://github.com/formatjs/formatjs/issues/7688)) ([193b196](https://github.com/formatjs/formatjs/commit/193b1961ab1935dc8ce7b618cfbbc9419bc471d8))
* package Hermes Intl for iOS and macOS ([#7804](https://github.com/formatjs/formatjs/issues/7804)) ([430684e](https://github.com/formatjs/formatjs/commit/430684ec337cc7129898cafb0ec9798d90a30033))


### Bug Fixes

* **@formatjs/intl-listformat:** match ICU contextual joins ([#7751](https://github.com/formatjs/formatjs/issues/7751)) ([e0eec27](https://github.com/formatjs/formatjs/commit/e0eec27559d1a0d59316cf241fdd419867d7dd33))
* **@formatjs/intl-segmenter:** align word flags and segment records ([#7800](https://github.com/formatjs/formatjs/issues/7800)) ([af8fffc](https://github.com/formatjs/formatjs/commit/af8fffcb6746bb51973b5312361a84f5ef07bca0))
* **intl_collator:** inherit root collation types and ordering rules ([#7766](https://github.com/formatjs/formatjs/issues/7766)) ([86cbca8](https://github.com/formatjs/formatjs/commit/86cbca8c58492f3018d442dca50f3ab302eb4c52))
* **intl_datetimeformat:** compile IANA zones for Hermes Test262 ([#7720](https://github.com/formatjs/formatjs/issues/7720)) ([7fc5699](https://github.com/formatjs/formatjs/commit/7fc5699f75795d88b4d5dd63bffd6aa172955b07))
* **intl_datetimeformat:** delegate Date locale methods ([#7719](https://github.com/formatjs/formatjs/issues/7719)) ([b84b214](https://github.com/formatjs/formatjs/commit/b84b214e735f0779905a0fa0a64c317f7e8393c9))
* **intl_datetimeformat:** expose nonconstructible format getter ([#7722](https://github.com/formatjs/formatjs/issues/7722)) ([b55298e](https://github.com/formatjs/formatjs/commit/b55298e5c6b8e9edbf815297aa6115d28b7c2096))
* **intl_hermes:** capture collation enumeration during contrib setup ([#7763](https://github.com/formatjs/formatjs/issues/7763)) ([a4fca8d](https://github.com/formatjs/formatjs/commit/a4fca8d8276b81d0d17c91e1c548de4520c6b4e5))
* **intl_locale:** prefer likely script for locale aliases ([#7744](https://github.com/formatjs/formatjs/issues/7744)) ([f6103eb](https://github.com/formatjs/formatjs/commit/f6103eb58f802295a1a14d779ae415bff25b5f64))
* **intl_pluralrules:** keep Chinese rules and cross-check ICU4C/J/X ([#7756](https://github.com/formatjs/formatjs/issues/7756)) ([2b28e39](https://github.com/formatjs/formatjs/commit/2b28e39b9e53b2b673977ae2b9d3586287fe977d))
* release Intl crates through Bazel and shared workflow ([#7727](https://github.com/formatjs/formatjs/issues/7727)) ([53de4af](https://github.com/formatjs/formatjs/commit/53de4af2e5a1b0c9c56a6fde05304274b43f188b))


### Performance Improvements

* **@formatjs/intl-getcanonicallocales:** reduce Hermes canonicalization overhead ([#7773](https://github.com/formatjs/formatjs/issues/7773)) ([ae083ba](https://github.com/formatjs/formatjs/commit/ae083baa41c5e751363ac0b8216e9f2a61f68734))
* **@formatjs/intl-getcanonicallocales:** skip array Locale brand errors ([#7770](https://github.com/formatjs/formatjs/issues/7770)) ([aac6320](https://github.com/formatjs/formatjs/commit/aac632083e89d82b366057e1524e6a2f1c62868e))
* **intl_collator:** compare borrowed UTF-16 without JSON ([c41b617](https://github.com/formatjs/formatjs/commit/c41b6171e12e91904a32536c941c43e22f6dfe14))
* **intl_hermes:** enable ThinLTO for release SDK archives ([#7788](https://github.com/formatjs/formatjs/issues/7788)) ([89a4a3f](https://github.com/formatjs/formatjs/commit/89a4a3fa54a8586b2a427652ac8a23447e47bded))
* **intl_listformat:** append private inputs without descriptors ([#7780](https://github.com/formatjs/formatjs/issues/7780)) ([a675d0b](https://github.com/formatjs/formatjs/commit/a675d0be9a156c659f6fdb78d36b9d6e2ae3c3a0))
* **intl_listformat:** authorize fixed string joins in Rust ([#7796](https://github.com/formatjs/formatjs/issues/7796)) ([d6a9b7d](https://github.com/formatjs/formatjs/commit/d6a9b7d7d606186add24eba0ac523679e1d5eba8))
* **intl_listformat:** avoid argument arrays in parts decoder ([e484c1b](https://github.com/formatjs/formatjs/commit/e484c1ba8172ae45ad407d32c254350d743bdeed))
* **intl_listformat:** build safe parts records directly ([#7752](https://github.com/formatjs/formatjs/issues/7752)) ([11c95b6](https://github.com/formatjs/formatjs/commit/11c95b6a0fd9b576c961bd531b2292c0d3ced42d))
* **intl_listformat:** fuse default Hermes construction ([#7769](https://github.com/formatjs/formatjs/issues/7769)) ([c443d60](https://github.com/formatjs/formatjs/commit/c443d6071ec97ac136fa671bdb34d43192ce7a49))
* **intl_listformat:** keep short list inputs on stack ([#7787](https://github.com/formatjs/formatjs/issues/7787)) ([9be86f8](https://github.com/formatjs/formatjs/commit/9be86f80c27b2eb4a67d7455b11bd5c128392dc9))
* **intl_listformat:** pass short lists as native arguments ([#7793](https://github.com/formatjs/formatjs/issues/7793)) ([b03d4b3](https://github.com/formatjs/formatjs/commit/b03d4b34a91e55ed4c2b347b9ede6d3312e7c01b))
* **intl_listformat:** reuse private Hermes constructor values ([#7782](https://github.com/formatjs/formatjs/issues/7782)) ([3d73897](https://github.com/formatjs/formatjs/commit/3d7389793afdd3dae4cd0f38e6eaaf28e79df472))
* **intl_locale:** compact records and fix private-use updates ([#7794](https://github.com/formatjs/formatjs/issues/7794)) ([0ceaf91](https://github.com/formatjs/formatjs/commit/0ceaf91aa8c21158ec78355434cf02c2386ea5fa))
* **intl_locale:** defer Hermes scalar snapshots and fuse default construction ([#7762](https://github.com/formatjs/formatjs/issues/7762)) ([06dac6c](https://github.com/formatjs/formatjs/commit/06dac6c20db2f4fd214ae5225847a561a22d02ae))
* **intl_locale:** retain prepared matchers in native registries ([#7768](https://github.com/formatjs/formatjs/issues/7768)) ([a395be7](https://github.com/formatjs/formatjs/commit/a395be797f2c05387045451e4e3b7420abf4b929))
* **intl_locale:** reuse immutable Hermes locale models ([#7767](https://github.com/formatjs/formatjs/issues/7767)) ([427eb62](https://github.com/formatjs/formatjs/commit/427eb62d9d9668d0b9eeb97b5a02b1422fffa1fc))
* **intl_pluralrules:** pass range inputs without JSON ([#7777](https://github.com/formatjs/formatjs/issues/7777)) ([cf80587](https://github.com/formatjs/formatjs/commit/cf805872b1b588d2bd20bb65ffee83c1cda3a47a))
* **intl_pluralrules:** reuse constructor tables and serialize options directly ([#7779](https://github.com/formatjs/formatjs/issues/7779)) ([fb690de](https://github.com/formatjs/formatjs/commit/fb690dea024543cac825f275ebd821a08b8b1cc3))
* **intl_pluralrules:** reuse validated constructor records ([#7795](https://github.com/formatjs/formatjs/issues/7795)) ([bb20238](https://github.com/formatjs/formatjs/commit/bb20238a4e05de0213ff3539cdb1b368ff13a89b))
* **intl_pluralrules:** select without JSON bridge ([#7736](https://github.com/formatjs/formatjs/issues/7736)) ([efaa2e2](https://github.com/formatjs/formatjs/commit/efaa2e251f521a12ecf465b5d222147d3fb1b15e))
* **intl_pluralrules:** streamline Hermes construction and selection ([#7758](https://github.com/formatjs/formatjs/issues/7758)) ([08db5df](https://github.com/formatjs/formatjs/commit/08db5df5e86bf9b07df55fea8127bdfa46a72cb5))
* **intl_relativetimeformat:** avoid reflective intrinsic calls ([#7774](https://github.com/formatjs/formatjs/issues/7774)) ([004ea36](https://github.com/formatjs/formatjs/commit/004ea36eb1208e5176b350df8797ef1ce0643170))
* **intl_relativetimeformat:** pass numbers directly from Hermes ([#7786](https://github.com/formatjs/formatjs/issues/7786)) ([448bef3](https://github.com/formatjs/formatjs/commit/448bef30b57f57c41fcddcd81ebd60cdfa5f8f9f))
* **intl_relativetimeformat:** pass parts inputs without JSON ([#7776](https://github.com/formatjs/formatjs/issues/7776)) ([c91f0fc](https://github.com/formatjs/formatjs/commit/c91f0fc4a73809bf47a2a73fcdab5dd42bf484eb))
* **intl_relativetimeformat:** serialize validated Hermes options directly ([#7772](https://github.com/formatjs/formatjs/issues/7772)) ([a93e8cf](https://github.com/formatjs/formatjs/commit/a93e8cf54529582047f41ff1dfb4ed0c01098a14))
* **intl_segmenter:** avoid JSON in Hermes hot path ([#7734](https://github.com/formatjs/formatjs/issues/7734)) ([f0a9397](https://github.com/formatjs/formatjs/commit/f0a93973afcab9a5ce37fe9dc31b020f97cba31e))

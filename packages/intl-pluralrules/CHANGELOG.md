# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.1.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@3.0.2...@formatjs/intl-pluralrules@3.1.0) (2020-07-14)


### Features

* publish ([b6e3465](https://github.com/formatjs/formatjs/commit/b6e3465ac95b3fa481f3c89f077a66ac004f7c27))





## [3.0.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@3.0.2...@formatjs/intl-pluralrules@3.0.3) (2020-07-09)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [3.0.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@3.0.1...@formatjs/intl-pluralrules@3.0.2) (2020-07-03)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [3.0.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@3.0.0...@formatjs/intl-pluralrules@3.0.1) (2020-07-03)

**Note:** Version bump only for package @formatjs/intl-pluralrules





# [3.0.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@2.2.11...@formatjs/intl-pluralrules@3.0.0) (2020-07-03)


### Bug Fixes

* add locale-data to package.json files ([52a1481](https://github.com/formatjs/formatjs/commit/52a148196585bf8b33b27b9b948d6333f49072e8))
* **@formatjs/intl-pluralrules:** add criteria to activate polyfill if native impl has minimumFractionDigits bug ([6ee31a8](https://github.com/formatjs/formatjs/commit/6ee31a8aef5aaf22ad4169f25d35dfe586b5103f))


### Features

* **@formatjs/intl-pluralrules:** restructure locale-data output ([324e7e2](https://github.com/formatjs/formatjs/commit/324e7e265330ab1decf926724e25792ddbfd77b4))


### BREAKING CHANGES

* **@formatjs/intl-pluralrules:** Remove ponyfill mechanism. Our polyfill mechanism also detects buggy native implementation so we can override.
* **@formatjs/intl-pluralrules:** Move locale-data outside of `dist`. This means new locale-data path would be `@formatjs/intl-pluralrules/locale-data` instead of `@formatjs/intl-pluralrules/dist/locale-data`





## [2.2.11](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@2.2.10...@formatjs/intl-pluralrules@2.2.11) (2020-07-01)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [2.2.10](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@2.2.9...@formatjs/intl-pluralrules@2.2.10) (2020-06-26)


### Bug Fixes

* **@formatjs/intl-pluralrules:** fix test262 ([45f29dc](https://github.com/formatjs/formatjs/commit/45f29dc5d5c4f2fbead7f8e6aefff688083c5faa))





## [2.2.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@2.2.8...@formatjs/intl-pluralrules@2.2.9) (2020-06-23)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [2.2.8](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@2.2.7...@formatjs/intl-pluralrules@2.2.8) (2020-06-23)


### Bug Fixes

* **@formatjs/intl-pluralrules:** fix [@[@to](https://github.com/to)StringTag] value to be Intl.PluralRules ([750ddf3](https://github.com/formatjs/formatjs/commit/750ddf3b421f6eac871035e5b1c32a5bc3520b69))





## [2.2.7](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@2.2.6...@formatjs/intl-pluralrules@2.2.7) (2020-06-20)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [2.2.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@2.2.5...@formatjs/intl-pluralrules@2.2.6) (2020-06-06)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [2.2.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@2.2.4...@formatjs/intl-pluralrules@2.2.5) (2020-06-06)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [2.2.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@2.2.3...@formatjs/intl-pluralrules@2.2.4) (2020-06-04)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [2.2.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@2.2.2...@formatjs/intl-pluralrules@2.2.3) (2020-06-04)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [2.2.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@2.2.1...@formatjs/intl-pluralrules@2.2.2) (2020-06-03)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [2.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@2.2.0...@formatjs/intl-pluralrules@2.2.1) (2020-05-28)

**Note:** Version bump only for package @formatjs/intl-pluralrules





# [2.2.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@2.1.0...@formatjs/intl-pluralrules@2.2.0) (2020-05-27)


### Bug Fixes

* **website:** editorial fixes of Intl.NumberFormat links ([#1690](https://github.com/formatjs/formatjs/issues/1690)) ([1b4a248](https://github.com/formatjs/formatjs/commit/1b4a2482ea85c4f9d3754d46c8aadd67a0b17d93))


### Features

* **formatjs-extract-cldr-data:** rm this package ([62bdd32](https://github.com/formatjs/formatjs/commit/62bdd32aadef899228a5303e01865f69fd729fa3))





# [2.1.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@2.0.1...@formatjs/intl-pluralrules@2.1.0) (2020-05-25)


### Features

* **@formatjs/intl-pluralrules:** reduce asset size since we use Intl.getCanonicalLocales ([aaa65c3](https://github.com/formatjs/formatjs/commit/aaa65c30e72de4bbe7abb77b9c7aa5be8f5192b0))





## [2.0.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@2.0.0...@formatjs/intl-pluralrules@2.0.1) (2020-05-23)

**Note:** Version bump only for package @formatjs/intl-pluralrules





# [2.0.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.5.9...@formatjs/intl-pluralrules@2.0.0) (2020-05-23)


### Features

* **@formatjs/intl-pluralrules:** Use native Intl.getCanonicalLocales ([c1bde9a](https://github.com/formatjs/formatjs/commit/c1bde9a8d280d1ed69cec33e663167dad0a26631))


### BREAKING CHANGES

* **@formatjs/intl-pluralrules:** This requires @formatjs/intl-getcanonicallocales for
IE11 and below





## [1.5.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.5.8...@formatjs/intl-pluralrules@1.5.9) (2020-05-16)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [1.5.8](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.5.7...@formatjs/intl-pluralrules@1.5.8) (2020-05-05)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## 1.5.7 (2020-04-28)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [1.5.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.5.5...@formatjs/intl-pluralrules@1.5.6) (2020-04-24)


### Bug Fixes

* **eslint-plugin-formatjs:** add missing dep ([776390e](https://github.com/formatjs/formatjs/commit/776390e9d6cb3bc1eef07b2e92057136cfe95b76))





## [1.5.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.5.4...@formatjs/intl-pluralrules@1.5.5) (2020-04-14)


### Bug Fixes

* clean up tsbuildinfo before full build ([c301ca0](https://github.com/formatjs/formatjs/commit/c301ca02e0c319a0eb03921533053f0334ae5df1))





## [1.5.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.5.3...@formatjs/intl-pluralrules@1.5.4) (2020-03-30)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [1.5.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.5.1...@formatjs/intl-pluralrules@1.5.3) (2020-03-18)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [1.5.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.5.1...@formatjs/intl-pluralrules@1.5.2) (2020-01-27)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [1.5.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.5.0...@formatjs/intl-pluralrules@1.5.1) (2020-01-22)

**Note:** Version bump only for package @formatjs/intl-pluralrules





# [1.5.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.4.3...@formatjs/intl-pluralrules@1.5.0) (2020-01-09)


### Bug Fixes

* **@formatjs/intl-pluralrules:** tweak polyfill checks ([8daea9b](https://github.com/formatjs/formatjs/commit/8daea9b615be1b215085174a188e908f60b8a05e))
* **@formatjs/intl-utils:** fix setNumberFormatDigitOptions ([cb21c1f](https://github.com/formatjs/formatjs/commit/cb21c1f7abcb32040ffc5108c37734e2fd43c117))


### Features

* **@formatjs/intl-pluralrules:** also polyfill env where it doesn’t take in minimumFractionDigits ([7ab043a](https://github.com/formatjs/formatjs/commit/7ab043a58c33b52992ac179d70e195c2026940b0))





## [1.4.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.4.2...@formatjs/intl-pluralrules@1.4.3) (2020-01-08)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [1.4.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.4.1...@formatjs/intl-pluralrules@1.4.2) (2020-01-06)


### Bug Fixes

* **@formatjs/intl-utils:** fix getInternalSlot to prevent Object.prototype taint ([334441b](https://github.com/formatjs/formatjs/commit/334441b000c0206c77683f70a1f987d2793643cb))





## [1.4.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.4.0...@formatjs/intl-pluralrules@1.4.1) (2019-12-27)

**Note:** Version bump only for package @formatjs/intl-pluralrules





# [1.4.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.3.9...@formatjs/intl-pluralrules@1.4.0) (2019-12-26)


### Bug Fixes

* **@formatjs/intl-unified-numberformat:** move currency processing to lazy ([6e1d621](https://github.com/formatjs/formatjs/commit/6e1d62189373dc4fdf71614c78a353f96e28c8ed))


### Features

* **@formatjs/intl-unified-numberformat:** initial work on currency narrowSymbol ([e379236](https://github.com/formatjs/formatjs/commit/e379236d8f06c2f520a981fce78e11a3f207384e))





## [1.3.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.3.8...@formatjs/intl-pluralrules@1.3.9) (2019-12-02)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [1.3.8](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.3.7...@formatjs/intl-pluralrules@1.3.8) (2019-12-01)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [1.3.7](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.3.6...@formatjs/intl-pluralrules@1.3.7) (2019-11-26)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [1.3.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.3.5...@formatjs/intl-pluralrules@1.3.6) (2019-11-25)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [1.3.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.3.4...@formatjs/intl-pluralrules@1.3.5) (2019-11-23)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [1.3.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.3.3...@formatjs/intl-pluralrules@1.3.4) (2019-11-21)


### Bug Fixes

* **@formatjs/intl-pluralrules:** use api-extractor to combine d.ts ([65adff2](https://github.com/formatjs/formatjs/commit/65adff246962109496ee1f8de142496e8a9c0156))





## [1.3.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.3.2...@formatjs/intl-pluralrules@1.3.3) (2019-11-20)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [1.3.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.3.1...@formatjs/intl-pluralrules@1.3.2) (2019-11-10)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [1.3.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.3.0...@formatjs/intl-pluralrules@1.3.1) (2019-10-23)

**Note:** Version bump only for package @formatjs/intl-pluralrules





# [1.3.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.2.1...@formatjs/intl-pluralrules@1.3.0) (2019-10-01)


### Features

* **@formatjs/intl-pluralrules:** add UMD polyfill-with-locales, fix [#195](https://github.com/formatjs/formatjs/issues/195) ([8d3e03a](https://github.com/formatjs/formatjs/commit/8d3e03a))
* **@formatjs/intl-utils:** add IE11-safe getCanonicalLocales, ([b5f37c4](https://github.com/formatjs/formatjs/commit/b5f37c4)), closes [#200](https://github.com/formatjs/formatjs/issues/200)





## [1.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.2.0...@formatjs/intl-pluralrules@1.2.1) (2019-09-27)

**Note:** Version bump only for package @formatjs/intl-pluralrules





# [1.2.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.1.5...@formatjs/intl-pluralrules@1.2.0) (2019-09-20)


### Bug Fixes

* **@formatjs/intl-pluralrules:** add more side-effectful files ([6bc0bd7](https://github.com/formatjs/formatjs/commit/6bc0bd7))
* **@formatjs/intl-pluralrules:** rm side effects array due to build complication ([f22e552](https://github.com/formatjs/formatjs/commit/f22e552))


### Features

* **@formatjs/intl-pluralrules:** mark the package as side-effects free ([95174b9](https://github.com/formatjs/formatjs/commit/95174b9))





## [1.1.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.1.4...@formatjs/intl-pluralrules@1.1.5) (2019-09-17)


### Bug Fixes

* **@formatjs/intl-pluralrules:** merge fix meta into core ([0b10309](https://github.com/formatjs/formatjs/commit/0b10309))
* **@formatjs/intl-pluralrules:** remove unnecessary meta fixes ([27942a2](https://github.com/formatjs/formatjs/commit/27942a2))





## [1.1.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.1.3...@formatjs/intl-pluralrules@1.1.4) (2019-09-15)

**Note:** Version bump only for package @formatjs/intl-pluralrules





## [1.1.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.1.2...@formatjs/intl-pluralrules@1.1.3) (2019-09-13)


### Bug Fixes

* **@formatjs/intl-pluralrules:** fix precision-related value in select ([b3f3804](https://github.com/formatjs/formatjs/commit/b3f3804))
* **@formatjs/intl-pluralrules:** fix typo in toRawFixed ([8b2a7bf](https://github.com/formatjs/formatjs/commit/8b2a7bf))
* **@formatjs/intl-pluralrules:** honor numberformat options ([c9ef463](https://github.com/formatjs/formatjs/commit/c9ef463)), closes [#185](https://github.com/formatjs/formatjs/issues/185)
* **@formatjs/intl-utils:** consolidate parent lookup ([bac2eae](https://github.com/formatjs/formatjs/commit/bac2eae))
* **@formatjs/intl-utils:** fix lookup case sensitivity ([52fb192](https://github.com/formatjs/formatjs/commit/52fb192))





## [1.1.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.1.1...@formatjs/intl-pluralrules@1.1.2) (2019-09-03)


### Bug Fixes

* **@formatjs/intl-pluralrules:** add UMD polyfill js artifact ([0c471b0](https://github.com/formatjs/formatjs/commit/0c471b0))





## [1.1.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-pluralrules@1.1.0...@formatjs/intl-pluralrules@1.1.1) (2019-09-03)

**Note:** Version bump only for package @formatjs/intl-pluralrules





# 1.1.0 (2019-09-03)


### Bug Fixes

* **@formatjs/intl-pluralrules:** add runner for test262 ([95190a6](https://github.com/formatjs/formatjs/commit/95190a6))
* **@formatjs/intl-pluralrules:** fix _type valueOf to return correct string ([06fb462](https://github.com/formatjs/formatjs/commit/06fb462))
* **@formatjs/intl-pluralrules:** fully test262-compliant ([3018df1](https://github.com/formatjs/formatjs/commit/3018df1))
* **@formatjs/intl-pluralrules:** more fixes for test262 ([cc78d16](https://github.com/formatjs/formatjs/commit/cc78d16))
* **@formatjs/intl-relativetimeformat:** fix test262 ([025dfe3](https://github.com/formatjs/formatjs/commit/025dfe3))
* **@formatjs/intl-utils:** add polyfill-utils like getOption/toObject ([7cf1cc4](https://github.com/formatjs/formatjs/commit/7cf1cc4))


### Features

* **@formatjs/intl-pluralrules:** add @formatjs/intl-pluralrules… ([#169](https://github.com/formatjs/formatjs/issues/169)) ([9496eca](https://github.com/formatjs/formatjs/commit/9496eca))
* **@formatjs/intl-pluralrules:** make it more test262-compliant ([#170](https://github.com/formatjs/formatjs/issues/170)) ([5afde82](https://github.com/formatjs/formatjs/commit/5afde82))

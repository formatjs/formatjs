# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.5.8](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.5.7...@formatjs/intl-localematcher@0.5.8) (2024-11-18)

### Bug Fixes

* **@formatjs/intl-localematcher:** update impl to latest spec ([1258dac](https://github.com/formatjs/formatjs/commit/1258dacb0e8c70f9c84517bc1aba4814a8b4ff83)) - by @longlho

## [0.5.7](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.5.6...@formatjs/intl-localematcher@0.5.7) (2024-11-02)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.5.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.5.5...@formatjs/intl-localematcher@0.5.6) (2024-10-25)

### Bug Fixes

* relax tslib req to 2 instead of 2.7 ([930c3e8](https://github.com/formatjs/formatjs/commit/930c3e8ddcc160fde7466449575455f135f78ca6)) - by @longlho

## [0.5.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.5.4...@formatjs/intl-localematcher@0.5.5) (2024-10-12)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.5.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.5.3...@formatjs/intl-localematcher@0.5.4) (2024-01-16)

### Bug Fixes

* **@formatjs/intl-localematcher:** remove penalty for supported locales order, fix [#4267](https://github.com/formatjs/formatjs/issues/4267) ([e6f0198](https://github.com/formatjs/formatjs/commit/e6f019857e41dab91271b5457628f1a022df39d1)) - by @longlho

## [0.5.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.5.2...@formatjs/intl-localematcher@0.5.3) (2024-01-16)

### Bug Fixes

* **@formatjs/intl-localematcher:** fix default threshold to account for paradigm locales, fix [#4272](https://github.com/formatjs/formatjs/issues/4272) ([b7ce2d0](https://github.com/formatjs/formatjs/commit/b7ce2d078fec0584d7baea78b982b3a70601d1de)) - by @longlho

## [0.5.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.5.1...@formatjs/intl-localematcher@0.5.2) (2023-11-14)

### Bug Fixes

* **@formatjs/intl-durationformat:** add polyfill detector + docs ([d6d237a](https://github.com/formatjs/formatjs/commit/d6d237a2ffca73d5e3824df17bf5ebf7e7b135a8)) - by @

## [0.5.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.5.0...@formatjs/intl-localematcher@0.5.1) (2023-11-12)

### Bug Fixes

* **@formatjs/intl-localematcher:** add weight to requested locale order, fix [#4258](https://github.com/formatjs/formatjs/issues/4258) ([518d7cf](https://github.com/formatjs/formatjs/commit/518d7cf35f0340b78cf6b899267018e98ff20ddb))

# [0.5.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.4.2...@formatjs/intl-localematcher@0.5.0) (2023-11-06)

### Bug Fixes

* **@formatjs/intl-localematcher:** fix distance algorithm ([fafbc09](https://github.com/formatjs/formatjs/commit/fafbc091a174addc076b9a088d09f37c36b2e3e1))

### Features

* **@formatjs/intl-localematcher:** implement distance-based locale matching using languageMatching algo ([d95d21f](https://github.com/formatjs/formatjs/commit/d95d21f1ea10a190f45968e909323e9af6992921))

## [0.4.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.4.1...@formatjs/intl-localematcher@0.4.2) (2023-09-10)

### Bug Fixes

* **@formatjs/intl-localematcher:** return unicode locale extension field in BestFitMatcher ([#4187](https://github.com/formatjs/formatjs/issues/4187)) ([5c40698](https://github.com/formatjs/formatjs/commit/5c40698e059b6a391ca265fcc3110cb6cffcc009))

## [0.4.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.4.0...@formatjs/intl-localematcher@0.4.1) (2023-09-07)

### Bug Fixes

* **@formatjs/intl-localematcher:** extend match paramiter types ([#4132](https://github.com/formatjs/formatjs/issues/4132)) ([2027875](https://github.com/formatjs/formatjs/commit/20278759fa461d20f4061f9b6c495d6671cc794e))

# [0.4.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.3.0...@formatjs/intl-localematcher@0.4.0) (2023-06-12)

### Features

* **@formatjs/intl,@formatjs/fast-memoize,@formatjs/icu-messageformat-parser,@formatjs/intl-displaynames,@formatjs/intl-listformat,intl-messageformat,@formatjs/ecma402-abstract,@formatjs/intl-numberformat,@formatjs/icu-skeleton-parser:** Revert esm conditional exports ([#4129](https://github.com/formatjs/formatjs/issues/4129)) ([78edf46](https://github.com/formatjs/formatjs/commit/78edf460a466a7021e3753be53fd9c6af00f2d96)), closes [#4128](https://github.com/formatjs/formatjs/issues/4128) [#4127](https://github.com/formatjs/formatjs/issues/4127) [#4126](https://github.com/formatjs/formatjs/issues/4126)

# [0.3.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.32...@formatjs/intl-localematcher@0.3.0) (2023-06-06)

### Features

* **@formatjs/intl,@formatjs/fast-memoize,@formatjs/icu-messageformat-parser,@formatjs/intl-displaynames,@formatjs/intl-listformat,intl-messageformat,@formatjs/ecma402-abstract,@formatjs/intl-numberformat,@formatjs/icu-skeleton-parser:** esm conditional exports ([#4109](https://github.com/formatjs/formatjs/issues/4109)) ([e0d593c](https://github.com/formatjs/formatjs/commit/e0d593cc3af3a317a6bd20c441191e5bbb136a93)), closes [#4013](https://github.com/formatjs/formatjs/issues/4013)

## [0.2.32](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.31...@formatjs/intl-localematcher@0.2.32) (2022-12-02)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.31](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.30...@formatjs/intl-localematcher@0.2.31) (2022-08-27)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.30](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.29...@formatjs/intl-localematcher@0.2.30) (2022-08-21)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.29](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.28...@formatjs/intl-localematcher@0.2.29) (2022-08-18)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.28](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.27...@formatjs/intl-localematcher@0.2.28) (2022-06-06)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.27](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.26...@formatjs/intl-localematcher@0.2.27) (2022-05-19)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.26](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.25...@formatjs/intl-localematcher@0.2.26) (2022-05-19)

### Bug Fixes

* **react-intl:** fix type issue with react18, fix [#3550](https://github.com/formatjs/formatjs/issues/3550) ([2567b93](https://github.com/formatjs/formatjs/commit/2567b932c5d18b097a43842563046c20ce0c49f1))

## [0.2.25](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.24...@formatjs/intl-localematcher@0.2.25) (2022-03-26)

### Bug Fixes

* **@formatjs/intl-localematcher:** adds module field to package.json, fixes [#3456](https://github.com/formatjs/formatjs/issues/3456) ([#3457](https://github.com/formatjs/formatjs/issues/3457)) ([e805d9e](https://github.com/formatjs/formatjs/commit/e805d9e29bae0298a081f760e90c8c5d2dd1aa7c))

## [0.2.24](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.23...@formatjs/intl-localematcher@0.2.24) (2022-02-06)

### Bug Fixes

* **@formatjs/intl-localematcher:** prioritize locale in front of canonicalized/minimized locale, fix [#3405](https://github.com/formatjs/formatjs/issues/3405) ([81fa22a](https://github.com/formatjs/formatjs/commit/81fa22a87d42362f4d4d8406429f3161a977cd42))

## [0.2.23](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.22...@formatjs/intl-localematcher@0.2.23) (2022-01-24)

### Bug Fixes

* **@formatjs/intl-localematcher:** fix best fit to account for canonicalization ([cacad92](https://github.com/formatjs/formatjs/commit/cacad921ed4eb2f608979fe03b8cdcd3d1719766))

## [0.2.22](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.21...@formatjs/intl-localematcher@0.2.22) (2022-01-03)

### Bug Fixes

* **@formatjs/intl-localematcher:** iterate through set instead of Array.from so we dont rely on polyfill ([2114518](https://github.com/formatjs/formatjs/commit/211451805d09aae543a8a0aeae1b62a179aaae07))

## [0.2.21](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.20...@formatjs/intl-localematcher@0.2.21) (2021-09-27)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.20](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.19...@formatjs/intl-localematcher@0.2.20) (2021-08-15)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.19](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.18...@formatjs/intl-localematcher@0.2.19) (2021-08-06)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.18](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.17...@formatjs/intl-localematcher@0.2.18) (2021-07-24)

### Bug Fixes

* **@formatjs/intl-localematcher:** fix best fit algo, fix [#3058](https://github.com/formatjs/formatjs/issues/3058) ([c9dad00](https://github.com/formatjs/formatjs/commit/c9dad0081ba57792b3cdcf6bc1a02c5dc3f57dc1))
* **@formatjs/intl-localematcher:** refactor and consolidate files ([1d1a4bc](https://github.com/formatjs/formatjs/commit/1d1a4bc6e5ccbf7be774d4f0f4b2ef2c7fa334b5))

## [0.2.17](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.16...@formatjs/intl-localematcher@0.2.17) (2021-07-20)

### Bug Fixes

* **@formatjs/intl-localematcher:** Correct path to main file for @formatjs/intl-localematcher ([#3057](https://github.com/formatjs/formatjs/issues/3057)) ([e2267bb](https://github.com/formatjs/formatjs/commit/e2267bbc2645d007ccbae8dfa77bc7ad422cfde2))

## [0.2.16](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.15...@formatjs/intl-localematcher@0.2.16) (2021-06-26)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.15](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.14...@formatjs/intl-localematcher@0.2.15) (2021-06-05)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.14](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.13...@formatjs/intl-localematcher@0.2.14) (2021-06-01)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.13](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.12...@formatjs/intl-localematcher@0.2.13) (2021-05-23)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.12](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.11...@formatjs/intl-localematcher@0.2.12) (2021-05-20)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.11](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.10...@formatjs/intl-localematcher@0.2.11) (2021-05-17)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.10](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.9...@formatjs/intl-localematcher@0.2.10) (2021-05-10)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.8...@formatjs/intl-localematcher@0.2.9) (2021-04-26)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.8](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.7...@formatjs/intl-localematcher@0.2.8) (2021-04-12)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.7](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.6...@formatjs/intl-localematcher@0.2.7) (2021-03-26)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.5...@formatjs/intl-localematcher@0.2.6) (2021-03-15)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.4...@formatjs/intl-localematcher@0.2.5) (2021-03-01)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.3...@formatjs/intl-localematcher@0.2.4) (2021-02-25)

### Bug Fixes

* bump tslib version dep ([37577d2](https://github.com/formatjs/formatjs/commit/37577d22bf28d23de1d8013ba0047cf221ad8840)), closes [#2645](https://github.com/formatjs/formatjs/issues/2645)

## [0.2.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.2...@formatjs/intl-localematcher@0.2.3) (2021-02-25)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.1...@formatjs/intl-localematcher@0.2.2) (2021-02-22)

**Note:** Version bump only for package @formatjs/intl-localematcher

## [0.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.2.0...@formatjs/intl-localematcher@0.2.1) (2021-02-21)

**Note:** Version bump only for package @formatjs/intl-localematcher

# [0.2.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-localematcher@0.1.0...@formatjs/intl-localematcher@0.2.0) (2021-02-08)

### Features

* **@formatjs/intl-localematcher:** switch entry point to prepackaged UMD file ([a0481cc](https://github.com/formatjs/formatjs/commit/a0481cc79e95960b540cafc541d555a5c228851f))

# 0.1.0 (2021-02-08)

### Features

* **@formatjs/intl-localematcher:** add ponyfill for Intl.LocaleMatcher ([e479543](https://github.com/formatjs/formatjs/commit/e479543e92e9b6c6d08f68848f25bcb9ba558ab3))
* **@formatjs/intl-localematcher:** reset version ([7684b54](https://github.com/formatjs/formatjs/commit/7684b543fa7c3db3aad839bae8485ec7de4ee495))

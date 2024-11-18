# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.2.4](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@2.2.3...@formatjs/ecma402-abstract@2.2.4) (2024-11-18)

**Note:** Version bump only for package @formatjs/ecma402-abstract

## [2.2.3](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@2.2.2...@formatjs/ecma402-abstract@2.2.3) (2024-11-04)

### Bug Fixes

* **@formatjs/intl-numberformat:** implement CollapseNumberRange using LDML, fix [#4521](https://github.com/formatjs/formatjs/issues/4521) ([fbe4128](https://github.com/formatjs/formatjs/commit/fbe41286cf7a128098657c1c8d313915332319b5)) - by @longlho

## [2.2.2](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@2.2.1...@formatjs/ecma402-abstract@2.2.2) (2024-11-02)

**Note:** Version bump only for package @formatjs/ecma402-abstract

## [2.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@2.2.0...@formatjs/ecma402-abstract@2.2.1) (2024-10-25)

### Bug Fixes

* relax tslib req to 2 instead of 2.7 ([930c3e8](https://github.com/formatjs/formatjs/commit/930c3e8ddcc160fde7466449575455f135f78ca6)) - by @longlho

# [2.2.0](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@2.0.0...@formatjs/ecma402-abstract@2.2.0) (2024-10-12)

### Features

* **@formatjs/ecma402-abstract:** add utils to memoize Intl constructor ([b411a46](https://github.com/formatjs/formatjs/commit/b411a46e60c467dee9ca4be7cd98a6c889c39df2)) - by @longlho

# [2.1.0](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@2.0.0...@formatjs/ecma402-abstract@2.1.0) (2024-10-09)

### Features

* **@formatjs/ecma402-abstract:** add utils to memoize Intl constructor ([b411a46](https://github.com/formatjs/formatjs/commit/b411a46e60c467dee9ca4be7cd98a6c889c39df2)) - by @longlho

# [2.0.0](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.18.3...@formatjs/ecma402-abstract@2.0.0) (2024-05-19)

### Bug Fixes

* **@formatjs/intl-numberformat:** use currencyDecimal when style is currency if possible, mainly for fr-CH ([4286b68](https://github.com/formatjs/formatjs/commit/4286b681ce1bfe7894ed6e32b5c4f21e91e6af91)) - by @longlho

### Features

* **@formatjs/intl-locale:** update impl to match stage-3 ([753bfea](https://github.com/formatjs/formatjs/commit/753bfeab3d8b590d041da221542180f5e1b5c346)), closes [#4375](https://github.com/formatjs/formatjs/issues/4375) - by @longlho

### BREAKING CHANGES

* **@formatjs/intl-locale:** a lot of getters have been removed from the spec so
we've also removed them from this polyfill

## [1.18.3](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.18.2...@formatjs/ecma402-abstract@1.18.3) (2024-05-18)

### Bug Fixes

* **@formatjs/intl-numberformat:** use currencyGroup when style is currency if possible, fix [#4422](https://github.com/formatjs/formatjs/issues/4422) ([6bc4bf1](https://github.com/formatjs/formatjs/commit/6bc4bf1ffeaa7eade5f84d4363819ef07d33221f)) - by @longlho

## [1.18.2](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.18.1...@formatjs/ecma402-abstract@1.18.2) (2024-01-16)

**Note:** Version bump only for package @formatjs/ecma402-abstract

## [1.18.1](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.18.0...@formatjs/ecma402-abstract@1.18.1) (2024-01-16)

**Note:** Version bump only for package @formatjs/ecma402-abstract

# [1.18.0](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.17.4...@formatjs/ecma402-abstract@1.18.0) (2023-11-14)

### Bug Fixes

* **@formatjs/intl-durationformat:** add polyfill detector + docs ([d6d237a](https://github.com/formatjs/formatjs/commit/d6d237a2ffca73d5e3824df17bf5ebf7e7b135a8)) - by @
* **@formatjs/intl-durationformat:** fix partitioning logic ([4f5a1fc](https://github.com/formatjs/formatjs/commit/4f5a1fcfbc2841f7c8f6fe7c0e9053e4ca394a81)) - by @

### Features

* **@formatjs/intl-durationformat:** implement stage-3 spec ([01bcfc7](https://github.com/formatjs/formatjs/commit/01bcfc7ac759ccd18fa8dd380e4bd33c34fa274f)), closes [#4257](https://github.com/formatjs/formatjs/issues/4257) - by @

## [1.17.4](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.17.3...@formatjs/ecma402-abstract@1.17.4) (2023-11-12)

**Note:** Version bump only for package @formatjs/ecma402-abstract

## [1.17.3](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.17.2...@formatjs/ecma402-abstract@1.17.3) (2023-11-06)

### Bug Fixes

* **@formatjs/intl-localematcher:** fix distance algorithm ([fafbc09](https://github.com/formatjs/formatjs/commit/fafbc091a174addc076b9a088d09f37c36b2e3e1))

## [1.17.2](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.17.1...@formatjs/ecma402-abstract@1.17.2) (2023-09-10)

**Note:** Version bump only for package @formatjs/ecma402-abstract

## [1.17.1](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.17.0...@formatjs/ecma402-abstract@1.17.1) (2023-09-07)

**Note:** Version bump only for package @formatjs/ecma402-abstract

# [1.17.0](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.16.0...@formatjs/ecma402-abstract@1.17.0) (2023-06-12)

### Features

* **@formatjs/intl,@formatjs/fast-memoize,@formatjs/icu-messageformat-parser,@formatjs/intl-displaynames,@formatjs/intl-listformat,intl-messageformat,@formatjs/ecma402-abstract,@formatjs/intl-numberformat,@formatjs/icu-skeleton-parser:** Revert esm conditional exports ([#4129](https://github.com/formatjs/formatjs/issues/4129)) ([78edf46](https://github.com/formatjs/formatjs/commit/78edf460a466a7021e3753be53fd9c6af00f2d96)), closes [#4128](https://github.com/formatjs/formatjs/issues/4128) [#4127](https://github.com/formatjs/formatjs/issues/4127) [#4126](https://github.com/formatjs/formatjs/issues/4126)

# [1.16.0](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.15.0...@formatjs/ecma402-abstract@1.16.0) (2023-06-06)

### Features

* **@formatjs/intl,@formatjs/fast-memoize,@formatjs/icu-messageformat-parser,@formatjs/intl-displaynames,@formatjs/intl-listformat,intl-messageformat,@formatjs/ecma402-abstract,@formatjs/intl-numberformat,@formatjs/icu-skeleton-parser:** esm conditional exports ([#4109](https://github.com/formatjs/formatjs/issues/4109)) ([e0d593c](https://github.com/formatjs/formatjs/commit/e0d593cc3af3a317a6bd20c441191e5bbb136a93)), closes [#4013](https://github.com/formatjs/formatjs/issues/4013)

# [1.15.0](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.14.3...@formatjs/ecma402-abstract@1.15.0) (2023-05-01)

### Features

* **@formatjs/intl-datetimeformat:** updated `tzdata` to `2023c` and fixed missing and changed TimeZone ([1b4856b](https://github.com/formatjs/formatjs/commit/1b4856b11c32c6ac99aa8795ee487c92b4d9d9c9))

## [1.14.3](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.14.2...@formatjs/ecma402-abstract@1.14.3) (2022-12-02)

**Note:** Version bump only for package @formatjs/ecma402-abstract

## [1.14.2](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.14.0...@formatjs/ecma402-abstract@1.14.2) (2022-12-01)

### Bug Fixes

* **@formatjs/intl:** update monorepo to use TypeScript 4.9 and actually fix the type issue ([#3919](https://github.com/formatjs/formatjs/issues/3919)) ([051527b](https://github.com/formatjs/formatjs/commit/051527b6391c8f4548254ab20630173789d555cd))

## [1.14.1](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.14.0...@formatjs/ecma402-abstract@1.14.1) (2022-12-01)

### Bug Fixes

* **@formatjs/intl:** update monorepo to use TypeScript 4.9 and actually fix the type issue ([#3919](https://github.com/formatjs/formatjs/issues/3919)) ([051527b](https://github.com/formatjs/formatjs/commit/051527b6391c8f4548254ab20630173789d555cd))

# [1.14.0](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.13.0...@formatjs/ecma402-abstract@1.14.0) (2022-11-29)

### Features

* **@formatjs/intl-displaynames:** Intl DisplayNames API V2 (Stage 3) implementation ([#3890](https://github.com/formatjs/formatjs/issues/3890)) ([e39a89e](https://github.com/formatjs/formatjs/commit/e39a89ecee56a0c234e661e3860b61aa3a34f65e))
* **@formatjs/intl-numberformat:** implemented formatNumericRange and formatNumericRangeToParts ([#3860](https://github.com/formatjs/formatjs/issues/3860)) ([113a169](https://github.com/formatjs/formatjs/commit/113a169e41830ff4ddb6ae0c797292b2297bdf1d))

# [1.13.0](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.12.0...@formatjs/ecma402-abstract@1.13.0) (2022-10-13)

### Features

* **@formatjs/intl-datetimeformat:** implemented extend timeZoneName ([#3861](https://github.com/formatjs/formatjs/issues/3861)) ([4fa0204](https://github.com/formatjs/formatjs/commit/4fa0204c049c77f05dd37ddd8109b98be67de7da))
* **@formatjs/intl-numberformat:** initial NumberFormat v3 implementation ([#3853](https://github.com/formatjs/formatjs/issues/3853)) ([6cc06ec](https://github.com/formatjs/formatjs/commit/6cc06ece7f433dc8d586ac0f969e1d8b47790f1c))

# [1.12.0](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.11.10...@formatjs/ecma402-abstract@1.12.0) (2022-08-27)

### Features

* **@formatjs/ts-transformer:** support TypeScript 4.7 syntax ([#3764](https://github.com/formatjs/formatjs/issues/3764)) ([1b3388e](https://github.com/formatjs/formatjs/commit/1b3388e9344de3a948068f5cf449341c1eb597a8))

## [1.11.10](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.11.9...@formatjs/ecma402-abstract@1.11.10) (2022-08-21)

**Note:** Version bump only for package @formatjs/ecma402-abstract

## [1.11.9](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.11.8...@formatjs/ecma402-abstract@1.11.9) (2022-08-18)

**Note:** Version bump only for package @formatjs/ecma402-abstract

## [1.11.8](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.11.7...@formatjs/ecma402-abstract@1.11.8) (2022-07-04)

### Bug Fixes

* fix date-time types for TS 4.7, fix [#3623](https://github.com/formatjs/formatjs/issues/3623) ([97753ce](https://github.com/formatjs/formatjs/commit/97753ceb374968e7e00d7516ced24e12b167ad0d))

## [1.11.7](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.11.6...@formatjs/ecma402-abstract@1.11.7) (2022-06-06)

**Note:** Version bump only for package @formatjs/ecma402-abstract

## [1.11.6](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.11.5...@formatjs/ecma402-abstract@1.11.6) (2022-05-19)

**Note:** Version bump only for package @formatjs/ecma402-abstract

## [1.11.5](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.11.4...@formatjs/ecma402-abstract@1.11.5) (2022-05-19)

### Bug Fixes

* **react-intl:** fix type issue with react18, fix [#3550](https://github.com/formatjs/formatjs/issues/3550) ([2567b93](https://github.com/formatjs/formatjs/commit/2567b932c5d18b097a43842563046c20ce0c49f1))

## [1.11.4](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.11.3...@formatjs/ecma402-abstract@1.11.4) (2022-03-26)

**Note:** Version bump only for package @formatjs/ecma402-abstract

## [1.11.3](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.11.2...@formatjs/ecma402-abstract@1.11.3) (2022-02-06)

**Note:** Version bump only for package @formatjs/ecma402-abstract

## [1.11.2](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.11.1...@formatjs/ecma402-abstract@1.11.2) (2022-01-24)

**Note:** Version bump only for package @formatjs/ecma402-abstract

## [1.11.1](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.11.0...@formatjs/ecma402-abstract@1.11.1) (2022-01-03)

**Note:** Version bump only for package @formatjs/ecma402-abstract

# [1.11.0](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.10.0...@formatjs/ecma402-abstract@1.11.0) (2021-12-01)

### Features

* support TS 4.5, fix [#3276](https://github.com/formatjs/formatjs/issues/3276) ([31e0699](https://github.com/formatjs/formatjs/commit/31e069972aa16e14532531b9e597cff73a3f4897))

# [1.10.0](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.9.9...@formatjs/ecma402-abstract@1.10.0) (2021-10-17)

### Features

* **@formatjs/icu-skeleton-parser:** parse out NumberFormat v3 options, fix [#3191](https://github.com/formatjs/formatjs/issues/3191) ([24e14d0](https://github.com/formatjs/formatjs/commit/24e14d072467401727a5a96324e5d7e7b758c630))

## [1.9.9](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.9.8...@formatjs/ecma402-abstract@1.9.9) (2021-09-27)

**Note:** Version bump only for package @formatjs/ecma402-abstract

## [1.9.8](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.9.7...@formatjs/ecma402-abstract@1.9.8) (2021-08-21)

### Bug Fixes

* **@formatjs/ecma402-abstract:** rm custom DateTimeFormatOptions and use the native one ([61ea5c9](https://github.com/formatjs/formatjs/commit/61ea5c9ee6819b8af8925e2352275e9e86f2cb1a))

## [1.9.7](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.9.6...@formatjs/ecma402-abstract@1.9.7) (2021-08-15)

**Note:** Version bump only for package @formatjs/ecma402-abstract

## [1.9.6](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.9.5...@formatjs/ecma402-abstract@1.9.6) (2021-08-06)

**Note:** Version bump only for package @formatjs/ecma402-abstract

## [1.9.5](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.9.4...@formatjs/ecma402-abstract@1.9.5) (2021-07-24)

### Bug Fixes

* **@formatjs/ecma402-abstract:** refactoring ([bb01687](https://github.com/formatjs/formatjs/commit/bb01687d5202641a7cb7949796bee8c64232cc9f))

## [1.9.4](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.9.3...@formatjs/ecma402-abstract@1.9.4) (2021-06-26)

### Bug Fixes

* **@formatjs/ecma402-abstract:** rm json import to be more ESM-friendly, fix [#2961](https://github.com/formatjs/formatjs/issues/2961) ([2bfedbb](https://github.com/formatjs/formatjs/commit/2bfedbbb54e1a6018e701757e19ba901529a1713))

## [1.9.3](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.9.2...@formatjs/ecma402-abstract@1.9.3) (2021-06-05)

### Bug Fixes

* **@formatjs/ecma402-abstract:** fix IsValidTimeZoneName to include target zone from backward, fix [#2951](https://github.com/formatjs/formatjs/issues/2951) ([c18ee8b](https://github.com/formatjs/formatjs/commit/c18ee8b8d8aac6aa8718432a39e187321110239f))

## [1.9.2](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.9.1...@formatjs/ecma402-abstract@1.9.2) (2021-06-01)

**Note:** Version bump only for package @formatjs/ecma402-abstract

## [1.9.1](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.9.0...@formatjs/ecma402-abstract@1.9.1) (2021-05-23)

### Bug Fixes

* **@formatjs/intl-datetimeformat:** fix crash in [#2909](https://github.com/formatjs/formatjs/issues/2909) ([495d1b8](https://github.com/formatjs/formatjs/commit/495d1b82eb971f0d2421114c34038357085e1693))

# [1.9.0](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.8.0...@formatjs/ecma402-abstract@1.9.0) (2021-05-20)

### Features

* **@formatjs/ecma-376:** new package that generate ecma-376 numFmt pattern ([2a57d16](https://github.com/formatjs/formatjs/commit/2a57d1676f8fc840915b2750a5469934dfd765e8)), closes [#2885](https://github.com/formatjs/formatjs/issues/2885)

# [1.8.0](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.7.1...@formatjs/ecma402-abstract@1.8.0) (2021-05-17)

### Features

* **@formatjs/ecma402-abstract:** upgrade symbol regex to unicode 13 ([c991b8c](https://github.com/formatjs/formatjs/commit/c991b8c4bb1b8244eb7fd5490b75727576e1bbd9))

## [1.7.1](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.7.0...@formatjs/ecma402-abstract@1.7.1) (2021-05-10)

**Note:** Version bump only for package @formatjs/ecma402-abstract

# [1.7.0](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.6.5...@formatjs/ecma402-abstract@1.7.0) (2021-04-26)

### Features

* **@formatjs/ecma402-abstract:** add abstract ops for fractionalSecondDigits ([5b1b1d1](https://github.com/formatjs/formatjs/commit/5b1b1d1261b8c4bac2c01ad1c1623abaf7c1f2c1))

## [1.6.5](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.6.4...@formatjs/ecma402-abstract@1.6.5) (2021-04-12)

### Bug Fixes

* **@formatjs/ecma402-abstract:** modify the constant in function TimeClip ([#2805](https://github.com/formatjs/formatjs/issues/2805)) ([4324002](https://github.com/formatjs/formatjs/commit/4324002ef24207b354115dbc9ba05758505276a1))
* **@formatjs/ecma402-abstract:** swap out some impls with native Date, 2x speed, [#2813](https://github.com/formatjs/formatjs/issues/2813) ([463420c](https://github.com/formatjs/formatjs/commit/463420c21ca9c64f629f31fee2dc63031be9122c))

## [1.6.4](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.6.3...@formatjs/ecma402-abstract@1.6.4) (2021-03-26)

**Note:** Version bump only for package @formatjs/ecma402-abstract

## [1.6.3](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.6.2...@formatjs/ecma402-abstract@1.6.3) (2021-03-15)

**Note:** Version bump only for package @formatjs/ecma402-abstract

## [1.6.2](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.6.1...@formatjs/ecma402-abstract@1.6.2) (2021-03-01)

**Note:** Version bump only for package @formatjs/ecma402-abstract

## [1.6.1](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.6.0...@formatjs/ecma402-abstract@1.6.1) (2021-02-25)

### Bug Fixes

* bump tslib version dep ([37577d2](https://github.com/formatjs/formatjs/commit/37577d22bf28d23de1d8013ba0047cf221ad8840)), closes [#2645](https://github.com/formatjs/formatjs/issues/2645)

# [1.6.0](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.5.4...@formatjs/ecma402-abstract@1.6.0) (2021-02-25)

### Bug Fixes

* **@formatjs/intl-numberformat:** switch instanceof to OrdinaryHasInstance per new spec ([c40fd87](https://github.com/formatjs/formatjs/commit/c40fd879508a678374203c1ef4efa842985dfc44))

### Features

* **@formatjs/ecma402-abstract:** support TS4.2 ([a161685](https://github.com/formatjs/formatjs/commit/a161685531020751227fe10d10e4eaa9e1fce846))

## [1.5.4](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.5.3...@formatjs/ecma402-abstract@1.5.4) (2021-02-22)

### Bug Fixes

* **@formatjs/intl-displaynames:** fix script canonicalization, fix [#2622](https://github.com/formatjs/formatjs/issues/2622) ([be07282](https://github.com/formatjs/formatjs/commit/be072825c3d8f5171b3a2aed8f382f6fde6b12ca))

## [1.5.3](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.5.2...@formatjs/ecma402-abstract@1.5.3) (2021-02-21)

### Bug Fixes

* **@formatjs/ecma402-abstract:** limit accepted calendar values to 'gregory' ([#2618](https://github.com/formatjs/formatjs/issues/2618)) ([fb3e462](https://github.com/formatjs/formatjs/commit/fb3e46281e18d41e3cc42ba77ec418f244ec84c1))

## [1.5.2](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.5.1...@formatjs/ecma402-abstract@1.5.2) (2021-01-27)

### Bug Fixes

* **@formatjs/ecma402-abstract:** make Set usage IE11-safe, fix [#2529](https://github.com/formatjs/formatjs/issues/2529) ([2ebe21c](https://github.com/formatjs/formatjs/commit/2ebe21cf4eaad9200bbb0bbd89e5a7ad95c1a97f))

## [1.5.1](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.5.0...@formatjs/ecma402-abstract@1.5.1) (2021-01-05)

### Bug Fixes

* **@formatjs/intl-datetimeformat:** fix default range pattern fallback, fix [#2474](https://github.com/formatjs/formatjs/issues/2474) ([2a618a1](https://github.com/formatjs/formatjs/commit/2a618a1ebf853a377c43da131573e5b78e35bd99))

# [1.5.0](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.4.0...@formatjs/ecma402-abstract@1.5.0) (2020-11-20)

### Features

* **@formatjs/ecma402-abstract:** improve best fit locale negotiation ([7ab3e46](https://github.com/formatjs/formatjs/commit/7ab3e46be9f954b1b4cb0baac2b2c05f13544fde))
* **@formatjs/ecma402-abstract:** remove unpackData ([18cd5ae](https://github.com/formatjs/formatjs/commit/18cd5aef07f83456a1ecc98beb86b96869b6cf93))

# [1.4.0](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.3.2...@formatjs/ecma402-abstract@1.4.0) (2020-11-12)

### Features

* **@formatjs/ecma402-abstract:** Move files around ([5ba9502](https://github.com/formatjs/formatjs/commit/5ba9502992b83b28dd6904c417331ca357d64ca9))

## [1.3.2](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.3.1...@formatjs/ecma402-abstract@1.3.2) (2020-11-09)

### Bug Fixes

* **@formatjs/intl-datetimeformat:** fix hourCycle setting, fix [#2291](https://github.com/formatjs/formatjs/issues/2291) ([1915595](https://github.com/formatjs/formatjs/commit/1915595e69e0f24be9c1c9af6a0986ecc82e485a))

## [1.3.1](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.3.0...@formatjs/ecma402-abstract@1.3.1) (2020-11-09)

### Bug Fixes

* **@formatjs/ecma402-abstract:** remove labelled tuple element usage ([8ff1230](https://github.com/formatjs/formatjs/commit/8ff12305ff810788844d13e817b08392c9eef9a9))

# [1.3.0](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.2.6...@formatjs/ecma402-abstract@1.3.0) (2020-11-04)

### Features

* **@formatjs/intl-datetimeformat:** add Intl.DateTimeFormat.formatRange, fix [#2129](https://github.com/formatjs/formatjs/issues/2129) ([#2281](https://github.com/formatjs/formatjs/issues/2281)) ([a5290ad](https://github.com/formatjs/formatjs/commit/a5290ad276ef66bf66c8e33f040f5b94f6556620))

## [1.2.6](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.2.5...@formatjs/ecma402-abstract@1.2.6) (2020-10-25)

### Bug Fixes

* **@formatjs/intl-datetimeformat:** fix h/K pattern, fix [#2236](https://github.com/formatjs/formatjs/issues/2236) ([23257c6](https://github.com/formatjs/formatjs/commit/23257c6eade39cb0d158f6dea94cfeafd890e8f0))

## [1.2.5](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.2.4...@formatjs/ecma402-abstract@1.2.5) (2020-10-10)

### Bug Fixes

* **@formatjs/ecma402-abstract:** fix err message for missing locale data, fix [#2203](https://github.com/formatjs/formatjs/issues/2203) ([e2fb8a3](https://github.com/formatjs/formatjs/commit/e2fb8a37c168136283e965c471b64f2ccc55a0b2))

## [1.2.4](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.2.3...@formatjs/ecma402-abstract@1.2.4) (2020-10-08)

### Bug Fixes

* **@formatjs/intl-datetimeformat:** hour off by one at the exact time that DST starts or ends. ([#2173](https://github.com/formatjs/formatjs/issues/2173)) ([b6601da](https://github.com/formatjs/formatjs/commit/b6601da698da5ebb2f1bcf5f57049d3162a7d48e)), closes [#2170](https://github.com/formatjs/formatjs/issues/2170)

## [1.2.3](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.2.2...@formatjs/ecma402-abstract@1.2.3) (2020-10-01)

### Bug Fixes

* **@formatjs/intl-datetimeformat:** throw err when calendar is not gregory, part of [#2145](https://github.com/formatjs/formatjs/issues/2145) ([1b75c10](https://github.com/formatjs/formatjs/commit/1b75c10e23b705462b504713320a7b602abce497))

## [1.2.2](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.2.1...@formatjs/ecma402-abstract@1.2.2) (2020-09-18)

### Bug Fixes

* **@formatjs/intl-datetimeformat:** fix am/pm logic, fix [#2106](https://github.com/formatjs/formatjs/issues/2106) ([a36567b](https://github.com/formatjs/formatjs/commit/a36567b9d42adfb6391278c332c91eb94a35833b))

## [1.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.2.0...@formatjs/ecma402-abstract@1.2.1) (2020-09-09)

### Bug Fixes

* **@formatjs/intl-numberformat:** determine plurality using rounded number value ([#2065](https://github.com/formatjs/formatjs/issues/2065)) ([4f7f791](https://github.com/formatjs/formatjs/commit/4f7f79131ab8e2868a93e614702a244e49ad6478))

# [1.2.0](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.1.0...@formatjs/ecma402-abstract@1.2.0) (2020-08-28)

### Features

* **@formatjs/ecma402-abstract:** add CanonicalCodeForDisplayNames ([89e19d4](https://github.com/formatjs/formatjs/commit/89e19d400ab830489d7a050e9a45559750718f3b))

# [1.1.0](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.0.3...@formatjs/ecma402-abstract@1.1.0) (2020-08-25)

### Features

* **@formatjs/ecma402-abstract:** add DateTimeFormat ops ([9ad59b6](https://github.com/formatjs/formatjs/commit/9ad59b6dfe1cc00e5e0658e8f8369b98385101e2))
* **@formatjs/ecma402-abstract:** add more PluralRules abstract opts ([c18c107](https://github.com/formatjs/formatjs/commit/c18c1079eca1fcd620b5cce30084fb9adda65baa))
* **@formatjs/ecma402-abstract:** add RelativeTimeFormat abstract ops ([73325d6](https://github.com/formatjs/formatjs/commit/73325d68641a0d92d5cfde72d4e23d8fe4e14ee3))

## [1.0.3](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.0.2...@formatjs/ecma402-abstract@1.0.3) (2020-08-21)

**Note:** Version bump only for package @formatjs/ecma402-abstract

## [1.0.2](https://github.com/formatjs/formatjs/compare/@formatjs/ecma402-abstract@1.0.1...@formatjs/ecma402-abstract@1.0.2) (2020-08-19)

### Bug Fixes

* **@formatjs/ecma402-abstract:** force republish ([b308632](https://github.com/formatjs/formatjs/commit/b308632f40010301860e5ed5319345f78a379569))

## 1.0.1 (2020-08-19)

**Note:** Version bump only for package @formatjs/ecma402-abstract

## [3.8.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@3.8.3...@formatjs/intl-utils@3.8.4) (2020-08-17)

### Bug Fixes

* **@formatjs/intl-numberformat:** use grouping data from CLDR ([#1985](https://github.com/formatjs/formatjs/issues/1985)) ([8edc4ae](https://github.com/formatjs/formatjs/commit/8edc4ae45ed8032f5ca33989f4820bea5c2db030)), closes [#1949](https://github.com/formatjs/formatjs/issues/1949)

## [3.8.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@3.8.2...@formatjs/intl-utils@3.8.3) (2020-08-14)

**Note:** Version bump only for package @formatjs/intl-utils

## [3.8.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@3.8.1...@formatjs/intl-utils@3.8.2) (2020-07-24)

**Note:** Version bump only for package @formatjs/intl-utils

## [3.8.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@3.8.0...@formatjs/intl-utils@3.8.1) (2020-07-16)

### Reverts

* Revert "feat(@formatjs/intl-utils): remove custom LDMLPluralRuleType and use TS3.9 type" ([1a6eeac](https://github.com/formatjs/formatjs/commit/1a6eeac8c59184825968ffddc35374c83f3fe782))

# [3.8.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@3.7.0...@formatjs/intl-utils@3.8.0) (2020-07-14)

### Bug Fixes

* **@formatjs/intl-displaynames:** rm files restriction from package.json ([b89a780](https://github.com/formatjs/formatjs/commit/b89a780803aa682fddf020ca742dc896401e68e0))

### Features

* **@formatjs/intl-utils:** remove custom LDMLPluralRuleType and use TS3.9 type ([8e433d5](https://github.com/formatjs/formatjs/commit/8e433d5afdbf64f7a952d6345e50cad29bbb7083))

# [3.7.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@3.6.0...@formatjs/intl-utils@3.7.0) (2020-07-14)

### Bug Fixes

* **@formatjs/intl-utils:** fix duplicate exports ([a195730](https://github.com/formatjs/formatjs/commit/a195730dd89833769ecfe4d705e8a5a5dffcbd46))

### Features

* publish ([b6e3465](https://github.com/formatjs/formatjs/commit/b6e3465ac95b3fa481f3c89f077a66ac004f7c27))

## [3.6.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@3.6.0...@formatjs/intl-utils@3.6.1) (2020-07-09)

**Note:** Version bump only for package @formatjs/intl-utils

# [3.6.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@3.5.0...@formatjs/intl-utils@3.6.0) (2020-07-03)

### Features

* **@formatjs/intl-utils:** export SANCTIONED_UNITS ([7719e90](https://github.com/formatjs/formatjs/commit/7719e90007733ce50233c5131c296d03da8ae370))

# [3.5.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@3.4.1...@formatjs/intl-utils@3.5.0) (2020-07-01)

### Features

* **@formatjs/ts-transformer:** move interpolate-name here ([232d190](https://github.com/formatjs/formatjs/commit/232d190df037b81a88c6b0147a82b586b5ed7fb3))

## [3.4.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@3.4.0...@formatjs/intl-utils@3.4.1) (2020-06-23)

### Bug Fixes

* **@formatjs/intl-utils:** just bumping version so we can republish ([39caec0](https://github.com/formatjs/formatjs/commit/39caec037ce294d356458a2298473352406d65fd))

# [3.4.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@3.3.1...@formatjs/intl-utils@3.4.0) (2020-06-20)

### Features

* **@formatjs/intl-datetimeformat:** start the polyfill ([#1702](https://github.com/formatjs/formatjs/issues/1702)) ([53f8149](https://github.com/formatjs/formatjs/commit/53f81495edcc9fa2475c1f7863f8dd7d962f2f61))

## [3.3.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@3.3.0...@formatjs/intl-utils@3.3.1) (2020-06-04)

### Bug Fixes

* **@formatjs/intl-utils:** don't export interpolateName from index ([72f1566](https://github.com/formatjs/formatjs/commit/72f15662b321046fd3092bb917934790eb6803a6)), closes [#1700](https://github.com/formatjs/formatjs/issues/1700)

# [3.3.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@3.2.0...@formatjs/intl-utils@3.3.0) (2020-06-04)

### Bug Fixes

* **@formatjs/intl-utils:** fix default params for hash ([1d48c95](https://github.com/formatjs/formatjs/commit/1d48c95fe44a961305326646b6d9f4132ae1646e))

### Features

* **@formatjs/intl-utils:** Add interpolateName ([4d09912](https://github.com/formatjs/formatjs/commit/4d09912e55c79a5246f18fe69c3646b7deb04f1b))

# [3.2.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@3.1.0...@formatjs/intl-utils@3.2.0) (2020-06-03)

### Bug Fixes

* **@formatjs/intl-utils:** fix toRawPrecision (round up) and toRawFixed (with huge numbers) ([#1696](https://github.com/formatjs/formatjs/issues/1696)) ([df68427](https://github.com/formatjs/formatjs/commit/df68427c06cd815231ff19b9d5cc493e6df444e2)), closes [#1692](https://github.com/formatjs/formatjs/issues/1692)

### Features

* **@formatjs/intl-utils:** Move extractor from formatjs-extract-cldr-data here ([11d1a26](https://github.com/formatjs/formatjs/commit/11d1a263d7f8eef1a2623ba76421785f499c61fa))
* **@formatjs/intl-utils:** rm extractor stuff, rm redudant deps ([bfd5732](https://github.com/formatjs/formatjs/commit/bfd5732fff424f08f3f1c97e64c1edf00cbc01a4))
* **formatjs-extract-cldr-data:** rm this package ([62bdd32](https://github.com/formatjs/formatjs/commit/62bdd32aadef899228a5303e01865f69fd729fa3))

# [3.1.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@3.0.1...@formatjs/intl-utils@3.1.0) (2020-05-25)

### Features

* **@formatjs/intl-utils:** Remove aliases and parentLocales ([e0e9370](https://github.com/formatjs/formatjs/commit/e0e937062514f0f776401be99b556682dd0623cc))

## [3.0.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@3.0.0...@formatjs/intl-utils@3.0.1) (2020-05-23)

**Note:** Version bump only for package @formatjs/intl-utils

# [3.0.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@2.3.0...@formatjs/intl-utils@3.0.0) (2020-05-23)

### Features

* **@formatjs/intl-utils:** Use native Intl.getCanonicalLocales ([b6ff8fb](https://github.com/formatjs/formatjs/commit/b6ff8fba63c33601752c4d2cfde504b30d617cd9))

### BREAKING CHANGES

* **@formatjs/intl-utils:** This requires @formatjs/intl-getcanonicallocales for
IE11 and below

* Most of NumberFormat public and internal types are moved out of this package.

# [2.3.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@2.2.5...@formatjs/intl-utils@2.3.0) (2020-05-16)

### Bug Fixes

* **@formatjs/intl-utils:** dont default locales to empty string ([7f50edc](https://github.com/formatjs/formatjs/commit/7f50edcd172e5547cc3154785f8e9d30790086f5))

### Features

* **eslint-plugin-formatjs:** add rule for no-id ([d7d8159](https://github.com/formatjs/formatjs/commit/d7d81595e9154bf929cc0ea772acfe66719f6104))

## [2.2.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@2.2.4...@formatjs/intl-utils@2.2.5) (2020-05-05)

**Note:** Version bump only for package @formatjs/intl-utils

## 2.2.4 (2020-04-28)

**Note:** Version bump only for package @formatjs/intl-utils

## [2.2.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@2.2.2...@formatjs/intl-utils@2.2.3) (2020-04-24)

### Bug Fixes

* **eslint-plugin-formatjs:** add missing dep ([776390e](https://github.com/formatjs/formatjs/commit/776390e9d6cb3bc1eef07b2e92057136cfe95b76))

## [2.2.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@2.2.1...@formatjs/intl-utils@2.2.2) (2020-04-14)

### Bug Fixes

* clean up tsbuildinfo before full build ([c301ca0](https://github.com/formatjs/formatjs/commit/c301ca02e0c319a0eb03921533053f0334ae5df1))

## [2.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@2.2.0...@formatjs/intl-utils@2.2.1) (2020-03-30)

### Bug Fixes

* **intl-utils:** prevent infinite recursion loop of getCanonicalRules ([#591](https://github.com/formatjs/formatjs/issues/591)) ([86e087d](https://github.com/formatjs/formatjs/commit/86e087de2dbd89643e276aab2eb622c4443c29e7))

# [2.2.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@2.1.0...@formatjs/intl-utils@2.2.0) (2020-01-27)

### Features

* **@formatjs/intl-utils:** Add intl-unified-numberformat option types ([e6a32d6](https://github.com/formatjs/formatjs/commit/e6a32d6e6da5e10e4baad0ca02dffb8f56bb2c32))

# [2.1.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@2.0.4...@formatjs/intl-utils@2.1.0) (2020-01-22)

### Bug Fixes

* **@formatjs/intl-unified-numberformat:** fix moar test262 cases ([#464](https://github.com/formatjs/formatjs/issues/464)) ([c3bec6e](https://github.com/formatjs/formatjs/commit/c3bec6e9dda928a48c8ecda7a9e515da7790fde1))
* **@formatjs/intl-unified-numberformat:** fix some 262 test cases ([3e8e931](https://github.com/formatjs/formatjs/commit/3e8e931a9a7bc6901ac7c89f10f8bf19e9fa0fca))

### Features

* **@formatjs/intl-displaynames:** initial commit ([#469](https://github.com/formatjs/formatjs/issues/469)) ([137b994](https://github.com/formatjs/formatjs/commit/137b994846526b02de80b024c860b2771868f236))

## [2.0.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@2.0.3...@formatjs/intl-utils@2.0.4) (2020-01-09)

### Bug Fixes

* **@formatjs/intl-utils:** fix setNumberFormatDigitOptions ([cb21c1f](https://github.com/formatjs/formatjs/commit/cb21c1f7abcb32040ffc5108c37734e2fd43c117))

## [2.0.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@2.0.2...@formatjs/intl-utils@2.0.3) (2020-01-08)

**Note:** Version bump only for package @formatjs/intl-utils

## [2.0.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@2.0.1...@formatjs/intl-utils@2.0.2) (2020-01-06)

### Bug Fixes

* **@formatjs/intl-unified-numberformat:** account for DecimalFormatNum in internal slots ([dc26b43](https://github.com/formatjs/formatjs/commit/dc26b434eabb4f629a821f7c12d5ae7570bd8cab))
* **@formatjs/intl-unified-numberformat:** fix cases where {number} or {0} is in the middle of the pattern ([3ca49d8](https://github.com/formatjs/formatjs/commit/3ca49d8f93a9acc1ea3908ffd9e367b21aa97248))
* **@formatjs/intl-utils:** fix getInternalSlot to prevent Object.prototype taint ([334441b](https://github.com/formatjs/formatjs/commit/334441b000c0206c77683f70a1f987d2793643cb))

## [2.0.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@2.0.0...@formatjs/intl-utils@2.0.1) (2019-12-27)

### Bug Fixes

* **@formatjs/cli:** allow optionalChaining parser, fix [#404](https://github.com/formatjs/formatjs/issues/404) ([1af4607](https://github.com/formatjs/formatjs/commit/1af460783db71bfc7bf0e3f935a020473fcb093d))

# [2.0.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@1.6.0...@formatjs/intl-utils@2.0.0) (2019-12-26)

### Bug Fixes

* **@formatjs/intl-unified-numberformat:** add back unpackData so we get the correct locale hierarchy ([c778e19](https://github.com/formatjs/formatjs/commit/c778e19cc590dcbfed817a57501b6ef36c0c17cd))
* **@formatjs/intl-unified-numberformat:** add more tests ([5122cdc](https://github.com/formatjs/formatjs/commit/5122cdc340f2fcbf05c093075dd97c459cc5709c))
* **@formatjs/intl-unified-numberformat:** add some currency support, update test snapshots ([d603a3c](https://github.com/formatjs/formatjs/commit/d603a3c148412edc7d69257459a03485ae5db6e7))
* **@formatjs/intl-unified-numberformat:** fix -0 case ([c9351c5](https://github.com/formatjs/formatjs/commit/c9351c54bd33f6e5c1869227a9a33802c56b1613))
* **@formatjs/intl-unified-numberformat:** fix scientific notation for numbers < 1 ([8c71872](https://github.com/formatjs/formatjs/commit/8c71872f3ff22edffb4c2543a9d9d45b0fcba05d))
* **@formatjs/intl-unified-numberformat:** more work on currency formatting ([5a5b8e6](https://github.com/formatjs/formatjs/commit/5a5b8e63783d48c86a87a9836e45415e27e38b26))
* **@formatjs/intl-unified-numberformat:** more work on fixing currency pattern ([6cb0d67](https://github.com/formatjs/formatjs/commit/6cb0d6760404be8079361230537f1de1a4dd8c6e))
* **@formatjs/intl-unified-numberformat:** move currency processing to lazy ([6e1d621](https://github.com/formatjs/formatjs/commit/6e1d62189373dc4fdf71614c78a353f96e28c8ed))

### Features

* **@formatjs/intl-unified-numberformat:** add currency support and currency matching algo ([786858d](https://github.com/formatjs/formatjs/commit/786858dc07cf82c4c6d0be968b3192e50f189567))
* **@formatjs/intl-unified-numberformat:** initial work on adding more stage 3 functionalities ([fc09006](https://github.com/formatjs/formatjs/commit/fc0900653586cd933a4b95c3c129ecad4010beed))
* **@formatjs/intl-unified-numberformat:** initial work on currency narrowSymbol ([e379236](https://github.com/formatjs/formatjs/commit/e379236d8f06c2f520a981fce78e11a3f207384e))
* **@formatjs/intl-unified-numberformat:** more work on stage-3 APIs ([3f510ca](https://github.com/formatjs/formatjs/commit/3f510cac1906682db5a0fb721d62431e7ec0cb7d))
* **@formatjs/intl-unified-numberformat:** more work on stage-3 APIs ([2ebf471](https://github.com/formatjs/formatjs/commit/2ebf4716131122ce9f5370c7cf8064a481460c5a))
* **@formatjs/intl-unified-numberformat:** more work on stage-3 APIs ([a727599](https://github.com/formatjs/formatjs/commit/a727599ee0de1b01d15f488d70d5b3f7b3d602a6))
* **@formatjs/intl-utils:** add InternalSlotToken enum ([dab275a](https://github.com/formatjs/formatjs/commit/dab275afe512dfd71d844e94f43f15f012316fba))
* **formatjs-extract-cldr-data:** extract raw numbers ([6fa5f3f](https://github.com/formatjs/formatjs/commit/6fa5f3f68f61ad65f1a3c3b9c54f60da140fd802))

### BREAKING CHANGES

* **@formatjs/intl-unified-numberformat:** Although API remains the same, the CLDR distributed data has changed

# [1.6.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@1.5.0...@formatjs/intl-utils@1.6.0) (2019-12-02)

### Features

* **@formatjs/intl-unified-numberformat:** add currencyDisplay… ([#332](https://github.com/formatjs/formatjs/issues/332)) ([0cf8629](https://github.com/formatjs/formatjs/commit/0cf862992cae62a162d6935797ffd7c0848cf3ea))

# [1.5.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@1.4.4...@formatjs/intl-utils@1.5.0) (2019-12-01)

### Features

* **@formatjs/intl-utils:** add PartitionPattern abstract operation ([#317](https://github.com/formatjs/formatjs/issues/317)) ([5731fcf](https://github.com/formatjs/formatjs/commit/5731fcfeaaba65322f904e863faead8d1f177a98))

## [1.4.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@1.4.3...@formatjs/intl-utils@1.4.4) (2019-11-26)

**Note:** Version bump only for package @formatjs/intl-utils

## [1.4.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@1.4.2...@formatjs/intl-utils@1.4.3) (2019-11-25)

### Bug Fixes

* **@formatjs/intl-unified-numberformat:** fix crash in numberformat ([e3115e2](https://github.com/formatjs/formatjs/commit/e3115e2462cb282edc98d4dbe71ffbf7eb3da5c8)), closes [#293](https://github.com/formatjs/formatjs/issues/293)

## [1.4.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@1.4.1...@formatjs/intl-utils@1.4.2) (2019-11-21)

### Bug Fixes

* **@formatjs/intl-relativetimeformat:** use api-extractor to combine d.ts ([bd803dd](https://github.com/formatjs/formatjs/commit/bd803dd5fcd6f13994e686b8d08bd1b8be6a2e4b))
* **@formatjs/intl-utils:** use api-extractor to combine d.ts ([a4b16b5](https://github.com/formatjs/formatjs/commit/a4b16b54f7cee23673701d285fffc6401536e926))

## [1.4.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@1.4.0...@formatjs/intl-utils@1.4.1) (2019-11-20)

### Bug Fixes

* **lint:** fix lint config and rerun ([041eb99](https://github.com/formatjs/formatjs/commit/041eb99706164048b5b8ce7079955897ce27ed70))

# [1.4.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@1.3.0...@formatjs/intl-utils@1.4.0) (2019-10-01)

### Features

* **@formatjs/intl-utils:** add IE11-safe getCanonicalLocales, ([b5f37c4](https://github.com/formatjs/formatjs/commit/b5f37c4)), closes [#200](https://github.com/formatjs/formatjs/issues/200)

# [1.3.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@1.2.0...@formatjs/intl-utils@1.3.0) (2019-09-27)

### Features

* **@formatjs/intl-listformat:** add Intl.ListFormat polyfill ([6e5d476](https://github.com/formatjs/formatjs/commit/6e5d476))
* **@formatjs/intl-utils:** add list-format types ([066d95b](https://github.com/formatjs/formatjs/commit/066d95b))

# [1.2.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@1.1.1...@formatjs/intl-utils@1.2.0) (2019-09-20)

### Features

* **@formatjs/intl-utils:** mark the package as side-effects free ([d442765](https://github.com/formatjs/formatjs/commit/d442765))

## [1.1.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@1.1.0...@formatjs/intl-utils@1.1.1) (2019-09-15)

**Note:** Version bump only for package @formatjs/intl-utils

# [1.1.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@1.0.1...@formatjs/intl-utils@1.1.0) (2019-09-13)

### Bug Fixes

* **@formatjs/intl-utils:** consolidate parent lookup ([bac2eae](https://github.com/formatjs/formatjs/commit/bac2eae))
* **@formatjs/intl-utils:** fix lookup case sensitivity ([52fb192](https://github.com/formatjs/formatjs/commit/52fb192))

### Features

* **@formatjs/intl-utils:** add parent locale lookup ([db94095](https://github.com/formatjs/formatjs/commit/db94095))
* **formatjs-extract-cldr-data:** even smaller locale data ([66a0313](https://github.com/formatjs/formatjs/commit/66a0313))

## [1.0.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@1.0.0...@formatjs/intl-utils@1.0.1) (2019-09-03)

**Note:** Version bump only for package @formatjs/intl-utils

# [1.0.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.7.0...@formatjs/intl-utils@1.0.0) (2019-09-03)

### Bug Fixes

* **@formatjs/intl-utils:** add polyfill-utils like getOption/toObject ([7cf1cc4](https://github.com/formatjs/formatjs/commit/7cf1cc4))

### Features

* **@formatjs/intl-relativetimeformat:** use aliases from @formatjs/intl-utils ([e430944](https://github.com/formatjs/formatjs/commit/e430944))
* **@formatjs/intl-utils:** add lang aliases to locale lookup ([5e74792](https://github.com/formatjs/formatjs/commit/5e74792))

### BREAKING CHANGES

* **@formatjs/intl-relativetimeformat:** Language aliases are now built in so there is no need
to explicitly include it. This provides correctness across our polyfills

# [0.7.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.6.1...@formatjs/intl-utils@0.7.0) (2019-08-29)

### Features

* **@formatjs/intl-utils:** modify diff calculation ([224ac73](https://github.com/formatjs/formatjs/commit/224ac73))

## [0.6.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.6.0...@formatjs/intl-utils@0.6.1) (2019-08-21)

### Bug Fixes

* **intl-utils:** upgrade date-fns to v2 ([3758c52](https://github.com/formatjs/formatjs/commit/3758c52))

# [0.6.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.5.7...@formatjs/intl-utils@0.6.0) (2019-08-19)

### Bug Fixes

* **@formatjs/intl-utils:** change default quarter to false in selectUnit ([dadab10](https://github.com/formatjs/formatjs/commit/dadab10))
* **@formatjs/intl-utils:** rm dependency on @formatjs/intl-relativetimeformat ([1cd6e93](https://github.com/formatjs/formatjs/commit/1cd6e93))

### Features

* **@formatjs/intl-untils:** add locale-lookup ([5886f16](https://github.com/formatjs/formatjs/commit/5886f16))
* **formatjs-extract-cldr-data:** fix unit extraction ([7e54a0b](https://github.com/formatjs/formatjs/commit/7e54a0b))

## [0.5.7](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.5.6...@formatjs/intl-utils@0.5.7) (2019-08-16)

**Note:** Version bump only for package @formatjs/intl-utils

## [0.5.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.5.5...@formatjs/intl-utils@0.5.6) (2019-08-16)

**Note:** Version bump only for package @formatjs/intl-utils

## [0.5.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.5.4...@formatjs/intl-utils@0.5.5) (2019-08-12)

**Note:** Version bump only for package @formatjs/intl-utils

## [0.5.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.5.3...@formatjs/intl-utils@0.5.4) (2019-08-11)

### Bug Fixes

* generate lib instead of mjs ([05e63b3](https://github.com/formatjs/formatjs/commit/05e63b3))

## [0.5.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.5.2...@formatjs/intl-utils@0.5.3) (2019-08-10)

**Note:** Version bump only for package @formatjs/intl-utils

## [0.5.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.5.1...@formatjs/intl-utils@0.5.2) (2019-08-09)

**Note:** Version bump only for package @formatjs/intl-utils

## [0.5.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.5.0...@formatjs/intl-utils@0.5.1) (2019-08-06)

### Bug Fixes

* generate .mjs instead of lib ([0c34ee4](https://github.com/formatjs/formatjs/commit/0c34ee4))

# [0.5.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.4.4...@formatjs/intl-utils@0.5.0) (2019-08-02)

### Features

* **@formatjs/intl-utils:** allow passing in partial thresholds to selectUnit ([6b5e556](https://github.com/formatjs/formatjs/commit/6b5e556))
* **@formatjs/intl-utils:** support intl-utils toggle quarter selection ([#138](https://github.com/formatjs/formatjs/issues/138)) ([cdf3ffe](https://github.com/formatjs/formatjs/commit/cdf3ffe))

## [0.4.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.4.3...@formatjs/intl-utils@0.4.4) (2019-07-29)

**Note:** Version bump only for package @formatjs/intl-utils

## [0.4.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.4.2...@formatjs/intl-utils@0.4.3) (2019-07-25)

**Note:** Version bump only for package @formatjs/intl-utils

## [0.4.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.4.1...@formatjs/intl-utils@0.4.2) (2019-07-23)

**Note:** Version bump only for package @formatjs/intl-utils

## [0.4.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.4.0...@formatjs/intl-utils@0.4.1) (2019-07-12)

**Note:** Version bump only for package @formatjs/intl-utils

# [0.4.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.3.4...@formatjs/intl-utils@0.4.0) (2019-07-12)

### Features

- **intl-messageformat-parser:** add printer to print AST to string ([ec0eaa2](https://github.com/formatjs/formatjs/commit/ec0eaa2))

## [0.3.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.3.3...@formatjs/intl-utils@0.3.4) (2019-07-09)

**Note:** Version bump only for package @formatjs/intl-utils

## [0.3.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.3.2...@formatjs/intl-utils@0.3.3) (2019-07-08)

**Note:** Version bump only for package @formatjs/intl-utils

## [0.3.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.3.1...@formatjs/intl-utils@0.3.2) (2019-06-28)

**Note:** Version bump only for package @formatjs/intl-utils

## [0.3.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.3.0...@formatjs/intl-utils@0.3.1) (2019-07-02)

**Note:** Version bump only for package @formatjs/intl-utils

# [0.3.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.2.1...@formatjs/intl-utils@0.3.0) (2019-06-27)

### Features

- **intl-messageformat:** allow passing in formatters ([#107](https://github.com/formatjs/formatjs/issues/107)) ([3605693](https://github.com/formatjs/formatjs/commit/3605693))

## [0.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-utils@0.2.0...@formatjs/intl-utils@0.2.1) (2019-06-26)

**Note:** Version bump only for package @formatjs/intl-utils

# 0.2.0 (2019-06-27)

### Features

- **intl-utils:** Add intl-utils ([#98](https://github.com/formatjs/formatjs/issues/98)) ([2329c57](https://github.com/formatjs/formatjs/commit/2329c57))

# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.0.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@3.0.0...@formatjs/intl@3.0.1) (2024-11-18)

### Bug Fixes

* **@formatjs/cli:** remove @formatjs/ecma402-abstract, use native TS Intl typdefs ([3fed5f4](https://github.com/formatjs/formatjs/commit/3fed5f4e8ba7302a0cefbcdf0bf602007fbff614)) - by @longlho

# [3.0.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.10.15...@formatjs/intl@3.0.0) (2024-11-18)

### Features

* **@formatjs/intl:** drop typescript@4 support ([98d8910](https://github.com/formatjs/formatjs/commit/98d891091dc58c0695701fb1aca62fb8e51bf4ad)) - by @longlho
* **@formatjs/intl:** remove polyfill packages in deps ([4713e1b](https://github.com/formatjs/formatjs/commit/4713e1b240a52f7e357dcc77912c33e8bef9bfa4)) - by @longlho

### BREAKING CHANGES

* **@formatjs/intl:** This removes @formatjs/intl-displaynames & @formatjs/intl-listformat as
deps which will reduce package size. However, this also means you'll
need typescript@5 at least since that has new type defs for those native
Intl APIs.

## [2.10.15](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.10.14...@formatjs/intl@2.10.15) (2024-11-18)

**Note:** Version bump only for package @formatjs/intl

## [2.10.14](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.10.13...@formatjs/intl@2.10.14) (2024-11-05)

**Note:** Version bump only for package @formatjs/intl

## [2.10.13](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.10.12...@formatjs/intl@2.10.13) (2024-11-04)

**Note:** Version bump only for package @formatjs/intl

## [2.10.12](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.10.11...@formatjs/intl@2.10.12) (2024-11-02)

**Note:** Version bump only for package @formatjs/intl

## [2.10.11](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.10.10...@formatjs/intl@2.10.11) (2024-10-25)

### Bug Fixes

* relax tslib req to 2 instead of 2.7 ([930c3e8](https://github.com/formatjs/formatjs/commit/930c3e8ddcc160fde7466449575455f135f78ca6)) - by @longlho

## [2.10.10](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.10.9...@formatjs/intl@2.10.10) (2024-10-25)

**Note:** Version bump only for package @formatjs/intl

## [2.10.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.10.8...@formatjs/intl@2.10.9) (2024-10-21)

**Note:** Version bump only for package @formatjs/intl

## [2.10.8](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.10.6...@formatjs/intl@2.10.8) (2024-10-12)

**Note:** Version bump only for package @formatjs/intl

## [2.10.7](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.10.6...@formatjs/intl@2.10.7) (2024-10-09)

**Note:** Version bump only for package @formatjs/intl

## [2.10.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.10.5...@formatjs/intl@2.10.6) (2024-10-08)

**Note:** Version bump only for package @formatjs/intl

## [2.10.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.10.4...@formatjs/intl@2.10.5) (2024-09-23)

### Bug Fixes

* **@formatjs/intl:** add this: void to IntlShape method, fix [#4133](https://github.com/formatjs/formatjs/issues/4133) ([a9ba729](https://github.com/formatjs/formatjs/commit/a9ba729089943629a84220c9d9f7b12f6410ad2a)) - by @longlho
* **@formatjs/intl:** improve type inference of formatMessage ([20fed58](https://github.com/formatjs/formatjs/commit/20fed58c28da697816aca5eabac32d14386cebf7)) - by @ianduvall

## [2.10.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.10.3...@formatjs/intl@2.10.4) (2024-05-19)

**Note:** Version bump only for package @formatjs/intl

## [2.10.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.10.2...@formatjs/intl@2.10.3) (2024-05-18)

**Note:** Version bump only for package @formatjs/intl

## [2.10.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.10.1...@formatjs/intl@2.10.2) (2024-05-05)

**Note:** Version bump only for package @formatjs/intl

## [2.10.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.10.0...@formatjs/intl@2.10.1) (2024-03-24)

**Note:** Version bump only for package @formatjs/intl

# [2.10.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.9.11...@formatjs/intl@2.10.0) (2024-01-26)

### Features

* **@formatjs/intl:** allow ES2023 attributes in number component ([9adc475](https://github.com/formatjs/formatjs/commit/9adc475729dd2b30053b75ba52be33c9ca0f5cd7)), closes [#3458](https://github.com/formatjs/formatjs/issues/3458) - by @longlho

## [2.9.11](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.9.10...@formatjs/intl@2.9.11) (2024-01-16)

**Note:** Version bump only for package @formatjs/intl

## [2.9.10](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.9.9...@formatjs/intl@2.9.10) (2024-01-16)

**Note:** Version bump only for package @formatjs/intl

## [2.9.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.9.8...@formatjs/intl@2.9.9) (2023-11-14)

### Bug Fixes

* **@formatjs/intl-durationformat:** add polyfill detector + docs ([d6d237a](https://github.com/formatjs/formatjs/commit/d6d237a2ffca73d5e3824df17bf5ebf7e7b135a8)) - by @

## [2.9.8](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.9.7...@formatjs/intl@2.9.8) (2023-11-12)

**Note:** Version bump only for package @formatjs/intl

## [2.9.7](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.9.6...@formatjs/intl@2.9.7) (2023-11-12)

**Note:** Version bump only for package @formatjs/intl

## [2.9.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.9.5...@formatjs/intl@2.9.6) (2023-11-06)

**Note:** Version bump only for package @formatjs/intl

## [2.9.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.9.4...@formatjs/intl@2.9.5) (2023-10-23)

**Note:** Version bump only for package @formatjs/intl

## [2.9.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.9.3...@formatjs/intl@2.9.4) (2023-10-16)

**Note:** Version bump only for package @formatjs/intl

## [2.9.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.9.2...@formatjs/intl@2.9.3) (2023-09-18)

**Note:** Version bump only for package @formatjs/intl

## [2.9.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.9.1...@formatjs/intl@2.9.2) (2023-09-10)

**Note:** Version bump only for package @formatjs/intl

## [2.9.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.9.0...@formatjs/intl@2.9.1) (2023-09-07)

**Note:** Version bump only for package @formatjs/intl

# [2.9.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.8.0...@formatjs/intl@2.9.0) (2023-06-12)

### Features

* **@formatjs/intl,@formatjs/fast-memoize,@formatjs/icu-messageformat-parser,@formatjs/intl-displaynames,@formatjs/intl-listformat,intl-messageformat,@formatjs/ecma402-abstract,@formatjs/intl-numberformat,@formatjs/icu-skeleton-parser:** Revert esm conditional exports ([#4129](https://github.com/formatjs/formatjs/issues/4129)) ([78edf46](https://github.com/formatjs/formatjs/commit/78edf460a466a7021e3753be53fd9c6af00f2d96)), closes [#4128](https://github.com/formatjs/formatjs/issues/4128) [#4127](https://github.com/formatjs/formatjs/issues/4127) [#4126](https://github.com/formatjs/formatjs/issues/4126)

# [2.8.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.7.2...@formatjs/intl@2.8.0) (2023-06-06)

### Features

* **@formatjs/intl,@formatjs/fast-memoize,@formatjs/icu-messageformat-parser,@formatjs/intl-displaynames,@formatjs/intl-listformat,intl-messageformat,@formatjs/ecma402-abstract,@formatjs/intl-numberformat,@formatjs/icu-skeleton-parser:** esm conditional exports ([#4109](https://github.com/formatjs/formatjs/issues/4109)) ([e0d593c](https://github.com/formatjs/formatjs/commit/e0d593cc3af3a317a6bd20c441191e5bbb136a93)), closes [#4013](https://github.com/formatjs/formatjs/issues/4013)

## [2.7.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.7.1...@formatjs/intl@2.7.2) (2023-05-01)

**Note:** Version bump only for package @formatjs/intl

## [2.7.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.7.0...@formatjs/intl@2.7.1) (2023-04-19)

**Note:** Version bump only for package @formatjs/intl

# [2.7.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.6.9...@formatjs/intl@2.7.0) (2023-04-17)

### Features

* **@formatjs/intl:** store locale as error property ([3d03554](https://github.com/formatjs/formatjs/commit/3d035547db9d47adbbd51bff4330a58c0ca0668e))
* upgrade TS support to v5 ([2c43dc1](https://github.com/formatjs/formatjs/commit/2c43dc1275d7ca940fae80419e3d6e4143bfbfef))

## [2.6.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.6.8...@formatjs/intl@2.6.9) (2023-03-21)

**Note:** Version bump only for package @formatjs/intl

## [2.6.7](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.6.6...@formatjs/intl@2.6.7) (2023-02-20)

**Note:** Version bump only for package @formatjs/intl

## [2.6.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.6.5...@formatjs/intl@2.6.6) (2023-02-20)

**Note:** Version bump only for package @formatjs/intl

## [2.6.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.6.4...@formatjs/intl@2.6.5) (2023-01-30)

**Note:** Version bump only for package @formatjs/intl

## [2.6.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.6.3...@formatjs/intl@2.6.4) (2023-01-26)

**Note:** Version bump only for package @formatjs/intl

## [2.6.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.6.2...@formatjs/intl@2.6.3) (2022-12-02)

**Note:** Version bump only for package @formatjs/intl

## [2.6.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.6.0...@formatjs/intl@2.6.2) (2022-12-01)

### Bug Fixes

* **@formatjs/intl:** update monorepo to use TypeScript 4.9 and actually fix the type issue ([#3919](https://github.com/formatjs/formatjs/issues/3919)) ([051527b](https://github.com/formatjs/formatjs/commit/051527b6391c8f4548254ab20630173789d555cd))

## [2.6.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.6.0...@formatjs/intl@2.6.1) (2022-12-01)

### Bug Fixes

* **@formatjs/intl:** update monorepo to use TypeScript 4.9 and actually fix the type issue ([#3919](https://github.com/formatjs/formatjs/issues/3919)) ([051527b](https://github.com/formatjs/formatjs/commit/051527b6391c8f4548254ab20630173789d555cd))

# [2.6.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.5.1...@formatjs/intl@2.6.0) (2022-11-29)

### Bug Fixes

* **@formatjs/intl:** fix type checker errors with TypeScript 4.9 ([#3916](https://github.com/formatjs/formatjs/issues/3916)) ([36d0437](https://github.com/formatjs/formatjs/commit/36d04373cb6c3a768265792fe808bbe036bb0804)), closes [#3912](https://github.com/formatjs/formatjs/issues/3912) [#3905](https://github.com/formatjs/formatjs/issues/3905) [#3910](https://github.com/formatjs/formatjs/issues/3910)

### Features

* **@formatjs/intl-displaynames:** Intl DisplayNames API V2 (Stage 3) implementation ([#3890](https://github.com/formatjs/formatjs/issues/3890)) ([e39a89e](https://github.com/formatjs/formatjs/commit/e39a89ecee56a0c234e661e3860b61aa3a34f65e))

## [2.5.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.5.0...@formatjs/intl@2.5.1) (2022-10-17)

**Note:** Version bump only for package @formatjs/intl

# [2.5.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.4.2...@formatjs/intl@2.5.0) (2022-10-13)

### Features

* **@formatjs/intl,react-intl:** move IntlFormatter type parameters to methods ([#3858](https://github.com/formatjs/formatjs/issues/3858)) ([0d03bb6](https://github.com/formatjs/formatjs/commit/0d03bb66123cb49fbd1c7d27908979bc4521b41f))

## [2.4.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.4.1...@formatjs/intl@2.4.2) (2022-09-28)

**Note:** Version bump only for package @formatjs/intl

## [2.4.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.4.0...@formatjs/intl@2.4.1) (2022-09-06)

### Bug Fixes

* **@formatjs/intl:** fix empty array handling in formatList, fix [#3784](https://github.com/formatjs/formatjs/issues/3784) ([5585e0e](https://github.com/formatjs/formatjs/commit/5585e0e758da1ef18f8ebab5bfa7920ce27b2403))

# [2.4.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.3.4...@formatjs/intl@2.4.0) (2022-08-27)

### Features

* **@formatjs/ts-transformer:** support TypeScript 4.7 syntax ([#3764](https://github.com/formatjs/formatjs/issues/3764)) ([1b3388e](https://github.com/formatjs/formatjs/commit/1b3388e9344de3a948068f5cf449341c1eb597a8))

## [2.3.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.3.3...@formatjs/intl@2.3.4) (2022-08-21)

**Note:** Version bump only for package @formatjs/intl

## [2.3.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.3.2...@formatjs/intl@2.3.3) (2022-08-21)

**Note:** Version bump only for package @formatjs/intl

## [2.3.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.3.1...@formatjs/intl@2.3.2) (2022-08-18)

**Note:** Version bump only for package @formatjs/intl

## [2.3.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.3.0...@formatjs/intl@2.3.1) (2022-07-04)

**Note:** Version bump only for package @formatjs/intl

# [2.3.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.2.5...@formatjs/intl@2.3.0) (2022-06-06)

### Features

* **@formatjs/intl:** allow module augmentation for custom formatters ([#3634](https://github.com/formatjs/formatjs/issues/3634)) ([49b2588](https://github.com/formatjs/formatjs/commit/49b2588e1efe135debed9935cb217d2cb5937f07))

## [2.2.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.2.4...@formatjs/intl@2.2.5) (2022-05-24)

### Bug Fixes

* **@formatjs/intl:** add fractionalSecondDigits to list of options, fix [#3594](https://github.com/formatjs/formatjs/issues/3594) ([a2b7bc6](https://github.com/formatjs/formatjs/commit/a2b7bc6ea8426ee1ea76066fd5da6df8ebe7c153))

## [2.2.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.2.3...@formatjs/intl@2.2.4) (2022-05-23)

### Bug Fixes

* **@formatjs/intl:** fix Exclude usage, use Omit instead, fix [#3548](https://github.com/formatjs/formatjs/issues/3548) ([493b9eb](https://github.com/formatjs/formatjs/commit/493b9eb786d933145fbb66a1d9d62e1f35c14c72))

## [2.2.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.2.2...@formatjs/intl@2.2.3) (2022-05-19)

**Note:** Version bump only for package @formatjs/intl

## [2.2.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.2.1...@formatjs/intl@2.2.2) (2022-05-19)

### Bug Fixes

* add actual default message to Missing translation ([#3574](https://github.com/formatjs/formatjs/issues/3574)) ([adb9844](https://github.com/formatjs/formatjs/commit/adb98449b66ccce4c4356f5abf23781be19955d9)), closes [#3573](https://github.com/formatjs/formatjs/issues/3573)
* **react-intl:** fix type issue with react18, fix [#3550](https://github.com/formatjs/formatjs/issues/3550) ([2567b93](https://github.com/formatjs/formatjs/commit/2567b932c5d18b097a43842563046c20ce0c49f1))

## [2.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.2.0...@formatjs/intl@2.2.1) (2022-04-27)

**Note:** Version bump only for package @formatjs/intl

# [2.2.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.1.1...@formatjs/intl@2.2.0) (2022-04-17)

### Features

* **react-intl:** add onWarn ([#3506](https://github.com/formatjs/formatjs/issues/3506)) ([09273e3](https://github.com/formatjs/formatjs/commit/09273e3b183252bee0dbcbcb3066bb77d79c4de1))

## [2.1.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.1.0...@formatjs/intl@2.1.1) (2022-03-26)

**Note:** Version bump only for package @formatjs/intl

# [2.1.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@2.0.0...@formatjs/intl@2.1.0) (2022-03-13)

### Features

* **@formatjs/intl:** add $t as an shorter hand alias for formatMessagge ([a0ab2d4](https://github.com/formatjs/formatjs/commit/a0ab2d431b0bb714fd9173b7492190fa006c88be))

# [2.0.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.18.5...@formatjs/intl@2.0.0) (2022-02-06)

### Features

* **eslint-plugin-formatjs:** rename `blacklist` to `blocklist`, fix [#3399](https://github.com/formatjs/formatjs/issues/3399) ([d363881](https://github.com/formatjs/formatjs/commit/d363881c87e6d792c4e933cd0167d1b3faa0897a))

### BREAKING CHANGES

* **eslint-plugin-formatjs:** This changes the rule name from `blacklist-elements` to `blocklist-elements`

## [1.18.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.18.4...@formatjs/intl@1.18.5) (2022-02-06)

**Note:** Version bump only for package @formatjs/intl

## [1.18.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.18.3...@formatjs/intl@1.18.4) (2022-01-24)

**Note:** Version bump only for package @formatjs/intl

## [1.18.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.18.2...@formatjs/intl@1.18.3) (2022-01-14)

**Note:** Version bump only for package @formatjs/intl

## [1.18.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.18.1...@formatjs/intl@1.18.2) (2022-01-09)

**Note:** Version bump only for package @formatjs/intl

## [1.18.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.18.0...@formatjs/intl@1.18.1) (2022-01-03)

**Note:** Version bump only for package @formatjs/intl

# [1.18.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.17.0...@formatjs/intl@1.18.0) (2021-12-20)

### Features

* **react-intl:** Allow setting a stricter type for locale ([#3284](https://github.com/formatjs/formatjs/issues/3284)) ([c4693d4](https://github.com/formatjs/formatjs/commit/c4693d4c69d3e3036544524720b5a077f3b17786))

# [1.17.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.16.0...@formatjs/intl@1.17.0) (2021-12-01)

### Features

* support TS 4.5, fix [#3276](https://github.com/formatjs/formatjs/issues/3276) ([31e0699](https://github.com/formatjs/formatjs/commit/31e069972aa16e14532531b9e597cff73a3f4897))

# [1.16.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.15.2...@formatjs/intl@1.16.0) (2021-11-23)

### Features

* **react-intl:** allow setting a stricter type for message IDs ([#3242](https://github.com/formatjs/formatjs/issues/3242)) ([b7cac44](https://github.com/formatjs/formatjs/commit/b7cac443a2ecf791004138699959d46ddc3d4808))

## [1.15.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.15.1...@formatjs/intl@1.15.2) (2021-11-14)

**Note:** Version bump only for package @formatjs/intl

## [1.15.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.15.0...@formatjs/intl@1.15.1) (2021-11-09)

**Note:** Version bump only for package @formatjs/intl

# [1.15.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.14.3...@formatjs/intl@1.15.0) (2021-10-22)

### Features

* **@formatjs/intl:** add fallbackOnEmptyString option ([#3201](https://github.com/formatjs/formatjs/issues/3201)) ([5c67c28](https://github.com/formatjs/formatjs/commit/5c67c28b60aa361e076bb098a6d081c3f8a1fbd2))
* **@formatjs/intl:** upgrade to TS 4.4 ([8037bb2](https://github.com/formatjs/formatjs/commit/8037bb2e8c437d7033a3e0761606d54b916e9ff2))

## [1.14.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.14.2...@formatjs/intl@1.14.3) (2021-10-17)

**Note:** Version bump only for package @formatjs/intl

## [1.14.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.14.1...@formatjs/intl@1.14.2) (2021-09-27)

### Bug Fixes

* **@formatjs/intl:** rm dep on @types/node ([245301f](https://github.com/formatjs/formatjs/commit/245301f72c77e487f1a3a9dcf6d88f459e4fa92f))

## [1.14.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.14.0...@formatjs/intl@1.14.1) (2021-08-21)

### Bug Fixes

* **@formatjs/intl:** fix missing deps, fix [#3122](https://github.com/formatjs/formatjs/issues/3122) ([117fc7d](https://github.com/formatjs/formatjs/commit/117fc7d3e69ac0f1c77b47b530601607f80b66f8))

# [1.14.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.13.5...@formatjs/intl@1.14.0) (2021-08-15)

### Features

* **@formatjs/fast-memoize:** remove unused Cache.has ([#3102](https://github.com/formatjs/formatjs/issues/3102)) ([5e9a425](https://github.com/formatjs/formatjs/commit/5e9a425519fd2b2473172687fccb58a6979ec81e))

## [1.13.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.13.4...@formatjs/intl@1.13.5) (2021-08-06)

**Note:** Version bump only for package @formatjs/intl

## [1.13.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.13.3...@formatjs/intl@1.13.4) (2021-07-24)

**Note:** Version bump only for package @formatjs/intl

## [1.13.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.13.2...@formatjs/intl@1.13.3) (2021-07-23)

**Note:** Version bump only for package @formatjs/intl

## [1.13.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.13.1...@formatjs/intl@1.13.2) (2021-06-26)

**Note:** Version bump only for package @formatjs/intl

## [1.13.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.13.0...@formatjs/intl@1.13.1) (2021-06-21)

**Note:** Version bump only for package @formatjs/intl

# [1.13.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.12.1...@formatjs/intl@1.13.0) (2021-06-09)

### Features

* **@formatjs/intl:** add numberingSystem to NUMBER_FORMAT_OPTIONS ([#2953](https://github.com/formatjs/formatjs/issues/2953)) ([508c45d](https://github.com/formatjs/formatjs/commit/508c45d7631d701509c76ffb3da1cb901f77d808)), closes [#2952](https://github.com/formatjs/formatjs/issues/2952)

## [1.12.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.12.0...@formatjs/intl@1.12.1) (2021-06-05)

**Note:** Version bump only for package @formatjs/intl

# [1.12.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.11.3...@formatjs/intl@1.12.0) (2021-06-05)

### Features

* **@formatjs/intl:** allow formatList & FormattedList to take in readonly array ([#2950](https://github.com/formatjs/formatjs/issues/2950)) ([1d7896c](https://github.com/formatjs/formatjs/commit/1d7896c6d2aff31e215fae07f16e7509484a8ba6))

## [1.11.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.11.2...@formatjs/intl@1.11.3) (2021-06-04)

**Note:** Version bump only for package @formatjs/intl

## [1.11.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.11.1...@formatjs/intl@1.11.2) (2021-06-01)

**Note:** Version bump only for package @formatjs/intl

## [1.11.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.11.0...@formatjs/intl@1.11.1) (2021-05-23)

**Note:** Version bump only for package @formatjs/intl

# [1.11.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.10.8...@formatjs/intl@1.11.0) (2021-05-20)

### Features

* **@formatjs/intl:** add intl.formatListToParts, fix [#2901](https://github.com/formatjs/formatjs/issues/2901) ([eb40bd3](https://github.com/formatjs/formatjs/commit/eb40bd3e9c2e788c4e13e3ea94bcdd786b99c095))

## [1.10.8](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.10.7...@formatjs/intl@1.10.8) (2021-05-17)

**Note:** Version bump only for package @formatjs/intl

## [1.10.7](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.10.6...@formatjs/intl@1.10.7) (2021-05-14)

**Note:** Version bump only for package @formatjs/intl

## [1.10.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.10.5...@formatjs/intl@1.10.6) (2021-05-10)

**Note:** Version bump only for package @formatjs/intl

## [1.10.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.10.4...@formatjs/intl@1.10.5) (2021-05-02)

**Note:** Version bump only for package @formatjs/intl

## [1.10.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.10.3...@formatjs/intl@1.10.4) (2021-05-02)

**Note:** Version bump only for package @formatjs/intl

## [1.10.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.10.2...@formatjs/intl@1.10.3) (2021-04-26)

**Note:** Version bump only for package @formatjs/intl

## [1.10.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.10.1...@formatjs/intl@1.10.2) (2021-04-26)

**Note:** Version bump only for package @formatjs/intl

## [1.10.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.10.0...@formatjs/intl@1.10.1) (2021-04-26)

### Bug Fixes

* **@formatjs/intl:** fix fast-memoize import ([2738741](https://github.com/formatjs/formatjs/commit/2738741fb9b0d442fe2f1ad0b335c2436d8bc579))
* **@formatjs/intl:** use fast-memoize esm fork ([d1a4509](https://github.com/formatjs/formatjs/commit/d1a45094a130107e019ce12e5038baf2febf397f))

# [1.10.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.9.8...@formatjs/intl@1.10.0) (2021-04-21)

### Bug Fixes

* **@formatjs/intl:** make IntlShape generic default to string, fix [#2821](https://github.com/formatjs/formatjs/issues/2821) ([08d48f2](https://github.com/formatjs/formatjs/commit/08d48f297529ef276f8991bc40c8e864dbd18c5b))

### Features

* **@formatjs/intl:** rename OptionalIntlConfig to IntlConfig and IntlConfig to ResolvedIntlConfig ([4a3dd6e](https://github.com/formatjs/formatjs/commit/4a3dd6ef7457b8de1ffea0b61624b91250c717d5))

## [1.9.8](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.9.7...@formatjs/intl@1.9.8) (2021-04-12)

**Note:** Version bump only for package @formatjs/intl

## [1.9.7](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.9.6...@formatjs/intl@1.9.7) (2021-04-04)

**Note:** Version bump only for package @formatjs/intl

## [1.9.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.9.5...@formatjs/intl@1.9.6) (2021-04-03)

**Note:** Version bump only for package @formatjs/intl

## [1.9.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.9.4...@formatjs/intl@1.9.5) (2021-03-30)

### Bug Fixes

* **@formatjs/intl:** add more details to missing ID message ([506779b](https://github.com/formatjs/formatjs/commit/506779b951264d330aca7d20a470c14662b0887f)), closes [#1059](https://github.com/formatjs/formatjs/issues/1059)

## [1.9.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.9.3...@formatjs/intl@1.9.4) (2021-03-30)

**Note:** Version bump only for package @formatjs/intl

## [1.9.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.9.2...@formatjs/intl@1.9.3) (2021-03-28)

**Note:** Version bump only for package @formatjs/intl

## [1.9.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.9.1...@formatjs/intl@1.9.2) (2021-03-28)

**Note:** Version bump only for package @formatjs/intl

## [1.9.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.9.0...@formatjs/intl@1.9.1) (2021-03-27)

### Bug Fixes

* **@formatjs/intl:** fix missing dep ([34a86ba](https://github.com/formatjs/formatjs/commit/34a86baa9913408fd0e549bbf720bb9161d637c6))

# [1.9.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.8.5...@formatjs/intl@1.9.0) (2021-03-27)

### Features

* **@formatjs/intl:** switch parser to @formatjs/icu-messageformat-parser (6x faster) ([4362bc5](https://github.com/formatjs/formatjs/commit/4362bc5582876f37fdaffe97bc9d8fbb73d83c7a))

## [1.8.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.8.4...@formatjs/intl@1.8.5) (2021-03-26)

**Note:** Version bump only for package @formatjs/intl

## [1.8.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.8.3...@formatjs/intl@1.8.4) (2021-03-17)

### Bug Fixes

* **@formatjs/intl:** trim down dependencies thanks to TS4.2 ([31b7809](https://github.com/formatjs/formatjs/commit/31b7809e5359a3fc7fb76e9655dadbc5c9c23384))

## [1.8.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.8.2...@formatjs/intl@1.8.3) (2021-03-15)

**Note:** Version bump only for package @formatjs/intl

## [1.8.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.8.1...@formatjs/intl@1.8.2) (2021-03-01)

**Note:** Version bump only for package @formatjs/intl

## [1.8.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.8.0...@formatjs/intl@1.8.1) (2021-02-25)

### Bug Fixes

* bump tslib version dep ([37577d2](https://github.com/formatjs/formatjs/commit/37577d22bf28d23de1d8013ba0047cf221ad8840)), closes [#2645](https://github.com/formatjs/formatjs/issues/2645)

# [1.8.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.7.1...@formatjs/intl@1.8.0) (2021-02-25)

### Features

* **@formatjs/intl:** support TS4.2 ([ba56b9a](https://github.com/formatjs/formatjs/commit/ba56b9a14de58ea17e19ab6033bcb5f8c9c03bae))

## [1.7.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.7.0...@formatjs/intl@1.7.1) (2021-02-22)

**Note:** Version bump only for package @formatjs/intl

# [1.7.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.6.8...@formatjs/intl@1.7.0) (2021-02-21)

### Bug Fixes

* **@formatjs/intl:** fix warning logic for AST, fix [#2610](https://github.com/formatjs/formatjs/issues/2610) ([04086bf](https://github.com/formatjs/formatjs/commit/04086bf939de06b0feff15d9bb54b2ae9aa3bc36))

### Features

* **@formatjs/intl:** rm __addMessages private method ([4337cc5](https://github.com/formatjs/formatjs/commit/4337cc5c5169793dbc22c8a4d9f17bee1527490c))

## [1.6.8](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.6.7...@formatjs/intl@1.6.8) (2021-02-13)

### Bug Fixes

* **@formatjs/intl:** support isolatedModules ([#2602](https://github.com/formatjs/formatjs/issues/2602)) ([b7284f4](https://github.com/formatjs/formatjs/commit/b7284f428db26e2345775f3dc652d1119ef91670))

## [1.6.7](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.6.6...@formatjs/intl@1.6.7) (2021-02-09)

### Bug Fixes

* **@formatjs/intl:** fix __addMessages issues with references ([f9266f9](https://github.com/formatjs/formatjs/commit/f9266f9af9f092377f6be975d938ec0b55b851d7))

## [1.6.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.6.4...@formatjs/intl@1.6.6) (2021-02-02)

**Note:** Version bump only for package @formatjs/intl

## [1.6.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.6.4...@formatjs/intl@1.6.5) (2021-01-29)

**Note:** Version bump only for package @formatjs/intl

## [1.6.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.6.3...@formatjs/intl@1.6.4) (2021-01-27)

**Note:** Version bump only for package @formatjs/intl

## [1.6.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.6.2...@formatjs/intl@1.6.3) (2021-01-26)

**Note:** Version bump only for package @formatjs/intl

## [1.6.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.6.1...@formatjs/intl@1.6.2) (2021-01-25)

**Note:** Version bump only for package @formatjs/intl

## [1.6.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.6.0...@formatjs/intl@1.6.1) (2021-01-13)

### Bug Fixes

* **@formatjs/intl:** pass opts to getMessageFormat as well ([7f4fa56](https://github.com/formatjs/formatjs/commit/7f4fa564c22ceae5b735e01a5d78b72106128850))

# [1.6.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.5.1...@formatjs/intl@1.6.0) (2021-01-12)

### Features

* **@formatjs/intl:** add private method __addMessages to add extra messages ([82471d1](https://github.com/formatjs/formatjs/commit/82471d1aaeeecbb96cf6186c9ae66d25a884473d))

## [1.5.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.5.0...@formatjs/intl@1.5.1) (2021-01-08)

**Note:** Version bump only for package @formatjs/intl

# [1.5.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.4.16...@formatjs/intl@1.5.0) (2021-01-06)

### Features

* **@formatjs/intl:** allow options to be pass into intl.formatMessage (e.g ignoreTag) ([a51bd76](https://github.com/formatjs/formatjs/commit/a51bd7636d53fb9d7165245765169ecc6b445af7))

## [1.4.16](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.4.15...@formatjs/intl@1.4.16) (2021-01-05)

**Note:** Version bump only for package @formatjs/intl

## [1.4.15](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.4.14...@formatjs/intl@1.4.15) (2021-01-02)

**Note:** Version bump only for package @formatjs/intl

## [1.4.14](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.4.13...@formatjs/intl@1.4.14) (2021-01-01)

**Note:** Version bump only for package @formatjs/intl

## [1.4.13](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.4.12...@formatjs/intl@1.4.13) (2020-12-18)

**Note:** Version bump only for package @formatjs/intl

## [1.4.12](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.4.11...@formatjs/intl@1.4.12) (2020-12-17)

**Note:** Version bump only for package @formatjs/intl

## [1.4.11](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.4.10...@formatjs/intl@1.4.11) (2020-12-16)

### Bug Fixes

* **@formatjs/intl:** don't set default hour/minute when ([ccd7c90](https://github.com/formatjs/formatjs/commit/ccd7c90cf0456f884b2af1e6655163abdcb6dd77)), closes [#2410](https://github.com/formatjs/formatjs/issues/2410)

## [1.4.10](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.4.9...@formatjs/intl@1.4.10) (2020-11-27)

**Note:** Version bump only for package @formatjs/intl

## [1.4.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.4.8...@formatjs/intl@1.4.9) (2020-11-26)

**Note:** Version bump only for package @formatjs/intl

## [1.4.8](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.4.7...@formatjs/intl@1.4.8) (2020-11-21)

### Bug Fixes

* **@formatjs/intl:** only warn about non-AST messages during initialization, fix [#2258](https://github.com/formatjs/formatjs/issues/2258) ([36e40f4](https://github.com/formatjs/formatjs/commit/36e40f47de0b34424adba686f76dab6e329b40bf))

## [1.4.7](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.4.6...@formatjs/intl@1.4.7) (2020-11-20)

**Note:** Version bump only for package @formatjs/intl

## [1.4.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.4.5...@formatjs/intl@1.4.6) (2020-11-19)

### Bug Fixes

* **@formatjs/intl:** fix type decl for createIntl, fix [#2320](https://github.com/formatjs/formatjs/issues/2320) ([f129d60](https://github.com/formatjs/formatjs/commit/f129d60241d304ae34c12c3c335160c45d4deb5b))

## [1.4.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.4.4...@formatjs/intl@1.4.5) (2020-11-12)

**Note:** Version bump only for package @formatjs/intl

## [1.4.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.4.3...@formatjs/intl@1.4.4) (2020-11-09)

**Note:** Version bump only for package @formatjs/intl

## [1.4.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.4.2...@formatjs/intl@1.4.3) (2020-11-09)

**Note:** Version bump only for package @formatjs/intl

## [1.4.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.4.1...@formatjs/intl@1.4.2) (2020-11-05)

### Bug Fixes

* **@formatjs/intl:** fix default config for formatDateTimeRange ([60087d8](https://github.com/formatjs/formatjs/commit/60087d8df70d70b3c11dd733bb1961d389b0e211))

## [1.4.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.4.0...@formatjs/intl@1.4.1) (2020-11-05)

**Note:** Version bump only for package @formatjs/intl

# [1.4.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.3.9...@formatjs/intl@1.4.0) (2020-11-05)

### Bug Fixes

* **@formatjs/intl:** lock down monorepo dep version ([ecfc07e](https://github.com/formatjs/formatjs/commit/ecfc07e2aa05892ac2d8a4b8fd69c039802cecf0))

### Features

* **@formatjs/intl:** add formatDateTimeRange per stage-3 spec ([b08ee67](https://github.com/formatjs/formatjs/commit/b08ee671dbaa3917cd91a368972d03e3c34cb184))

## [1.3.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.3.8...@formatjs/intl@1.3.9) (2020-11-04)

### Bug Fixes

* **react-intl:** make defaultRichTextElements warning less disruptive ([#2282](https://github.com/formatjs/formatjs/issues/2282)) ([d6cb50a](https://github.com/formatjs/formatjs/commit/d6cb50ac94c029c9386e7342ab877cd26c23c9f6))

## [1.3.8](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.3.7...@formatjs/intl@1.3.8) (2020-10-26)

**Note:** Version bump only for package @formatjs/intl

## [1.3.7](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.3.6...@formatjs/intl@1.3.7) (2020-10-25)

**Note:** Version bump only for package @formatjs/intl

## [1.3.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.3.5...@formatjs/intl@1.3.6) (2020-10-10)

**Note:** Version bump only for package @formatjs/intl

## [1.3.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.3.4...@formatjs/intl@1.3.5) (2020-10-08)

**Note:** Version bump only for package @formatjs/intl

## [1.3.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.3.3...@formatjs/intl@1.3.4) (2020-10-01)

**Note:** Version bump only for package @formatjs/intl

## [1.3.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.3.2...@formatjs/intl@1.3.3) (2020-09-25)

**Note:** Version bump only for package @formatjs/intl

## [1.3.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.3.1...@formatjs/intl@1.3.2) (2020-09-18)

### Bug Fixes

* **@formatjs/intl-displaynames:** follow ES2021 spec and make type option required ([#2103](https://github.com/formatjs/formatjs/issues/2103)) ([3e00688](https://github.com/formatjs/formatjs/commit/3e00688f955587ac155c9d6c2fa519b07df17a70))

## [1.3.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.3.0...@formatjs/intl@1.3.1) (2020-09-09)

**Note:** Version bump only for package @formatjs/intl

# [1.3.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.2.2...@formatjs/intl@1.3.0) (2020-08-30)

### Features

* **@formatjs/intl:** TS to 4.0 ([a334a8f](https://github.com/formatjs/formatjs/commit/a334a8fe1a2c6c93fe21aabbf204cd3c9c9eee4a))

## [1.2.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.2.1...@formatjs/intl@1.2.2) (2020-08-28)

**Note:** Version bump only for package @formatjs/intl

## [1.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.2.0...@formatjs/intl@1.2.1) (2020-08-25)

**Note:** Version bump only for package @formatjs/intl

# [1.2.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl@1.1.0...@formatjs/intl@1.2.0) (2020-08-23)

### Features

* **@formatjs/intl:** expose createIntl, fix [#2015](https://github.com/formatjs/formatjs/issues/2015) ([a15cc1b](https://github.com/formatjs/formatjs/commit/a15cc1bb371cfe4990031f8af8be217493ff2b99))

# 1.1.0 (2020-08-22)

### Bug Fixes

* **@formatjs/intl:** force version bump ([b213686](https://github.com/formatjs/formatjs/commit/b2136862805f7b8ffe06281fe68f8a2e45c5e12c))

### Features

* **@formatjs/intl:** split out imperative API to a new package ([9292b1f](https://github.com/formatjs/formatjs/commit/9292b1f3cec6ca96f2c0f6a1da0456e7668d3011))

# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [7.0.1](https://github.com/formatjs/formatjs/compare/react-intl@7.0.0...react-intl@7.0.1) (2024-11-18)

### Bug Fixes

* **react-intl:** remove @formatjs/ecma402-abstract, use native TS Intl typdefs ([289aa91](https://github.com/formatjs/formatjs/commit/289aa9142e4ee06ddc25e61d7b9a771486cdd8b3)) - by @longlho

# [7.0.0](https://github.com/formatjs/formatjs/compare/react-intl@6.8.9...react-intl@7.0.0) (2024-11-18)

### Features

* **react-intl:** drop typescript@4 support ([12ecc1b](https://github.com/formatjs/formatjs/commit/12ecc1b36c7d86bd8bd7e7786f5565e5a5b80f88)) - by @longlho
* **react-intl:** remove polyfill packages in deps ([31b832f](https://github.com/formatjs/formatjs/commit/31b832f9a24bff0776d66e35cf85f59de25ed3c3)) - by @longlho

### BREAKING CHANGES

* **react-intl:** This removes @formatjs/intl-displaynames & @formatjs/intl-listformat as
deps which will reduce package size. However, this also means you'll
need typescript@5 at least since that has new type defs for those native
Intl APIs.

## [6.8.9](https://github.com/formatjs/formatjs/compare/react-intl@6.8.8...react-intl@6.8.9) (2024-11-18)

### Bug Fixes

* remove sourceMap from tsconfig, fix [#4693](https://github.com/formatjs/formatjs/issues/4693) ([361d13b](https://github.com/formatjs/formatjs/commit/361d13b6d33236cff685c783e785a69ecbf963f6)) - by @longlho

## [6.8.8](https://github.com/formatjs/formatjs/compare/react-intl@6.8.7...react-intl@6.8.8) (2024-11-17)

**Note:** Version bump only for package react-intl

## [6.8.7](https://github.com/formatjs/formatjs/compare/react-intl@6.8.6...react-intl@6.8.7) (2024-11-05)

### Bug Fixes

* **react-intl:** fix type inference and overload for formatMessage, fix [#4538](https://github.com/formatjs/formatjs/issues/4538) ([5073395](https://github.com/formatjs/formatjs/commit/5073395a49628b273dc99ff750a564ee881c751b)) - by @longlho

## [6.8.6](https://github.com/formatjs/formatjs/compare/react-intl@6.8.5...react-intl@6.8.6) (2024-11-04)

**Note:** Version bump only for package react-intl

## [6.8.5](https://github.com/formatjs/formatjs/compare/react-intl@6.8.4...react-intl@6.8.5) (2024-11-02)

### Bug Fixes

* **react-intl:** relax @types/react versions ([d8f6047](https://github.com/formatjs/formatjs/commit/d8f6047c291a545eb8690290f7bc7761838e5c86)) - by @longlho

## [6.8.4](https://github.com/formatjs/formatjs/compare/react-intl@6.8.3...react-intl@6.8.4) (2024-10-25)

### Bug Fixes

* relax tslib req to 2 instead of 2.7 ([930c3e8](https://github.com/formatjs/formatjs/commit/930c3e8ddcc160fde7466449575455f135f78ca6)) - by @longlho

## [6.8.3](https://github.com/formatjs/formatjs/compare/react-intl@6.8.2...react-intl@6.8.3) (2024-10-25)

**Note:** Version bump only for package react-intl

## [6.8.2](https://github.com/formatjs/formatjs/compare/react-intl@6.8.1...react-intl@6.8.2) (2024-10-24)

**Note:** Version bump only for package react-intl

## [6.8.1](https://github.com/formatjs/formatjs/compare/react-intl@6.8.0...react-intl@6.8.1) (2024-10-21)

**Note:** Version bump only for package react-intl

# [6.8.0](https://github.com/formatjs/formatjs/compare/react-intl@6.7.1...react-intl@6.8.0) (2024-10-12)

### Bug Fixes

* **react-intl:** rm stray package-lock.json ([00bc9f1](https://github.com/formatjs/formatjs/commit/00bc9f1691e8f44bae69769ad9c34256b4396b41)) - by @longlho

### Features

* **react-intl:** adopt React.JSX types in prep for React 19 ([96725cb](https://github.com/formatjs/formatjs/commit/96725cb37e4a7d4749d9399c2d9b69862dcd2b4b)) - by @nstepien

## [6.7.1](https://github.com/formatjs/formatjs/compare/react-intl@6.7.0...react-intl@6.7.1) (2024-10-08)

**Note:** Version bump only for package react-intl

# [6.7.0](https://github.com/formatjs/formatjs/compare/react-intl@6.6.8...react-intl@6.7.0) (2024-09-23)

### Bug Fixes

* **@formatjs/intl:** add this: void to IntlShape method, fix [#4133](https://github.com/formatjs/formatjs/issues/4133) ([a9ba729](https://github.com/formatjs/formatjs/commit/a9ba729089943629a84220c9d9f7b12f6410ad2a)) - by @longlho

### Features

* **eslint-plugin-formatjs:** add support for eslint v9 ([f9a0e1b](https://github.com/formatjs/formatjs/commit/f9a0e1b4a7c8517afef3b7a049a68edd76863121)) - by @michaelfaith

## [6.6.8](https://github.com/formatjs/formatjs/compare/react-intl@6.6.7...react-intl@6.6.8) (2024-05-19)

**Note:** Version bump only for package react-intl

## [6.6.7](https://github.com/formatjs/formatjs/compare/react-intl@6.6.6...react-intl@6.6.7) (2024-05-18)

**Note:** Version bump only for package react-intl

## [6.6.6](https://github.com/formatjs/formatjs/compare/react-intl@6.6.5...react-intl@6.6.6) (2024-05-05)

**Note:** Version bump only for package react-intl

## [6.6.5](https://github.com/formatjs/formatjs/compare/react-intl@6.6.4...react-intl@6.6.5) (2024-04-06)

**Note:** Version bump only for package react-intl

## [6.6.4](https://github.com/formatjs/formatjs/compare/react-intl@6.6.3...react-intl@6.6.4) (2024-03-27)

**Note:** Version bump only for package react-intl

## [6.6.3](https://github.com/formatjs/formatjs/compare/react-intl@6.6.2...react-intl@6.6.3) (2024-03-24)

**Note:** Version bump only for package react-intl

## [6.6.2](https://github.com/formatjs/formatjs/compare/react-intl@6.6.1...react-intl@6.6.2) (2024-01-26)

**Note:** Version bump only for package react-intl

## [6.6.1](https://github.com/formatjs/formatjs/compare/react-intl@6.6.0...react-intl@6.6.1) (2024-01-16)

**Note:** Version bump only for package react-intl

# [6.6.0](https://github.com/formatjs/formatjs/compare/react-intl@6.5.5...react-intl@6.6.0) (2024-01-16)

### Features

* **react-intl:** move createIntl function to a separate file to support react server components ([#4316](https://github.com/formatjs/formatjs/issues/4316)) ([f4fb8c9](https://github.com/formatjs/formatjs/commit/f4fb8c95b9c648b8189758f100244e83425a431c)) - by @am1rb

## [6.5.5](https://github.com/formatjs/formatjs/compare/react-intl@6.5.4...react-intl@6.5.5) (2023-11-14)

**Note:** Version bump only for package react-intl

## [6.5.4](https://github.com/formatjs/formatjs/compare/react-intl@6.5.3...react-intl@6.5.4) (2023-11-12)

**Note:** Version bump only for package react-intl

## [6.5.3](https://github.com/formatjs/formatjs/compare/react-intl@6.5.2...react-intl@6.5.3) (2023-11-12)

**Note:** Version bump only for package react-intl

## [6.5.2](https://github.com/formatjs/formatjs/compare/react-intl@6.5.1...react-intl@6.5.2) (2023-11-06)

**Note:** Version bump only for package react-intl

## [6.5.1](https://github.com/formatjs/formatjs/compare/react-intl@6.5.0...react-intl@6.5.1) (2023-10-23)

**Note:** Version bump only for package react-intl

# [6.5.0](https://github.com/formatjs/formatjs/compare/react-intl@6.4.7...react-intl@6.5.0) (2023-10-16)

### Features

* **eslint-plugin-formatjs:** upgrade typescript-eslint packages ([a3c7310](https://github.com/formatjs/formatjs/commit/a3c7310fa4e7a37c9a482b9060fb1937d37d8d96))

## [6.4.7](https://github.com/formatjs/formatjs/compare/react-intl@6.4.6...react-intl@6.4.7) (2023-09-18)

**Note:** Version bump only for package react-intl

## [6.4.6](https://github.com/formatjs/formatjs/compare/react-intl@6.4.5...react-intl@6.4.6) (2023-09-10)

**Note:** Version bump only for package react-intl

## [6.4.5](https://github.com/formatjs/formatjs/compare/react-intl@6.4.4...react-intl@6.4.5) (2023-09-07)

### Bug Fixes

* **react-intl:** explicitly set type of MemoizedFormattedMessage ([#4104](https://github.com/formatjs/formatjs/issues/4104)) ([8dd659a](https://github.com/formatjs/formatjs/commit/8dd659a0d8f6c6d1a1118f857705987418f0ccf2))

## [6.4.4](https://github.com/formatjs/formatjs/compare/react-intl@6.4.3...react-intl@6.4.4) (2023-06-12)

**Note:** Version bump only for package react-intl

## [6.4.3](https://github.com/formatjs/formatjs/compare/react-intl@6.4.2...react-intl@6.4.3) (2023-06-06)

### Bug Fixes

* **react-intl:** support opting out of global intl context ([#4118](https://github.com/formatjs/formatjs/issues/4118)) ([#4125](https://github.com/formatjs/formatjs/issues/4125)) ([357c861](https://github.com/formatjs/formatjs/commit/357c86139594b00f0754c71667028f05a1ca3b51))

## [6.4.2](https://github.com/formatjs/formatjs/compare/react-intl@6.4.1...react-intl@6.4.2) (2023-05-01)

**Note:** Version bump only for package react-intl

## [6.4.1](https://github.com/formatjs/formatjs/compare/react-intl@6.4.0...react-intl@6.4.1) (2023-04-19)

**Note:** Version bump only for package react-intl

# [6.4.0](https://github.com/formatjs/formatjs/compare/react-intl@6.3.2...react-intl@6.4.0) (2023-04-17)

### Features

* upgrade TS support to v5 ([2c43dc1](https://github.com/formatjs/formatjs/commit/2c43dc1275d7ca940fae80419e3d6e4143bfbfef))

## [6.3.2](https://github.com/formatjs/formatjs/compare/react-intl@6.3.1...react-intl@6.3.2) (2023-03-21)

**Note:** Version bump only for package react-intl

# [6.3.0](https://github.com/formatjs/formatjs/compare/react-intl@6.2.10...react-intl@6.3.0) (2023-03-15)

### Features

* **react-intl:** memoize Context into global ([e0dfde6](https://github.com/formatjs/formatjs/commit/e0dfde6af4210808f08aad32b54707f79f6f88fc))

## [6.2.10](https://github.com/formatjs/formatjs/compare/react-intl@6.2.9...react-intl@6.2.10) (2023-02-20)

**Note:** Version bump only for package react-intl

## [6.2.9](https://github.com/formatjs/formatjs/compare/react-intl@6.2.8...react-intl@6.2.9) (2023-02-20)

**Note:** Version bump only for package react-intl

## [6.2.8](https://github.com/formatjs/formatjs/compare/react-intl@6.2.7...react-intl@6.2.8) (2023-02-07)

### Bug Fixes

* **react-intl:** support union component prop types in `injectIntl` ([#3983](https://github.com/formatjs/formatjs/issues/3983)) ([d970127](https://github.com/formatjs/formatjs/commit/d970127a124ff260c26561bd92a3864094a2b021))

## [6.2.7](https://github.com/formatjs/formatjs/compare/react-intl@6.2.6...react-intl@6.2.7) (2023-01-30)

**Note:** Version bump only for package react-intl

## [6.2.6](https://github.com/formatjs/formatjs/compare/react-intl@6.2.5...react-intl@6.2.6) (2023-01-26)

**Note:** Version bump only for package react-intl

## [6.2.5](https://github.com/formatjs/formatjs/compare/react-intl@6.2.4...react-intl@6.2.5) (2022-12-02)

**Note:** Version bump only for package react-intl

## [6.2.4](https://github.com/formatjs/formatjs/compare/react-intl@6.2.2...react-intl@6.2.4) (2022-12-01)

**Note:** Version bump only for package react-intl

## [6.2.3](https://github.com/formatjs/formatjs/compare/react-intl@6.2.2...react-intl@6.2.3) (2022-12-01)

**Note:** Version bump only for package react-intl

## [6.2.2](https://github.com/formatjs/formatjs/compare/react-intl@6.2.1...react-intl@6.2.2) (2022-11-29)

**Note:** Version bump only for package react-intl

## [6.2.1](https://github.com/formatjs/formatjs/compare/react-intl@6.2.0...react-intl@6.2.1) (2022-10-17)

**Note:** Version bump only for package react-intl

# [6.2.0](https://github.com/formatjs/formatjs/compare/react-intl@6.1.2...react-intl@6.2.0) (2022-10-13)

### Bug Fixes

* **react-intl:** fix type issue w/ ts4.7 ([c366cc8](https://github.com/formatjs/formatjs/commit/c366cc88ca77579c34825bf79941be499fbc5156))

### Features

* **@formatjs/intl,react-intl:** move IntlFormatter type parameters to methods ([#3858](https://github.com/formatjs/formatjs/issues/3858)) ([0d03bb6](https://github.com/formatjs/formatjs/commit/0d03bb66123cb49fbd1c7d27908979bc4521b41f))

## [6.1.2](https://github.com/formatjs/formatjs/compare/react-intl@6.1.1...react-intl@6.1.2) (2022-09-28)

### Bug Fixes

* **react-intl:** re-export PrimitiveType from intl-messageformat ([c00ba91](https://github.com/formatjs/formatjs/commit/c00ba916271af310b04c2ec83512aa2a51f6f2a9))
* **react-intl:** update typescript types for FormattedDate and FormattedTime explicitly add children ([#3852](https://github.com/formatjs/formatjs/issues/3852)) ([67bd664](https://github.com/formatjs/formatjs/commit/67bd664194f8f02d6da24d9f294675b69657e2fe))

## [6.1.1](https://github.com/formatjs/formatjs/compare/react-intl@6.1.0...react-intl@6.1.1) (2022-09-06)

**Note:** Version bump only for package react-intl

# [6.1.0](https://github.com/formatjs/formatjs/compare/react-intl@6.0.8...react-intl@6.1.0) (2022-08-27)

### Features

* **@formatjs/ts-transformer:** support TypeScript 4.7 syntax ([#3764](https://github.com/formatjs/formatjs/issues/3764)) ([1b3388e](https://github.com/formatjs/formatjs/commit/1b3388e9344de3a948068f5cf449341c1eb597a8))

## [6.0.8](https://github.com/formatjs/formatjs/compare/react-intl@6.0.7...react-intl@6.0.8) (2022-08-21)

**Note:** Version bump only for package react-intl

## [6.0.7](https://github.com/formatjs/formatjs/compare/react-intl@6.0.6...react-intl@6.0.7) (2022-08-21)

**Note:** Version bump only for package react-intl

## [6.0.6](https://github.com/formatjs/formatjs/compare/react-intl@6.0.5...react-intl@6.0.6) (2022-08-18)

**Note:** Version bump only for package react-intl

## [6.0.5](https://github.com/formatjs/formatjs/compare/react-intl@6.0.4...react-intl@6.0.5) (2022-07-04)

**Note:** Version bump only for package react-intl

## [6.0.4](https://github.com/formatjs/formatjs/compare/react-intl@6.0.3...react-intl@6.0.4) (2022-06-06)

**Note:** Version bump only for package react-intl

## [6.0.3](https://github.com/formatjs/formatjs/compare/react-intl@6.0.2...react-intl@6.0.3) (2022-05-24)

**Note:** Version bump only for package react-intl

## [6.0.2](https://github.com/formatjs/formatjs/compare/react-intl@6.0.1...react-intl@6.0.2) (2022-05-23)

### Bug Fixes

* **react-intl:** bump minimum react version req to 16.6.0 ([cd21549](https://github.com/formatjs/formatjs/commit/cd21549fe22a64045a65caef2d394d30042a705b)), closes [#3612](https://github.com/formatjs/formatjs/issues/3612)

## [6.0.1](https://github.com/formatjs/formatjs/compare/react-intl@6.0.0...react-intl@6.0.1) (2022-05-19)

**Note:** Version bump only for package react-intl

# [6.0.0](https://github.com/formatjs/formatjs/compare/react-intl@5.25.1...react-intl@6.0.0) (2022-05-19)

### Bug Fixes

* **react-intl:** fix type issue with react18, fix [#3550](https://github.com/formatjs/formatjs/issues/3550) ([2567b93](https://github.com/formatjs/formatjs/commit/2567b932c5d18b097a43842563046c20ce0c49f1))

### Features

* **@formatjs/cli:** package CLI into a single file ([1760787](https://github.com/formatjs/formatjs/commit/176078792894d18b0af72ce1f413f25835f7eb44)), closes [#3547](https://github.com/formatjs/formatjs/issues/3547)

### BREAKING CHANGES

* **@formatjs/cli:** we push @vue/compiler-core out to `peerDependencies` so if u use vue u should pull this in manuallywip on packaging cli.

## [5.25.1](https://github.com/formatjs/formatjs/compare/react-intl@5.25.0...react-intl@5.25.1) (2022-04-27)

**Note:** Version bump only for package react-intl

# [5.25.0](https://github.com/formatjs/formatjs/compare/react-intl@5.24.8...react-intl@5.25.0) (2022-04-17)

### Features

* **@formatjs/intl:** change constrains of react and react-dom versions to allow version 18 ([8808a95](https://github.com/formatjs/formatjs/commit/8808a95c3b377ee9b4e765ecfce74b45fd1c7700)), closes [#3526](https://github.com/formatjs/formatjs/issues/3526) [#3510](https://github.com/formatjs/formatjs/issues/3510)
* **react-intl:** add onWarn ([#3506](https://github.com/formatjs/formatjs/issues/3506)) ([09273e3](https://github.com/formatjs/formatjs/commit/09273e3b183252bee0dbcbcb3066bb77d79c4de1))

## [5.24.8](https://github.com/formatjs/formatjs/compare/react-intl@5.24.7...react-intl@5.24.8) (2022-03-26)

**Note:** Version bump only for package react-intl

## [5.24.7](https://github.com/formatjs/formatjs/compare/react-intl@5.24.6...react-intl@5.24.7) (2022-03-13)

**Note:** Version bump only for package react-intl

## [5.24.6](https://github.com/formatjs/formatjs/compare/react-intl@5.24.5...react-intl@5.24.6) (2022-02-06)

**Note:** Version bump only for package react-intl

## [5.24.5](https://github.com/formatjs/formatjs/compare/react-intl@5.24.4...react-intl@5.24.5) (2022-02-06)

### Bug Fixes

* **react-intl:** createIntl now correctly sets fallbackOnEmptyString ([#3396](https://github.com/formatjs/formatjs/issues/3396)) ([6f7aa1d](https://github.com/formatjs/formatjs/commit/6f7aa1df37a2fdd12e0b55486765caf47544c770))

## [5.24.4](https://github.com/formatjs/formatjs/compare/react-intl@5.24.3...react-intl@5.24.4) (2022-01-24)

**Note:** Version bump only for package react-intl

## [5.24.3](https://github.com/formatjs/formatjs/compare/react-intl@5.24.2...react-intl@5.24.3) (2022-01-14)

**Note:** Version bump only for package react-intl

## [5.24.2](https://github.com/formatjs/formatjs/compare/react-intl@5.24.1...react-intl@5.24.2) (2022-01-09)

**Note:** Version bump only for package react-intl

## [5.24.1](https://github.com/formatjs/formatjs/compare/react-intl@5.24.0...react-intl@5.24.1) (2022-01-03)

**Note:** Version bump only for package react-intl

# [5.24.0](https://github.com/formatjs/formatjs/compare/react-intl@5.23.0...react-intl@5.24.0) (2021-12-20)

### Features

* **react-intl:** Allow setting a stricter type for locale ([#3284](https://github.com/formatjs/formatjs/issues/3284)) ([c4693d4](https://github.com/formatjs/formatjs/commit/c4693d4c69d3e3036544524720b5a077f3b17786))

# [5.23.0](https://github.com/formatjs/formatjs/compare/react-intl@5.22.0...react-intl@5.23.0) (2021-12-01)

### Features

* support TS 4.5, fix [#3276](https://github.com/formatjs/formatjs/issues/3276) ([31e0699](https://github.com/formatjs/formatjs/commit/31e069972aa16e14532531b9e597cff73a3f4897))

# [5.22.0](https://github.com/formatjs/formatjs/compare/react-intl@5.21.2...react-intl@5.22.0) (2021-11-23)

### Features

* **react-intl:** allow setting a stricter type for message IDs ([#3242](https://github.com/formatjs/formatjs/issues/3242)) ([b7cac44](https://github.com/formatjs/formatjs/commit/b7cac443a2ecf791004138699959d46ddc3d4808))

## [5.21.2](https://github.com/formatjs/formatjs/compare/react-intl@5.21.1...react-intl@5.21.2) (2021-11-14)

**Note:** Version bump only for package react-intl

## [5.21.1](https://github.com/formatjs/formatjs/compare/react-intl@5.21.0...react-intl@5.21.1) (2021-11-09)

### Bug Fixes

* **react-intl:** named esm exports ([#3261](https://github.com/formatjs/formatjs/issues/3261)) ([05edd2c](https://github.com/formatjs/formatjs/commit/05edd2cf1eefd5311280e6f64e80d6e078808b7d))

# [5.21.0](https://github.com/formatjs/formatjs/compare/react-intl@5.20.13...react-intl@5.21.0) (2021-10-22)

### Features

* **@formatjs/intl:** add fallbackOnEmptyString option ([#3201](https://github.com/formatjs/formatjs/issues/3201)) ([5c67c28](https://github.com/formatjs/formatjs/commit/5c67c28b60aa361e076bb098a6d081c3f8a1fbd2))
* **react-intl:** upgrade to TS 4.4 ([b7f79b4](https://github.com/formatjs/formatjs/commit/b7f79b4a5567f76e3026abd90f3a2b3d894c17c0))

## [5.20.13](https://github.com/formatjs/formatjs/compare/react-intl@5.20.12...react-intl@5.20.13) (2021-10-17)

### Bug Fixes

* **react-intl:** fix iife dist file, fix [#3188](https://github.com/formatjs/formatjs/issues/3188) ([a0767b6](https://github.com/formatjs/formatjs/commit/a0767b6a54c5596a25c45cec830611b1a82608f5))

## [5.20.12](https://github.com/formatjs/formatjs/compare/react-intl@5.20.11...react-intl@5.20.12) (2021-09-27)

### Bug Fixes

* **react-intl:** use indexOf instead of includes ([aed19a2](https://github.com/formatjs/formatjs/commit/aed19a2719b8c28dbe064482e54da70f8aae1160))

## [5.20.11](https://github.com/formatjs/formatjs/compare/react-intl@5.20.10...react-intl@5.20.11) (2021-09-26)

### Bug Fixes

* **react-intl:** allow @types/react 16 as well ([7a8cef1](https://github.com/formatjs/formatjs/commit/7a8cef142a20c96e847ac5c10efcd88dd032a074)), closes [#3138](https://github.com/formatjs/formatjs/issues/3138)

## [5.20.10](https://github.com/formatjs/formatjs/compare/react-intl@5.20.9...react-intl@5.20.10) (2021-08-21)

### Bug Fixes

* **react-intl:** fix missing deps, fix [#3122](https://github.com/formatjs/formatjs/issues/3122) ([f3b9c0f](https://github.com/formatjs/formatjs/commit/f3b9c0f2a8e3bc5c0698df6dc29b2d6eaa0a2889))

## [5.20.9](https://github.com/formatjs/formatjs/compare/react-intl@5.20.8...react-intl@5.20.9) (2021-08-16)

### Bug Fixes

* **react-intl:** fix children type of FormattedMessage, fix [#3117](https://github.com/formatjs/formatjs/issues/3117) ([567a131](https://github.com/formatjs/formatjs/commit/567a131a910e0bc2584cc031235b8987d91d815a))

## [5.20.8](https://github.com/formatjs/formatjs/compare/react-intl@5.20.7...react-intl@5.20.8) (2021-08-15)

### Bug Fixes

* **react-intl:** add generic constraint to defineMessage for better intellisense experience ([#3111](https://github.com/formatjs/formatjs/issues/3111)) ([9eae9cd](https://github.com/formatjs/formatjs/commit/9eae9cdc12e2f073767d89e18d03f70917d7d1b0))

## [5.20.7](https://github.com/formatjs/formatjs/compare/react-intl@5.20.6...react-intl@5.20.7) (2021-08-06)

**Note:** Version bump only for package react-intl

## [5.20.6](https://github.com/formatjs/formatjs/compare/react-intl@5.20.5...react-intl@5.20.6) (2021-07-24)

**Note:** Version bump only for package react-intl

## [5.20.5](https://github.com/formatjs/formatjs/compare/react-intl@5.20.4...react-intl@5.20.5) (2021-07-23)

**Note:** Version bump only for package react-intl

## [5.20.4](https://github.com/formatjs/formatjs/compare/react-intl@5.20.3...react-intl@5.20.4) (2021-06-26)

**Note:** Version bump only for package react-intl

## [5.20.3](https://github.com/formatjs/formatjs/compare/react-intl@5.20.2...react-intl@5.20.3) (2021-06-21)

**Note:** Version bump only for package react-intl

## [5.20.2](https://github.com/formatjs/formatjs/compare/react-intl@5.20.1...react-intl@5.20.2) (2021-06-09)

**Note:** Version bump only for package react-intl

## [5.20.1](https://github.com/formatjs/formatjs/compare/react-intl@5.20.0...react-intl@5.20.1) (2021-06-05)

**Note:** Version bump only for package react-intl

# [5.20.0](https://github.com/formatjs/formatjs/compare/react-intl@5.19.0...react-intl@5.20.0) (2021-06-05)

### Features

* **@formatjs/intl:** allow formatList & FormattedList to take in readonly array ([#2950](https://github.com/formatjs/formatjs/issues/2950)) ([1d7896c](https://github.com/formatjs/formatjs/commit/1d7896c6d2aff31e215fae07f16e7509484a8ba6))

# [5.19.0](https://github.com/formatjs/formatjs/compare/react-intl@5.18.3...react-intl@5.19.0) (2021-06-04)

### Features

* **@formatjs/ts-transformer:** support ts-jest 27, fix [#2942](https://github.com/formatjs/formatjs/issues/2942) ([7d994e4](https://github.com/formatjs/formatjs/commit/7d994e485f0e615f8e08fe3befb78d4416edbaaa))

## [5.18.3](https://github.com/formatjs/formatjs/compare/react-intl@5.18.2...react-intl@5.18.3) (2021-06-02)

### Bug Fixes

* **react-intl:** make React external to react-intl, fix [#2939](https://github.com/formatjs/formatjs/issues/2939) ([f744ccc](https://github.com/formatjs/formatjs/commit/f744ccc39bc7925a8d9764ef3e644333b28ee4e7))

## [5.18.2](https://github.com/formatjs/formatjs/compare/react-intl@5.18.1...react-intl@5.18.2) (2021-06-01)

**Note:** Version bump only for package react-intl

## [5.18.1](https://github.com/formatjs/formatjs/compare/react-intl@5.18.0...react-intl@5.18.1) (2021-05-23)

**Note:** Version bump only for package react-intl

# [5.18.0](https://github.com/formatjs/formatjs/compare/react-intl@5.17.7...react-intl@5.18.0) (2021-05-20)

### Features

* **react-intl:** add FormattedListParts, fix [#2901](https://github.com/formatjs/formatjs/issues/2901) ([eb9f193](https://github.com/formatjs/formatjs/commit/eb9f193e084328f5471b183ec36eadba0edf3cf6))

## [5.17.7](https://github.com/formatjs/formatjs/compare/react-intl@5.17.6...react-intl@5.17.7) (2021-05-17)

**Note:** Version bump only for package react-intl

## [5.17.6](https://github.com/formatjs/formatjs/compare/react-intl@5.17.5...react-intl@5.17.6) (2021-05-14)

**Note:** Version bump only for package react-intl

## [5.17.5](https://github.com/formatjs/formatjs/compare/react-intl@5.17.4...react-intl@5.17.5) (2021-05-10)

**Note:** Version bump only for package react-intl

## [5.17.4](https://github.com/formatjs/formatjs/compare/react-intl@5.17.3...react-intl@5.17.4) (2021-05-02)

**Note:** Version bump only for package react-intl

## [5.17.3](https://github.com/formatjs/formatjs/compare/react-intl@5.17.2...react-intl@5.17.3) (2021-05-02)

**Note:** Version bump only for package react-intl

## [5.17.2](https://github.com/formatjs/formatjs/compare/react-intl@5.17.1...react-intl@5.17.2) (2021-04-29)

### Bug Fixes

* **react-intl:** update react provider to match GetDerivedStateFromProps declaration. ([#2852](https://github.com/formatjs/formatjs/issues/2852)) ([7248d37](https://github.com/formatjs/formatjs/commit/7248d37af8b26ace9d94c15dd305bd5aab4d13dd)), closes [/github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react/v16/index.d.ts#L646](https://github.com//github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react/v16/index.d.ts/issues/L646)

## [5.17.1](https://github.com/formatjs/formatjs/compare/react-intl@5.17.0...react-intl@5.17.1) (2021-04-26)

**Note:** Version bump only for package react-intl

# [5.17.0](https://github.com/formatjs/formatjs/compare/react-intl@5.16.2...react-intl@5.17.0) (2021-04-26)

### Features

* **react-intl:** expose ESM & IIFE versions ([06409a7](https://github.com/formatjs/formatjs/commit/06409a77e41e1b75eea39d18e4d4f3b099f14bc1))

## [5.16.2](https://github.com/formatjs/formatjs/compare/react-intl@5.16.1...react-intl@5.16.2) (2021-04-26)

**Note:** Version bump only for package react-intl

## [5.16.1](https://github.com/formatjs/formatjs/compare/react-intl@5.16.0...react-intl@5.16.1) (2021-04-26)

**Note:** Version bump only for package react-intl

# [5.16.0](https://github.com/formatjs/formatjs/compare/react-intl@5.15.8...react-intl@5.16.0) (2021-04-21)

### Features

* **react-intl:** rename OptionalIntlConfig to IntlConfig and IntlConfig to ResolvedIntlConfig ([779a957](https://github.com/formatjs/formatjs/commit/779a957b190dc8ab6cc0549e11acd43bdeba4b82))

## [5.15.8](https://github.com/formatjs/formatjs/compare/react-intl@5.15.7...react-intl@5.15.8) (2021-04-12)

**Note:** Version bump only for package react-intl

## [5.15.7](https://github.com/formatjs/formatjs/compare/react-intl@5.15.6...react-intl@5.15.7) (2021-04-04)

**Note:** Version bump only for package react-intl

## [5.15.6](https://github.com/formatjs/formatjs/compare/react-intl@5.15.5...react-intl@5.15.6) (2021-04-03)

**Note:** Version bump only for package react-intl

## [5.15.5](https://github.com/formatjs/formatjs/compare/react-intl@5.15.4...react-intl@5.15.5) (2021-03-30)

**Note:** Version bump only for package react-intl

## [5.15.4](https://github.com/formatjs/formatjs/compare/react-intl@5.15.3...react-intl@5.15.4) (2021-03-30)

**Note:** Version bump only for package react-intl

## [5.15.3](https://github.com/formatjs/formatjs/compare/react-intl@5.15.2...react-intl@5.15.3) (2021-03-28)

**Note:** Version bump only for package react-intl

## [5.15.2](https://github.com/formatjs/formatjs/compare/react-intl@5.15.1...react-intl@5.15.2) (2021-03-28)

**Note:** Version bump only for package react-intl

## [5.15.1](https://github.com/formatjs/formatjs/compare/react-intl@5.15.0...react-intl@5.15.1) (2021-03-27)

### Bug Fixes

* **react-intl:** fix missing dep ([cb97f8a](https://github.com/formatjs/formatjs/commit/cb97f8a83c46f5cd2682dad2aa96024c2b125f8d))

# [5.15.0](https://github.com/formatjs/formatjs/compare/react-intl@5.14.1...react-intl@5.15.0) (2021-03-27)

### Features

* **react-intl:** switch parser to @formatjs/icu-messageformat-parser (6x faster) ([c3c211f](https://github.com/formatjs/formatjs/commit/c3c211fde60513d84e915fd36dd715999575cd00))

## [5.14.1](https://github.com/formatjs/formatjs/compare/react-intl@5.14.0...react-intl@5.14.1) (2021-03-26)

### Bug Fixes

* **react-intl:** add back top level displayName, fix [#2751](https://github.com/formatjs/formatjs/issues/2751) ([613b746](https://github.com/formatjs/formatjs/commit/613b746e5194ae92d28310283c01815521fe4839))

# [5.14.0](https://github.com/formatjs/formatjs/compare/react-intl@5.13.5...react-intl@5.14.0) (2021-03-26)

### Bug Fixes

* **react-intl:** fix displayName in FormattedMessage, fix [#2751](https://github.com/formatjs/formatjs/issues/2751) ([d185ef3](https://github.com/formatjs/formatjs/commit/d185ef37fd5e428de03c0fda726ced2ae9595574))

### Features

* **faster-messageformat-parser:** add the new ICU message format parser ([#2732](https://github.com/formatjs/formatjs/issues/2732)) ([8fa6a6e](https://github.com/formatjs/formatjs/commit/8fa6a6e73732001638ef3512ec73461d5543ba8c)), closes [#xB7](https://github.com/formatjs/formatjs/issues/xB7) [#xC0](https://github.com/formatjs/formatjs/issues/xC0) [-#xD6](https://github.com/-/issues/xD6) [#xD8](https://github.com/formatjs/formatjs/issues/xD8) [-#xF6](https://github.com/-/issues/xF6) [#xF8](https://github.com/formatjs/formatjs/issues/xF8) [-#x37](https://github.com/-/issues/x37) [#x37](https://github.com/formatjs/formatjs/issues/x37) [F-#x1](https://github.com/F-/issues/x1) [#x200](https://github.com/formatjs/formatjs/issues/x200) [C-#x200](https://github.com/C-/issues/x200) [#x203](https://github.com/formatjs/formatjs/issues/x203) [F-#x2040](https://github.com/F-/issues/x2040) [#x2070](https://github.com/formatjs/formatjs/issues/x2070) [-#x218](https://github.com/-/issues/x218) [#x2C00](https://github.com/formatjs/formatjs/issues/x2C00) [-#x2](https://github.com/-/issues/x2) [#x3001](https://github.com/formatjs/formatjs/issues/x3001) [-#xD7](https://github.com/-/issues/xD7) [#xF900](https://github.com/formatjs/formatjs/issues/xF900) [#xFDF0](https://github.com/formatjs/formatjs/issues/xFDF0) [#x10000](https://github.com/formatjs/formatjs/issues/x10000)

## [5.13.5](https://github.com/formatjs/formatjs/compare/react-intl@5.13.4...react-intl@5.13.5) (2021-03-19)

### Bug Fixes

* **react-intl:** fix FormattedRelativeTime update after unmount, fix [#2727](https://github.com/formatjs/formatjs/issues/2727) ([bdc0586](https://github.com/formatjs/formatjs/commit/bdc0586e677fc0cfc962c9994bfb4de2821a1705))

## [5.13.4](https://github.com/formatjs/formatjs/compare/react-intl@5.13.3...react-intl@5.13.4) (2021-03-17)

### Bug Fixes

* **react-intl:** trim down dependencies thanks to TS4.2 ([be2a3cf](https://github.com/formatjs/formatjs/commit/be2a3cf0128d9dece9508f8523dc9783b682624c))

## [5.13.3](https://github.com/formatjs/formatjs/compare/react-intl@5.13.2...react-intl@5.13.3) (2021-03-15)

**Note:** Version bump only for package react-intl

## [5.13.2](https://github.com/formatjs/formatjs/compare/react-intl@5.13.1...react-intl@5.13.2) (2021-03-01)

### Bug Fixes

* **react-intl:** remove shallow-equal dep, change FormattedMessage for functional component ([ab4959f](https://github.com/formatjs/formatjs/commit/ab4959fdc0ace628d7668a9793489be9d6cceac3))

## [5.13.1](https://github.com/formatjs/formatjs/compare/react-intl@5.13.0...react-intl@5.13.1) (2021-02-25)

### Bug Fixes

* bump tslib version dep ([37577d2](https://github.com/formatjs/formatjs/commit/37577d22bf28d23de1d8013ba0047cf221ad8840)), closes [#2645](https://github.com/formatjs/formatjs/issues/2645)

# [5.13.0](https://github.com/formatjs/formatjs/compare/react-intl@5.12.5...react-intl@5.13.0) (2021-02-25)

### Features

* **react-intl:** support TS4.2 ([78b8766](https://github.com/formatjs/formatjs/commit/78b8766cfca3363b477bd9d0b01c8d4b36a7c1cf))

## [5.12.5](https://github.com/formatjs/formatjs/compare/react-intl@5.12.4...react-intl@5.12.5) (2021-02-22)

### Bug Fixes

* **@formatjs/intl-displaynames:** fix script canonicalization, fix [#2622](https://github.com/formatjs/formatjs/issues/2622) ([be07282](https://github.com/formatjs/formatjs/commit/be072825c3d8f5171b3a2aed8f382f6fde6b12ca))

## [5.12.4](https://github.com/formatjs/formatjs/compare/react-intl@5.12.3...react-intl@5.12.4) (2021-02-21)

**Note:** Version bump only for package react-intl

## [5.12.3](https://github.com/formatjs/formatjs/compare/react-intl@5.12.2...react-intl@5.12.3) (2021-02-13)

**Note:** Version bump only for package react-intl

## [5.12.2](https://github.com/formatjs/formatjs/compare/react-intl@5.12.1...react-intl@5.12.2) (2021-02-09)

**Note:** Version bump only for package react-intl

## [5.12.1](https://github.com/formatjs/formatjs/compare/react-intl@5.12.0...react-intl@5.12.1) (2021-02-04)

### Bug Fixes

* **react-intl:** re-export MessageFormatElement, fix [#2559](https://github.com/formatjs/formatjs/issues/2559) ([365e104](https://github.com/formatjs/formatjs/commit/365e104b34b5b95f7bbc008711eeeb3f3d31f442))

# [5.12.0](https://github.com/formatjs/formatjs/compare/react-intl@5.10.19...react-intl@5.12.0) (2021-02-02)

### Bug Fixes

* **react-intl:** pass opts to format message, fix [#2538](https://github.com/formatjs/formatjs/issues/2538) ([f7f4535](https://github.com/formatjs/formatjs/commit/f7f4535176c5f9ecd75ff08dd6c4ca6c5a3e97c2))

### Features

* **react-intl:** allow FormattedMessage to pass in ignoreTag, fix [#2538](https://github.com/formatjs/formatjs/issues/2538) ([a615cf9](https://github.com/formatjs/formatjs/commit/a615cf92bc947274e27bb75233bc3919d13b097c))

# [5.11.0](https://github.com/formatjs/formatjs/compare/react-intl@5.10.19...react-intl@5.11.0) (2021-01-29)

### Features

* **react-intl:** allow FormattedMessage to pass in ignoreTag, fix [#2538](https://github.com/formatjs/formatjs/issues/2538) ([15d4854](https://github.com/formatjs/formatjs/commit/15d4854b4fffef387102905f5a159910860d8e15))

## [5.10.19](https://github.com/formatjs/formatjs/compare/react-intl@5.10.18...react-intl@5.10.19) (2021-01-27)

**Note:** Version bump only for package react-intl

## [5.10.18](https://github.com/formatjs/formatjs/compare/react-intl@5.10.17...react-intl@5.10.18) (2021-01-26)

**Note:** Version bump only for package react-intl

## [5.10.17](https://github.com/formatjs/formatjs/compare/react-intl@5.10.16...react-intl@5.10.17) (2021-01-25)

**Note:** Version bump only for package react-intl

## [5.10.16](https://github.com/formatjs/formatjs/compare/react-intl@5.10.15...react-intl@5.10.16) (2021-01-13)

**Note:** Version bump only for package react-intl

## [5.10.15](https://github.com/formatjs/formatjs/compare/react-intl@5.10.14...react-intl@5.10.15) (2021-01-12)

**Note:** Version bump only for package react-intl

## [5.10.14](https://github.com/formatjs/formatjs/compare/react-intl@5.10.13...react-intl@5.10.14) (2021-01-08)

**Note:** Version bump only for package react-intl

## [5.10.13](https://github.com/formatjs/formatjs/compare/react-intl@5.10.12...react-intl@5.10.13) (2021-01-06)

**Note:** Version bump only for package react-intl

## [5.10.12](https://github.com/formatjs/formatjs/compare/react-intl@5.10.11...react-intl@5.10.12) (2021-01-05)

**Note:** Version bump only for package react-intl

## [5.10.11](https://github.com/formatjs/formatjs/compare/react-intl@5.10.10...react-intl@5.10.11) (2021-01-02)

**Note:** Version bump only for package react-intl

## [5.10.10](https://github.com/formatjs/formatjs/compare/react-intl@5.10.9...react-intl@5.10.10) (2021-01-01)

**Note:** Version bump only for package react-intl

## [5.10.9](https://github.com/formatjs/formatjs/compare/react-intl@5.10.8...react-intl@5.10.9) (2020-12-18)

**Note:** Version bump only for package react-intl

## [5.10.8](https://github.com/formatjs/formatjs/compare/react-intl@5.10.7...react-intl@5.10.8) (2020-12-17)

**Note:** Version bump only for package react-intl

## [5.10.7](https://github.com/formatjs/formatjs/compare/react-intl@5.10.6...react-intl@5.10.7) (2020-12-16)

**Note:** Version bump only for package react-intl

## [5.10.6](https://github.com/formatjs/formatjs/compare/react-intl@5.10.5...react-intl@5.10.6) (2020-11-27)

**Note:** Version bump only for package react-intl

## [5.10.5](https://github.com/formatjs/formatjs/compare/react-intl@5.10.4...react-intl@5.10.5) (2020-11-26)

**Note:** Version bump only for package react-intl

## [5.10.4](https://github.com/formatjs/formatjs/compare/react-intl@5.10.3...react-intl@5.10.4) (2020-11-21)

### Bug Fixes

* **react-intl:** only warn about non-AST messages during initialization, fix [#2258](https://github.com/formatjs/formatjs/issues/2258) ([b1e1fd0](https://github.com/formatjs/formatjs/commit/b1e1fd0734aaa0340f7d43cfe86566ba639369e3))

## [5.10.3](https://github.com/formatjs/formatjs/compare/react-intl@5.10.2...react-intl@5.10.3) (2020-11-20)

**Note:** Version bump only for package react-intl

## [5.10.2](https://github.com/formatjs/formatjs/compare/react-intl@5.10.1...react-intl@5.10.2) (2020-11-19)

### Bug Fixes

* **react-intl:** fix type decl for createIntl, fix [#2320](https://github.com/formatjs/formatjs/issues/2320) ([feae85b](https://github.com/formatjs/formatjs/commit/feae85bf083d9e2ade72f6464cef3a8b4d30ae10))

## [5.10.1](https://github.com/formatjs/formatjs/compare/react-intl@5.10.0...react-intl@5.10.1) (2020-11-12)

**Note:** Version bump only for package react-intl

# [5.10.0](https://github.com/formatjs/formatjs/compare/react-intl@5.9.4...react-intl@5.10.0) (2020-11-10)

### Bug Fixes

* **react-intl:** set typescript dep as optional ([678d290](https://github.com/formatjs/formatjs/commit/678d29057066d53345799a6f948db388c0e6266c))

### Features

* **react-intl:** support react 17 ([#2301](https://github.com/formatjs/formatjs/issues/2301)) ([782eabe](https://github.com/formatjs/formatjs/commit/782eabe9754a377a677888433c23b71c8971f014)), closes [#2298](https://github.com/formatjs/formatjs/issues/2298)

## [5.9.4](https://github.com/formatjs/formatjs/compare/react-intl@5.9.3...react-intl@5.9.4) (2020-11-09)

**Note:** Version bump only for package react-intl

## [5.9.3](https://github.com/formatjs/formatjs/compare/react-intl@5.9.2...react-intl@5.9.3) (2020-11-09)

**Note:** Version bump only for package react-intl

## [5.9.2](https://github.com/formatjs/formatjs/compare/react-intl@5.9.1...react-intl@5.9.2) (2020-11-05)

### Bug Fixes

* **@formatjs/intl:** fix default config for formatDateTimeRange ([60087d8](https://github.com/formatjs/formatjs/commit/60087d8df70d70b3c11dd733bb1961d389b0e211))

## [5.9.1](https://github.com/formatjs/formatjs/compare/react-intl@5.9.0...react-intl@5.9.1) (2020-11-05)

**Note:** Version bump only for package react-intl

# [5.9.0](https://github.com/formatjs/formatjs/compare/react-intl@5.8.9...react-intl@5.9.0) (2020-11-05)

### Bug Fixes

* **react-intl:** lock down monorepo dep version ([7869092](https://github.com/formatjs/formatjs/commit/7869092fc8f9b245cacd2497d511c155085e769a))

### Features

* **react-intl:** introduce FormattedDateTimeRange, a stage-3 API ([ebff2a3](https://github.com/formatjs/formatjs/commit/ebff2a3d0732da3fcdadfc091f9ef898fff9b020))

## [5.8.9](https://github.com/formatjs/formatjs/compare/react-intl@5.8.8...react-intl@5.8.9) (2020-11-04)

**Note:** Version bump only for package react-intl

## [5.8.8](https://github.com/formatjs/formatjs/compare/react-intl@5.8.7...react-intl@5.8.8) (2020-10-26)

**Note:** Version bump only for package react-intl

## [5.8.7](https://github.com/formatjs/formatjs/compare/react-intl@5.8.6...react-intl@5.8.7) (2020-10-25)

**Note:** Version bump only for package react-intl

## [5.8.6](https://github.com/formatjs/formatjs/compare/react-intl@5.8.5...react-intl@5.8.6) (2020-10-10)

**Note:** Version bump only for package react-intl

## [5.8.5](https://github.com/formatjs/formatjs/compare/react-intl@5.8.4...react-intl@5.8.5) (2020-10-08)

**Note:** Version bump only for package react-intl

## [5.8.4](https://github.com/formatjs/formatjs/compare/react-intl@5.8.3...react-intl@5.8.4) (2020-10-01)

**Note:** Version bump only for package react-intl

## [5.8.3](https://github.com/formatjs/formatjs/compare/react-intl@5.8.2...react-intl@5.8.3) (2020-09-25)

**Note:** Version bump only for package react-intl

## [5.8.2](https://github.com/formatjs/formatjs/compare/react-intl@5.8.1...react-intl@5.8.2) (2020-09-18)

### Bug Fixes

* **@formatjs/intl-displaynames:** follow ES2021 spec and make type option required ([#2103](https://github.com/formatjs/formatjs/issues/2103)) ([3e00688](https://github.com/formatjs/formatjs/commit/3e00688f955587ac155c9d6c2fa519b07df17a70))

## [5.8.1](https://github.com/formatjs/formatjs/compare/react-intl@5.8.0...react-intl@5.8.1) (2020-09-09)

### Bug Fixes

* **react-intl:** add typescript as peerDependency, fix [#2066](https://github.com/formatjs/formatjs/issues/2066) ([#2067](https://github.com/formatjs/formatjs/issues/2067)) ([c2fac57](https://github.com/formatjs/formatjs/commit/c2fac57ab11fe43a01bd5ae57635557beb45ad67))
* **react-intl:** fix TS typing entry point path ([f01ab86](https://github.com/formatjs/formatjs/commit/f01ab8612ef4ea4cef8bdbfb597455c9553f149e))

# [5.8.0](https://github.com/formatjs/formatjs/compare/react-intl@5.7.2...react-intl@5.8.0) (2020-08-30)

### Features

* **react-intl:** upgrade TS to 4.0 ([15fe44e](https://github.com/formatjs/formatjs/commit/15fe44e29339fd3f0658a6d43f96ca9771b2cf88))

## [5.7.2](https://github.com/formatjs/formatjs/compare/react-intl@5.7.1...react-intl@5.7.2) (2020-08-28)

**Note:** Version bump only for package react-intl

## [5.7.1](https://github.com/formatjs/formatjs/compare/react-intl@5.7.0...react-intl@5.7.1) (2020-08-25)

**Note:** Version bump only for package react-intl

# [5.7.0](https://github.com/formatjs/formatjs/compare/react-intl@5.6.10...react-intl@5.7.0) (2020-08-23)

### Features

* **@formatjs/intl:** expose createIntl, fix [#2015](https://github.com/formatjs/formatjs/issues/2015) ([a15cc1b](https://github.com/formatjs/formatjs/commit/a15cc1bb371cfe4990031f8af8be217493ff2b99))

## [5.6.10](https://github.com/formatjs/formatjs/compare/react-intl@5.6.9...react-intl@5.6.10) (2020-08-22)

**Note:** Version bump only for package react-intl

## [5.6.9](https://github.com/formatjs/formatjs/compare/react-intl@5.6.8...react-intl@5.6.9) (2020-08-21)

**Note:** Version bump only for package react-intl

## [5.6.8](https://github.com/formatjs/formatjs/compare/react-intl@5.6.7...react-intl@5.6.8) (2020-08-20)

### Bug Fixes

* bump intl-messageformat-parser ([8bbfa04](https://github.com/formatjs/formatjs/commit/8bbfa047da159662700b7e500879da20e54c0f0b))

## [5.6.7](https://github.com/formatjs/formatjs/compare/react-intl@5.6.6...react-intl@5.6.7) (2020-08-19)

**Note:** Version bump only for package react-intl

## [5.6.6](https://github.com/formatjs/formatjs/compare/react-intl@5.6.5...react-intl@5.6.6) (2020-08-19)

**Note:** Version bump only for package react-intl

## [5.6.5](https://github.com/formatjs/formatjs/compare/react-intl@5.6.4...react-intl@5.6.5) (2020-08-18)

**Note:** Version bump only for package react-intl

## [5.6.4](https://github.com/formatjs/formatjs/compare/react-intl@5.6.3...react-intl@5.6.4) (2020-08-17)

**Note:** Version bump only for package react-intl

## [5.6.3](https://github.com/formatjs/formatjs/compare/react-intl@5.6.2...react-intl@5.6.3) (2020-08-15)

### Bug Fixes

* **react-intl:** fix err message conditions for defaultRichTextElements, fix [#1972](https://github.com/formatjs/formatjs/issues/1972) ([7e6f311](https://github.com/formatjs/formatjs/commit/7e6f311f16f6ef4a4668f1fe9eeeac0b962b29b9))

## [5.6.2](https://github.com/formatjs/formatjs/compare/react-intl@5.6.1...react-intl@5.6.2) (2020-08-15)

**Note:** Version bump only for package react-intl

## [5.6.1](https://github.com/formatjs/formatjs/compare/react-intl@5.6.0...react-intl@5.6.1) (2020-08-14)

**Note:** Version bump only for package react-intl

# [5.6.0](https://github.com/formatjs/formatjs/compare/react-intl@5.5.0...react-intl@5.6.0) (2020-08-14)

### Features

* **react-intl:** expose react-intl-no-parser.umd.js that does not contain intl-messageformat-parser, fix [#1945](https://github.com/formatjs/formatjs/issues/1945) ([5330073](https://github.com/formatjs/formatjs/commit/53300732d0da380a572a2ffd12967c0924a36484))

# [5.5.0](https://github.com/formatjs/formatjs/compare/react-intl@5.4.8...react-intl@5.5.0) (2020-08-14)

### Features

* **react-intl:** add support for default rich text elements with defaultRichTextElements, fix [#1752](https://github.com/formatjs/formatjs/issues/1752) ([f18c6d3](https://github.com/formatjs/formatjs/commit/f18c6d3f41154197f6541b8584c54d970a881ccd))
* **react-intl:** tweak MessageDescriptor defaultMessage type to be AST as well ([d110f8e](https://github.com/formatjs/formatjs/commit/d110f8e15ea49a416741445ad102340cc3a82d1a))

## [5.4.8](https://github.com/formatjs/formatjs/compare/react-intl@5.4.7...react-intl@5.4.8) (2020-08-13)

**Note:** Version bump only for package react-intl

## [5.4.7](https://github.com/formatjs/formatjs/compare/react-intl@5.4.6...react-intl@5.4.7) (2020-08-11)

**Note:** Version bump only for package react-intl

## [5.4.6](https://github.com/formatjs/formatjs/compare/react-intl@5.4.5...react-intl@5.4.6) (2020-08-06)

### Bug Fixes

* **react-intl:** fix Object.create(null) case for messages, fix [#1914](https://github.com/formatjs/formatjs/issues/1914) ([4a0f555](https://github.com/formatjs/formatjs/commit/4a0f555f5c11d33358ba85aec239e11090d59e86))
* **react-intl:** just use Object.prototype.hasOwnProperty.call instead ([269adc4](https://github.com/formatjs/formatjs/commit/269adc4a81af5d0cfe84ab02bd5242b4335e4a00))

## [5.4.5](https://github.com/formatjs/formatjs/compare/react-intl@5.4.4...react-intl@5.4.5) (2020-07-30)

**Note:** Version bump only for package react-intl

## [5.4.4](https://github.com/formatjs/formatjs/compare/react-intl@5.4.3...react-intl@5.4.4) (2020-07-30)

### Bug Fixes

* **react-intl:** fix UMD build, re-enable functional tests ([8257db7](https://github.com/formatjs/formatjs/commit/8257db7cda27ac758a21e5d848e9e81e945867a1))

## [5.4.3](https://github.com/formatjs/formatjs/compare/react-intl@5.4.2...react-intl@5.4.3) (2020-07-29)

### Bug Fixes

* **react-intl:** fix crash when message id is __proto__, fix [#1885](https://github.com/formatjs/formatjs/issues/1885) ([a42cdec](https://github.com/formatjs/formatjs/commit/a42cdec44c5cba184832ad9703cf2aa7cf2f1be4))

## [5.4.2](https://github.com/formatjs/formatjs/compare/react-intl@5.4.1...react-intl@5.4.2) (2020-07-25)

### Bug Fixes

* **react-intl:** hot path literal AST message rendering ([1d726de](https://github.com/formatjs/formatjs/commit/1d726de0deb87bf9c09e5d089adb3efbddb7a856))

## [5.4.1](https://github.com/formatjs/formatjs/compare/react-intl@5.4.0...react-intl@5.4.1) (2020-07-24)

**Note:** Version bump only for package react-intl

# [5.4.0](https://github.com/formatjs/formatjs/compare/react-intl@5.3.2...react-intl@5.4.0) (2020-07-21)

### Features

* **@formatjs/intl-datetimeformat:** adding implementation of tc39/proposal-intl-datetime-style ([#1859](https://github.com/formatjs/formatjs/issues/1859)) ([e3c329e](https://github.com/formatjs/formatjs/commit/e3c329e755aa615a9de542778626d0350487c253)), closes [#1847](https://github.com/formatjs/formatjs/issues/1847)

## [5.3.2](https://github.com/formatjs/formatjs/compare/react-intl@5.3.1...react-intl@5.3.2) (2020-07-17)

### Bug Fixes

* **react-intl:** add back react-intl.umd.js ([ac4b435](https://github.com/formatjs/formatjs/commit/ac4b435be0c8b168896c4a24dbc61c419c48fd6e))

## [5.3.1](https://github.com/formatjs/formatjs/compare/react-intl@5.3.0...react-intl@5.3.1) (2020-07-16)

### Bug Fixes

* **react-intl:** drop TS req to 3.8 ([140dd37](https://github.com/formatjs/formatjs/commit/140dd375c08149ffe3b602be868b6653b188d85f))

### Reverts

* Revert "feat(@formatjs/intl-utils): remove custom LDMLPluralRuleType and use TS3.9 type" ([1a6eeac](https://github.com/formatjs/formatjs/commit/1a6eeac8c59184825968ffddc35374c83f3fe782))

# [5.3.0](https://github.com/formatjs/formatjs/compare/react-intl@5.2.2...react-intl@5.3.0) (2020-07-15)

### Features

* **react-intl:** add Enum support to defineMessages, fix [#1677](https://github.com/formatjs/formatjs/issues/1677) ([177420b](https://github.com/formatjs/formatjs/commit/177420bb54815ccd883e44973e56ec5b8113cc58))

## [5.2.2](https://github.com/formatjs/formatjs/compare/react-intl@5.2.0...react-intl@5.2.2) (2020-07-14)

### Bug Fixes

* **react-intl:** fix rollup'ed type def file ([bddb88e](https://github.com/formatjs/formatjs/commit/bddb88e7435854b3152f2fbdc72b50054d9bad76))

## [5.2.1](https://github.com/formatjs/formatjs/compare/react-intl@5.2.0...react-intl@5.2.1) (2020-07-14)

### Bug Fixes

* **react-intl:** fix rollup'ed type def file ([bddb88e](https://github.com/formatjs/formatjs/commit/bddb88e7435854b3152f2fbdc72b50054d9bad76))

# [5.2.0](https://github.com/formatjs/formatjs/compare/react-intl@5.1.0...react-intl@5.2.0) (2020-07-14)

### Bug Fixes

* **@formatjs/intl-displaynames:** rm files restriction from package.json ([b89a780](https://github.com/formatjs/formatjs/commit/b89a780803aa682fddf020ca742dc896401e68e0))

### Features

* **@formatjs/intl-utils:** remove custom LDMLPluralRuleType and use TS3.9 type ([8e433d5](https://github.com/formatjs/formatjs/commit/8e433d5afdbf64f7a952d6345e50cad29bbb7083))

# [5.1.0](https://github.com/formatjs/formatjs/compare/react-intl@5.0.2...react-intl@5.1.0) (2020-07-14)

### Bug Fixes

* **react-intl:** add original exception message to stack ([b4e3f55](https://github.com/formatjs/formatjs/commit/b4e3f558bcbd47f97a8451614f85300708d05d7f))
* **react-intl:** fix type issue for TS3.9 ([97ef395](https://github.com/formatjs/formatjs/commit/97ef395f04dff86546bda5d5eb605684835af457))

### Features

* publish ([b6e3465](https://github.com/formatjs/formatjs/commit/b6e3465ac95b3fa481f3c89f077a66ac004f7c27))

## [5.0.3](https://github.com/formatjs/formatjs/compare/react-intl@5.0.2...react-intl@5.0.3) (2020-07-09)

**Note:** Version bump only for package react-intl

## [5.0.2](https://github.com/formatjs/formatjs/compare/react-intl@5.0.1...react-intl@5.0.2) (2020-07-03)

**Note:** Version bump only for package react-intl

## [5.0.1](https://github.com/formatjs/formatjs/compare/react-intl@5.0.0...react-intl@5.0.1) (2020-07-03)

**Note:** Version bump only for package react-intl

# [5.0.0](https://github.com/formatjs/formatjs/compare/react-intl@4.7.6...react-intl@5.0.0) (2020-07-03)

### Features

* **intl-messageformat:** make FormatXMLElementFn non-variadic ([f2963bf](https://github.com/formatjs/formatjs/commit/f2963bf17ec9809b13fffdb52d68f70439ba186b))
* **react-intl:** fail fast when intl Provider is missing ([42fa3c1](https://github.com/formatjs/formatjs/commit/42fa3c1c084b6da969790ee0b77b2f7fd6353488))
* **react-intl:** merge chunks in FormatXMLElementFn ([1b5892f](https://github.com/formatjs/formatjs/commit/1b5892febb8bbd71613761ba253f702dc18fb522)), closes [#1623](https://github.com/formatjs/formatjs/issues/1623)

### BREAKING CHANGES

* **react-intl:** This also comes from Dropbox internal developer feedback. `FormattedMessage` has a default English renderer that masks `Provider` setup issues which causes them to not be handled during testing phase.
* **intl-messageformat:** This effectively change the signature for formatter
function from `(...chunks) => any` to `(chunks) => any`. This solves a
couple of issues:
1. We received user feedback that variadic function is not as ergonomic
2. Right now there's not way to distinguish between 2 chunks that have
the same tag, e.g `<b>on</b> and <b>on</b>`. The function would
receive 2 chunks that are identical. By consoliding to the 1st param we
can reserve additional params to provide mode metadata in the future
* **react-intl:** This turns rich text formatting callback function to
non-variadic. So `(...chunks) => React.ReactNode` becomes `(chunks) =>
React.ReactNode`. This solves a couple of issues:
1. We receive feedback that variadic callback fn is not ergonomic
2. This solves the missing key issue when we render rich text
3. This allows us to utilize extra param to distinguish when 2 React
element are exactly the same except for their indices, e.g `<b>one</b>
and <b>one</b>` and you want to render them differently

## [4.7.6](https://github.com/formatjs/formatjs/compare/react-intl@4.7.5...react-intl@4.7.6) (2020-07-01)

**Note:** Version bump only for package react-intl

## [4.7.5](https://github.com/formatjs/formatjs/compare/react-intl@4.7.4...react-intl@4.7.5) (2020-06-26)

**Note:** Version bump only for package react-intl

## [4.7.4](https://github.com/formatjs/formatjs/compare/react-intl@4.7.3...react-intl@4.7.4) (2020-06-26)

**Note:** Version bump only for package react-intl

## [4.7.3](https://github.com/formatjs/formatjs/compare/react-intl@4.7.2...react-intl@4.7.3) (2020-06-26)

### Bug Fixes

* **react-intl:** fix d.ts rollup ([#1741](https://github.com/formatjs/formatjs/issues/1741)) ([cb95b4a](https://github.com/formatjs/formatjs/commit/cb95b4ac230f3597fc3937e50aa5dea0107727b0))

## [4.7.2](https://github.com/formatjs/formatjs/compare/react-intl@4.7.1...react-intl@4.7.2) (2020-06-23)

**Note:** Version bump only for package react-intl

## [4.7.1](https://github.com/formatjs/formatjs/compare/react-intl@4.7.0...react-intl@4.7.1) (2020-06-23)

**Note:** Version bump only for package react-intl

# [4.7.0](https://github.com/formatjs/formatjs/compare/react-intl@4.6.10...react-intl@4.7.0) (2020-06-23)

### Features

* **@formatjs/intl-datetimeformat:** generate rolluped d.ts ([c6c9b19](https://github.com/formatjs/formatjs/commit/c6c9b19c1f2703203f341c93df46f28175456a6e)), closes [#1739](https://github.com/formatjs/formatjs/issues/1739)

## [4.6.10](https://github.com/formatjs/formatjs/compare/react-intl@4.6.9...react-intl@4.6.10) (2020-06-20)

### Bug Fixes

* **react-intl:** add children prop type to IntlProvider ([#1717](https://github.com/formatjs/formatjs/issues/1717)) ([94db34b](https://github.com/formatjs/formatjs/commit/94db34b28d7a96b44c8ade79b57e15b161ed2488))
* **react-intl:** add children typing to injectIntl ([#1716](https://github.com/formatjs/formatjs/issues/1716)) ([90fbd5f](https://github.com/formatjs/formatjs/commit/90fbd5f5deb36b615b5882d5de26d8528f8a3889))
* **react-intl:** Remove `values: {}` from FormattedMessage defaultProps ([f80648c](https://github.com/formatjs/formatjs/commit/f80648cc112fc2312c31a84b145f6c0556e76cad)), closes [#1706](https://github.com/formatjs/formatjs/issues/1706)

## [4.6.9](https://github.com/formatjs/formatjs/compare/react-intl@4.6.8...react-intl@4.6.9) (2020-06-06)

**Note:** Version bump only for package react-intl

## [4.6.8](https://github.com/formatjs/formatjs/compare/react-intl@4.6.7...react-intl@4.6.8) (2020-06-06)

**Note:** Version bump only for package react-intl

## [4.6.7](https://github.com/formatjs/formatjs/compare/react-intl@4.6.6...react-intl@4.6.7) (2020-06-06)

### Bug Fixes

* **react-intl:** Allow ES2020 options for DateTimeFormat, fix [#1695](https://github.com/formatjs/formatjs/issues/1695) ([27d02ee](https://github.com/formatjs/formatjs/commit/27d02ee6a34a67b0dca00b66a4cafbd5b628108c))

## [4.6.6](https://github.com/formatjs/formatjs/compare/react-intl@4.6.5...react-intl@4.6.6) (2020-06-04)

**Note:** Version bump only for package react-intl

## [4.6.5](https://github.com/formatjs/formatjs/compare/react-intl@4.6.4...react-intl@4.6.5) (2020-06-04)

**Note:** Version bump only for package react-intl

## [4.6.4](https://github.com/formatjs/formatjs/compare/react-intl@4.6.3...react-intl@4.6.4) (2020-06-03)

**Note:** Version bump only for package react-intl

## [4.6.3](https://github.com/formatjs/formatjs/compare/react-intl@4.6.2...react-intl@4.6.3) (2020-05-28)

**Note:** Version bump only for package react-intl

## [4.6.2](https://github.com/formatjs/formatjs/compare/react-intl@4.6.1...react-intl@4.6.2) (2020-05-28)

### Bug Fixes

* **react-intl:** export all errors, fix types ([0920323](https://github.com/formatjs/formatjs/commit/0920323b1e602de816fad0ba9c3a4aecdc2344e8))

## [4.6.1](https://github.com/formatjs/formatjs/compare/react-intl@4.6.0...react-intl@4.6.1) (2020-05-27)

### Bug Fixes

* **react-intl:** Fix formatMessage types when format function returns a string ([3de8077](https://github.com/formatjs/formatjs/commit/3de80771f4e9083cb1163b2534882b906e695df2))

# [4.6.0](https://github.com/formatjs/formatjs/compare/react-intl@4.5.12...react-intl@4.6.0) (2020-05-27)

### Bug Fixes

* **website:** editorial fixes of Intl.NumberFormat links ([#1690](https://github.com/formatjs/formatjs/issues/1690)) ([1b4a248](https://github.com/formatjs/formatjs/commit/1b4a2482ea85c4f9d3754d46c8aadd67a0b17d93))

### Features

* **formatjs-extract-cldr-data:** rm this package ([62bdd32](https://github.com/formatjs/formatjs/commit/62bdd32aadef899228a5303e01865f69fd729fa3))

## [4.5.12](https://github.com/formatjs/formatjs/compare/react-intl@4.5.11...react-intl@4.5.12) (2020-05-25)

**Note:** Version bump only for package react-intl

## [4.5.11](https://github.com/formatjs/formatjs/compare/react-intl@4.5.10...react-intl@4.5.11) (2020-05-23)

**Note:** Version bump only for package react-intl

## [4.5.10](https://github.com/formatjs/formatjs/compare/react-intl@4.5.9...react-intl@4.5.10) (2020-05-23)

**Note:** Version bump only for package react-intl

## [4.5.9](https://github.com/formatjs/formatjs/compare/react-intl@4.5.8...react-intl@4.5.9) (2020-05-22)

### Bug Fixes

* **eslint-plugin-formatjs:** add no-id to index ([8e5c0af](https://github.com/formatjs/formatjs/commit/8e5c0afe69944d52653b92c2f08e15363246834a))

## [4.5.8](https://github.com/formatjs/formatjs/compare/react-intl@4.5.7...react-intl@4.5.8) (2020-05-21)

### Bug Fixes

* **react-intl:** hot path message lookup without values ([1e58679](https://github.com/formatjs/formatjs/commit/1e58679064ba8f883849c6af384bb6650ee1b2e8))

## [4.5.7](https://github.com/formatjs/formatjs/compare/react-intl@4.5.6...react-intl@4.5.7) (2020-05-21)

**Note:** Version bump only for package react-intl

## [4.5.6](https://github.com/formatjs/formatjs/compare/react-intl@4.5.5...react-intl@4.5.6) (2020-05-21)

### Bug Fixes

* **@formatjs/intl-numberformat:** rename intl-unified-numberformat to intl-numberformat ([8f183d3](https://github.com/formatjs/formatjs/commit/8f183d314756d43b1f887af03727af349f6de731))

## [4.5.5](https://github.com/formatjs/formatjs/compare/react-intl@4.5.4...react-intl@4.5.5) (2020-05-18)

### Bug Fixes

* **react-intl:** reduce onError chattiness ([42d0ac4](https://github.com/formatjs/formatjs/commit/42d0ac433d4d31629bd2aadb2dafb49775d01aac))

## [4.5.4](https://github.com/formatjs/formatjs/compare/react-intl@4.5.3...react-intl@4.5.4) (2020-05-16)

**Note:** Version bump only for package react-intl

## [4.5.3](https://github.com/formatjs/formatjs/compare/react-intl@4.5.2...react-intl@4.5.3) (2020-05-06)

**Note:** Version bump only for package react-intl

## [4.5.2](https://github.com/formatjs/formatjs/compare/react-intl@4.5.1...react-intl@4.5.2) (2020-05-05)

### Bug Fixes

* **react-intl:** envify dist/react-intl.js so we do not leak process.env ([43a54d6](https://github.com/formatjs/formatjs/commit/43a54d61544b42d2d28776359b39f2c7a2c057ab))

## 4.5.1 (2020-04-28)

**Note:** Version bump only for package react-intl

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [4.5.0](https://github.com/formatjs/react-intl/compare/v4.4.0...v4.5.0) (2020-04-20)

### Features

* upgrade intl-messageformat & parser ([cbbd6cf](https://github.com/formatjs/react-intl/commit/cbbd6cf93ee6294bdfbc28af3e33227df0e621e4))

## [4.4.0](https://github.com/formatjs/react-intl/compare/v4.3.1...v4.4.0) (2020-04-14)

### Features

* add `defineMessage` macro to tag single message ([8bd9ad8](https://github.com/formatjs/react-intl/commit/8bd9ad8ddf632f500f4b3e0e7786a48c227c9961))

### [4.3.1](https://github.com/formatjs/react-intl/compare/v4.3.0...v4.3.1) (2020-03-28)

### Bug Fixes

* tweak FormatXMLElementFn ([a914dc0](https://github.com/formatjs/react-intl/commit/a914dc059cc8d0c04baec6a63513cb686ff6dad3))

## [4.3.0](https://github.com/formatjs/react-intl/compare/v4.2.2...v4.3.0) (2020-03-26)

### Features

* **react-intl:** store original message descriptor in the error ([22531bd](https://github.com/formatjs/react-intl/commit/22531bde78e0f3846b583b5bf0e4115e872f9a54))

### [4.2.2](https://github.com/formatjs/react-intl/compare/v4.2.1...v4.2.2) (2020-03-21)

### Bug Fixes

* turn on preserveConstEnums so we export ReactIntlErrorCode ([8e00610](https://github.com/formatjs/react-intl/commit/8e006105a7286aba0efdb985eb588d03597b186b))

### [4.2.1](https://github.com/formatjs/react-intl/compare/v4.2.0...v4.2.1) (2020-03-21)

### Bug Fixes

* include intl-displaynames types in bundled react-intl.d.ts ([77ef36c](https://github.com/formatjs/react-intl/commit/77ef36cb2f522587c454469241d9a4974963ccb8))

## [4.2.0](https://github.com/formatjs/react-intl/compare/v4.1.1...v4.2.0) (2020-03-21)

### Features

* add wrapRichTextChunksInFragment option ([7864e1c](https://github.com/formatjs/react-intl/commit/7864e1c8704b5aba3d82d8318f94ef789e045d04))

### [4.1.1](https://github.com/formatjs/react-intl/compare/v4.1.0...v4.1.1) (2020-03-06)

### Bug Fixes

* dont warn if locale is the same as defaultLocale ([c8b178b](https://github.com/formatjs/react-intl/commit/c8b178b1e825b3e1abc2417c3ec60d92ab1911f6)), closes [#1594](https://github.com/formatjs/react-intl/issues/1594)

## [4.1.0](https://github.com/formatjs/react-intl/compare/v4.0.0...v4.1.0) (2020-03-05)

### Features

* Introduce ReactIntlErrorCode so we can distinguish and log things differently ([5b2b034](https://github.com/formatjs/react-intl/commit/5b2b034b0afd03479943cf4d1162be532deb95b8))

## [4.0.0](https://github.com/formatjs/react-intl/compare/v3.12.1...v4.0.0) (2020-03-05)

### ⚠ BREAKING CHANGES

* This release contains subtle changes to the way we handle embedded HTML Message:

1. All tags specified must have corresponding values and will throw
error if it's missing, e.g:
```
new IntlMessageFormat("a<b>strong</b>").format({ b: (...chunks) => <strong>chunks</strong> })
```
2. We don't allow formatting self-closing tags because we already use ICU `{placeholder}` syntax for that.
3. XML/HTML tags are escaped using apostrophe just like other ICU constructs.
4. Remove dependency on DOMParser and restrictions on void element like `<link>`. This effectively means you don't need to polyfill DOMParser in Node anymore.
5. `FormattedHTMLMessage` & `intl.formatHTMLMessage` have been removed since `FormattedMessage` now fully supports embedded HTML tag.

Why are we doing those changes?
- `FormattedHTMLMessage` & `intl.formatHTMLMessage` were originally created when React was fairly new. These components helped ease migration over from raw HTML to JSX. Given that current popularity of React right now and the fact that `FormattedMessage` allow rendering embedded HTML tag, this is no longer needed.
- Initially during the 1st iteration of embedded HTML support, we allow any tag that doesn’t have a corresponding formatter to be rendered as raw HTML. We’ve received feedbacks internally that allowing embedded HTML tag to be rendered as-is without sanitization is a XSS security risk. Therefore, in order to allow raw HTML tag you have to opt-in by escaping them using apostrophe. We will update our linter to check for this as well.

### Features

* Upgrade intl-messageformat & intl-messageformat-parser, remove FormattedHTMLMessage ([fae69e9](https://github.com/formatjs/react-intl/commit/fae69e9da2cfd395eeb5d7333a637f6627d94ade))

### [3.12.1](https://github.com/formatjs/react-intl/compare/v3.12.0...v3.12.1) (2020-03-04)

### Bug Fixes

* clarify err messages ([b207d80](https://github.com/formatjs/react-intl/commit/b207d805a9e5609983ac1b2ca8f9708030e12337))
* inline defineMessages macro, fix [#1592](https://github.com/formatjs/react-intl/issues/1592) ([5ae8349](https://github.com/formatjs/react-intl/commit/5ae8349dc2ee08b54a54a2a521b8a9c052960d04))

## [3.12.0](https://github.com/formatjs/react-intl/compare/v3.11.0...v3.12.0) (2020-02-04)

### Features

* add formatDisplayName and FormattedDisplayName ([#1567](https://github.com/formatjs/react-intl/issues/1567)) ([10bcbe2](https://github.com/formatjs/react-intl/commit/10bcbe2e7e92902d60810a7c00568d3043b09db3)), closes [#1547](https://github.com/formatjs/react-intl/issues/1547)

## [3.11.0](https://github.com/formatjs/react-intl/compare/v3.10.0...v3.11.0) (2020-01-09)

### Features

* Allow MessageDescriptor ID to be `number` ([#1553](https://github.com/formatjs/react-intl/issues/1553)) ([95298b2](https://github.com/formatjs/react-intl/commit/95298b2b5f09173258fe9648d49fc9fa1ad673fc))

### Bug Fixes

* add a parser for chunks emitted from formatHTMLMessage ([#1550](https://github.com/formatjs/react-intl/issues/1550)) ([8c3c5c7](https://github.com/formatjs/react-intl/commit/8c3c5c78afa16d605933c82571f3b92b15363c27))
* update formatjs deps ([1745c21](https://github.com/formatjs/react-intl/commit/1745c21b9ae5e6443f1ad5209f77cc9cb6ad66eb))

## [3.10.0](https://github.com/formatjs/react-intl/compare/v3.9.2...v3.10.0) (2019-12-26)

### Features

* Upgrade intl-unified-numberformat & TypeScript ([ddf411a](https://github.com/formatjs/react-intl/commit/ddf411a6089005671f3d1ab8d11e04564da0f2e7))

### [3.9.2](https://github.com/formatjs/react-intl/compare/v3.9.1...v3.9.2) (2019-12-10)

### Bug Fixes

* add type overload for formatList, fix [#1537](https://github.com/formatjs/react-intl/issues/1537) ([6629899](https://github.com/formatjs/react-intl/commit/662989973c8d08f7972a3ba75f70b19abc507bb9))
* fix list formatter generation types ([0e5f205](https://github.com/formatjs/react-intl/commit/0e5f2058d7cba2d886693e219f58366582f0a6ac))

### [3.9.1](https://github.com/formatjs/react-intl/compare/v3.9.0...v3.9.1) (2019-12-02)

### Bug Fixes

* Add src to packaged tar for sourcemap ([bce9bc7](https://github.com/formatjs/react-intl/commit/bce9bc7f6e014ec5ac1d67aa5daedc9214b75297))

## [3.9.0](https://github.com/formatjs/react-intl/compare/v3.8.0...v3.9.0) (2019-12-02)

### Features

* Upgrade intl-messageformat-parser with support for unit-width in skeleton ([4b8f09f](https://github.com/formatjs/react-intl/commit/4b8f09f567ea09c5f5b576113ed963523832f942))

## [3.8.0](https://github.com/formatjs/react-intl/compare/v3.7.0...v3.8.0) (2019-12-01)

### Features

* Upgrade intl-messageformat-parser ([c12c99d](https://github.com/formatjs/react-intl/commit/c12c99dfdd8dfabf3d0103ce3c02e35b22d03be6))

Following our previous release with preliminary DateTimeFormat's
skeleton parser, this release comes with a subset of ICU NumberFormat's
skeleton parser. The full feature set can be found [here](unicode-org/icu:docs/userguide/format_parse/numbers/skeletons.md@master).

This, in combination with [intl-unified-numberformat](tc39/proposal-unified-intl-numberformat) allows you to write shorthand
NumberFormat in your messages like `{amount, number, ::currency/CAD .00}`

## [3.7.0](https://github.com/formatjs/react-intl/compare/v3.6.2...v3.7.0) (2019-11-25)

### Features

* Introduce support for DateTime skeleton ([568d013](https://github.com/formatjs/react-intl/commit/568d01342299135e9b049f9d4014193315fac41e))

This bumps the version of `intl-messageformat`, thus introducing a
subset of
[DateTime Skeleton](https://github.com/formatjs/formatjs/tree/master/packages/intl-messageformat-parser#supported-datetime-skeleton)
to react-intl.
The skeleton syntax per ICU is `today is {ts, time, ::yyyyMMdd}`.
Further documentation can be read at
https://unicode-org.github.io/icu/userguide/format_parse/datetimedatetime.

### [3.6.2](https://github.com/formatjs/react-intl/compare/v3.6.1...v3.6.2) (2019-11-21)

### Bug Fixes

* fix main types file path in package.json ([14048bb](https://github.com/formatjs/react-intl/commit/14048bba41a7e02a8a0669ef14aa510acb089dc9))

### [3.6.1](https://github.com/formatjs/react-intl/compare/v3.6.0...v3.6.1) (2019-11-19)

### Bug Fixes

* make `id` optional in MessageDescriptor ([15ca429](https://github.com/formatjs/react-intl/commit/15ca4292faf0fd82a392c024f027196393e52124))
* use `files` instead of .npmignore, update contributors ([b0c0fdb](https://github.com/formatjs/react-intl/commit/b0c0fdb1efa4dd9dfcf1d8c5709c5454bf242fce))

## [3.6.0](https://github.com/formatjs/react-intl/compare/v3.4.0...v3.6.0) (2019-11-12)

### Bug Fixes

* remove babel.config.js from npm package ([5c1f1ed](https://github.com/formatjs/react-intl/commit/5c1f1ed)), closes [#1512](https://github.com/formatjs/react-intl/issues/1512)

## [3.5.0](https://github.com/formatjs/react-intl/compare/v3.4.0...v3.5.0) (2019-11-10)

### Features

* add `formatList` & `FormattedList` ([#1494](https://github.com/formatjs/react-intl/issues/1494)) ([f5eacbf](https://github.com/formatjs/react-intl/commit/f5eacbf))
* alias `defineMessages` to `@formatjs/macro` and deprecate our own ([f6ab2f1](https://github.com/formatjs/react-intl/commit/f6ab2f1))

## [3.4.0](https://github.com/formatjs/react-intl/compare/v3.3.2...v3.4.0) (2019-10-23)

### Bug Fixes

* fix format merging for message ([0a564dc](https://github.com/formatjs/react-intl/commit/0a564dc)), closes [#1500](https://github.com/formatjs/react-intl/issues/1500)

### Features

* add support for unified numberformat new options, fix [#1501](https://github.com/formatjs/react-intl/issues/1501) ([ff2629b](https://github.com/formatjs/react-intl/commit/ff2629b))

### [3.3.2](https://github.com/formatjs/react-intl/compare/v3.3.1...v3.3.2) (2019-09-27)

### Bug Fixes

* merge timeZone into formats when formatting message ([aea3f56](https://github.com/formatjs/react-intl/commit/aea3f56)), closes [#1219](https://github.com/formatjs/react-intl/issues/1219)
* remove custom unescaping of static message ([aefb68b](https://github.com/formatjs/react-intl/commit/aefb68b))

### [3.3.1](https://github.com/formatjs/react-intl/compare/v3.3.0...v3.3.1) (2019-09-26)

### Bug Fixes

* properly override timeZone in formats/defaultFormats ([f2b93e6](https://github.com/formatjs/react-intl/commit/f2b93e6)), closes [#1219](https://github.com/formatjs/react-intl/issues/1219)

## [3.3.0](https://github.com/formatjs/react-intl/compare/v3.2.3...v3.3.0) (2019-09-19)

### Bug Fixes

* fix copy-paste issue in polyfill, fixes [#1488](https://github.com/formatjs/react-intl/issues/1488) ([0f9ec81](https://github.com/formatjs/react-intl/commit/0f9ec81))

### Features

* mark react-intl as side effect free ([704a964](https://github.com/formatjs/react-intl/commit/704a964))

### [3.2.4](https://github.com/formatjs/react-intl/compare/v3.2.3...v3.2.4) (2019-09-19)

### Bug Fixes

* fix copy-paste issue in polyfill, fixes [#1488](https://github.com/formatjs/react-intl/issues/1488) ([0f9ec81](https://github.com/formatjs/react-intl/commit/0f9ec81))

### [3.2.3](https://github.com/formatjs/react-intl/compare/v3.2.1...v3.2.3) (2019-09-18)

### Bug Fixes

* check PluralRules & RelativeTimeFormat lazily instead ([3ed95fe](https://github.com/formatjs/react-intl/commit/3ed95fe)), closes [#1487](https://github.com/formatjs/react-intl/issues/1487)

### [3.2.2](https://github.com/formatjs/react-intl/compare/v3.2.1...v3.2.2) (2019-09-17)

### [3.2.1](https://github.com/formatjs/react-intl/compare/v3.2.0...v3.2.1) (2019-09-09)

### Bug Fixes

* upgrade intl-messageformat ([40aa758](https://github.com/formatjs/react-intl/commit/40aa758))

## [3.2.0](https://github.com/formatjs/react-intl/compare/v3.2.0-rc.2...v3.2.0) (2019-09-04)

## [3.2.0-rc.2](https://github.com/formatjs/react-intl/compare/v3.2.0-rc.1...v3.2.0-rc.2) (2019-08-29)

### Bug Fixes

* fix tests & add corresponding formatToParts fns ([855e272](https://github.com/formatjs/react-intl/commit/855e272))

### Features

* extend numberformat to unified ([#1462](https://github.com/formatjs/react-intl/issues/1462)) ([a7f2104](https://github.com/formatjs/react-intl/commit/a7f2104))

## [3.2.0-rc.1](https://github.com/formatjs/react-intl/compare/v3.2.0-rc.0...v3.2.0-rc.1) (2019-08-29)

## [3.2.0-rc.0](https://github.com/formatjs/react-intl/compare/v3.1.2...v3.2.0-rc.0) (2019-08-29)

### Features

* add support for formatToParts ([e8167f3](https://github.com/formatjs/react-intl/commit/e8167f3))
* introduce Parts component ([a1b5ff1](https://github.com/formatjs/react-intl/commit/a1b5ff1)), closes [#1048](https://github.com/formatjs/react-intl/issues/1048)

### [3.1.13](https://github.com/formatjs/react-intl/compare/v3.1.12...v3.1.13) (2019-08-28)

### Bug Fixes

* handle relative time when it hits 0 ([3b9df15](https://github.com/formatjs/react-intl/commit/3b9df15)), closes [#1455](https://github.com/formatjs/react-intl/issues/1455)

### [3.1.12](https://github.com/formatjs/react-intl/compare/v3.1.11...v3.1.12) (2019-08-26)

### Bug Fixes

* type def for forwardRef in injectIntl, fix [#1444](https://github.com/formatjs/react-intl/issues/1444) ([45887bf](https://github.com/formatjs/react-intl/commit/45887bf))
* update intl-messageformat ([d1271b6](https://github.com/formatjs/react-intl/commit/d1271b6)), closes [#1451](https://github.com/formatjs/react-intl/issues/1451) [#1442](https://github.com/formatjs/react-intl/issues/1442)

### [3.1.11](https://github.com/formatjs/react-intl/compare/v3.1.10...v3.1.11) (2019-08-21)

### Bug Fixes

* remove params spread, potentially fix [#1424](https://github.com/formatjs/react-intl/issues/1424) ([aeb177c](https://github.com/formatjs/react-intl/commit/aeb177c))

### [3.1.10](https://github.com/formatjs/react-intl/compare/v3.1.9...v3.1.10) (2019-08-20)

### Bug Fixes

* fix UMD build ([fc17473](https://github.com/formatjs/react-intl/commit/fc17473)), closes [#1423](https://github.com/formatjs/react-intl/issues/1423)
* fix UMD build, defer react-is to external ([4731805](https://github.com/formatjs/react-intl/commit/4731805))

### [3.1.9](https://github.com/formatjs/react-intl/compare/v3.1.8...v3.1.9) (2019-08-16)

### Bug Fixes

* fix UMD build ([ad78e3f](https://github.com/formatjs/react-intl/commit/ad78e3f)), closes [#1423](https://github.com/formatjs/react-intl/issues/1423)
* move react & @types/react to devDep, fixes [#1389](https://github.com/formatjs/react-intl/issues/1389) ([0133241](https://github.com/formatjs/react-intl/commit/0133241)), closes [/github.com/yarnpkg/yarn/issues/3951#issuecomment-316424639](https://github.com/formatjs//github.com/yarnpkg/yarn/issues/3951/issues/issuecomment-316424639)

### [3.1.8](https://github.com/formatjs/react-intl/compare/v3.1.7...v3.1.8) (2019-08-13)

### Bug Fixes

* remove injectIntl types from component props ([#1415](https://github.com/formatjs/react-intl/issues/1415)) ([9b359ec](https://github.com/formatjs/react-intl/commit/9b359ec)), closes [#1414](https://github.com/formatjs/react-intl/issues/1414)

### [3.1.7](https://github.com/formatjs/react-intl/compare/v3.1.5...v3.1.7) (2019-08-13)

### Bug Fixes

* avoid wrapping components with injectIntl ([#1413](https://github.com/formatjs/react-intl/issues/1413)), fixes [#1412](https://github.com/formatjs/react-intl/issues/1412) ([ce560e7](https://github.com/formatjs/react-intl/commit/ce560e7))
* fix state typo, fixes [#1411](https://github.com/formatjs/react-intl/issues/1411) ([46ad1c8](https://github.com/formatjs/react-intl/commit/46ad1c8))

### [3.1.6](https://github.com/formatjs/react-intl/compare/v3.1.5...v3.1.6) (2019-08-12)

### Bug Fixes

* fix state typo, fixes [#1411](https://github.com/formatjs/react-intl/issues/1411) ([46ad1c8](https://github.com/formatjs/react-intl/commit/46ad1c8))

### [3.1.5](https://github.com/formatjs/react-intl/compare/v3.1.4...v3.1.5) (2019-08-11)

### Bug Fixes

* drop @types/react version to 16.0 ([1669f0e](https://github.com/formatjs/react-intl/commit/1669f0e))

### [3.1.4](https://github.com/formatjs/react-intl/compare/v3.1.3...v3.1.4) (2019-08-11)

### Bug Fixes

* Fix broken links in Getting Started (fix [#1403](https://github.com/formatjs/react-intl/issues/1403)) ([#1405](https://github.com/formatjs/react-intl/issues/1405)) ([57f0748](https://github.com/formatjs/react-intl/commit/57f0748))
* generate lib instead of mjs ([99f9257](https://github.com/formatjs/react-intl/commit/99f9257)), closes [#1395](https://github.com/formatjs/react-intl/issues/1395) [#1407](https://github.com/formatjs/react-intl/issues/1407)

### [3.1.3](https://github.com/formatjs/react-intl/compare/v3.1.1...v3.1.3) (2019-08-09)

### Bug Fixes

* allow string in formatDate & formatTime ([aed8c68](https://github.com/formatjs/react-intl/commit/aed8c68)), closes [#1396](https://github.com/formatjs/react-intl/issues/1396)
* create initial intl for Provider ([4306275](https://github.com/formatjs/react-intl/commit/4306275))
* formatRelativeTime type def unit param ([cb7da58](https://github.com/formatjs/react-intl/commit/cb7da58))
* remove contextType usage ([660a546](https://github.com/formatjs/react-intl/commit/660a546))

### [3.1.2](https://github.com/formatjs/react-intl/compare/v3.1.1...v3.1.2) (2019-08-09)

### Bug Fixes

* allow string in formatDate & formatTime ([aed8c68](https://github.com/formatjs/react-intl/commit/aed8c68)), closes [#1396](https://github.com/formatjs/react-intl/issues/1396)
* formatRelativeTime type def unit param ([cb7da58](https://github.com/formatjs/react-intl/commit/cb7da58))
* remove contextType usage ([660a546](https://github.com/formatjs/react-intl/commit/660a546))

### [3.1.1](https://github.com/yahoo/react-intl/compare/v3.1.0...v3.1.1) (2019-08-02)

### Bug Fixes

* only createIntl from filteredProps ([d665f31](https://github.com/yahoo/react-intl/commit/d665f31))

## [3.1.0](https://github.com/yahoo/react-intl/compare/v3.0.0...v3.1.0) (2019-08-06)

### Bug Fixes

* add "types" property to package.json ([#1394](https://github.com/yahoo/react-intl/issues/1394)) ([a82ddd0](https://github.com/yahoo/react-intl/commit/a82ddd0))
* add createIntlCache to top level index, fixes [#1393](https://github.com/yahoo/react-intl/issues/1393) ([19398d7](https://github.com/yahoo/react-intl/commit/19398d7))

### Features

* generate .mjs instead of lib ([5fd070d](https://github.com/yahoo/react-intl/commit/5fd070d))

## [3.0.0](https://github.com/yahoo/react-intl/compare/v3.0.0-beta.23...v3.0.0) (2019-08-06)

### Bug Fixes

* rm core pkg for now ([223d2cf](https://github.com/yahoo/react-intl/commit/223d2cf))
* rm rollup for core, reduce @types/react version ([336d365](https://github.com/yahoo/react-intl/commit/336d365))
* type definitions and make behavior match spec more ([2030bdd](https://github.com/yahoo/react-intl/commit/2030bdd))

## [3.0.0-beta.23](https://github.com/yahoo/react-intl/compare/v3.0.0-beta.22...v3.0.0-beta.23) (2019-08-02)

### Features

- simplify provider inheritance, add new APIs ([#1387](https://github.com/yahoo/react-intl/issues/1387)) ([227a444](https://github.com/yahoo/react-intl/commit/227a444)), closes [#1386](https://github.com/yahoo/react-intl/issues/1386) [#1376](https://github.com/yahoo/react-intl/issues/1376)

## [3.0.0-beta.22](https://github.com/yahoo/react-intl/compare/v3.0.0-beta.21...v3.0.0-beta.22) (2019-07-29)

### Bug Fixes

- rm componentWillReceiveProps from relative ([964159b](https://github.com/yahoo/react-intl/commit/964159b))

### Features

- upgrade intl-messageformat with new apostrophe escape ([f59607e](https://github.com/yahoo/react-intl/commit/f59607e))

## [3.0.0-beta.21](https://github.com/yahoo/react-intl/compare/v3.0.0-beta.20...v3.0.0-beta.21) (2019-07-28)

### Bug Fixes

- fix doc for rich text formatting ([00cbf80](https://github.com/yahoo/react-intl/commit/00cbf80))
- FormattedRelativeTime with high seconds values ([#1385](https://github.com/yahoo/react-intl/issues/1385)) ([a7f1dfa](https://github.com/yahoo/react-intl/commit/a7f1dfa))

## [3.0.0-beta.20](https://github.com/yahoo/react-intl/compare/v3.0.0-beta.19...v3.0.0-beta.20) (2019-07-25)

### Bug Fixes

- upgrade intl-messageformat and tests ([1dfe7fd](https://github.com/yahoo/react-intl/commit/1dfe7fd))

## [3.0.0-beta.19](https://github.com/yahoo/react-intl/compare/v3.0.0-beta.18...v3.0.0-beta.19) (2019-07-25)

### Features

- allow formatDate and formatTime to take string type ([#1369](https://github.com/yahoo/react-intl/issues/1369)) ([d110548](https://github.com/yahoo/react-intl/commit/d110548))
- Allow formatting embedded XML ([#1379](https://github.com/yahoo/react-intl/issues/1379)) ([61d3c1b](https://github.com/yahoo/react-intl/commit/61d3c1b))
- Upgrade guide implementing RelativeTime behavior ([#1374](https://github.com/yahoo/react-intl/issues/1374)) ([f8ddcd0](https://github.com/yahoo/react-intl/commit/f8ddcd0))

## [3.0.0-beta.18](https://github.com/yahoo/react-intl/compare/v3.0.0-beta.17...v3.0.0-beta.18) (2019-07-12)

### Bug Fixes

- **types:** Change type to allow autocompletion and existence checking ([#1368](https://github.com/yahoo/react-intl/issues/1368)) ([20d39e6](https://github.com/yahoo/react-intl/commit/20d39e6))

### Features

- make `formatMessage` take in `ReactElement` ([#1367](https://github.com/yahoo/react-intl/issues/1367)) ([15ed625](https://github.com/yahoo/react-intl/commit/15ed625))

## [3.0.0-beta.17](https://github.com/yahoo/react-intl/compare/v3.0.0-beta.16...v3.0.0-beta.17) (2019-07-11)

### Bug Fixes

- add default tagName to HTML message ([#1361](https://github.com/yahoo/react-intl/issues/1361)) ([e86befe](https://github.com/yahoo/react-intl/commit/e86befe))

## [3.0.0-beta.16](https://github.com/yahoo/react-intl/compare/v3.0.0-beta.15...v3.0.0-beta.16) (2019-07-09)

### Features

- expose a core bundle w/o parser ([#1358](https://github.com/yahoo/react-intl/issues/1358)) ([0a6ca3f](https://github.com/yahoo/react-intl/commit/0a6ca3f))
- support textComponent="", fixes [#1330](https://github.com/yahoo/react-intl/issues/1330) ([#1354](https://github.com/yahoo/react-intl/issues/1354)) ([3f27902](https://github.com/yahoo/react-intl/commit/3f27902))
- upgrade formatjs dev ([#1357](https://github.com/yahoo/react-intl/issues/1357)) ([61b536b](https://github.com/yahoo/react-intl/commit/61b536b))

## [3.0.0-beta.15](https://github.com/yahoo/react-intl/compare/v3.0.0-beta-8...v3.0.0-beta.15) (2019-06-28)

### Bug Fixes

- escape defaultMessage properly, fixes [#1158](https://github.com/yahoo/react-intl/issues/1158) ([#1345](https://github.com/yahoo/react-intl/issues/1345)) ([96e9bae](https://github.com/yahoo/react-intl/commit/96e9bae))
- reduce TS version to 3.3 ([#1348](https://github.com/yahoo/react-intl/issues/1348)) ([6dfef2b](https://github.com/yahoo/react-intl/commit/6dfef2b))
- **deps:** move @formatjs/intl-relativetimeformat to deps ([#1349](https://github.com/yahoo/react-intl/issues/1349)) ([310bb62](https://github.com/yahoo/react-intl/commit/310bb62))

### Features

- add standard-version ([b656847](https://github.com/yahoo/react-intl/commit/b656847))
- pass in formatters to IntlMessageFormat for perf ([#1343](https://github.com/yahoo/react-intl/issues/1343)) ([303a4ea](https://github.com/yahoo/react-intl/commit/303a4ea))
- switch to npm ([#1334](https://github.com/yahoo/react-intl/issues/1334)) ([0eab294](https://github.com/yahoo/react-intl/commit/0eab294))
- Use React.Fragment as default textComponent ([#1326](https://github.com/yahoo/react-intl/issues/1326)) ([6e03fa3](https://github.com/yahoo/react-intl/commit/6e03fa3))
- **types:** export WithIntlProps ([#1350](https://github.com/yahoo/react-intl/issues/1350)) ([16d7ed9](https://github.com/yahoo/react-intl/commit/16d7ed9))
- **types:** export WrappedComponentProps ([#1351](https://github.com/yahoo/react-intl/issues/1351)) ([af650b4](https://github.com/yahoo/react-intl/commit/af650b4))

## [3.0.0-beta.14](https://github.com/yahoo/react-intl/compare/v3.0.0-beta.13...v3.0.0-beta.14) (2019-07-03)

### Bug Fixes

- **deps:** move @formatjs/intl-relativetimeformat to deps ([#1349](https://github.com/yahoo/react-intl/issues/1349)) ([310bb62](https://github.com/yahoo/react-intl/commit/310bb62))

## [3.0.0-beta.13](https://github.com/yahoo/react-intl/compare/v3.0.0-beta.12...v3.0.0-beta.13) (2019-07-03)

### Bug Fixes

- escape defaultMessage properly, fixes [#1158](https://github.com/yahoo/react-intl/issues/1158) ([#1345](https://github.com/yahoo/react-intl/issues/1345)) ([96e9bae](https://github.com/yahoo/react-intl/commit/96e9bae))
- reduce TS version to 3.3 ([#1348](https://github.com/yahoo/react-intl/issues/1348)) ([6dfef2b](https://github.com/yahoo/react-intl/commit/6dfef2b))

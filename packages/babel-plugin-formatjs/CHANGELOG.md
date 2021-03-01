# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [9.2.2](https://github.com/formatjs/formatjs/compare/babel-plugin-formatjs@9.2.1...babel-plugin-formatjs@9.2.2) (2021-03-01)

**Note:** Version bump only for package babel-plugin-formatjs





## [9.2.1](https://github.com/formatjs/formatjs/compare/babel-plugin-formatjs@9.2.0...babel-plugin-formatjs@9.2.1) (2021-02-25)


### Bug Fixes

* bump tslib version dep ([37577d2](https://github.com/formatjs/formatjs/commit/37577d22bf28d23de1d8013ba0047cf221ad8840)), closes [#2645](https://github.com/formatjs/formatjs/issues/2645)





# [9.2.0](https://github.com/formatjs/formatjs/compare/babel-plugin-formatjs@9.1.4...babel-plugin-formatjs@9.2.0) (2021-02-25)


### Features

* **babel-plugin-formatjs:** relax function call check to allow foobar.formatMessage ([d26dfdd](https://github.com/formatjs/formatjs/commit/d26dfdd0bf431b00df6bd7411e3fd4ff98b6e2b4))





## [9.1.4](https://github.com/formatjs/formatjs/compare/babel-plugin-formatjs@9.1.3...babel-plugin-formatjs@9.1.4) (2021-02-25)

**Note:** Version bump only for package babel-plugin-formatjs





## [9.1.3](https://github.com/formatjs/formatjs/compare/babel-plugin-formatjs@9.1.2...babel-plugin-formatjs@9.1.3) (2021-02-22)

**Note:** Version bump only for package babel-plugin-formatjs





## [9.1.2](https://github.com/formatjs/formatjs/compare/babel-plugin-formatjs@9.1.1...babel-plugin-formatjs@9.1.2) (2021-02-21)

**Note:** Version bump only for package babel-plugin-formatjs





## [9.1.1](https://github.com/formatjs/formatjs/compare/babel-plugin-formatjs@9.1.0...babel-plugin-formatjs@9.1.1) (2021-02-21)

**Note:** Version bump only for package babel-plugin-formatjs





# [9.1.0](https://github.com/formatjs/formatjs/compare/babel-plugin-formatjs@9.0.4...babel-plugin-formatjs@9.1.0) (2021-02-13)


### Features

* **babel-plugin-formatjs:** support preserving whitespace and newlines ([0172f46](https://github.com/formatjs/formatjs/commit/0172f46e3e4b554c25579bb7c3563b2879522d91))





## [9.0.4](https://github.com/formatjs/formatjs/compare/babel-plugin-formatjs@9.0.3...babel-plugin-formatjs@9.0.4) (2021-01-27)

**Note:** Version bump only for package babel-plugin-formatjs





## [9.0.3](https://github.com/formatjs/formatjs/compare/babel-plugin-formatjs@9.0.2...babel-plugin-formatjs@9.0.3) (2021-01-26)

**Note:** Version bump only for package babel-plugin-formatjs





## [9.0.2](https://github.com/formatjs/formatjs/compare/babel-plugin-formatjs@9.0.1...babel-plugin-formatjs@9.0.2) (2021-01-25)

**Note:** Version bump only for package babel-plugin-formatjs





## [9.0.1](https://github.com/formatjs/formatjs/compare/babel-plugin-formatjs@9.0.0...babel-plugin-formatjs@9.0.1) (2021-01-05)

**Note:** Version bump only for package babel-plugin-formatjs





# [9.0.0](https://github.com/formatjs/formatjs/compare/babel-plugin-formatjs@8.4.0...babel-plugin-formatjs@9.0.0) (2021-01-04)


### Bug Fixes

* **babel-plugin-formatjs:** fix package description ([69c509d](https://github.com/formatjs/formatjs/commit/69c509dc7a7d76c37263bb6b185af26c939a7028))


### Features

* **babel-plugin-formatjs:** change result metadata key from react-intl to formatjs ([73a8d2f](https://github.com/formatjs/formatjs/commit/73a8d2f01977aa16055dfe275a2f66584e279a10))
* **babel-plugin-formatjs:** remove moduleSourceName and extractFromFormatMessageCall (on by default) ([e310baf](https://github.com/formatjs/formatjs/commit/e310baf561b0313f251d16e9b97109cd40cbcf0e))


### BREAKING CHANGES

* **babel-plugin-formatjs:** `moduleSourceName` is not relevant and used a whole
lot. We've removed `extractFromFormatMessageCall` and turn it on by
default to avoid config confusion.
* **babel-plugin-formatjs:** If you use this plugin programmatically,
`metadata['react-int']` is now `metadata['formatjs']`





# [8.4.0](https://github.com/formatjs/formatjs/compare/babel-plugin-formatjs@8.3.0...babel-plugin-formatjs@8.4.0) (2021-01-04)


### Features

* **babel-plugin-formatjs:** add additionalFunctionNames feature to extract from custom function calls ([043ac50](https://github.com/formatjs/formatjs/commit/043ac509da0e55a8639877a35550df81385a3155))





# 8.3.0 (2021-01-04)


### Features

* **babel-plugin-formatjs:** rename babel-plugin-react-intl to babel-plugin-formatjs ([c9357b7](https://github.com/formatjs/formatjs/commit/c9357b7968c3c7e5c9335ff0058e47da0cb5c6c7))





## [8.2.25](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.24...babel-plugin-react-intl@8.2.25) (2021-01-04)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.2.24](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.23...babel-plugin-react-intl@8.2.24) (2021-01-02)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.2.23](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.22...babel-plugin-react-intl@8.2.23) (2021-01-01)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.2.22](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.21...babel-plugin-react-intl@8.2.22) (2020-12-17)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.2.21](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.20...babel-plugin-react-intl@8.2.21) (2020-11-27)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.2.20](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.19...babel-plugin-react-intl@8.2.20) (2020-11-26)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.2.19](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.18...babel-plugin-react-intl@8.2.19) (2020-11-20)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.2.18](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.17...babel-plugin-react-intl@8.2.18) (2020-11-19)


### Bug Fixes

* **babel-plugin-react-intl:** idInterpolationPattern ([#2311](https://github.com/formatjs/formatjs/issues/2311)) ([2cb1249](https://github.com/formatjs/formatjs/commit/2cb1249ef68b04ca75c0ce2d1e55ec1086de2532))





## [8.2.17](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.16...babel-plugin-react-intl@8.2.17) (2020-11-12)


### Bug Fixes

* **babel-plugin-react-intl:** fix babel crash with `removeDefaultMessage` ([#2306](https://github.com/formatjs/formatjs/issues/2306)) ([847bee8](https://github.com/formatjs/formatjs/commit/847bee8c084e0093dc233d578719aff3702a7939)), closes [#2305](https://github.com/formatjs/formatjs/issues/2305)





## [8.2.16](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.15...babel-plugin-react-intl@8.2.16) (2020-11-10)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.2.15](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.14...babel-plugin-react-intl@8.2.15) (2020-11-09)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.2.14](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.13...babel-plugin-react-intl@8.2.14) (2020-11-09)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.2.13](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.12...babel-plugin-react-intl@8.2.13) (2020-11-05)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.2.12](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.11...babel-plugin-react-intl@8.2.12) (2020-11-05)


### Bug Fixes

* **babel-plugin-react-intl:** lock down monorepo dep version ([652daa7](https://github.com/formatjs/formatjs/commit/652daa754a91e35384a4a17f64916478126696e2))





## [8.2.11](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.10...babel-plugin-react-intl@8.2.11) (2020-11-04)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.2.10](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.9...babel-plugin-react-intl@8.2.10) (2020-10-28)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.2.9](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.8...babel-plugin-react-intl@8.2.9) (2020-10-27)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.2.8](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.7...babel-plugin-react-intl@8.2.8) (2020-10-25)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.2.7](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.6...babel-plugin-react-intl@8.2.7) (2020-10-10)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.2.6](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.5...babel-plugin-react-intl@8.2.6) (2020-10-08)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.2.5](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.4...babel-plugin-react-intl@8.2.5) (2020-10-01)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.2.4](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.3...babel-plugin-react-intl@8.2.4) (2020-09-25)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.2.3](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.2...babel-plugin-react-intl@8.2.3) (2020-09-18)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.2.2](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.1...babel-plugin-react-intl@8.2.2) (2020-09-12)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.2.1](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.2.0...babel-plugin-react-intl@8.2.1) (2020-09-09)

**Note:** Version bump only for package babel-plugin-react-intl





# [8.2.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.1.11...babel-plugin-react-intl@8.2.0) (2020-09-03)


### Features

* **babel-plugin-react-intl:** trim trailing/leading spaces, newlines & consecutive whitespaces ([9d0ead2](https://github.com/formatjs/formatjs/commit/9d0ead288c7f2de8047de658d604e810664236d8)), closes [#2028](https://github.com/formatjs/formatjs/issues/2028)





## [8.1.11](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.1.10...babel-plugin-react-intl@8.1.11) (2020-08-30)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.1.10](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.1.9...babel-plugin-react-intl@8.1.10) (2020-08-28)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.1.9](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.1.8...babel-plugin-react-intl@8.1.9) (2020-08-25)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.1.8](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.1.7...babel-plugin-react-intl@8.1.8) (2020-08-22)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.1.7](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.1.6...babel-plugin-react-intl@8.1.7) (2020-08-21)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.1.6](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.1.5...babel-plugin-react-intl@8.1.6) (2020-08-20)


### Bug Fixes

* bump intl-messageformat-parser ([8bbfa04](https://github.com/formatjs/formatjs/commit/8bbfa047da159662700b7e500879da20e54c0f0b))





## [8.1.5](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.1.4...babel-plugin-react-intl@8.1.5) (2020-08-19)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.1.4](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.1.3...babel-plugin-react-intl@8.1.4) (2020-08-19)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.1.3](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.1.2...babel-plugin-react-intl@8.1.3) (2020-08-18)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.1.2](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.1.1...babel-plugin-react-intl@8.1.2) (2020-08-17)

**Note:** Version bump only for package babel-plugin-react-intl





## [8.1.1](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.1.0...babel-plugin-react-intl@8.1.1) (2020-08-14)

**Note:** Version bump only for package babel-plugin-react-intl





# [8.1.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.0.1...babel-plugin-react-intl@8.1.0) (2020-08-14)


### Features

* **babel-plugin-react-intl:** add --ast flag to compile defaultMessage to AST during transpilation ([1953149](https://github.com/formatjs/formatjs/commit/19531490a70c6d9a43ffdfe85c0b48a0ad0efa92))





## [8.0.1](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@8.0.0...babel-plugin-react-intl@8.0.1) (2020-08-13)

**Note:** Version bump only for package babel-plugin-react-intl





# [8.0.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.9.4...babel-plugin-react-intl@8.0.0) (2020-08-09)


### Features

* **babel-plugin-react-intl:** remove `messagesDir`, `workspaceRoot`, `outputEmptyJson` ([47ca556](https://github.com/formatjs/formatjs/commit/47ca556c1405eec7b7b2660275ae84a019112b2b))


### BREAKING CHANGES

* **babel-plugin-react-intl:** Since we've introduced `@formatjs/cli` and multiple
guides regarding i18n workflow, we want to consolidate extraction to the
CLI instead of combining it with code transformation as a side effects.
Therefore, since this release `babel-plugin-react-intl` will be purely
for code transformation such as validating messages, remove description,
autoinject IDs and remove descriptions.
All extractions should be done using `@formatjs/cli` using `npx formatjs
extract` & `npx formatjs compile`.





## [7.9.4](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.9.3...babel-plugin-react-intl@7.9.4) (2020-08-07)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.9.3](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.9.2...babel-plugin-react-intl@7.9.3) (2020-08-06)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.9.2](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.9.1...babel-plugin-react-intl@7.9.2) (2020-07-29)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.9.1](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.9.0...babel-plugin-react-intl@7.9.1) (2020-07-25)


### Bug Fixes

* **babel-plugin-react-intl:** tweak overrideIdFn signature in options ([4fd8163](https://github.com/formatjs/formatjs/commit/4fd81632722bea7dcad54588dca5d711e8e9cb64))





# [7.9.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.8.3...babel-plugin-react-intl@7.9.0) (2020-07-24)


### Bug Fixes

* **babel-plugin-react-intl:** default idInterpolationPattern to [contenthash:5] ([1530f78](https://github.com/formatjs/formatjs/commit/1530f7870b849e8fab3f140a642e719877f0000e))


### Features

* **babel-plugin-react-intl:** introduce idInterpolationPattern option ([61eb96e](https://github.com/formatjs/formatjs/commit/61eb96ed70c4698e24373ba33110419fcea746c1))





## [7.8.3](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.8.2...babel-plugin-react-intl@7.8.3) (2020-07-21)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.8.2](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.8.1...babel-plugin-react-intl@7.8.2) (2020-07-17)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.8.1](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.8.0...babel-plugin-react-intl@7.8.1) (2020-07-16)

**Note:** Version bump only for package babel-plugin-react-intl





# [7.8.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.7.3...babel-plugin-react-intl@7.8.0) (2020-07-15)


### Features

* **babel-plugin-react-intl:** add `workspaceRoot` option, fix [#1649](https://github.com/formatjs/formatjs/issues/1649) ([16df60b](https://github.com/formatjs/formatjs/commit/16df60bc091a517df6d9cf072b5c6dba49de3a8c))





## [7.7.3](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.7.1...babel-plugin-react-intl@7.7.3) (2020-07-14)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.7.2](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.7.1...babel-plugin-react-intl@7.7.2) (2020-07-14)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.7.1](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.7.0...babel-plugin-react-intl@7.7.1) (2020-07-14)

**Note:** Version bump only for package babel-plugin-react-intl





# [7.7.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.28...babel-plugin-react-intl@7.7.0) (2020-07-14)


### Features

* publish ([b6e3465](https://github.com/formatjs/formatjs/commit/b6e3465ac95b3fa481f3c89f077a66ac004f7c27))
* **babel-plugin-react-intl:** rm references to @formatjs/macro ([508df3b](https://github.com/formatjs/formatjs/commit/508df3bbbfcd3aafdeb368e67062581a7f804154))





# [7.6.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.28...babel-plugin-react-intl@7.6.0) (2020-07-09)


### Features

* **babel-plugin-react-intl:** rm references to @formatjs/macro ([508df3b](https://github.com/formatjs/formatjs/commit/508df3bbbfcd3aafdeb368e67062581a7f804154))





## [7.5.28](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.27...babel-plugin-react-intl@7.5.28) (2020-07-03)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.27](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.26...babel-plugin-react-intl@7.5.27) (2020-07-03)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.26](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.25...babel-plugin-react-intl@7.5.26) (2020-07-03)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.25](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.24...babel-plugin-react-intl@7.5.25) (2020-07-01)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.24](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.23...babel-plugin-react-intl@7.5.24) (2020-06-26)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.23](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.22...babel-plugin-react-intl@7.5.23) (2020-06-23)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.22](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.21...babel-plugin-react-intl@7.5.22) (2020-06-23)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.21](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.20...babel-plugin-react-intl@7.5.21) (2020-06-20)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.20](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.19...babel-plugin-react-intl@7.5.20) (2020-06-06)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.19](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.18...babel-plugin-react-intl@7.5.19) (2020-06-06)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.18](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.17...babel-plugin-react-intl@7.5.18) (2020-06-04)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.17](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.16...babel-plugin-react-intl@7.5.17) (2020-06-04)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.16](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.15...babel-plugin-react-intl@7.5.16) (2020-06-03)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.15](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.14...babel-plugin-react-intl@7.5.15) (2020-05-28)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.14](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.13...babel-plugin-react-intl@7.5.14) (2020-05-27)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.13](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.12...babel-plugin-react-intl@7.5.13) (2020-05-25)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.12](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.11...babel-plugin-react-intl@7.5.12) (2020-05-23)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.11](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.10...babel-plugin-react-intl@7.5.11) (2020-05-23)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.10](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.9...babel-plugin-react-intl@7.5.10) (2020-05-21)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.9](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.8...babel-plugin-react-intl@7.5.9) (2020-05-21)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.8](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.7...babel-plugin-react-intl@7.5.8) (2020-05-16)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.7](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.6...babel-plugin-react-intl@7.5.7) (2020-05-08)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.6](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.5...babel-plugin-react-intl@7.5.6) (2020-05-06)


### Bug Fixes

* **babel-plugin-react-intl:** extract from `useIntl`, fix [#1633](https://github.com/formatjs/formatjs/issues/1633) ([3f14e5d](https://github.com/formatjs/formatjs/commit/3f14e5da118f51ab350037c5ff1a05701e9779e9))





## [7.5.5](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.4...babel-plugin-react-intl@7.5.5) (2020-05-05)

**Note:** Version bump only for package babel-plugin-react-intl





## 7.5.4 (2020-04-28)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.3](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.2...babel-plugin-react-intl@7.5.3) (2020-04-25)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.5.2](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.1...babel-plugin-react-intl@7.5.2) (2020-04-24)


### Bug Fixes

* **eslint-plugin-formatjs:** add missing dep ([776390e](https://github.com/formatjs/formatjs/commit/776390e9d6cb3bc1eef07b2e92057136cfe95b76))





## [7.5.1](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.5.0...babel-plugin-react-intl@7.5.1) (2020-04-20)

**Note:** Version bump only for package babel-plugin-react-intl





# [7.5.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.4.3...babel-plugin-react-intl@7.5.0) (2020-04-14)


### Bug Fixes

* clean up tsbuildinfo before full build ([c301ca0](https://github.com/formatjs/formatjs/commit/c301ca02e0c319a0eb03921533053f0334ae5df1))


### Features

* **babel-plugin-react-intl:** support extracting single message from `defineMessage` macro ([f7ce912](https://github.com/formatjs/formatjs/commit/f7ce912a13e8d1050fe9c2b363390c3c7f3b290b))





## [7.4.3](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.4.2...babel-plugin-react-intl@7.4.3) (2020-04-13)


### Bug Fixes

* **babel-plugin-react-intl:** fix README link ([afc92d4](https://github.com/formatjs/formatjs/commit/afc92d4e35aa00756fcdba0d4f3ac0ace8fb7954))





## [7.4.2](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.4.1...babel-plugin-react-intl@7.4.2) (2020-04-12)

**Note:** Version bump only for package babel-plugin-react-intl





## [7.4.1](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.4.0...babel-plugin-react-intl@7.4.1) (2020-04-12)


### Bug Fixes

* **babel-plugin-react-intl:** fix pragma parsing so it can search for non-import nodes ([7df5060](https://github.com/formatjs/formatjs/commit/7df50602899b5e4a6ce945ce093c9c1781d7565a))





# [7.4.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.3.0...babel-plugin-react-intl@7.4.0) (2020-04-11)


### Features

* **@formatjs/cli:** add support for pragma ([b6c8352](https://github.com/formatjs/formatjs/commit/b6c8352f5181bcb1adbb520cca01191527bc20bb))
* **babel-plugin-react-intl:** add option to parse pragma ([af58ad2](https://github.com/formatjs/formatjs/commit/af58ad2f2fcb06bf20804e2f5cb357c739f34003))





# [7.3.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.2.1...babel-plugin-react-intl@7.3.0) (2020-04-11)


### Features

* **@formatjs/cli:** add --throws option to prevent throwing on a single file ([7539936](https://github.com/formatjs/formatjs/commit/75399368f6ddd591b3fbe9c3ed6d9a30bea3586f))





## [7.2.1](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.2.0...babel-plugin-react-intl@7.2.1) (2020-04-11)


### Bug Fixes

* **@formatjs/cli:** export raw extraction method that returns all messages ([45fc546](https://github.com/formatjs/formatjs/commit/45fc5464e05a30071d4f058a66de35f5f0a08e43))
* **babel-plugin-react-intl:** add missing dep, fix [#586](https://github.com/formatjs/formatjs/issues/586) ([1419526](https://github.com/formatjs/formatjs/commit/14195267916f15ba2f4f0635c519797efeef9fb5))





# [7.2.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.1.1...babel-plugin-react-intl@7.2.0) (2020-04-11)


### Features

* **@formatjs/cli:** export extracting API ([08db726](https://github.com/formatjs/formatjs/commit/08db7261721137a1a275fd2c29a0633c19034fd3))





## [7.1.1](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.1.0...babel-plugin-react-intl@7.1.1) (2020-03-30)

**Note:** Version bump only for package babel-plugin-react-intl





# [7.1.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@7.0.0...babel-plugin-react-intl@7.1.0) (2020-03-29)


### Features

* **babel-plugin-react-intl:** add destructured formatMessage su… ([#582](https://github.com/formatjs/formatjs/issues/582)) ([8549258](https://github.com/formatjs/formatjs/commit/854925800a8fc206292055c184015c5e603b9807))





# [7.0.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@6.2.0...babel-plugin-react-intl@7.0.0) (2020-03-22)


### Features

* **babel-plugin-react-intl:** remove FormattedHTMLMessage extraction ([f962fdf](https://github.com/formatjs/formatjs/commit/f962fdf06118bda5bfb7f239962defced5597920))


### BREAKING CHANGES

* **babel-plugin-react-intl:** As of react-intl@4.x, `FormattedHTMLMessage` is no longer supported so
we're removing this from our babel plugin as well





# [6.2.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@6.1.0...babel-plugin-react-intl@6.2.0) (2020-03-18)


### Features

* **babel-plugin-react-intl:** add outputEmptyJson option ([a4f85ab](https://github.com/formatjs/formatjs/commit/a4f85ab47af4c2f2500363c3d5cc053ec126644c))





# [6.1.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@6.0.1...babel-plugin-react-intl@6.1.0) (2020-03-18)


### Bug Fixes

* **babel-plugin-react-intl:** extract messages without defaultMessage, fix [#536](https://github.com/formatjs/formatjs/issues/536) ([dafa46b](https://github.com/formatjs/formatjs/commit/dafa46b2bd5a8f22f2d57e2adf7a33c51095f18b))


### Features

* **babel-plugin-react-intl:** add filename as param to overrideIdFn ([30b9de9](https://github.com/formatjs/formatjs/commit/30b9de9e631928d3f543ee2b8094a1b608ee95d0)), closes [#495](https://github.com/formatjs/formatjs/issues/495) [#496](https://github.com/formatjs/formatjs/issues/496)
* **babel-plugin-react-intl:** output file with empty [] if src has no messages ([43dae5b](https://github.com/formatjs/formatjs/commit/43dae5b2a1554de8d40d4248a9c4a3622904406b)), closes [#553](https://github.com/formatjs/formatjs/issues/553)





## [6.0.1](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@6.0.0...babel-plugin-react-intl@6.0.1) (2020-03-05)

**Note:** Version bump only for package babel-plugin-react-intl





# [6.0.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@5.1.17...babel-plugin-react-intl@6.0.0) (2020-03-04)


### Features

* **intl-messageformat-parser:** Add native support for parsing XML tag ([51c49fa](https://github.com/formatjs/formatjs/commit/51c49faa46880ae6e005125c59fa23b59f0e7083))


### BREAKING CHANGES

* **intl-messageformat-parser:** This changes the AST and causes potential conflicts
with previous parser version
fix(eslint-plugin-formatjs): Adapt to new parser
chore(babel-plugin-react-intl): update package lock





## [5.1.18](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@5.1.17...babel-plugin-react-intl@5.1.18) (2020-01-27)

**Note:** Version bump only for package babel-plugin-react-intl





## [5.1.17](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@5.1.16...babel-plugin-react-intl@5.1.17) (2020-01-22)

**Note:** Version bump only for package babel-plugin-react-intl





## [5.1.16](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@5.1.15...babel-plugin-react-intl@5.1.16) (2020-01-09)

**Note:** Version bump only for package babel-plugin-react-intl





## [5.1.15](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@5.1.14...babel-plugin-react-intl@5.1.15) (2020-01-08)

**Note:** Version bump only for package babel-plugin-react-intl





## [5.1.14](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@5.1.13...babel-plugin-react-intl@5.1.14) (2020-01-06)

**Note:** Version bump only for package babel-plugin-react-intl





## [5.1.13](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@5.1.12...babel-plugin-react-intl@5.1.13) (2019-12-27)

**Note:** Version bump only for package babel-plugin-react-intl





## [5.1.12](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@5.1.11...babel-plugin-react-intl@5.1.12) (2019-12-26)

**Note:** Version bump only for package babel-plugin-react-intl





## [5.1.11](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@5.1.10...babel-plugin-react-intl@5.1.11) (2019-12-04)

**Note:** Version bump only for package babel-plugin-react-intl





## [5.1.10](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@5.1.9...babel-plugin-react-intl@5.1.10) (2019-12-02)

**Note:** Version bump only for package babel-plugin-react-intl





## [5.1.9](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@5.1.8...babel-plugin-react-intl@5.1.9) (2019-12-01)

**Note:** Version bump only for package babel-plugin-react-intl





## [5.1.8](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@5.1.7...babel-plugin-react-intl@5.1.8) (2019-11-26)

**Note:** Version bump only for package babel-plugin-react-intl





## [5.1.7](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@5.1.6...babel-plugin-react-intl@5.1.7) (2019-11-25)

**Note:** Version bump only for package babel-plugin-react-intl





## [5.1.6](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@5.1.5...babel-plugin-react-intl@5.1.6) (2019-11-25)

**Note:** Version bump only for package babel-plugin-react-intl





## [5.1.5](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@5.1.4...babel-plugin-react-intl@5.1.5) (2019-11-23)

**Note:** Version bump only for package babel-plugin-react-intl





## [5.1.4](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@5.1.3...babel-plugin-react-intl@5.1.4) (2019-11-21)

**Note:** Version bump only for package babel-plugin-react-intl





## [5.1.3](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@5.1.2...babel-plugin-react-intl@5.1.3) (2019-11-20)


### Bug Fixes

* **lint:** fix lint config and rerun ([041eb99](https://github.com/formatjs/formatjs/commit/041eb99706164048b5b8ce7079955897ce27ed70))





## [5.1.2](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@5.1.1...babel-plugin-react-intl@5.1.2) (2019-11-10)

**Note:** Version bump only for package babel-plugin-react-intl





## [5.1.1](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@5.1.0...babel-plugin-react-intl@5.1.1) (2019-11-05)

**Note:** Version bump only for package babel-plugin-react-intl





# [5.1.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@5.0.0...babel-plugin-react-intl@5.1.0) (2019-11-01)


### Features

* **@formatjs/cli:** add --outFile & --idInterpolationPattern ([0c5e675](https://github.com/formatjs/formatjs/commit/0c5e675ed38f18987674a875fa6ed908ce907fc9))
* **babel-plugin-react-intl:** allow parsing from @formatjs/macro ([196dcc4](https://github.com/formatjs/formatjs/commit/196dcc44faec56637f3b74db4ed2c13d6842bc61))





## [5.0.1](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@5.0.0...babel-plugin-react-intl@5.0.1) (2019-10-31)

**Note:** Version bump only for package babel-plugin-react-intl





# [5.0.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.3.0...babel-plugin-react-intl@5.0.0) (2019-10-31)


### Features

* **babel-plugin-react-intl:** remove enforceDescription and enforceDefaultMessage ([72ff434](https://github.com/formatjs/formatjs/commit/72ff4345170f9b240f7331aa6fa36df96a8c823b))


### BREAKING CHANGES

* **babel-plugin-react-intl:** We want to move things like `enforceDescription` and
`enforceDefaultMessage` to the new eslint-plugin-formatjs instead of
using this babel plugin for linting.
feat(@formatjs/cli): Remove enforceDescription and enforceDefaultMessage





# [4.3.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.21...babel-plugin-react-intl@4.3.0) (2019-10-30)


### Features

* **@formatjs/cli:** A CLI for formatjs ([#234](https://github.com/formatjs/formatjs/issues/234)) ([1f57a0b](https://github.com/formatjs/formatjs/commit/1f57a0b0921e0228cf3fd4eff756b0cd17e28fb5))





# [4.2.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.21...babel-plugin-react-intl@4.2.0) (2019-10-30)


### Features

* **@formatjs/cli:** A CLI for formatjs ([#234](https://github.com/formatjs/formatjs/issues/234)) ([1f57a0b](https://github.com/formatjs/formatjs/commit/1f57a0b0921e0228cf3fd4eff756b0cd17e28fb5))





## [4.1.21](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.20...babel-plugin-react-intl@4.1.21) (2019-10-23)

**Note:** Version bump only for package babel-plugin-react-intl





## [4.1.20](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.19...babel-plugin-react-intl@4.1.20) (2019-10-01)

**Note:** Version bump only for package babel-plugin-react-intl





## [4.1.19](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.18...babel-plugin-react-intl@4.1.19) (2019-09-20)

**Note:** Version bump only for package babel-plugin-react-intl





## [4.1.18](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.17...babel-plugin-react-intl@4.1.18) (2019-09-15)

**Note:** Version bump only for package babel-plugin-react-intl





## [4.1.17](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.16...babel-plugin-react-intl@4.1.17) (2019-09-13)

**Note:** Version bump only for package babel-plugin-react-intl





## [4.1.16](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.15...babel-plugin-react-intl@4.1.16) (2019-09-03)

**Note:** Version bump only for package babel-plugin-react-intl





## [4.1.15](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.14...babel-plugin-react-intl@4.1.15) (2019-08-29)

**Note:** Version bump only for package babel-plugin-react-intl





## [4.1.14](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.13...babel-plugin-react-intl@4.1.14) (2019-08-19)


### Bug Fixes

* **babel-plugin-react-intl:** return raw message without re-printing, fix [#160](https://github.com/formatjs/formatjs/issues/160) ([6897ca9](https://github.com/formatjs/formatjs/commit/6897ca9))





## [4.1.13](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.12...babel-plugin-react-intl@4.1.13) (2019-08-21)


### Bug Fixes

* **babel-plugin-react-intl:** dont trim ws ([f9f4e54](https://github.com/formatjs/formatjs/commit/f9f4e54)), closes [#158](https://github.com/formatjs/formatjs/issues/158)





## [4.1.12](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.11...babel-plugin-react-intl@4.1.12) (2019-08-12)

**Note:** Version bump only for package babel-plugin-react-intl





## [4.1.11](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.10...babel-plugin-react-intl@4.1.11) (2019-08-11)


### Bug Fixes

* **babel-plugin-react-intl:** check if `descriptorPath.id` is present in JSX element ([#150](https://github.com/formatjs/formatjs/issues/150)) ([5e2dffa](https://github.com/formatjs/formatjs/commit/5e2dffa))





## [4.1.10](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.9...babel-plugin-react-intl@4.1.10) (2019-08-11)


### Bug Fixes

* generate lib instead of mjs ([05e63b3](https://github.com/formatjs/formatjs/commit/05e63b3))





## [4.1.9](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.8...babel-plugin-react-intl@4.1.9) (2019-08-10)

**Note:** Version bump only for package babel-plugin-react-intl





## [4.1.8](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.7...babel-plugin-react-intl@4.1.8) (2019-08-08)

**Note:** Version bump only for package babel-plugin-react-intl





## [4.1.7](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.6...babel-plugin-react-intl@4.1.7) (2019-08-07)

**Note:** Version bump only for package babel-plugin-react-intl





## [4.1.6](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.5...babel-plugin-react-intl@4.1.6) (2019-08-06)


### Bug Fixes

* generate .mjs instead of lib ([0c34ee4](https://github.com/formatjs/formatjs/commit/0c34ee4))





## [4.1.5](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.4...babel-plugin-react-intl@4.1.5) (2019-07-29)

**Note:** Version bump only for package babel-plugin-react-intl





## [4.1.4](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.3...babel-plugin-react-intl@4.1.4) (2019-07-29)

**Note:** Version bump only for package babel-plugin-react-intl





## [4.1.3](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.2...babel-plugin-react-intl@4.1.3) (2019-07-25)

**Note:** Version bump only for package babel-plugin-react-intl





## [4.1.2](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.1...babel-plugin-react-intl@4.1.2) (2019-07-23)

**Note:** Version bump only for package babel-plugin-react-intl





## [4.1.1](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.1.0...babel-plugin-react-intl@4.1.1) (2019-07-12)

**Note:** Version bump only for package babel-plugin-react-intl

# [4.1.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.0.1...babel-plugin-react-intl@4.1.0) (2019-07-12)

### Features

- **intl-messageformat-parser:** add printer to print AST to string ([ec0eaa2](https://github.com/formatjs/formatjs/commit/ec0eaa2))

## [4.0.1](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@4.0.0...babel-plugin-react-intl@4.0.1) (2019-07-09)

**Note:** Version bump only for package babel-plugin-react-intl

# [4.0.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@3.5.1...babel-plugin-react-intl@4.0.0) (2019-07-08)

### Features

- **intl-messageformat-parser:** Rewrite grammar ([#112](https://github.com/formatjs/formatjs/issues/112)) ([093de35](https://github.com/formatjs/formatjs/commit/093de35))

### BREAKING CHANGES

- **intl-messageformat-parser:** This completely changes the AST produced by the parser

Before:

```
complex_msg AST length 12567
normal_msg AST length 2638
simple_msg AST length 567
string_msg AST length 288
complex_msg x 3,405 ops/sec ±5.44% (81 runs sampled)
normal_msg x 27,513 ops/sec ±2.14% (87 runs sampled)
simple_msg x 113,043 ops/sec ±1.20% (89 runs sampled)
string_msg x 147,838 ops/sec ±0.78% (90 runs sampled)
```

After:

```
complex_msg AST length 2053
normal_msg AST length 410
simple_msg AST length 79
string_msg AST length 36
complex_msg x 3,926 ops/sec ±2.37% (90 runs sampled)
normal_msg x 27,641 ops/sec ±3.93% (86 runs sampled)
simple_msg x 100,764 ops/sec ±5.35% (79 runs sampled)
string_msg x 120,362 ops/sec ±7.11% (74 runs sampled)
```

- feat: normalize hashtag token in plural

- feat(intl-messageformat): adapt to new AST

- feat(babel-plugin-react-intl): adapt to new AST

## [3.5.1](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@3.5.0...babel-plugin-react-intl@3.5.1) (2019-06-28)

**Note:** Version bump only for package babel-plugin-react-intl

# [3.5.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@3.4.1...babel-plugin-react-intl@3.5.0) (2019-06-27)

### Features

- **intl-messageformat:** allow passing in formatters ([#107](https://github.com/formatjs/formatjs/issues/107)) ([3605693](https://github.com/formatjs/formatjs/commit/3605693))

## [3.4.1](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@3.4.0...babel-plugin-react-intl@3.4.1) (2019-06-26)

**Note:** Version bump only for package babel-plugin-react-intl

# [3.4.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@3.3.3...babel-plugin-react-intl@3.4.0) (2019-06-27)

### Features

- **intl-utils:** Add intl-utils ([#98](https://github.com/formatjs/formatjs/issues/98)) ([2329c57](https://github.com/formatjs/formatjs/commit/2329c57))

## [3.3.3](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@3.3.2...babel-plugin-react-intl@3.3.3) (2019-06-18)

### Bug Fixes

- **babel-plugin-react-intl:** add back messages to `metadata`, fixes [#92](https://github.com/formatjs/formatjs/issues/92) ([643f8e5](https://github.com/formatjs/formatjs/commit/643f8e5))

## [3.3.2](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@3.3.1...babel-plugin-react-intl@3.3.2) (2019-06-18)

**Note:** Version bump only for package babel-plugin-react-intl

## [3.3.1](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@3.3.0...babel-plugin-react-intl@3.3.1) (2019-06-18)

**Note:** Version bump only for package babel-plugin-react-intl

# [3.3.0](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@3.2.1...babel-plugin-react-intl@3.3.0) (2019-06-18)

### Features

- **babel-plugin-react-intl:** rewrite using new babel 7 APIs ([#89](https://github.com/formatjs/formatjs/issues/89)) ([5bc18b0](https://github.com/formatjs/formatjs/commit/5bc18b0))

## [3.2.1](https://github.com/formatjs/formatjs/compare/babel-plugin-react-intl@3.2.0...babel-plugin-react-intl@3.2.1) (2019-06-12)

**Note:** Version bump only for package babel-plugin-react-intl

# [3.2.0](https://github.com/formatjs/babel-plugin-react-intl/compare/babel-plugin-react-intl@3.1.3...babel-plugin-react-intl@3.2.0) (2019-06-05)

### Features

- **babel-plugin-react-intl:** Add enforceDefaultMessage ([#61](https://github.com/formatjs/babel-plugin-react-intl/issues/61)) ([8dbb1c3](https://github.com/formatjs/babel-plugin-react-intl/commit/8dbb1c3))

## [3.1.3](https://github.com/formatjs/babel-plugin-react-intl/compare/babel-plugin-react-intl@3.1.1...babel-plugin-react-intl@3.1.3) (2019-06-03)

**Note:** Version bump only for package babel-plugin-react-intl

## [3.1.2](https://github.com/formatjs/babel-plugin-react-intl/compare/babel-plugin-react-intl@3.1.1...babel-plugin-react-intl@3.1.2) (2019-06-03)

**Note:** Version bump only for package babel-plugin-react-intl

## [3.1.1](https://github.com/formatjs/babel-plugin-react-intl/compare/babel-plugin-react-intl@3.1.0...babel-plugin-react-intl@3.1.1) (2019-05-31)

**Note:** Version bump only for package babel-plugin-react-intl

# [3.1.0](https://github.com/formatjs/babel-plugin-react-intl/compare/babel-plugin-react-intl@3.0.2...babel-plugin-react-intl@3.1.0) (2019-05-28)

### Features

- **babel-plugin-react-intl:** add `extractFromFormatMessageCall` option to opt-in extracting from `intl.formatMessage`, fixes [#37](https://github.com/formatjs/babel-plugin-react-intl/issues/37) ([#39](https://github.com/formatjs/babel-plugin-react-intl/issues/39)) ([5d0bb43](https://github.com/formatjs/babel-plugin-react-intl/commit/5d0bb43))

## [3.0.2](https://github.com/formatjs/babel-plugin-react-intl/compare/babel-plugin-react-intl@3.0.2...babel-plugin-react-intl@3.0.2) (2019-05-28)

### Bug Fixes

- **relativePath:** path -> p ([a764377](https://github.com/formatjs/babel-plugin-react-intl/commit/a764377))

### Features

- **babel-plugin-react-intl:** add `extractFromFormatMessageCall` option to opt-in extracting from `intl.formatMessage`, fixes [#37](https://github.com/formatjs/babel-plugin-react-intl/issues/37) ([#39](https://github.com/formatjs/babel-plugin-react-intl/issues/39)) ([5d0bb43](https://github.com/formatjs/babel-plugin-react-intl/commit/5d0bb43))
- **test:** Add test suite. ([a7b611a](https://github.com/formatjs/babel-plugin-react-intl/commit/a7b611a))

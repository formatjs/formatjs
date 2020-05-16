# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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

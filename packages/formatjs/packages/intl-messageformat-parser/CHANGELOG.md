# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.2.1](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@3.2.0...intl-messageformat-parser@3.2.1) (2019-10-01)

**Note:** Version bump only for package intl-messageformat-parser





# [3.2.0](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@3.1.1...intl-messageformat-parser@3.2.0) (2019-09-20)


### Features

* **intl-messageformat-parser:** mark the package as side-effects free ([cfc8336](https://github.com/formatjs/formatjs/commit/cfc8336))





## [3.1.1](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@3.1.0...intl-messageformat-parser@3.1.1) (2019-09-13)

**Note:** Version bump only for package intl-messageformat-parser





# [3.1.0](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@3.0.8...intl-messageformat-parser@3.1.0) (2019-09-03)


### Features

* **intl-messageformat-parser:** add UMD dist, fixes [#171](https://github.com/formatjs/formatjs/issues/171) ([94458c3](https://github.com/formatjs/formatjs/commit/94458c3))





## [3.0.8](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@3.0.7...intl-messageformat-parser@3.0.8) (2019-08-29)


### Bug Fixes

* **intl-messageformat-parser:** throw when there are duplicates in select/plural, fix [#168](https://github.com/formatjs/formatjs/issues/168) ([0c3a0e0](https://github.com/formatjs/formatjs/commit/0c3a0e0))





## [3.0.7](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@3.0.6...intl-messageformat-parser@3.0.7) (2019-08-12)

**Note:** Version bump only for package intl-messageformat-parser





## [3.0.6](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@3.0.5...intl-messageformat-parser@3.0.6) (2019-08-11)


### Bug Fixes

* generate lib instead of mjs ([05e63b3](https://github.com/formatjs/formatjs/commit/05e63b3))





## [3.0.5](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@3.0.4...intl-messageformat-parser@3.0.5) (2019-08-10)


### Bug Fixes

* **intl-messageformat-parser:** allow negative in plural rule, fixes [#146](https://github.com/formatjs/formatjs/issues/146) ([50c7710](https://github.com/formatjs/formatjs/commit/50c7710))





## [3.0.4](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@3.0.3...intl-messageformat-parser@3.0.4) (2019-08-08)


### Bug Fixes

* **intl-messageformat-parser:** make date time skeleton compatib… ([#140](https://github.com/formatjs/formatjs/issues/140)) ([b6ea222](https://github.com/formatjs/formatjs/commit/b6ea222))





## [3.0.3](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@3.0.2...intl-messageformat-parser@3.0.3) (2019-08-07)


### Bug Fixes

* **intl-messageformat-parser:** normalize plural in nested select, fixes [#145](https://github.com/formatjs/formatjs/issues/145) ([215aa6d](https://github.com/formatjs/formatjs/commit/215aa6d))





## [3.0.2](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@3.0.1...intl-messageformat-parser@3.0.2) (2019-08-06)


### Bug Fixes

* generate .mjs instead of lib ([0c34ee4](https://github.com/formatjs/formatjs/commit/0c34ee4))





## [3.0.1](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@3.0.0...intl-messageformat-parser@3.0.1) (2019-07-29)


### Bug Fixes

* **intl-messageformat-parser:** argStyleText can contain syntax characters and quoted string now ([#136](https://github.com/formatjs/formatjs/issues/136)) ([b39ea08](https://github.com/formatjs/formatjs/commit/b39ea08)), closes [#135](https://github.com/formatjs/formatjs/issues/135)





# [3.0.0](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@2.1.3...intl-messageformat-parser@3.0.0) (2019-07-29)


### Bug Fixes

* **intl-messageformat-parser:** fix plural =xx grammar ([1c3c1fc](https://github.com/formatjs/formatjs/commit/1c3c1fc))


### Features

* **intl-messageformat-parser:** add parser for number skeleton and date skeleton ([#131](https://github.com/formatjs/formatjs/issues/131)) ([dbe6799](https://github.com/formatjs/formatjs/commit/dbe6799))
* **intl-messageformat-parser:** revamped quote rule ([#134](https://github.com/formatjs/formatjs/issues/134)) ([5661177](https://github.com/formatjs/formatjs/commit/5661177))
* **intl-messageformat-parser:** support argument skeleton for AST printers ([#133](https://github.com/formatjs/formatjs/issues/133)) ([f1f937d](https://github.com/formatjs/formatjs/commit/f1f937d))


### BREAKING CHANGES

* **intl-messageformat-parser:** This changes how we escape chars in messages, instead of `\` we now use apostrophe which is more aligned with ICU4J & ICU4C





## [2.1.3](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@2.1.2...intl-messageformat-parser@2.1.3) (2019-07-25)

**Note:** Version bump only for package intl-messageformat-parser





## [2.1.2](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@2.1.1...intl-messageformat-parser@2.1.2) (2019-07-23)


### Bug Fixes

* **intl-messageformat-parser:** add tests, fix offset printing ([bebdf95](https://github.com/formatjs/formatjs/commit/bebdf95))
* **intl-messageformat-parser:** Fix AST printer to print white-spaces, commas and element types… ([#120](https://github.com/formatjs/formatjs/issues/120)) ([37448e2](https://github.com/formatjs/formatjs/commit/37448e2)), closes [#117](https://github.com/formatjs/formatjs/issues/117)





## [2.1.1](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@2.1.0...intl-messageformat-parser@2.1.1) (2019-07-12)

**Note:** Version bump only for package intl-messageformat-parser

# [2.1.0](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@2.0.1...intl-messageformat-parser@2.1.0) (2019-07-12)

### Features

- **intl-messageformat-parser:** add printer to print AST to string ([ec0eaa2](https://github.com/formatjs/formatjs/commit/ec0eaa2))

## [2.0.1](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@2.0.0...intl-messageformat-parser@2.0.1) (2019-07-09)

**Note:** Version bump only for package intl-messageformat-parser

# [2.0.0](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@1.8.1...intl-messageformat-parser@2.0.0) (2019-07-08)

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

## [1.8.1](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@1.8.0...intl-messageformat-parser@1.8.1) (2019-06-28)

**Note:** Version bump only for package intl-messageformat-parser

# [1.8.0](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@1.7.1...intl-messageformat-parser@1.8.0) (2019-06-27)

### Features

- **intl-messageformat:** allow passing in formatters ([#107](https://github.com/formatjs/formatjs/issues/107)) ([3605693](https://github.com/formatjs/formatjs/commit/3605693))

## [1.7.1](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@1.7.0...intl-messageformat-parser@1.7.1) (2019-06-26)

### Bug Fixes

- **intl-messageformat-parser:** Escape double-' to a single ' ([#103](https://github.com/formatjs/formatjs/issues/103)) ([4d0cd1f](https://github.com/formatjs/formatjs/commit/4d0cd1f))

# [1.7.0](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@1.6.8...intl-messageformat-parser@1.7.0) (2019-06-27)

### Features

- **intl-utils:** Add intl-utils ([#98](https://github.com/formatjs/formatjs/issues/98)) ([2329c57](https://github.com/formatjs/formatjs/commit/2329c57))

## [1.6.8](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@1.6.7...intl-messageformat-parser@1.6.8) (2019-06-18)

**Note:** Version bump only for package intl-messageformat-parser

## [1.6.7](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@1.6.6...intl-messageformat-parser@1.6.7) (2019-06-18)

**Note:** Version bump only for package intl-messageformat-parser

## [1.6.6](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@1.6.5...intl-messageformat-parser@1.6.6) (2019-06-12)

**Note:** Version bump only for package intl-messageformat-parser

## [1.6.5](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@1.6.3...intl-messageformat-parser@1.6.5) (2019-06-03)

**Note:** Version bump only for package intl-messageformat-parser

## [1.6.4](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@1.6.3...intl-messageformat-parser@1.6.4) (2019-06-03)

**Note:** Version bump only for package intl-messageformat-parser

## [1.6.3](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@1.6.2...intl-messageformat-parser@1.6.3) (2019-05-28)

**Note:** Version bump only for package intl-messageformat-parser

## [1.6.2](https://github.com/formatjs/formatjs/compare/intl-messageformat-parser@1.6.2...intl-messageformat-parser@1.6.2) (2019-05-28)

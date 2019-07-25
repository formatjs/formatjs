# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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

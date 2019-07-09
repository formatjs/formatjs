# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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

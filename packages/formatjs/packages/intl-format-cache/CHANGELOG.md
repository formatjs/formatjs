# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.1.4](https://github.com/formatjs/formatjs/compare/intl-format-cache@4.1.3...intl-format-cache@4.1.4) (2019-07-29)

**Note:** Version bump only for package intl-format-cache





## [4.1.3](https://github.com/formatjs/formatjs/compare/intl-format-cache@4.1.2...intl-format-cache@4.1.3) (2019-07-25)

**Note:** Version bump only for package intl-format-cache





## [4.1.2](https://github.com/formatjs/formatjs/compare/intl-format-cache@4.1.1...intl-format-cache@4.1.2) (2019-07-23)

**Note:** Version bump only for package intl-format-cache





## [4.1.1](https://github.com/formatjs/formatjs/compare/intl-format-cache@4.1.0...intl-format-cache@4.1.1) (2019-07-12)

**Note:** Version bump only for package intl-format-cache

# [4.1.0](https://github.com/formatjs/formatjs/compare/intl-format-cache@4.0.1...intl-format-cache@4.1.0) (2019-07-12)

### Features

- **intl-messageformat-parser:** add printer to print AST to string ([ec0eaa2](https://github.com/formatjs/formatjs/commit/ec0eaa2))

## [4.0.1](https://github.com/formatjs/formatjs/compare/intl-format-cache@4.0.0...intl-format-cache@4.0.1) (2019-07-09)

**Note:** Version bump only for package intl-format-cache

# [4.0.0](https://github.com/formatjs/formatjs/compare/intl-format-cache@3.3.2...intl-format-cache@4.0.0) (2019-07-08)

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

## [3.3.2](https://github.com/formatjs/formatjs/compare/intl-format-cache@3.3.1...intl-format-cache@3.3.2) (2019-06-28)

**Note:** Version bump only for package intl-format-cache

## [3.3.1](https://github.com/formatjs/formatjs/compare/intl-format-cache@3.3.0...intl-format-cache@3.3.1) (2019-07-02)

**Note:** Version bump only for package intl-format-cache

# [3.3.0](https://github.com/formatjs/formatjs/compare/intl-format-cache@3.2.1...intl-format-cache@3.3.0) (2019-06-27)

### Features

- **intl-messageformat:** allow passing in formatters ([#107](https://github.com/formatjs/formatjs/issues/107)) ([3605693](https://github.com/formatjs/formatjs/commit/3605693))

## [3.2.1](https://github.com/formatjs/formatjs/compare/intl-format-cache@3.2.0...intl-format-cache@3.2.1) (2019-06-26)

**Note:** Version bump only for package intl-format-cache

# [3.2.0](https://github.com/formatjs/formatjs/compare/intl-format-cache@3.1.2...intl-format-cache@3.2.0) (2019-06-27)

### Features

- **intl-relativetimeformat:** make intl-relativetimeformat test262-compliant ([#95](https://github.com/formatjs/formatjs/issues/95)) ([91669a3](https://github.com/formatjs/formatjs/commit/91669a3))
- **intl-utils:** Add intl-utils ([#98](https://github.com/formatjs/formatjs/issues/98)) ([2329c57](https://github.com/formatjs/formatjs/commit/2329c57))

## [3.1.2](https://github.com/formatjs/formatjs/compare/intl-format-cache@3.1.1...intl-format-cache@3.1.2) (2019-06-18)

**Note:** Version bump only for package intl-format-cache

## [3.1.1](https://github.com/formatjs/formatjs/compare/intl-format-cache@3.1.0...intl-format-cache@3.1.1) (2019-06-18)

**Note:** Version bump only for package intl-format-cache

# [3.1.0](https://github.com/formatjs/formatjs/compare/intl-format-cache@3.0.2...intl-format-cache@3.1.0) (2019-06-18)

### Features

- **intl-format-cache:** fix TS definition ([71ae9eb](https://github.com/formatjs/formatjs/commit/71ae9eb))

## [3.0.2](https://github.com/formatjs/formatjs/compare/intl-format-cache@3.0.1...intl-format-cache@3.0.2) (2019-06-12)

**Note:** Version bump only for package intl-format-cache

## [3.0.1](https://github.com/formatjs/formatjs/compare/intl-format-cache@3.0.0...intl-format-cache@3.0.1) (2019-06-05)

**Note:** Version bump only for package intl-format-cache

# [3.0.0](https://github.com/formatjs/formatjs/compare/intl-format-cache@2.2.9...intl-format-cache@3.0.0) (2019-06-05)

### Features

- add package intl-relativetimeformat ([#51](https://github.com/formatjs/formatjs/issues/51)) ([48c0f43](https://github.com/formatjs/formatjs/commit/48c0f43))
- **intl-messageformat:** rm bundled intl-pluralrules ([a8526c3](https://github.com/formatjs/formatjs/commit/a8526c3))

### BREAKING CHANGES

- **intl-messageformat:** We no longer include intl-pluralrules in our main index
  file. Consumer should polyfill accordingly.

## [2.2.9](https://github.com/formatjs/formatjs/compare/intl-format-cache@2.2.7...intl-format-cache@2.2.9) (2019-06-03)

**Note:** Version bump only for package intl-format-cache

## [2.2.8](https://github.com/formatjs/formatjs/compare/intl-format-cache@2.2.7...intl-format-cache@2.2.8) (2019-06-03)

**Note:** Version bump only for package intl-format-cache

## [2.2.7](https://github.com/formatjs/formatjs/compare/intl-format-cache@2.2.6...intl-format-cache@2.2.7) (2019-05-31)

**Note:** Version bump only for package intl-format-cache

## [2.2.6](https://github.com/formatjs/formatjs/compare/intl-format-cache@2.2.5...intl-format-cache@2.2.6) (2019-05-31)

**Note:** Version bump only for package intl-format-cache

## [2.2.5](https://github.com/formatjs/formatjs/compare/intl-format-cache@2.2.4...intl-format-cache@2.2.5) (2019-05-29)

**Note:** Version bump only for package intl-format-cache

## [2.2.4](https://github.com/formatjs/formatjs/compare/intl-format-cache@2.2.2...intl-format-cache@2.2.4) (2019-05-28)

**Note:** Version bump only for package intl-format-cache

## [2.2.3](https://github.com/formatjs/formatjs/compare/intl-format-cache@2.2.2...intl-format-cache@2.2.3) (2019-05-28)

**Note:** Version bump only for package intl-format-cache

## [2.2.2](https://github.com/formatjs/formatjs/compare/intl-format-cache@2.2.1...intl-format-cache@2.2.2) (2019-05-28)

**Note:** Version bump only for package intl-format-cache

## [2.2.1](https://github.com/formatjs/formatjs/compare/intl-format-cache@2.2.1...intl-format-cache@2.2.1) (2019-05-28)

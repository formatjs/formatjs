# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.4.3](https://github.com/formatjs/formatjs/compare/intl-messageformat@5.4.2...intl-messageformat@5.4.3) (2019-07-25)


### Bug Fixes

* **intl-messageformat:** fix regex, fix [#130](https://github.com/formatjs/formatjs/issues/130) ([f597630](https://github.com/formatjs/formatjs/commit/f597630))





## [5.4.2](https://github.com/formatjs/formatjs/compare/intl-messageformat@5.4.1...intl-messageformat@5.4.2) (2019-07-25)


### Bug Fixes

* **intl-messageformat:** Include Date in PrimitiveType ([1feca57](https://github.com/formatjs/formatjs/commit/1feca57)), closes [#127](https://github.com/formatjs/formatjs/issues/127)





## [5.4.1](https://github.com/formatjs/formatjs/compare/intl-messageformat@5.4.0...intl-messageformat@5.4.1) (2019-07-25)


### Bug Fixes

* **intl-messageformat:** fix formatXMLMessage w/o tag ([8d3bfcd](https://github.com/formatjs/formatjs/commit/8d3bfcd))





# [5.4.0](https://github.com/formatjs/formatjs/compare/intl-messageformat@5.3.0...intl-messageformat@5.4.0) (2019-07-25)


### Features

* **intl-messageformat:** allow mixed placeholder & XML together… ([#126](https://github.com/formatjs/formatjs/issues/126)) ([4a624c0](https://github.com/formatjs/formatjs/commit/4a624c0))





# [5.3.0](https://github.com/formatjs/formatjs/compare/intl-messageformat@5.2.0...intl-messageformat@5.3.0) (2019-07-25)


### Features

* **intl-messageformat:** allow passing in object to formatXMLMessage ([ce05b8a](https://github.com/formatjs/formatjs/commit/ce05b8a))





# [5.2.0](https://github.com/formatjs/formatjs/compare/intl-messageformat@5.1.2...intl-messageformat@5.2.0) (2019-07-25)


### Features

* **intl-messageformat:** Add xml formatting ([#124](https://github.com/formatjs/formatjs/issues/124)) ([72cdafc](https://github.com/formatjs/formatjs/commit/72cdafc))





## [5.1.2](https://github.com/formatjs/formatjs/compare/intl-messageformat@5.1.1...intl-messageformat@5.1.2) (2019-07-23)

**Note:** Version bump only for package intl-messageformat





## [5.1.1](https://github.com/formatjs/formatjs/compare/intl-messageformat@5.1.0...intl-messageformat@5.1.1) (2019-07-12)

**Note:** Version bump only for package intl-messageformat

# [5.1.0](https://github.com/formatjs/formatjs/compare/intl-messageformat@5.0.1...intl-messageformat@5.1.0) (2019-07-12)

### Features

- **intl-messageformat:** Add `formatToParts` ([0680f58](https://github.com/formatjs/formatjs/commit/0680f58))
- **intl-messageformat:** export Part types ([450c495](https://github.com/formatjs/formatjs/commit/450c495))
- **intl-messageformat-parser:** add printer to print AST to string ([ec0eaa2](https://github.com/formatjs/formatjs/commit/ec0eaa2))

## [5.0.1](https://github.com/formatjs/formatjs/compare/intl-messageformat@5.0.0...intl-messageformat@5.0.1) (2019-07-09)

**Note:** Version bump only for package intl-messageformat

# [5.0.0](https://github.com/formatjs/formatjs/compare/intl-messageformat@4.4.0...intl-messageformat@5.0.0) (2019-07-08)

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

# [4.4.0](https://github.com/formatjs/formatjs/compare/intl-messageformat@4.3.0...intl-messageformat@4.4.0) (2019-06-28)

### Features

- **intl-messageformat:** export core entry point ([ca7eeae](https://github.com/formatjs/formatjs/commit/ca7eeae))

# [4.3.0](https://github.com/formatjs/formatjs/compare/intl-messageformat@4.2.1...intl-messageformat@4.3.0) (2019-06-27)

### Features

- **intl-messageformat:** allow passing in formatters ([#107](https://github.com/formatjs/formatjs/issues/107)) ([3605693](https://github.com/formatjs/formatjs/commit/3605693))

## [4.2.1](https://github.com/formatjs/formatjs/compare/intl-messageformat@4.2.0...intl-messageformat@4.2.1) (2019-06-26)

**Note:** Version bump only for package intl-messageformat

# [4.2.0](https://github.com/formatjs/formatjs/compare/intl-messageformat@4.1.2...intl-messageformat@4.2.0) (2019-06-27)

### Features

- **intl-relativetimeformat:** make intl-relativetimeformat test262-compliant ([#95](https://github.com/formatjs/formatjs/issues/95)) ([91669a3](https://github.com/formatjs/formatjs/commit/91669a3))
- **intl-utils:** Add intl-utils ([#98](https://github.com/formatjs/formatjs/issues/98)) ([2329c57](https://github.com/formatjs/formatjs/commit/2329c57))

## [4.1.2](https://github.com/formatjs/formatjs/compare/intl-messageformat@4.1.1...intl-messageformat@4.1.2) (2019-06-18)

**Note:** Version bump only for package intl-messageformat

## [4.1.1](https://github.com/formatjs/formatjs/compare/intl-messageformat@4.1.0...intl-messageformat@4.1.1) (2019-06-18)

**Note:** Version bump only for package intl-messageformat

# [4.1.0](https://github.com/formatjs/formatjs/compare/intl-messageformat@4.0.1...intl-messageformat@4.1.0) (2019-06-18)

### Features

- **intl-format-cache:** fix TS definition ([71ae9eb](https://github.com/formatjs/formatjs/commit/71ae9eb))

## [4.0.1](https://github.com/formatjs/formatjs/compare/intl-messageformat@4.0.0...intl-messageformat@4.0.1) (2019-06-12)

**Note:** Version bump only for package intl-messageformat

# [4.0.0](https://github.com/formatjs/intl-messageformat/compare/intl-messageformat@3.3.0...intl-messageformat@4.0.0) (2019-06-05)

### Features

- add package intl-relativetimeformat ([#51](https://github.com/formatjs/intl-messageformat/issues/51)) ([48c0f43](https://github.com/formatjs/intl-messageformat/commit/48c0f43))
- **intl-messageformat:** rm bundled intl-pluralrules ([a8526c3](https://github.com/formatjs/intl-messageformat/commit/a8526c3))
- **intl-messageformat:** rm rolluped dist ([a126939](https://github.com/formatjs/intl-messageformat/commit/a126939))

### BREAKING CHANGES

- **intl-messageformat:** Change dist files packaged. Entry point should stay the
  same though.
- **intl-messageformat:** We no longer include intl-pluralrules in our main index
  file. Consumer should polyfill accordingly.

# [3.3.0](https://github.com/formatjs/intl-messageformat/compare/intl-messageformat@3.1.4...intl-messageformat@3.3.0) (2019-06-03)

### Features

- **intl-messageformat:** Add `getAst` method ([3d6c289](https://github.com/formatjs/intl-messageformat/commit/3d6c289))

# [3.2.0](https://github.com/formatjs/intl-messageformat/compare/intl-messageformat@3.1.4...intl-messageformat@3.2.0) (2019-06-03)

### Features

- **intl-messageformat:** Add `getAst` method ([3d6c289](https://github.com/formatjs/intl-messageformat/commit/3d6c289))

## [3.1.4](https://github.com/formatjs/intl-messageformat/compare/intl-messageformat@3.1.3...intl-messageformat@3.1.4) (2019-05-31)

**Note:** Version bump only for package intl-messageformat

## [3.1.3](https://github.com/formatjs/intl-messageformat/compare/intl-messageformat@3.1.2...intl-messageformat@3.1.3) (2019-05-28)

### Bug Fixes

- **intl-messageformat:** fix [#36](https://github.com/formatjs/intl-messageformat/issues/36) and config merging ([#40](https://github.com/formatjs/intl-messageformat/issues/40)) ([4a9969f](https://github.com/formatjs/intl-messageformat/commit/4a9969f))

## [3.1.2](https://github.com/formatjs/intl-messageformat/compare/intl-messageformat@3.1.2...intl-messageformat@3.1.2) (2019-05-28)

### Bug Fixes

- **intl-messageformat:** fix [#36](https://github.com/formatjs/intl-messageformat/issues/36) and config merging ([#40](https://github.com/formatjs/intl-messageformat/issues/40)) ([4a9969f](https://github.com/formatjs/intl-messageformat/commit/4a9969f))

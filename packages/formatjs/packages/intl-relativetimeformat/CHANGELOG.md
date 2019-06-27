# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.3.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-relativetimeformat@2.2.0...@formatjs/intl-relativetimeformat@2.3.0) (2019-06-27)


### Features

* **intl-messageformat:** allow passing in formatters ([#107](https://github.com/formatjs/formatjs/issues/107)) ([3605693](https://github.com/formatjs/formatjs/commit/3605693))





# [2.2.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-relativetimeformat@2.1.0...@formatjs/intl-relativetimeformat@2.2.0) (2019-06-26)

### Features

- **intl-relativetimeformat:** update LICENSE & README ([#100](https://github.com/formatjs/formatjs/issues/100)) ([3b1d11b](https://github.com/formatjs/formatjs/commit/3b1d11b))

# [2.1.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-relativetimeformat@2.0.2...@formatjs/intl-relativetimeformat@2.1.0) (2019-06-27)

### Features

- **intl-relativetimeformat:** make intl-relativetimeformat test262-compliant ([#95](https://github.com/formatjs/formatjs/issues/95)) ([91669a3](https://github.com/formatjs/formatjs/commit/91669a3))
- **intl-utils:** Add intl-utils ([#98](https://github.com/formatjs/formatjs/issues/98)) ([2329c57](https://github.com/formatjs/formatjs/commit/2329c57))

## [2.0.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-relativetimeformat@2.0.1...@formatjs/intl-relativetimeformat@2.0.2) (2019-06-18)

**Note:** Version bump only for package @formatjs/intl-relativetimeformat

## [2.0.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-relativetimeformat@2.0.0...@formatjs/intl-relativetimeformat@2.0.1) (2019-06-18)

**Note:** Version bump only for package @formatjs/intl-relativetimeformat

# [2.0.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-relativetimeformat@1.0.1...@formatjs/intl-relativetimeformat@2.0.0) (2019-06-18)

### Features

- **formatjs-extract-cldr-data:** migrate to TS ([#91](https://github.com/formatjs/formatjs/issues/91)) ([c012d6e](https://github.com/formatjs/formatjs/commit/c012d6e))
- **intl-format-cache:** fix TS definition ([71ae9eb](https://github.com/formatjs/formatjs/commit/71ae9eb))

### BREAKING CHANGES

- **formatjs-extract-cldr-data:** Export main function via `default` in index file.
  If you're using `require('formatjs-extract-cldr-data')`, change it to
  `require('formatjs-extract-cldr-data').default`.

## [1.0.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-relativetimeformat@1.0.0...@formatjs/intl-relativetimeformat@1.0.1) (2019-06-12)

**Note:** Version bump only for package @formatjs/intl-relativetimeformat

# 1.0.0 (2019-06-05)

### Features

- add package intl-relativetimeformat ([#51](https://github.com/formatjs/formatjs/issues/51)) ([48c0f43](https://github.com/formatjs/formatjs/commit/48c0f43))
- **intl-messageformat:** rm bundled intl-pluralrules ([a8526c3](https://github.com/formatjs/formatjs/commit/a8526c3))
- **intl-relativeformat:** Use Intl.RelativeTimeFormat ([c014ce0](https://github.com/formatjs/formatjs/commit/c014ce0))
- **intl-relativetimeformat:** rename due to npm squatting ([b4476e0](https://github.com/formatjs/formatjs/commit/b4476e0))

### BREAKING CHANGES

- **intl-messageformat:** We no longer include intl-pluralrules in our main index
  file. Consumer should polyfill accordingly.
- **intl-relativeformat:** We now use Intl.RelativeTimeFormat in
  intl-relativeformat so consuming env should polyfill this accordingly

# 1.0.0 (2019-06-05)

### Features

- add package intl-relativetimeformat ([#51](https://github.com/formatjs/formatjs/issues/51)) ([48c0f43](https://github.com/formatjs/formatjs/commit/48c0f43))
- **intl-messageformat:** rm bundled intl-pluralrules ([a8526c3](https://github.com/formatjs/formatjs/commit/a8526c3))
- **intl-relativeformat:** Use Intl.RelativeTimeFormat ([c014ce0](https://github.com/formatjs/formatjs/commit/c014ce0))

### BREAKING CHANGES

- **intl-messageformat:** We no longer include intl-pluralrules in our main index
  file. Consumer should polyfill accordingly.
- **intl-relativeformat:** We now use Intl.RelativeTimeFormat in
  intl-relativeformat so consuming env should polyfill this accordingly

# [3.1.0](https://github.com/formatjs/formatjs/compare/intl-relativeformat@3.0.1...intl-relativeformat@3.1.0) (2019-05-31)

### Features

- **intl-relativeformat:** expose es6 entry point in package.json ([baf36b5](https://github.com/formatjs/formatjs/commit/baf36b5))

## [3.0.1](https://github.com/formatjs/formatjs/compare/intl-relativeformat@2.2.0...intl-relativeformat@3.0.1) (2019-05-31)

**Note:** Version bump only for package intl-relativeformat

# [2.2.0](https://github.com/yahoo/intl-relativeformat/compare/intl-relativeformat@2.1.3...intl-relativeformat@2.2.0) (2019-05-29)

### Features

- **intl-relativeformat:** Improve day diffing ([#45](https://github.com/yahoo/intl-relativeformat/issues/45)) ([8f2c649](https://github.com/yahoo/intl-relativeformat/commit/8f2c649))

## [2.1.3](https://github.com/yahoo/intl-relativeformat/compare/intl-relativeformat@2.1.1...intl-relativeformat@2.1.3) (2019-05-28)

**Note:** Version bump only for package intl-relativeformat

## [2.1.2](https://github.com/yahoo/intl-relativeformat/compare/intl-relativeformat@2.1.1...intl-relativeformat@2.1.2) (2019-05-28)

**Note:** Version bump only for package intl-relativeformat

## 2.1.1 (2019-05-28)

**Note:** Version bump only for package intl-relativeformat

# 2.1.0 (2019-05-28)

# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.2.2](https://github.com/formatjs/formatjs/compare/intl-relativeformat@6.2.1...intl-relativeformat@6.2.2) (2019-06-18)

**Note:** Version bump only for package intl-relativeformat

## [6.2.1](https://github.com/formatjs/formatjs/compare/intl-relativeformat@6.2.0...intl-relativeformat@6.2.1) (2019-06-18)

**Note:** Version bump only for package intl-relativeformat

# [6.2.0](https://github.com/formatjs/formatjs/compare/intl-relativeformat@6.1.1...intl-relativeformat@6.2.0) (2019-06-18)

### Features

- **intl-format-cache:** fix TS definition ([71ae9eb](https://github.com/formatjs/formatjs/commit/71ae9eb))

## [6.1.1](https://github.com/formatjs/formatjs/compare/intl-relativeformat@6.1.0...intl-relativeformat@6.1.1) (2019-06-12)

**Note:** Version bump only for package intl-relativeformat

# [6.1.0](https://github.com/formatjs/formatjs/compare/intl-relativeformat@6.0.0...intl-relativeformat@6.1.0) (2019-06-05)

### Features

- **intl-relativetimeformat:** rename due to npm squatting ([b4476e0](https://github.com/formatjs/formatjs/commit/b4476e0))

# [6.0.0](https://github.com/formatjs/formatjs/compare/intl-relativeformat@5.0.0...intl-relativeformat@6.0.0) (2019-06-05)

### Features

- add package intl-relativetimeformat ([#51](https://github.com/formatjs/formatjs/issues/51)) ([48c0f43](https://github.com/formatjs/formatjs/commit/48c0f43))
- **intl-relativeformat:** rm rolluped dist ([c6f94e4](https://github.com/formatjs/formatjs/commit/c6f94e4))
- **intl-relativeformat:** Use Intl.RelativeTimeFormat ([c014ce0](https://github.com/formatjs/formatjs/commit/c014ce0))

### BREAKING CHANGES

- **intl-relativeformat:** This changes the list of assets we package. However,
  entry point is still intact.
- **intl-relativeformat:** We now use Intl.RelativeTimeFormat in
  intl-relativeformat so consuming env should polyfill this accordingly

# [5.0.0](https://github.com/formatjs/formatjs/compare/intl-relativeformat@3.1.0...intl-relativeformat@5.0.0) (2019-06-03)

### Features

- **formatjs-extract-cldr-data:** add quarter data ([#53](https://github.com/formatjs/formatjs/issues/53)) ([e37a242](https://github.com/formatjs/formatjs/commit/e37a242))
- **formatjs-extract-cldr-data:** rm plural ([#52](https://github.com/formatjs/formatjs/issues/52)) ([62a6de4](https://github.com/formatjs/formatjs/commit/62a6de4))
- **intl-messageformat:** Add `getAst` method ([3d6c289](https://github.com/formatjs/formatjs/commit/3d6c289))

### BREAKING CHANGES

- **formatjs-extract-cldr-data:** Remove plural extraction since we rely on native
  Intl.PluralRules

* Upgrade CLDR to v35
* Extract `*-narrow` rules for relative fields
* Remove es-AR since as of CLDRv35 it cannot be de-duped

# [4.0.0](https://github.com/formatjs/formatjs/compare/intl-relativeformat@3.1.0...intl-relativeformat@4.0.0) (2019-06-03)

### Features

- **formatjs-extract-cldr-data:** add quarter data ([#53](https://github.com/formatjs/formatjs/issues/53)) ([e37a242](https://github.com/formatjs/formatjs/commit/e37a242))
- **formatjs-extract-cldr-data:** rm plural ([#52](https://github.com/formatjs/formatjs/issues/52)) ([62a6de4](https://github.com/formatjs/formatjs/commit/62a6de4))
- **intl-messageformat:** Add `getAst` method ([3d6c289](https://github.com/formatjs/formatjs/commit/3d6c289))

### BREAKING CHANGES

- **formatjs-extract-cldr-data:** Remove plural extraction since we rely on native
  Intl.PluralRules

* Upgrade CLDR to v35
* Extract `*-narrow` rules for relative fields
* Remove es-AR since as of CLDRv35 it cannot be de-duped

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

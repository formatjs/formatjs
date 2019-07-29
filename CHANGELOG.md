# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [3.0.0-beta.22](https://github.com/yahoo/react-intl/compare/v3.0.0-beta.21...v3.0.0-beta.22) (2019-07-29)


### Bug Fixes

* rm componentWillReceiveProps from relative ([964159b](https://github.com/yahoo/react-intl/commit/964159b))


### Features

* upgrade intl-messageformat with new apostrophe escape ([f59607e](https://github.com/yahoo/react-intl/commit/f59607e))

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

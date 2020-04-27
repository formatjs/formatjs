# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [4.5.0](https://github.com/formatjs/react-intl/compare/v4.4.0...v4.5.0) (2020-04-20)


### Features

* upgrade intl-messageformat & parser ([cbbd6cf](https://github.com/formatjs/react-intl/commit/cbbd6cf93ee6294bdfbc28af3e33227df0e621e4))

## [4.4.0](https://github.com/formatjs/react-intl/compare/v4.3.1...v4.4.0) (2020-04-14)


### Features

* add `defineMessage` macro to tag single message ([8bd9ad8](https://github.com/formatjs/react-intl/commit/8bd9ad8ddf632f500f4b3e0e7786a48c227c9961))

### [4.3.1](https://github.com/formatjs/react-intl/compare/v4.3.0...v4.3.1) (2020-03-28)


### Bug Fixes

* tweak FormatXMLElementFn ([a914dc0](https://github.com/formatjs/react-intl/commit/a914dc059cc8d0c04baec6a63513cb686ff6dad3))

## [4.3.0](https://github.com/formatjs/react-intl/compare/v4.2.2...v4.3.0) (2020-03-26)


### Features

* **react-intl:** store original message descriptor in the error ([22531bd](https://github.com/formatjs/react-intl/commit/22531bde78e0f3846b583b5bf0e4115e872f9a54))

### [4.2.2](https://github.com/formatjs/react-intl/compare/v4.2.1...v4.2.2) (2020-03-21)


### Bug Fixes

* turn on preserveConstEnums so we export ReactIntlErrorCode ([8e00610](https://github.com/formatjs/react-intl/commit/8e006105a7286aba0efdb985eb588d03597b186b))

### [4.2.1](https://github.com/formatjs/react-intl/compare/v4.2.0...v4.2.1) (2020-03-21)


### Bug Fixes

* include intl-displaynames types in bundled react-intl.d.ts ([77ef36c](https://github.com/formatjs/react-intl/commit/77ef36cb2f522587c454469241d9a4974963ccb8))

## [4.2.0](https://github.com/formatjs/react-intl/compare/v4.1.1...v4.2.0) (2020-03-21)


### Features

* add wrapRichTextChunksInFragment option ([7864e1c](https://github.com/formatjs/react-intl/commit/7864e1c8704b5aba3d82d8318f94ef789e045d04))

### [4.1.1](https://github.com/formatjs/react-intl/compare/v4.1.0...v4.1.1) (2020-03-06)


### Bug Fixes

* dont warn if locale is the same as defaultLocale ([c8b178b](https://github.com/formatjs/react-intl/commit/c8b178b1e825b3e1abc2417c3ec60d92ab1911f6)), closes [#1594](https://github.com/formatjs/react-intl/issues/1594)

## [4.1.0](https://github.com/formatjs/react-intl/compare/v4.0.0...v4.1.0) (2020-03-05)


### Features

* Introduce ReactIntlErrorCode so we can distinguish and log things differently ([5b2b034](https://github.com/formatjs/react-intl/commit/5b2b034b0afd03479943cf4d1162be532deb95b8))

## [4.0.0](https://github.com/formatjs/react-intl/compare/v3.12.1...v4.0.0) (2020-03-05)


### ⚠ BREAKING CHANGES

* This release contains subtle changes to the way we handle embedded HTML Message:

1. All tags specified must have corresponding values and will throw
error if it's missing, e.g:
```
new IntlMessageFormat("a<b>strong</b>").format({ b: (...chunks) => <strong>chunks</strong> })
```
2. We don't allow formatting self-closing tags because we already use ICU `{placeholder}` syntax for that.
3. XML/HTML tags are escaped using apostrophe just like other ICU constructs.
4. Remove dependency on DOMParser and restrictions on void element like `<link>`. This effectively means you don't need to polyfill DOMParser in Node anymore.
5. `FormattedHTMLMessage` & `intl.formatHTMLMessage` have been removed since `FormattedMessage` now fully supports embedded HTML tag.

Why are we doing those changes?
- `FormattedHTMLMessage` & `intl.formatHTMLMessage` were originally created when React was fairly new. These components helped ease migration over from raw HTML to JSX. Given that current popularity of React right now and the fact that `FormattedMessage` allow rendering embedded HTML tag, this is no longer needed.
- Initially during the 1st iteration of embedded HTML support, we allow any tag that doesn’t have a corresponding formatter to be rendered as raw HTML. We’ve received feedbacks internally that allowing embedded HTML tag to be rendered as-is without sanitization is a XSS security risk. Therefore, in order to allow raw HTML tag you have to opt-in by escaping them using apostrophe. We will update our linter to check for this as well.

### Features

* Upgrade intl-messageformat & intl-messageformat-parser, remove FormattedHTMLMessage ([fae69e9](https://github.com/formatjs/react-intl/commit/fae69e9da2cfd395eeb5d7333a637f6627d94ade))

### [3.12.1](https://github.com/formatjs/react-intl/compare/v3.12.0...v3.12.1) (2020-03-04)


### Bug Fixes

* clarify err messages ([b207d80](https://github.com/formatjs/react-intl/commit/b207d805a9e5609983ac1b2ca8f9708030e12337))
* inline defineMessages macro, fix [#1592](https://github.com/formatjs/react-intl/issues/1592) ([5ae8349](https://github.com/formatjs/react-intl/commit/5ae8349dc2ee08b54a54a2a521b8a9c052960d04))

## [3.12.0](https://github.com/formatjs/react-intl/compare/v3.11.0...v3.12.0) (2020-02-04)


### Features

* add formatDisplayName and FormattedDisplayName ([#1567](https://github.com/formatjs/react-intl/issues/1567)) ([10bcbe2](https://github.com/formatjs/react-intl/commit/10bcbe2e7e92902d60810a7c00568d3043b09db3)), closes [#1547](https://github.com/formatjs/react-intl/issues/1547)

## [3.11.0](https://github.com/formatjs/react-intl/compare/v3.10.0...v3.11.0) (2020-01-09)


### Features

* Allow MessageDescriptor ID to be `number` ([#1553](https://github.com/formatjs/react-intl/issues/1553)) ([95298b2](https://github.com/formatjs/react-intl/commit/95298b2b5f09173258fe9648d49fc9fa1ad673fc))


### Bug Fixes

* add a parser for chunks emitted from formatHTMLMessage ([#1550](https://github.com/formatjs/react-intl/issues/1550)) ([8c3c5c7](https://github.com/formatjs/react-intl/commit/8c3c5c78afa16d605933c82571f3b92b15363c27))
* update formatjs deps ([1745c21](https://github.com/formatjs/react-intl/commit/1745c21b9ae5e6443f1ad5209f77cc9cb6ad66eb))

## [3.10.0](https://github.com/formatjs/react-intl/compare/v3.9.2...v3.10.0) (2019-12-26)


### Features

* Upgrade intl-unified-numberformat & TypeScript ([ddf411a](https://github.com/formatjs/react-intl/commit/ddf411a6089005671f3d1ab8d11e04564da0f2e7))

### [3.9.2](https://github.com/formatjs/react-intl/compare/v3.9.1...v3.9.2) (2019-12-10)


### Bug Fixes

* add type overload for formatList, fix [#1537](https://github.com/formatjs/react-intl/issues/1537) ([6629899](https://github.com/formatjs/react-intl/commit/662989973c8d08f7972a3ba75f70b19abc507bb9))
* fix list formatter generation types ([0e5f205](https://github.com/formatjs/react-intl/commit/0e5f2058d7cba2d886693e219f58366582f0a6ac))

### [3.9.1](https://github.com/formatjs/react-intl/compare/v3.9.0...v3.9.1) (2019-12-02)


### Bug Fixes

* Add src to packaged tar for sourcemap ([bce9bc7](https://github.com/formatjs/react-intl/commit/bce9bc7f6e014ec5ac1d67aa5daedc9214b75297))

## [3.9.0](https://github.com/formatjs/react-intl/compare/v3.8.0...v3.9.0) (2019-12-02)


### Features

* Upgrade intl-messageformat-parser with support for unit-width in skeleton ([4b8f09f](https://github.com/formatjs/react-intl/commit/4b8f09f567ea09c5f5b576113ed963523832f942))

## [3.8.0](https://github.com/formatjs/react-intl/compare/v3.7.0...v3.8.0) (2019-12-01)


### Features

* Upgrade intl-messageformat-parser ([c12c99d](https://github.com/formatjs/react-intl/commit/c12c99dfdd8dfabf3d0103ce3c02e35b22d03be6))

Following our previous release with preliminary DateTimeFormat's
skeleton parser, this release comes with a subset of ICU NumberFormat's
skeleton parser. The full feature set can be found [here](unicode-org/icu:docs/userguide/format_parse/numbers/skeletons.md@master).

This, in combination with [intl-unified-numberformat](tc39/proposal-unified-intl-numberformat) allows you to write shorthand
NumberFormat in your messages like `{amount, number, ::currency/CAD .00}`

## [3.7.0](https://github.com/formatjs/react-intl/compare/v3.6.2...v3.7.0) (2019-11-25)


### Features

* Introduce support for DateTime skeleton ([568d013](https://github.com/formatjs/react-intl/commit/568d01342299135e9b049f9d4014193315fac41e))

This bumps the version of `intl-messageformat`, thus introducing a
subset of
[DateTime Skeleton](https://github.com/formatjs/formatjs/tree/master/packages/intl-messageformat-parser#supported-datetime-skeleton)
to react-intl.
The skeleton syntax per ICU is `today is {ts, time, ::yyyyMMdd}`.
Further documentation can be read at
http://userguide.icu-project.org/formatparse/datetime.

### [3.6.2](https://github.com/formatjs/react-intl/compare/v3.6.1...v3.6.2) (2019-11-21)


### Bug Fixes

* fix main types file path in package.json ([14048bb](https://github.com/formatjs/react-intl/commit/14048bba41a7e02a8a0669ef14aa510acb089dc9))

### [3.6.1](https://github.com/formatjs/react-intl/compare/v3.6.0...v3.6.1) (2019-11-19)


### Bug Fixes

* make `id` optional in MessageDescriptor ([15ca429](https://github.com/formatjs/react-intl/commit/15ca4292faf0fd82a392c024f027196393e52124))
* use `files` instead of .npmignore, update contributors ([b0c0fdb](https://github.com/formatjs/react-intl/commit/b0c0fdb1efa4dd9dfcf1d8c5709c5454bf242fce))

## [3.6.0](https://github.com/formatjs/react-intl/compare/v3.4.0...v3.6.0) (2019-11-12)


### Bug Fixes

* remove babel.config.js from npm package ([5c1f1ed](https://github.com/formatjs/react-intl/commit/5c1f1ed)), closes [#1512](https://github.com/formatjs/react-intl/issues/1512)

## [3.5.0](https://github.com/formatjs/react-intl/compare/v3.4.0...v3.5.0) (2019-11-10)


### Features

* add `formatList` & `FormattedList` ([#1494](https://github.com/formatjs/react-intl/issues/1494)) ([f5eacbf](https://github.com/formatjs/react-intl/commit/f5eacbf))
* alias `defineMessages` to `@formatjs/macro` and deprecate our own ([f6ab2f1](https://github.com/formatjs/react-intl/commit/f6ab2f1))

## [3.4.0](https://github.com/formatjs/react-intl/compare/v3.3.2...v3.4.0) (2019-10-23)


### Bug Fixes

* fix format merging for message ([0a564dc](https://github.com/formatjs/react-intl/commit/0a564dc)), closes [#1500](https://github.com/formatjs/react-intl/issues/1500)


### Features

* add support for unified numberformat new options, fix [#1501](https://github.com/formatjs/react-intl/issues/1501) ([ff2629b](https://github.com/formatjs/react-intl/commit/ff2629b))

### [3.3.2](https://github.com/formatjs/react-intl/compare/v3.3.1...v3.3.2) (2019-09-27)


### Bug Fixes

* merge timeZone into formats when formatting message ([aea3f56](https://github.com/formatjs/react-intl/commit/aea3f56)), closes [#1219](https://github.com/formatjs/react-intl/issues/1219)
* remove custom unescaping of static message ([aefb68b](https://github.com/formatjs/react-intl/commit/aefb68b))

### [3.3.1](https://github.com/formatjs/react-intl/compare/v3.3.0...v3.3.1) (2019-09-26)


### Bug Fixes

* properly override timeZone in formats/defaultFormats ([f2b93e6](https://github.com/formatjs/react-intl/commit/f2b93e6)), closes [#1219](https://github.com/formatjs/react-intl/issues/1219)

## [3.3.0](https://github.com/formatjs/react-intl/compare/v3.2.3...v3.3.0) (2019-09-19)


### Bug Fixes

* fix copy-paste issue in polyfill, fixes [#1488](https://github.com/formatjs/react-intl/issues/1488) ([0f9ec81](https://github.com/formatjs/react-intl/commit/0f9ec81))


### Features

* mark react-intl as side effect free ([704a964](https://github.com/formatjs/react-intl/commit/704a964))

### [3.2.4](https://github.com/formatjs/react-intl/compare/v3.2.3...v3.2.4) (2019-09-19)


### Bug Fixes

* fix copy-paste issue in polyfill, fixes [#1488](https://github.com/formatjs/react-intl/issues/1488) ([0f9ec81](https://github.com/formatjs/react-intl/commit/0f9ec81))

### [3.2.3](https://github.com/formatjs/react-intl/compare/v3.2.1...v3.2.3) (2019-09-18)


### Bug Fixes

* check PluralRules & RelativeTimeFormat lazily instead ([3ed95fe](https://github.com/formatjs/react-intl/commit/3ed95fe)), closes [#1487](https://github.com/formatjs/react-intl/issues/1487)

### [3.2.2](https://github.com/formatjs/react-intl/compare/v3.2.1...v3.2.2) (2019-09-17)

### [3.2.1](https://github.com/formatjs/react-intl/compare/v3.2.0...v3.2.1) (2019-09-09)


### Bug Fixes

* upgrade intl-messageformat ([40aa758](https://github.com/formatjs/react-intl/commit/40aa758))

## [3.2.0](https://github.com/formatjs/react-intl/compare/v3.2.0-rc.2...v3.2.0) (2019-09-04)

## [3.2.0-rc.2](https://github.com/formatjs/react-intl/compare/v3.2.0-rc.1...v3.2.0-rc.2) (2019-08-29)


### Bug Fixes

* fix tests & add corresponding formatToParts fns ([855e272](https://github.com/formatjs/react-intl/commit/855e272))


### Features

* extend numberformat to unified ([#1462](https://github.com/formatjs/react-intl/issues/1462)) ([a7f2104](https://github.com/formatjs/react-intl/commit/a7f2104))

## [3.2.0-rc.1](https://github.com/formatjs/react-intl/compare/v3.2.0-rc.0...v3.2.0-rc.1) (2019-08-29)

## [3.2.0-rc.0](https://github.com/formatjs/react-intl/compare/v3.1.2...v3.2.0-rc.0) (2019-08-29)

### Features

* add support for formatToParts ([e8167f3](https://github.com/formatjs/react-intl/commit/e8167f3))
* introduce Parts component ([a1b5ff1](https://github.com/formatjs/react-intl/commit/a1b5ff1)), closes [#1048](https://github.com/formatjs/react-intl/issues/1048)

### [3.1.13](https://github.com/formatjs/react-intl/compare/v3.1.12...v3.1.13) (2019-08-28)


### Bug Fixes

* handle relative time when it hits 0 ([3b9df15](https://github.com/formatjs/react-intl/commit/3b9df15)), closes [#1455](https://github.com/formatjs/react-intl/issues/1455)

### [3.1.12](https://github.com/formatjs/react-intl/compare/v3.1.11...v3.1.12) (2019-08-26)


### Bug Fixes

* type def for forwardRef in injectIntl, fix [#1444](https://github.com/formatjs/react-intl/issues/1444) ([45887bf](https://github.com/formatjs/react-intl/commit/45887bf))
* update intl-messageformat ([d1271b6](https://github.com/formatjs/react-intl/commit/d1271b6)), closes [#1451](https://github.com/formatjs/react-intl/issues/1451) [#1442](https://github.com/formatjs/react-intl/issues/1442)

### [3.1.11](https://github.com/formatjs/react-intl/compare/v3.1.10...v3.1.11) (2019-08-21)


### Bug Fixes

* remove params spread, potentially fix [#1424](https://github.com/formatjs/react-intl/issues/1424) ([aeb177c](https://github.com/formatjs/react-intl/commit/aeb177c))

### [3.1.10](https://github.com/formatjs/react-intl/compare/v3.1.9...v3.1.10) (2019-08-20)


### Bug Fixes

* fix UMD build ([fc17473](https://github.com/formatjs/react-intl/commit/fc17473)), closes [#1423](https://github.com/formatjs/react-intl/issues/1423)
* fix UMD build, defer react-is to external ([4731805](https://github.com/formatjs/react-intl/commit/4731805))

### [3.1.9](https://github.com/formatjs/react-intl/compare/v3.1.8...v3.1.9) (2019-08-16)


### Bug Fixes

* fix UMD build ([ad78e3f](https://github.com/formatjs/react-intl/commit/ad78e3f)), closes [#1423](https://github.com/formatjs/react-intl/issues/1423)
* move react & @types/react to devDep, fixes [#1389](https://github.com/formatjs/react-intl/issues/1389) ([0133241](https://github.com/formatjs/react-intl/commit/0133241)), closes [/github.com/yarnpkg/yarn/issues/3951#issuecomment-316424639](https://github.com/formatjs//github.com/yarnpkg/yarn/issues/3951/issues/issuecomment-316424639)

### [3.1.8](https://github.com/formatjs/react-intl/compare/v3.1.7...v3.1.8) (2019-08-13)


### Bug Fixes

* remove injectIntl types from component props ([#1415](https://github.com/formatjs/react-intl/issues/1415)) ([9b359ec](https://github.com/formatjs/react-intl/commit/9b359ec)), closes [#1414](https://github.com/formatjs/react-intl/issues/1414)

### [3.1.7](https://github.com/formatjs/react-intl/compare/v3.1.5...v3.1.7) (2019-08-13)


### Bug Fixes

* avoid wrapping components with injectIntl ([#1413](https://github.com/formatjs/react-intl/issues/1413)), fixes [#1412](https://github.com/formatjs/react-intl/issues/1412) ([ce560e7](https://github.com/formatjs/react-intl/commit/ce560e7))
* fix state typo, fixes [#1411](https://github.com/formatjs/react-intl/issues/1411) ([46ad1c8](https://github.com/formatjs/react-intl/commit/46ad1c8))

### [3.1.6](https://github.com/formatjs/react-intl/compare/v3.1.5...v3.1.6) (2019-08-12)


### Bug Fixes

* fix state typo, fixes [#1411](https://github.com/formatjs/react-intl/issues/1411) ([46ad1c8](https://github.com/formatjs/react-intl/commit/46ad1c8))

### [3.1.5](https://github.com/formatjs/react-intl/compare/v3.1.4...v3.1.5) (2019-08-11)


### Bug Fixes

* drop @types/react version to 16.0 ([1669f0e](https://github.com/formatjs/react-intl/commit/1669f0e))

### [3.1.4](https://github.com/formatjs/react-intl/compare/v3.1.3...v3.1.4) (2019-08-11)


### Bug Fixes

* Fix broken links in Getting Started (fix [#1403](https://github.com/formatjs/react-intl/issues/1403)) ([#1405](https://github.com/formatjs/react-intl/issues/1405)) ([57f0748](https://github.com/formatjs/react-intl/commit/57f0748))
* generate lib instead of mjs ([99f9257](https://github.com/formatjs/react-intl/commit/99f9257)), closes [#1395](https://github.com/formatjs/react-intl/issues/1395) [#1407](https://github.com/formatjs/react-intl/issues/1407)

### [3.1.3](https://github.com/formatjs/react-intl/compare/v3.1.1...v3.1.3) (2019-08-09)


### Bug Fixes

* allow string in formatDate & formatTime ([aed8c68](https://github.com/formatjs/react-intl/commit/aed8c68)), closes [#1396](https://github.com/formatjs/react-intl/issues/1396)
* create initial intl for Provider ([4306275](https://github.com/formatjs/react-intl/commit/4306275))
* formatRelativeTime type def unit param ([cb7da58](https://github.com/formatjs/react-intl/commit/cb7da58))
* remove contextType usage ([660a546](https://github.com/formatjs/react-intl/commit/660a546))

### [3.1.2](https://github.com/formatjs/react-intl/compare/v3.1.1...v3.1.2) (2019-08-09)


### Bug Fixes

* allow string in formatDate & formatTime ([aed8c68](https://github.com/formatjs/react-intl/commit/aed8c68)), closes [#1396](https://github.com/formatjs/react-intl/issues/1396)
* formatRelativeTime type def unit param ([cb7da58](https://github.com/formatjs/react-intl/commit/cb7da58))
* remove contextType usage ([660a546](https://github.com/formatjs/react-intl/commit/660a546))

### [3.1.1](https://github.com/yahoo/react-intl/compare/v3.1.0...v3.1.1) (2019-08-02)


### Bug Fixes

* only createIntl from filteredProps ([d665f31](https://github.com/yahoo/react-intl/commit/d665f31))

## [3.1.0](https://github.com/yahoo/react-intl/compare/v3.0.0...v3.1.0) (2019-08-06)


### Bug Fixes

* add "types" property to package.json ([#1394](https://github.com/yahoo/react-intl/issues/1394)) ([a82ddd0](https://github.com/yahoo/react-intl/commit/a82ddd0))
* add createIntlCache to top level index, fixes [#1393](https://github.com/yahoo/react-intl/issues/1393) ([19398d7](https://github.com/yahoo/react-intl/commit/19398d7))


### Features

* generate .mjs instead of lib ([5fd070d](https://github.com/yahoo/react-intl/commit/5fd070d))

## [3.0.0](https://github.com/yahoo/react-intl/compare/v3.0.0-beta.23...v3.0.0) (2019-08-06)


### Bug Fixes

* rm core pkg for now ([223d2cf](https://github.com/yahoo/react-intl/commit/223d2cf))
* rm rollup for core, reduce @types/react version ([336d365](https://github.com/yahoo/react-intl/commit/336d365))
* type definitions and make behavior match spec more ([2030bdd](https://github.com/yahoo/react-intl/commit/2030bdd))

## [3.0.0-beta.23](https://github.com/yahoo/react-intl/compare/v3.0.0-beta.22...v3.0.0-beta.23) (2019-08-02)

### Features

- simplify provider inheritance, add new APIs ([#1387](https://github.com/yahoo/react-intl/issues/1387)) ([227a444](https://github.com/yahoo/react-intl/commit/227a444)), closes [#1386](https://github.com/yahoo/react-intl/issues/1386) [#1376](https://github.com/yahoo/react-intl/issues/1376)

## [3.0.0-beta.22](https://github.com/yahoo/react-intl/compare/v3.0.0-beta.21...v3.0.0-beta.22) (2019-07-29)

### Bug Fixes

- rm componentWillReceiveProps from relative ([964159b](https://github.com/yahoo/react-intl/commit/964159b))

### Features

- upgrade intl-messageformat with new apostrophe escape ([f59607e](https://github.com/yahoo/react-intl/commit/f59607e))

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

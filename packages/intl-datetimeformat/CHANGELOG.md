# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.3.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat@1.3.2...@formatjs/intl-datetimeformat@1.3.3) (2020-07-01)


### Bug Fixes

* **@formatjs/intl-datetimeformat:** fix modulo operation, close [#1757](https://github.com/formatjs/formatjs/issues/1757) ([09e1a88](https://github.com/formatjs/formatjs/commit/09e1a88b4c6568be4f3aeb7dbc5fac1692e5c320))





## [1.3.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat@1.3.1...@formatjs/intl-datetimeformat@1.3.2) (2020-06-26)


### Bug Fixes

* **@formatjs/intl-datetimeformat:** trigger polyfill if chrome has the 71- bug ([a925df8](https://github.com/formatjs/formatjs/commit/a925df80b8de0b20b28d1947d43e8f7e618baec2))





## [1.3.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat@1.3.0...@formatjs/intl-datetimeformat@1.3.1) (2020-06-26)


### Bug Fixes

* **@formatjs/intl-datetimeformat:** fix polyfill check since dateStyle is not stage-4 yet ([a212b42](https://github.com/formatjs/formatjs/commit/a212b42a4f44f9c2be53de9928cb450c4e14c7ea))





# [1.3.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat@1.2.2...@formatjs/intl-datetimeformat@1.3.0) (2020-06-26)


### Features

* **@formatjs/intl-datetimeformat:** Add polyfill for Date.prototype.toLocaleString ([a5eef6d](https://github.com/formatjs/formatjs/commit/a5eef6d9d2842ecb71577fd3b754178ed09a1d99))
* **@formatjs/intl-datetimeformat:** Add polyfill for Date.prototype.toLocaleTimeString ([649e83d](https://github.com/formatjs/formatjs/commit/649e83da3933db5a6bdae5ec65f7c47f5d6a1beb))





## [1.2.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat@1.2.1...@formatjs/intl-datetimeformat@1.2.2) (2020-06-23)


### Bug Fixes

* **@formatjs/intl-datetimeformat:** add allowlist of files to package.json so yarn works ([778378c](https://github.com/formatjs/formatjs/commit/778378c0495e5bd0c74d265a294189777e31028e))





## [1.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat@1.2.0...@formatjs/intl-datetimeformat@1.2.1) (2020-06-23)

**Note:** Version bump only for package @formatjs/intl-datetimeformat





# [1.2.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat@1.1.1...@formatjs/intl-datetimeformat@1.2.0) (2020-06-23)


### Features

* **@formatjs/intl-datetimeformat:** generate rolluped d.ts ([c6c9b19](https://github.com/formatjs/formatjs/commit/c6c9b19c1f2703203f341c93df46f28175456a6e)), closes [#1739](https://github.com/formatjs/formatjs/issues/1739)





## [1.1.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat@1.1.0...@formatjs/intl-datetimeformat@1.1.1) (2020-06-20)


### Bug Fixes

* **@formatjs/intl-datetimeformat:** Add README.md ([52796cb](https://github.com/formatjs/formatjs/commit/52796cb5b9e85d1ac55431deabbaf61e4ee5323c))





# [1.1.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-datetimeformat@0.2.0...@formatjs/intl-datetimeformat@1.1.0) (2020-06-20)


### Bug Fixes

* **@formatjs/intl-datetimeformat:** add zdump data ([fdb8af4](https://github.com/formatjs/formatjs/commit/fdb8af4f31596c4c1631db96fc0cadfc3121ff7a))
* **@formatjs/intl-datetimeformat:** fix data.zdump ([940fbd6](https://github.com/formatjs/formatjs/commit/940fbd60438ea1bb035bfac8827330a86becf241))
* **@formatjs/intl-datetimeformat:** fix month calc ([d65abb1](https://github.com/formatjs/formatjs/commit/d65abb1835aff2c58cd3e2093938a1a58ae6812c))
* **@formatjs/intl-datetimeformat:** fix mutability issue ([3bf6ec6](https://github.com/formatjs/formatjs/commit/3bf6ec65b5f53f86c92ae2b77c149abdf29de880))
* **@formatjs/intl-datetimeformat:** fix node 14 cldr build ([62eab99](https://github.com/formatjs/formatjs/commit/62eab994e401590925735b4905f7e3b14f2198a8))
* **@formatjs/intl-datetimeformat:** fix timeData processing with region ([689db86](https://github.com/formatjs/formatjs/commit/689db86b9a51c062e559c76c61306484a576ebfd))
* **@formatjs/intl-datetimeformat:** fix timezone name algo ([8a996c8](https://github.com/formatjs/formatjs/commit/8a996c8b004a3125e1913cf5a29c2f630184fe7c))
* **@formatjs/intl-datetimeformat:** fix timeZoneName CLDR & lookup, add best fit lookup ([2570022](https://github.com/formatjs/formatjs/commit/2570022d9fcece1265e726745b7f93aef6b00a76))
* **@formatjs/intl-datetimeformat:** tweak best fit format matcher ([f994502](https://github.com/formatjs/formatjs/commit/f994502c64ae38eb23259851e600a2cec28ed382))


### Features

* **@formatjs/intl-datetimeformat:** start the polyfill ([#1702](https://github.com/formatjs/formatjs/issues/1702)) ([53f8149](https://github.com/formatjs/formatjs/commit/53f81495edcc9fa2475c1f7863f8dd7d962f2f61))





# 0.2.0 (2020-06-06)


### Features

* **@formatjs/intl-datetimeformat:** initial commit ([d83c188](https://github.com/formatjs/formatjs/commit/d83c18877afa58fc861955c50f1d020c3451ec9e))

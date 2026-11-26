# Changelog

## [1.1.2](https://github.com/formatjs/formatjs/compare/formatjs_intl_datetimeformat_v1.1.1...formatjs_intl_datetimeformat_v1.1.2) (2026-11-26)


### Bug Fixes

* **@formatjs/intl-datetimeformat:** defer unused range fallback ([#8193](https://github.com/formatjs/formatjs/issues/8193)) ([385e6cd](https://github.com/formatjs/formatjs/commit/385e6cd05d298e536ba6a5c080b97c7c0b129a5e))
* **@formatjs/intl-datetimeformat:** fall back for missing cyclic year names ([#8208](https://github.com/formatjs/formatjs/issues/8208)) ([bbe6c06](https://github.com/formatjs/formatjs/commit/bbe6c063549371313d9139a526c81b01a3cdef7e))
* **@formatjs/intl-datetimeformat:** keep calendar names in their own records ([#8210](https://github.com/formatjs/formatjs/issues/8210)) ([33d1083](https://github.com/formatjs/formatjs/commit/33d10838aefc1b7ab52907d9b58f63e7301bfd25))
* **@formatjs/intl-datetimeformat:** preserve fallback range endpoint sources ([#8211](https://github.com/formatjs/formatjs/issues/8211)) ([8e9d7cc](https://github.com/formatjs/formatjs/commit/8e9d7ccf643af985aaae2a18e6e7bb596f899770))
* align Intl polyfills with ECMA-402 ([#8160](https://github.com/formatjs/formatjs/issues/8160)) ([23504c1](https://github.com/formatjs/formatjs/commit/23504c1a13b096ea8890fdfb5cc65b5603e59f8a))
* **deps:** normalize Intl locale data keys without Unicode options ([#8222](https://github.com/formatjs/formatjs/issues/8222)) ([fcadd8e](https://github.com/formatjs/formatjs/commit/fcadd8e27906e570008627baf28ccb6084150a2e))
* **deps:** preserve private-use subtags in Intl locale resolution ([#8220](https://github.com/formatjs/formatjs/issues/8220)) ([3042290](https://github.com/formatjs/formatjs/commit/3042290edda51c55abde90e14eb5f2d8bd5bf545))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_data bumped from 0.2.0 to 0.2.1
    * formatjs_intl_numberformat bumped from 0.3.0 to 0.3.1
    * formatjs_intl_getcanonicallocales bumped from 1.0.0 to 1.0.1
    * formatjs_intl_locale bumped from 1.0.0 to 1.0.1

## [1.1.1](https://github.com/formatjs/formatjs/compare/formatjs_intl_datetimeformat_v1.1.0...formatjs_intl_datetimeformat_v1.1.1) (2026-11-23)


### Bug Fixes

* **@formatjs/intl-datetimeformat:** keep timestamp clipping on Numbers ([#8096](https://github.com/formatjs/formatjs/issues/8096)) ([8f68859](https://github.com/formatjs/formatjs/commit/8f688596db2aa01c22c03a0932639a85307f7bf7))
* **@formatjs/intl-datetimeformat:** normalize nonpositive display years ([#8106](https://github.com/formatjs/formatjs/issues/8106)) ([fe9fe72](https://github.com/formatjs/formatjs/commit/fe9fe722948a67ab1a4e0eecf719efed02c53241))
* **@formatjs/intl-datetimeformat:** preserve date pattern records ([#8104](https://github.com/formatjs/formatjs/issues/8104)) ([b14a361](https://github.com/formatjs/formatjs/commit/b14a3612991269d167984fee01025a4c9780e42a))
* **@formatjs/intl-datetimeformat:** preserve signed local-time years ([#8110](https://github.com/formatjs/formatjs/issues/8110)) ([0030a91](https://github.com/formatjs/formatjs/commit/0030a91feca676990ef7a826dcffd0427493afd1))

## [1.1.0](https://github.com/formatjs/formatjs/compare/formatjs_intl_datetimeformat_v1.0.2...formatjs_intl_datetimeformat_v1.1.0) (2026-11-17)


### Features

* **@formatjs/temporal:** add Temporal for TypeScript, Rust and Hermes ([#8016](https://github.com/formatjs/formatjs/issues/8016)) ([8d5f2a4](https://github.com/formatjs/formatjs/commit/8d5f2a4064cd0bb6e9310b9d91f4daf4f1399582))


### Bug Fixes

* **@formatjs/intl-datetimeformat:** preserve future timezone rules ([#7941](https://github.com/formatjs/formatjs/issues/7941)) ([be1683e](https://github.com/formatjs/formatjs/commit/be1683ed9d0b2661e2ac4f31f18de8de1e325f66))
* **@formatjs/intl-datetimeformat:** preserve timezone identifiers ([#7928](https://github.com/formatjs/formatjs/issues/7928)) ([62d33d9](https://github.com/formatjs/formatjs/commit/62d33d93a6e916d4dc81bd80f2d274c9c8f93014))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_numberformat bumped from 0.2.1 to 0.3.0

## [1.0.2](https://github.com/formatjs/formatjs/compare/formatjs_intl_datetimeformat_v1.0.1...formatjs_intl_datetimeformat_v1.0.2) (2026-11-08)


### Bug Fixes

* **@formatjs/intl-datetimeformat:** align range formatting with ECMA-402 and CLDR ([#7872](https://github.com/formatjs/formatjs/issues/7872)) ([136d91b](https://github.com/formatjs/formatjs/commit/136d91b26f94d64bafd048196f4c84734ed1e7c7))

## [1.0.1](https://github.com/formatjs/formatjs/compare/formatjs_intl_datetimeformat_v1.0.0...formatjs_intl_datetimeformat_v1.0.1) (2026-10-31)


### Performance Improvements

* **@formatjs/intl-datetimeformat:** streamline numeric rendering ([cc09570](https://github.com/formatjs/formatjs/commit/cc09570af93673c056f2766cdf12d2951df5d949))

## [1.0.0](https://github.com/formatjs/formatjs/compare/formatjs_intl_datetimeformat_v0.2.0...formatjs_intl_datetimeformat_v1.0.0) (2026-10-31)


### ⚠ BREAKING CHANGES

* Locale-data exports follow CLDR 49: five locales added, 114 removed upstream.

### Features

* upgrade CLDR data to v49 ([#7827](https://github.com/formatjs/formatjs/issues/7827)) ([1618c29](https://github.com/formatjs/formatjs/commit/1618c29b7984ab04e56799284014e058e530b4bb))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_numberformat bumped from 0.2.0 to 0.2.1
    * formatjs_intl_getcanonicallocales bumped from 0.2.0 to 1.0.0
    * formatjs_intl_locale bumped from 0.2.0 to 1.0.0

## [0.2.0](https://github.com/formatjs/formatjs/compare/formatjs_intl_datetimeformat_v0.1.0...formatjs_intl_datetimeformat_v0.2.0) (2026-10-30)


### Features

* **intl_datetimeformat:** port DateTimeFormat to Rust and Hermes ([#7698](https://github.com/formatjs/formatjs/issues/7698)) ([270aa61](https://github.com/formatjs/formatjs/commit/270aa61c835bfc96499843345242710508952777))


### Bug Fixes

* **@formatjs/intl-localematcher:** align best fit with ICU defaults ([#7745](https://github.com/formatjs/formatjs/issues/7745)) ([9898211](https://github.com/formatjs/formatjs/commit/98982117414e6e658a141e71f837a0142894673f))
* **intl_datetimeformat:** compile IANA zones for Hermes Test262 ([#7720](https://github.com/formatjs/formatjs/issues/7720)) ([7fc5699](https://github.com/formatjs/formatjs/commit/7fc5699f75795d88b4d5dd63bffd6aa172955b07))
* **intl_locale:** prefer likely script for locale aliases ([#7744](https://github.com/formatjs/formatjs/issues/7744)) ([f6103eb](https://github.com/formatjs/formatjs/commit/f6103eb58f802295a1a14d779ae415bff25b5f64))
* release Intl crates through Bazel and shared workflow ([#7727](https://github.com/formatjs/formatjs/issues/7727)) ([53de4af](https://github.com/formatjs/formatjs/commit/53de4af2e5a1b0c9c56a6fde05304274b43f188b))


### Performance Improvements

* **intl_locale:** retain prepared matchers in native registries ([#7768](https://github.com/formatjs/formatjs/issues/7768)) ([a395be7](https://github.com/formatjs/formatjs/commit/a395be797f2c05387045451e4e3b7420abf4b929))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_data bumped from 0.1.0 to 0.2.0
    * formatjs_intl_numberformat bumped from 0.1.0 to 0.2.0
    * formatjs_intl_getcanonicallocales bumped from 0.1.0 to 0.2.0
    * formatjs_intl_locale bumped from 0.1.0 to 0.2.0

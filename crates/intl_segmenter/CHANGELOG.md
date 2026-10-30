# Changelog

## [0.2.0](https://github.com/formatjs/formatjs/compare/formatjs_intl_segmenter_v0.1.0...formatjs_intl_segmenter_v0.2.0) (2026-10-30)


### Features

* **intl_segmenter:** port Intl.Segmenter to Rust with Hermes integration ([#7694](https://github.com/formatjs/formatjs/issues/7694)) ([d5d8512](https://github.com/formatjs/formatjs/commit/d5d8512ca7205354ec2caf1a6eac10396012d01a))


### Bug Fixes

* release Intl crates through Bazel and shared workflow ([#7727](https://github.com/formatjs/formatjs/issues/7727)) ([53de4af](https://github.com/formatjs/formatjs/commit/53de4af2e5a1b0c9c56a6fde05304274b43f188b))


### Performance Improvements

* **intl_segmenter:** avoid JSON in Hermes hot path ([#7734](https://github.com/formatjs/formatjs/issues/7734)) ([f0a9397](https://github.com/formatjs/formatjs/commit/f0a93973afcab9a5ce37fe9dc31b020f97cba31e))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_getcanonicallocales bumped from 0.1.0 to 0.2.0
    * formatjs_intl_locale bumped from 0.1.0 to 0.2.0

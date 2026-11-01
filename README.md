# FormatJS

[![Unit Tests](https://github.com/formatjs/formatjs/actions/workflows/tests.yml/badge.svg)](https://github.com/formatjs/formatjs/actions/workflows/tests.yml)
[![Slack FormatJS](https://img.shields.io/badge/slack-@formatjs-green.svg?logo=slack)](https://join.slack.com/t/formatjs/shared_invite/enQtNjM2MjM4NjE4ODIxLTMyMWE0YTNhMTlmMzZlNzJlNjEzMWY0YjM2ODUxYjlmNDE2YzQyMDIxZDg3Y2Q5YWNlMzhhYzRiNDk0OGQwNGI)
[![Sauce Browser Matrix Status](https://app.saucelabs.com/browser-matrix/formatjsproject.svg)](https://app.saucelabs.com/u/formatjsproject)

This repository is the home of [FormatJS](http://formatjs.github.io/) and related libraries.

**Slack:** Join us on Slack at [formatjs.slack.com](https://formatjs.slack.com/) for help, general conversation and more 💬🎊🎉
You can sign-up using this [invitation link](https://join.slack.com/t/formatjs/shared_invite/enQtNjYwMzE4NjM1MDQzLTA5NDE1Y2Y1ZWNiZWI1YTU5MGUxY2M0YjA4NWNhMmU3YTRjZmQ3MTE3NzJmOTAxMWRmYWE1ZTdkMmYzNzA5Y2M).

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md#Development) for instructions.

## Published Packages

Choose by application ecosystem. Registry names identify how to install a package;
implementation language can differ. For example, `@formatjs/cli` is Rust-backed
and distributed through npm.

| Ecosystem               | Distribution    | Entry point                                                         |
| ----------------------- | --------------- | ------------------------------------------------------------------- |
| JavaScript / TypeScript | npm             | React, Vue, Svelte, message formatting, Intl polyfills, build tools |
| Rust                    | crates.io       | Message runtime, parsers, Intl cores                                |
| Python                  | PyPI            | Rust-backed message runtime and parser bindings                     |
| Hermes / React Native   | GitHub Releases | Native SDK with Rust libraries and C++/JSI installers               |

### Intl APIs: npm and Rust

npm packages expose JavaScript APIs with TypeScript types. Rust crates expose
native operations for Rust applications and host integrations. LocaleMatcher is a
proposal ponyfill; the other rows implement standardized Intl APIs.

| API                 | JavaScript / TypeScript (npm)                                                                            | Rust (crates.io)                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Collator            | [`@formatjs/intl-collator`](https://www.npmjs.com/package/@formatjs/intl-collator)                       | [`formatjs_intl_collator`](https://crates.io/crates/formatjs_intl_collator)                       |
| DateTimeFormat      | [`@formatjs/intl-datetimeformat`](https://www.npmjs.com/package/@formatjs/intl-datetimeformat)           | [`formatjs_intl_datetimeformat`](https://crates.io/crates/formatjs_intl_datetimeformat)           |
| DisplayNames        | [`@formatjs/intl-displaynames`](https://www.npmjs.com/package/@formatjs/intl-displaynames)               | [`formatjs_intl_displaynames`](https://crates.io/crates/formatjs_intl_displaynames)               |
| DurationFormat      | [`@formatjs/intl-durationformat`](https://www.npmjs.com/package/@formatjs/intl-durationformat)           | [`formatjs_intl_durationformat`](https://crates.io/crates/formatjs_intl_durationformat)           |
| getCanonicalLocales | [`@formatjs/intl-getcanonicallocales`](https://www.npmjs.com/package/@formatjs/intl-getcanonicallocales) | [`formatjs_intl_getcanonicallocales`](https://crates.io/crates/formatjs_intl_getcanonicallocales) |
| ListFormat          | [`@formatjs/intl-listformat`](https://www.npmjs.com/package/@formatjs/intl-listformat)                   | [`formatjs_intl_listformat`](https://crates.io/crates/formatjs_intl_listformat)                   |
| Locale              | [`@formatjs/intl-locale`](https://www.npmjs.com/package/@formatjs/intl-locale)                           | [`formatjs_intl_locale`](https://crates.io/crates/formatjs_intl_locale)                           |
| LocaleMatcher       | [`@formatjs/intl-localematcher`](https://www.npmjs.com/package/@formatjs/intl-localematcher)             | [`formatjs_intl_localematcher`](https://crates.io/crates/formatjs_intl_localematcher)             |
| NumberFormat        | [`@formatjs/intl-numberformat`](https://www.npmjs.com/package/@formatjs/intl-numberformat)               | [`formatjs_intl_numberformat`](https://crates.io/crates/formatjs_intl_numberformat)               |
| PluralRules         | [`@formatjs/intl-pluralrules`](https://www.npmjs.com/package/@formatjs/intl-pluralrules)                 | [`formatjs_intl_pluralrules`](https://crates.io/crates/formatjs_intl_pluralrules)                 |
| RelativeTimeFormat  | [`@formatjs/intl-relativetimeformat`](https://www.npmjs.com/package/@formatjs/intl-relativetimeformat)   | [`formatjs_intl_relativetimeformat`](https://crates.io/crates/formatjs_intl_relativetimeformat)   |
| Segmenter           | [`@formatjs/intl-segmenter`](https://www.npmjs.com/package/@formatjs/intl-segmenter)                     | [`formatjs_intl_segmenter`](https://crates.io/crates/formatjs_intl_segmenter)                     |
| supportedValuesOf   | [`@formatjs/intl-supportedvaluesof`](https://www.npmjs.com/package/@formatjs/intl-supportedvaluesof)     | [`formatjs_intl_supportedvaluesof`](https://crates.io/crates/formatjs_intl_supportedvaluesof)     |

DateTimeFormat calendar add-ons are npm packages named
`@formatjs/intl-datetimeformat-calendar-*`; see [calendar installation](https://formatjs.github.io/docs/polyfills/intl-datetimeformat/).
Rust calendar support is in [`formatjs_intl_datetimeformat_calendars`](https://crates.io/crates/formatjs_intl_datetimeformat_calendars).

### JavaScript / TypeScript libraries and tools (npm)

| Purpose             | Packages                                                                                                                                                                                                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application APIs    | [`react-intl`](https://www.npmjs.com/package/react-intl), [`vue-intl`](https://www.npmjs.com/package/vue-intl), [`@formatjs/svelte-intl`](https://www.npmjs.com/package/@formatjs/svelte-intl), [`@formatjs/intl`](https://www.npmjs.com/package/@formatjs/intl)                                           |
| ICU MessageFormat   | [`intl-messageformat`](https://www.npmjs.com/package/intl-messageformat), [`@formatjs/icu-messageformat-parser`](https://www.npmjs.com/package/@formatjs/icu-messageformat-parser), [`@formatjs/icu-skeleton-parser`](https://www.npmjs.com/package/@formatjs/icu-skeleton-parser)                         |
| CLI                 | [`@formatjs/cli`](https://www.npmjs.com/package/@formatjs/cli), [`@formatjs/cli-lib`](https://www.npmjs.com/package/@formatjs/cli-lib)                                                                                                                                                                     |
| Build transforms    | [`babel-plugin-formatjs`](https://www.npmjs.com/package/babel-plugin-formatjs), [`@formatjs/ts-transformer`](https://www.npmjs.com/package/@formatjs/ts-transformer), [`@formatjs/unplugin`](https://www.npmjs.com/package/@formatjs/unplugin)                                                             |
| Linting and editing | [`eslint-plugin-formatjs`](https://www.npmjs.com/package/eslint-plugin-formatjs), [`@formatjs/editor`](https://www.npmjs.com/package/@formatjs/editor)                                                                                                                                                     |
| Utilities           | [`@formatjs/bigdecimal`](https://www.npmjs.com/package/@formatjs/bigdecimal), [`@formatjs/fast-memoize`](https://www.npmjs.com/package/@formatjs/fast-memoize), [`@formatjs/utils`](https://www.npmjs.com/package/@formatjs/utils), [`@formatjs/ecma376`](https://www.npmjs.com/package/@formatjs/ecma376) |

`@formatjs/cli` selects its `@formatjs/cli-native-*` platform package automatically.
Package versions and licenses are listed on npm; changelogs live under [`packages/`](packages/).

### Rust libraries (crates.io)

| Purpose                     | Crates                                                                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Application message runtime | [`formatjs_intl`](https://crates.io/crates/formatjs_intl), [`formatjs_intl_macros`](https://crates.io/crates/formatjs_intl_macros)                                                         |
| ICU MessageFormat runtime   | [`formatjs_icu_messageformat`](https://crates.io/crates/formatjs_icu_messageformat)                                                                                                        |
| ICU parsers                 | [`formatjs_icu_messageformat_parser`](https://crates.io/crates/formatjs_icu_messageformat_parser), [`formatjs_icu_skeleton_parser`](https://crates.io/crates/formatjs_icu_skeleton_parser) |
| Platform printf parsers     | [`formatjs_apple_printf_parser`](https://crates.io/crates/formatjs_apple_printf_parser), [`formatjs_java_printf_parser`](https://crates.io/crates/formatjs_java_printf_parser)             |
| Locale-data infrastructure  | [`formatjs_intl_data`](https://crates.io/crates/formatjs_intl_data), [`formatjs_intl_data_build`](https://crates.io/crates/formatjs_intl_data_build)                                       |
| Hermes native archive       | [`formatjs_intl_hermes`](https://crates.io/crates/formatjs_intl_hermes)                                                                                                                    |

See [Rust Intl crates](crates/README.md) for locale-data features and
[the application runtime](crates/formatjs_intl/README.md) for message catalogs.
Standalone CLI binaries are also available in
[CLI releases](https://github.com/formatjs/formatjs/releases?q=formatjs_cli_v).

### Python bindings (PyPI)

| Install package                                                                  | Python import              | Purpose                                  |
| -------------------------------------------------------------------------------- | -------------------------- | ---------------------------------------- |
| [`py_intl`](https://pypi.org/project/py_intl/)                                   | `intl`                     | Application message runtime and catalogs |
| [`icu_messageformat`](https://pypi.org/project/icu_messageformat/)               | `icu_messageformat`        | ICU MessageFormat runtime                |
| [`icu_messageformat_parser`](https://pypi.org/project/icu_messageformat_parser/) | `icu_messageformat_parser` | ICU message parser                       |
| [`icu_skeleton_parser`](https://pypi.org/project/icu_skeleton_parser/)           | `icu_skeleton_parser`      | Number/date skeleton parser              |

Install with `python -m pip install <package>`. These wheels bind the Rust
implementations; see the [Python package READMEs](python/).

### Native Hermes SDK (GitHub Releases)

[SDK releases](https://github.com/formatjs/formatjs/releases?q=formatjs-hermes-intl)
ship prebuilt Rust libraries, public headers, C++/JSI adapters, JS installers,
and checksums for Android, iOS/simulator, macOS, and Linux. Integrate the SDK into
your native app, then install standard Intl APIs into its Hermes runtime.
See [installation and supported targets](https://formatjs.github.io/docs/guides/hermes-intl/).

## Big Thanks

Cross-browser Testing Platform and Open Source <3 Provided by [Sauce Labs][saucelabs]

[lerna]: https://lerna.js.org/
[saucelabs]: https://saucelabs.com

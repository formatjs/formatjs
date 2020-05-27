# FormatJS

![Node Tests](https://github.com/formatjs/formatjs/workflows/Node%20CI/badge.svg)
![Sauce Labs Tests](https://github.com/formatjs/formatjs/workflows/Browser%20CI%20Tests/badge.svg)
[![Slack FormatJS](https://img.shields.io/badge/slack-@formatjs-green.svg?logo=slack)](https://join.slack.com/t/formatjs/shared_invite/enQtNjM2MjM4NjE4ODIxLTMyMWE0YTNhMTlmMzZlNzJlNjEzMWY0YjM2ODUxYjlmNDE2YzQyMDIxZDg3Y2Q5YWNlMzhhYzRiNDk0OGQwNGI)

[![Sauce Browser Matrix Status](https://app.saucelabs.com/browser-matrix/formatjsproject.svg)](https://app.saucelabs.com/u/formatjsproject)

This repository is the home of [FormatJS](http://formatjs.io/) and related libraries.

**Slack:** Join us on Slack at [formatjs.slack.com](https://formatjs.slack.com/) for help, general conversation and more 💬🎊🎉
You can sign-up using this [invitation link](https://join.slack.com/t/formatjs/shared_invite/enQtNjYwMzE4NjM1MDQzLTA5NDE1Y2Y1ZWNiZWI1YTU5MGUxY2M0YjA4NWNhMmU3YTRjZmQ3MTE3NzJmOTAxMWRmYWE1ZTdkMmYzNzA5Y2M).

## Development

Development is currently being done against the latest Node LTS. This repository leverages [Lerna][] for package management.

Releases can be done with the following steps:

```js
> lerna publish
```

## Published Packages

| Package                                                                                                | Version                                                                 | Changelog                                                     | License                                               |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| [react-intl](https://www.npmjs.com/package/react-intl)                                                 | ![version](https://badgen.net/npm/v/react-intl)                         | [CHANGELOG](packages/react-intl/CHANGELOG.md)                 | [BSD](packages/react-intl/LICENSE.md)                 |
| [babel-plugin-react-intl](https://www.npmjs.com/package/babel-plugin-react-intl)                       | ![version](https://badgen.net/npm/v/babel-plugin-react-intl)            | [CHANGELOG](packages/babel-plugin-react-intl/CHANGELOG.md)    | [BSD](packages/babel-plugin-react-intl/LICENSE.md)    |
| [@formatjs/cli](https://www.npmjs.com/package/@formatjs/cli)                                           | ![version](https://badgen.net/npm/v/@formatjs/cli)                      | [CHANGELOG](packages/cli/CHANGELOG.md)                        | [MIT](packages/cli/LICENSE.md)                        |
| [eslint-plugin-formatjs](https://www.npmjs.com/package/eslint-plugin-formatjs)                         | ![version](https://badgen.net/npm/v/eslint-plugin-formatjs)             | [CHANGELOG](packages/eslint-plugin-formatjs/CHANGELOG.md)     | [MIT](packages/eslint-plugin-formatjs/LICENSE.md)     |
| [formatjs-extract-cldr-data](https://www.npmjs.com/package/formatjs-extract-cldr-data)                 | ![version](https://badgen.net/npm/v/formatjs-extract-cldr-data)         | [CHANGELOG](packages/formatjs-extract-cldr-data/CHANGELOG.md) | [BSD](packages/formatjs-extract-cldr-data/LICENSE.md) |
| [intl-format-cache](https://www.npmjs.com/package/intl-format-cache)                                   | ![version](https://badgen.net/npm/v/intl-format-cache)                  | [CHANGELOG](packages/intl-format-cache/CHANGELOG.md)          | [BSD](packages/intl-format-cache/LICENSE.md)          |
| [intl-locales-supported](https://www.npmjs.com/package/intl-locales-supported)                         | ![version](https://badgen.net/npm/v/intl-locales-supported)             | [CHANGELOG](packages/intl-locales-supported/CHANGELOG.md)     | [BSD](packages/intl-locales-supported/LICENSE.md)     |
| [@formatjs/intl-listformat](https://www.npmjs.com/package/@formatjs/intl-listformat)                   | ![version](https://badgen.net/npm/v/@formatjs/intl-listformat)          | [CHANGELOG](packages/intl-listformat/CHANGELOG.md)            | [MIT](packages/intl-listformat/LICENSE.md)            |
| [intl-messageformat](https://www.npmjs.com/package/intl-messageformat)                                 | ![version](https://badgen.net/npm/v/intl-messageformat)                 | [CHANGELOG](packages/intl-messageformat/CHANGELOG.md)         | [BSD](packages/intl-messageformat/LICENSE.md)         |
| [intl-messageformat-parser](https://www.npmjs.com/package/intl-messageformat-parser)                   | ![version](https://badgen.net/npm/v/intl-messageformat-parser)          | [CHANGELOG](packages/intl-messageformat-parser/CHANGELOG.md)  | [BSD](packages/intl-messageformat-parser/LICENSE.md)  |
| [@formatjs/intl-pluralrules](https://www.npmjs.com/package/@formatjs/intl-pluralrules)                 | ![version](https://badgen.net/npm/v/@formatjs/intl-pluralrules)         | [CHANGELOG](packages/intl-pluralrules/CHANGELOG.md)           | [MIT](packages/intl-pluralrules/LICENSE.md)           |
| [@formatjs/intl-relativetimeformat](https://www.npmjs.com/package/@formatjs/intl-relativetimeformat)   | ![version](https://badgen.net/npm/v/@formatjs/intl-relativetimeformat)  | [CHANGELOG](packages/intl-relativetimeformat/CHANGELOG.md)    | [MIT](packages/intl-relativetimeformat/LICENSE.md)    |
| [@formatjs/intl-numberformat](https://www.npmjs.com/package/@formatjs/intl-numberformat)               | ![version](https://badgen.net/npm/v/@formatjs/intl-numberformat)        | [CHANGELOG](packages/intl-numberformat/CHANGELOG.md)          | [MIT](packages/intl-numberformat/LICENSE.md)          |
| [@formatjs/intl-utils](https://www.npmjs.com/package/@formatjs/intl-utils)                             | ![version](https://badgen.net/npm/v/@formatjs/intl-utils)               | [CHANGELOG](packages/intl-utils/CHANGELOG.md)                 | [MIT](packages/intl-utils/LICENSE.md)                 |
| [@formatjs/macro](https://www.npmjs.com/package/@formatjs/macro)                                       | ![version](https://badgen.net/npm/v/@formatjs/macro)                    | [CHANGELOG](packages/macro/CHANGELOG.md)                      | [MIT](packages/macro/LICENSE.md)                      |
| [@formatjs/ts-transformer](https://www.npmjs.com/package/@formatjs/cli)                                | ![version](https://badgen.net/npm/v/@formatjs/cli)                      | [CHANGELOG](packages/cli/CHANGELOG.md)                        | [MIT](packages/cli/LICENSE.md)                        |
| [@formatjs/intl-displaynames](https://www.npmjs.com/package/@formatjs/intl-displaynames)               | ![version](https://badgen.net/npm/v/@formatjs/intl-displaynames)        | [CHANGELOG](packages/intl-displaynames/CHANGELOG.md)          | [MIT](packages/intl-displaynames/LICENSE.md)          |
| [@formatjs/intl-locale](https://www.npmjs.com/package/@formatjs/intl-locale)                           | ![version](https://badgen.net/npm/v/@formatjs/intl-locale)              | [CHANGELOG](packages/intl-locale/CHANGELOG.md)                | [MIT](packages/intl-locale/LICENSE.md)                |
| [@formatjs/intl-getcanonicallocales](https://www.npmjs.com/package/@formatjs/intl-getcanonicallocales) | ![version](https://badgen.net/npm/v/@formatjs/intl-getcanonicallocales) | [CHANGELOG](packages/intl-getcanonicallocales/CHANGELOG.md)   | [MIT](packages/intl-getcanonicallocales/LICENSE.md)   |

## Big Thanks

Cross-browser Testing Platform and Open Source <3 Provided by [Sauce Labs][saucelabs]

[lerna]: https://lerna.js.org/
[saucelabs]: https://saucelabs.com

# FormatJS

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->

[![Build Status](https://travis-ci.org/formatjs/formatjs.svg?branch=master)](https://travis-ci.org/formatjs/formatjs)
[![Slack FormatJS](https://img.shields.io/badge/slack-@formatjs-green.svg?logo=slack)](https://join.slack.com/t/formatjs/shared_invite/enQtNjM2MjM4NjE4ODIxLTMyMWE0YTNhMTlmMzZlNzJlNjEzMWY0YjM2ODUxYjlmNDE2YzQyMDIxZDg3Y2Q5YWNlMzhhYzRiNDk0OGQwNGI)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/formatjsproject.svg)](https://saucelabs.com/u/formatjsproject)

This repository is the home of [FormatJS](http://formatjs.io/) and related libraries.

## Development

Development is currently being done against the latest Node LTS. This repository leverages [Lerna][] for package management.

Releases can be done with the following steps:

```js
> lerna publish
```

## Published Packages

| Package                                                                                                  | Version                                                                  | Changelog                                                     | License                                               |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------- | ----------------------------------------------------- |
| [babel-plugin-react-intl](https://www.npmjs.com/package/babel-plugin-react-intl)                         | ![version](https://badgen.net/npm/v/babel-plugin-react-intl)             | [CHANGELOG](packages/babel-plugin-react-intl/CHANGELOG.md)    | [BSD](packages/babel-plugin-react-intl/LICENSE.md)    |
| [@formatjs/cli](https://www.npmjs.com/package/@formatjs/cli)                                             | ![version](https://badgen.net/npm/v/@formatjs/cli)                       | [CHANGELOG](packages/cli/CHANGELOG.md)                        | [MIT](packages/cli/LICENSE.md)                        |
| [eslint-plugin-formatjs](https://www.npmjs.com/package/eslint-plugin-formatjs)                           | ![version](https://badgen.net/npm/v/eslint-plugin-formatjs)              | [CHANGELOG](packages/eslint-plugin-formatjs/CHANGELOG.md)     | [MIT](packages/eslint-plugin-formatjs/LICENSE.md)     |
| [formatjs-extract-cldr-data](https://www.npmjs.com/package/formatjs-extract-cldr-data)                   | ![version](https://badgen.net/npm/v/formatjs-extract-cldr-data)          | [CHANGELOG](packages/formatjs-extract-cldr-data/CHANGELOG.md) | [BSD](packages/formatjs-extract-cldr-data/LICENSE.md) |
| [intl-format-cache](https://www.npmjs.com/package/intl-format-cache)                                     | ![version](https://badgen.net/npm/v/intl-format-cache)                   | [CHANGELOG](packages/intl-format-cache/CHANGELOG.md)          | [BSD](packages/intl-format-cache/LICENSE.md)          |
| [intl-locales-supported](https://www.npmjs.com/package/intl-locales-supported)                           | ![version](https://badgen.net/npm/v/intl-locales-supported)              | [CHANGELOG](packages/intl-locales-supported/CHANGELOG.md)     | [BSD](packages/intl-locales-supported/LICENSE.md)     |
| [@formatjs/intl-listformat](https://www.npmjs.com/package/@formatjs/intl-listformat)                     | ![version](https://badgen.net/npm/v/@formatjs/intl-listformat)           | [CHANGELOG](packages/intl-listformat/CHANGELOG.md)            | [MIT](packages/intl-listformat/LICENSE.md)            |
| [intl-messageformat](https://www.npmjs.com/package/intl-messageformat)                                   | ![version](https://badgen.net/npm/v/intl-messageformat)                  | [CHANGELOG](packages/intl-messageformat/CHANGELOG.md)         | [BSD](packages/intl-messageformat/LICENSE.md)         |
| [intl-messageformat-parser](https://www.npmjs.com/package/intl-messageformat-parser)                     | ![version](https://badgen.net/npm/v/intl-messageformat-parser)           | [CHANGELOG](packages/intl-messageformat-parser/CHANGELOG.md)  | [BSD](packages/intl-messageformat-parser/LICENSE.md)  |
| [@formatjs/intl-pluralrules](https://www.npmjs.com/package/@formatjs/intl-pluralrules)                   | ![version](https://badgen.net/npm/v/@formatjs/intl-pluralrules)          | [CHANGELOG](packages/intl-pluralrules/CHANGELOG.md)           | [MIT](packages/intl-pluralrules/LICENSE.md)           |
| [@formatjs/intl-relativetimeformat](https://www.npmjs.com/package/@formatjs/intl-relativetimeformat)     | ![version](https://badgen.net/npm/v/@formatjs/intl-relativetimeformat)   | [CHANGELOG](packages/intl-relativetimeformat/CHANGELOG.md)    | [MIT](packages/intl-relativetimeformat/LICENSE.md)    |
| [@formatjs/intl-unified-numberformat](https://www.npmjs.com/package/@formatjs/intl-unified-numberformat) | ![version](https://badgen.net/npm/v/@formatjs/intl-unified-numberformat) | [CHANGELOG](packages/intl-unified-numberformat/CHANGELOG.md)  | [MIT](packages/intl-unified-numberformat/LICENSE.md)  |
| [@formatjs/intl-utils](https://www.npmjs.com/package/@formatjs/intl-utils)                               | ![version](https://badgen.net/npm/v/@formatjs/intl-utils)                | [CHANGELOG](packages/intl-utils/CHANGELOG.md)                 | [MIT](packages/intl-utils/LICENSE.md)                 |
| [@formatjs/macro](https://www.npmjs.com/package/@formatjs/macro)                                         | ![version](https://badgen.net/npm/v/@formatjs/cli)                       | [CHANGELOG](packages/cli/CHANGELOG.md)                        | [MIT](packages/cli/LICENSE.md)                        |
| [@formatjs/ts-transformer](https://www.npmjs.com/package/@formatjs/cli)                                  | ![version](https://badgen.net/npm/v/@formatjs/cli)                       | [CHANGELOG](packages/cli/CHANGELOG.md)                        | [MIT](packages/cli/LICENSE.md)                        |

## Big Thanks

Cross-browser Testing Platform and Open Source <3 Provided by [Sauce Labs][saucelabs]

[lerna]: https://lerna.js.org/
[saucelabs]: https://saucelabs.com

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/pyrocat101"><img src="https://avatars0.githubusercontent.com/u/541540?v=4" width="100px;" alt=""/><br /><sub><b>Linjie Ding</b></sub></a><br /><a href="#infra-pyrocat101" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/formatjs/formatjs/commits?author=pyrocat101" title="Tests">⚠️</a> <a href="https://github.com/formatjs/formatjs/commits?author=pyrocat101" title="Code">💻</a></td>
    <td align="center"><a href="https://medium.com/@longho"><img src="https://avatars1.githubusercontent.com/u/198255?v=4" width="100px;" alt=""/><br /><sub><b>Long Ho</b></sub></a><br /><a href="#infra-longlho" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/formatjs/formatjs/commits?author=longlho" title="Tests">⚠️</a> <a href="https://github.com/formatjs/formatjs/commits?author=longlho" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

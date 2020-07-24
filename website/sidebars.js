module.exports = {
  docs: {
    'Getting Started': [
      'getting-started/installation',
      'getting-started/application-workflow',
      'getting-started/message-declaration',
      'getting-started/message-extraction',
      'getting-started/message-distribution',
    ],
    Guides: [
      'guides/develop',
      'guides/bundler-plugins',
      'react-intl/testing',
      'guides/runtime-requirements',
      'react-intl/advanced-usage',
    ],
    'Core Concepts': ['basic-internationalization-principles', 'icu-syntax'],
  },
  api: {
    'react-intl': [
      'react-intl/components',
      'react-intl/api',
      'react-intl/upgrade-guide-5x',
      'react-intl/upgrade-guide-4x',
      'react-intl/upgrade-guide-3x',
      'react-intl/upgrade-guide-2x',
    ],
    'intl-messageformat': ['intl-messageformat'],
    'intl-messageformat-parser': ['intl-messageformat-parser'],
  },
  polyfills: {
    Polyfills: [
      'polyfills',
      'polyfills/intl-getcanonicallocales',
      'polyfills/intl-pluralrules',
      'polyfills/intl-relativetimeformat',
      'polyfills/intl-listformat',
      'polyfills/intl-displaynames',
      'polyfills/intl-numberformat',
      'polyfills/intl-datetimeformat',
      'polyfills/intl-locale',
    ],
  },
  tooling: {
    Tooling: [
      'tooling/cli',
      'tooling/linter',
      'tooling/babel-plugin',
      'tooling/ts-transformer',
    ],
  },
};

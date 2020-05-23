module.exports = {
  docs: {
    'Getting Started': [
      'basic-internationalization-principles',
      'icu-syntax',
      'runtime-requirements',
    ],
    Polyfills: [
      'polyfills',
      'polyfills/intl-getcanonicallocales',
      'polyfills/intl-pluralrules',
      'polyfills/intl-relativetimeformat',
      'polyfills/intl-listformat',
      'polyfills/intl-displaynames',
      'polyfills/intl-numberformat',
      'polyfills/intl-locale',
    ],
    Libraries: [
      'intl-messageformat',
      'intl-messageformat-parser',
      {
        type: 'category',
        label: 'react-intl',
        items: [
          'react-intl',
          'react-intl/components',
          'react-intl/api',
          'react-intl/testing',
          'react-intl/advanced-usage',
          'react-intl/upgrade-guide-4x',
          'react-intl/upgrade-guide-3x',
          'react-intl/upgrade-guide-2x',
        ],
      },
    ],
    Tooling: [
      'tooling/cli',
      'tooling/linter',
      'tooling/babel-plugin',
      'tooling/ts-transformer',
    ],
  },
};

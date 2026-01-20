export interface NavItem {
  title: string
  path: string
  order?: number
}

export interface NavSection {
  title: string
  items: NavItem[]
  order?: number
}

// Hardcoded navigation tree - can be generated from file system later
export function getNavigationTree(): NavSection[] {
  return [
    {
      title: 'Getting Started',
      order: 1,
      items: [
        {title: 'Installation', path: 'getting-started/installation'},
        {
          title: 'Message Declaration',
          path: 'getting-started/message-declaration',
        },
        {
          title: 'Message Extraction',
          path: 'getting-started/message-extraction',
        },
        {
          title: 'Message Distribution',
          path: 'getting-started/message-distribution',
        },
        {
          title: 'Application Workflow',
          path: 'getting-started/application-workflow',
        },
      ],
    },
    {
      title: 'Core Concepts',
      order: 2,
      items: [
        {
          title: 'Basic Internationalization Principles',
          path: 'core-concepts/basic-internationalization-principles',
        },
        {title: 'ICU Message Syntax', path: 'core-concepts/icu-syntax'},
      ],
    },
    {
      title: 'React Intl',
      order: 3,
      items: [
        {title: 'Overview', path: 'react-intl'},
        {title: 'API', path: 'react-intl/api'},
        {title: 'Components', path: 'react-intl/components'},
        {title: 'Upgrade Guide 2.x', path: 'react-intl/upgrade-guide-2.x'},
        {title: 'Upgrade Guide 3.x', path: 'react-intl/upgrade-guide-3.x'},
        {title: 'Upgrade Guide 4.x', path: 'react-intl/upgrade-guide-4.x'},
        {title: 'Upgrade Guide 5.x', path: 'react-intl/upgrade-guide-5.x'},
      ],
    },
    {
      title: 'Polyfills',
      order: 4,
      items: [
        {title: 'Overview', path: 'polyfills'},
        {title: 'Intl.DateTimeFormat', path: 'polyfills/intl-datetimeformat'},
        {title: 'Intl.DisplayNames', path: 'polyfills/intl-displaynames'},
        {title: 'Intl.DurationFormat', path: 'polyfills/intl-durationformat'},
        {
          title: 'Intl.GetCanonicalLocales',
          path: 'polyfills/intl-getcanonicallocales',
        },
        {title: 'Intl.ListFormat', path: 'polyfills/intl-listformat'},
        {title: 'Intl.Locale', path: 'polyfills/intl-locale'},
        {title: 'Intl.LocaleMatcher', path: 'polyfills/intl-localematcher'},
        {title: 'Intl.NumberFormat', path: 'polyfills/intl-numberformat'},
        {title: 'Intl.PluralRules', path: 'polyfills/intl-pluralrules'},
        {
          title: 'Intl.RelativeTimeFormat',
          path: 'polyfills/intl-relativetimeformat',
        },
        {title: 'Intl.Segmenter', path: 'polyfills/intl-segmenter'},
        {
          title: 'Intl.supportedValuesOf',
          path: 'polyfills/intl-supportedvaluesof',
        },
      ],
    },
    {
      title: 'Tooling',
      order: 5,
      items: [
        {title: 'CLI', path: 'tooling/cli'},
        {title: 'Bazel', path: 'tooling/bazel'},
        {title: 'Babel Plugin', path: 'tooling/babel-plugin'},
        {title: 'TypeScript Transformer', path: 'tooling/ts-transformer'},
        {title: 'SWC Plugin', path: 'tooling/swc-plugin'},
        {title: 'ESLint Plugin', path: 'tooling/linter'},
        {
          title: 'Rust: ICU MessageFormat Parser',
          path: 'tooling/rust-icu-messageformat-parser',
        },
        {
          title: 'Rust: ICU Skeleton Parser',
          path: 'tooling/rust-icu-skeleton-parser',
        },
      ],
    },
    {
      title: 'Guides',
      order: 6,
      items: [
        {
          title: 'Testing with React Intl',
          path: 'guides/testing-with-react-intl',
        },
        {title: 'Runtime Requirements', path: 'guides/runtime-requirements'},
        {title: 'Advanced Usage', path: 'guides/advanced-usage'},
        {
          title: 'Wrapper Components with Auto ID',
          path: 'guides/wrapper-components',
        },
        {title: 'Bundler Plugins', path: 'guides/bundler-plugins'},
        {title: 'Distribute Libraries', path: 'guides/distribute-libraries'},
        {title: 'Development', path: 'guides/develop'},
      ],
    },
    {
      title: 'Other APIs',
      order: 7,
      items: [
        {title: '@formatjs/intl', path: 'intl'},
        {title: 'Vue Intl', path: 'vue-intl'},
        {title: 'Intl MessageFormat', path: 'intl-messageformat'},
        {title: 'ICU MessageFormat Parser', path: 'icu-messageformat-parser'},
      ],
    },
  ]
}

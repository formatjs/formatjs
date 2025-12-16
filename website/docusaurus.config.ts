import type * as Preset from '@docusaurus/preset-classic'
import type {Config} from '@docusaurus/types'
export default {
  title: 'Format.JS',
  tagline: 'Internationalize your web apps on the client & server.',
  url: 'https://formatjs.github.io/',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  organizationName: 'formatjs', // Usually your GitHub org/user name.
  projectName: 'formatjs.github.io', // Usually your repo name.
  themes: ['@docusaurus/theme-live-codeblock'],
  plugins: ['docusaurus-lunr-search'],
  themeConfig: {
    prism: {
      additionalLanguages: ['markup'],
    },
    navbar: {
      title: 'Format.JS',
      logo: {
        alt: 'FormatJS',
        src: 'img/logo.svg',
        srcDark: 'img/logo-dark.svg',
      },
      items: [
        {
          to: 'docs/getting-started/installation',
          label: 'Docs',
          position: 'left',
          activeBaseRegex: 'docs/(getting-started|guides|core-concepts)',
        },
        {
          to: 'docs/react-intl',
          label: 'API References',
          position: 'left',
          activeBaseRegex:
            'docs/(vue-intl|intl|react-intl|intl-messageformat|icu-messageformat-parser)',
        },
        {
          to: 'docs/polyfills',
          label: 'Polyfills',
          position: 'left',
        },
        {
          to: 'docs/tooling/cli',
          label: 'Tooling',
          position: 'left',
          activeBaseRegex:
            'docs/tooling/(cli|linter|babel-plugin|ts-transformer|swc-plugin)',
        },
        {
          href: 'https://github.com/formatjs/formatjs',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: 'docs/getting-started/installation',
            },
            {
              to: 'docs/polyfills',
              label: 'Polyfills',
            },
            {
              to: 'docs/intl-messageformat',
              label: 'Libraries',
            },
            {
              to: 'docs/tooling/cli',
              label: 'Tooling',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/formatjs',
            },
            {
              label: 'Slack',
              href: 'https://formatjs.slack.com/',
            },
          ],
        },
        {
          title: 'Social',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/formatjs/formatjs',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} FormatJS. Built with Docusaurus.`,
    },
    liveCodeBlock: {
      /**
       * The position of the live playground, above or under the editor
       * Possible values: "top" | "bottom"
       */
      playgroundPosition: 'bottom',
    },
  } satisfies Preset.ThemeConfig,
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/formatjs/formatjs/edit/main/website/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
} satisfies Config

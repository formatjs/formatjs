module.exports = {
  title: 'Format.JS',
  tagline: 'Internationalize your web apps on the client & server.',
  url: 'https://formatjs.github.io/',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  organizationName: 'formatjs', // Usually your GitHub org/user name.
  projectName: 'formatjs.github.io', // Usually your repo name.
  themeConfig: {
    algolia: {
      apiKey: '64ffba7fb3e3ee96182a32b6bf44591f',
      indexName: 'formatjs',
    },
    googleAnalytics: {
      trackingID: 'UA-173519367-1',
      // Optional fields.
      anonymizeIP: true, // Should IPs be anonymized?
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
          activeBaseRegex: `docs/(getting-started|guides|core-concepts)`,
        },
        {
          to: 'docs/react-intl/components',
          label: 'API References',
          position: 'left',
          activeBaseRegex: `docs/(react-intl|intl-messageformat|intl-messageformat-parser)`,
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
          activeBaseRegex: `docs/tooling/(cli|linter|babel-plugin|ts-transformer)`,
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
              to: 'docs/core-concepts/basic-internationalization-principles',
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
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/formatjs/formatjs/edit/main/website/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};

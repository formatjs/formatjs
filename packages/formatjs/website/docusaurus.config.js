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
    navbar: {
      title: 'Format.JS',
      logo: {
        alt: 'FormatJS',
        src: 'img/logo.svg',
        srcDark: 'img/logo-dark.svg',
      },
      links: [
        {
          to: 'docs/basic-internationalization-principles',
          activeBasePath: 'docs',
          label: 'Docs',
          position: 'left',
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
              to: 'docs/basic-internationalization-principles',
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
          editUrl: 'https://github.com/formatjs/formatjs/edit/master/website/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  themes: ['@docusaurus/theme-live-codeblock'],
};

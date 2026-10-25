# Documentation Site

## Stack

The `docs/` site is a static React application deployed to GitHub Pages.

- **Vite** bundles the application and runs the development server.
- **React 19** renders pages and hydrates prerendered HTML in the browser.
- **MDX** turns documentation files into React components through
  `@mdx-js/rollup` and `@mdx-js/react`.
- **Tailwind CSS** and Lightning CSS handle styling.
- **Radix UI** provides accessible interface primitives.
- **Typesense** powers documentation search.
- **Prism** and `react-live` power highlighted, interactive code examples.
- **Bazel** owns builds, tests, generated documentation, metadata, and sitemap.

There is no Vike dependency and no production application server. React server
rendering happens only at build time to produce static HTML.

## Routing And Rendering

`docs/src/main.tsx` hydrates existing static HTML or mounts the application
during development. `docs/src/App.tsx` selects the homepage for `/` and the
documentation page for `/docs/<path>`.

Documentation pages eagerly load `docs/src/docs/**/*.mdx` with
`import.meta.glob()`. `docs/src/utils/page-context.tsx` supplies the current
pathname and documentation path to page content, breadcrumbs, and sidebar.

`docs/src/utils/client-navigation.ts` handles same-origin links and search
results with the History API. Navigation updates React state without reloading
the page. Browser back/forward, modified clicks, external links, downloads, and
same-page anchors retain their normal behavior.

## Static Generation

`docs/vite.config.ts` runs the local `formatjs-prerender-pages` plugin after
Vite builds the client bundle. The plugin:

1. Loads `docs/src/entry-server.tsx` with Vite's build-time module loader.
2. Reads `docs/src/docs-metadata.generated.json` for documentation routes.
3. Renders the homepage and every documentation route with `react-dom/server`.
4. Writes route-specific HTML, title, description, canonical URL, and social
   metadata under `docs/dist/client`.

`docs/src/pages/+Head.tsx` provides shared metadata, including agent skill
discovery. Homepage and documentation-specific metadata live under
`docs/src/pages/index/+Head.tsx` and
`docs/src/pages/docs/@path/+Head.tsx`.

The GitHub Pages deployment in `.github/workflows/website.yml` publishes
`bazel-bin/docs/dist/client`. Preserve that output path when changing the
build.

## Generated Documentation

### Homepage company logos

`TrustedBySection.tsx` lists known FormatJS users. Anthropic, Perplexity, and
OpenAI were confirmed by the maintainer on 2026-10-25. Additional usage evidence:

- [Discord's licenses](https://discord.com/licenses) list `intl-messageformat`
  and FormatJS polyfills.
- [Atlassian's design system](https://atlassian.design/components/entry-points/modal-trigger/examples)
  uses `react-intl` in its components.
- [Elastic's Kibana dependencies](https://github.com/elastic/kibana/blob/main/package.json)
  include `@formatjs/intl` and the ICU parser.

- [Salesforce's Retail React App](https://github.com/SalesforceCommerceCloud/pwa-kit/blob/develop/packages/template-retail-react-app/package.json)
  depends on `react-intl` and `@formatjs/cli`.
- [Grafana](https://github.com/grafana/grafana/blob/main/package.json)
  depends on `@formatjs/intl-durationformat`.
- [Red Hat's Insights shell](https://github.com/RedHatInsights/insights-chrome/blob/master/package.json)
  depends on `react-intl` and `@formatjs/cli`.
- [Mattermost Channels](https://github.com/mattermost/mattermost/blob/master/webapp/channels/package.json)
  depends on `react-intl`.
- [Canva's Apps SDK localization](https://www.canva.dev/docs/apps/localization/recommended-workflow/)
  uses React Intl and the FormatJS CLI.

Serve company SVGs locally from `docs/public/img/`. Prefer named wordmarks;
add a visible company name beside symbols. Keep an accessible name on each item.
Preserve Salesforce and Canva's colors so their lettering stays visible.

Symbol sources: `simple-icons@14.15.0`. Anthropic, Perplexity, Salesforce,
Canva, Atlassian, Grafana, and Mattermost assets come from
[SVGL](https://github.com/pheralb/svgl/tree/f9b726cee1d1f3c697a18c880185e89d9a55bb70/static/library).
Discord's full logo comes from its [brand assets](https://discord.com/branding).
OpenAI's wordmark comes from [Wikimedia Commons](<https://commons.wikimedia.org/wiki/File:OpenAI_logo_2025_(wordmark).svg>),
which credits OpenAI's brand guidelines.

The [2026-10-25 company audit](company-usage-audit-2026-10-25.json) records
100 prominent tech-company candidates, sampled public manifests, and follow-up
evidence. It is not a market-cap ranking or an exhaustive dependency inventory.
Missing manifests and unmatched samples leave usage unverified.

Ten additions have product-specific evidence: Google (Chrome DevTools),
Microsoft (TypeScript website), Amazon (AWS Cloudscape), Adobe (Commerce PWA
Studio), Cisco (Webex), Block (Goose), Box (UI Elements), Databricks (Genie
mobile), Snowflake (SnowConvert AI), and Oracle (Siebel CRM 26.3). The audit
pins repository evidence to commits and links official product notices.
Goose is now maintained by the Agentic AI Foundation; Block's own investor
materials confirm its internal use.

New logo sources: Google, Microsoft, AWS, Adobe, and Cisco use the pinned SVGL
catalog above; Box, Databricks, and Snowflake use `simple-icons@14.15.0`.
Block's wordmark comes from its [official website](https://block.xyz/).
Oracle's wordmark comes from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Oracle_wordmark.svg).

### Homepage download counts

Homepage library download counts live in
`docs/src/components/home/library-downloads.json`. Keep all registries on the
same 30-day window, recorded as `start` and `end`. Use npm's downloads point API,
sum crates.io's daily `version_downloads` and `meta.extra_downloads`, and sum
PyPI Stats' daily `without_mirrors` counts. The homepage shows compact counts,
exact totals on hover, and the snapshot dates. Refresh the snapshot when updating
library statistics; it does not make browser requests to registries.

`docs/BUILD.bazel` generates the best-practices guide and Skills pages directly
from `.agents/skills/localization-review/SKILL.md` and
`.agents/skills/translate/SKILL.md`. Generated MDX files are Bazel outputs,
not checked-in source files.

Sidebar sections and ordering come from `docs/src/utils/navigation.ts`.
Checked-in generated artifacts are:

- `docs/src/docs-metadata.generated.json`, updated with
  `bazel run //docs:docs_metadata`.
- `docs/public/sitemap.xml`, updated with `bazel run //docs:sitemap`.

Keep both artifacts synchronized when documentation routes change.
`codescythe.jsonc` lists the client and prerender entrypoints for dead-code
analysis.

## Commands

```bash
bazel run //docs:serve
bazel test //docs/...
bazel test //docs:client_navigation_test
bazel build //docs:dist
bazel run //docs:docs_metadata
bazel run //docs:sitemap
```

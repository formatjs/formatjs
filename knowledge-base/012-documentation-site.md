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

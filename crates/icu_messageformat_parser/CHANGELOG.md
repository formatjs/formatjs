# Changelog

## 0.2.5 (2026-07-09)

## What's Changed
* build: add Claude Code GitHub Workflow by @longlho in https://github.com/formatjs/formatjs/pull/5998
* fix(formatjs_cli): match TypeScript CLI extract output format by @longlho in https://github.com/formatjs/formatjs/pull/6010
* fix(@formatjs/cli-lib): respect throws flag in extract() function by @longlho in https://github.com/formatjs/formatjs/pull/6011
* fix(react-intl): update react/react-dom dep versions to 19 by @longlho in https://github.com/formatjs/formatjs/pull/6015
* fix(formatjs_cli): fix newlines/whitespace handling to conform with TS version, fix #6021 by @longlho in https://github.com/formatjs/formatjs/pull/6022
* build: move files by @longlho in https://github.com/formatjs/formatjs/pull/6024
* docs: #6012 update intl-durationformat polyfill docs page by @michaeldoubek in https://github.com/formatjs/formatjs/pull/6018
* fix(@formatjs/intl-datetimeformat): fix formatRange h24 midnight and hour12 duplication by @longlho in https://github.com/formatjs/formatjs/pull/6026
* fix(eslint-plugin-formatjs): rm typescript-eslint dep by @longlho in https://github.com/formatjs/formatjs/pull/6028
* fix(@formatjs/vite-plugin): introduce vite plugin for formatjs by @longlho in https://github.com/formatjs/formatjs/pull/6030
* feat(eslint-plugin-formatjs): add prefer-full-sentence rule by @longlho in https://github.com/formatjs/formatjs/pull/6036
* fix(@formatjs/vite-plugin): wrap JSX defaultMessage AST in expression container by @longlho in https://github.com/formatjs/formatjs/pull/6044
* fix(vue-intl): loosen vue peer dependency to allow newer versions by @longlho in https://github.com/formatjs/formatjs/pull/6043
* feat(@formatjs/intl-datetimeformat): update tzdata to 2026a by @longlho in https://github.com/formatjs/formatjs/pull/6051
* fix(@formatjs/intl-datetimeformat): ensure all locales support both 12h and 24h hour cycles by @longlho in https://github.com/formatjs/formatjs/pull/6052
* fix(@formatjs/intl-datetimeformat): fix formatRange date duplication with hour12 and 2-digit hour by @longlho in https://github.com/formatjs/formatjs/pull/6053
* feat(eslint-plugin-formatjs): add ESLint v10 support by @longlho in https://github.com/formatjs/formatjs/pull/6054
* chore: remove swc_icu_messageformat_parser dependency by @longlho in https://github.com/formatjs/formatjs/pull/6055
* build: upgrade typescript from 5.8.2 to 5.9.3 by @longlho in https://github.com/formatjs/formatjs/pull/6057
* fix: add locale-data directory export for variable dynamic imports by @longlho in https://github.com/formatjs/formatjs/pull/6063
* fix: use vue ^3.5.0 range in peer dependencies by @longlho in https://github.com/formatjs/formatjs/pull/6064
* perf(@formatjs/vite-plugin): apply Vite performance improvements by @longlho in https://github.com/formatjs/formatjs/pull/6070
* perf(@formatjs/vite-plugin): use oxc-parser Visitor for AST traversal by @longlho in https://github.com/formatjs/formatjs/pull/6071
* chore(deps): update dependency fast-xml-parser to v5.3.4 [security] by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6000
* chore(deps): update dependency vike-react to v0.6.21 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/5993
* chore(deps): update dependency lucide-react to ^0.577.0 - autoclosed by @renovate[bot] in https://github.com/formatjs/formatjs/pull/5992
* chore(deps): update dependency happy-dom to v20.8.4 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/5990
* chore(deps): update typescript-eslint monorepo to v8.57.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/5969
* chore(deps): update pnpm to v10.32.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/5958
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260315.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/5956
* build(deps): bump flatted from 3.3.3 to 3.4.1 in /packages/react-intl/example-sandboxes/rescripts by @dependabot[bot] in https://github.com/formatjs/formatjs/pull/6068
* build(deps): bump rollup from 2.79.2 to 2.80.0 in /packages/react-intl/example-sandboxes/rescripts by @dependabot[bot] in https://github.com/formatjs/formatjs/pull/6045
* build(deps): bump bn.js in /packages/react-intl/example-sandboxes/rescripts by @dependabot[bot] in https://github.com/formatjs/formatjs/pull/6039
* build(deps): bump webpack from 5.94.0 to 5.105.0 in /packages/react-intl/example-sandboxes/rescripts by @dependabot[bot] in https://github.com/formatjs/formatjs/pull/6023
* build(deps): bump url-parse from 1.4.7 to 1.5.10 in /packages/react-intl/example-sandboxes/rescripts by @dependabot[bot] in https://github.com/formatjs/formatjs/pull/6019
* build(deps): bump diff from 4.0.2 to 4.0.4 in /packages/react-intl/example-sandboxes/rescripts by @dependabot[bot] in https://github.com/formatjs/formatjs/pull/5983
* feat(eslint-plugin-formatjs): support minimum description length in `enforce-description` rule by @William-Feng in https://github.com/formatjs/formatjs/pull/6066
* chore(deps): update dependency serialize-javascript to v7.0.3 [security] by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6075
* chore(deps): update dependency fast-xml-parser to v5.3.8 [security] by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6074
* chore(deps): update dependency aspect_rules_esbuild to v0.25.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6073
* chore(deps): update dependency bazel to v9.0.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6077
* chore(deps): update dependency aspect_rules_ts to v3.8.6 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6076
* chore: add exports fields to tooling packages by @longlho in https://github.com/formatjs/formatjs/pull/6080
* docs(react-intl): add retroactive upgrade guides for 6.x, 7.x, 8.x by @longlho in https://github.com/formatjs/formatjs/pull/6084
* chore(deps): upgrade vite to 8 by @longlho in https://github.com/formatjs/formatjs/pull/6088
* ci: remove auto Claude Code review workflow by @longlho in https://github.com/formatjs/formatjs/pull/6089
* chore: drop tslib across all 27 packages by @longlho in https://github.com/formatjs/formatjs/pull/6087
* feat(react-intl): modernize for React 19 and RSC support by @longlho in https://github.com/formatjs/formatjs/pull/6083
* chore(deps): update lerna-lite monorepo to v4.11.5 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6090
* chore(deps): update dependency vike to v0.4.255 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6086
* chore(deps): update dependency aspect_rules_ts to v3.8.7 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6085
* chore(deps): update dependency serialize-javascript to v7.0.4 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6082
* chore(deps): update dependency commander to v14.0.3 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6078
* chore(deps): update dependency rehype-prism-plus to v2.0.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6081
* chore(deps): update dependency fs-extra to v11.3.4 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6079
* docs: add guides for Next.js App Router, React Native, migrations, and performance by @longlho in https://github.com/formatjs/formatjs/pull/6093
* fix(react-intl): fix vitest DOM tests failing in Bazel sandbox by @longlho in https://github.com/formatjs/formatjs/pull/6099
* feat(@formatjs/unplugin): universal build plugin for Vite, Webpack, Rollup, esbuild, Rspack by @longlho in https://github.com/formatjs/formatjs/pull/6096
* chore: remove completed tslib item from UPCOMING.md by @longlho in https://github.com/formatjs/formatjs/pull/6101
* chore(deps): update dependency buildifier_prebuilt to v8.5.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6100
* chore(deps): update dependency rollup to v4.59.0 [security] by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6102
* chore(deps): update rust crate once_cell to v1.21.4 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6091
* chore(deps): update babel monorepo to v7.29.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6095
* chore(deps): update commitlint monorepo to v20.5.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6097
* chore(deps): update dependency babel-loader to v10.1.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6098
* chore(deps): update vue monorepo to v3.5.30 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6092
* chore(eslint-plugin-formatjs): upgrade to ESLint 10 by @longlho in https://github.com/formatjs/formatjs/pull/6104
* chore: upgrade to Node 24 by @longlho in https://github.com/formatjs/formatjs/pull/6103
* chore(deps): update dependency rollup to v4.59.0 [security] by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6107
* chore(deps): update dependency conventional-changelog-angular to v8.3.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6105
* chore(deps): update dependency esbuild to ^0.27.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6106
* chore(deps): upgrade vitest to v4 by @longlho in https://github.com/formatjs/formatjs/pull/6108
* feat(react-intl): bump to v9.0.0 by @longlho in https://github.com/formatjs/formatjs/pull/6112
* docs(react-intl): rename upgrade guide from 9.x to 10.x by @longlho in https://github.com/formatjs/formatjs/pull/6113
* chore(deps): update dependency rules_java to v9.6.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6119
* chore(deps): update dependency lefthook to v2.1.4 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6118
* chore(deps): update dependency fast-xml-parser to v5.5.5 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6117
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260316.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6116
* chore(deps): update dependency babel-loader to v10.1.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6115
* docs: Fix explanation for plural one rule by @mkljczk in https://github.com/formatjs/formatjs/pull/6126
* feat(@formatjs/svelte-intl): add runtime package, CLI extraction, and docs for .svelte files by @longlho in https://github.com/formatjs/formatjs/pull/6122
* chore(deps): update rust crate clap to v4.6.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6128
* chore(deps): update dependency tailwind-merge to v3.5.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6125
* chore(deps): update dependency fast-xml-parser to v5.5.6 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6120
* chore(deps): update commitlint monorepo to v20.5.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6114
* chore(deps): update babel monorepo to v7.29.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6111
* chore(deps): update vue monorepo to v3.5.30 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6110
* feat(@formatjs/cli-lib): add AbortSignal support to extract() and compile() by @longlho in https://github.com/formatjs/formatjs/pull/6131
* chore(deps): update dependency rules_rust to v0.69.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6121
* chore(deps): update dependency webpack to v5.105.4 - autoclosed by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6127
* chore(deps): update typescript-eslint monorepo to v8.57.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6129
* chore(deps): update rust crate tempfile to v3.27.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6130
* chore(deps): update dependency @babel/preset-env to v7.29.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6132
* chore(deps): update dependency rules_rust_wasm_bindgen to v0.69.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6124
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260317.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6139
* chore(deps): update dependency @rspack/core to v1.7.9 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6138
* chore(deps): update dependency syncpack to v14 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6137
* feat: buffer locale data for parallel polyfill + data loading by @longlho in https://github.com/formatjs/formatjs/pull/6145
* feat(@formatjs/bigdecimal): add BigInt-backed decimal arithmetic library by @longlho in https://github.com/formatjs/formatjs/pull/6147
* feat(@formatjs/ecma402-abstract): migrate from decimal.js to @formatjs/bigdecimal by @longlho in https://github.com/formatjs/formatjs/pull/6148
* chore(deps): update github artifact actions (major) by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6141
* chore(deps): update pnpm/action-setup action to v5 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6142
* chore(deps): update dependency typesense to v3 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6140
* fix(deps): update dependency unplugin to v3 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6143
* fix(eslint-plugin-formatjs): restore ability to import util module by @timmorey in https://github.com/formatjs/formatjs/pull/6144
* chore: remove unused aspect_rules_lint dependency by @longlho in https://github.com/formatjs/formatjs/pull/6149
* fix(deps): disable bazelisk cache to fix stale Bazel version by @longlho in https://github.com/formatjs/formatjs/pull/6150
* fix(deps): update .bazeliskrc to Bazel 9.0.1 by @longlho in https://github.com/formatjs/formatjs/pull/6151
* chore(deps): update dependency content-tag to v4.1.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6152
* chore(deps): update dependency svelte to v5.53.13 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6146
* fix(deps): update oxlint monorepo by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6134
* chore(deps): update dependency aspect_rules_js to v3 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6135
* chore(deps): update dependency svelte to v5.54.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6153
* fix(@formatjs/unplugin): preserve space when removing JSX attribute on single line by @longlho in https://github.com/formatjs/formatjs/pull/6165
* fix(deps): add bigdecimal and svelte-intl to PACKAGES_TO_DIST by @longlho in https://github.com/formatjs/formatjs/pull/6167
* chore: deprecate @formatjs/vite-plugin, use @formatjs/unplugin by @longlho in https://github.com/formatjs/formatjs/pull/6166
* feat(formatjs_cli): replace glob crate with fast-glob + walkdir for brace expansion support by @longlho in https://github.com/formatjs/formatjs/pull/6169
* feat(@formatjs/cli): add --follow-links flag for symlink traversal in glob patterns by @longlho in https://github.com/formatjs/formatjs/pull/6174
* fix(@formatjs/unplugin): add flatten option to match babel-plugin-formatjs ID generation by @longlho in https://github.com/formatjs/formatjs/pull/6178
* fix(deps): harden claude.yml workflow against prompt injection by @longlho in https://github.com/formatjs/formatjs/pull/6186
* chore: update some github actions by @camsteffen in https://github.com/formatjs/formatjs/pull/6188
* fix(deps): remove typescript peer dependencies by @camsteffen in https://github.com/formatjs/formatjs/pull/6180
* build(deps): bump yaml from 1.10.2 to 1.10.3 by @dependabot[bot] in https://github.com/formatjs/formatjs/pull/6187
* build(deps): bump picomatch from 2.3.1 to 2.3.2 in /packages/react-intl/example-sandboxes/strict-locale-type by @dependabot[bot] in https://github.com/formatjs/formatjs/pull/6183
* build(deps): bump picomatch from 2.3.1 to 2.3.2 in /packages/react-intl/example-sandboxes/strict-message-types by @dependabot[bot] in https://github.com/formatjs/formatjs/pull/6181
* build(deps): bump flatted from 3.4.1 to 3.4.2 in /packages/react-intl/example-sandboxes/rescripts by @dependabot[bot] in https://github.com/formatjs/formatjs/pull/6171
* chore(deps): update dependency happy-dom to v20.8.8 [security] by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6190
* chore(deps): update tailwindcss monorepo to v4.2.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6163
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260326.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6158
* chore(deps): upgrade typescript to 6.0.2 by @longlho in https://github.com/formatjs/formatjs/pull/6194
* chore(deps): setup aspect-gazelle for BUILD file generation by @longlho in https://github.com/formatjs/formatjs/pull/6195
* docs(deps): add knowledge-base documentation for repo architecture by @longlho in https://github.com/formatjs/formatjs/pull/6196
* refactor(deps): gazelle migration phase 1 — inline thin wrappers by @longlho in https://github.com/formatjs/formatjs/pull/6197
* refactor(deps): gazelle migration phases 2-3 — decompose ts_compile and vitest macros by @longlho in https://github.com/formatjs/formatjs/pull/6198
* refactor(deps): gazelle migration — enable automatic dep management for all packages by @longlho in https://github.com/formatjs/formatjs/pull/6199
* revert(deps): revert gazelle migration phases 1-3 by @longlho in https://github.com/formatjs/formatjs/pull/6205
* chore: extract scripts directories into separate workspace packages by @longlho in https://github.com/formatjs/formatjs/pull/6206
* chore: add #packages/* path alias to generated tsconfigs by @longlho in https://github.com/formatjs/formatjs/pull/6208
* chore: add composite project support to tsconfig generation by @longlho in https://github.com/formatjs/formatjs/pull/6209
* chore(@formatjs/intl-locale): bundle with esbuild, externalize deps by @longlho in https://github.com/formatjs/formatjs/pull/6210
* chore: add esbuild bundling to all polyfill packages by @longlho in https://github.com/formatjs/formatjs/pull/6214
* chore: remove @formatjs/icu-messageformat-parser-wasm by @longlho in https://github.com/formatjs/formatjs/pull/6215
* chore(@formatjs/intl-segmenter): use #packages direct imports for ecma402-abstract by @longlho in https://github.com/formatjs/formatjs/pull/6218
* chore: convert ecma402-abstract imports to #packages in all polyfill packages by @longlho in https://github.com/formatjs/formatjs/pull/6226
* chore: convert scripts to use #packages imports for ecma402-abstract by @longlho in https://github.com/formatjs/formatjs/pull/6227
* chore: remove :node_modules/@formatjs/ecma402-abstract from bundled polyfill packages by @longlho in https://github.com/formatjs/formatjs/pull/6228
* chore: add esbuild bundling to remaining 7 packages by @longlho in https://github.com/formatjs/formatjs/pull/6230
* chore: declare all internal packages in root package.json by @longlho in https://github.com/formatjs/formatjs/pull/6233
* chore: migrate from esbuild to rolldown for JS bundling by @longlho in https://github.com/formatjs/formatjs/pull/6236
* chore: add package_exports_test to validate npm package exports by @longlho in https://github.com/formatjs/formatjs/pull/6237
* chore: validate .d.ts files exist for all .js exports by @longlho in https://github.com/formatjs/formatjs/pull/6238
* chore: bundle .d.ts files with rolldown-plugin-dts by @longlho in https://github.com/formatjs/formatjs/pull/6239
* chore: rewrite check_no_internal_imports from sh to TypeScript by @longlho in https://github.com/formatjs/formatjs/pull/6240
* docs(react-intl): remove references to injectIntl HOC removed in v10 by @longlho in https://github.com/formatjs/formatjs/pull/6241
* fix(@formatjs/icu-messageformat-parser): use Map.has() instead of in operator in collectVariables by @longlho in https://github.com/formatjs/formatjs/pull/6242
* fix(@formatjs/cli-lib): add missing EOF newline in compile-folder output by @longlho in https://github.com/formatjs/formatjs/pull/6244
* fix(@formatjs/intl-segmenter): add default index export by @longlho in https://github.com/formatjs/formatjs/pull/6243
* refactor(@formatjs/ecma402-abstract): remove barrel export, use deep imports by @longlho in https://github.com/formatjs/formatjs/pull/6246
* chore(formatjs-repo): add ast-grep with no-barrel-export rule by @longlho in https://github.com/formatjs/formatjs/pull/6247
* chore(@formatjs/ecma402-abstract): remove package.json, make internal-only by @longlho in https://github.com/formatjs/formatjs/pull/6250
* fix(@formatjs/cli): extract formatMessage from any object, not just intl by @longlho in https://github.com/formatjs/formatjs/pull/6251
* fix(deps): fix broken GitHub URLs in changelogs by @longlho in https://github.com/formatjs/formatjs/pull/6252
* chore(deps): update dependency picomatch to v4.0.4 [security] - autoclosed by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6235
* chore(deps): update dependency typesense to v3.0.5 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6191
* chore(deps): update dependency @types/picomatch to v4.0.3 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6254
* chore(deps): update dependency @rspack/core to v1.7.11 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6253
* chore(deps): regenerate MODULE.bazel.lock by @longlho in https://github.com/formatjs/formatjs/pull/6255
* refactor(deps): split ecma402-abstract into composite Bazel sub-packages by @longlho in https://github.com/formatjs/formatjs/pull/6256
* build(deps): migrate esbuild to rolldown, remove esbuild dependency by @longlho in https://github.com/formatjs/formatjs/pull/6266
* refactor(deps): move DisplayNames abstract operations to ecma402-abstract by @longlho in https://github.com/formatjs/formatjs/pull/6265
* ci(deps): combine rust-cli-test into test job by @longlho in https://github.com/formatjs/formatjs/pull/6269
* refactor(deps): move RelativeTimeFormat abstract ops to ecma402-abstract by @longlho in https://github.com/formatjs/formatjs/pull/6270
* refactor(deps): move PluralRules abstract ops to ecma402-abstract by @longlho in https://github.com/formatjs/formatjs/pull/6271
* refactor(deps): move DateTimeFormat abstract ops to ecma402-abstract by @longlho in https://github.com/formatjs/formatjs/pull/6272
* refactor(deps): move DurationFormat abstract ops to ecma402-abstract by @longlho in https://github.com/formatjs/formatjs/pull/6273
* refactor(deps): extract ECMA-262 abstract operations into packages/ecma262-abstract by @longlho in https://github.com/formatjs/formatjs/pull/6274
* build: migrate remaining packages from ts_compile to rolldown by @longlho in https://github.com/formatjs/formatjs/pull/6276
* build(deps): migrate intl-getcanonicallocales and cli-lib to rolldown by @longlho in https://github.com/formatjs/formatjs/pull/6278
* refactor(deps): migrate relative imports to #packages/ absolute imports by @longlho in https://github.com/formatjs/formatjs/pull/6280
* refactor(deps): add ast-grep rule to ban relative imports by @longlho in https://github.com/formatjs/formatjs/pull/6281
* chore(deps): update dependency conventional-changelog-angular to v8.3.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6261
* chore(deps): update dependency fast-xml-parser to v5.5.11 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6262
* chore(deps): update dependency rolldown to v1.0.0-rc.15 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6267
* chore(deps): update dependency bazel to v9.0.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6259
* chore(deps): update dependency buildifier_prebuilt to v8.5.1.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6260
* chore(deps): update dependency lefthook to v2.1.5 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6264
* chore(deps): update dependency happy-dom to v20.8.9 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6263
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260410.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6257
* chore(deps): update dependency serialize-javascript to v7.0.5 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6268
* refactor(deps): flatten src/ directories into package root by @longlho in https://github.com/formatjs/formatjs/pull/6284
* refactor(deps): ban all relative imports, split packer.ts by @longlho in https://github.com/formatjs/formatjs/pull/6285
* fix(deps): revert example-sandboxes to relative imports, fix examples BUILD by @longlho in https://github.com/formatjs/formatjs/pull/6292
* chore(deps): update oxlint to ^1.59.0, remove patch by @longlho in https://github.com/formatjs/formatjs/pull/6293
* chore(deps): update dependency ts-jest to v29.4.9 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6283
* chore(deps): update dependency ts-loader to v9.5.7 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6286
* chore(deps): update dependency rules_nodejs to v6.7.4 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6282
* chore(deps): update dependency vike to v0.4.257 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6287
* chore(deps): update dependency vitest to v4.1.4 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6289
* fix(deps): use tsconfig-based resolution in rolldown bundler by @longlho in https://github.com/formatjs/formatjs/pull/6296
* chore(deps): update bazel-contrib/setup-bazel action to v0.19.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6295
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260411.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6290
* chore(deps): update dependency vite to v8.0.8 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6288
* chore(deps): update vue monorepo to v3.5.32 - autoclosed by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6291
* chore(deps): update dependency @ast-grep/cli to ^0.42.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6297
* chore(deps): update dependency gazelle to v0.50.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6302
* chore(deps): update dependency lodash-es to v4.18.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6303
* chore(deps): update dependency esbuild to ^0.28.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6298
* refactor(deps): add formatjs_compile macro by @longlho in https://github.com/formatjs/formatjs/pull/6299
* fix(deps): add id-token: write permission to Claude Code workflow by @longlho in https://github.com/formatjs/formatjs/pull/6309
* fix(deps): add Rust CLI smoke test to BuildBuddy config by @longlho in https://github.com/formatjs/formatjs/pull/6310
* refactor(deps): add formatjs_package macro by @longlho in https://github.com/formatjs/formatjs/pull/6300
* chore(deps): update dependency oxc-transform to ^0.124.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6312
* chore(deps): update dependency oxfmt to ^0.44.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6313
* chore(deps): update dependency rollup to v4.60.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6314
* chore(deps): update dependency rules_shell to v0.7.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6315
* chore(deps): update dependency svelte to v5.55.3 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6317
* chore(deps): update dependency syncpack to v14.3.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6318
* refactor(deps): add formatjs_test macro by @longlho in https://github.com/formatjs/formatjs/pull/6301
* refactor(deps): migrate all 28 packages to formatjs macros by @longlho in https://github.com/formatjs/formatjs/pull/6306
* refactor(deps): add custom gazelle plugin with tree-sitter TS parser by @longlho in https://github.com/formatjs/formatjs/pull/6307
* chore(deps): update pnpm to v10.33.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6320
* chore(deps): update dependency webpack to v5.106.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6319
* chore(deps): update dependency rules_go to v0.60.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6321
* chore(deps): update rust crate icu to v2.2.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6322
* refactor(deps): enable gazelle plugin, update knowledge-base by @longlho in https://github.com/formatjs/formatjs/pull/6308
* chore(formatjs_cli): bump version to 1.1.1 by @longlho in https://github.com/formatjs/formatjs/pull/6323
* chore(deps): update rust crate indexmap to v2.14.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6326
* chore(deps): update typescript-eslint monorepo to v8.58.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6330
* fix(deps): update dependency eslint to v10.2.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6331
* fix(deps): update dependency oxc-parser to ^0.124.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6332
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260412.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6334
* chore(deps): update BUILD.bazel files via gazelle by @longlho in https://github.com/formatjs/formatjs/pull/6329
* fix(deps): update rust crate sha2 to 0.11 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6341
* l10n: comprehensive Swedish language support by @yeager in https://github.com/formatjs/formatjs/pull/6200
* refactor(deps): rename formatjs_compile to formatjs_library by @longlho in https://github.com/formatjs/formatjs/pull/6342
* refactor(deps): merge formatjs_package into formatjs_library by @longlho in https://github.com/formatjs/formatjs/pull/6344
* refactor(deps): expose js_library from formatjs_library, use in tests by @longlho in https://github.com/formatjs/formatjs/pull/6345
* refactor(deps): simplify formatjs_test, move rolldown to _formatjs_package by @longlho in https://github.com/formatjs/formatjs/pull/6346
* refactor(deps): let gazelle manage srcs for formatjs_library and formatjs_test by @longlho in https://github.com/formatjs/formatjs/pull/6349
* refactor(deps): remove formatjs_srcs_exclude by restructuring packages by @longlho in https://github.com/formatjs/formatjs/pull/6350
* refactor(deps): remove skipTest, srcs_exclude and test-d.ts special handling by @longlho in https://github.com/formatjs/formatjs/pull/6351
* refactor(deps): clean up gazelle structural assumptions by @longlho in https://github.com/formatjs/formatjs/pull/6352
* refactor(deps): auto-discover test fixtures, remove excludeFixtures from gazelle by @longlho in https://github.com/formatjs/formatjs/pull/6353
* refactor(deps): migrate ts_compile packages to formatjs_library by @longlho in https://github.com/formatjs/formatjs/pull/6354
* refactor(deps): migrate ts_compile packages to formatjs_library by @longlho in https://github.com/formatjs/formatjs/pull/6355
* refactor(deps): move generate_ide_tsconfig_json into formatjs_library by @longlho in https://github.com/formatjs/formatjs/pull/6356
* refactor(deps): auto-generate gazelle rules, remove package_json attr by @longlho in https://github.com/formatjs/formatjs/pull/6357
* refactor(deps): replace tree-sitter with oxc for gazelle import parsing by @longlho in https://github.com/formatjs/formatjs/pull/6360
* fix(deps): handle oxc parser errors gracefully by @longlho in https://github.com/formatjs/formatjs/pull/6361
* fix(deps): handle oxc parser errors gracefully instead of crashing by @longlho in https://github.com/formatjs/formatjs/pull/6362
* refactor(deps): restructure gazelle TS plugin architecture by @longlho in https://github.com/formatjs/formatjs/pull/6364
* refactor(deps): switch gazelle IPC from JSON to protobuf by @longlho in https://github.com/formatjs/formatjs/pull/6365
* chore(deps): upgrade oxc crates to 0.126 by @longlho in https://github.com/formatjs/formatjs/pull/6368
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260417.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6369
* chore(deps): update dependency lefthook to v2.1.6 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6370
* chore(deps): update dependency svelte to v5.55.4 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6372
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260418.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6373
* chore(deps): update dependency vike to v0.4.258 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6376
* chore(deps): update dependency webpack to v5.106.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6377
* docs: add robots.txt, sitemap.xml, and agent discovery metadata by @longlho in https://github.com/formatjs/formatjs/pull/6378
* chore(deps): update rust crate clap to v4.6.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6379
* chore(deps): update typescript-eslint monorepo to v8.58.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6380
* fix(deps): update dependency eslint to v10.2.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6384
* chore(deps): update dependency rollup to v4.60.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6383
* chore(deps): update dependency fast-xml-parser to v5.7.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6386
* chore(deps): update dependency happy-dom to v20.9.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6388
* docs: add @formatjs_generated packages architecture and migration plan by @longlho in https://github.com/formatjs/formatjs/pull/6382
* chore(deps): update dependency oxc-transform to ^0.126.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6389
* chore(deps): update dependency oxfmt to ^0.45.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6390
* chore(deps): update dependency oxlint to v1.60.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6392
* chore(deps): update dependency protobuf to v33.6 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6393
* fix(deps): update dependency oxc-parser to ^0.126.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6395
* chore(deps): update dependency rules_shell to v0.8.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6394
* build: add @formatjs_generated package infrastructure by @longlho in https://github.com/formatjs/formatjs/pull/6391
* ci: add merge_group trigger to CI workflows by @longlho in https://github.com/formatjs/formatjs/pull/6398
* build(@formatjs/intl-datetimeformat): migrate tz data to @formatjs_generated/tz by @longlho in https://github.com/formatjs/formatjs/pull/6385
* build: remove direct write_source_files targets from packages by @longlho in https://github.com/formatjs/formatjs/pull/6406
* Revert "build: remove direct write_source_files targets from packages" by @longlho in https://github.com/formatjs/formatjs/pull/6407
* build: migrate all generated data to @formatjs_generated packages by @longlho in https://github.com/formatjs/formatjs/pull/6405
* build: remove write_source_files for generated test data by @longlho in https://github.com/formatjs/formatjs/pull/6410
* chore(deps): update pnpm/action-setup action to v6 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6397
* chore(deps): update softprops/action-gh-release action to v3 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6408
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260419.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6411
* chore(deps): update dependency vite to v8.0.9 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6412
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260420.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6413
* chore(deps): update typescript-eslint monorepo to v8.59.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6416
* chore(deps): update tailwindcss monorepo to v4.2.3 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6327
* chore(deps): update dependency bazel to v9.1.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6417
* chore(deps): update dependency oxc-transform to ^0.127.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6418
* chore(deps): update dependency oxfmt to ^0.46.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6420
* chore(deps): update dependency oxlint to v1.61.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6421
* fix(deps): update dependency oxc-parser to ^0.127.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6422
* chore(deps): update tailwindcss monorepo to v4.2.4 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6419
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260421.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6424
* chore(deps): update dependency typesense to v3.0.6 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6425
* chore(deps): update dependency vitest to v4.1.5 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6426
* docs: use @knowledge-base/ references in CLAUDE.md by @longlho in https://github.com/formatjs/formatjs/pull/6430
* fix(@formatjs/intl): preserve process.env.NODE_ENV check in bundled output by @longlho in https://github.com/formatjs/formatjs/pull/6429
* fix(@formatjs/intl-localematcher): latin american locales match es-419 correctly by @longlho in https://github.com/formatjs/formatjs/pull/6431
* fix(@formatjs/ts-transformer): include source location in extraction warnings by @longlho in https://github.com/formatjs/formatjs/pull/6432
* feat(@formatjs/intl-datetimeformat): update IANA timezone database to 2026b by @longlho in https://github.com/formatjs/formatjs/pull/6436
* fix(@formatjs/ts-transformer): restore ts-jest-integration subpath export by @longlho in https://github.com/formatjs/formatjs/pull/6437
* build: migrate Rust toolchain from rules_rust to rules_rs by @dzbarsky in https://github.com/formatjs/formatjs/pull/6423
* build(deps): migrate gazelle TS plugin to hermeticbuild/gazelle_ts by @longlho in https://github.com/formatjs/formatjs/pull/6438
* chore(deps): update dependency @commitlint/cli to v20.5.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6439
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260427.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6440
* chore(deps): update dependency @vue/test-utils to v2.4.9 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6441
* chore(deps): update dependency fast-xml-parser to v5.7.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6442
* chore(deps): update dependency svelte to v5.55.5 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6443
* chore(deps): update dependency llvm to v0.7.5 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6444
* chore(deps): update dependency syncpack to v14.3.1 - autoclosed by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6445
* chore(deps): update dependency vite to v8.0.10 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6447
* chore(deps): update pnpm to v10.33.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6448
* chore(deps): update typescript-eslint monorepo to v8.59.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6449
* chore(deps): update vue monorepo to v3.5.33 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6450
* build(deps): bump gazelle_ts to latest cgo-staticlib build by @longlho in https://github.com/formatjs/formatjs/pull/6446
* chore(deps): update dependency oxc-transform to ^0.128.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6451
* chore(deps): update dependency oxfmt to ^0.47.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6452
* chore(deps): update dependency oxlint to v1.62.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6453
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260428.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6456
* fix(deps): update dependency oxc-parser to ^0.128.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6457
* fix(formatjs_cli): extract formatMessage from callbacks inside optional chains by @walkerburgin in https://github.com/formatjs/formatjs/pull/6460
* chore(formatjs_cli): bump version to 1.1.2 by @longlho in https://github.com/formatjs/formatjs/pull/6461
* build(deps): switch gazelle_ts to official BCR v0.3.3 release by @longlho in https://github.com/formatjs/formatjs/pull/6463
* build(eslint-plugin-formatjs): enable gazelle for BUILD.bazel by @longlho in https://github.com/formatjs/formatjs/pull/6464
* fix(@formatjs/unplugin): strip query/hash in transformInclude by @longlho in https://github.com/formatjs/formatjs/pull/6465
* fix(@formatjs/intl-durationformat): use BigDecimal for sub-second rollups by @longlho in https://github.com/formatjs/formatjs/pull/6466
* fix(@formatjs/intl-durationformat): declare @formatjs/bigdecimal dependency by @longlho in https://github.com/formatjs/formatjs/pull/6468
* build(deps): enable package_json_test across published packages by @longlho in https://github.com/formatjs/formatjs/pull/6469
* build(deps): pin gazelle_ts to latest main for abstract-kind rename by @longlho in https://github.com/formatjs/formatjs/pull/6470
* docs: clarify native CLI install and compatibility by @longlho in https://github.com/formatjs/formatjs/pull/6471
* chore: prune unused dependencies by @longlho in https://github.com/formatjs/formatjs/pull/6472
* fix(formatjs): support TS assertions in message extraction by @longlho in https://github.com/formatjs/formatjs/pull/6475
* fix(deps): update Rust OXC crates to 0.129 by @longlho in https://github.com/formatjs/formatjs/pull/6476
* chore(deps): update commitlint monorepo to v20.5.3 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6478
* chore(deps): update tailwindcss monorepo to v4.2.4 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6427
* chore(deps): update dependency lucide-react to v1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6347
* chore(deps): update dependency @babel/preset-env to v7.29.5 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6479
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260505.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6480
* chore: generate package tsconfigs locally by @longlho in https://github.com/formatjs/formatjs/pull/6482
* build: use resolve_regexp for generated packages by @longlho in https://github.com/formatjs/formatjs/pull/6485
* fix(@formatjs/intl-durationformat): export duration format options by @longlho in https://github.com/formatjs/formatjs/pull/6487
* fix(formatjs_cli): build Linux binary without glibc dependency by @longlho in https://github.com/formatjs/formatjs/pull/6489
* build: generate tzdata hermetically with bazel by @longlho in https://github.com/formatjs/formatjs/pull/6490
* chore(deps): update dependency @types/estree to v1.0.9 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6491
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260510.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6492
* chore(deps): update dependency @vue/test-utils to v2.4.10 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6493
* chore(deps): update dependency fast-xml-parser to v5.7.3 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6494
* chore(deps): update dependency fs-extra to v11.3.5 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6495
* chore(deps): update dependency rollup to v4.60.3 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6496
* chore(deps): update dependency tinybench to v6.0.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6497
* chore(deps): update dependency vike to v0.4.259 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6498
* chore(deps): update dependency vite to v8.0.11 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6499
* chore(deps): update pnpm to v10.33.4 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6500
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260511.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6501
* chore(deps): update dependency vite to v8.0.12 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6502
* chore(deps): update typescript-eslint monorepo to v8.59.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6504
* chore(deps): update dependency vitest to v4.1.6 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6503
* chore(deps): update vue monorepo to v3.5.34 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6505
* chore(deps): update dependency aspect_rules_js to v3.1.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6506
* chore(deps): update typescript-eslint monorepo to v8.59.3 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6507
* chore(deps): update dependency content-tag to v4.2.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6508
* chore(deps): update dependency gazelle to v0.51.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6509
* chore(deps): update dependency llvm to v0.8.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6510
* refactor(formatjs_cli): expose shared rust library by @longlho in https://github.com/formatjs/formatjs/pull/6511
* feat(formatjs_cli): add napi binding crate by @longlho in https://github.com/formatjs/formatjs/pull/6512
* feat(formatjs_cli): expose compile through napi by @longlho in https://github.com/formatjs/formatjs/pull/6513
* chore(deps): update dependency oxc-transform to ^0.130.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6514
* chore(deps): update dependency oxlint to v1.64.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6516
* chore(deps): update dependency platforms to v1.1.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6517
* chore(deps): update dependency oxfmt to ^0.49.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6515
* chore(deps): update dependency rolldown-plugin-dts to ^0.25.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6521
* chore(deps): update dependency tailwind-merge to v3.6.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6522
* chore(deps): update tailwindcss monorepo to v4.3.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6523
* chore(deps): update dependency fast-xml-parser to v5.8.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6520
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260512.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6525
* fix(deps): update dependency eslint to v10.3.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6526
* fix(deps): update dependency oxc-parser to ^0.130.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6527
* build(formatjs_cli): add cross platform release artifacts by @longlho in https://github.com/formatjs/formatjs/pull/6518
* feat(@formatjs/cli-lib): prefer native compile and deprecate custom --format files by @longlho in https://github.com/formatjs/formatjs/pull/6519
* build: require Renovate updates to be 7 days old by @longlho in https://github.com/formatjs/formatjs/pull/6529
* Add OSS-Fuzz fuzz targets under fuzz by @rootvector2 in https://github.com/formatjs/formatjs/pull/6524
* chore: inline Bazel 9 rc settings by @longlho in https://github.com/formatjs/formatjs/pull/6532
* build: include native packages in release dist by @longlho in https://github.com/formatjs/formatjs/pull/6534
* build: enable RBE for BuildBuddy workflows by @longlho in https://github.com/formatjs/formatjs/pull/6535
* chore: upgrade oxc dependencies by @longlho in https://github.com/formatjs/formatjs/pull/6536
* build: minimize BuildBuddy workflow downloads by @longlho in https://github.com/formatjs/formatjs/pull/6538
* build: trigger BuildBuddy workflows for PRs by @longlho in https://github.com/formatjs/formatjs/pull/6540
* fix(@formatjs/intl-numberformat): polyfill BigInt toLocaleString by @longlho in https://github.com/formatjs/formatjs/pull/6547
* fix(@formatjs/intl-numberformat): expose rounding resolved options by @longlho in https://github.com/formatjs/formatjs/pull/6545
* docs(@formatjs/intl-collator): document missing ECMA-402 polyfill by @longlho in https://github.com/formatjs/formatjs/pull/6546
* fix(@formatjs/intl-datetimeformat): align current ECMA-402 options by @longlho in https://github.com/formatjs/formatjs/pull/6548
* fix(@formatjs/intl-durationformat): align fractional unit style by @longlho in https://github.com/formatjs/formatjs/pull/6549
* docs(@formatjs/intl-collator): plan polyfill by @longlho in https://github.com/formatjs/formatjs/pull/6550
* feat(@formatjs/intl-collator): add package skeleton by @longlho in https://github.com/formatjs/formatjs/pull/6551
* feat(@formatjs/intl-collator): add UCA parser scaffold by @longlho in https://github.com/formatjs/formatjs/pull/6552
* feat(@formatjs/intl-collator): add LDML collation parser by @longlho in https://github.com/formatjs/formatjs/pull/6553
* build(@formatjs/intl-collator): add CLDR common archive by @longlho in https://github.com/formatjs/formatjs/pull/6554
* feat(@formatjs/intl-collator): generate root collation data by @longlho in https://github.com/formatjs/formatjs/pull/6555
* feat(@formatjs/intl-collator): add locale collation data pipeline by @longlho in https://github.com/formatjs/formatjs/pull/6556
* feat(@formatjs/intl-collator): implement tailored locale comparison by @longlho in https://github.com/formatjs/formatjs/pull/6560
* test(@formatjs/intl-collator): add collator conformance tests by @longlho in https://github.com/formatjs/formatjs/pull/6564
* ci: move Rust CLI Linux compatibility check to BuildBuddy by @longlho in https://github.com/formatjs/formatjs/pull/6566
* docs(@formatjs/intl-collator): document collator polyfill by @longlho in https://github.com/formatjs/formatjs/pull/6565
* build: upgrade gazelle_ts by @longlho in https://github.com/formatjs/formatjs/pull/6567
* build: bump gazelle_ts to 0.4.18 by @longlho in https://github.com/formatjs/formatjs/pull/6570
* feat(@formatjs/cli-native-linux-arm64): add native package by @longlho in https://github.com/formatjs/formatjs/pull/6571
* fix(@formatjs/intl-listformat): add generated tok locale data by @longlho in https://github.com/formatjs/formatjs/pull/6572
* build: include linux arm64 native package in dist by @longlho in https://github.com/formatjs/formatjs/pull/6574
* chore(formatjs_cli): use Bazel release builds in docs by @longlho in https://github.com/formatjs/formatjs/pull/6576
* fix(formatjs_cli): implement pseudo-locale transforms by @longlho in https://github.com/formatjs/formatjs/pull/6578
* fix(react-intl): set FormattedListParts displayName by @longlho in https://github.com/formatjs/formatjs/pull/6580
* fix: harden polyfill installation by @longlho in https://github.com/formatjs/formatjs/pull/6579
* test(react-intl): cover list and relative time components by @longlho in https://github.com/formatjs/formatjs/pull/6581
* chore(deps): update dependency aspect_rules_ts to v3.8.9 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6258
* chore(deps): update dependency rolldown to v1.0.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6371
* chore(deps): update dependency protobuf to v34.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6454
* chore(deps): update dependency typescript to v6.0.3 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6374
* chore(deps): update dependency @rspack/core to v2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6537
* chore(deps): update dependency syncpack to v15 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6539
* build(deps-dev): bump svelte from 5.53.12 to 5.55.7 by @dependabot[bot] in https://github.com/formatjs/formatjs/pull/6568
* chore(deps): update commitlint monorepo to v21 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6577
* chore(deps): update pnpm to v11 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6543
* chore(deps): update lerna-lite monorepo to v5 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6348
* fix(@formatjs/cli-native-win32-x64): add native package by @longlho in https://github.com/formatjs/formatjs/pull/6586
* build(deps): bump brace-expansion from 1.1.12 to 5.0.6 by @dependabot[bot] in https://github.com/formatjs/formatjs/pull/6584
* chore(deps): update pnpm to v11.1.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6585
* chore(deps): update pnpm to v11.1.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6587
* chore(deps): update dependency vike-react to v0.6.22 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6588
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260513.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6589
* chore(deps): update rust crate napi-derive to v3.5.6 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6592
* chore(deps): update dependency rolldown to v1.0.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6591
* chore(deps): update rust crate napi to v3.9.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6594
* chore(deps): update dependency tinybench to v6.0.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6595
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260514.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6596
* chore(deps): update dependency vite to v8.0.13 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6597
* chore(deps): update pnpm to v11.1.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6598
* fix(@formatjs/unplugin): preserve escaped tag literals when flattening by @longlho in https://github.com/formatjs/formatjs/pull/6599
* chore(deps): update dependency lucide-react to v1.16.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6600
* chore(deps): update dependency rollup to v4.60.4 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6601
* chore(deps): update dependency @vitejs/plugin-react to v6.0.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6605
* fix(@formatjs/cli-lib): handle literal Windows compile paths by @longlho in https://github.com/formatjs/formatjs/pull/6607
* fix(@formatjs/unplugin): preserve JSX defaultMessage output by @longlho in https://github.com/formatjs/formatjs/pull/6608
* build(deps): bump js-cookie from 3.0.5 to 3.0.7 by @dependabot[bot] in https://github.com/formatjs/formatjs/pull/6604
* build(deps): bump ws from 7.5.10 to 8.20.1 by @dependabot[bot] in https://github.com/formatjs/formatjs/pull/6590
* docs: clarify cli native binding support by @longlho in https://github.com/formatjs/formatjs/pull/6609
* fix(deps): update dependency eslint to v10.4.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6612
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260515.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6610
* perf(formatjs_cli): parallelize file processing by @longlho in https://github.com/formatjs/formatjs/pull/6611
* docs(formatjs_cli): document rayon thread cap by @longlho in https://github.com/formatjs/formatjs/pull/6616
* perf(formatjs_cli): reduce parser and extract allocations by @longlho in https://github.com/formatjs/formatjs/pull/6617
* chore(deps): update dependency vike-react to v0.6.23 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6619
* chore(deps): update dependency rolldown-plugin-dts to v0.25.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6618
* bench(formatjs_cli): add OSS React Intl corpora by @longlho in https://github.com/formatjs/formatjs/pull/6621
* fix(@formatjs/unplugin): expose transform hook filters by @longlho in https://github.com/formatjs/formatjs/pull/6622
* chore(deps): update dependency oxc-transform to ^0.131.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6624
* chore(deps): update dependency oxfmt to ^0.50.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6625
* docs(formatjs_cli): document prerelease before tag by @longlho in https://github.com/formatjs/formatjs/pull/6626
* fix(deps): update oxc rust crates to 0.131 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6613
* chore(deps): update dependency oxlint to v1.65.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6627
* fix(deps): update dependency oxc-parser to ^0.131.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6628
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260516.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6629
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260517.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6630
* chore(deps): update dependency syncpack to v15.2.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6631
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260518.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6632
* chore(deps): update dependency oxc-transform to ^0.132.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6633
* chore(deps): update dependency svelte to v5.55.8 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6634
* chore(deps): update pnpm to v11.1.3 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6635
* chore(deps): update typescript-eslint monorepo to v8.59.4 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6636
* chore(deps): update dependency syncpack to v15.3.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6637
* fix(deps): update dependency oxc-parser to ^0.132.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6638
* perf(formatjs_cli): parallelize catalog parsing by @longlho in https://github.com/formatjs/formatjs/pull/6642
* ci: add crates trusted publishing workflow by @longlho in https://github.com/formatjs/formatjs/pull/6645
* build: add release-please pilot by @longlho in https://github.com/formatjs/formatjs/pull/6582
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260519.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6647
* chore(deps): update dependency syncpack to v15.3.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6648
* chore(deps): update dependency ts-jest to v29.4.10 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6649
* chore(deps): update dependency oxfmt to ^0.51.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6650
* chore(deps): update googleapis/release-please-action action to v5 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6646
* chore: release main by @longlho in https://github.com/formatjs/formatjs/pull/6654
* chore(deps): update dependency lefthook to v2.1.8 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6651
* chore(deps): update dependency oxlint to v1.66.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6652
* ci(formatjs_cli): cross-compile release binaries on linux by @longlho in https://github.com/formatjs/formatjs/pull/6656
* ci: fix crates release dependency polling by @longlho in https://github.com/formatjs/formatjs/pull/6655
* fix(deps): update rust crate oxc to 0.132 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6639
* ci: use node24 crates auth action by @longlho in https://github.com/formatjs/formatjs/pull/6658
* build(deps): bump qs and express in /packages/react-intl/example-sandboxes/rescripts by @dependabot[bot] in https://github.com/formatjs/formatjs/pull/6623
* chore: release main by @longlho in https://github.com/formatjs/formatjs/pull/6657
* fix(@formatjs/unplugin): decode JSX bull entity by @longlho in https://github.com/formatjs/formatjs/pull/6662
* fix(@formatjs/cli-lib): expose native extract binding by @longlho in https://github.com/formatjs/formatjs/pull/6663
* build: publish npm from release please by @longlho in https://github.com/formatjs/formatjs/pull/6664
* fix: align release-please package components by @longlho in https://github.com/formatjs/formatjs/pull/6665
* fix: preserve release-please workspace candidates by @longlho in https://github.com/formatjs/formatjs/pull/6667
* chore: release main by @longlho in https://github.com/formatjs/formatjs/pull/6666
* chore(deps): update dependency rolldown to v1.0.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6669
* chore(deps): update dependency svelte to v5.55.9 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6670
* chore(deps): update dependency @rspack/core to v2.0.4 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6671
* chore(deps): update dependency vitest to v4.1.7 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6672
* chore(deps): update pnpm to v11.2.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6674
* chore(deps): update dependency webpack to v5.107.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6673
* chore: add codescythe hook by @longlho in https://github.com/formatjs/formatjs/pull/6668
* chore(deps): update pnpm to v11.2.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6675
* chore: release main by @longlho in https://github.com/formatjs/formatjs/pull/6676
* build: dispatch release workflow for npm publishing by @longlho in https://github.com/formatjs/formatjs/pull/6677
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260521.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6679
* chore(deps): update dependency vite to v8.0.14 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6680
* chore(deps): update dependency ts-jest to v29.4.11 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6682
* chore(deps): update dependency webpack to v5.107.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6683
* chore(deps): update pnpm to v11.2.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6685
* chore(deps): update rust crate serde_json to v1.0.150 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6686
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260522.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6687
* chore: keep gazelle idempotent by @longlho in https://github.com/formatjs/formatjs/pull/6689
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260523.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6690
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260524.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6691
* chore(deps): update pnpm to v11.3.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6692
* chore(deps): update codescythe to 0.6.1 by @longlho in https://github.com/formatjs/formatjs/pull/6693
* fix(formatjs_cli): support id interpolation hash algorithms by @longlho in https://github.com/formatjs/formatjs/pull/6695
* chore(deps): update babel monorepo to v7.29.7 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6696
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260526.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6697
* chore(deps): update dependency oxc-transform to ^0.133.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6699
* chore(deps): update dependency webpack to v5.107.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6698
* chore(deps): update dependency oxfmt to ^0.52.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6702
* chore(deps): update dependency oxlint to v1.67.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6703
* chore(deps): update typescript-eslint monorepo to v8.60.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6704
* fix(deps): update dependency oxc-parser to ^0.133.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6705
* fix(formatjs_cli): speed up skipped message diagnostics by @longlho in https://github.com/formatjs/formatjs/pull/6709
* fix(deps): update rust crate oxc_data_structures to 0.133 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6713
* fix(deps): update rust OXC crates to 0.133 by @longlho in https://github.com/formatjs/formatjs/pull/6714
* build: verify generated package manifests from bazel deps by @longlho in https://github.com/formatjs/formatjs/pull/6701
* build: generate package manifests by @longlho in https://github.com/formatjs/formatjs/pull/6718
* chore(deps): update dependency @rescripts/cli to v0.0.16 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6716
* chore(deps): update dependency react-scripts to v5.0.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6719
* build: align release-please with generated package manifests by @longlho in https://github.com/formatjs/formatjs/pull/6720
* chore(deps): update dependency @rescripts/rescript-env to v0.0.14 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6717
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260527.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6724
* build: add bazel release-please workspace plugin by @longlho in https://github.com/formatjs/formatjs/pull/6723
* chore(deps): update dependency rolldown to v1.0.3 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6725
* chore: release main by @longlho in https://github.com/formatjs/formatjs/pull/6721
* build: fix release-please multiline outputs by @longlho in https://github.com/formatjs/formatjs/pull/6726
* chore(deps): update pnpm to v11.4.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6727
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260527.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6729
* build: remove checked-in package intradeps by @longlho in https://github.com/formatjs/formatjs/pull/6728
* fix(formatjs_cli): support loader-utils id templates by @longlho in https://github.com/formatjs/formatjs/pull/6731
* fix(@formatjs/cli-lib): extract Svelte FormattedMessage components by @longlho in https://github.com/formatjs/formatjs/pull/6732
* fix(deps): publish generated workspace packages by @longlho in https://github.com/formatjs/formatjs/pull/6734
* chore(deps): isolate React Intl example workspaces by @longlho in https://github.com/formatjs/formatjs/pull/6737
* fix: normalize Unicode whitespace for generated ids by @longlho in https://github.com/formatjs/formatjs/pull/6736
* chore: release main by @longlho in https://github.com/formatjs/formatjs/pull/6733
* ci: pass repository to release workflow dispatch by @longlho in https://github.com/formatjs/formatjs/pull/6740
* fix(formatjs_cli): build native packages in opt mode by @longlho in https://github.com/formatjs/formatjs/pull/6744
* fix(@formatjs/cli-lib): support Alpine native bindings by @longlho in https://github.com/formatjs/formatjs/pull/6743
* fix(deps): use Bazel graph for native release propagation by @longlho in https://github.com/formatjs/formatjs/pull/6747
* chore: release main by @longlho in https://github.com/formatjs/formatjs/pull/6745
* chore(deps): update dependency svelte to v5.56.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6741
* chore(deps): update commitlint monorepo to v21.0.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6748
* chore(deps): update dependency lefthook to v2.1.9 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6749
* fix(formatjs_cli_napi): build musl packages with bazel by @longlho in https://github.com/formatjs/formatjs/pull/6754
* fix(formatjs_cli_napi): package musl runtime library by @longlho in https://github.com/formatjs/formatjs/pull/6756
* ci(formatjs_cli): build release artifacts in opt mode by @longlho in https://github.com/formatjs/formatjs/pull/6757
* chore: release main by @longlho in https://github.com/formatjs/formatjs/pull/6755
* chore(deps): update dependency rolldown-plugin-dts to v0.25.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6750
* chore(deps): update eslint monorepo to v10.4.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6751
* chore(deps): update vue monorepo to v3.5.35 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6753
* chore(deps): update rspack monorepo to v2.0.6 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6752
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260603.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6765
* chore(deps): update dependency svelte to v5.56.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6766
* chore(deps): update dependency vue-eslint-parser to v10.4.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6769
* chore(deps): update dependency vite to v8.0.16 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6768
* chore(deps): update oxc dependencies to 0.134 by @longlho in https://github.com/formatjs/formatjs/pull/6764
* chore(deps): update dependency bazel to v9.1.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6773
* fix(@formatjs/intl-datetimeformat): honor numberingSystem option by @longlho in https://github.com/formatjs/formatjs/pull/6775
* fix(deps): update react monorepo by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6774
* chore(deps): update dependency oxfmt to ^0.53.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6777
* chore(deps): update vitest monorepo to v4.1.8 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6772
* chore(deps): update typescript-eslint monorepo to v8.61.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6771
* chore(deps): update dependency oxc-parser to ^0.134.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6776
* chore(deps): update dependency rolldown to v1.1.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6779
* chore(deps): update react monorepo to v19.2.16 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6778
* chore(deps): remove unused root dependencies by @longlho in https://github.com/formatjs/formatjs/pull/6782
* chore: release main by @longlho in https://github.com/formatjs/formatjs/pull/6770
* fix(@formatjs/intl-durationformat): respect numberingSystem option by @longlho in https://github.com/formatjs/formatjs/pull/6795
* fix(babel-plugin-formatjs): respect throws false for extraction errors by @longlho in https://github.com/formatjs/formatjs/pull/6798
* chore: release main by @longlho in https://github.com/formatjs/formatjs/pull/6797
* fix(react-intl): support react 18 peer range by @longlho in https://github.com/formatjs/formatjs/pull/6800
* test(react-intl): add React 17 typecheck fixture by @longlho in https://github.com/formatjs/formatjs/pull/6805
* test(react-intl): add React 16.8 typecheck fixture by @longlho in https://github.com/formatjs/formatjs/pull/6806
* fix(react-intl): support React 18+ consumers by @longlho in https://github.com/formatjs/formatjs/pull/6807
* fix(@formatjs/icu-messageformat-parser): print plural/select branches in canonical order by @Amund211 in https://github.com/formatjs/formatjs/pull/6802
* chore(deps): update dependency esbuild to v0.28.1 [security] by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6793
* chore(deps): update dependency oxlint to v1.70.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6786
* chore(deps): update dependency happy-dom to v20.10.6 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6784
* chore(deps): update pnpm to v11.8.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6790
* chore(deps): update dependency semver to v7.8.4 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6788
* chore(deps): update dependency @typescript/native-preview to v7.0.0-dev.20260618.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6783
* chore(deps): update dependency lucide-react to v1.21.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6785
* chore(deps): update dependency @vue/test-utils to v2.4.11 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6787
* chore(deps): update dependency ts-loader to v9.6.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6781
* chore(deps): update dependency svelte to v5.56.3 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6789
* chore(deps): update dependency @rspack/core to v2.0.8 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6808
* build(deps): bump vite from 8.0.0 to 8.1.0 by @dependabot[bot] in https://github.com/formatjs/formatjs/pull/6803
* build(deps): bump esbuild from 0.28.0 to 0.28.1 by @dependabot[bot] in https://github.com/formatjs/formatjs/pull/6792
* chore(deps): update react monorepo by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6811
* chore(deps): update dependency rolldown to v1.1.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6810
* chore: release main by @longlho in https://github.com/formatjs/formatjs/pull/6804
* chore(deps): update rust crate regex to v1.12.4 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6813
* chore(deps): update rust crate napi to v3.9.3 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6812
* fix(deps): update dependency babel-plugin-formatjs to v11.3.13 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6815
* fix(deps): update dependency eslint-plugin-formatjs to v6.4.15 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6816
* fix(deps): update dependency react-intl to v10.1.13 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6820
* fix(deps): update rust crate oxc_data_structures to 0.137 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6830
* chore(deps): fix pnpm install warnings by @longlho in https://github.com/formatjs/formatjs/pull/6833
* chore: release main by @longlho in https://github.com/formatjs/formatjs/pull/6831
* feat(@formatjs/unplugin): add rsbuild adapter by @longlho in https://github.com/formatjs/formatjs/pull/6838
* fix(@formatjs/intl-relativetimeformat): honor numberingSystem option by @greymoth-jp in https://github.com/formatjs/formatjs/pull/6835
* fix(@formatjs/icu-messageformat-parser): coalesce adjacent syntax chars when escaping by @spokodev in https://github.com/formatjs/formatjs/pull/6837
* chore: apply pre-commit cleanup by @longlho in https://github.com/formatjs/formatjs/pull/6841
* fix(@formatjs/cli-lib): handle fast-glob esm import by @longlho in https://github.com/formatjs/formatjs/pull/6845
* fix(@formatjs/intl-datetimeformat): honor hour12 with timeStyle by @longlho in https://github.com/formatjs/formatjs/pull/6846
* fix(formatjs_cli): parse JSX in JavaScript extract inputs by @longlho in https://github.com/formatjs/formatjs/pull/6850

## New Contributors
* @michaeldoubek made their first contribution in https://github.com/formatjs/formatjs/pull/6018
* @William-Feng made their first contribution in https://github.com/formatjs/formatjs/pull/6066
* @mkljczk made their first contribution in https://github.com/formatjs/formatjs/pull/6126
* @camsteffen made their first contribution in https://github.com/formatjs/formatjs/pull/6188
* @yeager made their first contribution in https://github.com/formatjs/formatjs/pull/6200
* @dzbarsky made their first contribution in https://github.com/formatjs/formatjs/pull/6423
* @walkerburgin made their first contribution in https://github.com/formatjs/formatjs/pull/6460
* @rootvector2 made their first contribution in https://github.com/formatjs/formatjs/pull/6524
* @Amund211 made their first contribution in https://github.com/formatjs/formatjs/pull/6802
* @greymoth-jp made their first contribution in https://github.com/formatjs/formatjs/pull/6835
* @spokodev made their first contribution in https://github.com/formatjs/formatjs/pull/6837

**Full Changelog**: https://github.com/formatjs/formatjs/compare/formatjs_icu_messageformat_parser_v0.2.4...formatjs_icu_messageformat_parser_v0.2.5


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_icu_skeleton_parser bumped from 0.1.1 to 0.1.2

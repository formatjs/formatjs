# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 3.2.12 (2026-09-10)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
* docs: add Korean (ko-KR) to homepage live demo by @moduvoice in https://github.com/formatjs/formatjs/pull/6858
* fix(deps): restore Jest 29 compatibility by @longlho in https://github.com/formatjs/formatjs/pull/6872
* fix(icu_messageformat_parser): dedupe structural variables by @longlho in https://github.com/formatjs/formatjs/pull/6883
* chore: release main by @longlho in https://github.com/formatjs/formatjs/pull/6859
* fix(@formatjs/intl-datetimeformat): apply Date method defaults by @longlho in https://github.com/formatjs/formatjs/pull/6893
* chore: release main by @longlho in https://github.com/formatjs/formatjs/pull/6894
* fix(@formatjs/unplugin): parse module ids with queries by @longlho in https://github.com/formatjs/formatjs/pull/6896
* chore: release main by @longlho in https://github.com/formatjs/formatjs/pull/6898
* fix: repair corrupted `patches/typescript@7.0.2.patch` by @andersk in https://github.com/formatjs/formatjs/pull/6929
* fix(babel-plugin-formatjs): stop enabling JSX syntax implicitly by @andersk in https://github.com/formatjs/formatjs/pull/6930
* test(@formatjs/intl-datetimeformat): cover ar-EG locale data by @longlho in https://github.com/formatjs/formatjs/pull/6933
* feat: upgrade CLDR to 48.2.0 by @longlho in https://github.com/formatjs/formatjs/pull/6934
* fix(@formatjs/intl): include context in missing id errors by @longlho in https://github.com/formatjs/formatjs/pull/6935
* fix(deps): make native release deps host-independent by @longlho in https://github.com/formatjs/formatjs/pull/6936
* fix(icu-messageformat-parser): preserve plural context in tags by @eoinest in https://github.com/formatjs/formatjs/pull/6908
* chore: release main by @longlho in https://github.com/formatjs/formatjs/pull/6932
* fix(formatjs_cli): extract id-only messages by @longlho in https://github.com/formatjs/formatjs/pull/6962
* chore: release main by @longlho in https://github.com/formatjs/formatjs/pull/6955
* docs: add internationalization best practices by @longlho in https://github.com/formatjs/formatjs/pull/6972
* docs: add i18n best practices skill by @longlho in https://github.com/formatjs/formatjs/pull/6973
* feat(formatjs_icu_messageformat): add Rust message formatter by @longlho in https://github.com/formatjs/formatjs/pull/6974
* feat(formatjs_intl): add Rust intl runtime by @longlho in https://github.com/formatjs/formatjs/pull/6975
* chore: release main by @longlho in https://github.com/formatjs/formatjs/pull/6977
* Documented how to use ember-intl by @ijlee2 in https://github.com/formatjs/formatjs/pull/6946
* fix: support Rust 1.92 in new intl crates by @longlho in https://github.com/formatjs/formatjs/pull/6978
* chore: release main by @longlho in https://github.com/formatjs/formatjs/pull/6979
* fix: queue crate release workflows by @longlho in https://github.com/formatjs/formatjs/pull/6980
* docs: document Rust support by @longlho in https://github.com/formatjs/formatjs/pull/6981
* feat(formatjs_intl): add message fallbacks by @longlho in https://github.com/formatjs/formatjs/pull/6982
* feat(formatjs_intl): support precompiled catalogs by @longlho in https://github.com/formatjs/formatjs/pull/6985
* chore: release main by @longlho in https://github.com/formatjs/formatjs/pull/6984
* build: remove root npmrc by @longlho in https://github.com/formatjs/formatjs/pull/6988
* fix: skip unpublished Rust crates by @longlho in https://github.com/formatjs/formatjs/pull/6992
* fix: handle Cargo publish and merge options by @longlho in https://github.com/formatjs/formatjs/pull/6993
* fix(formatjs_cli): fail on input resolution errors by @longlho in https://github.com/formatjs/formatjs/pull/7005
* feat(formatjs_intl): add extractable format_message macro by @longlho in https://github.com/formatjs/formatjs/pull/7018
* chore: release main by @formatjsproject in https://github.com/formatjs/formatjs/pull/6997
* feat(formatjs_intl): accept inline named values by @longlho in https://github.com/formatjs/formatjs/pull/7031
* chore(deps): exclude Renovate from release notes by @longlho in https://github.com/formatjs/formatjs/pull/7030
* feat(eslint-plugin-formatjs): detect glued placeholders by @longlho in https://github.com/formatjs/formatjs/pull/7036
* docs: cover units and calendar names in i18n skill by @longlho in https://github.com/formatjs/formatjs/pull/7042
* chore: release main by @formatjsproject in https://github.com/formatjs/formatjs/pull/7037
* fix(@formatjs/cli-lib): use native extraction by @longlho in https://github.com/formatjs/formatjs/pull/7046
* fix: recover partial npm releases by @longlho in https://github.com/formatjs/formatjs/pull/7053
* chore: release main by @formatjsproject in https://github.com/formatjs/formatjs/pull/7047
* docs: sync i18n best practices skill and guide by @longlho in https://github.com/formatjs/formatjs/pull/7062
* feat: add localization review and translation skills by @longlho in https://github.com/formatjs/formatjs/pull/7065
* docs: add top-level skills section by @longlho in https://github.com/formatjs/formatjs/pull/7066
* refactor: replace Vike with static Vite docs by @longlho in https://github.com/formatjs/formatjs/pull/7068
* docs: add agent skills overview by @longlho in https://github.com/formatjs/formatjs/pull/7069
* docs: document native date range formatting by @longlho in https://github.com/formatjs/formatjs/pull/7070
* test: add local Codex skill evals by @longlho in https://github.com/formatjs/formatjs/pull/7071
* feat(eslint-plugin-formatjs): allow conditional ICU element blocklists by @longlho in https://github.com/formatjs/formatjs/pull/7073
* chore: release main by @formatjsproject in https://github.com/formatjs/formatjs/pull/7064
* test: use neutral brands in skill evals by @longlho in https://github.com/formatjs/formatjs/pull/7090
* feat(formatjs_cli): extract messages from Python by @longlho in https://github.com/formatjs/formatjs/pull/7097
* fix: tighten formatted value placeholder guidance by @longlho in https://github.com/formatjs/formatjs/pull/7099
* fix: retain binary-only Cargo release candidates by @longlho in https://github.com/formatjs/formatjs/pull/7102
* chore: release main by @formatjsproject in https://github.com/formatjs/formatjs/pull/7079
* fix: enable Git long paths for Windows release by @longlho in https://github.com/formatjs/formatjs/pull/7105
* build: cross-compile release artifacts on Linux by @longlho in https://github.com/formatjs/formatjs/pull/7106
* build: add Python native wheel scaffolding by @longlho in https://github.com/formatjs/formatjs/pull/7108
* build: migrate to bazel_lib by @longlho in https://github.com/formatjs/formatjs/pull/7109
* feat: add Python bindings for Rust intl packages by @longlho in https://github.com/formatjs/formatjs/pull/7111
* fix: configure Python Release Please strategy by @longlho in https://github.com/formatjs/formatjs/pull/7114
* fix: bootstrap Python package versions by @longlho in https://github.com/formatjs/formatjs/pull/7117
* build(deps): regenerate Bazel lockfile in Renovate updates by @longlho in https://github.com/formatjs/formatjs/pull/7119
* chore: release main by @formatjsproject in https://github.com/formatjs/formatjs/pull/7107
* build(deps): align Renovate Bazel lock command by @longlho in https://github.com/formatjs/formatjs/pull/7122
* build: cross-compile Python release wheels by @longlho in https://github.com/formatjs/formatjs/pull/7121
* fix: rename Python intl distribution by @longlho in https://github.com/formatjs/formatjs/pull/7123
* fix: validate released Python versions by @longlho in https://github.com/formatjs/formatjs/pull/7125
* feat(formatjs_cli): extract Python format_message calls by @longlho in https://github.com/formatjs/formatjs/pull/7129
* feat(formatjs_intl): align Python runtime fallback by @longlho in https://github.com/formatjs/formatjs/pull/7130
* chore: release main by @formatjsproject in https://github.com/formatjs/formatjs/pull/7133
* build(deps): update Bazel lockfiles for Renovate PRs by @longlho in https://github.com/formatjs/formatjs/pull/7135
* build(deps): publish dispatched Renovate check results by @longlho in https://github.com/formatjs/formatjs/pull/7136
* build(deps): publish Renovate required statuses by @longlho in https://github.com/formatjs/formatjs/pull/7137
* fix(eslint-plugin-formatjs): align message recognition across tools by @longlho in https://github.com/formatjs/formatjs/pull/7151
* fix(babel-plugin-formatjs): support transparent expression wrappers by @longlho in https://github.com/formatjs/formatjs/pull/7156
* chore: release main by @formatjsproject in https://github.com/formatjs/formatjs/pull/7138
* fix(formatjs_cli): extract messages from tagged template literals by @vpontis in https://github.com/formatjs/formatjs/pull/7182
* docs: track ECMA-402 draft polyfill audit by @longlho in https://github.com/formatjs/formatjs/pull/7185
* docs: link ECMA-402 audit fixes and validation by @longlho in https://github.com/formatjs/formatjs/pull/7200
* codex/ecma402 coercion by @longlho in https://github.com/formatjs/formatjs/pull/7186
* fix(@formatjs/intl-supportedvaluesof): coerce keys before lookup by @longlho in https://github.com/formatjs/formatjs/pull/7187
* fix(@formatjs/intl-listformat): follow the string iterator protocol by @longlho in https://github.com/formatjs/formatjs/pull/7189
* fix(deps): negotiate well-formed numbering system options by @longlho in https://github.com/formatjs/formatjs/pull/7190
* fix(@formatjs/intl-collator): validate collation and comparison inputs by @longlho in https://github.com/formatjs/formatjs/pull/7191
* fix(@formatjs/intl-datetimeformat): reject offsets containing seconds by @longlho in https://github.com/formatjs/formatjs/pull/7192
* fix(@formatjs/intl-displaynames): validate and canonicalize display codes by @longlho in https://github.com/formatjs/formatjs/pull/7193
* fix(@formatjs/intl-durationformat): validate duration records exactly by @longlho in https://github.com/formatjs/formatjs/pull/7194
* fix(@formatjs/intl-locale): canonicalize weekday and numeric options by @longlho in https://github.com/formatjs/formatjs/pull/7195
* fix(@formatjs/intl-locale): align week info with ECMA-402 by @longlho in https://github.com/formatjs/formatjs/pull/7196
* fix(@formatjs/intl-pluralrules): align draft options and ranges by @longlho in https://github.com/formatjs/formatjs/pull/7197
* fix(@formatjs/intl-segmenter): preserve iterator progress and locale by @longlho in https://github.com/formatjs/formatjs/pull/7198
* fix(@formatjs/intl-getcanonicallocales): follow locale-list coercion by @longlho in https://github.com/formatjs/formatjs/pull/7199
* fix(@formatjs/intl-numberformat): accept callable option objects by @longlho in https://github.com/formatjs/formatjs/pull/7201
* fix(@formatjs/intl-segmenter): reject coerced BigInt indices by @longlho in https://github.com/formatjs/formatjs/pull/7202
* test(@formatjs/intl-numberformat): enforce Test262 result accounting by @longlho in https://github.com/formatjs/formatjs/pull/7209
* test(@formatjs/intl-numberformat): cover complete current Test262 suites by @longlho in https://github.com/formatjs/formatjs/pull/7210
* fix(@formatjs/intl-numberformat): omit NaN sign with exceptZero by @longlho in https://github.com/formatjs/formatjs/pull/7212
* test: use generated Test262 harness rules by @longlho in https://github.com/formatjs/formatjs/pull/7216
* fix(@formatjs/intl-numberformat): reject undefined range endpoints by @longlho in https://github.com/formatjs/formatjs/pull/7226
* fix(@formatjs/intl-numberformat): preserve Symbol coercion errors by @longlho in https://github.com/formatjs/formatjs/pull/7227
* codex/test262 numberformat option validation by @longlho in https://github.com/formatjs/formatjs/pull/7228
* fix(@formatjs/intl-listformat): preserve language data when loading root locale by @longlho in https://github.com/formatjs/formatjs/pull/7229
* fix(@formatjs/intl-locale): enforce internal receiver branding by @longlho in https://github.com/formatjs/formatjs/pull/7231
* fix(@formatjs/intl-collator): match built-in function descriptors by @longlho in https://github.com/formatjs/formatjs/pull/7232
* fix(@formatjs/intl-numberformat): make built-in methods non-constructible by @longlho in https://github.com/formatjs/formatjs/pull/7233
* fix(@formatjs/intl-numberformat): account for significant precision in rounding magnitude by @longlho in https://github.com/formatjs/formatjs/pull/7234
* fix(@formatjs/intl-numberformat): validate internal receiver branding by @longlho in https://github.com/formatjs/formatjs/pull/7235
* fix(@formatjs/intl-datetimeformat): truncate fractional timestamps toward zero by @longlho in https://github.com/formatjs/formatjs/pull/7236
* fix(@formatjs/intl-datetimeformat): match built-in method metadata by @longlho in https://github.com/formatjs/formatjs/pull/7238
* test(deps): run Test262 with stable Temporal support by @longlho in https://github.com/formatjs/formatjs/pull/7240
* fix(@formatjs/intl-durationformat): match built-in metadata and option order by @longlho in https://github.com/formatjs/formatjs/pull/7241
* fix(@formatjs/intl-durationformat): display the duration sign once by @longlho in https://github.com/formatjs/formatjs/pull/7242
* fix(@formatjs/intl-durationformat): preserve exact numeric duration formatting by @longlho in https://github.com/formatjs/formatjs/pull/7243
* fix(@formatjs/intl-durationformat): propagate numeric unit styles by @longlho in https://github.com/formatjs/formatjs/pull/7244
* fix(@formatjs/intl-durationformat): retain zero minutes between numeric fields by @longlho in https://github.com/formatjs/formatjs/pull/7245
* fix(@formatjs/intl-localematcher): preserve supported requested locale tags by @longlho in https://github.com/formatjs/formatjs/pull/7247
* fix(@formatjs/intl-supportedvaluesof): make the built-in non-constructible by @longlho in https://github.com/formatjs/formatjs/pull/7248
* fix(@formatjs/intl-numberformat): preserve resolved option property order by @longlho in https://github.com/formatjs/formatjs/pull/7249
* fix(@formatjs/intl-relativetimeformat): isolate internal formatter options by @longlho in https://github.com/formatjs/formatjs/pull/7250
* fix(@formatjs/intl-localematcher): isolate locale resolution records by @longlho in https://github.com/formatjs/formatjs/pull/7251
* fix(@formatjs/intl-locale): use standard locale tag coercion by @longlho in https://github.com/formatjs/formatjs/pull/7252
* fix(@formatjs/intl-locale): support the variants constructor option by @longlho in https://github.com/formatjs/formatjs/pull/7253
* fix(@formatjs/intl-locale): canonicalize before applying locale overrides by @longlho in https://github.com/formatjs/formatjs/pull/7254
* fix(@formatjs/intl-locale): minimize maximized locale components by @longlho in https://github.com/formatjs/formatjs/pull/7255
* feat(@formatjs/editor): add headless React 19 editor with StyleX UI by @longlho in https://github.com/formatjs/formatjs/pull/7223
* fix(@formatjs/intl-locale): honor region preference priority by @longlho in https://github.com/formatjs/formatjs/pull/7257
* fix(@formatjs/intl-locale): expose canonical option values by @longlho in https://github.com/formatjs/formatjs/pull/7258
* fix(@formatjs/intl-locale): follow likely-subtag lookup order by @longlho in https://github.com/formatjs/formatjs/pull/7259
* fix(@formatjs/intl-durationformat): resolve supported numbering systems by @longlho in https://github.com/formatjs/formatjs/pull/7260
* fix(@formatjs/intl-durationformat): accept Temporal duration inputs by @longlho in https://github.com/formatjs/formatjs/pull/7261
* fix(@formatjs/intl-displaynames): accept extended language subtags by @longlho in https://github.com/formatjs/formatjs/pull/7262
* fix(@formatjs/intl-supportedvaluesof): include fixed-offset time zones by @longlho in https://github.com/formatjs/formatjs/pull/7263
* fix(@formatjs/intl-collator): preserve locale punctuation defaults by @longlho in https://github.com/formatjs/formatjs/pull/7264
* fix(@formatjs/intl-collator): exclude root from locale negotiation by @longlho in https://github.com/formatjs/formatjs/pull/7265
* fix(@formatjs/intl-localematcher): respect Unicode extension boundaries by @longlho in https://github.com/formatjs/formatjs/pull/7266
* fix(@formatjs/intl-collator): resolve canonical collation types by @longlho in https://github.com/formatjs/formatjs/pull/7267
* fix(@formatjs/intl-collator): select search collation tailoring by @longlho in https://github.com/formatjs/formatjs/pull/7268
* feat(@formatjs/editor): add headless translation workflow by @pgonsolin in https://github.com/formatjs/formatjs/pull/7157
* fix(@formatjs/intl-supportedvaluesof): probe locale-specific collations by @longlho in https://github.com/formatjs/formatjs/pull/7269
* fix(@formatjs/intl-datetimeformat): handle exact date range boundaries by @longlho in https://github.com/formatjs/formatjs/pull/7270
* fix(@formatjs/intl-datetimeformat): validate receiver internal slots by @longlho in https://github.com/formatjs/formatjs/pull/7271
* fix(@formatjs/intl-datetimeformat): align option property metadata by @longlho in https://github.com/formatjs/formatjs/pull/7272
* fix(@formatjs/intl-datetimeformat): format year zero in the BC era by @longlho in https://github.com/formatjs/formatjs/pull/7273
* fix(@formatjs/intl-datetimeformat): normalize timezone inputs by @longlho in https://github.com/formatjs/formatjs/pull/7274
* fix(@formatjs/intl-datetimeformat): isolate option records by @longlho in https://github.com/formatjs/formatjs/pull/7275
* fix(@formatjs/intl-datetimeformat): support all hour-cycle options by @longlho in https://github.com/formatjs/formatjs/pull/7276
* fix(@formatjs/intl-datetimeformat): select independent hour12 preferences by @longlho in https://github.com/formatjs/formatjs/pull/7277
* fix(@formatjs/intl-getcanonicallocales): canonicalize locale extensions by @longlho in https://github.com/formatjs/formatjs/pull/7278
* fix(@formatjs/intl-getcanonicallocales): resolve subdivision aliases by @longlho in https://github.com/formatjs/formatjs/pull/7279
* fix(@formatjs/intl-getcanonicallocales): apply compound language aliases by @longlho in https://github.com/formatjs/formatjs/pull/7280
* fix(@formatjs/intl-getcanonicallocales): append list elements directly by @longlho in https://github.com/formatjs/formatjs/pull/7281
* codex/editor es2016 compatibility by @longlho in https://github.com/formatjs/formatjs/pull/7286
* test(deps): cover combined polyfill installation by @longlho in https://github.com/formatjs/formatjs/pull/7282
* test(deps): load required Test262 locale fixtures by @longlho in https://github.com/formatjs/formatjs/pull/7284
* fix(@formatjs/intl-getcanonicallocales): preserve RegExp statics by @longlho in https://github.com/formatjs/formatjs/pull/7287
* fix(@formatjs/intl-displaynames): use canonical calendar data keys by @longlho in https://github.com/formatjs/formatjs/pull/7288
* fix(@formatjs/intl-numberformat): isolate internal plural options by @longlho in https://github.com/formatjs/formatjs/pull/7290
* fix(@formatjs/intl-numberformat): honor locale grouping minimums by @longlho in https://github.com/formatjs/formatjs/pull/7291
* fix(@formatjs/intl-datetimeformat): reuse parsed pattern fields by @longlho in https://github.com/formatjs/formatjs/pull/7292
* fix(@formatjs/intl-datetimeformat): match hourless time requests by @longlho in https://github.com/formatjs/formatjs/pull/7293
* fix(@formatjs/intl-datetimeformat): support ISO calendar negotiation by @longlho in https://github.com/formatjs/formatjs/pull/7294
* fix(@formatjs/intl-pluralrules): generate compact exponent data by @longlho in https://github.com/formatjs/formatjs/pull/7295
* fix(formatjs_cli): preserve IDs for empty descriptions by @longlho in https://github.com/formatjs/formatjs/pull/7296
* fix(@formatjs/intl-datetimeformat): compare ranges at displayed precision by @longlho in https://github.com/formatjs/formatjs/pull/7297
* fix(@formatjs/intl-datetimeformat): format flexible day periods by @longlho in https://github.com/formatjs/formatjs/pull/7298
* fix(deps): preserve polyfill locale data during registration by @longlho in https://github.com/formatjs/formatjs/pull/7299
* fix(@formatjs/intl-segmenter): register CLDR locale coverage by @longlho in https://github.com/formatjs/formatjs/pull/7300
* fix(@formatjs/intl-numberformat): preserve range separators and affixes by @longlho in https://github.com/formatjs/formatjs/pull/7301
* fix(@formatjs/intl-numberformat): place approximate signs in locale patterns by @longlho in https://github.com/formatjs/formatjs/pull/7302
* fix(@formatjs/intl-numberformat): share signs with range unit suffixes by @longlho in https://github.com/formatjs/formatjs/pull/7303
* fix(@formatjs/intl-numberformat): repair benchmark entrypoints by @longlho in https://github.com/formatjs/formatjs/pull/7304
* fix(@formatjs/intl-numberformat): preserve supplementary digits when grouping by @longlho in https://github.com/formatjs/formatjs/pull/7305
* fix(@formatjs/intl-numberformat): generate complete CLDR digit mappings by @longlho in https://github.com/formatjs/formatjs/pull/7306
* feat(@formatjs/editor): publish headless editor package by @longlho in https://github.com/formatjs/formatjs/pull/7285
* fix(deps): consolidate polyfill conformance and performance fixes by @longlho in https://github.com/formatjs/formatjs/pull/7320
* fix(@formatjs/editor): bootstrap the headless editor release by @longlho in https://github.com/formatjs/formatjs/pull/7321

## New Contributors
* @moduvoice made their first contribution in https://github.com/formatjs/formatjs/pull/6858
* @eoinest made their first contribution in https://github.com/formatjs/formatjs/pull/6908
* @ijlee2 made their first contribution in https://github.com/formatjs/formatjs/pull/6946
* @formatjsproject made their first contribution in https://github.com/formatjs/formatjs/pull/6997
* @pgonsolin made their first contribution in https://github.com/formatjs/formatjs/pull/7157

**Full Changelog**: https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@3.2.11...@formatjs/intl-getcanonicallocales@3.2.12

## 3.2.11 (2026-07-11)

## What's Changed
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
* chore: release main by @longlho in https://github.com/formatjs/formatjs/pull/6839
* fix(@formatjs/icu-skeleton-parser): map e/c weekday counts 4/5/6 to long/narrow/short by @spokodev in https://github.com/formatjs/formatjs/pull/6852
* fix(deps): materialize published package manifests by @longlho in https://github.com/formatjs/formatjs/pull/6844
* feat(@formatjs/intl-datetimeformat): update IANA timezone database to 2026c by @longlho in https://github.com/formatjs/formatjs/pull/6854
* build(@formatjs/intl-datetimeformat): make tzdata generation hermetic by @longlho in https://github.com/formatjs/formatjs/pull/6855
* fix(deps): update package manifests in release PRs by @longlho in https://github.com/formatjs/formatjs/pull/6856
* docs: update upgrade guide to reflect relaxed React 18 support by @yslpn in https://github.com/formatjs/formatjs/pull/6818

## New Contributors
* @Amund211 made their first contribution in https://github.com/formatjs/formatjs/pull/6802
* @greymoth-jp made their first contribution in https://github.com/formatjs/formatjs/pull/6835
* @spokodev made their first contribution in https://github.com/formatjs/formatjs/pull/6837
* @yslpn made their first contribution in https://github.com/formatjs/formatjs/pull/6818

**Full Changelog**: https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@3.2.10...@formatjs/intl-getcanonicallocales@3.2.11

## 3.2.10 (2026-06-03)

## What's Changed
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


**Full Changelog**: https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@3.2.9...@formatjs/intl-getcanonicallocales@3.2.10

## [3.2.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@3.2.8...@formatjs/intl-getcanonicallocales@3.2.9) (2026-05-19)

### Bug Fixes

* harden polyfill installation ([#6579](https://github.com/formatjs/formatjs/issues/6579)) ([a84e2f3](https://github.com/formatjs/formatjs/commit/a84e2f3f9f2872c5d0340b2781db703ba6393e03)) - by @longlho

## [3.2.8](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@3.2.7...@formatjs/intl-getcanonicallocales@3.2.8) (2026-05-15)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [3.2.7](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@3.2.6...@formatjs/intl-getcanonicallocales@3.2.7) (2026-05-12)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [3.2.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@3.2.5...@formatjs/intl-getcanonicallocales@3.2.6) (2026-05-05)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [3.2.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@3.2.4...@formatjs/intl-getcanonicallocales@3.2.5) (2026-04-29)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [3.2.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@3.2.3...@formatjs/intl-getcanonicallocales@3.2.4) (2026-04-24)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [3.2.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@3.2.2...@formatjs/intl-getcanonicallocales@3.2.3) (2026-04-13)

### Reverts

* **deps:** revert gazelle migration phases 1-3 ([#6205](https://github.com/formatjs/formatjs/issues/6205)) ([4c04aa2](https://github.com/formatjs/formatjs/commit/4c04aa2726107ab1d0b9dab8a54a82fa62a73680)), closes [#6197](https://github.com/formatjs/formatjs/issues/6197) [#6198](https://github.com/formatjs/formatjs/issues/6198) [#6199](https://github.com/formatjs/formatjs/issues/6199) [#6195](https://github.com/formatjs/formatjs/issues/6195) [#6196](https://github.com/formatjs/formatjs/issues/6196) - by @longlho

## [3.2.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@3.2.1...@formatjs/intl-getcanonicallocales@3.2.2) (2026-03-16)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [3.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@3.2.0...@formatjs/intl-getcanonicallocales@3.2.1) (2026-02-01)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

# [3.2.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@3.1.2...@formatjs/intl-getcanonicallocales@3.2.0) (2026-01-15)

### Features

* **@formatjs/intl-getcanonicallocales:** update to latest spec, handle arraylike objs ([#5903](https://github.com/formatjs/formatjs/issues/5903)) ([1de20a0](https://github.com/formatjs/formatjs/commit/1de20a0600a2273805f425f4312052b3b1e5ae4d)) - by @longlho
* **@formatjs/intl-locale:** support variants per latest spec ([#5904](https://github.com/formatjs/formatjs/issues/5904)) ([931c3dc](https://github.com/formatjs/formatjs/commit/931c3dc98484887ef7b1dafbd9ba2780e155f6e5)), closes [#960](https://github.com/formatjs/formatjs/issues/960) - by @longlho
* **@formatjs/intl-segmenter:** improve Unicode 17.0 Format/Extend transparency and upgrade deps ([#5862](https://github.com/formatjs/formatjs/issues/5862)) ([effeb9c](https://github.com/formatjs/formatjs/commit/effeb9cd9d26f8c43c1e3df64a84c42dc7b12043)), closes [#29](https://github.com/formatjs/formatjs/issues/29) - by @longlho

## [3.1.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@3.1.1...@formatjs/intl-getcanonicallocales@3.1.2) (2026-01-06)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [3.1.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@3.1.0...@formatjs/intl-getcanonicallocales@3.1.1) (2026-01-02)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

# [3.1.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@3.0.4...@formatjs/intl-getcanonicallocales@3.1.0) (2025-12-26)

### Features

* upgrade cldr to v48 ([#5678](https://github.com/formatjs/formatjs/issues/5678)) ([54ef319](https://github.com/formatjs/formatjs/commit/54ef31940172467889be64907e9fbbf567ea3f4b)) - by @longlho

## [3.0.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@3.0.3...@formatjs/intl-getcanonicallocales@3.0.4) (2025-12-23)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [3.0.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@3.0.2...@formatjs/intl-getcanonicallocales@3.0.3) (2025-12-19)

### Bug Fixes

* **@formatjs/utils:** fix json ESM import ([#5594](https://github.com/formatjs/formatjs/issues/5594)) ([dfd79a2](https://github.com/formatjs/formatjs/commit/dfd79a2d9935e0b7d06c08555ff6625d3f1c884f)) - by @longlho

## [3.0.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@3.0.1...@formatjs/intl-getcanonicallocales@3.0.2) (2025-12-17)

### Bug Fixes

* **@formatjs/cli-lib:** fix fs-extra imports, fix [#5569](https://github.com/formatjs/formatjs/issues/5569) ([76c8793](https://github.com/formatjs/formatjs/commit/76c8793bf8a0744ad9a7c64ab3adbe5c1434898f)) - by @longlho

## [3.0.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@3.0.0...@formatjs/intl-getcanonicallocales@3.0.1) (2025-12-15)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [3.0.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@2.5.6...@formatjs/intl-getcanonicallocales@3.0.0) (2025-12-15)

### ⚠ BREAKING CHANGES

* **@formatjs/intl-getcanonicallocales:** convert to esm (#5457)

### Features

* **@formatjs/intl-getcanonicallocales:** convert to esm ([#5457](https://github.com/formatjs/formatjs/issues/5457)) ([e1a6d19](https://github.com/formatjs/formatjs/commit/e1a6d196404a25c67eba3bc149b9d5162715f0db)) - by @longlho

## [2.5.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@2.5.5...@formatjs/intl-getcanonicallocales@2.5.6) (2025-10-03)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [2.5.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@2.5.4...@formatjs/intl-getcanonicallocales@2.5.5) (2025-03-23)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [2.5.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@2.5.3...@formatjs/intl-getcanonicallocales@2.5.4) (2024-12-09)

### Bug Fixes

* turn on isolatedDeclarations and specify explicit types everywhere ([4d855c2](https://github.com/formatjs/formatjs/commit/4d855c2324426633eb84c346c76a5fd1ac854780)) - by @longlho

## [2.5.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@2.5.2...@formatjs/intl-getcanonicallocales@2.5.3) (2024-11-18)

### Bug Fixes

* **@formatjs/intl-localematcher:** update impl to latest spec ([1258dac](https://github.com/formatjs/formatjs/commit/1258dacb0e8c70f9c84517bc1aba4814a8b4ff83)) - by @longlho

## [2.5.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@2.5.1...@formatjs/intl-getcanonicallocales@2.5.2) (2024-11-02)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [2.5.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@2.5.0...@formatjs/intl-getcanonicallocales@2.5.1) (2024-10-25)

### Bug Fixes

* relax tslib req to 2 instead of 2.7 ([930c3e8](https://github.com/formatjs/formatjs/commit/930c3e8ddcc160fde7466449575455f135f78ca6)) - by @longlho

# [2.5.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@2.4.0...@formatjs/intl-getcanonicallocales@2.5.0) (2024-10-25)

### Features

* upgrade cldr to v46 ([daafb44](https://github.com/formatjs/formatjs/commit/daafb449ba2fc4553f5a484b969affa1529752db)) - by @longlho

# [2.4.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@2.3.1...@formatjs/intl-getcanonicallocales@2.4.0) (2024-10-21)

### Features

* upgrade cldr to v45 ([#4620](https://github.com/formatjs/formatjs/issues/4620)) ([fbb2bbf](https://github.com/formatjs/formatjs/commit/fbb2bbf6e038d5833c1f2752b805002436480948)) - by @longlho

## [2.3.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@2.3.0...@formatjs/intl-getcanonicallocales@2.3.1) (2024-10-12)

### Bug Fixes

* **@formatjs/intl-durationformat:** add polyfill detector + docs ([d6d237a](https://github.com/formatjs/formatjs/commit/d6d237a2ffca73d5e3824df17bf5ebf7e7b135a8)) - by @

# [2.3.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@2.2.1...@formatjs/intl-getcanonicallocales@2.3.0) (2023-10-16)

### Features

* **@formatjs/intl-getcanonicallocales:** update CLDR to v43 ([ad0226f](https://github.com/formatjs/formatjs/commit/ad0226f2d839d1c9e60c8448a733dd213f3d0f67))

## [2.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@2.2.0...@formatjs/intl-getcanonicallocales@2.2.1) (2023-06-06)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

# [2.2.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@2.1.0...@formatjs/intl-getcanonicallocales@2.2.0) (2023-05-01)

### Features

* **@formatjs/intl-datetimeformat:** updated `tzdata` to `2023c` and fixed missing and changed TimeZone ([1b4856b](https://github.com/formatjs/formatjs/commit/1b4856b11c32c6ac99aa8795ee487c92b4d9d9c9))

# [2.1.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@2.0.5...@formatjs/intl-getcanonicallocales@2.1.0) (2023-02-20)

### Features

* **@formatjs/intl-getcanonicallocales:** expose polyfill-force variant ([#3997](https://github.com/formatjs/formatjs/issues/3997)) ([d513ce6](https://github.com/formatjs/formatjs/commit/d513ce6d662d4dda7fd00a02090b43b27af024f1))

## [2.0.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@2.0.4...@formatjs/intl-getcanonicallocales@2.0.5) (2022-12-02)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [2.0.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@2.0.3...@formatjs/intl-getcanonicallocales@2.0.4) (2022-08-21)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [2.0.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@2.0.2...@formatjs/intl-getcanonicallocales@2.0.3) (2022-08-18)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [2.0.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@2.0.1...@formatjs/intl-getcanonicallocales@2.0.2) (2022-06-06)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [2.0.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@2.0.0...@formatjs/intl-getcanonicallocales@2.0.1) (2022-05-19)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

# [2.0.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.9.2...@formatjs/intl-getcanonicallocales@2.0.0) (2022-05-19)

### Bug Fixes

* **react-intl:** fix type issue with react18, fix [#3550](https://github.com/formatjs/formatjs/issues/3550) ([2567b93](https://github.com/formatjs/formatjs/commit/2567b932c5d18b097a43842563046c20ce0c49f1))

### Features

* **@formatjs/cli:** package CLI into a single file ([1760787](https://github.com/formatjs/formatjs/commit/176078792894d18b0af72ce1f413f25835f7eb44)), closes [#3547](https://github.com/formatjs/formatjs/issues/3547)

### BREAKING CHANGES

* **@formatjs/cli:** we push @vue/compiler-core out to `peerDependencies` so if u use vue u should pull this in manuallywip on packaging cli.

## [1.9.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.9.1...@formatjs/intl-getcanonicallocales@1.9.2) (2022-03-26)

### Bug Fixes

* **@formatjs/intl-getcanonicallocales:** rm @types/node dep, fix [#3474](https://github.com/formatjs/formatjs/issues/3474) ([587e0f1](https://github.com/formatjs/formatjs/commit/587e0f1a5563a9ba0effceb2801fb11e0061be11))

## [1.9.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.9.0...@formatjs/intl-getcanonicallocales@1.9.1) (2022-03-13)

### Bug Fixes

* **@formatjs/intl-getcanonicallocales:** add peerDependenciesMeta field ([#3415](https://github.com/formatjs/formatjs/issues/3415)) ([d5a7b90](https://github.com/formatjs/formatjs/commit/d5a7b900f806f0ca51007ca86a13a42918db3a1c))

# [1.9.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.8.0...@formatjs/intl-getcanonicallocales@1.9.0) (2022-01-09)

### Features

* **@formatjs/intl-getcanonicallocales:** upgrade cldr to v40 ([70f61fc](https://github.com/formatjs/formatjs/commit/70f61fcf5e64b4aa6a34eeae7bdb8af05527ef34))

# [1.8.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.7.3...@formatjs/intl-getcanonicallocales@1.8.0) (2021-10-22)

### Features

* **@formatjs/intl-getcanonicallocales:** upgrade to TS 4.4 ([8b9b381](https://github.com/formatjs/formatjs/commit/8b9b38121f42d35edb189d94fef4a4f03da0871a))

## [1.7.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.7.2...@formatjs/intl-getcanonicallocales@1.7.3) (2021-08-15)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [1.7.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.7.1...@formatjs/intl-getcanonicallocales@1.7.2) (2021-08-06)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [1.7.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.7.0...@formatjs/intl-getcanonicallocales@1.7.1) (2021-06-26)

### Bug Fixes

* **@formatjs/intl-getcanonicallocales:** rm json import to be more ESM-friendly, fix [#2961](https://github.com/formatjs/formatjs/issues/2961) ([9d491e2](https://github.com/formatjs/formatjs/commit/9d491e2b0ac4ae50cda39a0c59b991c9c663d565))

# [1.7.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.6.0...@formatjs/intl-getcanonicallocales@1.7.0) (2021-05-20)

### Features

* **@formatjs/ecma-376:** new package that generate ecma-376 numFmt pattern ([2a57d16](https://github.com/formatjs/formatjs/commit/2a57d1676f8fc840915b2750a5469934dfd765e8)), closes [#2885](https://github.com/formatjs/formatjs/issues/2885)

# [1.6.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.5.11...@formatjs/intl-getcanonicallocales@1.6.0) (2021-05-17)

### Features

* **@formatjs/intl-getcanonicallocales:** upgrade unicode to v39 ([ee3a069](https://github.com/formatjs/formatjs/commit/ee3a0694bb9e5418cbd04664016b47fc5b0e079c))

## [1.5.11](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.5.10...@formatjs/intl-getcanonicallocales@1.5.11) (2021-05-14)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [1.5.10](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.5.9...@formatjs/intl-getcanonicallocales@1.5.10) (2021-05-10)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [1.5.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.5.8...@formatjs/intl-getcanonicallocales@1.5.9) (2021-04-12)

### Bug Fixes

* **@formatjs/intl-getcanonicallocales:** check for chunks length before regex, [#2813](https://github.com/formatjs/formatjs/issues/2813) ([89b40b9](https://github.com/formatjs/formatjs/commit/89b40b9aa0c9c2a64ab14a596404d91bf93d6cac))

## [1.5.8](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.5.7...@formatjs/intl-getcanonicallocales@1.5.8) (2021-03-26)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [1.5.7](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.5.6...@formatjs/intl-getcanonicallocales@1.5.7) (2021-03-15)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [1.5.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.5.5...@formatjs/intl-getcanonicallocales@1.5.6) (2021-03-01)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [1.5.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.5.4...@formatjs/intl-getcanonicallocales@1.5.5) (2021-02-25)

### Bug Fixes

* bump tslib version dep ([37577d2](https://github.com/formatjs/formatjs/commit/37577d22bf28d23de1d8013ba0047cf221ad8840)), closes [#2645](https://github.com/formatjs/formatjs/issues/2645)

## [1.5.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.5.3...@formatjs/intl-getcanonicallocales@1.5.4) (2021-02-25)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [1.5.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.5.2...@formatjs/intl-getcanonicallocales@1.5.3) (2020-12-16)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [1.5.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.5.1...@formatjs/intl-getcanonicallocales@1.5.2) (2020-11-26)

### Bug Fixes

* **@formatjs/intl-getcanonicallocales:** fix import path for polyfills ([#2348](https://github.com/formatjs/formatjs/issues/2348)) ([c704cf5](https://github.com/formatjs/formatjs/commit/c704cf5561c659ab1552c1c0efd76616c822da6f))

## [1.5.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.5.0...@formatjs/intl-getcanonicallocales@1.5.1) (2020-10-26)

### Bug Fixes

* **@formatjs/intl-getcanonicallocales:** fix UMD bundle ([c0362f5](https://github.com/formatjs/formatjs/commit/c0362f5243e663d1ac4efb011e8b4919d9dec1c1))

# [1.5.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.4.6...@formatjs/intl-getcanonicallocales@1.5.0) (2020-10-25)

### Features

* **@formatjs/intl-getcanonicallocales:** upgrade cldr to v37 ([53540af](https://github.com/formatjs/formatjs/commit/53540af06ef06e639443223170adf4cab7e308e0))

## [1.4.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.4.5...@formatjs/intl-getcanonicallocales@1.4.6) (2020-10-01)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [1.4.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.4.4...@formatjs/intl-getcanonicallocales@1.4.5) (2020-09-18)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [1.4.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.4.3...@formatjs/intl-getcanonicallocales@1.4.4) (2020-09-09)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [1.4.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.4.2...@formatjs/intl-getcanonicallocales@1.4.3) (2020-08-25)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [1.4.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.4.1...@formatjs/intl-getcanonicallocales@1.4.2) (2020-08-21)

### Bug Fixes

* add back polyfill.umd, fix [#2013](https://github.com/formatjs/formatjs/issues/2013) ([b9cfbd2](https://github.com/formatjs/formatjs/commit/b9cfbd2eeead6a5165b0e4cbf1ef3edbfbeca8ce))

## [1.4.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.4.0...@formatjs/intl-getcanonicallocales@1.4.1) (2020-08-19)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

# [1.4.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.3.2...@formatjs/intl-getcanonicallocales@1.4.0) (2020-08-18)

### Features

* **@formatjs/intl-getcanonicallocales:** expose shouldPolyfill to detect if platform needs our polyfill ([ba0aac6](https://github.com/formatjs/formatjs/commit/ba0aac6dda7053a5b4ffb8f6502dd8c1688cbc8f))

## [1.3.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.3.1...@formatjs/intl-getcanonicallocales@1.3.2) (2020-08-14)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [1.3.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.3.0...@formatjs/intl-getcanonicallocales@1.3.1) (2020-07-24)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

# [1.3.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.2.10...@formatjs/intl-getcanonicallocales@1.3.0) (2020-07-14)

### Features

* publish ([b6e3465](https://github.com/formatjs/formatjs/commit/b6e3465ac95b3fa481f3c89f077a66ac004f7c27))

## [1.2.11](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.2.10...@formatjs/intl-getcanonicallocales@1.2.11) (2020-07-09)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [1.2.10](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.2.8...@formatjs/intl-getcanonicallocales@1.2.10) (2020-07-03)

### Bug Fixes

* **@formatjs/intl-getcanonicallocales:** re-publish ([1528d6d](https://github.com/formatjs/formatjs/commit/1528d6d1326ca993f8df1a3e63817e2ed25ba219))

## [1.2.8](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.2.7...@formatjs/intl-getcanonicallocales@1.2.8) (2020-07-03)

### Bug Fixes

* add locale-data to package.json files ([52a1481](https://github.com/formatjs/formatjs/commit/52a148196585bf8b33b27b9b948d6333f49072e8))

## [1.2.7](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.2.6...@formatjs/intl-getcanonicallocales@1.2.7) (2020-07-01)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [1.2.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.2.5...@formatjs/intl-getcanonicallocales@1.2.6) (2020-06-06)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [1.2.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.2.4...@formatjs/intl-getcanonicallocales@1.2.5) (2020-06-06)

### Bug Fixes

* **@formatjs/intl-getcanonicallocales:** handle non-existent Intl object ([b488ee8](https://github.com/formatjs/formatjs/commit/b488ee88b8ccab854b738ba4ad9c3947058121a1))

## [1.2.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.2.3...@formatjs/intl-getcanonicallocales@1.2.4) (2020-05-28)

### Bug Fixes

* **@formatjs/intl-utils:** Add missing cldr-core to package.json dep ([d0b72fe](https://github.com/formatjs/formatjs/commit/d0b72fe398c7017d03e8ee66c98ad88fe3e47657))

## [1.2.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.2.2...@formatjs/intl-getcanonicallocales@1.2.3) (2020-05-27)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

## [1.2.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.2.1...@formatjs/intl-getcanonicallocales@1.2.2) (2020-05-25)

### Bug Fixes

* **@formatjs/intl-getcanonicallocales:** fix alias lookup algo ([b39e3c2](https://github.com/formatjs/formatjs/commit/b39e3c2b1baefc011825f8e443769c2095beeb12))
* **@formatjs/intl-getcanonicallocales:** fix region casing ([396dbe7](https://github.com/formatjs/formatjs/commit/396dbe769bef6eb82ae274ba4935e70e076b2854))
* **@formatjs/intl-getcanonicallocales:** Handle aliases properly ([9e19e4b](https://github.com/formatjs/formatjs/commit/9e19e4b769560f3717f9589ab6180e932aaf96f8))
* **@formatjs/intl-getcanonicallocales:** set the polyfill if native impl is buggy ([555a28b](https://github.com/formatjs/formatjs/commit/555a28b2d6d3c48f69d765c5090f7880ef603adc))
* **@formatjs/intl-locale:** fix add/remove likely subtags ([d72f952](https://github.com/formatjs/formatjs/commit/d72f952a66905a3a7edd75518ccaa72c2020273e))

## [1.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.2.0...@formatjs/intl-getcanonicallocales@1.2.1) (2020-05-23)

**Note:** Version bump only for package @formatjs/intl-getcanonicallocales

# [1.2.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.1.1...@formatjs/intl-getcanonicallocales@1.2.0) (2020-05-23)

### Bug Fixes

* **@formatjs/intl-getcanonicallocales:** fix type def path in ([5df9a0b](https://github.com/formatjs/formatjs/commit/5df9a0b21e6b932835967c1d90a8cacab3d86892))

### Features

* **@formatjs/intl-getcanonicallocales:** Expose more functions to ([6fd12ec](https://github.com/formatjs/formatjs/commit/6fd12ec23b9857a92365584497d462cbac2b81f4))

## [1.1.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-getcanonicallocales@1.1.0...@formatjs/intl-getcanonicallocales@1.1.1) (2020-05-22)

### Bug Fixes

* **eslint-plugin-formatjs:** add no-id to index ([8e5c0af](https://github.com/formatjs/formatjs/commit/8e5c0afe69944d52653b92c2f08e15363246834a))

# 1.1.0 (2020-05-22)

### Features

* **@formatjs/intl-getcanonicallocales:** initial commit ([daba5a4](https://github.com/formatjs/formatjs/commit/daba5a4944bbab29573d02f626606262a035901d))

## [1.1.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-locale@1.1.0...@formatjs/intl-locale@1.1.1) (2020-05-21)

**Note:** Version bump only for package @formatjs/intl-locale

# [1.1.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-locale@0.1.0...@formatjs/intl-locale@1.1.0) (2020-05-20)

### Bug Fixes

* **@formatjs/intl-locale:** fix according to https://github.com/tc39/test262/issues/2628 ([1006ed2](https://github.com/formatjs/formatjs/commit/1006ed248837930ffb951d8936feec9878231c71))
* **@formatjs/intl-locale:** fix and docs ([5c5ef76](https://github.com/formatjs/formatjs/commit/5c5ef7657dd939bc08a9233f25cbae7a662c439f))
* **@formatjs/intl-locale:** fix minimize ([5ee8909](https://github.com/formatjs/formatjs/commit/5ee890910bd7260e0d549a2dd89f8e39dcbdfc60))
* **@formatjs/intl-locale:** fix minimize ([2c21dcb](https://github.com/formatjs/formatjs/commit/2c21dcb97043902c5ce7de643b20138333125693))
* **@formatjs/intl-locale:** more fixes ([1bbd03d](https://github.com/formatjs/formatjs/commit/1bbd03d46905e869c3f69e79c647b64d20d3403f))
* **@formatjs/intl-locale:** split out likelySubtags data ([ed34904](https://github.com/formatjs/formatjs/commit/ed3490496dc793ebbad6446d1d304d2cb2e23fd1))

### Features

* **@formatjs/intl-locale:** make it public ([c377a28](https://github.com/formatjs/formatjs/commit/c377a2899b74800422221453ecd7d7f477810995))
* **@formatjs/intl-locale:** Use a much smaller handwritten parser ([c210cbf](https://github.com/formatjs/formatjs/commit/c210cbff1b88245a3e041b14edaaf2f5aefca3bd))

# 0.1.0 (2020-05-18)

### Bug Fixes

* **react-intl:** reduce onError chattiness ([42d0ac4](https://github.com/formatjs/formatjs/commit/42d0ac433d4d31629bd2aadb2dafb49775d01aac))

### Features

* **@formatjs/intl-locale:** initial commit ([f469e81](https://github.com/formatjs/formatjs/commit/f469e812a052318c8ec0816abc86035256e4fe11))

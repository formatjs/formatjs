# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 2.3.10 (2026-09-10)

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

**Full Changelog**: https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@2.3.9...@formatjs/intl-supportedvaluesof@2.3.10

## 2.3.9 (2026-07-11)

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

**Full Changelog**: https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@2.3.8...@formatjs/intl-supportedvaluesof@2.3.9


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/fast-memoize bumped to 3.1.7

## 2.3.8 (2026-06-03)

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


**Full Changelog**: https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@2.3.7...@formatjs/intl-supportedvaluesof@2.3.8


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/fast-memoize bumped to 3.1.6

## [2.3.7](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@2.3.6...@formatjs/intl-supportedvaluesof@2.3.7) (2026-05-19)

### Bug Fixes

* harden polyfill installation ([#6579](https://github.com/formatjs/formatjs/issues/6579)) ([a84e2f3](https://github.com/formatjs/formatjs/commit/a84e2f3f9f2872c5d0340b2781db703ba6393e03)) - by @longlho

## [2.3.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@2.3.5...@formatjs/intl-supportedvaluesof@2.3.6) (2026-05-15)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [2.3.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@2.3.4...@formatjs/intl-supportedvaluesof@2.3.5) (2026-05-12)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [2.3.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@2.3.3...@formatjs/intl-supportedvaluesof@2.3.4) (2026-05-05)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [2.3.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@2.3.2...@formatjs/intl-supportedvaluesof@2.3.3) (2026-04-29)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [2.3.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@2.3.1...@formatjs/intl-supportedvaluesof@2.3.2) (2026-04-24)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [2.3.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@2.3.0...@formatjs/intl-supportedvaluesof@2.3.1) (2026-04-13)

### Reverts

* **deps:** revert gazelle migration phases 1-3 ([#6205](https://github.com/formatjs/formatjs/issues/6205)) ([4c04aa2](https://github.com/formatjs/formatjs/commit/4c04aa2726107ab1d0b9dab8a54a82fa62a73680)), closes [#6197](https://github.com/formatjs/formatjs/issues/6197) [#6198](https://github.com/formatjs/formatjs/issues/6198) [#6199](https://github.com/formatjs/formatjs/issues/6199) [#6195](https://github.com/formatjs/formatjs/issues/6195) [#6196](https://github.com/formatjs/formatjs/issues/6196) - by @longlho

# [2.3.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@2.2.2...@formatjs/intl-supportedvaluesof@2.3.0) (2026-03-17)

### Features

* **@formatjs/ecma402-abstract:** migrate from decimal.js to @formatjs/bigdecimal ([#6148](https://github.com/formatjs/formatjs/issues/6148)) ([93744d4](https://github.com/formatjs/formatjs/commit/93744d4732ab2dfdc93e7ddb2a73e80a6e461534)) - by @longlho

## [2.2.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@2.2.1...@formatjs/intl-supportedvaluesof@2.2.2) (2026-03-16)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [2.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@2.2.0...@formatjs/intl-supportedvaluesof@2.2.1) (2026-02-01)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

# 2.2.0 (2026-01-15)

### Features

* **@formatjs/intl-supportedvaluesof:** update to latest spec ([#5918](https://github.com/formatjs/formatjs/issues/5918)) ([f6ed7eb](https://github.com/formatjs/formatjs/commit/f6ed7eb6cf075e893488960acb8320e1cb99ea05)) - by @longlho

## [2.1.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@2.1.1...@formatjs/intl-supportedvaluesof@2.1.2) (2026-01-06)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [2.1.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@2.1.0...@formatjs/intl-supportedvaluesof@2.1.1) (2026-01-02)

### Bug Fixes

* **@formatjs/intl-datetimeformat:** add America/Coyhaique, fix [#5111](https://github.com/formatjs/formatjs/issues/5111) ([#5741](https://github.com/formatjs/formatjs/issues/5741)) ([edd2f94](https://github.com/formatjs/formatjs/commit/edd2f94ab780e82702a1017e3ca38d41bde325ed)) - by @longlho

# [2.1.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@2.0.5...@formatjs/intl-supportedvaluesof@2.1.0) (2025-12-26)

### Features

* upgrade cldr to v48 ([#5678](https://github.com/formatjs/formatjs/issues/5678)) ([54ef319](https://github.com/formatjs/formatjs/commit/54ef31940172467889be64907e9fbbf567ea3f4b)) - by @longlho

## [2.0.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@2.0.4...@formatjs/intl-supportedvaluesof@2.0.5) (2025-12-23)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [2.0.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@2.0.3...@formatjs/intl-supportedvaluesof@2.0.4) (2025-12-23)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [2.0.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@2.0.2...@formatjs/intl-supportedvaluesof@2.0.3) (2025-12-18)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [2.0.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@2.0.1...@formatjs/intl-supportedvaluesof@2.0.2) (2025-12-17)

### Bug Fixes

* **@formatjs/cli-lib:** fix fs-extra imports, fix [#5569](https://github.com/formatjs/formatjs/issues/5569) ([76c8793](https://github.com/formatjs/formatjs/commit/76c8793bf8a0744ad9a7c64ab3adbe5c1434898f)) - by @longlho

## [2.0.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@2.0.0...@formatjs/intl-supportedvaluesof@2.0.1) (2025-12-15)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [2.0.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.8.12...@formatjs/intl-supportedvaluesof@2.0.0) (2025-12-15)

### ⚠ BREAKING CHANGES

* **@formatjs/intl-supportedvaluesof:** convert to esm (#5458)

### Features

* **@formatjs/intl-supportedvaluesof:** convert to esm ([#5458](https://github.com/formatjs/formatjs/issues/5458)) ([04fdc7d](https://github.com/formatjs/formatjs/commit/04fdc7d5dd6b731e8de0c87c5a20d1df584cee96)) - by @longlho

## [1.8.12](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.8.11...@formatjs/intl-supportedvaluesof@1.8.12) (2025-10-09)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.8.11](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.8.10...@formatjs/intl-supportedvaluesof@1.8.11) (2025-10-03)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.8.10](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.8.9...@formatjs/intl-supportedvaluesof@1.8.10) (2025-03-23)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.8.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.8.8...@formatjs/intl-supportedvaluesof@1.8.9) (2025-02-09)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.8.8](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.8.7...@formatjs/intl-supportedvaluesof@1.8.8) (2025-01-02)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.8.7](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.8.6...@formatjs/intl-supportedvaluesof@1.8.7) (2024-12-09)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.8.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.8.5...@formatjs/intl-supportedvaluesof@1.8.6) (2024-12-09)

### Bug Fixes

* turn on isolatedDeclarations and specify explicit types everywhere ([4d855c2](https://github.com/formatjs/formatjs/commit/4d855c2324426633eb84c346c76a5fd1ac854780)) - by @longlho

## [1.8.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.8.4...@formatjs/intl-supportedvaluesof@1.8.5) (2024-12-08)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.8.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.8.3...@formatjs/intl-supportedvaluesof@1.8.4) (2024-11-18)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.8.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.8.2...@formatjs/intl-supportedvaluesof@1.8.3) (2024-11-04)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.8.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.8.1...@formatjs/intl-supportedvaluesof@1.8.2) (2024-11-02)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.8.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.8.0...@formatjs/intl-supportedvaluesof@1.8.1) (2024-10-25)

### Bug Fixes

* relax tslib req to 2 instead of 2.7 ([930c3e8](https://github.com/formatjs/formatjs/commit/930c3e8ddcc160fde7466449575455f135f78ca6)) - by @longlho

# [1.8.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.7.0...@formatjs/intl-supportedvaluesof@1.8.0) (2024-10-25)

### Features

* upgrade cldr to v46 ([daafb44](https://github.com/formatjs/formatjs/commit/daafb449ba2fc4553f5a484b969affa1529752db)) - by @longlho

# [1.7.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.6.0...@formatjs/intl-supportedvaluesof@1.7.0) (2024-10-21)

### Features

* upgrade cldr to v45 ([#4620](https://github.com/formatjs/formatjs/issues/4620)) ([fbb2bbf](https://github.com/formatjs/formatjs/commit/fbb2bbf6e038d5833c1f2752b805002436480948)) - by @longlho

# [1.6.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.4.7...@formatjs/intl-supportedvaluesof@1.6.0) (2024-10-12)

### Features

* **@formatjs/intl-supportedvaluesof:** use memoized constructor creation for perf ([8949482](https://github.com/formatjs/formatjs/commit/89494821d7f346d7a6803fe5cc0bf987e3d34324)) - by @longlho

# [1.5.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.4.7...@formatjs/intl-supportedvaluesof@1.5.0) (2024-10-09)

### Features

* **@formatjs/intl-supportedvaluesof:** use memoized constructor creation for perf ([8949482](https://github.com/formatjs/formatjs/commit/89494821d7f346d7a6803fe5cc0bf987e3d34324)) - by @longlho

## [1.4.7](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.4.6...@formatjs/intl-supportedvaluesof@1.4.7) (2024-05-19)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.4.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.4.5...@formatjs/intl-supportedvaluesof@1.4.6) (2024-05-18)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.4.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.4.4...@formatjs/intl-supportedvaluesof@1.4.5) (2024-01-16)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.4.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.4.3...@formatjs/intl-supportedvaluesof@1.4.4) (2024-01-16)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.4.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.4.2...@formatjs/intl-supportedvaluesof@1.4.3) (2023-11-14)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.4.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.4.1...@formatjs/intl-supportedvaluesof@1.4.2) (2023-11-12)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.4.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.4.0...@formatjs/intl-supportedvaluesof@1.4.1) (2023-11-06)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

# [1.4.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.3.4...@formatjs/intl-supportedvaluesof@1.4.0) (2023-10-16)

### Features

* **@formatjs/intl-supportedvaluesof:** update CLDR to v43 ([ee6d972](https://github.com/formatjs/formatjs/commit/ee6d972365b73b6fbfc312defb05a853eb51e5f0))

## [1.3.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.3.3...@formatjs/intl-supportedvaluesof@1.3.4) (2023-09-10)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.3.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.3.2...@formatjs/intl-supportedvaluesof@1.3.3) (2023-09-07)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.3.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.3.1...@formatjs/intl-supportedvaluesof@1.3.2) (2023-06-12)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.3.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.3.0...@formatjs/intl-supportedvaluesof@1.3.1) (2023-06-06)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

# [1.3.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.2.1...@formatjs/intl-supportedvaluesof@1.3.0) (2023-05-01)

### Features

* **@formatjs/intl-datetimeformat:** updated `tzdata` to `2023c` and fixed missing and changed TimeZone ([1b4856b](https://github.com/formatjs/formatjs/commit/1b4856b11c32c6ac99aa8795ee487c92b4d9d9c9))

## [1.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.2.0...@formatjs/intl-supportedvaluesof@1.2.1) (2023-02-20)

### Bug Fixes

* **@formatjs/intl-supportedvaluesof:** fix package.json ([67180d1](https://github.com/formatjs/formatjs/commit/67180d11f09c62005b1fd1f6b3d59f3af005a785))

# [1.2.0](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.1.10...@formatjs/intl-supportedvaluesof@1.2.0) (2023-02-20)

### Features

* **@formatjs/intl-locale:** implement new proposal features for Intl.Locale ([#3955](https://github.com/formatjs/formatjs/issues/3955)) ([984f923](https://github.com/formatjs/formatjs/commit/984f923f298c578d7c138ca5ad9f12965d73a7d0))

## [1.1.10](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.1.9...@formatjs/intl-supportedvaluesof@1.1.10) (2022-12-02)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.1.9](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.1.7...@formatjs/intl-supportedvaluesof@1.1.9) (2022-12-01)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.1.8](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.1.7...@formatjs/intl-supportedvaluesof@1.1.8) (2022-12-01)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.1.7](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.1.6...@formatjs/intl-supportedvaluesof@1.1.7) (2022-11-29)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.1.6](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.1.5...@formatjs/intl-supportedvaluesof@1.1.6) (2022-10-13)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.1.5](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.1.4...@formatjs/intl-supportedvaluesof@1.1.5) (2022-08-27)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.1.4](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.1.3...@formatjs/intl-supportedvaluesof@1.1.4) (2022-08-21)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.1.3](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.1.2...@formatjs/intl-supportedvaluesof@1.1.3) (2022-08-21)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.1.2](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.1.1...@formatjs/intl-supportedvaluesof@1.1.2) (2022-08-18)

**Note:** Version bump only for package @formatjs/intl-supportedvaluesof

## [1.1.1](https://github.com/formatjs/formatjs/compare/@formatjs/intl-supportedvaluesof@1.1.0...@formatjs/intl-supportedvaluesof@1.1.1) (2022-07-16)

### Bug Fixes

* **@formatjs/cli-lib:** introduce @formatjs/cli-lib as @formatjs/cli Node API ([7c4ebef](https://github.com/formatjs/formatjs/commit/7c4ebef00a6ac2a197b5007e328306bc8e00b445)), closes [#3625](https://github.com/formatjs/formatjs/issues/3625)

# 1.1.0 (2022-07-11)

### Bug Fixes

* **@formatjs/intl-supportedvaluesof:** fix intl-enumerator build ([a1d95e1](https://github.com/formatjs/formatjs/commit/a1d95e13e21fddf8f13475254daf13d86dd34b6a))
* **@formatjs/intl-supportedvaluesof:** fixes intl.supportedValuesOf units ([#3699](https://github.com/formatjs/formatjs/issues/3699)) ([23c642c](https://github.com/formatjs/formatjs/commit/23c642c31996f6cbad59b374d59b5bb54d5dc6a2))

### Features

* **@formatjs/intl-supportedvaluesof:** porting of proposal-intl-enumeration to typescript ([#3694](https://github.com/formatjs/formatjs/issues/3694)) ([8c95643](https://github.com/formatjs/formatjs/commit/8c95643ca3128f4e0d0c4cd196dd8773467f7db8))

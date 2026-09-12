# Changelog

## [1.0.1](https://github.com/formatjs/formatjs/compare/formatjs_intl_v1.0.0...formatjs_intl_v1.0.1) (2026-09-12)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_icu_messageformat bumped from 0.1.2 to 0.1.3
    * formatjs_intl_macros bumped from 0.2.0 to 0.2.1

## 1.0.0 (2026-09-11)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
* refactor(@formatjs/editor): consume built browser test inputs by @longlho in https://github.com/formatjs/formatjs/pull/7335
* fix(formatjs_intl): restrict verbatim text to domain sources by @longlho in https://github.com/formatjs/formatjs/pull/7349


**Full Changelog**: https://github.com/formatjs/formatjs/compare/formatjs_intl_v0.6.0...formatjs_intl_v1.0.0

## 0.6.0 (2026-09-10)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
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
* chore: release main by @formatjsproject in https://github.com/formatjs/formatjs/pull/7181
* feat(@formatjs/editor): support shared locale drafts and typed save results by @longlho in https://github.com/formatjs/formatjs/pull/7325
* chore: release main by @formatjsproject in https://github.com/formatjs/formatjs/pull/7327
* feat(@formatjs/editor): add browser tests and shared visual modules by @longlho in https://github.com/formatjs/formatjs/pull/7323
* feat(@formatjs/editor): add editor UI with design-system context by @longlho in https://github.com/formatjs/formatjs/pull/7329
* chore: release main by @formatjsproject in https://github.com/formatjs/formatjs/pull/7331
* feat(@formatjs/intl): add duration formatting APIs by @longlho in https://github.com/formatjs/formatjs/pull/7332
* feat(react-intl): add duration components and bindings by @longlho in https://github.com/formatjs/formatjs/pull/7333
* feat(@formatjs/editor): extend composed views with typed content slots by @longlho in https://github.com/formatjs/formatjs/pull/7336
* feat(@formatjs/editor): add reusable translation tools by @longlho in https://github.com/formatjs/formatjs/pull/7340
* feat(formatjs_intl): add checked FormattedMessage output by @longlho in https://github.com/formatjs/formatjs/pull/7343

## New Contributors
* @pgonsolin made their first contribution in https://github.com/formatjs/formatjs/pull/7157

**Full Changelog**: https://github.com/formatjs/formatjs/compare/formatjs_intl_v0.5.0...formatjs_intl_v0.6.0

## 0.5.0 (2026-08-31)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
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


**Full Changelog**: https://github.com/formatjs/formatjs/compare/formatjs_intl_v0.4.0...formatjs_intl_v0.5.0

## 0.4.0 (2026-08-16)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
* feat(formatjs_intl): accept inline named values by @longlho in https://github.com/formatjs/formatjs/pull/7031
* chore(deps): exclude Renovate from release notes by @longlho in https://github.com/formatjs/formatjs/pull/7030
* feat(eslint-plugin-formatjs): detect glued placeholders by @longlho in https://github.com/formatjs/formatjs/pull/7036
* docs: cover units and calendar names in i18n skill by @longlho in https://github.com/formatjs/formatjs/pull/7042


**Full Changelog**: https://github.com/formatjs/formatjs/compare/formatjs_intl_v0.3.0...formatjs_intl_v0.4.0


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_macros bumped from 0.1.2 to 0.2.0

## 0.3.0 (2026-08-07)

## What's Changed
* chore(deps): update dependency webpack to v5.109.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6987
* build: remove root npmrc by @longlho in https://github.com/formatjs/formatjs/pull/6988
* fix: skip unpublished Rust crates by @longlho in https://github.com/formatjs/formatjs/pull/6992
* chore(deps): update rust crate serde_json to v1.0.151 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6945
* chore(deps): update rust crate serde to v1.0.229 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6944
* chore(deps): update rust crate anyhow to v1.0.104 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6943
* fix(deps): update rust crate base64 to 0.23 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6971
* chore(deps): update rust crate fast-glob to v1.1.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6969
* chore(deps): update rust crate proc-macro2 to v1.0.107 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6990
* fix: handle Cargo publish and merge options by @longlho in https://github.com/formatjs/formatjs/pull/6993
* chore(deps): update pnpm to v11.18.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6968
* chore(deps): update rust crate quote to v1.0.47 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6995
* chore(deps): update rust crate syn to v2.0.119 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6996
* fix(deps): update formatjs monorepo by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6999
* fix(deps): update dependency eslint-plugin-formatjs to v6.4.20 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6998
* chore(deps): update dependency rolldown to v1.2.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6965
* chore(deps): update dependency eslint to v10.8.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6957
* fix(deps): update react monorepo by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6956
* chore(deps): update dependency lucide-react to v1.28.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/7001
* chore(deps): update dependency codescythe to ^0.10.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/7000
* chore(deps): update dependency oxlint to v1.76.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/7003
* chore(deps): update dependency vite to v8.2.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/7007
* fix(formatjs_cli): fail on input resolution errors by @longlho in https://github.com/formatjs/formatjs/pull/7005
* feat(formatjs_intl): add extractable format_message macro by @longlho in https://github.com/formatjs/formatjs/pull/7018
* fix(deps): update rust crate syn to v3 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/7017
* fix(deps): update dependency babel-plugin-formatjs to v13 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/7014
* chore(deps): update actions/stale action to v11 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/7011


**Full Changelog**: https://github.com/formatjs/formatjs/compare/formatjs_intl_v0.2.0...formatjs_intl_v0.3.0


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_intl_macros bumped from 0.1.1 to 0.1.2

## 0.2.0 (2026-08-07)

## What's Changed
* fix: queue crate release workflows by @longlho in https://github.com/formatjs/formatjs/pull/6980
* docs: document Rust support by @longlho in https://github.com/formatjs/formatjs/pull/6981
* feat(formatjs_intl): add message fallbacks by @longlho in https://github.com/formatjs/formatjs/pull/6982
* chore(deps): update dependency @vitejs/plugin-react to v6.0.5 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6983
* chore(deps): update dependency @rspack/core to v2.1.7 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6986
* feat(formatjs_intl): support precompiled catalogs by @longlho in https://github.com/formatjs/formatjs/pull/6985


**Full Changelog**: https://github.com/formatjs/formatjs/compare/formatjs_intl_v0.1.1...formatjs_intl_v0.2.0


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_icu_messageformat bumped from 0.1.1 to 0.1.2

## 0.1.1 (2026-08-06)

## What's Changed
* chore: release main by @longlho in https://github.com/formatjs/formatjs/pull/6977
* Documented how to use ember-intl by @ijlee2 in https://github.com/formatjs/formatjs/pull/6946
* fix: support Rust 1.92 in new intl crates by @longlho in https://github.com/formatjs/formatjs/pull/6978

## New Contributors
* @ijlee2 made their first contribution in https://github.com/formatjs/formatjs/pull/6946

**Full Changelog**: https://github.com/formatjs/formatjs/compare/formatjs_intl_v0.1.0...formatjs_intl_v0.1.1


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * formatjs_icu_messageformat bumped from 0.1.0 to 0.1.1
    * formatjs_intl_macros bumped from 0.1.0 to 0.1.1

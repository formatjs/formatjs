# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 2.2.10 (2026-06-03)

## What's Changed
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


**Full Changelog**: https://github.com/formatjs/formatjs/compare/@formatjs/utils@2.2.9...@formatjs/utils@2.2.10


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/fast-memoize bumped to 3.1.6

## [2.2.9](https://github.com/formatjs/formatjs/compare/@formatjs/utils@2.2.8...@formatjs/utils@2.2.9) (2026-05-15)

**Note:** Version bump only for package @formatjs/utils

## [2.2.8](https://github.com/formatjs/formatjs/compare/@formatjs/utils@2.2.7...@formatjs/utils@2.2.8) (2026-05-12)

**Note:** Version bump only for package @formatjs/utils

## [2.2.7](https://github.com/formatjs/formatjs/compare/@formatjs/utils@2.2.6...@formatjs/utils@2.2.7) (2026-05-05)

**Note:** Version bump only for package @formatjs/utils

## [2.2.6](https://github.com/formatjs/formatjs/compare/@formatjs/utils@2.2.5...@formatjs/utils@2.2.6) (2026-04-29)

**Note:** Version bump only for package @formatjs/utils

## [2.2.5](https://github.com/formatjs/formatjs/compare/@formatjs/utils@2.2.4...@formatjs/utils@2.2.5) (2026-04-24)

**Note:** Version bump only for package @formatjs/utils

## [2.2.4](https://github.com/formatjs/formatjs/compare/@formatjs/utils@2.2.3...@formatjs/utils@2.2.4) (2026-04-13)

### Reverts

* **deps:** revert gazelle migration phases 1-3 ([#6205](https://github.com/formatjs/formatjs/issues/6205)) ([4c04aa2](https://github.com/formatjs/formatjs/commit/4c04aa2726107ab1d0b9dab8a54a82fa62a73680)), closes [#6197](https://github.com/formatjs/formatjs/issues/6197) [#6198](https://github.com/formatjs/formatjs/issues/6198) [#6199](https://github.com/formatjs/formatjs/issues/6199) [#6195](https://github.com/formatjs/formatjs/issues/6195) [#6196](https://github.com/formatjs/formatjs/issues/6196) - by @longlho

## [2.2.3](https://github.com/formatjs/formatjs/compare/@formatjs/utils@2.2.2...@formatjs/utils@2.2.3) (2026-03-16)

**Note:** Version bump only for package @formatjs/utils

## [2.2.2](https://github.com/formatjs/formatjs/compare/@formatjs/utils@2.2.1...@formatjs/utils@2.2.2) (2026-02-19)

**Note:** Version bump only for package @formatjs/utils

## [2.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/utils@2.2.0...@formatjs/utils@2.2.1) (2026-02-01)

**Note:** Version bump only for package @formatjs/utils

# [2.2.0](https://github.com/formatjs/formatjs/compare/@formatjs/utils@2.1.2...@formatjs/utils@2.2.0) (2026-01-15)

### Features

* **@formatjs/intl-segmenter:** improve Unicode 17.0 Format/Extend transparency and upgrade deps ([#5862](https://github.com/formatjs/formatjs/issues/5862)) ([effeb9c](https://github.com/formatjs/formatjs/commit/effeb9cd9d26f8c43c1e3df64a84c42dc7b12043)), closes [#29](https://github.com/formatjs/formatjs/issues/29) - by @longlho

## [2.1.2](https://github.com/formatjs/formatjs/compare/@formatjs/utils@2.1.1...@formatjs/utils@2.1.2) (2026-01-06)

**Note:** Version bump only for package @formatjs/utils

## [2.1.1](https://github.com/formatjs/formatjs/compare/@formatjs/utils@2.1.0...@formatjs/utils@2.1.1) (2026-01-02)

**Note:** Version bump only for package @formatjs/utils

# [2.1.0](https://github.com/formatjs/formatjs/compare/@formatjs/utils@2.0.4...@formatjs/utils@2.1.0) (2025-12-26)

### Features

* upgrade cldr to v48 ([#5678](https://github.com/formatjs/formatjs/issues/5678)) ([54ef319](https://github.com/formatjs/formatjs/commit/54ef31940172467889be64907e9fbbf567ea3f4b)) - by @longlho

## [2.0.4](https://github.com/formatjs/formatjs/compare/@formatjs/utils@2.0.3...@formatjs/utils@2.0.4) (2025-12-19)

### Bug Fixes

* **@formatjs/utils:** fix ESM imports ([#5596](https://github.com/formatjs/formatjs/issues/5596)) ([9580a68](https://github.com/formatjs/formatjs/commit/9580a685239b972ced27d6dd2ed374764bf08b29)) - by @longlho

## [2.0.3](https://github.com/formatjs/formatjs/compare/@formatjs/utils@2.0.2...@formatjs/utils@2.0.3) (2025-12-19)

### Bug Fixes

* **@formatjs/utils:** fix json ESM import ([#5594](https://github.com/formatjs/formatjs/issues/5594)) ([dfd79a2](https://github.com/formatjs/formatjs/commit/dfd79a2d9935e0b7d06c08555ff6625d3f1c884f)) - by @longlho
* **@formatjs/utils:** update docs ([3675c40](https://github.com/formatjs/formatjs/commit/3675c40ee0b9173ba6406c2dca8d35e256394efa)) - by @

## [2.0.2](https://github.com/formatjs/formatjs/compare/@formatjs/utils@2.0.1...@formatjs/utils@2.0.2) (2025-12-17)

### Bug Fixes

* **@formatjs/cli-lib:** fix fs-extra imports, fix [#5569](https://github.com/formatjs/formatjs/issues/5569) ([76c8793](https://github.com/formatjs/formatjs/commit/76c8793bf8a0744ad9a7c64ab3adbe5c1434898f)) - by @longlho

## [2.0.1](https://github.com/formatjs/formatjs/compare/@formatjs/utils@2.0.0...@formatjs/utils@2.0.1) (2025-12-15)

**Note:** Version bump only for package @formatjs/utils

## [2.0.0](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.9.4...@formatjs/utils@2.0.0) (2025-12-15)

### ⚠ BREAKING CHANGES

* **@formatjs/utils:** convert to ESM (#5433)

### Features

* **@formatjs/utils:** convert to ESM ([#5433](https://github.com/formatjs/formatjs/issues/5433)) ([72b770d](https://github.com/formatjs/formatjs/commit/72b770dfd8377fa9eb080b069cffbfa601ee147b)) - by @longlho

## [1.9.4](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.9.3...@formatjs/utils@1.9.4) (2025-06-15)

**Note:** Version bump only for package @formatjs/utils

## [1.9.3](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.9.2...@formatjs/utils@1.9.3) (2025-05-05)

**Note:** Version bump only for package @formatjs/utils

## [1.9.2](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.9.1...@formatjs/utils@1.9.2) (2025-03-23)

**Note:** Version bump only for package @formatjs/utils

## [1.9.1](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.9.0...@formatjs/utils@1.9.1) (2025-02-06)

### Bug Fixes

* **@formatjs/utils:** add currencyScale, rm currencyMinorUnits ([b1da9d6](https://github.com/formatjs/formatjs/commit/b1da9d63c5424d7faa51387a51d4f1c46e60e6b1)) - by @longlho

# [1.9.0](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.8.4...@formatjs/utils@1.9.0) (2025-02-06)

### Features

* **@formatjs/utils:** add currencyMinorUnits ([2dcecd3](https://github.com/formatjs/formatjs/commit/2dcecd3b1ee8c446340f04a86ad356724fa1abac)) - by @longlho

## [1.8.4](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.8.3...@formatjs/utils@1.8.4) (2025-01-02)

**Note:** Version bump only for package @formatjs/utils

## [1.8.3](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.8.2...@formatjs/utils@1.8.3) (2024-12-09)

### Bug Fixes

* turn on isolatedDeclarations and specify explicit types everywhere ([4d855c2](https://github.com/formatjs/formatjs/commit/4d855c2324426633eb84c346c76a5fd1ac854780)) - by @longlho

## [1.8.2](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.8.1...@formatjs/utils@1.8.2) (2024-12-08)

**Note:** Version bump only for package @formatjs/utils

## [1.8.1](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.8.0...@formatjs/utils@1.8.1) (2024-11-05)

**Note:** Version bump only for package @formatjs/utils

# [1.8.0](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.7.0...@formatjs/utils@1.8.0) (2024-11-04)

### Features

* **@formatjs/utils:** add ability to return localized default timezone ([a53d0a2](https://github.com/formatjs/formatjs/commit/a53d0a2e4112816d453bb65eb2500b7a72143011)) - by @longlho

# [1.7.0](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.6.3...@formatjs/utils@1.7.0) (2024-11-04)

### Features

* **@formatjs/utils:** add a fn to get memoized default timezone for the system ([95c120e](https://github.com/formatjs/formatjs/commit/95c120e16a8f4704ccee27e17620e0463da146b0)) - by @longlho

## [1.6.3](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.6.2...@formatjs/utils@1.6.3) (2024-11-02)

**Note:** Version bump only for package @formatjs/utils

## [1.6.2](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.6.1...@formatjs/utils@1.6.2) (2024-10-28)

### Bug Fixes

* **@formatjs/utils:** fix default currency type ([ba6f51a](https://github.com/formatjs/formatjs/commit/ba6f51ae8b86b4d4405da54a58ddc73ae11e65fa)) - by @longlho

## [1.6.1](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.6.0...@formatjs/utils@1.6.1) (2024-10-25)

### Bug Fixes

* relax tslib req to 2 instead of 2.7 ([930c3e8](https://github.com/formatjs/formatjs/commit/930c3e8ddcc160fde7466449575455f135f78ca6)) - by @longlho

# [1.6.0](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.5.2...@formatjs/utils@1.6.0) (2024-10-25)

### Features

* upgrade cldr to v46 ([daafb44](https://github.com/formatjs/formatjs/commit/daafb449ba2fc4553f5a484b969affa1529752db)) - by @longlho

## [1.5.2](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.5.1...@formatjs/utils@1.5.2) (2024-10-24)

### Bug Fixes

* **@formatjs/utils:** fix default currency processing ([8fef91d](https://github.com/formatjs/formatjs/commit/8fef91db46bdfbca3dd114bfb282cbf078037e94)) - by @longlho

## [1.5.1](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.5.0...@formatjs/utils@1.5.1) (2024-10-24)

### Bug Fixes

* **@formatjs/utils:** add missing exports ([4373589](https://github.com/formatjs/formatjs/commit/4373589a5b0d43246a5fdc462bf6689b0658eb3f)) - by @longlho

# [1.5.0](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.4.0...@formatjs/utils@1.5.0) (2024-10-24)

### Features

* **@formatjs/utils:** add countriesUsingDefaultCurrency that gives a list of countries using certain currencies as default ([51c0ef3](https://github.com/formatjs/formatjs/commit/51c0ef351f0a39b5d3ab9ebe06dc41abd2009b36)) - by @longlho

# [1.4.0](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.3.0...@formatjs/utils@1.4.0) (2024-10-24)

### Features

* **@formatjs/utils:** add defaultLocale that gives you default locale for a country ([aac5ca0](https://github.com/formatjs/formatjs/commit/aac5ca0e743841f264b297425c53a45ebd76b168)) - by @longlho

# [1.3.0](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.2.1...@formatjs/utils@1.3.0) (2024-10-21)

### Features

* upgrade cldr to v45 ([#4620](https://github.com/formatjs/formatjs/issues/4620)) ([fbb2bbf](https://github.com/formatjs/formatjs/commit/fbb2bbf6e038d5833c1f2752b805002436480948)) - by @longlho

## [1.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.2.0...@formatjs/utils@1.2.1) (2024-10-12)

**Note:** Version bump only for package @formatjs/utils

# [1.2.0](https://github.com/formatjs/formatjs/compare/@formatjs/utils@1.1.0...@formatjs/utils@1.2.0) (2024-07-05)

### Features

* **@formatjs/utils:** add defaultCurrency that gives you default currency code for a country ([30ca319](https://github.com/formatjs/formatjs/commit/30ca319849dd95e45304643fd10b7e7280a8bfb7)) - by @longlho

# 1.1.0 (2024-07-05)

### Features

* **@formatjs/utils:** introduce @formatjs/utils that has a collection of useful intl-relative utilities ([9614b18](https://github.com/formatjs/formatjs/commit/9614b1876503251769f1dbf5de508e80639147e0)) - by @longlho

# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 2.1.10 (2026-06-03)

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


**Full Changelog**: https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@2.1.9...@formatjs/icu-skeleton-parser@2.1.10

## [2.1.9](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@2.1.8...@formatjs/icu-skeleton-parser@2.1.9) (2026-05-15)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [2.1.8](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@2.1.7...@formatjs/icu-skeleton-parser@2.1.8) (2026-05-12)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [2.1.7](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@2.1.6...@formatjs/icu-skeleton-parser@2.1.7) (2026-05-05)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [2.1.6](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@2.1.5...@formatjs/icu-skeleton-parser@2.1.6) (2026-04-29)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [2.1.5](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@2.1.4...@formatjs/icu-skeleton-parser@2.1.5) (2026-04-24)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [2.1.4](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@2.1.3...@formatjs/icu-skeleton-parser@2.1.4) (2026-04-13)

### Reverts

* **deps:** revert gazelle migration phases 1-3 ([#6205](https://github.com/formatjs/formatjs/issues/6205)) ([4c04aa2](https://github.com/formatjs/formatjs/commit/4c04aa2726107ab1d0b9dab8a54a82fa62a73680)), closes [#6197](https://github.com/formatjs/formatjs/issues/6197) [#6198](https://github.com/formatjs/formatjs/issues/6198) [#6199](https://github.com/formatjs/formatjs/issues/6199) [#6195](https://github.com/formatjs/formatjs/issues/6195) [#6196](https://github.com/formatjs/formatjs/issues/6196) - by @longlho

## [2.1.3](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@2.1.2...@formatjs/icu-skeleton-parser@2.1.3) (2026-03-17)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [2.1.2](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@2.1.1...@formatjs/icu-skeleton-parser@2.1.2) (2026-03-16)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [2.1.1](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@2.1.0...@formatjs/icu-skeleton-parser@2.1.1) (2026-02-01)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

# [2.1.0](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@2.0.8...@formatjs/icu-skeleton-parser@2.1.0) (2026-01-15)

### Features

* **@formatjs/ecma402-abstract:** upgrade Unicode from 13.0.0 to 17.0.0 ([#5866](https://github.com/formatjs/formatjs/issues/5866)) ([00343fe](https://github.com/formatjs/formatjs/commit/00343fe97e34f8f494d8b9a8b99bca50af6b48b2)) - by @longlho
* **@formatjs/intl-segmenter:** improve Unicode 17.0 Format/Extend transparency and upgrade deps ([#5862](https://github.com/formatjs/formatjs/issues/5862)) ([effeb9c](https://github.com/formatjs/formatjs/commit/effeb9cd9d26f8c43c1e3df64a84c42dc7b12043)), closes [#29](https://github.com/formatjs/formatjs/issues/29) - by @longlho

## [2.0.8](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@2.0.7...@formatjs/icu-skeleton-parser@2.0.8) (2026-01-06)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [2.0.7](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@2.0.6...@formatjs/icu-skeleton-parser@2.0.7) (2026-01-02)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [2.0.6](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@2.0.5...@formatjs/icu-skeleton-parser@2.0.6) (2025-12-26)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [2.0.5](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@2.0.4...@formatjs/icu-skeleton-parser@2.0.5) (2025-12-23)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [2.0.4](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@2.0.3...@formatjs/icu-skeleton-parser@2.0.4) (2025-12-23)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [2.0.3](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@2.0.2...@formatjs/icu-skeleton-parser@2.0.3) (2025-12-18)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [2.0.2](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@2.0.1...@formatjs/icu-skeleton-parser@2.0.2) (2025-12-17)

### Bug Fixes

* **@formatjs/cli-lib:** fix fs-extra imports, fix [#5569](https://github.com/formatjs/formatjs/issues/5569) ([76c8793](https://github.com/formatjs/formatjs/commit/76c8793bf8a0744ad9a7c64ab3adbe5c1434898f)) - by @longlho

## [2.0.1](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@2.0.0...@formatjs/icu-skeleton-parser@2.0.1) (2025-12-15)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [2.0.0](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.8.16...@formatjs/icu-skeleton-parser@2.0.0) (2025-12-15)

### ⚠ BREAKING CHANGES

* **@formatjs/icu-skeleton-parser:** convert to esm (#5465)

### Features

* **@formatjs/icu-skeleton-parser:** convert to esm ([#5465](https://github.com/formatjs/formatjs/issues/5465)) ([e3957a6](https://github.com/formatjs/formatjs/commit/e3957a6197b3119cbe762bce3251d6b4621670ca)) - by @longlho

## [1.8.16](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.8.15...@formatjs/icu-skeleton-parser@1.8.16) (2025-10-09)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.8.15](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.8.14...@formatjs/icu-skeleton-parser@1.8.15) (2025-10-03)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.8.14](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.8.13...@formatjs/icu-skeleton-parser@1.8.14) (2025-03-23)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.8.13](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.8.12...@formatjs/icu-skeleton-parser@1.8.13) (2025-02-09)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.8.12](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.8.11...@formatjs/icu-skeleton-parser@1.8.12) (2025-01-02)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.8.11](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.8.10...@formatjs/icu-skeleton-parser@1.8.11) (2024-12-09)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.8.10](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.8.9...@formatjs/icu-skeleton-parser@1.8.10) (2024-12-09)

### Bug Fixes

* turn on isolatedDeclarations and specify explicit types everywhere ([4d855c2](https://github.com/formatjs/formatjs/commit/4d855c2324426633eb84c346c76a5fd1ac854780)) - by @longlho

## [1.8.9](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.8.8...@formatjs/icu-skeleton-parser@1.8.9) (2024-12-08)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.8.8](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.8.7...@formatjs/icu-skeleton-parser@1.8.8) (2024-11-18)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.8.7](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.8.6...@formatjs/icu-skeleton-parser@1.8.7) (2024-11-04)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.8.6](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.8.5...@formatjs/icu-skeleton-parser@1.8.6) (2024-11-02)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.8.5](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.8.4...@formatjs/icu-skeleton-parser@1.8.5) (2024-10-25)

### Bug Fixes

* relax tslib req to 2 instead of 2.7 ([930c3e8](https://github.com/formatjs/formatjs/commit/930c3e8ddcc160fde7466449575455f135f78ca6)) - by @longlho

## [1.8.4](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.8.2...@formatjs/icu-skeleton-parser@1.8.4) (2024-10-12)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.8.3](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.8.2...@formatjs/icu-skeleton-parser@1.8.3) (2024-10-09)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.8.2](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.8.1...@formatjs/icu-skeleton-parser@1.8.2) (2024-05-19)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.8.1](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.8.0...@formatjs/icu-skeleton-parser@1.8.1) (2024-05-18)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

# [1.8.0](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.7.2...@formatjs/icu-skeleton-parser@1.8.0) (2024-01-26)

### Features

* **@formatjs/icu-skeleton-parser:** add support for rounding-mode, fix [#3716](https://github.com/formatjs/formatjs/issues/3716) ([fc5050f](https://github.com/formatjs/formatjs/commit/fc5050f279e36adebb80ca8e75460276c066afa4)) - by @longlho

## [1.7.2](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.7.1...@formatjs/icu-skeleton-parser@1.7.2) (2024-01-16)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.7.1](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.7.0...@formatjs/icu-skeleton-parser@1.7.1) (2024-01-16)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

# [1.7.0](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.6.4...@formatjs/icu-skeleton-parser@1.7.0) (2023-11-14)

### Bug Fixes

* **@formatjs/intl-durationformat:** add polyfill detector + docs ([d6d237a](https://github.com/formatjs/formatjs/commit/d6d237a2ffca73d5e3824df17bf5ebf7e7b135a8)) - by @

### Features

* **@formatjs/intl-durationformat:** implement stage-3 spec ([01bcfc7](https://github.com/formatjs/formatjs/commit/01bcfc7ac759ccd18fa8dd380e4bd33c34fa274f)), closes [#4257](https://github.com/formatjs/formatjs/issues/4257) - by @

## [1.6.4](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.6.3...@formatjs/icu-skeleton-parser@1.6.4) (2023-11-12)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.6.3](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.6.2...@formatjs/icu-skeleton-parser@1.6.3) (2023-11-06)

### Bug Fixes

* **@formatjs/icu-skeleton-parser:** parse 'EEEE' as long weekday ([d01d112](https://github.com/formatjs/formatjs/commit/d01d1120cfa39e884cd224b9f84b8310f6073927))

## [1.6.2](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.6.1...@formatjs/icu-skeleton-parser@1.6.2) (2023-09-10)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.6.1](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.6.0...@formatjs/icu-skeleton-parser@1.6.1) (2023-09-07)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

# [1.6.0](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.5.0...@formatjs/icu-skeleton-parser@1.6.0) (2023-06-12)

### Features

* **@formatjs/intl,@formatjs/fast-memoize,@formatjs/icu-messageformat-parser,@formatjs/intl-displaynames,@formatjs/intl-listformat,intl-messageformat,@formatjs/ecma402-abstract,@formatjs/intl-numberformat,@formatjs/icu-skeleton-parser:** Revert esm conditional exports ([#4129](https://github.com/formatjs/formatjs/issues/4129)) ([78edf46](https://github.com/formatjs/formatjs/commit/78edf460a466a7021e3753be53fd9c6af00f2d96)), closes [#4128](https://github.com/formatjs/formatjs/issues/4128) [#4127](https://github.com/formatjs/formatjs/issues/4127) [#4126](https://github.com/formatjs/formatjs/issues/4126)

# [1.5.0](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.4.0...@formatjs/icu-skeleton-parser@1.5.0) (2023-06-06)

### Features

* **@formatjs/intl,@formatjs/fast-memoize,@formatjs/icu-messageformat-parser,@formatjs/intl-displaynames,@formatjs/intl-listformat,intl-messageformat,@formatjs/ecma402-abstract,@formatjs/intl-numberformat,@formatjs/icu-skeleton-parser:** esm conditional exports ([#4109](https://github.com/formatjs/formatjs/issues/4109)) ([e0d593c](https://github.com/formatjs/formatjs/commit/e0d593cc3af3a317a6bd20c441191e5bbb136a93)), closes [#4013](https://github.com/formatjs/formatjs/issues/4013)

# [1.4.0](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.3.18...@formatjs/icu-skeleton-parser@1.4.0) (2023-05-01)

### Features

* upgrade TS support to v5 ([2c43dc1](https://github.com/formatjs/formatjs/commit/2c43dc1275d7ca940fae80419e3d6e4143bfbfef))

## [1.3.18](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.3.17...@formatjs/icu-skeleton-parser@1.3.18) (2022-12-02)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.3.17](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.3.15...@formatjs/icu-skeleton-parser@1.3.17) (2022-12-01)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.3.16](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.3.15...@formatjs/icu-skeleton-parser@1.3.16) (2022-12-01)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.3.15](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.3.14...@formatjs/icu-skeleton-parser@1.3.15) (2022-11-29)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.3.14](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.3.13...@formatjs/icu-skeleton-parser@1.3.14) (2022-10-13)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.3.13](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.3.12...@formatjs/icu-skeleton-parser@1.3.13) (2022-08-27)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.3.12](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.3.11...@formatjs/icu-skeleton-parser@1.3.12) (2022-08-21)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.3.11](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.3.10...@formatjs/icu-skeleton-parser@1.3.11) (2022-08-18)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.3.10](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.3.9...@formatjs/icu-skeleton-parser@1.3.10) (2022-07-04)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.3.9](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.3.8...@formatjs/icu-skeleton-parser@1.3.9) (2022-06-06)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.3.8](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.3.7...@formatjs/icu-skeleton-parser@1.3.8) (2022-05-19)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.3.7](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.3.6...@formatjs/icu-skeleton-parser@1.3.7) (2022-05-19)

### Bug Fixes

* **react-intl:** fix type issue with react18, fix [#3550](https://github.com/formatjs/formatjs/issues/3550) ([2567b93](https://github.com/formatjs/formatjs/commit/2567b932c5d18b097a43842563046c20ce0c49f1))

## [1.3.6](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.3.5...@formatjs/icu-skeleton-parser@1.3.6) (2022-03-26)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.3.5](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.3.4...@formatjs/icu-skeleton-parser@1.3.5) (2022-02-06)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.3.4](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.3.3...@formatjs/icu-skeleton-parser@1.3.4) (2022-01-24)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.3.3](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.3.2...@formatjs/icu-skeleton-parser@1.3.3) (2022-01-03)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.3.2](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.3.1...@formatjs/icu-skeleton-parser@1.3.2) (2021-12-01)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.3.1](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.3.0...@formatjs/icu-skeleton-parser@1.3.1) (2021-10-22)

### Bug Fixes

* **@formatjs/icu-skeleton-parser:** update package.json to include the repository ([#3230](https://github.com/formatjs/formatjs/issues/3230)) ([36dc6bc](https://github.com/formatjs/formatjs/commit/36dc6bc5d8049caaf377f378d81eb6703eb091d5))

# [1.3.0](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.2.13...@formatjs/icu-skeleton-parser@1.3.0) (2021-10-17)

### Features

* **@formatjs/icu-skeleton-parser:** parse out NumberFormat v3 options, fix [#3191](https://github.com/formatjs/formatjs/issues/3191) ([24e14d0](https://github.com/formatjs/formatjs/commit/24e14d072467401727a5a96324e5d7e7b758c630))

## [1.2.13](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.2.12...@formatjs/icu-skeleton-parser@1.2.13) (2021-09-27)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.2.12](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.2.11...@formatjs/icu-skeleton-parser@1.2.12) (2021-08-21)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.2.11](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.2.10...@formatjs/icu-skeleton-parser@1.2.11) (2021-08-15)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.2.10](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.2.9...@formatjs/icu-skeleton-parser@1.2.10) (2021-08-06)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.2.9](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.2.8...@formatjs/icu-skeleton-parser@1.2.9) (2021-07-24)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.2.8](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.2.7...@formatjs/icu-skeleton-parser@1.2.8) (2021-06-26)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.2.7](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.2.6...@formatjs/icu-skeleton-parser@1.2.7) (2021-06-05)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.2.6](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.2.5...@formatjs/icu-skeleton-parser@1.2.6) (2021-06-01)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.2.5](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.2.4...@formatjs/icu-skeleton-parser@1.2.5) (2021-05-23)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.2.4](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.2.3...@formatjs/icu-skeleton-parser@1.2.4) (2021-05-20)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.2.3](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.2.2...@formatjs/icu-skeleton-parser@1.2.3) (2021-05-17)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.2.2](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.2.1...@formatjs/icu-skeleton-parser@1.2.2) (2021-05-10)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.2.0...@formatjs/icu-skeleton-parser@1.2.1) (2021-04-26)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

# [1.2.0](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.1.2...@formatjs/icu-skeleton-parser@1.2.0) (2021-04-26)

### Features

* **@formatjs/icu-skeleton-parser:** expose ESM entry point ([97f4d38](https://github.com/formatjs/formatjs/commit/97f4d389c521df7cec055d7bac46c8ecb5f32aff))

## [1.1.2](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.1.1...@formatjs/icu-skeleton-parser@1.1.2) (2021-04-12)

**Note:** Version bump only for package @formatjs/icu-skeleton-parser

## [1.1.1](https://github.com/formatjs/formatjs/compare/@formatjs/icu-skeleton-parser@1.1.0...@formatjs/icu-skeleton-parser@1.1.1) (2021-03-28)

### Bug Fixes

* **@formatjs/icu-skeleton-parser:** fix missing dep, fix [#2760](https://github.com/formatjs/formatjs/issues/2760) ([ddcb76a](https://github.com/formatjs/formatjs/commit/ddcb76a5b567cf6b53d80eec04d733a637ebe886))

# 1.1.0 (2021-03-26)

### Features

* **@formatjs/icu-messageformat-parser:** add skeleton parsing ([3eec04d](https://github.com/formatjs/formatjs/commit/3eec04d033891ce5192b692f9b079a672b6aae47))
* **@formatjs/icu-skeleton-parser:** add package ([f6e9aeb](https://github.com/formatjs/formatjs/commit/f6e9aebe56624b8d473be848c68be620827593c2))

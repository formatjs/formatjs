# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 3.1.6 (2026-06-03)

## What's Changed
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


**Full Changelog**: https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@3.1.5...@formatjs/fast-memoize@3.1.6

## [3.1.5](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@3.1.4...@formatjs/fast-memoize@3.1.5) (2026-05-12)

**Note:** Version bump only for package @formatjs/fast-memoize

## [3.1.4](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@3.1.3...@formatjs/fast-memoize@3.1.4) (2026-05-05)

**Note:** Version bump only for package @formatjs/fast-memoize

## [3.1.3](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@3.1.2...@formatjs/fast-memoize@3.1.3) (2026-04-29)

**Note:** Version bump only for package @formatjs/fast-memoize

## [3.1.2](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@3.1.1...@formatjs/fast-memoize@3.1.2) (2026-04-13)

### Reverts

* **deps:** revert gazelle migration phases 1-3 ([#6205](https://github.com/formatjs/formatjs/issues/6205)) ([4c04aa2](https://github.com/formatjs/formatjs/commit/4c04aa2726107ab1d0b9dab8a54a82fa62a73680)), closes [#6197](https://github.com/formatjs/formatjs/issues/6197) [#6198](https://github.com/formatjs/formatjs/issues/6198) [#6199](https://github.com/formatjs/formatjs/issues/6199) [#6195](https://github.com/formatjs/formatjs/issues/6195) [#6196](https://github.com/formatjs/formatjs/issues/6196) - by @longlho

## [3.1.1](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@3.1.0...@formatjs/fast-memoize@3.1.1) (2026-03-16)

**Note:** Version bump only for package @formatjs/fast-memoize

# [3.1.0](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@3.0.3...@formatjs/fast-memoize@3.1.0) (2026-01-15)

### Features

* **@formatjs/intl-segmenter:** improve Unicode 17.0 Format/Extend transparency and upgrade deps ([#5862](https://github.com/formatjs/formatjs/issues/5862)) ([effeb9c](https://github.com/formatjs/formatjs/commit/effeb9cd9d26f8c43c1e3df64a84c42dc7b12043)), closes [#29](https://github.com/formatjs/formatjs/issues/29) - by @longlho

## [3.0.3](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@3.0.2...@formatjs/fast-memoize@3.0.3) (2026-01-06)

**Note:** Version bump only for package @formatjs/fast-memoize

## [3.0.2](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@3.0.1...@formatjs/fast-memoize@3.0.2) (2026-01-02)

**Note:** Version bump only for package @formatjs/fast-memoize

## [3.0.1](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@3.0.0...@formatjs/fast-memoize@3.0.1) (2025-12-15)

**Note:** Version bump only for package @formatjs/fast-memoize

## [3.0.0](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@2.2.7...@formatjs/fast-memoize@3.0.0) (2025-12-15)

### ⚠ BREAKING CHANGES

* **@formatjs/fast-memoize:** convert to esm (#5467)

### Features

* **@formatjs/fast-memoize:** convert to esm ([#5467](https://github.com/formatjs/formatjs/issues/5467)) ([fd0cd2b](https://github.com/formatjs/formatjs/commit/fd0cd2b4e898dc26d97a4381509da8c0d47829b6)) - by @longlho

### Bug Fixes

* **@formatjs/fast-memoize:** fix type ([b05e217](https://github.com/formatjs/formatjs/commit/b05e217c01cb89a80eefb1d26b2c3f239c7b0c82)) - by @longlho

## [2.2.7](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@2.2.6...@formatjs/fast-memoize@2.2.7) (2025-03-23)

**Note:** Version bump only for package @formatjs/fast-memoize

## [2.2.6](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@2.2.5...@formatjs/fast-memoize@2.2.6) (2025-01-02)

**Note:** Version bump only for package @formatjs/fast-memoize

## [2.2.5](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@2.2.4...@formatjs/fast-memoize@2.2.5) (2024-12-09)

### Bug Fixes

* turn on isolatedDeclarations and specify explicit types everywhere ([4d855c2](https://github.com/formatjs/formatjs/commit/4d855c2324426633eb84c346c76a5fd1ac854780)) - by @longlho

## [2.2.4](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@2.2.3...@formatjs/fast-memoize@2.2.4) (2024-12-08)

### Bug Fixes

* **@formatjs/fast-memoize:** fix type ([f9c95dd](https://github.com/formatjs/formatjs/commit/f9c95dd383c6933707912e9181bcc87386ca34ea)), closes [#4725](https://github.com/formatjs/formatjs/issues/4725) - by @longlho

## [2.2.3](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@2.2.2...@formatjs/fast-memoize@2.2.3) (2024-11-02)

**Note:** Version bump only for package @formatjs/fast-memoize

## [2.2.2](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@2.2.1...@formatjs/fast-memoize@2.2.2) (2024-10-25)

### Bug Fixes

* relax tslib req to 2 instead of 2.7 ([930c3e8](https://github.com/formatjs/formatjs/commit/930c3e8ddcc160fde7466449575455f135f78ca6)) - by @longlho

## [2.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@2.2.0...@formatjs/fast-memoize@2.2.1) (2024-10-12)

### Bug Fixes

* **@formatjs/intl-durationformat:** add polyfill detector + docs ([d6d237a](https://github.com/formatjs/formatjs/commit/d6d237a2ffca73d5e3824df17bf5ebf7e7b135a8)) - by @

# [2.2.0](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@2.1.0...@formatjs/fast-memoize@2.2.0) (2023-06-12)

### Features

* **@formatjs/intl,@formatjs/fast-memoize,@formatjs/icu-messageformat-parser,@formatjs/intl-displaynames,@formatjs/intl-listformat,intl-messageformat,@formatjs/ecma402-abstract,@formatjs/intl-numberformat,@formatjs/icu-skeleton-parser:** Revert esm conditional exports ([#4129](https://github.com/formatjs/formatjs/issues/4129)) ([78edf46](https://github.com/formatjs/formatjs/commit/78edf460a466a7021e3753be53fd9c6af00f2d96)), closes [#4128](https://github.com/formatjs/formatjs/issues/4128) [#4127](https://github.com/formatjs/formatjs/issues/4127) [#4126](https://github.com/formatjs/formatjs/issues/4126)

# [2.1.0](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@2.0.1...@formatjs/fast-memoize@2.1.0) (2023-06-06)

### Features

* **@formatjs/intl,@formatjs/fast-memoize,@formatjs/icu-messageformat-parser,@formatjs/intl-displaynames,@formatjs/intl-listformat,intl-messageformat,@formatjs/ecma402-abstract,@formatjs/intl-numberformat,@formatjs/icu-skeleton-parser:** esm conditional exports ([#4109](https://github.com/formatjs/formatjs/issues/4109)) ([e0d593c](https://github.com/formatjs/formatjs/commit/e0d593cc3af3a317a6bd20c441191e5bbb136a93)), closes [#4013](https://github.com/formatjs/formatjs/issues/4013)

## [2.0.1](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@2.0.0...@formatjs/fast-memoize@2.0.1) (2023-03-21)

### Bug Fixes

* **@formatjs/fast-memoize:** remove exports field ([#4033](https://github.com/formatjs/formatjs/issues/4033)) ([88318f4](https://github.com/formatjs/formatjs/commit/88318f44619b27ded697b6994951e576928b8e3a))

## [1.2.8](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@1.2.7...@formatjs/fast-memoize@1.2.8) (2023-01-26)

### Bug Fixes

* **@formatjs/fast-memoize:** correct Cache.get return type ([#3964](https://github.com/formatjs/formatjs/issues/3964)) ([31b2d5d](https://github.com/formatjs/formatjs/commit/31b2d5dac8da76a7a050e71b019f28418e9139e4))

## [1.2.7](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@1.2.6...@formatjs/fast-memoize@1.2.7) (2022-12-02)

**Note:** Version bump only for package @formatjs/fast-memoize

## [1.2.6](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@1.2.5...@formatjs/fast-memoize@1.2.6) (2022-08-21)

**Note:** Version bump only for package @formatjs/fast-memoize

## [1.2.5](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@1.2.4...@formatjs/fast-memoize@1.2.5) (2022-08-18)

**Note:** Version bump only for package @formatjs/fast-memoize

## [1.2.4](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@1.2.3...@formatjs/fast-memoize@1.2.4) (2022-06-06)

**Note:** Version bump only for package @formatjs/fast-memoize

## [1.2.3](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@1.2.2...@formatjs/fast-memoize@1.2.3) (2022-05-19)

**Note:** Version bump only for package @formatjs/fast-memoize

## [1.2.2](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@1.2.1...@formatjs/fast-memoize@1.2.2) (2022-05-19)

### Bug Fixes

* **react-intl:** fix type issue with react18, fix [#3550](https://github.com/formatjs/formatjs/issues/3550) ([2567b93](https://github.com/formatjs/formatjs/commit/2567b932c5d18b097a43842563046c20ce0c49f1))

## [1.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@1.2.0...@formatjs/fast-memoize@1.2.1) (2021-12-20)

### Bug Fixes

* **@formatjs/fast-memoize:** fixed fast-memoize package license information ([#3301](https://github.com/formatjs/formatjs/issues/3301)) ([ff7ea83](https://github.com/formatjs/formatjs/commit/ff7ea837cabf7d82b7e0d808c753557bec1a63b2))

# [1.2.0](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@1.1.2...@formatjs/fast-memoize@1.2.0) (2021-08-15)

### Features

* **@formatjs/fast-memoize:** remove unused Cache.has ([#3102](https://github.com/formatjs/formatjs/issues/3102)) ([5e9a425](https://github.com/formatjs/formatjs/commit/5e9a425519fd2b2473172687fccb58a6979ec81e))

## [1.1.2](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@1.1.1...@formatjs/fast-memoize@1.1.2) (2021-08-06)

**Note:** Version bump only for package @formatjs/fast-memoize

## [1.1.1](https://github.com/formatjs/formatjs/compare/@formatjs/fast-memoize@1.1.0...@formatjs/fast-memoize@1.1.1) (2021-04-26)

### Bug Fixes

* **@formatjs/fast-memoize:** expose ESM module ([c68e850](https://github.com/formatjs/formatjs/commit/c68e8508956ec6e3f13e2f0aed0419fcd2c453ce))

# 1.1.0 (2021-04-26)

### Features

* **@formatjs/fast-memoize:** publish our fork ([18026f0](https://github.com/formatjs/formatjs/commit/18026f0a5f986a385efd3793ce9190024a3f903c))

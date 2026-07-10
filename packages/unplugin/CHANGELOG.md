# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 1.2.1 (2026-07-10)

## What's Changed
* fix(@formatjs/icu-skeleton-parser): map e/c weekday counts 4/5/6 to long/narrow/short by @spokodev in https://github.com/formatjs/formatjs/pull/6852
* fix(deps): materialize published package manifests by @longlho in https://github.com/formatjs/formatjs/pull/6844
* feat(@formatjs/intl-datetimeformat): update IANA timezone database to 2026c by @longlho in https://github.com/formatjs/formatjs/pull/6854
* build(@formatjs/intl-datetimeformat): make tzdata generation hermetic by @longlho in https://github.com/formatjs/formatjs/pull/6855


**Full Changelog**: https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.2.0...@formatjs/unplugin@1.2.1


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/icu-messageformat-parser bumped to 3.5.14
    * @formatjs/ts-transformer bumped to 4.4.16

## 1.2.0 (2026-07-09)

## What's Changed
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
* @greymoth-jp made their first contribution in https://github.com/formatjs/formatjs/pull/6835
* @spokodev made their first contribution in https://github.com/formatjs/formatjs/pull/6837

**Full Changelog**: https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.1.20...@formatjs/unplugin@1.2.0


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/icu-messageformat-parser bumped to 3.5.13
    * @formatjs/ts-transformer bumped to 4.4.15

## 1.1.20 (2026-06-25)

## What's Changed
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

## New Contributors
* @Amund211 made their first contribution in https://github.com/formatjs/formatjs/pull/6802

**Full Changelog**: https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.1.19...@formatjs/unplugin@1.1.20


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/icu-messageformat-parser bumped to 3.5.12
    * @formatjs/ts-transformer bumped to 4.4.14

## 1.1.19 (2026-06-05)

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


**Full Changelog**: https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.1.18...@formatjs/unplugin@1.1.19


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/ts-transformer bumped to 4.4.13

## 1.1.18 (2026-06-03)

## What's Changed
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


**Full Changelog**: https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.1.17...@formatjs/unplugin@1.1.18


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/icu-messageformat-parser bumped to 3.5.11
    * @formatjs/ts-transformer bumped to 4.4.12

## 1.1.17 (2026-05-27)

## What's Changed
* chore(deps): update dependency rolldown to v1.0.2 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6669
* chore(deps): update dependency svelte to v5.55.9 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6670
* chore(deps): update dependency @rspack/core to v2.0.4 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6671
* chore(deps): update dependency vitest to v4.1.7 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6672
* chore(deps): update pnpm to v11.2.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6674
* chore(deps): update dependency webpack to v5.107.0 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6673
* chore: add codescythe hook by @longlho in https://github.com/formatjs/formatjs/pull/6668
* chore(deps): update pnpm to v11.2.1 by @renovate[bot] in https://github.com/formatjs/formatjs/pull/6675


**Full Changelog**: https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.1.16...@formatjs/unplugin@1.1.17


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/ts-transformer bumped to 4.4.11

## 1.1.16 (2026-05-27)

## What's Changed
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


**Full Changelog**: https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.1.15...@formatjs/unplugin@1.1.16

## [1.1.15](https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.1.14...@formatjs/unplugin@1.1.15) (2026-05-22)

### Bug Fixes

* **@formatjs/unplugin:** expose transform hook filters ([#6622](https://github.com/formatjs/formatjs/issues/6622)) ([8af2bff](https://github.com/formatjs/formatjs/commit/8af2bff584291ba119dec6df5fb88bf066d523e8)), closes [#6620](https://github.com/formatjs/formatjs/issues/6620) - by @longlho
* **deps:** update dependency oxc-parser to ^0.131.0 ([#6628](https://github.com/formatjs/formatjs/issues/6628)) ([624bd29](https://github.com/formatjs/formatjs/commit/624bd29d1ebd002168e716f49a3dd62b1a99850d)) - by @renovate[bot]

## [1.1.14](https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.1.13...@formatjs/unplugin@1.1.14) (2026-05-22)

### Bug Fixes

* **@formatjs/unplugin:** preserve escaped tag literals when flattening ([#6599](https://github.com/formatjs/formatjs/issues/6599)) ([56e4b0b](https://github.com/formatjs/formatjs/commit/56e4b0bc41fc806cb4a81c7fe2b1ea1f4ceefaba)), closes [#6593](https://github.com/formatjs/formatjs/issues/6593) - by @longlho
* **@formatjs/unplugin:** preserve JSX defaultMessage output ([#6608](https://github.com/formatjs/formatjs/issues/6608)) ([bdff3ae](https://github.com/formatjs/formatjs/commit/bdff3ae51bb89562ad3e95ff34d78826c48a41c9)), closes [#6606](https://github.com/formatjs/formatjs/issues/6606) - by @longlho

## [1.1.13](https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.1.12...@formatjs/unplugin@1.1.13) (2026-05-19)

**Note:** Version bump only for package @formatjs/unplugin

## [1.1.12](https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.1.11...@formatjs/unplugin@1.1.12) (2026-05-15)

**Note:** Version bump only for package @formatjs/unplugin

## [1.1.11](https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.1.10...@formatjs/unplugin@1.1.11) (2026-05-12)

### Bug Fixes

* **deps:** update dependency oxc-parser to ^0.130.0 ([#6527](https://github.com/formatjs/formatjs/issues/6527)) ([9e4d5ea](https://github.com/formatjs/formatjs/commit/9e4d5eadff24e650a1f40c4fbcd2807488b29a6c)) - by @renovate[bot]

## [1.1.10](https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.1.9...@formatjs/unplugin@1.1.10) (2026-05-05)

### Bug Fixes

* **formatjs:** support TS assertions in message extraction ([#6475](https://github.com/formatjs/formatjs/issues/6475)) ([06e7cf6](https://github.com/formatjs/formatjs/commit/06e7cf6c25b83012cb023fb7882cdffd9f370012)), closes [#6474](https://github.com/formatjs/formatjs/issues/6474) - by @longlho

## [1.1.9](https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.1.8...@formatjs/unplugin@1.1.9) (2026-04-29)

### Bug Fixes

* **@formatjs/unplugin:** strip query/hash in transformInclude ([#6465](https://github.com/formatjs/formatjs/issues/6465)) ([2fcf7f3](https://github.com/formatjs/formatjs/commit/2fcf7f3015138814efc5550da9c117d9fc11c54d)), closes [#6455](https://github.com/formatjs/formatjs/issues/6455) - by @longlho
* **deps:** update dependency oxc-parser to ^0.128.0 ([#6457](https://github.com/formatjs/formatjs/issues/6457)) ([c281a36](https://github.com/formatjs/formatjs/commit/c281a36db86d4f8e3370010bc568dc9852b59e5e)) - by @renovate[bot]

## [1.1.8](https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.1.7...@formatjs/unplugin@1.1.8) (2026-04-24)

### Bug Fixes

* **deps:** update dependency oxc-parser to ^0.126.0 ([#6395](https://github.com/formatjs/formatjs/issues/6395)) ([1664958](https://github.com/formatjs/formatjs/commit/16649581628d1283db5595b5aa8dea77acd381fa)) - by @renovate[bot]
* **deps:** update dependency oxc-parser to ^0.127.0 ([#6422](https://github.com/formatjs/formatjs/issues/6422)) ([7aad4bc](https://github.com/formatjs/formatjs/commit/7aad4bc695f6501f94b3860b056f3ebb64a9c7d3)) - by @renovate[bot]

## [1.1.7](https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.1.6...@formatjs/unplugin@1.1.7) (2026-04-13)

### Bug Fixes

* **deps:** update dependency oxc-parser to ^0.124.0 ([#6332](https://github.com/formatjs/formatjs/issues/6332)) ([130c55b](https://github.com/formatjs/formatjs/commit/130c55bcb536054781370f2b6d34436bf0000ca9)) - by @renovate[bot]

### Reverts

* **deps:** revert gazelle migration phases 1-3 ([#6205](https://github.com/formatjs/formatjs/issues/6205)) ([4c04aa2](https://github.com/formatjs/formatjs/commit/4c04aa2726107ab1d0b9dab8a54a82fa62a73680)), closes [#6197](https://github.com/formatjs/formatjs/issues/6197) [#6198](https://github.com/formatjs/formatjs/issues/6198) [#6199](https://github.com/formatjs/formatjs/issues/6199) [#6195](https://github.com/formatjs/formatjs/issues/6195) [#6196](https://github.com/formatjs/formatjs/issues/6196) - by @longlho

## [1.1.6](https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.1.5...@formatjs/unplugin@1.1.6) (2026-03-27)

**Note:** Version bump only for package @formatjs/unplugin

## [1.1.5](https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.1.4...@formatjs/unplugin@1.1.5) (2026-03-23)

### Bug Fixes

* **@formatjs/unplugin:** add flatten option to match babel-plugin-formatjs ID generation ([#6178](https://github.com/formatjs/formatjs/issues/6178)) ([9cc3087](https://github.com/formatjs/formatjs/commit/9cc3087bfd45a85982313e0597f1052787574349)), closes [#6177](https://github.com/formatjs/formatjs/issues/6177) - by @longlho

## [1.1.4](https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.1.3...@formatjs/unplugin@1.1.4) (2026-03-20)

**Note:** Version bump only for package @formatjs/unplugin

## [1.1.3](https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.1.2...@formatjs/unplugin@1.1.3) (2026-03-19)

### Bug Fixes

* **@formatjs/unplugin:** preserve space when removing JSX attribute on single line ([#6165](https://github.com/formatjs/formatjs/issues/6165)) ([db32215](https://github.com/formatjs/formatjs/commit/db322150e03bcd642ffe0a641d33aa62ae5596be)), closes [#6164](https://github.com/formatjs/formatjs/issues/6164) - by @longlho
* **deps:** update oxlint monorepo ([#6134](https://github.com/formatjs/formatjs/issues/6134)) ([d62295b](https://github.com/formatjs/formatjs/commit/d62295b3f8e8bfa7fe548a4e23b2629d2d86f10c)) - by @renovate[bot]

## [1.1.2](https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.1.1...@formatjs/unplugin@1.1.2) (2026-03-17)

### Bug Fixes

* **deps:** update dependency unplugin to v3 ([#6143](https://github.com/formatjs/formatjs/issues/6143)) ([4c99e28](https://github.com/formatjs/formatjs/commit/4c99e289949b5d0b195d8f5529eb925837e5437b)) - by @renovate[bot]

## [1.1.1](https://github.com/formatjs/formatjs/compare/@formatjs/unplugin@1.1.0...@formatjs/unplugin@1.1.1) (2026-03-17)

**Note:** Version bump only for package @formatjs/unplugin

# 1.1.0 (2026-03-16)

### Features

* **@formatjs/unplugin:** universal build plugin for Vite, Webpack, Rollup, esbuild, Rspack ([#6096](https://github.com/formatjs/formatjs/issues/6096)) ([371eadd](https://github.com/formatjs/formatjs/commit/371eadd0c82cdef37edc09d19ecaeed92ac30a75)), closes [#1](https://github.com/formatjs/formatjs/issues/1) - by @longlho

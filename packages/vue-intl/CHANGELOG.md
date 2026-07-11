# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 7.2.13 (2026-07-11)

## What's Changed
* fix(@formatjs/icu-skeleton-parser): map e/c weekday counts 4/5/6 to long/narrow/short by @spokodev in https://github.com/formatjs/formatjs/pull/6852
* fix(deps): materialize published package manifests by @longlho in https://github.com/formatjs/formatjs/pull/6844
* feat(@formatjs/intl-datetimeformat): update IANA timezone database to 2026c by @longlho in https://github.com/formatjs/formatjs/pull/6854
* build(@formatjs/intl-datetimeformat): make tzdata generation hermetic by @longlho in https://github.com/formatjs/formatjs/pull/6855
* fix(deps): update package manifests in release PRs by @longlho in https://github.com/formatjs/formatjs/pull/6856
* docs: update upgrade guide to reflect relaxed React 18 support by @yslpn in https://github.com/formatjs/formatjs/pull/6818

## New Contributors
* @yslpn made their first contribution in https://github.com/formatjs/formatjs/pull/6818

**Full Changelog**: https://github.com/formatjs/formatjs/compare/vue-intl@7.2.12...vue-intl@7.2.13


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/icu-messageformat-parser bumped to 3.5.14
    * @formatjs/intl bumped to 4.1.16

## 7.2.12 (2026-07-09)

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

**Full Changelog**: https://github.com/formatjs/formatjs/compare/vue-intl@7.2.11...vue-intl@7.2.12


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/icu-messageformat-parser bumped to 3.5.13
    * @formatjs/intl bumped to 4.1.15

## 7.2.11 (2026-06-25)

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

## New Contributors
* @Amund211 made their first contribution in https://github.com/formatjs/formatjs/pull/6802

**Full Changelog**: https://github.com/formatjs/formatjs/compare/vue-intl@7.2.10...vue-intl@7.2.11


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/icu-messageformat-parser bumped to 3.5.12
    * @formatjs/intl bumped to 4.1.14

## 7.2.10 (2026-06-03)

## What's Changed
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


**Full Changelog**: https://github.com/formatjs/formatjs/compare/vue-intl@7.2.9...vue-intl@7.2.10


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @formatjs/icu-messageformat-parser bumped to 3.5.11
    * @formatjs/intl bumped to 4.1.13

## [7.2.9](https://github.com/formatjs/formatjs/compare/vue-intl@7.2.8...vue-intl@7.2.9) (2026-05-22)

**Note:** Version bump only for package vue-intl

## [7.2.8](https://github.com/formatjs/formatjs/compare/vue-intl@7.2.7...vue-intl@7.2.8) (2026-05-15)

**Note:** Version bump only for package vue-intl

## [7.2.7](https://github.com/formatjs/formatjs/compare/vue-intl@7.2.6...vue-intl@7.2.7) (2026-05-12)

**Note:** Version bump only for package vue-intl

## [7.2.6](https://github.com/formatjs/formatjs/compare/vue-intl@7.2.5...vue-intl@7.2.6) (2026-05-05)

**Note:** Version bump only for package vue-intl

## [7.2.5](https://github.com/formatjs/formatjs/compare/vue-intl@7.2.4...vue-intl@7.2.5) (2026-04-29)

**Note:** Version bump only for package vue-intl

## [7.2.4](https://github.com/formatjs/formatjs/compare/vue-intl@7.2.3...vue-intl@7.2.4) (2026-04-24)

**Note:** Version bump only for package vue-intl

## [7.2.3](https://github.com/formatjs/formatjs/compare/vue-intl@7.2.2...vue-intl@7.2.3) (2026-04-13)

### Reverts

* **deps:** revert gazelle migration phases 1-3 ([#6205](https://github.com/formatjs/formatjs/issues/6205)) ([4c04aa2](https://github.com/formatjs/formatjs/commit/4c04aa2726107ab1d0b9dab8a54a82fa62a73680)), closes [#6197](https://github.com/formatjs/formatjs/issues/6197) [#6198](https://github.com/formatjs/formatjs/issues/6198) [#6199](https://github.com/formatjs/formatjs/issues/6199) [#6195](https://github.com/formatjs/formatjs/issues/6195) [#6196](https://github.com/formatjs/formatjs/issues/6196) - by @longlho

## [7.2.2](https://github.com/formatjs/formatjs/compare/vue-intl@7.2.1...vue-intl@7.2.2) (2026-03-27)

**Note:** Version bump only for package vue-intl

## [7.2.1](https://github.com/formatjs/formatjs/compare/vue-intl@7.2.0...vue-intl@7.2.1) (2026-03-17)

**Note:** Version bump only for package vue-intl

# [7.2.0](https://github.com/formatjs/formatjs/compare/vue-intl@7.1.4...vue-intl@7.2.0) (2026-03-17)

### Features

* **@formatjs/cli-lib:** add AbortSignal support to extract() and compile() ([#6131](https://github.com/formatjs/formatjs/issues/6131)) ([19fd7e0](https://github.com/formatjs/formatjs/commit/19fd7e07049d44a5f3b282d3930616690d9fb3e6)), closes [#6067](https://github.com/formatjs/formatjs/issues/6067) - by @longlho

## [7.1.4](https://github.com/formatjs/formatjs/compare/vue-intl@7.1.3...vue-intl@7.1.4) (2026-03-16)

**Note:** Version bump only for package vue-intl

## [7.1.3](https://github.com/formatjs/formatjs/compare/vue-intl@7.1.2...vue-intl@7.1.3) (2026-02-25)

### Bug Fixes

* **vue-intl:** loosen vue peer dependency to allow newer versions ([#6043](https://github.com/formatjs/formatjs/issues/6043)) ([88afa55](https://github.com/formatjs/formatjs/commit/88afa55da4422a4a3a6f7e43826f24f2534689e5)), closes [#6040](https://github.com/formatjs/formatjs/issues/6040) - by @longlho

## [7.1.2](https://github.com/formatjs/formatjs/compare/vue-intl@7.1.1...vue-intl@7.1.2) (2026-02-01)

**Note:** Version bump only for package vue-intl

## [7.1.1](https://github.com/formatjs/formatjs/compare/vue-intl@7.1.0...vue-intl@7.1.1) (2026-01-19)

**Note:** Version bump only for package vue-intl

# [7.1.0](https://github.com/formatjs/formatjs/compare/vue-intl@7.0.9...vue-intl@7.1.0) (2026-01-15)

### Features

* **@formatjs/intl-segmenter:** improve Unicode 17.0 Format/Extend transparency and upgrade deps ([#5862](https://github.com/formatjs/formatjs/issues/5862)) ([effeb9c](https://github.com/formatjs/formatjs/commit/effeb9cd9d26f8c43c1e3df64a84c42dc7b12043)), closes [#29](https://github.com/formatjs/formatjs/issues/29) - by @longlho

## [7.0.9](https://github.com/formatjs/formatjs/compare/vue-intl@7.0.8...vue-intl@7.0.9) (2026-01-06)

**Note:** Version bump only for package vue-intl

## [7.0.8](https://github.com/formatjs/formatjs/compare/vue-intl@7.0.7...vue-intl@7.0.8) (2026-01-02)

**Note:** Version bump only for package vue-intl

## [7.0.7](https://github.com/formatjs/formatjs/compare/vue-intl@7.0.6...vue-intl@7.0.7) (2025-12-26)

**Note:** Version bump only for package vue-intl

## [7.0.6](https://github.com/formatjs/formatjs/compare/vue-intl@7.0.5...vue-intl@7.0.6) (2025-12-23)

**Note:** Version bump only for package vue-intl

## [7.0.5](https://github.com/formatjs/formatjs/compare/vue-intl@7.0.4...vue-intl@7.0.5) (2025-12-23)

**Note:** Version bump only for package vue-intl

## [7.0.4](https://github.com/formatjs/formatjs/compare/vue-intl@7.0.3...vue-intl@7.0.4) (2025-12-19)

**Note:** Version bump only for package vue-intl

## [7.0.3](https://github.com/formatjs/formatjs/compare/vue-intl@7.0.2...vue-intl@7.0.3) (2025-12-18)

**Note:** Version bump only for package vue-intl

## [7.0.2](https://github.com/formatjs/formatjs/compare/vue-intl@7.0.1...vue-intl@7.0.2) (2025-12-17)

**Note:** Version bump only for package vue-intl

## [7.0.1](https://github.com/formatjs/formatjs/compare/vue-intl@7.0.0...vue-intl@7.0.1) (2025-12-15)

**Note:** Version bump only for package vue-intl

## [7.0.0](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.27...vue-intl@7.0.0) (2025-12-15)

### ⚠ BREAKING CHANGES

* **vue-intl:** convert to ESM

### Features

* **vue-intl:** convert to ESM ([3d498b5](https://github.com/formatjs/formatjs/commit/3d498b5cde188724ff0ea64701e59fbde312745c)) - by @longlho

## [6.5.27](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.26...vue-intl@6.5.27) (2025-10-09)

**Note:** Version bump only for package vue-intl

## [6.5.26](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.25...vue-intl@6.5.26) (2025-10-03)

**Note:** Version bump only for package vue-intl

## [6.5.25](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.24...vue-intl@6.5.25) (2025-03-26)

**Note:** Version bump only for package vue-intl

## [6.5.24](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.23...vue-intl@6.5.24) (2025-03-23)

### Bug Fixes

* **babel-plugin-formatjs:** update [@babel](https://github.com/babel) dep for security fix ([13075e1](https://github.com/formatjs/formatjs/commit/13075e176dc8975345061d4d4781ddb1da6b5703)), closes [#4908](https://github.com/formatjs/formatjs/issues/4908) - by @longlho

## [6.5.23](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.22...vue-intl@6.5.23) (2025-02-09)

**Note:** Version bump only for package vue-intl

## [6.5.22](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.21...vue-intl@6.5.22) (2025-01-20)

**Note:** Version bump only for package vue-intl

## [6.5.21](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.20...vue-intl@6.5.21) (2025-01-20)

**Note:** Version bump only for package vue-intl

## [6.5.20](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.19...vue-intl@6.5.20) (2025-01-17)

**Note:** Version bump only for package vue-intl

## [6.5.19](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.18...vue-intl@6.5.19) (2025-01-02)

**Note:** Version bump only for package vue-intl

## [6.5.18](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.17...vue-intl@6.5.18) (2024-12-09)

**Note:** Version bump only for package vue-intl

## [6.5.17](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.16...vue-intl@6.5.17) (2024-12-09)

### Bug Fixes

* turn on isolatedDeclarations and specify explicit types everywhere ([4d855c2](https://github.com/formatjs/formatjs/commit/4d855c2324426633eb84c346c76a5fd1ac854780)) - by @longlho

## [6.5.16](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.15...vue-intl@6.5.16) (2024-12-08)

### Bug Fixes

* **vue-intl:** fix gts extractor and types after upgrade ([2b97a63](https://github.com/formatjs/formatjs/commit/2b97a63d2155abab131aa96f5840879e20e6dbe9)) - by @longlho

## [6.5.15](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.14...vue-intl@6.5.15) (2024-11-18)

**Note:** Version bump only for package vue-intl

## [6.5.14](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.13...vue-intl@6.5.14) (2024-11-18)

**Note:** Version bump only for package vue-intl

## [6.5.13](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.12...vue-intl@6.5.13) (2024-11-18)

**Note:** Version bump only for package vue-intl

## [6.5.12](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.11...vue-intl@6.5.12) (2024-11-05)

**Note:** Version bump only for package vue-intl

## [6.5.11](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.10...vue-intl@6.5.11) (2024-11-04)

**Note:** Version bump only for package vue-intl

## [6.5.10](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.9...vue-intl@6.5.10) (2024-11-02)

**Note:** Version bump only for package vue-intl

## [6.5.9](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.8...vue-intl@6.5.9) (2024-10-25)

### Bug Fixes

* relax tslib req to 2 instead of 2.7 ([930c3e8](https://github.com/formatjs/formatjs/commit/930c3e8ddcc160fde7466449575455f135f78ca6)) - by @longlho

## [6.5.8](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.7...vue-intl@6.5.8) (2024-10-25)

**Note:** Version bump only for package vue-intl

## [6.5.7](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.6...vue-intl@6.5.7) (2024-10-21)

**Note:** Version bump only for package vue-intl

## [6.5.6](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.4...vue-intl@6.5.6) (2024-10-12)

**Note:** Version bump only for package vue-intl

## [6.5.5](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.4...vue-intl@6.5.5) (2024-10-09)

**Note:** Version bump only for package vue-intl

## [6.5.4](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.3...vue-intl@6.5.4) (2024-10-08)

**Note:** Version bump only for package vue-intl

## [6.5.3](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.2...vue-intl@6.5.3) (2024-09-23)

**Note:** Version bump only for package vue-intl

## [6.5.2](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.1...vue-intl@6.5.2) (2024-05-19)

**Note:** Version bump only for package vue-intl

## [6.5.1](https://github.com/formatjs/formatjs/compare/vue-intl@6.5.0...vue-intl@6.5.1) (2024-05-18)

**Note:** Version bump only for package vue-intl

# [6.5.0](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.30...vue-intl@6.5.0) (2024-05-05)

### Features

* **@formatjs/cli-lib:** add support for gts, gjs and hbs files. ([1693515](https://github.com/formatjs/formatjs/commit/1693515a03278a3cfff5a16a9c7ca708c8a0e54e)) - by @kiwiupover

## [6.4.30](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.29...vue-intl@6.4.30) (2024-03-27)

### Bug Fixes

* **@formatjs/cli-lib:** fix issue with vue 3.4 ([56dd02c](https://github.com/formatjs/formatjs/commit/56dd02c0d52b3869386bc23a1a31b4c629ae327c)), closes [#4379](https://github.com/formatjs/formatjs/issues/4379) - by @longlho

## [6.4.29](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.28...vue-intl@6.4.29) (2024-03-24)

**Note:** Version bump only for package vue-intl

## [6.4.28](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.27...vue-intl@6.4.28) (2024-01-26)

**Note:** Version bump only for package vue-intl

## [6.4.27](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.26...vue-intl@6.4.27) (2024-01-16)

**Note:** Version bump only for package vue-intl

## [6.4.26](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.25...vue-intl@6.4.26) (2024-01-16)

**Note:** Version bump only for package vue-intl

## [6.4.25](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.24...vue-intl@6.4.25) (2023-11-14)

### Bug Fixes

* **@formatjs/intl-durationformat:** add polyfill detector + docs ([d6d237a](https://github.com/formatjs/formatjs/commit/d6d237a2ffca73d5e3824df17bf5ebf7e7b135a8)) - by @

## [6.4.24](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.23...vue-intl@6.4.24) (2023-11-12)

**Note:** Version bump only for package vue-intl

## [6.4.23](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.22...vue-intl@6.4.23) (2023-11-12)

**Note:** Version bump only for package vue-intl

## [6.4.22](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.21...vue-intl@6.4.22) (2023-11-06)

**Note:** Version bump only for package vue-intl

## [6.4.21](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.20...vue-intl@6.4.21) (2023-10-23)

**Note:** Version bump only for package vue-intl

## [6.4.20](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.19...vue-intl@6.4.20) (2023-10-16)

**Note:** Version bump only for package vue-intl

## [6.4.19](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.18...vue-intl@6.4.19) (2023-09-18)

**Note:** Version bump only for package vue-intl

## [6.4.18](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.17...vue-intl@6.4.18) (2023-09-10)

**Note:** Version bump only for package vue-intl

## [6.4.17](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.16...vue-intl@6.4.17) (2023-09-07)

**Note:** Version bump only for package vue-intl

## [6.4.16](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.15...vue-intl@6.4.16) (2023-06-12)

**Note:** Version bump only for package vue-intl

## [6.4.15](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.14...vue-intl@6.4.15) (2023-06-06)

**Note:** Version bump only for package vue-intl

## [6.4.14](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.13...vue-intl@6.4.14) (2023-05-01)

**Note:** Version bump only for package vue-intl

## [6.4.13](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.12...vue-intl@6.4.13) (2023-04-19)

**Note:** Version bump only for package vue-intl

## [6.4.12](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.11...vue-intl@6.4.12) (2023-04-17)

**Note:** Version bump only for package vue-intl

## [6.4.11](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.10...vue-intl@6.4.11) (2023-03-21)

**Note:** Version bump only for package vue-intl

## [6.4.9](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.8...vue-intl@6.4.9) (2023-02-20)

**Note:** Version bump only for package vue-intl

## [6.4.8](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.7...vue-intl@6.4.8) (2023-02-20)

**Note:** Version bump only for package vue-intl

## [6.4.7](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.6...vue-intl@6.4.7) (2023-01-30)

**Note:** Version bump only for package vue-intl

## [6.4.6](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.5...vue-intl@6.4.6) (2023-01-26)

**Note:** Version bump only for package vue-intl

## [6.4.5](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.4...vue-intl@6.4.5) (2022-12-02)

**Note:** Version bump only for package vue-intl

## [6.4.4](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.2...vue-intl@6.4.4) (2022-12-01)

### Bug Fixes

* **@formatjs/intl:** update monorepo to use TypeScript 4.9 and actually fix the type issue ([#3919](https://github.com/formatjs/formatjs/issues/3919)) ([051527b](https://github.com/formatjs/formatjs/commit/051527b6391c8f4548254ab20630173789d555cd))

## [6.4.3](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.2...vue-intl@6.4.3) (2022-12-01)

### Bug Fixes

* **@formatjs/intl:** update monorepo to use TypeScript 4.9 and actually fix the type issue ([#3919](https://github.com/formatjs/formatjs/issues/3919)) ([051527b](https://github.com/formatjs/formatjs/commit/051527b6391c8f4548254ab20630173789d555cd))

## [6.4.2](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.1...vue-intl@6.4.2) (2022-11-29)

**Note:** Version bump only for package vue-intl

## [6.4.1](https://github.com/formatjs/formatjs/compare/vue-intl@6.4.0...vue-intl@6.4.1) (2022-10-17)

**Note:** Version bump only for package vue-intl

# [6.4.0](https://github.com/formatjs/formatjs/compare/vue-intl@6.3.2...vue-intl@6.4.0) (2022-10-13)

### Features

* **@formatjs/intl,react-intl:** move IntlFormatter type parameters to methods ([#3858](https://github.com/formatjs/formatjs/issues/3858)) ([0d03bb6](https://github.com/formatjs/formatjs/commit/0d03bb66123cb49fbd1c7d27908979bc4521b41f))

## [6.3.2](https://github.com/formatjs/formatjs/compare/vue-intl@6.3.1...vue-intl@6.3.2) (2022-09-28)

**Note:** Version bump only for package vue-intl

## [6.3.1](https://github.com/formatjs/formatjs/compare/vue-intl@6.3.0...vue-intl@6.3.1) (2022-09-06)

**Note:** Version bump only for package vue-intl

# [6.3.0](https://github.com/formatjs/formatjs/compare/vue-intl@6.2.12...vue-intl@6.3.0) (2022-08-27)

### Features

* **@formatjs/ts-transformer:** support TypeScript 4.7 syntax ([#3764](https://github.com/formatjs/formatjs/issues/3764)) ([1b3388e](https://github.com/formatjs/formatjs/commit/1b3388e9344de3a948068f5cf449341c1eb597a8))

## [6.2.12](https://github.com/formatjs/formatjs/compare/vue-intl@6.2.11...vue-intl@6.2.12) (2022-08-21)

**Note:** Version bump only for package vue-intl

## [6.2.11](https://github.com/formatjs/formatjs/compare/vue-intl@6.2.10...vue-intl@6.2.11) (2022-08-21)

**Note:** Version bump only for package vue-intl

## [6.2.10](https://github.com/formatjs/formatjs/compare/vue-intl@6.2.9...vue-intl@6.2.10) (2022-08-18)

**Note:** Version bump only for package vue-intl

## [6.2.9](https://github.com/formatjs/formatjs/compare/vue-intl@6.2.8...vue-intl@6.2.9) (2022-07-11)

### Bug Fixes

* **vue-intl:** type augmentation for global properties ([#3703](https://github.com/formatjs/formatjs/issues/3703)) ([50cb9f2](https://github.com/formatjs/formatjs/commit/50cb9f2da90fe989fe65516c3846dd91482d9d66))

## [6.2.8](https://github.com/formatjs/formatjs/compare/vue-intl@6.2.7...vue-intl@6.2.8) (2022-07-04)

**Note:** Version bump only for package vue-intl

## [6.2.7](https://github.com/formatjs/formatjs/compare/vue-intl@6.2.6...vue-intl@6.2.7) (2022-06-06)

**Note:** Version bump only for package vue-intl

## [6.2.6](https://github.com/formatjs/formatjs/compare/vue-intl@6.2.5...vue-intl@6.2.6) (2022-05-24)

**Note:** Version bump only for package vue-intl

## [6.2.5](https://github.com/formatjs/formatjs/compare/vue-intl@6.2.4...vue-intl@6.2.5) (2022-05-23)

**Note:** Version bump only for package vue-intl

## [6.2.4](https://github.com/formatjs/formatjs/compare/vue-intl@6.2.3...vue-intl@6.2.4) (2022-05-19)

**Note:** Version bump only for package vue-intl

## [6.2.3](https://github.com/formatjs/formatjs/compare/vue-intl@6.2.2...vue-intl@6.2.3) (2022-05-19)

### Bug Fixes

* **react-intl:** fix type issue with react18, fix [#3550](https://github.com/formatjs/formatjs/issues/3550) ([2567b93](https://github.com/formatjs/formatjs/commit/2567b932c5d18b097a43842563046c20ce0c49f1))

## [6.2.2](https://github.com/formatjs/formatjs/compare/vue-intl@6.2.1...vue-intl@6.2.2) (2022-04-27)

**Note:** Version bump only for package vue-intl

## [6.2.1](https://github.com/formatjs/formatjs/compare/vue-intl@6.2.0...vue-intl@6.2.1) (2022-04-17)

**Note:** Version bump only for package vue-intl

# [6.2.0](https://github.com/formatjs/formatjs/compare/vue-intl@6.1.6...vue-intl@6.2.0) (2022-03-26)

### Features

* **vue-intl:** add $formatList, fix [#3488](https://github.com/formatjs/formatjs/issues/3488) ([af31543](https://github.com/formatjs/formatjs/commit/af31543bfe3d1e73f036fc6380f40d75193402b8))

## [6.1.6](https://github.com/formatjs/formatjs/compare/vue-intl@6.1.5...vue-intl@6.1.6) (2022-03-13)

**Note:** Version bump only for package vue-intl

## [6.1.5](https://github.com/formatjs/formatjs/compare/vue-intl@6.1.4...vue-intl@6.1.5) (2022-02-06)

**Note:** Version bump only for package vue-intl

## [6.1.4](https://github.com/formatjs/formatjs/compare/vue-intl@6.1.3...vue-intl@6.1.4) (2022-02-06)

**Note:** Version bump only for package vue-intl

## [6.1.3](https://github.com/formatjs/formatjs/compare/vue-intl@6.1.2...vue-intl@6.1.3) (2022-01-24)

**Note:** Version bump only for package vue-intl

## [6.1.2](https://github.com/formatjs/formatjs/compare/vue-intl@6.1.1...vue-intl@6.1.2) (2022-01-14)

**Note:** Version bump only for package vue-intl

## [6.1.1](https://github.com/formatjs/formatjs/compare/vue-intl@6.1.0...vue-intl@6.1.1) (2022-01-09)

**Note:** Version bump only for package vue-intl

# [6.1.0](https://github.com/formatjs/formatjs/compare/vue-intl@6.0.20...vue-intl@6.1.0) (2022-01-03)

### Features

* **vue-intl:** use vue/compiler-src instead of separate @vue/compiler-sfc ([3192667](https://github.com/formatjs/formatjs/commit/31926670e79e8d125e6c34909d4063fdb3e849a6))

## [6.0.20](https://github.com/formatjs/formatjs/compare/vue-intl@6.0.19...vue-intl@6.0.20) (2022-01-03)

**Note:** Version bump only for package vue-intl

## [6.0.19](https://github.com/formatjs/formatjs/compare/vue-intl@6.0.18...vue-intl@6.0.19) (2021-12-20)

**Note:** Version bump only for package vue-intl

## [6.0.18](https://github.com/formatjs/formatjs/compare/vue-intl@6.0.17...vue-intl@6.0.18) (2021-12-01)

**Note:** Version bump only for package vue-intl

## [6.0.17](https://github.com/formatjs/formatjs/compare/vue-intl@6.0.16...vue-intl@6.0.17) (2021-11-23)

**Note:** Version bump only for package vue-intl

## [6.0.16](https://github.com/formatjs/formatjs/compare/vue-intl@6.0.15...vue-intl@6.0.16) (2021-11-14)

**Note:** Version bump only for package vue-intl

## [6.0.15](https://github.com/formatjs/formatjs/compare/vue-intl@6.0.14...vue-intl@6.0.15) (2021-11-09)

**Note:** Version bump only for package vue-intl

## [6.0.14](https://github.com/formatjs/formatjs/compare/vue-intl@6.0.13...vue-intl@6.0.14) (2021-10-22)

**Note:** Version bump only for package vue-intl

## [6.0.13](https://github.com/formatjs/formatjs/compare/vue-intl@6.0.12...vue-intl@6.0.13) (2021-10-17)

**Note:** Version bump only for package vue-intl

## [6.0.12](https://github.com/formatjs/formatjs/compare/vue-intl@6.0.11...vue-intl@6.0.12) (2021-09-27)

**Note:** Version bump only for package vue-intl

## [6.0.11](https://github.com/formatjs/formatjs/compare/vue-intl@6.0.10...vue-intl@6.0.11) (2021-08-21)

**Note:** Version bump only for package vue-intl

## [6.0.10](https://github.com/formatjs/formatjs/compare/vue-intl@6.0.9...vue-intl@6.0.10) (2021-08-15)

**Note:** Version bump only for package vue-intl

## [6.0.9](https://github.com/formatjs/formatjs/compare/vue-intl@6.0.8...vue-intl@6.0.9) (2021-08-06)

**Note:** Version bump only for package vue-intl

## [6.0.8](https://github.com/formatjs/formatjs/compare/vue-intl@6.0.7...vue-intl@6.0.8) (2021-07-24)

**Note:** Version bump only for package vue-intl

## [6.0.7](https://github.com/formatjs/formatjs/compare/vue-intl@6.0.6...vue-intl@6.0.7) (2021-07-23)

**Note:** Version bump only for package vue-intl

## [6.0.6](https://github.com/formatjs/formatjs/compare/vue-intl@6.0.5...vue-intl@6.0.6) (2021-06-26)

**Note:** Version bump only for package vue-intl

## [6.0.5](https://github.com/formatjs/formatjs/compare/vue-intl@6.0.4...vue-intl@6.0.5) (2021-06-21)

**Note:** Version bump only for package vue-intl

## [6.0.4](https://github.com/formatjs/formatjs/compare/vue-intl@6.0.3...vue-intl@6.0.4) (2021-06-09)

**Note:** Version bump only for package vue-intl

## [6.0.3](https://github.com/formatjs/formatjs/compare/vue-intl@6.0.2...vue-intl@6.0.3) (2021-06-05)

**Note:** Version bump only for package vue-intl

## [6.0.2](https://github.com/formatjs/formatjs/compare/vue-intl@6.0.1...vue-intl@6.0.2) (2021-06-05)

**Note:** Version bump only for package vue-intl

## [6.0.1](https://github.com/formatjs/formatjs/compare/vue-intl@6.0.0...vue-intl@6.0.1) (2021-06-04)

**Note:** Version bump only for package vue-intl

# [6.0.0](https://github.com/formatjs/formatjs/compare/vue-intl@5.0.2...vue-intl@6.0.0) (2021-06-01)

### Features

* **vue-intl:** use the same injection key for composition function and plugin ([#2931](https://github.com/formatjs/formatjs/issues/2931)) ([0eb9dc6](https://github.com/formatjs/formatjs/commit/0eb9dc6c60e9256db9b1bd1f00dafb000c087ac0))

### BREAKING CHANGES

* **vue-intl:** The injection key is now a symbol and must be imported from `vue-intl` under `intlKey`

## [5.0.2](https://github.com/formatjs/formatjs/compare/vue-intl@5.0.1...vue-intl@5.0.2) (2021-05-23)

**Note:** Version bump only for package vue-intl

## [5.0.1](https://github.com/formatjs/formatjs/compare/vue-intl@5.0.0...vue-intl@5.0.1) (2021-05-20)

**Note:** Version bump only for package vue-intl

# [5.0.0](https://github.com/formatjs/formatjs/compare/vue-intl@4.2.7...vue-intl@5.0.0) (2021-05-17)

### Features

* **vue-intl:** follow Vue.js 3 plugin conventions ([#2891](https://github.com/formatjs/formatjs/issues/2891)) ([f6be174](https://github.com/formatjs/formatjs/commit/f6be1744713dd83db1042bcb8a7db2b69d1ccf74)), closes [#2889](https://github.com/formatjs/formatjs/issues/2889)

### BREAKING CHANGES

* **vue-intl:** This removes default export from the plugin and expose `createIntl` instead to follow vue3 plugin conventions

## [4.2.7](https://github.com/formatjs/formatjs/compare/vue-intl@4.2.6...vue-intl@4.2.7) (2021-05-14)

**Note:** Version bump only for package vue-intl

## [4.2.6](https://github.com/formatjs/formatjs/compare/vue-intl@4.2.5...vue-intl@4.2.6) (2021-05-10)

**Note:** Version bump only for package vue-intl

## [4.2.5](https://github.com/formatjs/formatjs/compare/vue-intl@4.2.4...vue-intl@4.2.5) (2021-05-02)

**Note:** Version bump only for package vue-intl

## [4.2.4](https://github.com/formatjs/formatjs/compare/vue-intl@4.2.3...vue-intl@4.2.4) (2021-05-02)

**Note:** Version bump only for package vue-intl

## [4.2.3](https://github.com/formatjs/formatjs/compare/vue-intl@4.2.2...vue-intl@4.2.3) (2021-04-26)

**Note:** Version bump only for package vue-intl

## [4.2.2](https://github.com/formatjs/formatjs/compare/vue-intl@4.2.1...vue-intl@4.2.2) (2021-04-26)

**Note:** Version bump only for package vue-intl

## [4.2.1](https://github.com/formatjs/formatjs/compare/vue-intl@4.2.0...vue-intl@4.2.1) (2021-04-26)

**Note:** Version bump only for package vue-intl

# [4.2.0](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.27...vue-intl@4.2.0) (2021-04-21)

### Features

* **vue-intl:** rename OptionalIntlConfig to IntlConfig and IntlConfig to ResolvedIntlConfig ([f2fe20e](https://github.com/formatjs/formatjs/commit/f2fe20e150a4f01d0447babe21319862be9a63f4))

## [4.1.27](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.26...vue-intl@4.1.27) (2021-04-12)

### Bug Fixes

* **vue-intl:** export the same stuff as react-intl ([9123574](https://github.com/formatjs/formatjs/commit/9123574129641eef69795147a265c9c291d87da5))

## [4.1.26](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.25...vue-intl@4.1.26) (2021-04-04)

**Note:** Version bump only for package vue-intl

## [4.1.25](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.24...vue-intl@4.1.25) (2021-04-03)

**Note:** Version bump only for package vue-intl

## [4.1.24](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.23...vue-intl@4.1.24) (2021-03-30)

**Note:** Version bump only for package vue-intl

## [4.1.23](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.22...vue-intl@4.1.23) (2021-03-30)

**Note:** Version bump only for package vue-intl

## [4.1.22](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.21...vue-intl@4.1.22) (2021-03-28)

**Note:** Version bump only for package vue-intl

## [4.1.21](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.20...vue-intl@4.1.21) (2021-03-28)

**Note:** Version bump only for package vue-intl

## [4.1.20](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.19...vue-intl@4.1.20) (2021-03-27)

**Note:** Version bump only for package vue-intl

## [4.1.19](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.18...vue-intl@4.1.19) (2021-03-27)

**Note:** Version bump only for package vue-intl

## [4.1.18](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.17...vue-intl@4.1.18) (2021-03-26)

**Note:** Version bump only for package vue-intl

## [4.1.17](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.16...vue-intl@4.1.17) (2021-03-17)

**Note:** Version bump only for package vue-intl

## [4.1.16](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.15...vue-intl@4.1.16) (2021-03-15)

**Note:** Version bump only for package vue-intl

## [4.1.15](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.14...vue-intl@4.1.15) (2021-03-01)

**Note:** Version bump only for package vue-intl

## [4.1.14](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.13...vue-intl@4.1.14) (2021-02-25)

**Note:** Version bump only for package vue-intl

## [4.1.13](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.12...vue-intl@4.1.13) (2021-02-25)

**Note:** Version bump only for package vue-intl

## [4.1.12](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.11...vue-intl@4.1.12) (2021-02-22)

**Note:** Version bump only for package vue-intl

## [4.1.11](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.10...vue-intl@4.1.11) (2021-02-21)

**Note:** Version bump only for package vue-intl

## [4.1.10](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.9...vue-intl@4.1.10) (2021-02-13)

**Note:** Version bump only for package vue-intl

## [4.1.9](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.8...vue-intl@4.1.9) (2021-02-09)

**Note:** Version bump only for package vue-intl

## [4.1.8](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.6...vue-intl@4.1.8) (2021-02-02)

**Note:** Version bump only for package vue-intl

## [4.1.7](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.6...vue-intl@4.1.7) (2021-01-29)

**Note:** Version bump only for package vue-intl

## [4.1.6](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.5...vue-intl@4.1.6) (2021-01-27)

**Note:** Version bump only for package vue-intl

## [4.1.5](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.4...vue-intl@4.1.5) (2021-01-26)

**Note:** Version bump only for package vue-intl

## [4.1.4](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.3...vue-intl@4.1.4) (2021-01-25)

**Note:** Version bump only for package vue-intl

## [4.1.3](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.2...vue-intl@4.1.3) (2021-01-13)

**Note:** Version bump only for package vue-intl

## [4.1.2](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.1...vue-intl@4.1.2) (2021-01-12)

**Note:** Version bump only for package vue-intl

## [4.1.1](https://github.com/formatjs/formatjs/compare/vue-intl@4.1.0...vue-intl@4.1.1) (2021-01-08)

### Bug Fixes

* **vue-intl:** update docs and homepage ([fa28f4b](https://github.com/formatjs/formatjs/commit/fa28f4b5d4b772d48307e8bacde1983fd35c57dd))

# 4.1.0 (2021-01-08)

### Bug Fixes

* **@formatjs/vue-intl:** fix package description ([38387be](https://github.com/formatjs/formatjs/commit/38387bec7fbd0fcc17b09203affb440606ad4610))
* **@formatjs/vue-intl:** fix README link ([42a861b](https://github.com/formatjs/formatjs/commit/42a861b0c240067c9b3aab2f96d904b8417498af))

### Features

* **@formatjs/vue-intl:** initial commit ([b38177a](https://github.com/formatjs/formatjs/commit/b38177abc079c886d107be0edd71bce9774100e0))
* **@formatjs/vue-intl:** support Vue composition API, part of [#2464](https://github.com/formatjs/formatjs/issues/2464) ([8845ad7](https://github.com/formatjs/formatjs/commit/8845ad7ae3916f51915614f6f7f2e7ec54e8e2fd))
* **vue-intl:** rename package to vue-intl, bump version to 4.0.0 for continuation ([b922fde](https://github.com/formatjs/formatjs/commit/b922fde3c9c650a707afd7cb0430df6307fbc4d7)), closes [learningequality/vue-intl#28](https://github.com/learningequality/vue-intl/issues/28)

## [0.3.4](https://github.com/formatjs/formatjs/compare/@formatjs/vue-intl@0.3.3...@formatjs/vue-intl@0.3.4) (2021-01-06)

**Note:** Version bump only for package @formatjs/vue-intl

## [0.3.3](https://github.com/formatjs/formatjs/compare/@formatjs/vue-intl@0.3.2...@formatjs/vue-intl@0.3.3) (2021-01-05)

**Note:** Version bump only for package @formatjs/vue-intl

## [0.3.2](https://github.com/formatjs/formatjs/compare/@formatjs/vue-intl@0.3.1...@formatjs/vue-intl@0.3.2) (2021-01-04)

### Bug Fixes

* **@formatjs/vue-intl:** fix package description ([38387be](https://github.com/formatjs/formatjs/commit/38387bec7fbd0fcc17b09203affb440606ad4610))

## [0.3.1](https://github.com/formatjs/formatjs/compare/@formatjs/vue-intl@0.3.0...@formatjs/vue-intl@0.3.1) (2021-01-04)

**Note:** Version bump only for package @formatjs/vue-intl

# [0.3.0](https://github.com/formatjs/formatjs/compare/@formatjs/vue-intl@0.2.1...@formatjs/vue-intl@0.3.0) (2021-01-02)

### Features

* **@formatjs/vue-intl:** support Vue composition API, part of [#2464](https://github.com/formatjs/formatjs/issues/2464) ([8845ad7](https://github.com/formatjs/formatjs/commit/8845ad7ae3916f51915614f6f7f2e7ec54e8e2fd))

## [0.2.1](https://github.com/formatjs/formatjs/compare/@formatjs/vue-intl@0.2.0...@formatjs/vue-intl@0.2.1) (2021-01-01)

### Bug Fixes

* **@formatjs/vue-intl:** fix README link ([42a861b](https://github.com/formatjs/formatjs/commit/42a861b0c240067c9b3aab2f96d904b8417498af))

# 0.2.0 (2021-01-01)

### Features

* **@formatjs/vue-intl:** initial commit ([b38177a](https://github.com/formatjs/formatjs/commit/b38177abc079c886d107be0edd71bce9774100e0))

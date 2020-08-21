load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("@npm//@bazel/rollup:index.bzl", "rollup_bundle")
load("@npm//@bazel/terser:index.bzl", "terser_minified")
load("//tools:index.bzl", "bundle_karma_tests", "generate_src_file", "ts_compile")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "intl-getcanonicallocales"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
    ],
    deps = [
        ":dist",
        # polyfill-library uses this
        "polyfill.umd.js",
        ":polyfill.umd.min",
    ],
)

alias(
    name = "publish",
    actual = "%s.publish" % PACKAGE_NAME,
)

alias(
    name = "pack",
    actual = "%s.pack" % PACKAGE_NAME,
)

SRCS = glob([
    "src/**/*.ts",
    "*.ts",
])

TESTS = glob([
    "tests/*.test.ts",
])

SRC_DEPS = [
    "@npm//cldr-core",
    "@npm//@types/node",
]

TEST_DEPS = SRC_DEPS

ts_compile(
    name = "dist",
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = SRCS,
    skip_esm = False,
    deps = SRC_DEPS,
)

jest_test(
    name = "unit",
    srcs = SRCS + TESTS,
    deps = TEST_DEPS,
)

# aliases
generate_src_file(
    name = "aliases",
    src = "src/data/aliases.ts",
    args = [
        "$(execpath scripts/aliases.ts)",
        "--out",
        "$@",
    ],
    data = [
        "scripts/aliases.ts",
        "//:tsconfig.json",
        "@npm//@types/fs-extra",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//cldr-core",
        "@npm//fs-extra",
        "@npm//minimist",
    ],
)

# karma tests
bundle_karma_tests(
    name = "bundled-karma-tests",
    srcs = SRCS,
    tests = TESTS,
    deps = TEST_DEPS,
)

generated_file_test(
    name = "tsconfig_json",
    src = "tsconfig.json",
    generated = "//tools:tsconfig.golden.json",
)

rollup_bundle(
    name = "polyfill.umd",
    srcs = [":dist-esm"],
    args = [
        "--name",
        "IntlPluralRules",
        "--no-sourcemap",
    ],
    config_file = "//:rollup.config.js",
    entry_point = "lib/polyfill.js",
    format = "umd",
    deps = [
        "@npm//@rollup/plugin-node-resolve",
        "@npm//@rollup/plugin-commonjs",
        "@npm//@rollup/plugin-replace",
        "@npm//@rollup/plugin-json",
    ] + SRC_DEPS,
)

terser_minified(
    name = "polyfill.umd.min",
    src = "polyfill.umd.js",
    sourcemap = False,
)

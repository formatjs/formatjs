load("@build_bazel_rules_nodejs//:index.bzl", "pkg_npm")
load("@npm//@bazel/rollup:index.bzl", "rollup_bundle")
load("//tools:index.bzl", "rollup_dts", "ts_compile")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "intl-locale"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "package.json",
    ],
    deps = [
        "polyfill.umd.js",
        ":dist",
        ":dist-esm",
    ],
)

SRCS = glob(["*.ts"])

SRC_DEPS = [
    "@npm//cldr-core",
    "//packages/intl-utils:dist",
    "//packages/intl-getcanonicallocales:dist",
]

ts_compile(
    name = "dist",
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = SRCS,
    deps = SRC_DEPS,
)

jest_test(
    name = "unit",
    srcs = SRCS + glob([
        "tests/**/*.ts",
        "tests/**/*.tsx",
        "tests/**/*.snap",
    ]),
    deps = [
        "//packages/intl-getcanonicallocales:types",
        "//packages/intl-utils:types",
    ] + SRC_DEPS,
)

rollup_bundle(
    name = "polyfill.umd",
    srcs = [
        "index.js",
    ],
    args = [
        "--output.name",
        "IntlLocale",
    ],
    config_file = "//:rollup.config.js",
    entry_point = "polyfill.js",
    format = "umd",
    deps = [
        "@npm//rollup-plugin-node-resolve",
        "@npm//rollup-plugin-commonjs",
        "@npm//rollup-plugin-replace",
        "@npm//@rollup/plugin-json",
    ] + SRC_DEPS,
)

rollup_dts(
    name = "rollup-dts",
    package_name = PACKAGE_NAME,
    package_json = "package.json",
    types = [":types"],
)

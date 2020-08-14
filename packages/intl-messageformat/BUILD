load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("@npm//@bazel/rollup:index.bzl", "rollup_bundle")
load("@npm//@bazel/terser:index.bzl", "terser_minified")
load("//tools:index.bzl", "ts_compile")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "intl-messageformat"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
    ],
    deps = [
        "%s.umd.js" % PACKAGE_NAME,
        ":%s.umd.min" % PACKAGE_NAME,
        ":dist",
        ":dist-esm",
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

SRCS = glob(["src/*.ts"]) + ["index.ts"]

SRC_DEPS = [
    "//packages/intl-messageformat-parser:dist",
    "@npm//fast-memoize",
]

TESTS = glob([
    "tests/*.test.ts",
])

TEST_DEPS = SRC_DEPS + [
    "@npm//jasmine-expect",
]

ts_compile(
    name = "dist",
    package_name = PACKAGE_NAME,
    srcs = SRCS,
    skip_esm = False,
    deps = SRC_DEPS,
)

jest_test(
    name = "unit",
    srcs = SRCS + TESTS,
    deps = TEST_DEPS + [
        "//packages/intl-messageformat-parser:types",
    ],
)

rollup_bundle(
    name = "%s.umd" % PACKAGE_NAME,
    srcs = [":dist-esm"],
    args = [
        "--name",
        "IntlMessageFormat",
    ],
    config_file = "//:rollup.config.js",
    entry_point = "lib/index.js",
    format = "umd",
    deps = [
        "@npm//@rollup/plugin-node-resolve",
        "@npm//@rollup/plugin-commonjs",
        "@npm//@rollup/plugin-replace",
        "@npm//@rollup/plugin-json",
    ] + SRC_DEPS,
)

terser_minified(
    name = "%s.umd.min" % PACKAGE_NAME,
    src = "%s.umd.js" % PACKAGE_NAME,
    sourcemap = False,
)

generated_file_test(
    name = "tsconfig_json",
    src = "tsconfig.json",
    generated = "//tools:tsconfig.golden.json",
)

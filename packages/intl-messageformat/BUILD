load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("@npm//@bazel/esbuild:index.bzl", "esbuild")
load("@npm//ts-node:index.bzl", "ts_node")
load("//tools:index.bzl", "check_format", "package_json_test", "ts_compile")
load("//tools:jest.bzl", "jest_test")

exports_files(["package.json"])

PACKAGE_NAME = "intl-messageformat"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json"
    ],
    deps = [
        "%s.esm.js" % PACKAGE_NAME,
        "%s.iife.js" % PACKAGE_NAME,
        ":dist",
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
    "//packages/icu-messageformat-parser:dist",
    "//packages/fast-memoize:dist",
    "//packages/ecma402-abstract:dist",
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
    skip_esm_esnext = False,
    deps = SRC_DEPS,
)

jest_test(
    name = "unit",
    srcs = SRCS + TESTS,
    deps = TEST_DEPS + [
        "//packages/icu-messageformat-parser:types",
        "//packages/fast-memoize:types",
        "//packages/ecma402-abstract:types",
    ],
)

esbuild(
    name = "%s.iife" % PACKAGE_NAME,
    args = {
        "globalName": "IntlMessageFormat",
    },
    entry_point = "lib/index.js",
    target = "es5",
    deps = [
        ":dist-esm",
    ] + SRC_DEPS,
)

esbuild(
    name = "%s.esm" % PACKAGE_NAME,
    args = {
        "globalName": "IntlMessageFormat",
    },
    entry_point = "lib_esnext/index.js",
    format = "esm",
    target = "esnext",
    deps = [
        ":dist-esm-esnext",
    ] + SRC_DEPS,
)

generated_file_test(
    name = "tsconfig_json",
    src = "tsconfig.json",
    generated = "//tools:tsconfig.golden.json",
)

check_format(
    name = "prettier",
    srcs = glob(
        [
            "**/*",
        ],
        exclude = [
            "CHANGELOG.md",
        ],
    ),
)

ts_node(
    name = "benchmark",
    args = [
        "--transpile-only",
        "$(execpath tests/benchmark.ts)",
    ],
    data = SRCS + SRC_DEPS + [
        "tests/benchmark.ts",
        "//:tsconfig.json",
        "@npm//tslib",
        "//packages/intl-pluralrules",
        "//packages/intl-pluralrules:locale-data",
        "//:tsconfig.node.json",
    ],
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

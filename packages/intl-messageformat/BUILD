load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_esbuild//esbuild:defs.bzl", "esbuild")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("@aspect_rules_js//js:defs.bzl", "js_binary")
load("//tools:index.bzl", "check_format", "package_json_test", "ts_compile")
load("//tools:jest.bzl", "jest_test")

npm_link_all_packages(name = "node_modules")

exports_files([
    "package.json",
])

PACKAGE_NAME = "intl-messageformat"

npm_package(
    name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
        "%s.esm.js" % PACKAGE_NAME,
        "%s.iife.js" % PACKAGE_NAME,
        ":dist",
    ],
    package = PACKAGE_NAME,
    visibility = ["//visibility:public"],
)

SRCS = glob(["src/*.ts"]) + ["index.ts"]

SRC_DEPS = [
    ":node_modules/@formatjs/icu-messageformat-parser",
    ":node_modules/@formatjs/fast-memoize",
    ":node_modules/@formatjs/ecma402-abstract",
]

TESTS = glob([
    "tests/*.test.ts",
])

TEST_DEPS = SRC_DEPS + [
    "//:node_modules/jasmine-expect",
]

ts_compile(
    name = "dist",
    srcs = SRCS,
    package = PACKAGE_NAME,
    skip_esm = False,
    skip_esm_esnext = False,
    deps = SRC_DEPS,
)

jest_test(
    name = "unit_test",
    data = SRCS + TESTS + TEST_DEPS + ["//:node_modules/@types/node"],
)

esbuild(
    name = "%s.iife" % PACKAGE_NAME,
    config = {
        "globalName": "IntlMessageFormat",
    },
    entry_point = "lib/index.js",
    target = "es6",
    # TODO: fix this and set it back to es5
    deps = [
        ":dist-esm",
    ] + SRC_DEPS,
)

esbuild(
    name = "%s.esm" % PACKAGE_NAME,
    config = {
        "globalName": "IntlMessageFormat",
    },
    entry_point = "lib_esnext/index.js",
    format = "esm",
    target = "esnext",
    deps = [
        ":dist-esm-esnext",
    ] + SRC_DEPS,
)

write_source_files(
    name = "tsconfig_json",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
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

# Use with `bazel run`.
js_binary(
    name = "benchmark",
    data = SRCS + SRC_DEPS + [
        "//:node_modules/@formatjs/intl-localematcher",
        "//:node_modules/@formatjs/intl-pluralrules",
        "//:node_modules/@swc-node/register",
        "//:node_modules/@swc/helpers",
        "//:node_modules/benchmark",
    ],
    entry_point = "tests/benchmark.ts",
    node_options = [
        "-r",
        "@swc-node/register",
    ],
    tags = ["manual"],
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_esbuild//esbuild:defs.bzl", "esbuild")
load("@aspect_rules_js//js:defs.bzl", "js_binary")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:index.bzl", "package_json_test", "ts_compile")
load("//tools:vitest.bzl", "vitest")

npm_link_all_packages()

exports_files([
    "package.json",
])

PACKAGE_NAME = "intl-messageformat"

npm_package(
    name = "pkg",
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
    srcs = [":srcs"],
    skip_esm = False,
    skip_esm_esnext = False,
    deps = SRC_DEPS,
)

vitest(
    name = "unit_test",
    srcs = SRCS + TESTS,
    deps = SRC_DEPS + TEST_DEPS,
)

esbuild(
    name = "%s.iife" % PACKAGE_NAME,
    srcs = [":srcs"],
    config = {
        "globalName": "IntlMessageFormat",
    },
    entry_point = "index.ts",
    target = "es6",
    deps = SRC_DEPS,
)

esbuild(
    name = "%s.esm" % PACKAGE_NAME,
    srcs = [":srcs"],
    config = {
        "globalName": "IntlMessageFormat",
    },
    entry_point = "index.ts",
    format = "esm",
    target = "esnext",
    deps = SRC_DEPS,
)

write_source_files(
    name = "tsconfig_json",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
)

# Use with `bazel run`.
js_binary(
    name = "benchmark",
    data = [":srcs"] + SRC_DEPS + [
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

copy_to_bin(
    name = "srcs",
    srcs = SRCS,
)

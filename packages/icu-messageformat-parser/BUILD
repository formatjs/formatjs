load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_js//js:defs.bzl", "js_binary")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:index.bzl", "bundle_karma_tests", "generate_src_file", "package_json_test", "ts_compile")
load("//tools:vitest.bzl", "vitest")

npm_link_all_packages()

exports_files([
    "package.json",
])

PACKAGE_NAME = "icu-messageformat-parser"

npm_package(
    name = "pkg",
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
        ":dist",
    ],
    package = "@formatjs/%s" % PACKAGE_NAME,
    visibility = ["//visibility:public"],
)

SRCS = glob(["*.ts"])

SRC_DEPS = [
    ":node_modules/@formatjs/ecma402-abstract",
    ":node_modules/@formatjs/icu-skeleton-parser",
]

ts_compile(
    name = "dist",
    srcs = [":srcs"],
    skip_esm = False,
    deps = SRC_DEPS,
)

vitest(
    name = "unit_test",
    srcs = SRCS + glob([
        "tests/**/*.ts",
    ]),
    deps = SRC_DEPS + [
        "//:node_modules/@types/lodash",
        "//:node_modules/fast-glob",
        "//:node_modules/lodash",
    ],
)

js_binary(
    name = "benchmark",
    data = [
        "benchmark.js",
        ":dist",
        "//:node_modules/benchmark",
    ] + SRC_DEPS,
    entry_point = "benchmark.js",
)

write_source_files(
    name = "tsconfig_json",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
)

bundle_karma_tests(
    name = "bundled-karma-tests",
    srcs = [":srcs"],
    tests = [
        "tests/browser-smoke.test.ts",
    ],
    deps = SRC_DEPS,
)

generate_src_file(
    name = "regex",
    src = "regex.generated.ts",
    data = [
        "scripts/global.ts",
        "//:node_modules/@unicode/unicode-13.0.0",
        "//:node_modules/regenerate",
    ],
    entry_point = "scripts/regex-gen.ts",
)

generate_src_file(
    name = "time-data",
    src = "time-data.generated.ts",
    data = [
        "//:node_modules/cldr-core",
        "//:node_modules/json-stable-stringify",
    ],
    entry_point = "scripts/time-data-gen.ts",
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

copy_to_bin(
    name = "srcs",
    srcs = SRCS,
)

load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_esbuild//esbuild:defs.bzl", "esbuild")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:index.bzl", "bundle_karma_tests", "generate_src_file", "package_json_test", "ts_compile")
load("//tools:vitest.bzl", "vitest")

npm_link_all_packages()

exports_files([
    "package.json",
    "tsconfig.json",
])

PACKAGE_NAME = "intl-getcanonicallocales"

npm_package(
    name = "pkg",
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
        ":dist",
        # polyfill-library uses this
        "polyfill.iife.js",
    ],
    package = "@formatjs/%s" % PACKAGE_NAME,
    visibility = ["//visibility:public"],
)

SRCS = glob([
    "src/**/*.ts",
    "*.ts",
])

TESTS = glob([
    "tests/*.test.ts",
])

copy_to_bin(
    name = "tests",
    srcs = TESTS,
)

SRC_DEPS = [
]

TEST_DEPS = SRC_DEPS

ts_compile(
    name = "dist",
    srcs = [":srcs"],
    deps = SRC_DEPS,
)

vitest(
    name = "unit_test",
    srcs = SRCS + TESTS,
    deps = TEST_DEPS,
)

# aliases
generate_src_file(
    name = "aliases",
    src = "src/aliases.generated.ts",
    data = [
        "//:node_modules/cldr-core",
        "//:node_modules/json-stable-stringify",
    ],
    entry_point = "scripts/aliases.ts",
    visibility = ["//:__pkg__"],
)

generate_src_file(
    name = "likelySubtags",
    src = "src/likelySubtags.generated.ts",
    data = [
        "//:node_modules/cldr-core",
        "//:node_modules/json-stable-stringify",
    ],
    entry_point = "scripts/likely-subtags.ts",
    visibility = ["//:__pkg__"],
)

# karma tests
bundle_karma_tests(
    name = "bundled-karma-tests",
    srcs = [":srcs"],
    tests = [":tests"],
    deps = TEST_DEPS,
)

write_source_files(
    name = "tsconfig_json",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
)

esbuild(
    name = "polyfill.iife",
    srcs = [":srcs"],
    entry_point = "polyfill.ts",
    target = "es6",
    deps = [
        "//:node_modules/tslib",
    ] + SRC_DEPS,
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

copy_to_bin(
    name = "srcs",
    srcs = SRCS,
)

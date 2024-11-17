load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:index.bzl", "package_json_test", "ts_compile_node")
load("//tools:jest.bzl", "jest_test")

npm_link_all_packages()

PACKAGE_NAME = "eslint-plugin-formatjs"

npm_package(
    name = "pkg",
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
        ":dist",
    ],
    package = PACKAGE_NAME,
    visibility = ["//visibility:public"],
)

SRCS = glob(["rules/*.ts"]) + [
    "index.ts",
    "util.ts",
    "context-compat.ts",
    "package.json",
]

SRC_DEPS = [
    "//:node_modules/@types/eslint",
    "//:node_modules/@types/node",
    "//:node_modules/@types/picomatch",
    "//:node_modules/@typescript-eslint/utils",
    "//:node_modules/eslint",
    "//:node_modules/magic-string",
    "//:node_modules/picomatch",
    "//:node_modules/typescript",
    "//:node_modules/unicode-emoji-utils",
    ":node_modules/@formatjs/icu-messageformat-parser",
    ":node_modules/@formatjs/ts-transformer",
]

ts_compile_node(
    name = "dist",
    srcs = [":srcs"],
    deps = SRC_DEPS,
)

TESTS_BASE_SRCS = [":srcs"] + glob(
    [
        "tests/*.ts",
    ],
    exclude = ["tests/*.test.ts"],
)

TEST_FILES = glob([
    "tests/*.test.ts",
])

jest_test(
    name = "unit_test",
    data = TESTS_BASE_SRCS + TEST_FILES + SRC_DEPS + [
        "//:node_modules/@typescript-eslint/parser",
        "//:node_modules/@typescript-eslint/rule-tester",
        "//:node_modules/vue-eslint-parser",
    ],
)

write_source_files(
    name = "tsconfig_json",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

copy_to_bin(
    name = "srcs",
    srcs = SRCS,
)

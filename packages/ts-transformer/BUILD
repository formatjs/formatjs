load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:index.bzl", "package_json_test", "ts_compile_node")
load("//tools:vitest.bzl", "vitest")

npm_link_all_packages()

exports_files([
    "package.json",
])

PACKAGE_NAME = "ts-transformer"

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

SRCS = glob([
    "src/*.ts",
    "*.ts",
])

SRC_DEPS = [
    ":node_modules/@formatjs/icu-messageformat-parser",
    ":node_modules/ts-jest",
    "//:node_modules/@babel/core",
    "//:node_modules/@types/babel__core",
    "//:node_modules/@types/node",
    "//:node_modules/chalk",
    "//:node_modules/json-stable-stringify",
    "//:node_modules/typescript",
]

ts_compile_node(
    name = "dist",
    srcs = [":srcs"],
    deps = SRC_DEPS + [
        "//:node_modules/@jest/types",
        "//:node_modules/@types/jest",
    ],
)

vitest(
    name = "unit_test",
    srcs = SRCS + glob([
        "tests/*.ts*",
    ]),
    fixtures = glob([
        "tests/fixtures/*.ts*",
    ]),
    deps = SRC_DEPS,
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

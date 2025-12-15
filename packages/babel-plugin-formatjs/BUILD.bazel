load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:index.bzl", "package_json_test", "ts_compile_node")
load("//tools:vitest.bzl", "vitest")

npm_link_all_packages()

PACKAGE_NAME = "babel-plugin-formatjs"

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

SRCS = glob(
    ["**/*.ts"],
    exclude = ["tests/**/*"],
)

SRC_DEPS = [
    "//:node_modules/@babel/core",
    "//:node_modules/@babel/helper-plugin-utils",
    "//:node_modules/@babel/plugin-syntax-jsx",
    "//:node_modules/@babel/traverse",
    "//:node_modules/@babel/types",
    ":node_modules/@formatjs/icu-messageformat-parser",
    ":node_modules/@formatjs/ts-transformer",
    "//:node_modules/@types/babel__core",
    "//:node_modules/@types/babel__helper-plugin-utils",
    "//:node_modules/@types/babel__traverse",
]

ts_compile_node(
    name = "dist",
    srcs = [":srcs"],
    deps = SRC_DEPS,
)

vitest(
    name = "unit_test",
    srcs = SRCS + glob(
        [
            "tests/**/*.test.ts",
        ],
        exclude = ["tests/vue/**/*"],
    ),
    deps = SRC_DEPS + [
        "//:node_modules/@babel/preset-env",
        "//:node_modules/@babel/preset-react",
        "//packages/babel-plugin-formatjs/tests/fixtures",
    ],
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

write_source_files(
    name = "tsconfig_json",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
)

copy_to_bin(
    name = "srcs",
    srcs = SRCS,
)

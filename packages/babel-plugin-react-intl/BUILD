load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary", "npm_package_bin", "pkg_npm")
load("@npm_bazel_typescript//:index.bzl", "ts_config", "ts_project")
load("//tools:jest.bzl", "jest_test")
load("//tools:tools.bzl", "generate_package_json", "rollup_dts")

package(default_visibility = ["//visibility:public"])

SRCS = [
    "index.ts",
    "vendor.d.ts",
    ":src/options.ts",
]

SRCS_DEPS = [
    "@npm//@types/node",
    "@npm//@types/fs-extra",
    "@npm//fs-extra",
    "@npm//@babel/helper-plugin-utils",
    "@npm//@babel/core",
    "@npm//@babel/types",
    "@npm//@babel/traverse",
    "@npm//schema-utils",
    "@npm//@types/json-schema",
    "@npm//@types/babel__core",
    "@npm//@types/babel__traverse",
    "//packages/intl-messageformat-parser:lib",
]

PACKAGE_NAME = "babel-plugin-react-intl"

pkg_npm(
    name = PACKAGE_NAME,
    deps = [
        "LICENSE.md",
        "package.json",
        ":tsconfig",
    ],
)

ts_project(
    name = "tsconfig",
    srcs = SRCS,
    declaration = True,
    extends = ["//:tsconfig.json"],
    source_map = True,
    deps = SRCS_DEPS,
)

jest_test(
    name = "test",
    srcs = [
        "tsconfig.json",
    ] + SRCS + glob([
        "tests/**/*.ts",
        "tests/**/*.tsx",
        "tests/**/*.snap",
    ]),
    jest_config = "//:jest.config.js",
    tags = [
        # Need to set the pwd to avoid jest needing a runfiles helper
        # Windows users with permissions can use --enable_runfiles
        # to make this test work
        "no-bazelci-windows",
        # TODO: why does this fail almost all the time, but pass on local Mac?
        "no-bazelci-mac",
    ],
    deps = [
        "@npm//@jest/transform",
        "@npm//@types/jest",
        "@npm//ts-jest",
    ] + SRCS_DEPS,
)

npm_package_bin(
    name = "options",
    outs = [
        "src/options.ts",
    ],
    args = ["-i $(execpath src/options.schema.json) -o $@"],
    data = ["src/options.schema.json"],
    package = "json-schema-to-typescript",
    tool = "@npm//json-schema-to-typescript/bin:json2ts",
)

generate_package_json(
    name = "generate-package-json",
    out = "package.json",
    description = "Extracts string messages for translation from modules that use React Intl",
    module_name = PACKAGE_NAME,
)

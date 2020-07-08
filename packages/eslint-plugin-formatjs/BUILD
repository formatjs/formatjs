load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("@npm//json-schema-to-typescript:index.bzl", "json2ts")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "eslint-plugin-formatjs"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "package.json",
    ],
    deps = [
        ":dist",
    ],
)

SRCS = glob(["rules/*.ts"]) + [
    "index.ts",
    "util.ts",
]

SRC_DEPS = [
    "@npm//emoji-regex",
    "@npm//@types/emoji-regex",
    "@npm//@types/eslint",
    "@npm//@types/estree",
    "@npm//@typescript-eslint/typescript-estree",
    "//packages/intl-messageformat-parser:dist",
]

ts_project(
    name = "dist",
    package_name = PACKAGE_NAME,
    srcs = SRCS,
    declaration = True,
    declaration_map = True,
    extends = ["//:tsconfig.json"],
    source_map = True,
    tsconfig = "//:tsconfig.node.json",
    deps = SRC_DEPS,
)

filegroup(
    name = "types",
    srcs = [":dist"],
    output_group = "types",
)

# TODO
jest_test(
    name = "unit",
    srcs = [
        "//:tsconfig.json",
    ] + SRCS + glob([
        "tests/**/*.ts",
        "tests/**/*.tsx",
        "tests/**/*.snap",
        "tests/**/*.js",
        "tests/**/*.json",
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
        "@npm//ts-jest",
        "@npm//@types/jest",
        "@npm//eslint",
        "@npm//@typescript-eslint/parser",
        "//packages/intl-messageformat-parser:types",
    ] + SRC_DEPS,
)

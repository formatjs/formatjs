load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary", "pkg_npm")
load("@npm_bazel_typescript//:index.bzl", "ts_config", "ts_library")
load("//tools:jest.bzl", "jest_test")
load("//tools:tools.bzl", "generate_package_json", "rollup_dts")
load("@npm_bazel_rollup//:index.bzl", "rollup_bundle")
load("@npm_bazel_terser//:index.bzl", "terser_minified")

package(default_visibility = ["//visibility:public"])

SRCS = glob(["src/*.ts"]) + [
    "src/parser.ts",
    "index.ts",
]

PACKAGE_NAME = "intl-messageformat-parser"

SRCS_DEPS = [
    "//packages/intl-unified-numberformat:lib",
]

ts_config(
    name = "tsconfig",
    src = "tsconfig.json",
    deps = ["//:tsconfig.json"],
)

rollup_bundle(
    name = "bundle",
    config_file = "rollup.config.js",
    entry_point = "index.ts",
    format = "umd",
    deps = [":lib"],
)

terser_minified(
    name = "bundle.min",
    src = ":bundle",
)

pkg_npm(
    name = PACKAGE_NAME,
    deps = [
        "LICENSE.md",
        "package.json",
        ":bundle",
        ":bundle.min",
        ":d-ts",
        ":lib",
    ],
)

generate_package_json(
    name = "generate-package-json",
    out = "package.json",
    description = "Parses ICU Message strings into an AST via JavaScript.",
    module_name = PACKAGE_NAME,
)

ts_library(
    name = "lib",
    srcs = SRCS,
    devmode_module = "esnext",
    module_name = PACKAGE_NAME,
    deps = SRCS_DEPS,
)

# API Extractor
rollup_dts(
    name = "d-ts",
    out = "%s.d.ts" % PACKAGE_NAME,
    package_json = "package.json",
    deps = [
        ":lib",
        "//packages/intl-unified-numberformat:d-ts",
    ],
)

# Build the PEG parser

ts_library(
    name = "tools",
    srcs = [
        "tools/build.ts",
        "tools/vendor.d.ts",
    ],
    devmode_module = "commonjs",
    prodmode_module = "commonjs",
    deps = [
        "@npm//@types/fs-extra",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//@types/pegjs",
        "@npm//fs-extra",
        "@npm//minimist",
        "@npm//pegjs",
        "@npm//ts-pegjs",
    ],
)

nodejs_binary(
    name = "build_parser",
    data = [
        ":tools",
    ],
    entry_point = "tools/build.ts",
)

genrule(
    name = "parser",
    srcs = [
        "src/parser.pegjs",
    ],
    outs = [
        "src/parser.ts",
    ],
    cmd = "$(location build_parser) --in $< --out $@",
    tools = [":build_parser"],
)

# Tests

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
        "//:tsconfig.json",
        "@npm//@jest/transform",
        "@npm//@types/jest",
        "@npm//ts-jest",
    ],
)

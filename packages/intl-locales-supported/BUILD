load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary", "pkg_npm")
load("@npm_bazel_typescript//:index.bzl", "ts_library")
load("//tools:jest.bzl", "jest_test")
load("//tools:tools.bzl", "generate_package_json", "rollup_dts")

package(default_visibility = ["//visibility:public"])

SRCS = [
    "index.ts",
]

PACKAGE_NAME = "intl-locales-supported"

pkg_npm(
    name = PACKAGE_NAME,
    deps = [
        ":package.json",
        "//tools:LICENSE.md",
    ],
)

ts_library(
    name = "lib",
    srcs = SRCS,
    devmode_module = "commonjs",
    module_name = PACKAGE_NAME,
    prodmode_module = "commonjs",
)

jest_test(
    name = "test",
    srcs = [
        "//:tsconfig.json",
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
    ],
)

generate_package_json(
    name = "generate-package-json",
    out = "package.json",
    description = "Utility",
    module_name = PACKAGE_NAME,
)

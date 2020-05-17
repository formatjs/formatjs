load("//tools:jest.bzl", "jest_test")
load("//tools:tools.bzl", "generate_package_json", "ts_monorepo_subpackage")
load("@build_bazel_rules_nodejs//:index.bzl", "pkg_npm")

package(default_visibility = ["//visibility:public"])

SRCS = glob(["src/*.ts"]) + [
    "index.ts",
]

SRCS_DEPS = [
    "@npm//@types/glob",
    "@npm//@types/lodash",
    "@npm//@types/node",
    "@npm//cldr-core",
    "@npm//cldr-dates-full",
    "@npm//cldr-localenames-full",
    "@npm//cldr-misc-full",
    "@npm//cldr-numbers-full",
    "@npm//cldr-units-full",
    "@npm//glob",
    "@npm//lodash",
    "//packages/intl-utils:lib",
]

PACKAGE_NAME = "formatjs-extract-cldr-data"

pkg_npm(
    name = PACKAGE_NAME,
    deps = [
        "LICENSE.md",
        "package.json",
        ":lib",
    ],
)

ts_monorepo_subpackage(
    name = "lib",
    package_name = PACKAGE_NAME,
    srcs = SRCS,
    declaration = True,
    source_map = True,
    tsconfig = "//:tsconfig.json",
    deps = SRCS_DEPS,
)

generate_package_json(
    name = "generate-package-json",
    out = "package.json",
    description = "Utility library that extracts the CLDR data that's needed by the FormatJS libraries.",
    module_name = PACKAGE_NAME,
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
    ] + SRCS_DEPS,
)

load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "npm_package_bin", "pkg_npm")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "intl-pluralrules"

pkg_npm(
    name = PACKAGE_NAME,
    srcs = ["package.json"],
    deps = [":lib"],
)

SRCS = glob(["src/*.ts"])

SRC_DEPS = [
    "@npm//cldr-core",
    "@npm//@types/node",
    "//packages/intl-utils:lib",
    "//packages/intl-getcanonicallocales:lib"
]

ts_project(
    name = "lib",
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = SRCS,
    declaration = True,
    declaration_map = True,
    extends = ["//:tsconfig.json"],
    outdir = "dist",
    source_map = True,
    tsconfig = "tsconfig.json",
    visibility = ["//visibility:public"],
    deps = SRC_DEPS,
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
    jest_config = ":jest.config.js",
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
    ] + SRC_DEPS,
)
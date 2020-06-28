load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("//tools:jest.bzl", "jest_test")
load("@build_bazel_rules_nodejs//:index.bzl", "pkg_npm")

PACKAGE_NAME = "ts-transformer"

pkg_npm(
    name = PACKAGE_NAME,
    srcs = ["package.json"],
    deps = [":lib"],
)

SRCS = glob(["src/*.ts"])

SRC_DEPS = [
    "@npm//typescript",
    "@npm//@types/node",
    "@npm//@types/jest"
]

ts_project(
    name="lib",
    package_name="@formatjs/%s" % PACKAGE_NAME,
    tsconfig="tsconfig.json",
    srcs=SRCS,
    extends=["//:tsconfig.json"],
    declaration_map=True,
    source_map=True,
    declaration=True,
    deps=SRC_DEPS,
    outdir="dist"
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
    ] + SRC_DEPS,
)
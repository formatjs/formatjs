load("@build_bazel_rules_nodejs//:index.bzl", "pkg_npm")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "cli"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "package.json",
    ],
    deps = [
        "bin/formatjs",
        ":dist",
    ],
)

SRCS = glob(["src/*.ts"]) + [
    "index.ts",
]

SRC_DEPS = [
    "//packages/babel-plugin-react-intl:dist",
    "@npm//@babel/core",
    "@npm//@types/node",
    "@npm//fs-extra",
    "@npm//@types/fs-extra",
    "//packages/ts-transformer:dist",
    "@npm//glob",
    "@npm//@types/glob",
    "@npm//commander",
    "@npm//loud-rejection",
    "@npm//chalk",
]

ts_project(
    name = "dist",
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

# TODO: Add integration tests
jest_test(
    name = "unit",
    srcs = [
        "package.json",
        "tests/extract/unit.test.ts",
    ] + SRCS,
    deps = [
        "@npm//eslint",
        "//packages/babel-plugin-react-intl:types",
        "//packages/ts-transformer:types",
        "@npm//rimraf",
        "@npm//@types/rimraf",
    ] + SRC_DEPS,
)

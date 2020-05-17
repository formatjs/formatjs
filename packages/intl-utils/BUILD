load("@build_bazel_rules_nodejs//:index.bzl", "pkg_npm")
load("//tools:jest.bzl", "jest_test")
load("//tools:tools.bzl", "cldr_gen", "generate_package_json", "rollup_dts", "ts_monorepo_subpackage")
load("@bazel_skylib//rules:copy_file.bzl", "copy_file")

package(default_visibility = ["//visibility:public"])

SRCS = [
    "index.ts",
] + glob(["src/*.ts"])

PACKAGE_NAME = "intl-utils"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    deps = [
        "//tools:LICENSE.md",
        "%s.d.ts" % PACKAGE_NAME,
        "package.json",
        ":lib",
    ],
)

ts_monorepo_subpackage(
    name = "lib",
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = SRCS,
    declaration = True,
    source_map = True,
    tsconfig = "//:tsconfig.json",
)

jest_test(
    name = "test",
    srcs = [
        "//:tsconfig.json",
        ":package.json",
    ] + SRCS + glob([
        "tests/**/*.ts",
        "tests/**/*.tsx",
        "tests/**/*.snap",
    ]),
    tags = [
        # Need to set the pwd to avoid jest needing a runfiles helper
        # Windows users with permissions can use --enable_runfiles
        # to make this test work
        "no-bazelci-windows",
        # TODO: why does this fail almost all the time, but pass on local Mac?
        "no-bazelci-mac",
    ],
    deps = [
        ":lib",
        "@npm//@jest/transform",
        "@npm//@types/jest",
        "@npm//ts-jest",
    ],
)

generate_package_json(
    name = "generate-package-json",
    out = "package.json",
    description = "Utils for formatjs",
    module_name = "@formatjs/%s" % PACKAGE_NAME,
)

rollup_dts(
    name = "d-ts",
    outs = ["%s.d.ts" % PACKAGE_NAME],
    package_json = ":package.json",
)

# CLDR Aliases
cldr_gen(
    name = "aliases",
    deps = [
        "@npm//@types/fs-extra",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//@types/serialize-javascript",
        "@npm//cldr-core",
        "@npm//fs-extra",
        "@npm//minimist",
        "@npm//serialize-javascript",
    ],
)

# CLDR Parent Locales
cldr_gen(
    name = "parentLocales",
    deps = [
        "@npm//@types/fs-extra",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//@types/serialize-javascript",
        "@npm//cldr-core",
        "@npm//fs-extra",
        "@npm//minimist",
        "@npm//serialize-javascript",
    ],
)

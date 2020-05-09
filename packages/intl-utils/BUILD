load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary", "pkg_npm", "npm_package_bin")
load("@npm_bazel_typescript//:index.bzl", "ts_config", "ts_library", "ts_project")
load("//tools:jest.bzl", "jest_test")
load("//tools:tools.bzl", "generate_package_json", "rollup_dts")
load("@build_bazel_rules_nodejs//internal/golden_file_test:golden_file_test.bzl", "golden_file_test")

package(default_visibility = ["//visibility:public"])

SRCS = [
    "index.ts",
] + glob(["src/*.ts"])

PACKAGE_NAME = "intl-utils"


pkg_npm(
    name = PACKAGE_NAME,
    deps = [
        "//tools:LICENSE.md",
        "%s.d.ts" % PACKAGE_NAME,
        ":lib",
        "package.json",
    ],
)

ts_project(
    name = "lib",
    srcs = SRCS,
    declaration = True,
    extends = ["//:tsconfig.json"],
    tsconfig="tsconfig.json",
    source_map = True,
    composite=True,
)

jest_test(
    name = "test",
    srcs = [
        "//:tsconfig.json",
        "package.json",
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

# API Extractor
rollup_dts(
    name = "d-ts",
    out = "%s.d.ts" % PACKAGE_NAME,
    package_json = ":package.json",
    deps=[
        ":lib"
    ]
)

# CLDR Aliases

ts_library(
    name = "aliases-lib",
    srcs = [
        "scripts/aliases.ts",
    ],
    devmode_module = "commonjs",
    prodmode_module = "commonjs",
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

nodejs_binary(
    name = "aliases-bin",
    data = [":aliases-lib"],
    entry_point = ":scripts/aliases.ts",
)

genrule(
    name = "aliases",
    outs = [
        "generated/aliases.ts",
    ],
    cmd = "$(location aliases-bin) --out $@",
    tools = [":aliases-bin"],
)

golden_file_test(
    name="aliases-test",
    actual="generated/aliases.ts",
    golden="src/aliases.ts"
)

# CLDR Parent Locales

ts_library(
    name = "parentLocales-lib",
    srcs = [
        "scripts/parentLocales.ts",
    ],
    devmode_module = "commonjs",
    prodmode_module = "commonjs",
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

nodejs_binary(
    name = "parentLocales-bin",
    data = [":parentLocales-lib"],
    entry_point = ":scripts/parentLocales.ts",
)

genrule(
    name = "parentLocales",
    outs = [
        "generated/parentLocales.ts",
    ],
    cmd = "$(location parentLocales-bin) --out $@",
    tools = [":parentLocales-bin"],
)

golden_file_test(
    name="parentLocales-test",
    actual="generated/parentLocales.ts",
    golden="src/parentLocales.ts"
)
load("@build_bazel_rules_nodejs//:index.bzl", "copy_to_bin", "npm_package_bin", "pkg_npm")
load("@npm//@bazel/rollup:index.bzl", "rollup_bundle")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "intl-locale"

pkg_npm(
    name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "package.json",
    ],
    deps = [
        "polyfill.umd.js",
        ":dist",
        ":lib",
    ],
)

SRCS = glob(["*.ts"])

SRC_DEPS = [
    "@npm//cldr-core",
    "//packages/intl-utils:dist",
    "//packages/intl-getcanonicallocales:dist",
]

ts_project(
    name = "dist",
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = SRCS,
    declaration = True,
    declaration_map = True,
    source_map = True,
    tsconfig = "//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = SRC_DEPS,
)

ts_project(
    name = "lib",
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = SRCS,
    declaration = True,
    declaration_map = True,
    outdir = "lib",
    source_map = True,
    tsconfig = "//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = SRC_DEPS,
)

filegroup(
    name = "types",
    srcs = [":dist"],
    output_group = "types",
)

jest_test(
    name = "unit",
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
        "@npm//ts-jest",
        "@npm//@types/jest",
        "//packages/intl-getcanonicallocales:types",
        "//packages/intl-utils:types",
    ] + SRC_DEPS,
)

rollup_bundle(
    name = "polyfill.umd",
    srcs = [
        "index.js",
    ],
    args = [
        "--output.name",
        "IntlLocale",
    ],
    config_file = "//:rollup.config.js",
    entry_point = "polyfill.js",
    format = "umd",
    deps = [
        "@npm//rollup-plugin-node-resolve",
        "@npm//rollup-plugin-commonjs",
        "@npm//rollup-plugin-replace",
        "@npm//@rollup/plugin-json",
    ] + SRC_DEPS,
)

# API Extractor
genrule(
    name = "copy-tsconfig",
    srcs = ["//:tsconfig.json"],
    outs = ["tsconfig.json"],
    cmd = "cp $< $@",
)

genrule(
    name = "copy-api-extractor",
    srcs = ["//:api-extractor.json"],
    outs = ["api-extractor.json"],
    cmd = "cp $< $@",
)

copy_to_bin(
    name = "copy-package-json",
    srcs = [
        "package.json",
    ],
)

npm_package_bin(
    name = "rollup-dts",
    outs = ["%s.d.ts" % PACKAGE_NAME],
    args = [
        "run",
        "--local",
        "--diagnostics",
        "-c",
        "$(@D)/api-extractor.json",
    ],
    data = [
        "api-extractor.json",
        "tsconfig.json",
        ":copy-package-json",
        ":types",
        "//packages/intl-utils:types",
    ],
    package = "api-extractor",
    tool = "@npm//@microsoft/api-extractor/bin:api-extractor",
)

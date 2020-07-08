load("@build_bazel_rules_nodejs//:index.bzl", "copy_to_bin", "npm_package_bin", "pkg_npm")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "intl-format-cache"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "package.json",
    ],
    deps = [
        ":dist",
        ":lib",
    ],
)

SRCS = glob(["src/*.ts"]) + ["index.ts"]

SRC_DEPS = []

ts_project(
    name = "dist",
    package_name = PACKAGE_NAME,
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
    srcs = SRCS,
    declaration = True,
    declaration_map = True,
    extends = ["//:tsconfig.json"],
    outdir = "lib",
    source_map = True,
    tsconfig = "//:tsconfig.esm.json",
    deps = SRC_DEPS,
)

filegroup(
    name = "types",
    srcs = [":dist"],
    output_group = "types",
    visibility = ["//visibility:public"],
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
        "//:setup-api-extractor",
    ],
    package = "api-extractor",
    tool = "@npm//@microsoft/api-extractor/bin:api-extractor",
)

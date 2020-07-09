load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "nodejs_binary", "pkg_npm")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("//tools:index.bzl", "rollup_dts")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "intl-messageformat-parser"

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

SRC_DEPS = [
    "//packages/intl-numberformat:dist",
]

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
    visibility = ["//visibility:public"],
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
    srcs = SRCS + glob([
        "tests/**/*.ts",
        "tests/**/*.tsx",
        "tests/**/*.snap",
    ]),
    deps = [
        "//packages/intl-numberformat:types",
    ] + SRC_DEPS,
)

# parser
nodejs_binary(
    name = "parser-build",
    data = [
        "src/parser.pegjs",
        "tools/build.js",
        "@npm//fs-extra",
        "@npm//minimist",
        "@npm//pegjs",
        "@npm//ts-pegjs",
    ],
    entry_point = "tools/build.js",
)

genrule(
    name = "parser-gen",
    srcs = ["src/parser.pegjs"],
    outs = ["tmp/parser.ts"],
    cmd = "$(location :parser-build) --input $(location src/parser.pegjs) --out $@",
    tools = [":parser-build"],
)

generated_file_test(
    name = "parser",
    src = "src/parser.ts",
    generated = ":parser-gen",
)

rollup_dts(
    name = "rollup-dts",
    package_name = PACKAGE_NAME,
    package_json = "package.json",
    types = [":types"],
)

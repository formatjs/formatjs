load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("@npm//json-schema-to-typescript:index.bzl", "json2ts")
# load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "babel-plugin-react-intl"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "package.json",
    ],
    deps = [
        ":dist",
    ],
)

SRCS = glob(["*.ts"]) + ["options.schema.json"]

SRC_DEPS = [
    "//packages/intl-messageformat-parser:dist",
    "@npm//@babel/helper-plugin-utils",
    "@npm//fs-extra",
    "@npm//@types/fs-extra",
    "@npm//@babel/core",
    "@npm//@babel/types",
    "@npm//@types/babel__core",
    "@npm//@types/schema-utils",
    "@npm//schema-utils",
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

filegroup(
    name = "types",
    srcs = [":dist"],
    output_group = "types",
    visibility = ["//visibility:public"],
)

# TODO
# jest_test(
#     name = "unit",
#     srcs = SRCS + glob([
#         "tests/**/*.ts",
#         "tests/**/*.tsx",
#         "tests/**/*.snap",
#         "tests/**/*.js",
#         "tests/**/*.json",
#     ]),
#     deps = [
#         "//packages/intl-messageformat-parser:types",
#     ] + SRC_DEPS,
# )

# json2ts -i src/options.schema.json -o src/options.ts
json2ts(
    name = "options-gen",
    outs = ["tmp/options.ts"],
    args = [
        "-i",
        "$(execpath options.schema.json)",
        "-o",
        "$@",
    ],
    data = [
        "options.schema.json",
    ],
)

generated_file_test(
    name = "options",
    src = "options.ts",
    generated = ":options-gen",
)

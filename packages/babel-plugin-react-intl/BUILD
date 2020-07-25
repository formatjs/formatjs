load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("@npm//json-schema-to-typescript:index.bzl", "json2ts")
load("//tools:index.bzl", "ts_compile")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "babel-plugin-react-intl"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
    ],
    deps = [
        ":dist",
    ],
)

alias(
    name = "publish",
    actual = "%s.publish" % PACKAGE_NAME,
)

alias(
    name = "pack",
    actual = "%s.pack" % PACKAGE_NAME,
)

SRCS = glob(["*.ts"]) + ["options.schema.json"]

SRC_DEPS = [
    "//packages/intl-messageformat-parser:dist",
    "//packages/ts-transformer:dist",
    "@npm//@babel/helper-plugin-utils",
    "@npm//fs-extra",
    "@npm//@types/fs-extra",
    "@npm//@babel/core",
    "@npm//@babel/types",
    "@npm//@types/babel__core",
    "@npm//schema-utils",
]

ts_compile(
    name = "dist",
    package_name = PACKAGE_NAME,
    srcs = SRCS,
    deps = SRC_DEPS,
)

jest_test(
    name = "unit",
    srcs = SRCS + glob([
        "tests/**/*.ts",
        "tests/**/*.tsx",
        "tests/**/*.js",
        "tests/**/*.json",
    ]),
    snapshots = glob([
        "tests/**/*.snap",
    ]),
    deps = [
        "//packages/intl-messageformat-parser:types",
        "//packages/ts-transformer:types",
        "@npm//@babel/plugin-syntax-jsx",
    ] + SRC_DEPS,
)

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

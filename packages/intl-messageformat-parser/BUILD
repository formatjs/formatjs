load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "nodejs_binary", "pkg_npm")
load("@npm//ts-node:index.bzl", "ts_node")
load("//tools:index.bzl", "rollup_dts", "ts_compile")
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
        "%s.d.ts" % PACKAGE_NAME,
        ":dist",
        ":dist-esm",
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

SRCS = glob(["src/*.ts"]) + ["index.ts"]

SRC_DEPS = [
    "//packages/intl-numberformat:dist",
]

ts_compile(
    name = "dist",
    package_name = PACKAGE_NAME,
    srcs = SRCS,
    skip_esm = False,
    deps = SRC_DEPS,
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
    types = [
        ":types",
        "//packages/intl-numberformat:types",
        "//packages/intl-utils:types",
    ],
)

ts_node(
    name = "benchmark",
    args = [
        "$(execpath tests/benchmark.js)",
    ],
    data = [
        "@npm//benchmark",
        "tests/benchmark.js",
    ] + SRCS + SRC_DEPS,
)

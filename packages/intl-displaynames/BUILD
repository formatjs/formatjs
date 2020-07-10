load("@build_bazel_rules_nodejs//:index.bzl", "pkg_npm")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("@npm//ts-node:index.bzl", "ts_node")
load("//tools:index.bzl", "generate_src_file", "rollup_dts", "ts_compile")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "intl-displaynames"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "package.json",
    ],
    deps = [
        "%s.d.ts" % PACKAGE_NAME,
        "polyfill-locales.js",
        ":dist",
        ":dist-esm",
        ":locale-data",
    ],
)

SRCS = glob(
    [
        "*.ts",
        "src/*.ts",
        "src/data/*",
    ],
    exclude = ["test*.*"],
)

TESTS = glob([
    "tests/*.test.ts",
])

SRC_DEPS = [
    "//packages/intl-utils:dist",
    "//packages/intl-getcanonicallocales:dist",
]

TEST_DEPS = SRC_DEPS + [
    "//packages/intl-utils:types",
    "//packages/intl-getcanonicallocales:types",
]

ts_compile(
    name = "dist",
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = SRCS,
    deps = SRC_DEPS,
)

jest_test(
    name = "unit",
    srcs = SRCS + TESTS,
    deps = TEST_DEPS + [":tests-locale-data"],
)

rollup_dts(
    name = "rollup-dts",
    package_name = PACKAGE_NAME,
    package_json = "package.json",
    types = [":types"],
)

# CLDR
CLDR_DEPS = [
    "scripts/cldr.ts",
    "scripts/extract-displaynames.ts",
    "//:tsconfig.json",
    "//packages/intl-utils:dist",
    "//packages/intl-utils:types",
    "@npm//@types/fs-extra",
    "@npm//@types/glob",
    "@npm//@types/lodash",
    "@npm//@types/minimist",
    "@npm//@types/node",
    "@npm//cldr-core",
    "@npm//cldr-localenames-full",
    "@npm//cldr-numbers-full",
    "@npm//fs-extra",
    "@npm//glob",
    "@npm//lodash",
    "@npm//minimist",
]

ts_node(
    name = "locale-data",
    args = [
        "$(execpath scripts/cldr.ts)",
        "--outDir",
        "$(@D)",
    ],
    data = CLDR_DEPS,
    output_dir = True,
)

ts_node(
    name = "tests-locale-data",
    args = [
        "$(execpath scripts/cldr.ts)",
        "--testDataDir",
        "$(@D)",
    ],
    data = CLDR_DEPS,
    output_dir = True,
)

ts_node(
    name = "polyfill-locales",
    outs = ["polyfill-locales.js"],
    args = [
        "$(execpath scripts/cldr.ts)",
        "--polyfillLocalesOutFile",
        "$@",
    ],
    data = CLDR_DEPS,
    visibility = ["//packages/react-intl:__subpackages__"],
)

generate_src_file(
    name = "test262-main",
    src = "test262-main.ts",
    args = [
        "$(execpath scripts/cldr.ts)",
        "--test262MainFile",
        "$@",
    ],
    data = CLDR_DEPS,
)

# Test262
# TODO
ts_project(
    name = "test262-main-bundle",
    srcs = SRCS + ["test262-main.ts"],
    declaration = True,
    declaration_map = True,
    extends = [
        "//:tsconfig.json",
    ],
    outdir = "test262",
    source_map = True,
    tsconfig = "//:tsconfig.es6.json",
    deps = SRC_DEPS,
)

# rollup_bundle(
#     name = "test262-polyfill",
#     srcs = [
#         ":test262-main-bundle",
#     ],
#     config_file = "//:rollup.config.js",
#     entry_point = "test262/test262-main.js",
#     format = "umd",
#     deps = [
#         "@npm//@rollup/plugin-node-resolve",
#         "@npm//@rollup/plugin-commonjs",
#         "@npm//@rollup/plugin-replace",
#         "@npm//@rollup/plugin-json",
#     ] + SRC_DEPS,
# )

# TODO
# test262_harness_test(
#     name = "test262",
#     data = [
#         "test262-polyfill.js",
#         "//:test262-all",
#         "//:test262-displaynames",
#     ],
#     templated_args = [
#         "--reporter-keys",
#         "file,attrs,result",
#         "--prelude",
#         "$(rootpath test262-polyfill.js)",
#         "$(rootpaths //:test262-displaynames)",
#     ],
# )

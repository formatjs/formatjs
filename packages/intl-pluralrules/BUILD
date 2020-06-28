load("@build_bazel_rules_nodejs//:index.bzl", "copy_to_bin", "generated_file_test", "npm_package_bin", "pkg_npm")
load("@npm//@bazel/rollup:index.bzl", "rollup_bundle")
load("@npm//@bazel/typescript:index.bzl", "ts_project")

load("@npm//test262-harness:index.bzl", "test262_harness_test")
load("@npm//ts-node:index.bzl", "ts_node_test")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "intl-pluralrules"

pkg_npm(
    name = PACKAGE_NAME,
    srcs = ["package.json"],
    deps = [
        ":dist",
        ":locale-data",
        ":polyfill-locales.js",
    ],
)

SRCS = glob(
    ["*.ts"],
    exclude = ["test*.*"],
)

SRC_DEPS = [
    "@npm//@types/node",
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
    extends = ["//:tsconfig.json"],
    outdir = "lib",
    source_map = True,
    tsconfig = "//:tsconfig.esm.json",
    visibility = ["//visibility:public"],
    deps = SRC_DEPS,
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
    jest_config = ":jest.config.js",
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
        ":tests-locale-data",
    ] + SRC_DEPS,
)

# API Extractor
copy_to_bin(
    name = "setup-api-extractor",
    srcs = [
        "api-extractor.json",
        "package.json",
        "tsconfig.json",
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
        ":dist",
        ":setup-api-extractor",
        "//:setup-api-extractor",
    ],
    package = "api-extractor",
    tool = "@npm//@microsoft/api-extractor/bin:api-extractor",
)

# CLDR
npm_package_bin(
    name = "locale-data",
    args = [
        "$(execpath scripts/cldr.ts)",
        "--outDir",
        "$(@D)",
    ],
    data = [
        "scripts/cldr.ts",
        "//:tsconfig.json",
        "//packages/intl-utils:dist",
        "@npm//@types/fs-extra",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//@types/serialize-javascript",
        "@npm//cldr-core",
        "@npm//fs-extra",
        "@npm//make-plural-compiler",
        "@npm//minimist",
        "@npm//serialize-javascript",
    ],
    output_dir = True,
    package = "ts-node",
)

npm_package_bin(
    name = "tests-locale-data",
    args = [
        "$(execpath scripts/cldr.ts)",
        "--testDataDir",
        "$(@D)",
    ],
    data = [
        "scripts/cldr.ts",
        "//:tsconfig.json",
        "//packages/intl-utils:dist",
        "@npm//@types/fs-extra",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//@types/serialize-javascript",
        "@npm//cldr-core",
        "@npm//fs-extra",
        "@npm//make-plural-compiler",
        "@npm//minimist",
        "@npm//serialize-javascript",
    ],
    output_dir = True,
    package = "ts-node",
)

npm_package_bin(
    name = "polyfill-locales",
    outs = ["polyfill-locales.js"],
    args = [
        "$(execpath scripts/cldr.ts)",
        "--polyfillLocalesOutFile",
        "$@",
    ],
    data = [
        "scripts/cldr.ts",
        "//:tsconfig.json",
        "//packages/intl-utils:dist",
        "@npm//@types/fs-extra",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//@types/serialize-javascript",
        "@npm//cldr-core",
        "@npm//fs-extra",
        "@npm//make-plural-compiler",
        "@npm//minimist",
        "@npm//serialize-javascript",
    ],
    package = "ts-node",
)

npm_package_bin(
    name = "test262-main-gen",
    outs = ["tmp/test262-main.ts"],
    args = [
        "$(execpath scripts/cldr.ts)",
        "--test262MainFile",
        "$@",
    ],
    data = [
        "scripts/cldr.ts",
        "//:tsconfig.json",
        "//packages/intl-utils:dist",
        "@npm//@types/fs-extra",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//@types/serialize-javascript",
        "@npm//cldr-core",
        "@npm//fs-extra",
        "@npm//make-plural-compiler",
        "@npm//minimist",
        "@npm//serialize-javascript",
    ],
    package = "ts-node",
)

generated_file_test(
    name = "test262-main",
    src = "test262-main.ts",
    generated = ":test262-main-gen",
)

# Test262
ts_project(
    name = "test262-main-bundle",
    srcs = SRCS + ["test262-main.ts"],
    extends = [
        "tsconfig.json",
        "//:tsconfig.json",
    ],
    outdir = "test262",
    tsconfig = "tsconfig.es6.json",
    visibility = ["//visibility:public"],
    deps = SRC_DEPS,
)

rollup_bundle(
    name = "test262-polyfill",
    srcs = [
        "test262/index.js",
        "test262/polyfill-force.js",
    ],
    config_file = "rollup.config.test262.js",
    entry_point = "test262/test262-main.js",
    format = "umd",
    deps = [
        "@npm//rollup-plugin-node-resolve",
        "@npm//rollup-plugin-commonjs",
        "@npm//rollup-plugin-typescript2",
        "@npm//@rollup/plugin-json",
    ] + SRC_DEPS,
)

# npm_package_bin(
#     name = "test262-result",
#     args = [
#         "--reporter-keys",
#         "file,attrs,result",
#         "--prelude",
#         "$(execpath test262-polyfill.js)",
#         "-r",
#         "json",
#         "$(rootpaths //:test262-pluralrules)",
#     ],
#     data = [
#         ":test262-polyfill.js",
#         "//:test262-all",
#         "//:test262-pluralrules",
#     ],
#     package = "test262-harness",
#     stdout = "test262-result.json",
# )

# ts_node_test(
#     name = "test262",
#     data = [
#         "tests/verify.ts",
#         ":test262-result.json",
#         "//:tsconfig.json",
#         "@npm//@types/minimist",
#         "@npm//@types/node",
#         "@npm//minimist",
#     ],
#     templated_args = [
#         "$(execpath tests/verify.ts)",
#         "--result",
#         "$(rootpath :test262-result.json)",
#     ],
# )


test262_harness_test(
    name="test262",
    templated_args =[
        "--reporter-keys",
        "file,attrs,result",
        "--prelude",
        "$(rootpath test262-polyfill.js)",
        "$(rootpaths //:test262-pluralrules)",
    ],
    data = [
        "test262-polyfill.js",
        "//:test262-all",
        "//:test262-pluralrules",
    ],
)

load("@build_bazel_rules_nodejs//:index.bzl", "copy_to_bin", "npm_package_bin", "pkg_npm")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("//tools:jest.bzl", "jest_test")
# load("@npm//test262-harness:index.bzl", "test262_harness_test")
load("@npm//ts-node:index.bzl", "ts_node_test")

PACKAGE_NAME = "intl-pluralrules"

pkg_npm(
    name = PACKAGE_NAME,
    srcs = ["package.json"],
    deps = [
        ":lib",
        ":locale-data",
        ":polyfill-locales.js",
    ],
)

SRCS = glob(["*.ts"])

SRC_DEPS = [
    "@npm//@types/node",
    "//packages/intl-utils:lib",
    "//packages/intl-getcanonicallocales:lib",
]

ts_project(
    name = "lib",
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = SRCS,
    declaration = True,
    declaration_map = True,
    extends = ["//:tsconfig.json"],
    source_map = True,
    tsconfig = "tsconfig.json",
    visibility = ["//visibility:public"],
    deps = SRC_DEPS,
)

jest_test(
    name = "test",
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
        ":lib",
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
        "//packages/intl-utils:lib",
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
        "//packages/intl-utils:lib",
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
        "//packages/intl-utils:lib",
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
    name = "test262-main",
    outs = ["test262-main.js"],
    args = [
        "$(execpath scripts/cldr.ts)",
        "--test262MainFile",
        "$@",
    ],
    data = [
        "scripts/cldr.ts",
        "//:tsconfig.json",
        "//packages/intl-utils:lib",
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

# ts_node_test(
#     name = "test262",
#     templated_args = [
#         "$(execpath tests/runner.ts)",
#         "--reporter-keys",
#         "file,attrs,result",
#         "--prelude",
#         "$(rootpath test262-main.js)",
#         "$(rootpaths @test262//:pluralrules)",
#     ],
#     data = [
#         "tests/runner.ts",
#         ":test262-main.js",
#         "//:tsconfig.json",
#         "@npm//test262-harness",
#         "@npm//@types/glob",
#         "@npm//@types/minimist",
#         "@npm//@types/node",
#         "@npm//minimist",
#         "@test262//:all",
#          "@test262//:pluralrules",
#     ]
# )

npm_package_bin(
    name = "test262",
    stdout = "test262-result.json",
    args = [
        "--reporter-keys",
        "file,attrs,result",
        "--prelude",
        "$(execpath test262-main.js)",
        "-r",
        "json",
        "$(locations @test262//:pluralrules)",
    ],
    data = [
        ":test262-main.js",
        "@test262//:all",
        "@test262//:pluralrules",
    ],
    package = "test262-harness",
)

ts_node_test(
    name = "test262-verify",
    templated_args = [
        "$(execpath tests/verify.ts)",
        "--result",
        "$(rootpath :test262-result.json)",
    ],
    data = [
        "tests/verify.ts",
        "//:tsconfig.json",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//minimist",
        ":test262-result.json"
    ]
)

# test262_harness_test(
#     name="test262",
#     templated_args =[
#         "--reporter-keys",
#         "file,attrs,result",
#         "--prelude",
#         "$(rootpath :test262-main.js)",
#         "$(rootpaths @test262//:pluralrules)",
#     ],
#     data = [
#         ":test262-main.js",
#         "@test262//:all",
#         "@test262//:pluralrules",
#     ],
# )

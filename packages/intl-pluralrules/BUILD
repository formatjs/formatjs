load("@build_bazel_rules_nodejs//:index.bzl", "pkg_npm")
load("@npm//@bazel/rollup:index.bzl", "rollup_bundle")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("@npm//test262-harness:index.bzl", "test262_harness_test")

# load("@npm//karma:index.bzl", "karma_test")
load("@npm//ts-node:index.bzl", "ts_node")
load("//tools:index.bzl", "generate_src_file", "rollup_dts", "ts_compile")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "intl-pluralrules"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "package.json",
    ],
    visibility = ["//visibility:public"],
    deps = [
        "%s.d.ts" % PACKAGE_NAME,
        "polyfill-locales.js",
        ":dist",
        ":dist-esm",
        ":locale-data",
    ],
)

SRCS = glob(
    ["*.ts"],
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
    "//:tsconfig.json",
    "//packages/intl-utils:dist",
    "//packages/intl-utils:types",
    "@npm//@types/fs-extra",
    "@npm//@types/minimist",
    "@npm//@types/node",
    "@npm//@types/serialize-javascript",
    "@npm//cldr-core",
    "@npm//fs-extra",
    "@npm//make-plural-compiler",
    "@npm//minimist",
    "@npm//serialize-javascript",
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
    visibility = ["//visibility:public"],
    deps = SRC_DEPS,
)

rollup_bundle(
    name = "test262-polyfill",
    srcs = [
        "test262/index.js",
        "test262/polyfill-force.js",
    ],
    config_file = "//:rollup.config.js",
    entry_point = "test262/test262-main.js",
    format = "umd",
    deps = [
        "@npm//@rollup/plugin-node-resolve",
        "@npm//@rollup/plugin-commonjs",
        "@npm//@rollup/plugin-replace",
        "@npm//@rollup/plugin-json",
    ] + SRC_DEPS,
)

test262_harness_test(
    name = "test262",
    data = [
        "test262-polyfill.js",
        "//:test262-all",
        "//:test262-pluralrules",
    ],
    templated_args = [
        "--reporter-keys",
        "file,attrs,result",
        "--prelude",
        "$(rootpath test262-polyfill.js)",
        "$(rootpaths //:test262-pluralrules)",
    ],
)

# karma_bundle_test(
#     name = "karma",
#     srcs = SRCS,
#     tests = TESTS,
#     deps = SRC_DEPS,
# )

# # karma tests
# ts_project(
#     name = "karma-tests",
#     srcs = SRCS + TESTS,
#     declaration = True,
#     declaration_map = True,
#     extends = ["//:tsconfig.json"],
#     outdir = "tests-karma",
#     source_map = True,
#     tsconfig = "//:tsconfig.esm.json",
#     visibility = ["//visibility:public"],
#     deps = TEST_DEPS,
# )

# BUNDLE_KARMA_TESTS = ["karma-tests-%s.bundled" % f[f.rindex("/") + 1:f.rindex(".")] for f in TESTS]

# [rollup_bundle(
#     name = "karma-tests-%s.bundled" % f[f.rindex("/") + 1:f.rindex(".")],
#     srcs = ["tests-karma/%s.js" % f[:f.rindex(".")] for f in SRCS] + [":tests-locale-data"],
#     config_file = "//:rollup.config.js",
#     entry_point = "tests-karma/%s.js" % f[:f.rindex(".")],
#     format = "umd",
#     deps = [
#         "@npm//@rollup/plugin-node-resolve",
#         "@npm//@rollup/plugin-commonjs",
#         "@npm//@rollup/plugin-replace",
#         "@npm//@rollup/plugin-json",
#     ] + SRC_DEPS,
# ) for f in TESTS]

# karma_test(
#     name = "karma",
#     data = [
#         "//:karma.conf.js",
#         "@npm//karma-jasmine",
#         "@npm//karma-chrome-launcher",
#         "@npm//karma-jasmine-matchers",
#     ] + BUNDLE_KARMA_TESTS,
#     templated_args = [
#         "start",
#         "$(rootpath //:karma.conf.js)",
#     ] + ["$$(rlocation $(location %s))" % f for f in BUNDLE_KARMA_TESTS],
# )

# karma_test(
#     name = "karma-ci",
#     configuration_env_vars = [
#         "SAUCE_USERNAME",
#         "SAUCE_ACCESS_KEY",
#     ],
#     data = [
#         "//:karma.conf-ci.js",
#         "@npm//karma-jasmine",
#         "@npm//karma-sauce-launcher",
#         "@npm//karma-jasmine-matchers",
#     ] + BUNDLE_KARMA_TESTS,
#     templated_args = [
#         "start",
#         "$(rootpath //:karma.conf-ci.js)",
#     ] + ["$$(rlocation $(location %s))" % f for f in BUNDLE_KARMA_TESTS],
# )

load("@build_bazel_rules_nodejs//:index.bzl", "copy_to_bin", "npm_package_bin", "pkg_npm")
load("@npm//@bazel/rollup:index.bzl", "rollup_bundle")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("@npm//karma:index.bzl", "karma_test")
load("//tools:index.bzl", "generate_src_file")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "intl-getcanonicallocales"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "package.json",
    ],
    deps = [
        "%s.d.ts" % PACKAGE_NAME,
        ":dist",
        ":lib",
    ],
)

SRCS = glob(["src/*.ts"]) + [
    "index.ts",
    "polyfill.ts",
]

TESTS = glob([
    "tests/*.test.ts",
])

SRC_DEPS = [
    "@npm//cldr-core",
    "@npm//@types/node",
]

TEST_DEPS = SRC_DEPS

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
    visibility = ["//visibility:public"],
)

jest_test(
    name = "unit",
    srcs = SRCS + TESTS,
    deps = TEST_DEPS,
)

# aliases
generate_src_file(
    name = "aliases",
    src = "src/aliases.ts",
    args = [
        "$(execpath scripts/aliases.ts)",
        "--out",
        "$@",
    ],
    data = [
        "scripts/aliases.ts",
        "//:tsconfig.json",
        "@npm//@types/fs-extra",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//cldr-core",
        "@npm//fs-extra",
        "@npm//minimist",
    ],
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
        "-c",
        "$(@D)/api-extractor.json",
    ],
    data = [
        "api-extractor.json",
        "tsconfig.json",
        ":copy-package-json",
        ":types",
    ],
    package = "api-extractor",
    tool = "@npm//@microsoft/api-extractor/bin:api-extractor",
)

# karma tests
ts_project(
    name = "karma-tests",
    srcs = SRCS + TESTS,
    declaration = True,
    declaration_map = True,
    extends = ["//:tsconfig.json"],
    outdir = "tests-karma",
    source_map = True,
    tsconfig = "//:tsconfig.esm.json",
    visibility = ["//visibility:public"],
    deps = TEST_DEPS + [
        "@npm//@jest/transform",
        "@npm//ts-jest",
        "@npm//@types/jest",
    ],
)

BUNDLE_KARMA_TESTS = ["karma-tests-%s.bundled" % f[f.rindex("/") + 1:f.rindex(".")] for f in TESTS]

[rollup_bundle(
    name = "karma-tests-%s.bundled" % f[f.rindex("/") + 1:f.rindex(".")],
    srcs = ["tests-karma/%s.js" % f[:f.rindex(".")] for f in SRCS],
    config_file = "//:rollup.config.js",
    entry_point = "tests-karma/%s.js" % f[:f.rindex(".")],
    format = "umd",
    deps = [
        "@npm//rollup-plugin-node-resolve",
        "@npm//rollup-plugin-commonjs",
        "@npm//rollup-plugin-replace",
        "@npm//@rollup/plugin-json",
    ] + SRC_DEPS,
) for f in TESTS]

karma_test(
    name = "karma",
    data = [
        "//:karma.conf.js",
        "@npm//karma-jasmine",
        "@npm//karma-chrome-launcher",
        "@npm//karma-jasmine-matchers",
    ] + BUNDLE_KARMA_TESTS,
    templated_args = [
        "start",
        "$(rootpath //:karma.conf.js)",
    ] + ["$$(rlocation $(location %s))" % f for f in BUNDLE_KARMA_TESTS],
)

karma_test(
    name = "karma-ci",
    configuration_env_vars = [
        "SAUCE_USERNAME",
        "SAUCE_ACCESS_KEY",
    ],
    data = [
        "//:karma.conf-ci.js",
        "@npm//karma-jasmine",
        "@npm//karma-sauce-launcher",
        "@npm//karma-jasmine-matchers",
    ] + BUNDLE_KARMA_TESTS,
    templated_args = [
        "start",
        "$(rootpath //:karma.conf-ci.js)",
    ] + ["$$(rlocation $(location %s))" % f for f in BUNDLE_KARMA_TESTS],
)

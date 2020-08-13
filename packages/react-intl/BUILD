load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("@npm//@bazel/rollup:index.bzl", "rollup_bundle")
load("@npm//@bazel/terser:index.bzl", "terser_minified")
load("//tools:index.bzl", "rollup_dts", "ts_compile")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "react-intl"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
    ],
    deps = [
        "%s.d.ts" % PACKAGE_NAME,
        "%s.umd.js" % PACKAGE_NAME,
        ":%s.umd.min" % PACKAGE_NAME,
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

SRCS = glob(["src/**/*.ts*"]) + ["index.ts"]

SRC_DEPS = [
    "@npm//react",
    "@npm//@types/react",
    "//packages/intl-numberformat:dist",
    "//packages/intl-listformat:dist",
    "//packages/intl-displaynames:dist",
    "//packages/intl-datetimeformat:dist",
    "//packages/intl-relativetimeformat:dist",
    "//packages/intl-messageformat:dist",
    "@npm//hoist-non-react-statics",
    "@npm//@types/hoist-non-react-statics",
    "@npm//shallow-equal",
    "@npm//fast-memoize",
]

TESTS = glob([
    "tests/unit/**/*.ts*",
    "tests/unit/**/*.snap",
])

TEST_DEPS = SRC_DEPS + [
    "@npm//enzyme-to-json",
    "@npm//enzyme",
    "@npm//@types/enzyme",
    "@npm//enzyme-adapter-react-16",
    "@npm//react-dom",
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
    srcs = SRCS + TESTS + [
        "tests/setup.js",
        "//packages/intl-numberformat:locale-data",
        "//packages/intl-displaynames:polyfill-locales.js",
    ],
    jest_config = "jest.config.js",
    deps = TEST_DEPS,
)

jest_test(
    name = "functional",
    srcs = glob(["tests/functional/**/*.ts*"]) + [
        "tests/setup.js",
        "react-intl.umd.js",
        ":react-intl.umd.min",
        "package.json",
        "//packages/intl-numberformat:locale-data",
        "//packages/intl-displaynames:polyfill-locales.js",
    ],
    jest_config = "jest.config.js",
    deps = TEST_DEPS + [":dist"],
)

rollup_dts(
    name = "rollup-dts",
    package_name = PACKAGE_NAME,
    package_json = "package.json",
    types = [
        ":types",
        "@npm//@types/react",
        "//packages/intl-numberformat:types",
        "//packages/intl-listformat:types",
        "//packages/intl-displaynames:types",
        "//packages/intl-datetimeformat:types",
        "//packages/intl-relativetimeformat:types",
        "//packages/intl-messageformat:types",
        "//packages/intl-messageformat-parser:types",
        "//packages/intl-utils:types",
        "@npm//@types/hoist-non-react-statics",
    ],
)

rollup_bundle(
    name = "%s.umd" % PACKAGE_NAME,
    srcs = [":dist-esm"],
    args = [
        "--name",
        "ReactIntl",
    ],
    config_file = "//:rollup.config.js",
    entry_point = "lib/index.js",
    format = "umd",
    deps = [
        "@npm//@rollup/plugin-node-resolve",
        "@npm//@rollup/plugin-commonjs",
        "@npm//@rollup/plugin-replace",
        "@npm//@rollup/plugin-json",
    ] + SRC_DEPS,
)

terser_minified(
    name = "%s.umd.min" % PACKAGE_NAME,
    src = "%s.umd.js" % PACKAGE_NAME,
    sourcemap = False,
)

# karma tests
# TODO
# ts_project(
#     name = "karma-tests",
#     srcs = SRCS + TESTS,
#     declaration = True,
#     declaration_map = True,
#     extends = ["//:tsconfig.json"],
#     out_dir = "tests-karma",
#     tsconfig = "//:tsconfig.esm.json",
#     visibility = ["//visibility:public"],
#     deps = TEST_DEPS,
# )

# BUNDLE_KARMA_TESTS = ["karma-tests-%s.bundled" % f[f.rindex("/") + 1:f.rindex(".")] for f in TESTS]

# [rollup_bundle(
#     name = "karma-tests-%s.bundled" % f[f.rindex("/") + 1:f.rindex(".")],
#     srcs = ["tests-karma/%s.js" % f[:f.rindex(".")] for f in SRCS],
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

generated_file_test(
    name = "tsconfig_json",
    src = "tsconfig.json",
    generated = "//tools:tsconfig.golden.json",
)

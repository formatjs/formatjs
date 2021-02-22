load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("//tools:index.bzl", "prettier_check", "ts_compile")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "intl"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
    ],
    deps = [
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
    "//packages/ecma402-abstract:dist",
    "//packages/intl-listformat:dist",
    "//packages/intl-displaynames:dist",
    "//packages/intl-relativetimeformat:dist",
    "//packages/intl-messageformat:dist",
    "//packages/intl-datetimeformat:dist",
    "@npm//fast-memoize",
    "@npm//@types/node",
]

TESTS = glob([
    "tests/*.ts*",
    "tests/__snapshots__/*.snap",
])

ts_compile(
    name = "dist",
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = SRCS,
    skip_esm = False,
    deps = SRC_DEPS,
)

jest_test(
    name = "unit",
    srcs = SRCS + TESTS + [
        "//packages/intl-datetimeformat:locale-data",
        "//packages/intl-datetimeformat:add-all-tz",
        "//packages/intl-numberformat:locale-data",
        "//packages/intl-displaynames:polyfill-locales.js",
    ],
    deps = SRC_DEPS + [
        "//packages/intl-numberformat:dist",
        "//packages/intl-numberformat:types",
        "//packages/intl-listformat:types",
        "//packages/intl-displaynames:types",
        "//packages/intl-relativetimeformat:types",
        "//packages/intl-messageformat:types",
        "//packages/intl-datetimeformat:types",
        "//packages/intl-messageformat-parser:types",
        "//packages/ecma402-abstract:types",
    ],
)

generated_file_test(
    name = "tsconfig_json",
    src = "tsconfig.json",
    generated = "//tools:tsconfig.golden.json",
)

prettier_check(
    name = "prettier",
    srcs = glob(
        [
            "**/*",
        ],
        exclude = [
            "BUILD",
            "CHANGELOG.md",
            "tests/__snapshots__/*",
        ],
    ),
)

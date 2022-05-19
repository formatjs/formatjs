load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("//tools:index.bzl", "check_format", "package_json_test", "ts_compile")
load("//tools:jest.bzl", "jest_test")

exports_files(["package.json"])

PACKAGE_NAME = "intl"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json"
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
    "//packages/fast-memoize:dist",
    "//packages/icu-messageformat-parser:dist",
    "//packages/intl-displaynames:dist",
    "//packages/intl-listformat:dist",
    "//packages/intl-messageformat:dist",
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
        "//packages/intl-datetimeformat:add-all-tz",
        "//packages/intl-datetimeformat:locale-data",
        "//packages/intl-displaynames:locale-data",
        "//packages/intl-numberformat:locale-data",
    ],
    deps = SRC_DEPS + [
        "//packages/ecma402-abstract:types",
        "//packages/intl-datetimeformat:dist",
        "//packages/intl-datetimeformat:types",
        "//packages/intl-displaynames:types",
        "//packages/fast-memoize:types",
        "//packages/intl-listformat:types",
        "//packages/icu-messageformat-parser:types",
        "//packages/intl-messageformat:types",
        "//packages/intl-numberformat:dist",
        "//packages/intl-numberformat:types",
        "@npm//@types/node",
    ],
)

generated_file_test(
    name = "tsconfig_json",
    src = "tsconfig.json",
    generated = "//tools:tsconfig.golden.json",
)

check_format(
    name = "prettier",
    srcs = glob(
        [
            "**/*",
        ],
        exclude = [
            "CHANGELOG.md",
            "tests/__snapshots__/*",
        ],
    ),
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

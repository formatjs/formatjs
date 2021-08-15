load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "nodejs_binary", "pkg_npm")
load("//tools:index.bzl", "bundle_karma_tests", "check_format", "generate_src_file", "package_json_test", "ts_compile")
load("//tools:jest.bzl", "jest_test")

exports_files(["package.json"])

PACKAGE_NAME = "icu-messageformat-parser"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
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

SRCS = glob(["*.ts"])

SRC_DEPS = [
    "//packages/ecma402-abstract:dist",
    "//packages/icu-skeleton-parser:dist",
]

ts_compile(
    name = "dist",
    package_name = "@formatjs/%s" % PACKAGE_NAME,
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
        "//packages/ecma402-abstract:types",
        "//packages/icu-skeleton-parser:types",
    ] + SRC_DEPS,
)

nodejs_binary(
    name = "benchmark",
    data = [
        ":dist",
        "@npm//benchmark",
        "benchmark.js",
    ] + SRC_DEPS,
    entry_point = "benchmark.js",
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
            "**/*.generated.ts",
            "CHANGELOG.md",
            "tests/__snapshots__/*",
        ],
    ),
)

bundle_karma_tests(
    name = "bundled-karma-tests",
    srcs = SRCS,
    tests = [
        "tests/browser-smoke.test.ts",
    ],
    deps = SRC_DEPS,
)

generate_src_file(
    name = "regex",
    src = "regex.generated.ts",
    data = [
        "scripts/global.ts",
        "@npm//@unicode/unicode-13.0.0",
        "@npm//regenerate",
    ],
    entry_point = "scripts/regex-gen.ts",
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

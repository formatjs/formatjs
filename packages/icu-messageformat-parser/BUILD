load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_js//js:defs.bzl", "js_binary")
load("@aspect_rules_js//npm/private:npm_package.bzl", "npm_package")
load("//tools:index.bzl", "bundle_karma_tests", "check_format", "generate_src_file", "package_json_test", "ts_compile")
load("//tools:jest.bzl", "jest_test")

exports_files([
    "package.json",
])

PACKAGE_NAME = "icu-messageformat-parser"

npm_package(
    name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
        ":dist",
    ],
    package = "@formatjs/%s" % PACKAGE_NAME,
    visibility = ["//visibility:public"],
)

SRCS = glob(["*.ts"])

SRC_DEPS = [
    "//:node_modules/@formatjs/ecma402-abstract",
    "//:node_modules/@formatjs/icu-skeleton-parser",
]

ts_compile(
    name = "dist",
    srcs = SRCS,
    data = SRC_DEPS,
    package = "@formatjs/%s" % PACKAGE_NAME,
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
    deps = SRC_DEPS,
)

js_binary(
    name = "benchmark",
    data = [
        ":dist",
        "//:node_modules/benchmark",
        "benchmark.js",
    ] + SRC_DEPS,
    entry_point = "benchmark.js",
)

write_source_files(
    name = "tsconfig_json",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
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
        "//:node_modules/@unicode/unicode-13.0.0",
        "//:node_modules/regenerate",
    ],
    entry_point = "scripts/regex-gen.ts",
)

generate_src_file(
    name = "time-data",
    src = "time-data.generated.ts",
    data = [
        "//:node_modules/cldr-core",
    ],
    entry_point = "scripts/time-data-gen.ts",
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

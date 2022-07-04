load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("//tools:index.bzl", "check_format", "ts_compile")
load("//tools:jest.bzl", "jest_test")

exports_files(["package.json"])

PACKAGE_NAME = "intl-enumerator"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
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

SRCS = glob([
    "data/**/*.ts",
    "polyfills/**/*.ts",
    "*.ts",
])

TESTS = glob([
    "tests/*.test.ts",
])

SRC_DEPS = [
    "@npm//cldr-numbers-full"
]

TEST_DEPS = SRC_DEPS

ts_compile(
    name = "dist",
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = SRCS,
    skip_esm = False,
    deps = SRC_DEPS,
)

jest_test(
    name = "unit",
    srcs = SRCS + TESTS,
    deps = TEST_DEPS
)

# Test262
ts_project(
    name = "test262-main-bundle",
    srcs = SRCS,
    declaration = True,
    declaration_map = True,
    extends = "//:tsconfig.json",
    out_dir = "test262",
    resolve_json_module = True,
    tsconfig = "//:tsconfig.es6.json",
    deps = SRC_DEPS,
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
        ],
    ),
)

load("@build_bazel_rules_nodejs//:index.bzl", "pkg_npm")
load("//tools:index.bzl", "bundle_karma_tests", "generate_src_file", "rollup_dts", "ts_compile")
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
        ":dist-esm",
    ],
)

SRCS = glob(["src/**/*.ts"]) + [
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

ts_compile(
    name = "dist",
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = SRCS,
    deps = SRC_DEPS,
)

jest_test(
    name = "unit",
    srcs = SRCS + TESTS,
    deps = TEST_DEPS,
)

# aliases
generate_src_file(
    name = "aliases",
    src = "src/data/aliases.ts",
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
rollup_dts(
    name = "rollup-dts",
    package_name = PACKAGE_NAME,
    package_json = "package.json",
    types = [":types"],
)

# karma tests
bundle_karma_tests(
    name = "bundled-karma-tests",
    srcs = SRCS,
    tests = TESTS,
    deps = TEST_DEPS,
)

load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_esbuild//esbuild:defs.bzl", "esbuild")
load("@aspect_rules_js//npm/private:npm_package.bzl", "npm_package")
load("//tools:index.bzl", "bundle_karma_tests", "check_format", "generate_src_file", "package_json_test", "ts_compile")
load("//tools:jest.bzl", "jest_test")

exports_files([
    "package.json",
    "tsconfig.json",
])

PACKAGE_NAME = "intl-getcanonicallocales"

npm_package(
    name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
        ":dist",
        # polyfill-library uses this
        "polyfill.iife.js",
    ],
    package = "@formatjs/%s" % PACKAGE_NAME,
    visibility = ["//visibility:public"],
)

SRCS = glob([
    "src/**/*.ts",
    "*.ts",
])

TESTS = glob([
    "tests/*.test.ts",
])

SRC_DEPS = [
]

TEST_DEPS = SRC_DEPS

ts_compile(
    name = "dist",
    srcs = SRCS,
    package = "@formatjs/%s" % PACKAGE_NAME,
    skip_esm = False,
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
    src = "src/aliases.generated.ts",
    data = [
        "//:node_modules/cldr-core",
        "//:node_modules/json-stable-stringify",
        "//:node_modules/@types/json-stable-stringify",
    ],
    entry_point = "scripts/aliases.ts",
    visibility = ["//:__pkg__"],
)

generate_src_file(
    name = "likelySubtags",
    src = "src/likelySubtags.generated.ts",
    data = [
        "//:node_modules/cldr-core",
        "//:node_modules/json-stable-stringify",
        "//:node_modules/@types/json-stable-stringify",
    ],
    entry_point = "scripts/likely-subtags.ts",
    visibility = ["//:__pkg__"],
)

# karma tests
bundle_karma_tests(
    name = "bundled-karma-tests",
    srcs = SRCS,
    tests = TESTS,
    deps = TEST_DEPS,
)

write_source_files(
    name = "tsconfig_json",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
)

esbuild(
    name = "polyfill.iife",
    entry_point = "lib/polyfill.js",
    target = "es6",
    deps = [
        ":dist-esm",
        "//:node_modules/tslib",
    ] + SRC_DEPS,
)

check_format(
    name = "prettier",
    srcs = glob(
        [
            "**/*",
        ],
        exclude = [
            "CHANGELOG.md",
            "**/*.generated.*",
        ],
    ),
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

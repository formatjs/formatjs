load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("//tools:index.bzl", "bundle_karma_tests", "check_format", "esbuild", "generate_src_file", "package_json_test", "ts_compile")
load("//tools:jest.bzl", "jest_test")

exports_files(["package.json"])

PACKAGE_NAME = "intl-getcanonicallocales"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
    ],
    deps = [
        ":dist",
        # polyfill-library uses this
        "polyfill.iife.js",
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
    "src/**/*.ts",
    "*.ts",
])

TESTS = glob([
    "tests/*.test.ts",
])

SRC_DEPS = [
    "@npm//@types/node",
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
    deps = TEST_DEPS,
)

# aliases
generate_src_file(
    name = "aliases",
    src = "src/aliases.generated.ts",
    data = [
        "@npm//cldr-core",
    ],
    entry_point = "scripts/aliases.ts",
    visibility = ["//:__pkg__"],
)

generate_src_file(
    name = "likelySubtags",
    src = "src/likelySubtags.generated.ts",
    data = [
        "@npm//cldr-core",
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

generated_file_test(
    name = "tsconfig_json",
    src = "tsconfig.json",
    generated = "//tools:tsconfig.golden.json",
)

esbuild(
    name = "polyfill.iife",
    entry_point = "lib/polyfill.js",
    target = "es5",
    deps = [
        ":dist-esm",
        "@npm//tslib",
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

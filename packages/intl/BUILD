load("@aspect_bazel_lib//lib:copy_to_directory.bzl", "copy_to_directory")
load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_js//npm/private:npm_package.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("@npm//:tsd/package_json.bzl", tsd_bin = "bin")
load("//tools:index.bzl", "check_format", "package_json_test", "ts_compile")
load("//tools:jest.bzl", "jest_test")

npm_link_all_packages(name = "node_modules")

PACKAGE_NAME = "intl"

npm_package(
    name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
        ":dist",
        ":dist-esm",
    ],
    package = "@formatjs/%s" % PACKAGE_NAME,
    visibility = ["//visibility:public"],
)

SRCS = glob(["src/**/*.ts*"]) + ["index.ts"]

SRC_DEPS = [
    ":node_modules/@formatjs/ecma402-abstract",
    ":node_modules/@formatjs/fast-memoize",
    ":node_modules/@formatjs/icu-messageformat-parser",
    ":node_modules/@formatjs/intl-displaynames",
    ":node_modules/@formatjs/intl-listformat",
    ":node_modules/intl-messageformat",
]

TESTS = glob([
    "tests/*.ts*",
    "tests/__snapshots__/*.snap",
])

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
    deps = SRC_DEPS + [
        ":node_modules/@formatjs/intl-datetimeformat",
        ":node_modules/@formatjs/intl-numberformat",
        "//:node_modules/@types/node",
    ],
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
            "CHANGELOG.md",
            "tests/__snapshots__/*",
        ],
    ),
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

# TODO: make this a macro that paramtrizes on `.test-d.ts` files.
copy_to_directory(
    name = "global_type_overrides_test_files",
    srcs = [
        ":%s" % PACKAGE_NAME,
        "tests/global_type_overrides.test-d.ts",
    ],
    out = "global_type_overrides_test_files",
    # Remove the prefix so the package directory merges with the test file directory.
    replace_prefixes = dict([
        (
            "%s" % PACKAGE_NAME,
            "",
        ),
    ]),
)

tsd_bin.tsd_test(
    name = "global_type_overrides_test",
    args = [
        "--files",
        "tests/global_type_overrides.test-d.ts",
    ],
    chdir = "packages/%s/global_type_overrides_test_files" % PACKAGE_NAME,
    data = [
        "tsconfig.json",
        ":global_type_overrides_test_files",
        "//:node_modules/tsd",
    ] + SRC_DEPS,
)

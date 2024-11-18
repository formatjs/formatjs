load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_bazel_lib//lib:copy_to_directory.bzl", "copy_to_directory")
load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("@npm//:tsd/package_json.bzl", tsd_bin = "bin")
load("//tools:index.bzl", "package_json_test", "ts_compile")
load("//tools:jest.bzl", "jest_test")

npm_link_all_packages()

PACKAGE_NAME = "intl"

npm_package(
    name = "pkg",
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
    ":node_modules/@formatjs/fast-memoize",
    ":node_modules/@formatjs/icu-messageformat-parser",
    ":node_modules/intl-messageformat",
]

TESTS = glob([
    "tests/*.ts*",
    "tests/__snapshots__/*.snap",
])

ts_compile(
    name = "dist",
    srcs = [":srcs"],
    skip_esm = False,
    deps = SRC_DEPS,
)

jest_test(
    name = "unit_test",
    data = [":srcs"] + TESTS + SRC_DEPS + [
        "//:node_modules/@types/node",
    ],
)

write_source_files(
    name = "tsconfig_json",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

# TODO: make this a macro that paramtrizes on `.test-d.ts` files.
copy_to_directory(
    name = "global_type_overrides_test_files",
    srcs = [
        "tests/global_type_overrides.test-d.ts",
        "tsconfig.json",
        ":pkg",
    ],
    out = "global_type_overrides_test_files",
    # Remove the prefix so the package directory merges with the test file directory.
    replace_prefixes = dict([
        (
            "pkg",
            "",
        ),
    ]),
)

tsd_bin.tsd_test(
    name = "global_type_overrides_test",
    size = "small",
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

copy_to_bin(
    name = "srcs",
    srcs = SRCS,
)

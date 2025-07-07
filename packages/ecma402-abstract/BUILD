load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:index.bzl", "generate_src_file", "package_json_test", "ts_compile")
load("//tools:vitest.bzl", "vitest")

npm_link_all_packages()

PACKAGE_NAME = "ecma402-abstract"

npm_package(
    name = "pkg",
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
        ":dist",
    ],
    package = "@formatjs/%s" % PACKAGE_NAME,
    visibility = ["//visibility:public"],
)

SRCS = glob(
    [
        "**/*.ts",
    ],
    exclude = [
        "scripts/*.ts",
        "tests/*.ts",
    ],
)

SRC_DEPS = [
    ":node_modules/@formatjs/intl-localematcher",
    ":node_modules/@formatjs/fast-memoize",
    "//:node_modules/decimal.js",
]

ts_compile(
    name = "dist",
    srcs = [":srcs"],
    skip_esm = False,
    deps = SRC_DEPS,
)

vitest(
    name = "unit_test",
    srcs = SRCS + glob([
        "tests/**/*.ts",
        "tests/**/*.tsx",
    ]),
    deps = SRC_DEPS,
)

write_source_files(
    name = "tsconfig_json",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
)

# digit-mapping
generate_src_file(
    name = "digit-mapping",
    src = "NumberFormat/digit-mapping.generated.ts",
    data = [
        "//:node_modules/json-stable-stringify",
    ],
    entry_point = "scripts/digit-mapping.ts",
)

generate_src_file(
    name = "regex",
    src = "regex.generated.ts",
    data = [
        "//:node_modules/@types/regenerate",
        "//:node_modules/@unicode/unicode-13.0.0",
        "//:node_modules/regenerate",
    ],
    entry_point = "scripts/regex-gen.ts",
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

copy_to_bin(
    name = "srcs",
    srcs = SRCS,
)

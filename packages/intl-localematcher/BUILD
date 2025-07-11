load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:index.bzl", "generate_src_file", "package_json_test", "ts_compile")
load("//tools:vitest.bzl", "vitest")

npm_link_all_packages()

PACKAGE_NAME = "intl-localematcher"

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
    ["abstract/*"],
    exclude = ["tests/*"],
) + ["index.ts"]

SRC_DEPS = [
]

ts_compile(
    name = "dist",
    srcs = [":srcs"],
    skip_esm = False,
    deps = SRC_DEPS,
)

vitest(
    name = "unit_test",
    srcs = SRCS + glob(["tests/**/*.ts"]),
    deps = SRC_DEPS,
)

# Test262
write_source_files(
    name = "tsconfig_json",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
)

package_json_test(
    name = "package_json_test",
)

generate_src_file(
    name = "regions",
    src = "abstract/regions.generated.ts",
    data = [
        "//:node_modules/cldr-core",
        "//:node_modules/json-stable-stringify",
    ],
    entry_point = "scripts/regions-gen.ts",
)

copy_to_bin(
    name = "srcs",
    srcs = SRCS,
)

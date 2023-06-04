load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("//tools:index.bzl", "package_json_test", "ts_compile")

exports_files([
    "package.json",
    "tsconfig.json",
])

PACKAGE_NAME = "fast-memoize"

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

SRCS = glob([
    "src/*.ts",
    "*.ts",
])

SRC_DEPS = [
]

ts_compile(
    name = "dist",
    srcs = SRCS,
    package = "@formatjs/%s" % PACKAGE_NAME,
    skip_esm = False,
    deps = SRC_DEPS,
)

write_source_files(
    name = "tsconfig_json",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

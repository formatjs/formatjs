load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:index.bzl", "package_json_test", "ts_compile_node")
load("//tools:jest.bzl", "jest_test")

npm_link_all_packages(name = "node_modules")

exports_files([
    "package.json",
])

PACKAGE_NAME = "ts-transformer"

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

SRCS = glob([
    "src/*.ts",
    "*.ts",
])

SRC_DEPS = [
    "//:node_modules/@types/node",
    "//:node_modules/typescript",
    "//:node_modules/chalk",
    "//:node_modules/json-stable-stringify",
    "//:node_modules/@types/json-stable-stringify",
    ":node_modules/@formatjs/icu-messageformat-parser",
]

ts_compile_node(
    name = "dist",
    srcs = SRCS,
    deps = SRC_DEPS + [
        "//:node_modules/@jest/types",
        "//:node_modules/@types/jest",
        # TODO: move this into integration_tests target.
        "//:node_modules/ts-jest",
    ],
)

jest_test(
    name = "unit_test",
    data = SRCS + SRC_DEPS + glob([
        "tests/*.ts*",
        "tests/fixtures/*.ts*",
    ]),
    snapshots = glob(["tests/__snapshots__/*.snap"]),
)

write_source_files(
    name = "tsconfig_json",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

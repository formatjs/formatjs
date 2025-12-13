load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:index.bzl", "package_json_test", "ts_compile_node")
load("//tools:vitest.bzl", "vitest")

npm_link_all_packages()

npm_package(
    name = "pkg",
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
        ":dist",
    ],
    visibility = ["//visibility:public"],
)

SRCS = glob([
    "*.ts",
])

SRC_DEPS = [
    "//:node_modules/vue",
    "//:node_modules/@babel/types",
    ":node_modules/@formatjs/intl",
    ":node_modules/@formatjs/icu-messageformat-parser",
]

ts_compile_node(
    name = "dist",
    srcs = [":srcs"],
    deps = SRC_DEPS,
)

vitest(
    name = "unit_test",
    srcs = SRCS + glob([
        "tests/*",
    ]),
    dom = True,
    deps = SRC_DEPS + [
        "//:node_modules/@vue/compiler-dom",
        "//:node_modules/@vue/server-renderer",
        "//:node_modules/@vue/test-utils",
    ],
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

copy_to_bin(
    name = "srcs",
    srcs = SRCS,
)

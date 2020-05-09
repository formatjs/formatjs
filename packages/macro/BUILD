load("@npm_bazel_typescript//:index.bzl", "ts_project")
load("@build_bazel_rules_nodejs//:index.bzl", "pkg_npm")
load("//tools:tools.bzl", "generate_package_json")

package(default_visibility = ["//visibility:public"])

PACKAGE_NAME = "macro"

pkg_npm(
    name = PACKAGE_NAME,
    deps = [
        ":package.json",
        ":tsconfig",
        "//tools:LICENSE.md",
    ],
)

ts_project(
    name = "tsconfig",
    srcs = ["index.ts"],
    declaration = True,
    extends = ["//:tsconfig.json"],
    source_map = True,
)

generate_package_json(
    name = "generate-package-json",
    out = "package.json",
    description = "formatjs-related compiler macros",
    module_name = "@formatjs/%s" % PACKAGE_NAME,
)

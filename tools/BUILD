package(default_visibility = ["//visibility:public"])

load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary")
load("@npm_bazel_typescript//:index.bzl", "ts_library")

ts_library(
    name = "tools",
    srcs = [
        "api-extractor-wrapper.ts",
        "generate-package-json.ts",
    ],
    devmode_module = "commonjs",
    prodmode_module = "commonjs",
    deps = [
        "@npm//@microsoft/api-extractor",
        "@npm//@types/fs-extra",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//fs-extra",
        "@npm//minimist",
    ],
)

nodejs_binary(
    name = "api-extractor",
    data = [
        ":tools",
    ],
    entry_point = "api-extractor-wrapper.ts",
)

nodejs_binary(
    name = "generate-package-json",
    data = [
        "package.template.json",
        ":tools",
    ],
    entry_point = "generate-package-json.ts",
)

exports_files([
    "package.template.json",
    "LICENSE.md",
])

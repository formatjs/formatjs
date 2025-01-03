load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_esbuild//esbuild:defs.bzl", "esbuild")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:index.bzl", "package_json_test", "ts_compile_node")
load("//tools:jest.bzl", "jest_test")

npm_link_all_packages()

PACKAGE_NAME = "cli-lib"

exports_files(["package.json"])

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

SRCS = glob(["src/**/*.ts"]) + [
    "index.ts",
    "main.ts",
    # "package.json",
]

VUE_DEPS = [
    "//:node_modules/@vue/compiler-core",
    "//:node_modules/@babel/types",
    "//:node_modules/vue",
]

GLIMMER_HBS_DEPS = [
    "//:node_modules/@glimmer/env",
    "//:node_modules/@glimmer/reference",
    "//:node_modules/@glimmer/syntax",
    "//:node_modules/@glimmer/validator",
    "//:node_modules/content-tag",
    "//:node_modules/ember-template-recast",
]

SRC_DEPS = [
    ":node_modules/@formatjs/icu-messageformat-parser",
    ":node_modules/@formatjs/icu-skeleton-parser",
    ":node_modules/@formatjs/ts-transformer",
    ":node_modules/loud-rejection",
    "//:node_modules/@types/estree",
    "//:node_modules/@types/fs-extra",
    "//:node_modules/@types/json-stable-stringify",
    "//:node_modules/@types/node",
    "//:node_modules/chalk",
    "//:node_modules/commander",
    "//:node_modules/fast-glob",
    "//:node_modules/fs-extra",
    "//:node_modules/json-stable-stringify",
    "//:node_modules/typescript",
] + VUE_DEPS + GLIMMER_HBS_DEPS

ts_compile_node(
    name = "dist",
    srcs = [":srcs"],
    skip_cjs = True,
    deps = SRC_DEPS,
)

jest_test(
    name = "unit_test",
    data = [":srcs"] + SRC_DEPS + glob(["tests/unit/**/*"]),
)

write_source_files(
    name = "tsconfig_json",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
)

genrule(
    name = "bin",
    srcs = [":formatjs.js"],
    outs = ["bin/formatjs"],
    cmd = "cp $< $@",
)

esbuild(
    name = "formatjs",
    srcs = [":srcs"],
    entry_point = "main.ts",
    external = [
        "vue",
        "content-tag",
        "@glimmer/env",
        "@glimmer/reference",
        "@glimmer/syntax",
        "@glimmer/validator",
        "@vue/compiler-core",
        "content-tag",
        "ember-template-recast",
        "source-map-support",
    ],
    platform = "node",
    target = "node16",
    visibility = ["//packages/cli:__pkg__"],
    deps = [
        "//:node_modules/tslib",
    ] + SRC_DEPS,
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

copy_to_bin(
    name = "srcs",
    srcs = SRCS,
)

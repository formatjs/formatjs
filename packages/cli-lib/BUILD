load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_esbuild//esbuild:defs.bzl", "esbuild")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:index.bzl", "package_json_test", "ts_compile_node")
load("//tools:jest.bzl", "jest_test")

npm_link_all_packages(name = "node_modules")

PACKAGE_NAME = "cli-lib"

exports_files(["package.json"])

npm_package(
    name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
        ":dist",
    ],
    package = "@soxhub/formatjs-%s" % PACKAGE_NAME,
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
    "//:node_modules/@vue/compiler-sfc",
]

SRC_DEPS = [
    "//:node_modules/@types/estree",
    "//:node_modules/@types/fs-extra",
    "//:node_modules/@types/json-stable-stringify",
    "//:node_modules/@types/node",
    "//:node_modules/chalk",
    "//:node_modules/commander",
    "//:node_modules/fast-glob",
    "//:node_modules/fs-extra",
    "//:node_modules/json-stable-stringify",
    "//:node_modules/loud-rejection",
    "//:node_modules/typescript",
    "//:node_modules/@glimmer/env",
    "//:node_modules/@glimmer/reference",
    "//:node_modules/@glimmer/syntax",
    "//:node_modules/@glimmer/validator",
    "//:node_modules/ember-template-tag",
    "//:node_modules/ember-template-recast",
    ":node_modules/@babel/parser",
    ":node_modules/@formatjs/icu-messageformat-parser",
    ":node_modules/@formatjs/ts-transformer",
] + VUE_DEPS

ts_compile_node(
    name = "dist",
    srcs = SRCS,
    package = "@soxhub/formatjs-%s" % PACKAGE_NAME,
    skip_esm_esnext = False,
    deps = SRC_DEPS,
)

jest_test(
    name = "unit_test",
    data = SRCS + SRC_DEPS + [
        "//:node_modules/@types/rimraf",
        "//:node_modules/rimraf",
    ] + glob(["tests/unit/**/*"]),
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
    srcs = [":dist-esm-esnext"],
    entry_point = "lib_esnext/main.js",
    external = [
        "@vue/compiler-sfc",
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

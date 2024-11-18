load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_esbuild//esbuild:defs.bzl", "esbuild")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:index.bzl", "package_json_test", "ts_compile")
load("//tools:jest.bzl", "jest_test_v2")

npm_link_all_packages()

PACKAGE_NAME = "react-intl"

npm_package(
    name = "pkg",
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
        "%s.iife.js" % PACKAGE_NAME,
        ":dist",
        ":dist-esm",
    ],
    package = PACKAGE_NAME,
    visibility = ["//visibility:public"],
)

SRCS = glob(["src/**/*.ts*"]) + ["index.ts"]

SRC_DEPS = [
    ":node_modules/@formatjs/icu-messageformat-parser",
    ":node_modules/@formatjs/intl",
    ":node_modules/intl-messageformat",
    "//:node_modules/@types/hoist-non-react-statics",
    "//:node_modules/@types/react",
    "//:node_modules/hoist-non-react-statics",
    "//:node_modules/react",
]

TESTS = glob(
    [
        "tests/unit/**/*.ts*",
    ],
    exclude = ["tests/unit/components/__snapshots__/*"],
)

TEST_DEPS = SRC_DEPS + [
    "//:node_modules/@testing-library/jest-dom",
    "//:node_modules/@testing-library/react",
    "//:node_modules/@types/aria-query",
    "//:node_modules/@types/node",
    "//:node_modules/jest-environment-jsdom",
    "//:node_modules/react-dom",
    "//:node_modules/typescript",
]

ts_compile(
    name = "dist",
    srcs = [":srcs"],
    skip_esm = False,
    deps = SRC_DEPS,
)

esbuild(
    name = "%s.esbuild.iife" % PACKAGE_NAME,
    srcs = [":srcs"],
    config = {
        "globalName": "ReactIntl",
    },
    entry_point = "index.ts",
    external = ["react"],
    target = "es6",
    deps = SRC_DEPS,
)

genrule(
    name = "external-rename",
    srcs = [":%s.esbuild.iife.js" % PACKAGE_NAME],
    outs = ["%s.iife.js" % PACKAGE_NAME],
    cmd = "cat $< | sed -E 's/__require\\(\"react\"\\)/window.React/g' > $@",
)

jest_test_v2(
    name = "unit_test",
    srcs = [
        ":dist",
        ":tests_setup",
    ] + TESTS,
    jest_config = "jest.config.js",
    snapshots = glob(["tests/unit/components/__snapshots__/*"]),
    tsconfig = "tsconfig.jest.json",
    deps = TEST_DEPS,
)

write_source_files(
    name = "tsconfig_json",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

copy_to_bin(
    name = "srcs",
    srcs = SRCS,
)

copy_to_bin(
    name = "tests_setup",
    srcs = ["tests/setup.js"],
)

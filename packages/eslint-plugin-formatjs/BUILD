load("@build_bazel_rules_nodejs//:index.bzl", "pkg_npm")
load("//tools:index.bzl", "ts_compile")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "eslint-plugin-formatjs"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "package.json",
    ],
    deps = [
        ":dist",
    ],
)

SRCS = glob(["rules/*.ts"]) + [
    "index.ts",
    "util.ts",
]

SRC_DEPS = [
    "@npm//emoji-regex",
    "@npm//@types/emoji-regex",
    "@npm//@types/eslint",
    "@npm//@types/estree",
    "@npm//@typescript-eslint/typescript-estree",
    "//packages/intl-messageformat-parser:dist",
]

ts_compile(
    name = "dist",
    package_name = PACKAGE_NAME,
    srcs = SRCS,
    deps = SRC_DEPS,
)

# TODO
jest_test(
    name = "unit",
    srcs = SRCS + glob([
        "tests/**/*.ts",
        "tests/**/*.tsx",
        "tests/**/*.snap",
        "tests/**/*.js",
        "tests/**/*.json",
    ]),
    deps = [
        "@npm//eslint",
        "@npm//@typescript-eslint/parser",
        "//packages/intl-messageformat-parser:types",
    ] + SRC_DEPS,
)

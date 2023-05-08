load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_js//npm/private:npm_package.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:index.bzl", "check_format", "package_json_test", "ts_compile_node")
load("//tools:jest.bzl", "jest_test")

npm_link_all_packages(name = "node_modules")

PACKAGE_NAME = "eslint-plugin-formatjs"

npm_package(
    name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
        ":dist",
    ],
    package = PACKAGE_NAME,
    visibility = ["//visibility:public"],
)

SRCS = glob(["rules/*.ts"]) + [
    "index.ts",
    "util.ts",
]

SRC_DEPS = [
    "//:node_modules/@types/eslint",
    "//:node_modules/@types/estree",
    "//:node_modules/@types/node",
    "//:node_modules/@types/picomatch",
    "//:node_modules/@typescript-eslint/typescript-estree",
    "//:node_modules/eslint",
    "//:node_modules/magic-string",
    "//:node_modules/picomatch",
    "//:node_modules/typescript",
    "//:node_modules/unicode-emoji-utils",
    ":node_modules/@formatjs/icu-messageformat-parser",
    ":node_modules/@formatjs/ts-transformer",
]

ts_compile_node(
    name = "dist",
    srcs = SRCS,
    package = PACKAGE_NAME,
    deps = SRC_DEPS,
)

TESTS_BASE_SRCS = SRCS + glob(
    [
        "tests/*.ts",
    ],
    exclude = ["tests/*.test.ts"],
)

TEST_FILES = glob([
    "tests/*.test.ts",
])

jest_test(
    name = "unit_test",
    data = TESTS_BASE_SRCS + TEST_FILES + SRC_DEPS + [
        "//:node_modules/@typescript-eslint/parser",
        "//:node_modules/vue-eslint-parser",
    ],
)

write_source_files(
    name = "tsconfig_json",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
)

check_format(
    name = "prettier",
    srcs = glob(
        [
            "**/*",
        ],
        exclude = [
            "CHANGELOG.md",
        ],
    ),
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

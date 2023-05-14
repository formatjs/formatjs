load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:index.bzl", "check_format", "package_json_test", "ts_compile_node")
load("//tools:jest.bzl", "jest_test")

npm_link_all_packages(name = "node_modules")

PACKAGE_NAME = "babel-plugin-formatjs"

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

SRCS = glob(
    ["**/*.ts"],
    exclude = ["tests/**/*"],
)

SRC_DEPS = [
    "//:node_modules/@babel/core",
    "//:node_modules/@babel/helper-plugin-utils",
    "//:node_modules/@babel/plugin-syntax-jsx",
    "//:node_modules/@babel/traverse",
    "//:node_modules/@babel/types",
    ":node_modules/@formatjs/icu-messageformat-parser",
    ":node_modules/@formatjs/ts-transformer",
    "//:node_modules/@types/babel__core",
    "//:node_modules/@types/babel__helper-plugin-utils",
    "//:node_modules/@types/babel__traverse",
]

ts_compile_node(
    name = "dist",
    srcs = SRCS,
    deps = SRC_DEPS,
)

jest_test(
    name = "unit_test",
    data = SRCS + SRC_DEPS + glob(
        [
            "tests/**/*.ts",
            "tests/**/*.tsx",
            "tests/**/*.js",
            "tests/**/*.json",
        ],
        exclude = ["tests/vue/**/*"],
    ) + [
        "//:node_modules/@babel/preset-env",
        "//:node_modules/@babel/preset-react",
        "//:node_modules/@types/node",
    ],
    snapshots = glob(["tests/**/*.snap"]),
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
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
            "options.ts",
            "tests/__snapshots__/*",
        ],
    ),
)

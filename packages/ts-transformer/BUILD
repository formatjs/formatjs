load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_js//npm/private:npm_package.bzl", "npm_package")
load("//tools:index.bzl", "check_format", "package_json_test", "ts_compile_node")
load("//tools:jest.bzl", "jest_test")

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
    "//:node_modules/@formatjs/icu-messageformat-parser",
]

ts_compile_node(
    name = "dist",
    srcs = SRCS,
    deps = SRC_DEPS + [
        "//:node_modules/@types/jest",
        "//:node_modules/ts-jest",
        "//:node_modules/@jest/types",
    ],
    data=SRC_DEPS
)

jest_test(
    name = "unit",
    srcs = SRCS + glob([
        "tests/*.ts*",
        "tests/fixtures/*.ts*",
        "tests/__snapshots__/*.snap",
    ]),
    deps = SRC_DEPS,
)

jest_test(
    name = "integration",
    srcs = SRCS + glob([
        "tests/integration/*.ts*",
    ]),
    jest_config = "tests/integration/jest.config.js",
    deps = [
        ":dist",
        "//:node_modules/@types/react",
        "//:node_modules/@types/react-dom",
        "//:node_modules/react",
        "//:node_modules/react-dom",
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
            "tests/__snapshots__/*",
        ],
    ),
)

jest_test(
    name = "integration-vue",
    srcs = ["tests/integration-vue/integration.test.ts"] + glob([
        "tests/integration-vue/fixtures/*",
    ]),
    flaky = True,
    deps = [
        "//:node_modules/@formatjs/ts-transformer",
        "//:node_modules/@types/node",
        "//:node_modules/@types/webpack",
        "//:node_modules/ts-loader",
        "//:node_modules/vue",
        "//:node_modules/vue-class-component",
        "//:node_modules/vue-loader",
        "//:node_modules/webpack",
    ],
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

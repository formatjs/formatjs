load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_js//npm/private:npm_package.bzl", "npm_package")
load("//tools:index.bzl", "check_format", "package_json_test", "ts_compile_node")
load("//tools:jest.bzl", "jest_test")

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
    visibility=["//visibility:public"]
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
    "//:node_modules/@formatjs/icu-messageformat-parser",
    "//:node_modules/@formatjs/ts-transformer",
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
    name = "unit",
    srcs = SRCS + glob(
        [
            "tests/**/*.ts",
            "tests/**/*.tsx",
            "tests/**/*.js",
            "tests/**/*.json",
        ],
        exclude = ["tests/vue/**/*"],
    ),
    snapshots = glob([
        "tests/**/*.snap",
    ]),
    deps = [
        "//:node_modules/@babel/preset-env",
        "//:node_modules/@babel/preset-react",
        # Transitive
        "//:node_modules/chalk",
        "//:node_modules/typescript",
        "//:node_modules/@types/node",
        "//:node_modules/json-stable-stringify",
    ] + SRC_DEPS,
)

jest_test(
    name = "integration-vue",
    srcs = ["tests/vue/integration.test.ts"] + glob([
        "tests/vue/fixtures/*",
    ]),
    flaky = True,
    deps = [
        "//:node_modules/babel-plugin-formatjs",
        "//:node_modules/@types/node",
        "//:node_modules/@types/webpack",
        "//:node_modules/babel-loader",
        "//:node_modules/vue",
        "//:node_modules/vue-loader",
        "//:node_modules/webpack",
        # Transitive
        "//:node_modules/chalk",
        "//:node_modules/typescript",
        "//:node_modules/json-stable-stringify",
        # Transitive babel-plugin-formatjs
        "//:node_modules/@babel/helper-plugin-utils",
        "//:node_modules/@babel/plugin-syntax-jsx",
        "//:node_modules/@babel/types",
        "//:node_modules/@formatjs/icu-messageformat-parser",
        "//:node_modules/@formatjs/ts-transformer",
    ],
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

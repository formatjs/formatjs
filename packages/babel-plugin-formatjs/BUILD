load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("//tools:index.bzl", "check_format", "package_json_test", "ts_compile")
load("//tools:jest.bzl", "jest_test")

exports_files(["package.json"])

PACKAGE_NAME = "babel-plugin-formatjs"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
    ],
    deps = [
        ":dist",
    ],
)

alias(
    name = "publish",
    actual = "%s.publish" % PACKAGE_NAME,
)

alias(
    name = "pack",
    actual = "%s.pack" % PACKAGE_NAME,
)

SRCS = glob(
    ["**/*.ts"],
    exclude = ["tests/**/*"],
)

SRC_DEPS = [
    "//packages/icu-messageformat-parser:dist",
    "//packages/ts-transformer:dist",
    "@npm//@babel/helper-plugin-utils",
    "@npm//@babel/core",
    "@npm//@babel/types",
    "@npm//@types/babel__core",
    "@npm//@types/babel__helper-plugin-utils",
    "@npm//@babel/plugin-syntax-jsx",
    "@npm//@babel/traverse",
]

ts_compile(
    name = "dist",
    package_name = PACKAGE_NAME,
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
        "//packages/icu-messageformat-parser:types",
        "//packages/ts-transformer:types",
        "@npm//@babel/preset-env",
        "@npm//@babel/preset-react",
    ] + SRC_DEPS,
)

jest_test(
    name = "integration-vue",
    srcs = ["tests/vue/integration.test.ts"] + glob([
        "tests/vue/fixtures/*",
    ]),
    flaky = True,
    deps = [
        ":dist",
        ":types",
        "//packages/icu-messageformat-parser:types",
        "@npm//@types/node",
        "@npm//@types/webpack",
        "@npm//babel-loader",
        "@npm//vue",
        "@npm//vue-loader",
        "@npm//webpack",
    ],
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

generated_file_test(
    name = "tsconfig_json",
    src = "tsconfig.json",
    generated = "//tools:tsconfig.golden.json",
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

load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("@npm//json-schema-to-typescript:index.bzl", "json2ts")
load("//tools:index.bzl", "prettier_check", "ts_compile")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "babel-plugin-react-intl"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
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

SRCS = glob(["*.ts"]) + ["options.schema.json"]

SRC_DEPS = [
    "//packages/intl-messageformat-parser:dist",
    "//packages/ts-transformer:dist",
    "@npm//@babel/helper-plugin-utils",
    "@npm//@babel/core",
    "@npm//@babel/types",
    "@npm//@types/babel__core",
    "@npm//schema-utils",
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
        "//packages/intl-messageformat-parser:types",
        "//packages/ts-transformer:types",
        "@npm//@babel/plugin-syntax-jsx",
    ] + SRC_DEPS,
)

jest_test(
    name = "integration-vue",
    srcs = ["tests/vue/integration.test.ts"] + glob([
        "tests/vue/fixtures/*",
    ]),
    deps = [
        ":dist",
        ":types",
        "@npm//@types/node",
        "@npm//@types/webpack",
        "@npm//@vue/compiler-sfc",
        "@npm//babel-loader",
        "@npm//vue",
        "@npm//vue-loader",
        "@npm//webpack",
    ],
)

# json2ts -i src/options.schema.json -o src/options.ts
json2ts(
    name = "options-gen",
    outs = ["tmp/options.ts"],
    args = [
        "-i",
        "$(execpath options.schema.json)",
        "-o",
        "$@",
    ],
    data = [
        "options.schema.json",
    ],
)

generated_file_test(
    name = "options",
    src = "options.ts",
    generated = ":options-gen",
)

generated_file_test(
    name = "tsconfig_json",
    src = "tsconfig.json",
    generated = "//tools:tsconfig.golden.json",
)

prettier_check(
    name = "prettier",
    srcs = glob(
        [
            "**/*",
        ],
        exclude = [
            "CHANGELOG.md",
            "BUILD",
            "options.ts",
            "tests/__snapshots__/*",
        ],
    ),
)

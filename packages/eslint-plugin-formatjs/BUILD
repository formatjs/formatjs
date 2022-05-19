load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("//tools:index.bzl", "check_format", "package_json_test", "ts_compile")
load("//tools:jest.bzl", "jest_test")

exports_files(["package.json"])

PACKAGE_NAME = "eslint-plugin-formatjs"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json"
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

SRCS = glob(["rules/*.ts"]) + [
    "index.ts",
    "util.ts",
]

SRC_DEPS = [
    "@npm//@types/eslint",
    "@npm//@typescript-eslint/typescript-estree",
    "@npm//emoji-regex",
    "@npm//eslint",
    "@npm//typescript",
    "//packages/icu-messageformat-parser:dist",
    "//packages/ts-transformer:dist",
]

ts_compile(
    name = "dist",
    package_name = PACKAGE_NAME,
    srcs = SRCS,
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

[jest_test(
    name = "unit-%s" % f[6:f.index(".test.ts")],
    srcs = TESTS_BASE_SRCS + [f],
    deps = [
        "@npm//@typescript-eslint/parser",
        "@npm//vue-eslint-parser",
        "//packages/icu-messageformat-parser:types",
        "//packages/ts-transformer:types",
    ] + SRC_DEPS,
) for f in TEST_FILES]

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
        ],
    ),
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

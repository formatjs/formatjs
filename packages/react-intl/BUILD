load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("@npm//@bazel/esbuild:index.bzl", "esbuild")
load("//tools:index.bzl", "check_format", "package_json_test", "ts_compile")
load("//tools:jest.bzl", "jest_test")

exports_files(["package.json"])

PACKAGE_NAME = "react-intl"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
    ],
    deps = [
        "%s.iife.js" % PACKAGE_NAME,
        ":dist",
        ":dist-esm",
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

SRCS = glob(["src/**/*.ts*"]) + ["index.ts"]

SRC_DEPS = [
    "@npm//@types/hoist-non-react-statics",
    "@npm//@types/react",
    "@npm//hoist-non-react-statics",
    "@npm//react",
    "//packages/ecma402-abstract:dist",
    "//packages/icu-messageformat-parser:dist",
    "//packages/intl-displaynames:dist",
    "//packages/intl-listformat:dist",
    "//packages/intl-messageformat:dist",
    "//packages/intl:dist",
]

TESTS = glob([
    "tests/unit/**/*.ts*",
    "tests/unit/**/*.snap",
])

TEST_DEPS = SRC_DEPS + [
    "@npm//@testing-library/jest-dom",
    "@npm//@testing-library/react",
    "@npm//cjs-module-lexer",
    "@npm//react-dom",
    "@npm//typescript",
    "//packages/ecma402-abstract:types",
    "//packages/icu-messageformat-parser:types",
    "//packages/intl-displaynames:types",
    "//packages/intl-listformat:types",
    "//packages/intl-messageformat:types",
    "//packages/intl-numberformat:dist",
    "//packages/intl-relativetimeformat:dist",
    "//packages/intl:types",
]

ts_compile(
    name = "dist",
    package_name = PACKAGE_NAME,
    srcs = SRCS,
    skip_esm = False,
    deps = SRC_DEPS,
)

esbuild(
    name = "%s.esbuild.iife" % PACKAGE_NAME,
    args = {
        "globalName": "ReactIntl",
    },
    entry_point = "lib/index.js",
    external = ["react"],
    target = "es5",
    deps = [
        ":dist-esm",
    ] + SRC_DEPS,
)

genrule(
    name = "external-rename",
    srcs = [":%s.esbuild.iife.js" % PACKAGE_NAME],
    outs = ["%s.iife.js" % PACKAGE_NAME],
    cmd = "cat $< | sed -E 's/__require\\(\"react\"\\)/window.React/g' > $@",
)

jest_test(
    name = "unit",
    srcs = SRCS + TESTS + [
        "tests/setup.js",
        "//packages/intl-numberformat:locale-data",
        "//packages/intl-displaynames:locale-data",
    ],
    jest_config = "jest.config.js",
    deps = TEST_DEPS,
)

jest_test(
    name = "functional",
    srcs = glob(["tests/functional/**/*.ts*"]) + [
        "tests/setup.js",
        "package.json",
        "//packages/intl-numberformat:locale-data",
        "//packages/intl-displaynames:locale-data",
    ],
    jest_config = "jest.config.js",
    deps = TEST_DEPS + [":dist"],
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
            "tests/unit/components/__snapshots__/*",
            "**/.env",
            "**/.gitignore",
        ],
    ),
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

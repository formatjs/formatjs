load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_esbuild//esbuild:defs.bzl", "esbuild")
load("@aspect_rules_js//npm/private:npm_package.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:index.bzl", "check_format", "package_json_test", "ts_compile")
load("//tools:jest.bzl", "jest_test")

npm_link_all_packages(name = "node_modules")

PACKAGE_NAME = "react-intl"

npm_package(
    name = PACKAGE_NAME,
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
    ":node_modules/@formatjs/ecma402-abstract",
    ":node_modules/@formatjs/icu-messageformat-parser",
    ":node_modules/@formatjs/intl-displaynames",
    ":node_modules/@formatjs/intl-listformat",
    ":node_modules/@formatjs/intl",
    ":node_modules/intl-messageformat",
    "//:node_modules/@types/hoist-non-react-statics",
    "//:node_modules/@types/react",
    "//:node_modules/hoist-non-react-statics",
    "//:node_modules/react",
]

TESTS = glob([
    "tests/unit/**/*.ts*",
    "tests/unit/**/*.snap",
])

TEST_DEPS = SRC_DEPS + [
    ":node_modules/@formatjs/intl-numberformat",
    ":node_modules/@formatjs/intl-relativetimeformat",
    "//:node_modules/@testing-library/jest-dom",
    "//:node_modules/@testing-library/react",
    "//:node_modules/@types/node",
    "//:node_modules/cjs-module-lexer",
    "//:node_modules/jest-environment-jsdom",
    "//:node_modules/react-dom",
    "//:node_modules/typescript",
]

ts_compile(
    name = "dist",
    srcs = SRCS,
    package = PACKAGE_NAME,
    skip_esm = False,
    deps = SRC_DEPS,
)

esbuild(
    name = "%s.esbuild.iife" % PACKAGE_NAME,
    config = {
        "globalName": "ReactIntl",
    },
    entry_point = "lib/index.js",
    external = ["react"],
    target = "es6",
    # TODO: fix this and set it back to es5
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
    name = "unit_test",
    data = SRCS + TESTS + TEST_DEPS + ["tests/setup.js"],
    jest_config = "jest.config.js",
)

jest_test(
    name = "functional_test",
    data = TEST_DEPS + glob(["tests/functional/**/*.ts*"]) + [
        "package.json",
        "tests/setup.js",
        ":dist",
    ],
    jest_config = "jest.config.js",
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

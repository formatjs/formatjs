load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_esbuild//esbuild:defs.bzl", "esbuild")
load("@aspect_rules_js//npm/private:npm_package.bzl", "npm_package")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@npm//:http-server/package_json.bzl", "bin")
load("//tools:index.bzl", "check_format", "package_json_test", "ts_compile")
load("//tools:jest.bzl", "jest_test")

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
    "//:node_modules/@types/hoist-non-react-statics",
    "//:node_modules/@types/react",
    "//:node_modules/hoist-non-react-statics",
    "//:node_modules/react",
    "//:node_modules/@formatjs/ecma402-abstract",
    "//:node_modules/@formatjs/icu-messageformat-parser",
    "//:node_modules/@formatjs/intl-displaynames",
    "//:node_modules/@formatjs/intl-listformat",
    "//:node_modules/intl-messageformat",
    "//:node_modules/@formatjs/intl",
]

TESTS = glob([
    "tests/unit/**/*.ts*",
    "tests/unit/**/*.snap",
])

TEST_DEPS = SRC_DEPS + [
    "//:node_modules/@testing-library/jest-dom",
    "//:node_modules/@testing-library/react",
    "//:node_modules/cjs-module-lexer",
    "//:node_modules/react-dom",
    "//:node_modules/typescript",
    "//:node_modules/@formatjs/intl-numberformat",
    "//:node_modules/@formatjs/intl-relativetimeformat",
    "//:node_modules/@types/node"
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
    name = "unit",
    srcs = SRCS + TESTS + [
        "tests/setup.js",
    ],
    jest_config = "jest.config.js",
    deps = TEST_DEPS,
    # TODO: fix
    tags=["manual"]
)

jest_test(
    name = "functional",
    srcs = glob(["tests/functional/**/*.ts*"]) + [
        "tests/setup.js",
        "package.json",
    ],
    jest_config = "jest.config.js",
    deps = TEST_DEPS + [":dist"],
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

EXAMPLES_SRC_DEPS = [
    "//:node_modules/@formatjs/ecma402-abstract",
    "//:node_modules/@formatjs/intl-datetimeformat",
    "//:node_modules/@formatjs/intl-getcanonicallocales",
    "//:node_modules/@formatjs/intl-locale",
    "//:node_modules/intl-messageformat",
    "//:node_modules/@formatjs/icu-messageformat-parser",
    "//:node_modules/@formatjs/intl-numberformat",
    "//:node_modules/@formatjs/intl-pluralrules",
    "//:node_modules/react-intl",
    "//:node_modules/core-js",
    "//:node_modules/@types/react",
    "//:node_modules/@types/react-dom",
    "//:node_modules/react",
    "//:node_modules/react-dom",
    "//:node_modules/tslib",
]

ts_project(
    name = "examples-esm",
    srcs = glob(
        [
            "examples/**/*.ts",
            "examples/**/*.tsx",
            "examples/**/*.json",
        ],
    ),
    declaration = True,
    declaration_map = True,
    extends = "//:tsconfig",
    out_dir = "examples-lib",
    resolve_json_module = True,
    tsconfig = "//:tsconfig.esm",
    deps = EXAMPLES_SRC_DEPS,
)

esbuild(
    name = "main",
    define = {
        "process.env.NODE_ENV": "development",
    },
    entry_point = "examples-lib/examples/index.js",
    format = "iife",
    deps = [":examples-esm"] + EXAMPLES_SRC_DEPS,
)

copy_to_bin(
    name = "index",
    srcs = ["examples/index.html"],
)

bin.http_server_binary(
    name = "examples",
    data = [
        ":index",
        ":main",
    ],
    args = [
        "packages/react-intl/examples",
    ],
)


load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@npm//:http-server/package_json.bzl", "bin")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("@aspect_rules_esbuild//esbuild:defs.bzl", "esbuild")
npm_link_all_packages(name = "node_modules")
EXAMPLES_SRC_DEPS = [
    ":node_modules/@formatjs/ecma402-abstract",
    ":node_modules/@formatjs/intl-datetimeformat",
    ":node_modules/@formatjs/intl-getcanonicallocales",
    ":node_modules/@formatjs/intl-locale",
    ":node_modules/intl-messageformat",
    ":node_modules/@formatjs/icu-messageformat-parser",
    ":node_modules/@formatjs/intl-numberformat",
    ":node_modules/@formatjs/intl-pluralrules",
    ":node_modules/react-intl",
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
            "**/*.ts",
            "**/*.tsx",
            "**/*.json",
        ],
        exclude=["package.json"]
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
    entry_point = "examples-lib/index.js",
    format = "iife",
    deps = [":examples-esm"] + EXAMPLES_SRC_DEPS,
)

copy_to_bin(
    name = "index",
    srcs = ["index.html"],
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
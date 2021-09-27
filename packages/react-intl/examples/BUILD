load("@build_bazel_rules_nodejs//:index.bzl", "copy_to_bin")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("@npm//http-server:index.bzl", "http_server")
load("//tools:index.bzl", "check_format", "esbuild")

SRC_DEPS = [
    "//packages/ecma402-abstract:dist",
    "//packages/intl-datetimeformat:dist",
    "//packages/intl-getcanonicallocales:dist",
    "//packages/intl-locale:dist",
    "//packages/intl-messageformat:dist",
    "//packages/icu-messageformat-parser:dist",
    "//packages/intl-numberformat:dist",
    "//packages/intl-pluralrules:dist",
    "//packages/react-intl:dist",
    "@npm//core-js",
    "@npm//@types/react",
    "@npm//@types/react-dom",
    "@npm//react",
    "@npm//react-dom",
]

ts_project(
    name = "examples-esm",
    srcs = glob(
        [
            "**/*.ts",
            "**/*.tsx",
            "**/*.json",
        ],
    ),
    declaration = True,
    declaration_map = True,
    extends = "//:tsconfig.json",
    out_dir = "lib",
    resolve_json_module = True,
    tsconfig = "//:tsconfig.esm.json",
    deps = SRC_DEPS,
)

esbuild(
    name = "main",
    define = {
        "process.env.NODE_ENV": "development",
    },
    entry_point = "lib/index.js",
    format = "iife",
    deps = [":examples-esm"] + SRC_DEPS + [
        "//packages/intl-datetimeformat:add-all-tz",
        "//packages/intl-datetimeformat:locale-data",
        "//packages/intl-numberformat:locale-data",
        "//packages/intl-pluralrules",
    ],
)

copy_to_bin(
    name = "index",
    srcs = ["index.html"],
)

http_server(
    name = "examples",
    data = [
        ":index",
        ":main",
    ],
    templated_args = [
        "packages/react-intl/examples",
    ],
)

check_format(
    name = "prettier",
    srcs = glob(
        [
            "**/*",
        ],
    ),
)

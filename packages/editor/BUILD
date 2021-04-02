load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm", "copy_to_bin")
load("//tools:index.bzl", "check_format", "ts_compile", "esbuild")
load("//tools:jest.bzl", "jest_test")
load("@npm//http-server:index.bzl", "http_server")
PACKAGE_NAME = "editor"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
    ],
    deps = [
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

SRCS = glob(["*.ts*"])

SRC_DEPS = [
    "@npm//@material-ui/core",
    "@npm//@material-ui/icons",
    "@npm//react",
    "@npm//@types/react",
    "@npm//react-dom",
    "@npm//@types/react-dom",
    "//packages/react-intl:dist"
]

ts_compile(
    name = "dist",
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = SRCS,
    deps = SRC_DEPS,
    skip_esm=False,
)

# jest_test(
#     name = "unit",
#     srcs = [
#         "package.json",
#         "tests/extract/unit.test.ts",
#         "tests/extract/vue_extractor.test.ts",
#         "tests/extract/__snapshots__/unit.test.ts.snap",
#     ] + SRCS,
#     deps = [
#         "//packages/icu-messageformat-parser:types",
#         "//packages/ts-transformer:types",
#         "@npm//rimraf",
#         "@npm//@types/rimraf",
#     ] + SRC_DEPS,
# )

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
            # Intentional err
            "tests/extract/typescript/err.tsx",
            "tests/*/__snapshots__/*",
        ],
    ),
)

esbuild(
    name = "app",
    define = [
        "process.env.NODE_ENV=\"development\"",
    ],
    entry_point = "lib/main.js",
    format = "iife",
    deps = [":dist-esm"] + SRC_DEPS + [
        
    ],
)

copy_to_bin(
    name = "index",
    srcs = ["index.html"],
)

http_server(
    name = "server",
    data = [
        ":index",
        ":app",
    ],
    templated_args = [
        "packages/editor",
    ],
)

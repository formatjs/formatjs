# load("@build_bazel_rules_nodejs//:index.bzl", "copy_to_bin", "generated_file_test", "pkg_npm")

# # load("//tools:jest.bzl", "jest_test")
# load("@npm//http-server:index.bzl", "http_server")
load("//tools:index.bzl", "check_format")

# exports_files(["package.json"])

# PACKAGE_NAME = "editor"

# pkg_npm(
#     name = PACKAGE_NAME,
#     package_name = "@formatjs/%s" % PACKAGE_NAME,
#     srcs = [
#         "LICENSE.md",
#         "README.md",
#     ],
#     deps = [
#         ":dist",
#         ":dist-esm",
#     ],
# )

# alias(
#     name = "publish",
#     actual = "%s.publish" % PACKAGE_NAME,
# )

# alias(
#     name = "pack",
#     actual = "%s.pack" % PACKAGE_NAME,
# )

# SRCS = glob(["*.ts*"])

# SRC_DEPS = [
#     "@npm//@material-ui/core",
#     "@npm//@material-ui/icons",
#     "@npm//@material-ui/lab",
#     "@npm//react",
#     "@npm//@types/react",
#     "@npm//react-dom",
#     "@npm//@types/react-dom",
#     "//packages/react-intl:dist",
#     "//packages/icu-messageformat-parser:dist",
# ]

# ts_compile(
#     name = "dist",
#     package_name = "@formatjs/%s" % PACKAGE_NAME,
#     srcs = SRCS,
#     skip_esm = False,
#     deps = SRC_DEPS,
# )

# # jest_test(
# #     name = "unit",
# #     srcs = [
# #         "package.json",
# #         "tests/extract/unit.test.ts",
# #         "tests/extract/vue_extractor.test.ts",
# #         "tests/extract/__snapshots__/unit.test.ts.snap",
# #     ] + SRCS,
# #     deps = [
# #         "//packages/icu-messageformat-parser:types",
# #         "//packages/ts-transformer:types",
# #         "@npm//rimraf",
# #         "@npm//@types/rimraf",
# #     ] + SRC_DEPS,
# # )

# generated_file_test(
#     name = "tsconfig_json",
#     src = "tsconfig.json",
#     generated = "//tools:tsconfig.golden.json",
# )

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

# esbuild(
#     name = "app",
#     define = {
#         "process.env.NODE_ENV": "development",
#     },
#     entry_point = "lib/main.js",
#     format = "iife",
#     deps = [":dist-esm"] + SRC_DEPS + [
#     ],
# )

# copy_to_bin(
#     name = "index",
#     srcs = ["index.html"],
# )

# http_server(
#     name = "server",
#     data = [
#         ":index",
#         ":app",
#     ] + glob(["fixtures/*.json"]),
#     templated_args = [
#         "packages/editor",
#     ],
# )

# # package_json_test(
# #     name="package_json_test",
# #     deps=SRC_DEPS
# # )

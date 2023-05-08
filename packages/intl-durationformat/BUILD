load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_js//npm/private:npm_package.bzl", "npm_package")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:index.bzl", "check_format", "ts_compile")
load("//tools:jest.bzl", "jest_test")

npm_link_all_packages(name = "node_modules")

PACKAGE_NAME = "intl-durationformat"

npm_package(
    name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
        ":dist",
    ],
    package = "@formatjs/%s" % PACKAGE_NAME,
    visibility = ["//visibility:public"],
)

SRCS = glob(["*.ts"])

SRC_DEPS = [
    ":node_modules/@formatjs/ecma402-abstract",
    ":node_modules/@formatjs/intl-localematcher",
]

ts_compile(
    name = "dist",
    srcs = SRCS,
    package = "@formatjs/%s" % PACKAGE_NAME,
    skip_esm = False,
    deps = SRC_DEPS,
)

jest_test(
    name = "unit_test",
    data = SRCS + SRC_DEPS + glob([
        "tests/**/*.ts",
        "tests/**/*.tsx",
    ]),
    snapshots = glob(["tests/**/*.snap"]),
)

# Test262
ts_project(
    name = "test262-main-bundle",
    srcs = SRCS,
    declaration = True,
    declaration_map = True,
    out_dir = "test262",
    resolve_json_module = True,
    tsconfig = "//:tsconfig.es6",
    deps = SRC_DEPS,
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
            "tests/locale-data/*",
        ],
    ),
)
# package_json_test(
#     name="package_json_test",
#     deps=SRC_DEPS
# )

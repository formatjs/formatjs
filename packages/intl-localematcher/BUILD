load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("//tools:index.bzl", "generate_src_file", "package_json_test", "ts_compile")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "intl-localematcher"

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

SRCS = glob(
    ["abstract/*"],
    exclude = ["tests/*"],
) + ["index.ts"]

ts_compile(
    name = "dist",
    srcs = SRCS,
    package = "@formatjs/%s" % PACKAGE_NAME,
    skip_esm = False,
)

jest_test(
    name = "unit_test",
    data = SRCS + glob([
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
    out_dir = "test262",
    resolve_json_module = True,
    tsconfig = "//:tsconfig.es6",
)

write_source_files(
    name = "tsconfig_json",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
)

package_json_test(
    name = "package_json_test",
)

generate_src_file(
    name = "regions",
    src = "abstract/regions.generated.ts",
    data = [
        "//:node_modules/@types/json-stable-stringify",
        "//:node_modules/cldr-core",
        "//:node_modules/json-stable-stringify",
    ],
    entry_point = "scripts/regions-gen.ts",
)

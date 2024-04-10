load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:index.bzl", "generate_src_file", "ts_compile")

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

SRCS = glob([
    "*.ts",
    "src/**/*",
])

SRC_DEPS = [
    ":node_modules/@formatjs/ecma402-abstract",
    ":node_modules/@formatjs/intl-localematcher",
    ":node_modules/tslib",
]

ts_compile(
    name = "dist",
    srcs = SRCS,
    package = "@formatjs/%s" % PACKAGE_NAME,
    skip_esm = False,
    deps = SRC_DEPS,
)

# Test262
ts_project(
    name = "test262-main-bundle",
    srcs = SRCS,
    declaration = True,
    out_dir = "test262",
    resolve_json_module = True,
    tsconfig = "//:tsconfig.es6",
    deps = SRC_DEPS,
)

write_source_files(
    name = "tsconfig_json",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
)

# numbering-systems
write_source_files(
    name = "numbering-systems",
    files = {
        "src/numbering-systems.generated.ts": "//packages/intl-numberformat:src/numbering-systems.generated.ts",
    },
)

generate_src_file(
    name = "time-separators",
    src = "src/time-separators.generated.ts",
    data = [
        "scripts/time-separators.ts",
        "scripts/utils.ts",
        ":node_modules/@formatjs/ecma402-abstract",
        "//:node_modules/@types/json-stable-stringify",
        "//:node_modules/@types/lodash",
        "//:node_modules/cldr-core",
        "//:node_modules/cldr-localenames-full",
        "//:node_modules/cldr-numbers-full",
        "//:node_modules/fast-glob",
        "//:node_modules/json-stable-stringify",
        "//:node_modules/lodash",
    ],
    entry_point = "scripts/time-separators.ts",
)

# package_json_test(
#     name="package_json_test",
#     deps=SRC_DEPS
# )

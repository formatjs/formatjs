load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:index.bzl", "generate_src_file", "ts_compile")
load("//tools:vitest.bzl", "vitest")

npm_link_all_packages()

PACKAGE_NAME = "intl-durationformat"

npm_package(
    name = "pkg",
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
]

ts_compile(
    name = "dist",
    srcs = [":srcs"],
    skip_esm = False,
    deps = SRC_DEPS,
)

vitest(
    name = "unit_test",
    srcs = SRCS + glob([
        "tests/**/*.ts",
    ]),
    deps = SRC_DEPS,
)

# Test262
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
    visibility = ["//:__pkg__"],
)

generate_src_file(
    name = "time-separators",
    src = "src/time-separators.generated.ts",
    data = [
        "scripts/time-separators.ts",
        "scripts/utils.ts",
        ":node_modules/@formatjs/ecma402-abstract",
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

copy_to_bin(
    name = "srcs",
    srcs = SRCS,
)

# package_json_test(
#     name="package_json_test",
#     deps=SRC_DEPS
# )

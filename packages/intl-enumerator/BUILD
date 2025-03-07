load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_esbuild//esbuild:defs.bzl", "esbuild")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//:index.bzl", "ZONES")
load("//tools:index.bzl", "generate_src_file", "ts_compile")
load("//tools:vitest.bzl", "vitest")

npm_link_all_packages()

PACKAGE_NAME = "intl-enumerator"

npm_package(
    name = "pkg",
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
        ":dist",
        # polyfill-library uses this
        "polyfill.iife.js",
    ],
    package = "@formatjs/%s" % PACKAGE_NAME,
    visibility = ["//visibility:public"],
)

SRCS = glob([
    "src/**/*.ts",
    "*.ts",
])

SRC_DEPS = [
    ":node_modules/@formatjs/ecma402-abstract",
]

TESTS = glob([
    "tests/*.test.ts",
])

ts_compile(
    name = "dist",
    srcs = [":srcs"],
    skip_esm = False,
    deps = SRC_DEPS,
)

vitest(
    name = "unit_test",
    srcs = SRCS + TESTS,
    deps = SRC_DEPS,
)

# Test262
write_source_files(
    name = "tsconfig_json",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
)

# calendars
generate_src_file(
    name = "calendars",
    src = "src/calendars.generated.ts",
    data = [
        "//:node_modules/cldr-bcp47",
    ],
    entry_point = "scripts/calendars.ts",
)

# timezones
generate_src_file(
    name = "timezones",
    src = "src/timezones.generated.ts",
    args = ["--zone %s" % z for z in ZONES],
    data = [
    ],
    entry_point = "scripts/timezones.ts",
)

# numbering-systems
write_source_files(
    name = "numbering-systems",
    files = {
        "src/numbering-systems.generated.ts": "//packages/intl-numberformat:src/numbering-systems.generated.ts",
    },
    visibility = ["//:__pkg__"],
)

# currencies
generate_src_file(
    name = "currencies",
    src = "src/currencies.generated.ts",
    data = [
        "//:node_modules/cldr-numbers-full",
    ],
    entry_point = "scripts/currencies.ts",
)

# collations
generate_src_file(
    name = "collations",
    src = "src/collations.generated.ts",
    data = [
        "//:node_modules/cldr-bcp47",
    ],
    entry_point = "scripts/collations.ts",
)

# units
generate_src_file(
    name = "units",
    src = "src/units.generated.ts",
    data = [
        ":node_modules/@formatjs/ecma402-abstract",
        "//:node_modules/cldr-bcp47",
    ],
    entry_point = "scripts/units.ts",
)

esbuild(
    name = "polyfill.iife",
    srcs = [":srcs"],
    entry_point = "polyfill.ts",
    deps = [
        "//:node_modules/tslib",
    ] + SRC_DEPS,
)

copy_to_bin(
    name = "srcs",
    srcs = SRCS,
)

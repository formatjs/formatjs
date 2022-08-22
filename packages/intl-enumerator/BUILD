load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_js//npm/private:npm_package.bzl", "npm_package")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//:index.bzl", "ZONES")
load("//tools:index.bzl", "check_format", "generate_src_file", "ts_compile")
load("//tools:jest.bzl", "jest_test")

npm_link_all_packages(name = "node_modules")

PACKAGE_NAME = "intl-enumerator"

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
    "src/**/*.ts",
    "*.ts",
])

TESTS = glob([
    "tests/*.test.ts",
])

ts_compile(
    name = "dist",
    srcs = SRCS,
    package = "@formatjs/%s" % PACKAGE_NAME,
    skip_esm = False,
    deps = [],
)

jest_test(
    name = "unit",
    srcs = SRCS + TESTS,
    deps = [],
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
    deps = [],
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
            "src/*.generated.*",
        ],
    ),
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

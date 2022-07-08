load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("//:index.bzl", "ZONES")
load("//tools:index.bzl", "check_format", "generate_src_file", "ts_compile")
load("//tools:jest.bzl", "jest_test")

exports_files(["package.json"])

PACKAGE_NAME = "intl-enumerator"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
    ],
    deps = [
        ":dist",
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

SRCS = glob([
    "src/**/*.ts",
    "*.ts",
])

TESTS = glob([
    "tests/*.test.ts",
])

SRC_DEPS = [
]

TEST_DEPS = SRC_DEPS

ts_compile(
    name = "dist",
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = SRCS,
    skip_esm = False,
    deps = SRC_DEPS,
)

jest_test(
    name = "unit",
    srcs = SRCS + TESTS,
    deps = TEST_DEPS,
)

# Test262
ts_project(
    name = "test262-main-bundle",
    srcs = SRCS,
    declaration = True,
    declaration_map = True,
    extends = "//:tsconfig.json",
    out_dir = "test262",
    resolve_json_module = True,
    tsconfig = "//:tsconfig.es6.json",
    deps = SRC_DEPS,
)

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
            "src/*.generated.*",
        ],
    ),
)

# calendars
generate_src_file(
    name = "calendars",
    src = "src/calendars.generated.ts",
    data = [
        "@npm//cldr-bcp47",
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
generate_src_file(
    name = "numbering-systems",
    src = "src/numbering-systems.generated.ts",
    data = [
        "//packages/ecma402-abstract:dist",
        "//packages/ecma402-abstract:types",
        "//packages/intl-numberformat:scripts/extract-numbers.ts",
        "//packages/intl-numberformat:scripts/utils.ts",
        "@npm//@types/lodash",
        "@npm//cldr-core",
        "@npm//cldr-numbers-full",
        "@npm//lodash",
    ],
    entry_point = "//packages/intl-numberformat:scripts/numbering-systems.ts",
)

# currencies 
generate_src_file(
    name = "currencies",
    src = "src/currencies.generated.ts",
    data = [
        "@npm//cldr-numbers-full",
    ],
    entry_point = "scripts/currencies.ts",
)

# collations
generate_src_file(
    name = "collations",
    src = "src/collations.generated.ts",
    data = [
        "@npm//cldr-bcp47",
    ],
    entry_point = "scripts/collations.ts",
)

# units
generate_src_file(
    name = "units",
    src = "src/units.generated.ts",
    data = [
        "@npm//cldr-bcp47",
        "//packages/ecma402-abstract:dist",
        "//packages/ecma402-abstract:types",
    ],
    entry_point = "scripts/units.ts",
)
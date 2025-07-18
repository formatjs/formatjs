load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_esbuild//esbuild:defs.bzl", "esbuild")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("@npm//:test262-harness/package_json.bzl", test262_harness_bin = "bin")
load("//tools:index.bzl", "generate_src_file", "package_json_test", "ts_compile")
load("//tools:vitest.bzl", "vitest")

npm_link_all_packages()

PACKAGE_NAME = "intl-locale"

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

SRCS = glob(["*.ts"])

SRC_DEPS = [
    ":node_modules/@formatjs/ecma402-abstract",
    ":node_modules/@formatjs/intl-enumerator",
    ":node_modules/@formatjs/intl-getcanonicallocales",
    "//:node_modules/cldr-core",
    "//:node_modules/cldr-bcp47",
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
esbuild(
    name = "test262-polyfill",
    srcs = [":srcs"],
    entry_point = "polyfill-force.ts",
    target = "es6",
    deps = SRC_DEPS,
)

test262_harness_bin.test262_harness_test(
    name = "test262",
    args = [
        "--reporter-keys",
        "file,attrs,result",
        "--errorForFailures",
        "--timeout",
        "30000",
        "--prelude",
        "$(rootpath test262-polyfill.js)",
        "--test262Dir",
        "../+_repo_rules+com_github_tc39_test262",
        "../+_repo_rules+com_github_tc39_test262/test/intl402/Locale/**/*.js",
    ],
    data = [
        "test262-polyfill.js",
        "@com_github_tc39_test262//:test262-harness-copy",
        "@com_github_tc39_test262//:test262-locale-copy",
    ],
    # TODO: fix
    tags = ["manual"],
)

write_source_files(
    name = "tsconfig_json",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
)

esbuild(
    name = "polyfill.iife",
    srcs = [":srcs"],
    entry_point = "polyfill.ts",
    deps = [
        "//:node_modules/tslib",
    ] + SRC_DEPS,
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

# character orders
generate_src_file(
    name = "character-orders",
    src = "character-orders.generated.ts",
    data = [
        "scripts/common-types.ts",
        "scripts/utils.ts",
        "//:node_modules/cldr-localenames-full",
        "//:node_modules/cldr-misc-full",
        "//:node_modules/fast-glob",
        "//:node_modules/json-stable-stringify",
    ],
    entry_point = "scripts/character-orders.ts",
)

# numbering systems
generate_src_file(
    name = "numbering-systems",
    src = "numbering-systems.generated.ts",
    data = [
        "scripts/common-types.ts",
        "scripts/utils.ts",
        "//:node_modules/cldr-localenames-full",
        "//:node_modules/cldr-numbers-full",
        "//:node_modules/fast-glob",
        "//:node_modules/json-stable-stringify",
    ],
    entry_point = "scripts/numbering-systems.ts",
)

# timezones
generate_src_file(
    name = "timezones",
    src = "timezones.generated.ts",
    data = [
        "scripts/common-types.ts",
        "//:node_modules/cldr-bcp47",
        "//:node_modules/json-stable-stringify",
    ],
    entry_point = "scripts/timezones.ts",
)

# hour cycles
generate_src_file(
    name = "hour-cycles",
    src = "hour-cycles.generated.ts",
    data = [
        "scripts/common-types.ts",
        "//:node_modules/cldr-core",
        "//:node_modules/json-stable-stringify",
    ],
    entry_point = "scripts/hour-cycles.ts",
)

# calendars
generate_src_file(
    name = "calendars",
    src = "calendars.generated.ts",
    data = [
        "scripts/common-types.ts",
        "//:node_modules/cldr-core",
        "//:node_modules/json-stable-stringify",
    ],
    entry_point = "scripts/calendars.ts",
)

# week data
generate_src_file(
    name = "week-data",
    src = "week-data.generated.ts",
    data = [
        "scripts/common-types.ts",
        "//:node_modules/cldr-core",
        "//:node_modules/json-stable-stringify",
    ],
    entry_point = "scripts/week-data.ts",
)

copy_to_bin(
    name = "srcs",
    srcs = SRCS,
)

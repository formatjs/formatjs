load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("@com_github_ash2k_bazel_tools//multirun:def.bzl", "multirun")
load("@npm//ts-node:index.bzl", "ts_node")
load("//tools:index.bzl", "check_format", "esbuild", "generate_src_file", "package_json_test", "ts_compile", "ts_script")
load("//tools:jest.bzl", "jest_test")

exports_files(["package.json"])

PACKAGE_NAME = "intl-datetimeformat"

TEST_LOCALES = [
    "ar",
    "de",
    "en",
    "en-GB",
    "en-CA",
    "ko",
    "pl",
    "zh-Hans",
    "fa",
]

TEST_LOCALE_DATA = ["tests/locale-data/%s.json" % locale for locale in TEST_LOCALES]

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
    ],
    deps = [
        "add-all-tz.js",
        "add-all-tz.d.ts",
        "add-golden-tz.js",
        "add-golden-tz.d.ts",
        ":dist",
        ":locale-data",
        # polyfill-library uses this
        "polyfill.iife.js",
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

SRCS = glob(
    [
        "*.ts",
        "src/**/*",
    ],
)

TESTS = glob([
    "tests/**/*.test.ts",
])

SRC_DEPS = [
    "//packages/ecma402-abstract:dist",
    "//packages/intl-localematcher:dist",
]

TEST_DEPS = SRC_DEPS + [
    "//packages/intl-pluralrules",
    "//packages/ecma402-abstract:types",
    "//packages/intl-localematcher:types",
    "//packages/intl-getcanonicallocales:dist",
    "//packages/intl-getcanonicallocales:types",
    "//packages/intl-locale:dist",
    "//packages/intl-locale:types",
]

ts_compile(
    name = "dist",
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = SRCS,
    skip_esm = False,
    deps = SRC_DEPS,
)

[jest_test(
    name = "unit-%s" % t[t.index("/") + 1:t.index(".test")],
    srcs = SRCS + [t] + TEST_LOCALE_DATA,
    deps = TEST_DEPS,
) for t in TESTS]

# CLDR
CLDR_DEPS = [
    ":cldr-raw",
    "@npm//fast-glob",
]

ts_script(
    name = "cldr-raw",
    data = [
        "scripts/extract-dates.ts",
        "src/abstract/skeleton.ts",
        "src/types.ts",
        "//packages/ecma402-abstract:dist",
        "//packages/ecma402-abstract:types",
        "//packages/intl-locale:dist",
        "//packages/intl-locale:types",
        "@npm//cldr-core",
        "@npm//cldr-dates-full",
        "@npm//cldr-numbers-full",
        "@npm//fast-glob",
    ],
    entry_point = "scripts/cldr-raw.ts",
    output_dir = True,
)

ts_script(
    name = "locale-data",
    args = [
        "--cldrFolder",
        "$(location :cldr-raw)",
    ],
    data = CLDR_DEPS,
    entry_point = "scripts/cldr.ts",
    output_dir = True,
    visibility = [
        "//packages/intl:__subpackages__",
        "//packages/react-intl:__subpackages__",
    ],
)

[generate_src_file(
    name = "tests-locale-data-%s" % locale,
    src = "tests/locale-data/%s.json" % locale,
    args = [
        "--cldrFolder",
        "$(location :cldr-raw)",
        "--locales",
        locale,
    ],
    data = CLDR_DEPS,
    entry_point = "scripts/test-locale-data-gen.ts",
) for locale in TEST_LOCALES]

multirun(
    name = "tests-locale-data-all.update",
    testonly = True,
    commands = [":tests-locale-data-%s.update" % locale for locale in TEST_LOCALES],
    visibility = [
        "//:__pkg__",
    ],
)

generate_src_file(
    name = "test262-main",
    src = "test262-main.ts",
    args = [
        "--cldrFolder",
        "$(location :cldr-raw)",
        "--locales",
        "ar,de,en,ja,ko,th,zh,zh-Hant,zh-Hans",
    ],
    data = CLDR_DEPS,
    entry_point = "scripts/test262-main-gen.ts",
    visibility = [
        "//:__pkg__",
    ],
)

# "ts-node scripts/link --input iana-data/backward --output src/links.ts"
# links
generate_src_file(
    name = "links",
    src = "src/data/links.ts",
    args = [
        "--input",
        "$(location @tzdata//:backward)",
    ],
    data = [
        "@tzdata//:backward",
    ],
    entry_point = "scripts/link.ts",
)

# data.ts
generate_src_file(
    name = "all-tz",
    src = "src/data/all-tz.ts",
    args = [
        "$(locations @tzdata//:zdumps)",
    ],
    data = [
        "src/packer.ts",
        "src/types.ts",
        "//packages/ecma402-abstract:dist",
        "//packages/ecma402-abstract:types",
        "@npm//@types/json-stable-stringify",
        "@npm//json-stable-stringify",
        "@tzdata//:zdumps",
    ],
    entry_point = "scripts/process-zdump.ts",
)

# "ts-node scripts/process-zdump --polyfill --output dist/add-all-tz.js --input data.zdump"
# add-all-tz
ts_script(
    name = "add-all-tz",
    outs = ["add-all-tz.js"],
    args = [
        "--polyfill",
        "$(locations @tzdata//:zdumps)",
    ],
    data = [
        "src/packer.ts",
        "src/types.ts",
        "//packages/ecma402-abstract:dist",
        "//packages/ecma402-abstract:types",
        "@npm//@types/json-stable-stringify",
        "@npm//json-stable-stringify",
        "@tzdata//:zdumps",
    ],
    entry_point = "scripts/process-zdump.ts",
    visibility = [
        "//packages/intl:__subpackages__",
        "//packages/react-intl:__subpackages__",
    ],
)

# add-golden-tz
ts_script(
    name = "add-golden-tz",
    outs = ["add-golden-tz.js"],
    args = [
        "--golden",
        "--polyfill",
        "$(locations @tzdata//:zdumps)",
    ],
    data = [
        "src/packer.ts",
        "src/types.ts",
        "//packages/ecma402-abstract:dist",
        "//packages/ecma402-abstract:types",
        "@npm//@types/json-stable-stringify",
        "@npm//json-stable-stringify",
        "@tzdata//:zdumps",
    ],
    entry_point = "scripts/process-zdump.ts",
)

genrule(
    name = "add-all-tz-typedef",
    outs = ["add-all-tz.d.ts"],
    cmd = "echo 'export {}' > $@",
)

genrule(
    name = "add-golden-tz-typedef",
    outs = ["add-golden-tz.d.ts"],
    cmd = "echo 'export {}' > $@",
)

generated_file_test(
    name = "tsconfig_json",
    src = "tsconfig.json",
    generated = "//tools:tsconfig.golden.json",
)

esbuild(
    name = "polyfill.iife",
    entry_point = "lib/polyfill.js",
    target = "es5",
    deps = [
        ":dist-esm",
        "@npm//tslib",
    ] + SRC_DEPS,
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
            "src/data/*",
            "test262-main.ts",
        ],
    ),
)

ts_node(
    name = "benchmark",
    args = [
        "--transpile-only",
        "$(execpath tests/benchmark.ts)",
    ],
    data = SRCS + SRC_DEPS + [
        "tests/benchmark.ts",
        "tests/locale-data/en.json",
        "//:tsconfig.json",
        "@npm//tslib",
        "//:tsconfig.node.json",
    ],
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("@npm//@bazel/rollup:index.bzl", "rollup_bundle")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("@npm//test262-harness:index.bzl", "test262_harness_test")
load("@npm//ts-node:index.bzl", "ts_node")
load("//tools:index.bzl", "generate_src_file", "ts_compile")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "intl-numberformat"

TEST_LOCALES = [
    "en",
    "en-GB",
    "da",
    "de",
    "es",
    "fr",
    "id",
    "it",
    "ja",
    "ko",
    "ms",
    "nb",
    "nl",
    "pl",
    "pt",
    "ru",
    "sv",
    "th",
    "tr",
    "uk",
    "zh",
    "en-BS",
    "zh-Hant",
    "ar-SS",
    "bn",
    "sw",
    "hi",
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
        ":dist",
        ":locale-data",
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
        "src/*.ts",
        "src/data/*",
    ],
    exclude = ["test*.*"],
)

TESTS = glob([
    "tests/*.test.ts",
])

SNAPSHOTS = glob(["tests/__snapshots__/*.snap"])

SRC_DEPS = [
    "@npm//es-abstract",
    "@npm//@types/es-abstract",
    "//packages/ecma402-abstract:dist",
    "//packages/intl-getcanonicallocales:dist",
]

TEST_DEPS = SRC_DEPS + [
    "//packages/intl-pluralrules",
    "//packages/ecma402-abstract:types",
    "//packages/intl-getcanonicallocales:types",
]

ts_compile(
    name = "dist",
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = SRCS,
    deps = SRC_DEPS,
)

# Bc this is too big
[jest_test(
    name = "unit-%s" % f[f.rindex("/") + 1:f.rindex(".")],
    srcs = SRCS + [f] + TEST_LOCALE_DATA + SNAPSHOTS,
    deps = TEST_DEPS,
) for f in TESTS]

# CLDR
CLDR_DEPS = [
    ":cldr-raw",
    "scripts/cldr.ts",
    "//:tsconfig.json",
    "@npm//@types/fs-extra",
    "@npm//@types/minimist",
    "@npm//@types/node",
    "@npm//fs-extra",
    "@npm//fast-glob",
    "@npm//minimist",
]

ts_node(
    name = "cldr-raw",
    args = [
        "$(execpath scripts/cldr-raw.ts)",
        "--outDir",
        "$(@D)",
    ],
    data = [
        "scripts/cldr-raw.ts",
        "scripts/extract-currencies.ts",
        "scripts/extract-numbers.ts",
        "scripts/extract-units.ts",
        "scripts/utils.ts",
        "//:tsconfig.json",
        "//packages/ecma402-abstract:dist",
        "//packages/ecma402-abstract:types",
        "@npm//@types/fs-extra",
        "@npm//@types/lodash",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//cldr-core",
        "@npm//cldr-numbers-full",
        "@npm//cldr-units-full",
        "@npm//fast-glob",
        "@npm//fs-extra",
        "@npm//lodash",
        "@npm//minimist",
    ],
    output_dir = True,
    visibility = ["//packages/react-intl:__subpackages__"],
)

ts_node(
    name = "locale-data",
    args = [
        "$(execpath scripts/cldr.ts)",
        "--cldrFolder",
        "$(location :cldr-raw)",
        "--outDir",
        "$(@D)",
    ],
    data = CLDR_DEPS,
    output_dir = True,
    visibility = ["//packages/react-intl:__subpackages__"],
)

[generate_src_file(
    name = "tests-locale-data-%s" % locale,
    src = "tests/locale-data/%s.json" % locale,
    args = [
        "$(execpath scripts/cldr.ts)",
        "--cldrFolder",
        "$(location :cldr-raw)",
        "--locales",
        locale,
        "--testOutFile",
        "$@",
    ],
    data = CLDR_DEPS,
) for locale in TEST_LOCALES]

generate_src_file(
    name = "test262-main",
    src = "test262-main.ts",
    args = [
        "$(execpath scripts/cldr.ts)",
        "--cldrFolder",
        "$(location :cldr-raw)",
        "--locales",
        "ar,de,en,ja,ko,th,zh,zh-Hant,zh-Hans",
        "--test262MainFile",
        "$@",
    ],
    data = CLDR_DEPS,
)

# currency-digits
generate_src_file(
    name = "currency-digits",
    src = "src/data/currency-digits.json",
    args = [
        "$(execpath scripts/currency-digits.ts)",
        "--out",
        "$@",
    ],
    data = [
        "scripts/currency-digits.ts",
        "scripts/extract-currencies.ts",
        "scripts/utils.ts",
        "//:tsconfig.json",
        "//packages/ecma402-abstract:dist",
        "//packages/ecma402-abstract:types",
        "@npm//@types/fs-extra",
        "@npm//@types/lodash",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//cldr-core",
        "@npm//cldr-numbers-full",
        "@npm//fast-glob",
        "@npm//fs-extra",
        "@npm//lodash",
        "@npm//minimist",
    ],
)

# digit-mapping
generate_src_file(
    name = "digit-mapping",
    src = "src/data/digit-mapping.json",
    args = [
        "$(execpath scripts/digit-mapping.ts)",
        "--out",
        "$@",
    ],
    data = [
        "scripts/digit-mapping.ts",
        "//:tsconfig.json",
        "@npm//@types/fs-extra",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//fs-extra",
        "@npm//minimist",
    ],
)

# numbering-systems
generate_src_file(
    name = "numbering-systems",
    src = "src/data/numbering-systems.json",
    args = [
        "$(execpath scripts/numbering-systems.ts)",
        "--out",
        "$@",
    ],
    data = [
        "scripts/extract-numbers.ts",
        "scripts/numbering-systems.ts",
        "scripts/utils.ts",
        "//:tsconfig.json",
        "//packages/ecma402-abstract:dist",
        "//packages/ecma402-abstract:types",
        "@npm//@types/fs-extra",
        "@npm//@types/lodash",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//cldr-core",
        "@npm//cldr-numbers-full",
        "@npm//fs-extra",
        "@npm//lodash",
        "@npm//minimist",
    ],
)

# units-constants
generate_src_file(
    name = "units-constants",
    src = "src/data/units-constants.ts",
    args = [
        "$(execpath scripts/units-constants.ts)",
        "--out",
        "$@",
    ],
    data = [
        "scripts/units-constants.ts",
        "//:tsconfig.json",
        "//packages/ecma402-abstract:dist",
        "//packages/ecma402-abstract:types",
        "@npm//@types/fs-extra",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//fs-extra",
        "@npm//minimist",
    ],
)

# Test262
ts_project(
    name = "test262-main-bundle",
    srcs = SRCS + ["test262-main.ts"],
    declaration = True,
    declaration_map = True,
    extends = [
        "//:tsconfig.json",
    ],
    out_dir = "test262",
    tsconfig = "//:tsconfig.es6.json",
    deps = SRC_DEPS,
)

rollup_bundle(
    name = "test262-polyfill",
    srcs = [
        ":test262-main-bundle",
    ],
    config_file = "//:rollup.config.js",
    entry_point = "test262/test262-main.js",
    format = "umd",
    deps = [
        "@npm//@rollup/plugin-node-resolve",
        "@npm//@rollup/plugin-commonjs",
        "@npm//@rollup/plugin-replace",
        "@npm//@rollup/plugin-json",
    ] + SRC_DEPS,
)

test262_harness_test(
    name = "test262",
    data = [
        "test262-polyfill.js",
        "//:test262-all",
        "//:test262-numberformat",
    ],
    templated_args = [
        "--reporter-keys",
        "file,attrs,result",
        "--prelude",
        "$(rootpath test262-polyfill.js)",
        "$(rootpaths //:test262-numberformat)",
    ],
)

generated_file_test(
    name = "tsconfig_json",
    src = "tsconfig.json",
    generated = "//tools:tsconfig.golden.json",
)

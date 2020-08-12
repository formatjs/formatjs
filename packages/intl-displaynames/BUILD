load("@build_bazel_rules_nodejs//:index.bzl", "pkg_npm")
load("@npm//@bazel/rollup:index.bzl", "rollup_bundle")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("@npm//test262-harness:index.bzl", "test262_harness_test")
load("@npm//ts-node:index.bzl", "ts_node")
load("//tools:index.bzl", "bundle_karma_tests", "generate_src_file", "rollup_dts", "ts_compile")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "intl-displaynames"

TEST_LOCALES = [
    "en",
    "zh",
]

TEST_LOCALE_DATA = ["tests/locale-data/%s.json" % locale for locale in TEST_LOCALES]

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
    ],
    deps = [
        "%s.d.ts" % PACKAGE_NAME,
        "polyfill-locales.js",
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

SRC_DEPS = [
    "//packages/intl-utils:dist",
    "//packages/intl-getcanonicallocales:dist",
]

TEST_DEPS = SRC_DEPS + [
    "//packages/intl-utils:types",
    "//packages/intl-getcanonicallocales:types",
]

ts_compile(
    name = "dist",
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = SRCS,
    deps = SRC_DEPS,
)

jest_test(
    name = "unit",
    srcs = SRCS + TESTS + TEST_LOCALE_DATA,
    deps = TEST_DEPS,
)

rollup_dts(
    name = "rollup-dts",
    package_name = PACKAGE_NAME,
    package_json = "package.json",
    types = [
        ":types",
        "//packages/intl-utils:types",
    ],
)

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
        "scripts/extract-displaynames.ts",
        "//:tsconfig.json",
        "//packages/intl-utils:dist",
        "//packages/intl-utils:types",
        "@npm//@types/fs-extra",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//cldr-core",
        "@npm//cldr-localenames-full",
        "@npm//cldr-numbers-full",
        "@npm//fast-glob",
        "@npm//fs-extra",
        "@npm//minimist",
    ],
    output_dir = True,
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
)

ts_node(
    name = "polyfill-locales",
    outs = ["polyfill-locales.js"],
    args = [
        "$(execpath scripts/cldr.ts)",
        "--cldrFolder",
        "$(location :cldr-raw)",
        "--polyfillLocalesOutFile",
        "$@",
    ],
    data = CLDR_DEPS,
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
        "ar,de,en,en-US,ja,ko,th,zh,zh-Hant,zh-Hans",
        "--test262MainFile",
        "$@",
    ],
    data = CLDR_DEPS,
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
        "//:test262-displaynames",
    ],
    templated_args = [
        "--reporter-keys",
        "file,attrs,result",
        "--prelude",
        "$(rootpath test262-polyfill.js)",
        "$(rootpaths //:test262-displaynames)",
    ],
)

bundle_karma_tests(
    name = "bundled-karma-tests",
    srcs = SRCS,
    data = TEST_LOCALE_DATA,
    tests = TESTS,
    deps = SRC_DEPS,
)

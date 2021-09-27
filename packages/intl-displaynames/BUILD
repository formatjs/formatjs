load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("@com_github_ash2k_bazel_tools//multirun:def.bzl", "multirun")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("@npm//test262-harness:index.bzl", "test262_harness_test")
load("//tools:index.bzl", "bundle_karma_tests", "check_format", "esbuild", "generate_src_file", "package_json_test", "ts_compile", "ts_script")
load("//tools:jest.bzl", "jest_test")

exports_files(["package.json"])

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
    ],
    deps = [
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
        "abstract/*.ts",
    ],
    exclude = ["test*.*"],
)

TESTS = glob([
    "tests/*.test.ts",
])

SRC_DEPS = [
    "//packages/ecma402-abstract:dist",
    "//packages/intl-localematcher:dist",
]

TEST_DEPS = SRC_DEPS + [
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

jest_test(
    name = "unit",
    srcs = SRCS + TESTS + TEST_LOCALE_DATA,
    deps = TEST_DEPS,
)

# CLDR
CLDR_DEPS = [
    ":cldr-raw",
    "@npm//fast-glob",
]

ts_script(
    name = "cldr-raw",
    data = [
        "scripts/extract-displaynames.ts",
        "//packages/ecma402-abstract:dist",
        "//packages/ecma402-abstract:types",
        "@npm//cldr-core",
        "@npm//cldr-localenames-full",
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
        "//packages/intl:__pkg__",
        "//packages/react-intl:__pkg__",
        "//website:__pkg__",
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
        "ar,de,en,en-US-POSIX,ja,ko,th,zh,zh-Hant,zh-Hans",
    ],
    data = CLDR_DEPS,
    entry_point = "scripts/test262-main-gen.ts",
    visibility = [
        "//:__pkg__",
    ],
)

# Test262
ts_project(
    name = "test262-main-bundle",
    srcs = SRCS + ["test262-main.ts"],
    declaration = True,
    declaration_map = True,
    extends = "//:tsconfig.json",
    out_dir = "test262",
    resolve_json_module = True,
    tsconfig = "//:tsconfig.es6.json",
    deps = SRC_DEPS,
)

esbuild(
    name = "test262-polyfill",
    entry_point = "test262/test262-main.js",
    target = "es6",
    deps = [
        ":test262-main-bundle",
    ] + SRC_DEPS,
)

test262_harness_test(
    name = "test262",
    size = "large",
    data = [
        "test262-polyfill.js",
        "@com_github_tc39_test262//:test262-displaynames",
        "@com_github_tc39_test262//:test262-harness",
    ],
    templated_args = [
        "--reporter-keys",
        "file,attrs,result",
        "--errorForFailures",
        "--timeout",
        "30000",
        "--prelude",
        "$(rootpath test262-polyfill.js)",
        "--test262Dir",
        "../com_github_tc39_test262",
        "../com_github_tc39_test262/test/intl402/DisplayNames/**/*.js",
    ],
)

bundle_karma_tests(
    name = "bundled-karma-tests",
    srcs = SRCS,
    data = TEST_LOCALE_DATA,
    esbuild_deps = [
        "//packages/intl-getcanonicallocales:dist",
        "//packages/intl-locale:dist",
    ],
    tests = TESTS,
    deps = SRC_DEPS,
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
            "test262-main.ts",
        ],
    ),
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

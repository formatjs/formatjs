load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("@com_github_ash2k_bazel_tools//multirun:def.bzl", "multirun")
load("@npm//@bazel/esbuild:index.bzl", "esbuild")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("@npm//test262-harness:index.bzl", "test262_harness_test")
load("//tools:index.bzl", "check_format", "generate_src_file", "package_json_test", "ts_compile", "ts_script")
load("//tools:jest.bzl", "jest_test")

exports_files(["package.json"])

PACKAGE_NAME = "intl-numberformat"

TEST_LOCALES = [
    "ar-SS",
    "bn",
    "da",
    "de",
    "en-BS",
    "en-GB",
    "en",
    "es",
    "fr",
    "hi",
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
    "sw",
    "th",
    "tr",
    "uk",
    "zh-Hans",
    "zh-Hant",
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
        "src/*.ts",
        "src/data/*",
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

# Bc this is too big
[jest_test(
    name = "unit-%s" % f[f.rindex("/") + 1:f.rindex(".")],
    size = "large",
    srcs = SRCS + [f] + TEST_LOCALE_DATA + glob(["tests/__snapshots__/%s.*" % f[f.rindex("/") + 1:f.rindex(".")]]),
    deps = TEST_DEPS,
) for f in TESTS]

# CLDR
CLDR_DEPS = [
    ":cldr-raw",
    "@npm//fast-glob",
]

ts_script(
    name = "cldr-raw",
    data = [
        "scripts/extract-currencies.ts",
        "scripts/extract-numbers.ts",
        "scripts/extract-units.ts",
        "scripts/utils.ts",
        "//packages/ecma402-abstract:dist",
        "//packages/ecma402-abstract:types",
        "@npm//@types/lodash",
        "@npm//cldr-core",
        "@npm//cldr-numbers-full",
        "@npm//cldr-units-full",
        "@npm//fast-glob",
        "@npm//lodash",
    ],
    entry_point = "scripts/cldr-raw.ts",
    output_dir = True,
    visibility = [
        "//packages/intl:__subpackages__",
        "//packages/react-intl:__subpackages__",
    ],
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
    name = "supported-locales",
    src = "supported-locales.ts",
    args = [
        "--cldrFolder",
        "$(location :cldr-raw)",
    ],
    data = CLDR_DEPS,
    entry_point = "//tools:supported-locales-gen.ts",
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
        "ar,de,en,ja,ko,th,zh,zh-Hant",
    ],
    data = CLDR_DEPS,
    entry_point = "scripts/test262-main-gen.ts",
    visibility = [
        "//:__pkg__",
    ],
)

# currency-digits
generate_src_file(
    name = "currency-digits",
    src = "src/currency-digits.generated.ts",
    data = [
        "scripts/extract-currencies.ts",
        "scripts/utils.ts",
        "//packages/ecma402-abstract:dist",
        "//packages/ecma402-abstract:types",
        "@npm//@types/lodash",
        "@npm//cldr-core",
        "@npm//cldr-numbers-full",
        "@npm//fast-glob",
        "@npm//lodash",
    ],
    entry_point = "scripts/currency-digits.ts",
)

# numbering-systems
generate_src_file(
    name = "numbering-systems",
    src = "src/numbering-systems.generated.ts",
    data = [
        "scripts/extract-numbers.ts",
        "scripts/utils.ts",
        "//packages/ecma402-abstract:dist",
        "//packages/ecma402-abstract:types",
        "@npm//@types/lodash",
        "@npm//cldr-core",
        "@npm//cldr-numbers-full",
        "@npm//lodash",
    ],
    entry_point = "scripts/numbering-systems.ts",
)

# units-constants
# generate_src_file(
#     name = "units-constants",
#     src = "src/units-constants.generated.ts",
#     data = [
#         "//packages/ecma402-abstract:dist",
#         "//packages/ecma402-abstract:types",
#     ],
#     entry_point = "scripts/units-constants.ts",
# )

# Test262
ts_project(
    name = "test262-main-bundle",
    srcs = SRCS + ["test262-main.ts"],
    declaration = True,
    declaration_map = True,
    extends =
        "//:tsconfig.json",
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
        "//packages/intl-getcanonicallocales:dist",
        "//packages/intl-locale:dist",
    ] + SRC_DEPS,
)

test262_harness_test(
    name = "test262",
    size = "large",
    data = [
        "test262-polyfill.js",
        "@com_github_tc39_test262//:test262-harness",
        "@com_github_tc39_test262//:test262-numberformat",
    ],
    templated_args = [
        "--reporter-keys",
        "file,attrs,result",
        "--timeout",
        "30000",
        "--prelude",
        "$(rootpath test262-polyfill.js)",
        "--test262Dir",
        "../com_github_tc39_test262",
        "../com_github_tc39_test262/test/intl402/NumberFormat/**/*.js",
    ],
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
            "**/*.generated.*",
            "test262-main.ts",
            "tests/__snapshots__/*",
            "tests/locale-data/*",
            "CHANGELOG.md",
            "supported-locales.ts",
        ],
    ),
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

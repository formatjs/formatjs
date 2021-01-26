load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("@com_github_atlassian_bazel_tools//multirun:def.bzl", "multirun")
load("@npm//@bazel/rollup:index.bzl", "rollup_bundle")
load("@npm//@bazel/terser:index.bzl", "terser_minified")
load("@npm//ts-node:index.bzl", "ts_node")
load("//tools:index.bzl", "generate_src_file", "prettier_check", "ts_compile")
load("//tools:jest.bzl", "jest_test")

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
        "add-golden-tz.js",
        ":dist",
        ":locale-data",
        # polyfill-library uses this
        "polyfill.umd.js",
        ":polyfill.umd.min",
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
]

TEST_DEPS = SRC_DEPS + [
    "//packages/intl-pluralrules",
    "//packages/ecma402-abstract:types",
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
    "scripts/cldr.ts",
    ":cldr-raw",
    "//:tsconfig.json",
    "@npm//@types/fs-extra",
    "@npm//@types/minimist",
    "@npm//@types/node",
    "@npm//fs-extra",
    "@npm//fast-glob",
    "@npm//minimist",
    "@npm//tslib",
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
        "scripts/extract-dates.ts",
        "src/types.ts",
        "//:tsconfig.json",
        "//packages/ecma402-abstract:dist",
        "//packages/ecma402-abstract:types",
        "//packages/intl-locale:dist",
        "//packages/intl-locale:types",
        "@npm//@types/fs-extra",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//cldr-core",
        "@npm//cldr-dates-full",
        "@npm//cldr-numbers-full",
        "@npm//fast-glob",
        "@npm//fs-extra",
        "@npm//minimist",
        "@npm//tslib",
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
    visibility = [
        "//packages/intl:__subpackages__",
        "//packages/react-intl:__subpackages__",
    ],
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
        "$(execpath scripts/cldr.ts)",
        "--cldrFolder",
        "$(location :cldr-raw)",
        "--locales",
        "ar,de,en,ja,ko,th,zh,zh-Hant,zh-Hans",
        "--test262MainFile",
        "$@",
    ],
    data = CLDR_DEPS,
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
        "$(execpath scripts/link.ts)",
        "--input",
        "$(location @tzdata//:backward)",
        "--output",
        "$@",
    ],
    data = [
        "scripts/link.ts",
        "//:tsconfig.json",
        "@npm//@types/fs-extra",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//fs-extra",
        "@npm//minimist",
        "@npm//tslib",
        "@tzdata//:backward",
    ],
)

# data.ts
generate_src_file(
    name = "all-tz",
    src = "src/data/all-tz.ts",
    args = [
        "$(execpath scripts/process-zdump.ts)",
        "--output",
        "$@",
        "$(locations @tzdata//:zdumps)",
    ],
    data = [
        "scripts/process-zdump.ts",
        "src/packer.ts",
        "src/types.ts",
        "//:tsconfig.json",
        "//packages/ecma402-abstract:dist",
        "//packages/ecma402-abstract:types",
        "@npm//@types/fs-extra",
        "@npm//@types/json-stable-stringify",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//fs-extra",
        "@npm//json-stable-stringify",
        "@npm//minimist",
        "@npm//tslib",
        "@tzdata//:zdumps",
    ],
)

# "ts-node scripts/process-zdump --polyfill --output dist/add-all-tz.js --input data.zdump"
# add-all-tz
ts_node(
    name = "add-all-tz",
    outs = ["add-all-tz.js"],
    args = [
        "$(execpath scripts/process-zdump.ts)",
        "--polyfill",
        "--output",
        "$@",
        "$(locations @tzdata//:zdumps)",
    ],
    data = [
        "scripts/process-zdump.ts",
        "src/packer.ts",
        "src/types.ts",
        "//:tsconfig.json",
        "//packages/ecma402-abstract:dist",
        "//packages/ecma402-abstract:types",
        "@npm//@types/fs-extra",
        "@npm//@types/json-stable-stringify",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//fs-extra",
        "@npm//json-stable-stringify",
        "@npm//minimist",
        "@npm//tslib",
        "@tzdata//:zdumps",
    ],
    visibility = [
        "//packages/intl:__subpackages__",
        "//packages/react-intl:__subpackages__",
    ],
)

# add-golden-tz
ts_node(
    name = "add-golden-tz",
    outs = ["add-golden-tz.js"],
    args = [
        "$(execpath scripts/process-zdump.ts)",
        "--golden",
        "--polyfill",
        "--output",
        "$@",
        "$(locations @tzdata//:zdumps)",
    ],
    data = [
        "scripts/process-zdump.ts",
        "src/packer.ts",
        "src/types.ts",
        "//:tsconfig.json",
        "//packages/ecma402-abstract:dist",
        "//packages/ecma402-abstract:types",
        "@npm//@types/fs-extra",
        "@npm//@types/json-stable-stringify",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//fs-extra",
        "@npm//json-stable-stringify",
        "@npm//minimist",
        "@npm//tslib",
        "@tzdata//:zdumps",
    ],
)

generated_file_test(
    name = "tsconfig_json",
    src = "tsconfig.json",
    generated = "//tools:tsconfig.golden.json",
)

# Test262
# ts_project(
#     name = "test262-main-bundle",
#     srcs = SRCS + ["test262-main.ts"],
#     declaration = True,
#     declaration_map = True,
#     extends = "//:tsconfig.json",
#     out_dir = "test262",
#     tsconfig = "//:tsconfig.es6.json",
#     deps = SRC_DEPS,
# )

# rollup_bundle(
#     name = "test262-polyfill",
#     srcs = [
#         ":test262-main-bundle",
#     ],
#     config_file = "//:rollup.config.js",
#     entry_point = "test262/test262-main.js",
#     format = "umd",
#     deps = [
#         "@npm//@rollup/plugin-node-resolve",
#         "@npm//@rollup/plugin-commonjs",
#         "@npm//@rollup/plugin-replace",
#         "@npm//@rollup/plugin-json",
#     ] + SRC_DEPS,
# )

# test262_harness_test(
#     name = "test262",
#     data = [
#         "test262-polyfill.js",
#         "//:test262-all",
#         "//:test262-datetimeformat",
#     ],
#     templated_args = [
#         "--reporter-keys",
#         "file,attrs,result",
#         "-t",
#         "2",
#         "--prelude",
#         "$(rootpath test262-polyfill.js)",
#         "$(rootpaths //:test262-datetimeformat)",
#     ],
# )

# karma_bundle_test(
#     name = "karma",
#     srcs = SRCS,
#     data = TEST_LOCALE_DATA,
#     tests = TESTS,
#     deps = SRC_DEPS,
# )

rollup_bundle(
    name = "polyfill.umd",
    srcs = [":dist-esm"],
    args = [
        "--name",
        "IntlPluralRules",
        "--no-sourcemap",
    ],
    config_file = "//:rollup.config.js",
    entry_point = "lib/polyfill.js",
    format = "umd",
    deps = [
        "@npm//@rollup/plugin-node-resolve",
        "@npm//@rollup/plugin-commonjs",
        "@npm//@rollup/plugin-replace",
        "@npm//@rollup/plugin-json",
        "@npm//tslib",
    ] + SRC_DEPS,
)

terser_minified(
    name = "polyfill.umd.min",
    src = "polyfill.umd.js",
    sourcemap = False,
)

prettier_check(
    name = "prettier",
    srcs = glob(
        [
            "**/*",
        ],
        exclude = [
            "BUILD",
            "tzdata.BUILD",
            "tzcode.BUILD",
            "CHANGELOG.md",
            "tests/locale-data/*",
            "src/data/*",
            "test262-main.ts",
        ],
    ),
)

load("@build_bazel_rules_nodejs//:index.bzl", "pkg_npm")

# load("@npm//@bazel/rollup:index.bzl", "rollup_bundle")
# load("@npm//@bazel/typescript:index.bzl", "ts_project")
# load("@npm//test262-harness:index.bzl", "test262_harness_test")
load("@npm//ts-node:index.bzl", "ts_node")
load("//tools:index.bzl", "generate_src_file", "rollup_dts", "ts_compile")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "intl-datetimeformat"

TEST_LOCALES = [
    "ar",
    "de",
    "en",
    "en-GB",
    "ko",
    "pl",
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
        "add-all-tz.js",
        "add-golden-tz.js",
        "%s.d.ts" % PACKAGE_NAME,
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
    "tests/__snapshots__/*.snap",
])

SRC_DEPS = [
    "//packages/intl-utils:dist",
    "//packages/intl-getcanonicallocales:dist",
]

TEST_DEPS = SRC_DEPS + [
    "//packages/intl-pluralrules",
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
    "scripts/cldr.ts",
    ":cldr-raw",
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
        "scripts/extract-dates.ts",
        "src/skeleton.ts",
        "src/types.ts",
        "//:tsconfig.json",
        "//packages/intl-locale:dist",
        "//packages/intl-locale:types",
        "//packages/intl-utils:dist",
        "//packages/intl-utils:types",
        "@npm//@types/fs-extra",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//cldr-core",
        "@npm//cldr-dates-full",
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

# IANA
ts_node(
    name = "iana-data",
    args = [
        "$(execpath scripts/iana.ts)",
        "--version",
        "2020a",
        "--outDir",
        "$(@D)",
    ],
    data = [
        "scripts/iana.ts",
        "//:tsconfig.json",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//@types/node-fetch",
        "@npm//@types/tar",
        "@npm//minimist",
        "@npm//node-fetch",
        "@npm//tar",
    ],
    output_dir = True,
)

# zic
# ts_node(
#     name = "zic",
#     args = [
#         "$(execpath scripts/zic.ts)",
#         "--dataDir",
#         "$(locations iana-data)",
#         "--outDir",
#         "$(@D)",
#     ],
#     data = [
#         "iana-data",
#         "scripts/zic.ts",
#         "//:tsconfig.json",
#         "@npm//@types/minimist",
#         "@npm//@types/node",
#         "@npm//minimist",
#     ],
#     output_dir = True,
# )

# zones
generate_src_file(
    name = "zones",
    src = "src/data/zones.ts",
    args = [
        "$(execpath scripts/zone.ts)",
        "--input",
        "$(location iana-data/zone.tab)",
        "--output",
        "$@",
    ],
    data = [
        "iana-data/zone.tab",
        "scripts/zone.ts",
        "//:tsconfig.json",
        "@npm//@types/fs-extra",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//fs-extra",
        "@npm//minimist",
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
        "$(location iana-data/backward)",
        "--output",
        "$@",
    ],
    data = [
        "iana-data/backward",
        "scripts/link.ts",
        "//:tsconfig.json",
        "@npm//@types/fs-extra",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//fs-extra",
        "@npm//minimist",
    ],
)

# data.ts
generate_src_file(
    name = "all-tz",
    src = "src/data/all-tz.ts",
    args = [
        "$(execpath scripts/process-zdump.ts)",
        "--input",
        "$(location data.zdump)",
        "--output",
        "$@",
    ],
    data = [
        "data.zdump",
        "scripts/process-zdump.ts",
        "src/packer.ts",
        "src/types.ts",
        "//:tsconfig.json",
        "@npm//@types/fs-extra",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//fs-extra",
        "@npm//minimist",
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
        "--input",
        "$(location data.zdump)",
        "--output",
        "$@",
    ],
    data = [
        "data.zdump",
        "scripts/process-zdump.ts",
        "src/packer.ts",
        "src/types.ts",
        "//:tsconfig.json",
        "@npm//@types/fs-extra",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//fs-extra",
        "@npm//minimist",
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
        "--input",
        "$(location data.zdump)",
        "--output",
        "$@",
    ],
    data = [
        "data.zdump",
        "scripts/process-zdump.ts",
        "src/packer.ts",
        "src/types.ts",
        "//:tsconfig.json",
        "@npm//@types/fs-extra",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//fs-extra",
        "@npm//minimist",
    ],
)

# Test262
# ts_project(
#     name = "test262-main-bundle",
#     srcs = SRCS + ["test262-main.ts"],
#     declaration = True,
#     declaration_map = True,
#     extends = [
#         "//:tsconfig.json",
#     ],
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

# zdump
# TODO: zdump takes a very long time
# generate_src_file(
#     name="zdump",
#     src = "data.zdump",
#     args = [
#         "$(execpath scripts/zdump.ts)",
#         "--zicDir",
#         "$(locations zic)",
#         "--output",
#         "$@",
#     ],
#     data = [
#         "scripts/zdump.ts",
#         "src/data/zones.ts",
#         "zic",
#         "//:tsconfig.json",
#         "@npm//@types/fs-extra",
#         "@npm//@types/minimist",
#         "@npm//@types/node",
#         "@npm//fs-extra",
#         "@npm//minimist",
#     ],
# )

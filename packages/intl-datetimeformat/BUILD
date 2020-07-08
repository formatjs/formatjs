load("@build_bazel_rules_nodejs//:index.bzl", "copy_to_bin", "generated_file_test", "npm_package_bin", "pkg_npm")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("@npm//ts-node:index.bzl", "ts_node")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "intl-datetimeformat"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "package.json",
    ],
    deps = [
        "add-all-tz.js",
        "add-golden-tz.js",
        "intl-datetimeformat.d.ts",
        ":dist",
        ":lib",
        ":locale-data",
    ],
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
    "@npm//@jest/transform",
    "@npm//ts-jest",
    "@npm//@types/jest",
    "//packages/intl-pluralrules",
    "//packages/intl-utils:types",
    "//packages/intl-getcanonicallocales:types",
]

ts_project(
    name = "dist",
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = SRCS,
    declaration = True,
    declaration_map = True,
    source_map = True,
    tsconfig = "//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = SRC_DEPS,
)

ts_project(
    name = "lib",
    srcs = SRCS,
    declaration = True,
    declaration_map = True,
    extends = ["//:tsconfig.json"],
    outdir = "lib",
    source_map = True,
    tsconfig = "//:tsconfig.esm.json",
    visibility = ["//visibility:public"],
    deps = SRC_DEPS,
)

filegroup(
    name = "types",
    srcs = [":dist"],
    output_group = "types",
    visibility = ["//visibility:public"],
)

jest_test(
    name = "unit",
    srcs = [
        "//:tsconfig.json",
    ] + SRCS + TESTS,
    jest_config = "//:jest.config.js",
    tags = [
        # Need to set the pwd to avoid jest needing a runfiles helper
        # Windows users with permissions can use --enable_runfiles
        # to make this test work
        "no-bazelci-windows",
        # TODO: why does this fail almost all the time, but pass on local Mac?
        "no-bazelci-mac",
    ],
    deps = TEST_DEPS + [":tests-locale-data"],
)

# API Extractor
genrule(
    name = "copy-tsconfig",
    srcs = ["//:tsconfig.json"],
    outs = ["tsconfig.json"],
    cmd = "cp $< $@",
)

genrule(
    name = "copy-api-extractor",
    srcs = ["//:api-extractor.json"],
    outs = ["api-extractor.json"],
    cmd = "cp $< $@",
)

copy_to_bin(
    name = "copy-package-json",
    srcs = [
        "package.json",
    ],
)

npm_package_bin(
    name = "rollup-dts",
    outs = ["%s.d.ts" % PACKAGE_NAME],
    args = [
        "run",
        "--local",
        "--diagnostics",
        "-c",
        "$(@D)/api-extractor.json",
    ],
    data = [
        "api-extractor.json",
        "tsconfig.json",
        ":copy-package-json",
        ":types",
        "//:setup-api-extractor",
    ],
    package = "api-extractor",
    tool = "@npm//@microsoft/api-extractor/bin:api-extractor",
)

# CLDR
npm_package_bin(
    name = "locale-data",
    args = [
        "$(execpath scripts/cldr.ts)",
        "--outDir",
        "$(@D)",
    ],
    data = [
        "scripts/cldr.ts",
        "scripts/extract-dates.ts",
        "src/skeleton.ts",
        "src/types.ts",
        "//:tsconfig.json",
        "//packages/intl-locale:dist",
        "//packages/intl-locale:types",
        "//packages/intl-utils:dist",
        "//packages/intl-utils:types",
        "@npm//@types/fs-extra",
        "@npm//@types/glob",
        "@npm//@types/lodash",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//cldr-core",
        "@npm//cldr-dates-full",
        "@npm//cldr-numbers-full",
        "@npm//fs-extra",
        "@npm//glob",
        "@npm//lodash",
        "@npm//minimist",
    ],
    output_dir = True,
    package = "ts-node",
)

npm_package_bin(
    name = "tests-locale-data",
    args = [
        "$(execpath scripts/cldr.ts)",
        "--testDataDir",
        "$(@D)",
    ],
    data = [
        "scripts/cldr.ts",
        "scripts/extract-dates.ts",
        "src/skeleton.ts",
        "src/types.ts",
        "//:tsconfig.json",
        "//packages/intl-locale:dist",
        "//packages/intl-locale:types",
        "//packages/intl-utils:dist",
        "//packages/intl-utils:types",
        "@npm//@types/fs-extra",
        "@npm//@types/glob",
        "@npm//@types/lodash",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//cldr-core",
        "@npm//cldr-dates-full",
        "@npm//cldr-numbers-full",
        "@npm//fs-extra",
        "@npm//glob",
        "@npm//lodash",
        "@npm//minimist",
    ],
    output_dir = True,
    package = "ts-node",
)

npm_package_bin(
    name = "test262-main-gen",
    outs = ["tmp/test262-main.ts"],
    args = [
        "$(execpath scripts/cldr.ts)",
        "--test262MainFile",
        "$@",
    ],
    data = [
        "scripts/cldr.ts",
        "scripts/extract-dates.ts",
        "src/skeleton.ts",
        "src/types.ts",
        "//:tsconfig.json",
        "//packages/intl-locale:dist",
        "//packages/intl-locale:types",
        "//packages/intl-utils:dist",
        "//packages/intl-utils:types",
        "@npm//@types/fs-extra",
        "@npm//@types/glob",
        "@npm//@types/lodash",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//cldr-core",
        "@npm//cldr-dates-full",
        "@npm//cldr-numbers-full",
        "@npm//fs-extra",
        "@npm//glob",
        "@npm//lodash",
        "@npm//minimist",
    ],
    package = "ts-node",
)

generated_file_test(
    name = "test262-main",
    src = "test262-main.ts",
    generated = ":test262-main-gen",
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
ts_node(
    name = "zic",
    args = [
        "$(execpath scripts/zic.ts)",
        "--dataDir",
        "$(locations iana-data)",
        "--outDir",
        "$(@D)",
    ],
    data = [
        "iana-data",
        "scripts/zic.ts",
        "//:tsconfig.json",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//minimist",
    ],
    output_dir = True,
)

# zones
ts_node(
    name = "zones-gen",
    outs = ["tmp/zones.ts"],
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

generated_file_test(
    name = "zones",
    src = "src/zones.ts",
    generated = ":zones-gen",
)

# "ts-node scripts/link --input iana-data/backward --output src/links.ts"
# links
ts_node(
    name = "links-gen",
    outs = ["tmp/links.ts"],
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

generated_file_test(
    name = "links",
    src = "src/links.ts",
    generated = ":links-gen",
)

# data.ts
ts_node(
    name = "data-gen",
    outs = ["tmp/data.ts"],
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

generated_file_test(
    name = "data",
    src = "src/data.ts",
    generated = ":data-gen",
)

#  "ts-node scripts/process-zdump --polyfill --output dist/add-all-tz.js --input data.zdump"
# data-golden
ts_node(
    name = "data-golden-gen",
    outs = ["tmp/data-golden.ts"],
    args = [
        "$(execpath scripts/process-zdump.ts)",
        "--golden",
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

generated_file_test(
    name = "data-golden",
    src = "src/data-golden.ts",
    generated = ":data-golden-gen",
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

# zdump
# TODO: zdump takes a very long time
# ts_node(
#     name = "zdump-gen",
#     outs = ["tmp/data.zdump"],
#     args = [
#         "$(execpath scripts/zdump.ts)",
#         "--zicDir",
#         "$(locations zic)",
#         "--output",
#         "$@",
#     ],
#     data = [
#         "scripts/zdump.ts",
#         "src/zones.ts",
#         "zic",
#         "//:tsconfig.json",
#         "@npm//@types/fs-extra",
#         "@npm//@types/minimist",
#         "@npm//@types/node",
#         "@npm//fs-extra",
#         "@npm//minimist",
#     ],
# )

# generated_file_test(
#     name = "zdump",
#     src = "data.zdump",
#     generated = ":zdump-gen",
# )

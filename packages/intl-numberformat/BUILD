load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "npm_package_bin", "pkg_npm")
load("@npm//@bazel/rollup:index.bzl", "rollup_bundle")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("@npm//test262-harness:index.bzl", "test262_harness_test")
load("//tools:index.bzl", "rollup_dts")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "intl-numberformat"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "package.json",
    ],
    deps = [
        "%s.d.ts" % PACKAGE_NAME,
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

rollup_dts(
    name = "rollup-dts",
    package_name = PACKAGE_NAME,
    package_json = "package.json",
    types = [":types"],
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
        "scripts/extract-currencies.ts",
        "scripts/extract-numbers.ts",
        "scripts/extract-units.ts",
        "scripts/utils.ts",
        "//:tsconfig.json",
        "//packages/intl-utils:dist",
        "//packages/intl-utils:types",
        "@npm//@types/fs-extra",
        "@npm//@types/glob",
        "@npm//@types/lodash",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//cldr-core",
        "@npm//cldr-numbers-full",
        "@npm//cldr-units-full",
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
        "scripts/extract-currencies.ts",
        "scripts/extract-numbers.ts",
        "scripts/extract-units.ts",
        "scripts/utils.ts",
        "//:tsconfig.json",
        "//packages/intl-utils:dist",
        "//packages/intl-utils:types",
        "@npm//@types/fs-extra",
        "@npm//@types/glob",
        "@npm//@types/lodash",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//cldr-core",
        "@npm//cldr-numbers-full",
        "@npm//cldr-units-full",
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
        "scripts/extract-currencies.ts",
        "scripts/extract-numbers.ts",
        "scripts/extract-units.ts",
        "scripts/utils.ts",
        "//:tsconfig.json",
        "//packages/intl-utils:dist",
        "//packages/intl-utils:types",
        "@npm//@types/fs-extra",
        "@npm//@types/glob",
        "@npm//@types/lodash",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//cldr-core",
        "@npm//cldr-numbers-full",
        "@npm//cldr-units-full",
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

# currency-digits
npm_package_bin(
    name = "currency-digits-gen",
    outs = ["tmp/currency-digits.json"],
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
        "//packages/intl-utils:dist",
        "//packages/intl-utils:types",
        "@npm//@types/fs-extra",
        "@npm//@types/glob",
        "@npm//@types/lodash",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//cldr-core",
        "@npm//cldr-numbers-full",
        "@npm//fs-extra",
        "@npm//glob",
        "@npm//lodash",
        "@npm//minimist",
    ],
    package = "ts-node",
)

generated_file_test(
    name = "currency-digits",
    src = "src/data/currency-digits.json",
    generated = ":currency-digits-gen",
)

# digit-mapping
npm_package_bin(
    name = "digit-mapping-gen",
    outs = ["tmp/digit-mapping.json"],
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
    package = "ts-node",
)

generated_file_test(
    name = "digit-mapping",
    src = "src/data/digit-mapping.json",
    generated = ":digit-mapping-gen",
)

# numbering-systems
npm_package_bin(
    name = "numbering-systems-gen",
    outs = ["tmp/numbering-systems.json"],
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
        "//packages/intl-utils:dist",
        "//packages/intl-utils:types",
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
    package = "ts-node",
)

generated_file_test(
    name = "numbering-systems",
    src = "src/data/numbering-systems.json",
    generated = ":numbering-systems-gen",
)

# units-constants
npm_package_bin(
    name = "units-constants-gen",
    outs = ["tmp/units-constants.json"],
    args = [
        "$(execpath scripts/units-constants.ts)",
        "--out",
        "$@",
    ],
    data = [
        "scripts/units-constants.ts",
        "//:tsconfig.json",
        "//packages/intl-utils:dist",
        "//packages/intl-utils:types",
        "@npm//@types/fs-extra",
        "@npm//@types/minimist",
        "@npm//@types/node",
        "@npm//fs-extra",
        "@npm//minimist",
    ],
    package = "ts-node",
)

generated_file_test(
    name = "units-constants",
    src = "src/data/units-constants.ts",
    generated = ":units-constants-gen",
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
    outdir = "test262",
    source_map = True,
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
        "@npm//rollup-plugin-node-resolve",
        "@npm//rollup-plugin-commonjs",
        "@npm//rollup-plugin-replace",
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

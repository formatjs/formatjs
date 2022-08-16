load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_esbuild//esbuild:defs.bzl", "esbuild")
load("@aspect_rules_js//npm/private:npm_package.bzl", "npm_package")
load("//tools:index.bzl", "check_format", "package_json_test", "ts_compile_node")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "cli-lib"

exports_files(["package.json"])

npm_package(
    name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
        ":dist",
    ],
    package = "@formatjs/%s" % PACKAGE_NAME,
    visibility=["//visibility:public"]
)

SRCS = glob(["src/**/*.ts"]) + [
    "index.ts",
    "main.ts",
    # "package.json",
]

VUE_DEPS = [
    "//:node_modules/@vue/compiler-core",
    "//:node_modules/@babel/types",
    "//:node_modules/@vue/compiler-sfc",
]

SRC_DEPS = [
    "//:node_modules/@types/estree",
    "//:node_modules/@types/fs-extra",
    "//:node_modules/@types/json-stable-stringify",
    "//:node_modules/@types/node",
    "//:node_modules/chalk",
    "//:node_modules/commander",
    "//:node_modules/fast-glob",
    "//:node_modules/fs-extra",
    "//:node_modules/json-stable-stringify",
    "//:node_modules/loud-rejection",
    "//:node_modules/typescript",
    "//:node_modules/@formatjs/icu-messageformat-parser",
    "//:node_modules/@formatjs/ts-transformer",
] + VUE_DEPS

ts_compile_node(
    name = "dist",
    srcs = SRCS,
    package = "@formatjs/%s" % PACKAGE_NAME,
    skip_esm_esnext = False,
    deps = SRC_DEPS,
)

jest_test(
    name = "unit",
    srcs = SRCS + glob([
        "tests/unit/**/*",
    ]),
    deps = [
        "//:node_modules/rimraf",
        "//:node_modules/@types/rimraf",
    ] + SRC_DEPS,
)

jest_test(
    name = "integration-compile",
    size = "large",
    srcs = [
        ":bin/formatjs",
        "tests/integration/formatter.js",
    ] + SRCS + glob(
        [
            "tests/integration/compile/**/*",
        ],
    ),
    flaky = True,
    deps = [
        "//:node_modules/@formatjs/cli-lib",
        "//:node_modules/@types/rimraf",
        "//:node_modules/rimraf",
    ],
)

jest_test(
    name = "integration-compile-folder",
    size = "large",
    srcs = [
        ":bin/formatjs",
    ] + glob(
        [
            "tests/integration/compile_folder/**/*",
        ],
    ),
    flaky = True,
    deps = [
        "//:node_modules/@types/fs-extra",
        "//:node_modules/@types/rimraf",
        "//:node_modules/fs-extra",
        "//:node_modules/rimraf",
        "//:node_modules/fast-glob",
    ],
)

jest_test(
    name = "integration-extract",
    size = "large",
    srcs = [
        ":bin/formatjs",
        "tests/integration/formatter.js",
    ] + glob(
        [
            "tests/integration/extract/**/*",
        ],
    ),
    flaky = True,
    deps = [
        "//:node_modules/@types/fs-extra",
        "//:node_modules/@types/rimraf",
        "//:node_modules/fs-extra",
        "//:node_modules/rimraf",
        "//:node_modules/fast-glob",
    ],
)

jest_test(
    name = "integration-extract-vue",
    size = "large",
    srcs = [
        ":bin/formatjs",
    ] + glob(
        [
            "tests/integration/extract-vue/**/*",
        ],
    ),
    flaky = True,
    deps = VUE_DEPS + [
        "//:node_modules/fast-glob",
        "//:node_modules/@types/node",
    ],
)

write_source_files(
    name = "tsconfig_json",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
)

check_format(
    name = "prettier",
    srcs = glob(
        [
            "**/*",
        ],
        exclude = [
            "CHANGELOG.md",
            # Intentional err
            "tests/integration/extract/typescript/err.tsx",
            "tests/**/__snapshots__/*",
        ],
    ),
)

# copy_to_bin(
#     name="package_json",
#     srcs=["package.json"]
# )

genrule(
    name = "bin",
    srcs = [":formatjs.js"],
    outs = ["bin/formatjs"],
    cmd = "cp $< $@",
)

esbuild(
    name = "formatjs",
    srcs = [":dist-esm-esnext"],
    entry_point = "lib_esnext/main.js",
    external = [
        "@vue/compiler-sfc",
    ],
    platform = "node",
    target = "node16",
    visibility = ["//packages/cli:__pkg__"],
    deps = [
        "//:node_modules/tslib",
    ] + SRC_DEPS,
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

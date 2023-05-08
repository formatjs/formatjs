load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_js//npm/private:npm_package.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:index.bzl", "check_format", "generate_src_file", "package_json_test", "ts_compile")
load("//tools:jest.bzl", "jest_test")

npm_link_all_packages(name = "node_modules")

PACKAGE_NAME = "ecma402-abstract"

npm_package(
    name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
        ":dist",
    ],
    package = "@formatjs/%s" % PACKAGE_NAME,
    visibility = ["//visibility:public"],
)

SRCS = glob(
    [
        "**/*.ts",
        "NumberFormat/*.json",
    ],
    exclude = [
        "scripts/*.ts",
        "tests/*.ts",
    ],
)

SRC_DEPS = [
    ":node_modules/@formatjs/intl-localematcher",
]

ts_compile(
    name = "dist",
    srcs = SRCS,
    package = "@formatjs/%s" % PACKAGE_NAME,
    skip_esm = False,
    deps = SRC_DEPS,
)

jest_test(
    name = "unit_test",
    data = SRCS + SRC_DEPS + glob([
        "tests/**/*.ts",
        "tests/**/*.tsx",
    ]),
    snapshots = glob(["tests/**/*.snap"]),
)

write_source_files(
    name = "tsconfig_json",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
)

# digit-mapping
generate_src_file(
    name = "digit-mapping",
    src = "NumberFormat/digit-mapping.generated.ts",
    data = [
        "//:node_modules/@types/json-stable-stringify",
        "//:node_modules/json-stable-stringify",
    ],
    entry_point = "scripts/digit-mapping.ts",
)

check_format(
    name = "prettier",
    srcs = glob(
        [
            "**/*",
        ],
        exclude = [
            "**/*.generated.*",
            "CHANGELOG.md",
            "NumberFormat/digit-mapping.json",
        ],
    ),
)

generate_src_file(
    name = "regex",
    src = "regex.generated.ts",
    data = [
        "//:node_modules/@types/regenerate",
        "//:node_modules/@unicode/unicode-13.0.0",
        "//:node_modules/regenerate",
    ],
    entry_point = "scripts/regex-gen.ts",
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

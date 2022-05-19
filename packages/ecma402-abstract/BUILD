load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("//tools:index.bzl", "check_format", "generate_src_file", "package_json_test", "ts_compile")
load("//tools:jest.bzl", "jest_test")

exports_files(["package.json"])

PACKAGE_NAME = "ecma402-abstract"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json"
    ],
    deps = [
        ":dist",
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
        "**/*.ts",
        "NumberFormat/*.json",
    ],
    exclude = [
        "scripts/*.ts",
        "tests/*.ts",
    ],
)

SRC_DEPS = [
    "//packages/intl-localematcher:dist",
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
    srcs = SRCS + glob([
        "tests/**/*.ts",
        "tests/**/*.tsx",
        "tests/**/*.snap",
    ]),
    deps = SRC_DEPS + [
        "//packages/intl-localematcher:types",
    ],
)

generated_file_test(
    name = "tsconfig_json",
    src = "tsconfig.json",
    generated = "//tools:tsconfig.golden.json",
)

# digit-mapping
generate_src_file(
    name = "digit-mapping",
    src = "NumberFormat/digit-mapping.generated.ts",
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
        "scripts/global.ts",
        "@npm//@unicode/unicode-13.0.0",
        "@npm//regenerate",
    ],
    entry_point = "scripts/regex-gen.ts",
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

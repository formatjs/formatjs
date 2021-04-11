load("@build_bazel_rules_nodejs//:index.bzl", "pkg_npm")
load("//tools:index.bzl", "check_format", "ts_compile")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "vue-intl"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
    ],
    deps = [":dist"],
)

alias(
    name = "publish",
    actual = "%s.publish" % PACKAGE_NAME,
)

alias(
    name = "pack",
    actual = "%s.pack" % PACKAGE_NAME,
)

SRCS = glob([
    "*.ts",
])

SRC_DEPS = [
    "@npm//typescript",
    "@npm//vue",
    "//packages/intl:dist",
    "//packages/icu-messageformat-parser:dist",
]

ts_compile(
    name = "dist",
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = SRCS,
    deps = SRC_DEPS,
)

jest_test(
    name = "unit",
    srcs = SRCS + ["tests/index.test.ts"] + glob([
        "tests/__snapshots__/*.snap",
    ]),
    additional_args = [
        "--env",
        "jsdom",
    ],
    deps = SRC_DEPS + [
        "@npm//@vue/test-utils",
        "//packages/intl:types",
        "//packages/icu-messageformat-parser:types",
    ],
)

check_format(
    name = "prettier",
    srcs = glob(
        [
            "**/*",
        ],
        exclude = [
            "CHANGELOG.md",
            "tests/__snapshots__/*",
        ],
    ),
)

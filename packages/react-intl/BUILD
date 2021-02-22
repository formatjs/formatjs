load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("//tools:index.bzl", "prettier_check", "ts_compile")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "react-intl"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
    ],
    deps = [
        # "%s.iife.js" % PACKAGE_NAME,
        # "%s-no-parser.iife.js" % PACKAGE_NAME,
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

SRCS = glob(["src/**/*.ts*"]) + ["index.ts"]

SRC_DEPS = [
    "@npm//react",
    "@npm//@types/react",
    "//packages/intl:dist",
    "//packages/intl-listformat:dist",
    "//packages/intl-displaynames:dist",
    "//packages/intl-relativetimeformat:dist",
    "//packages/intl-messageformat:dist",
    "@npm//hoist-non-react-statics",
    "@npm//@types/hoist-non-react-statics",
    "@npm//shallow-equal",
    "@npm//fast-memoize",
]

TESTS = glob([
    "tests/unit/**/*.ts*",
    "tests/unit/**/*.snap",
])

TEST_DEPS = SRC_DEPS + [
    "//packages/intl-numberformat:dist",
    "//packages/intl-listformat:types",
    "//packages/intl-displaynames:types",
    "//packages/ecma402-abstract:types",
    "//packages/intl:types",
    "//packages/intl-messageformat:types",
    "@npm//@testing-library/react",
    "@npm//@testing-library/jest-dom",
    "@npm//react-dom",
]

ts_compile(
    name = "dist",
    package_name = PACKAGE_NAME,
    srcs = SRCS,
    skip_esm = False,
    deps = SRC_DEPS,
)

jest_test(
    name = "unit",
    srcs = SRCS + TESTS + [
        "tests/setup.js",
        "//packages/intl-numberformat:locale-data",
        "//packages/intl-displaynames:polyfill-locales.js",
    ],
    jest_config = "jest.config.js",
    deps = TEST_DEPS,
)

jest_test(
    name = "functional",
    srcs = glob(["tests/functional/**/*.ts*"]) + [
        "tests/setup.js",
        # "%s.iife.js" % PACKAGE_NAME,
        # "%s-no-parser.iife.js" % PACKAGE_NAME,
        "package.json",
        "//packages/intl-numberformat:locale-data",
        "//packages/intl-displaynames:polyfill-locales.js",
    ],
    jest_config = "jest.config.js",
    deps = TEST_DEPS + [":dist"],
)

# esbuild(
#     name = "%s.iife" % PACKAGE_NAME,
#     args = [
#         "--define:process.env.NODE_ENV=\"production\"",
#         "--global-name=ReactIntl",
#     ],
#     entry_point = "lib/index.js",
#     target = "es5",
#     deps = [
#         ":dist-esm",
#     ] + SRC_DEPS,
# )

# esbuild(
#     name = "%s-no-parser.iife" % PACKAGE_NAME,
#     args = [
#         "--global-name=ReactIntl",
#         "--define:process.env.NODE_ENV=\"production\"",
#     ],
#     entry_point = "lib/index.js",
#     target = "es5",
#     deps = [
#         ":dist-esm",
#     ] + SRC_DEPS,
# )

generated_file_test(
    name = "tsconfig_json",
    src = "tsconfig.json",
    generated = "//tools:tsconfig.golden.json",
)

prettier_check(
    name = "prettier",
    srcs = glob(
        [
            "**/*",
        ],
        exclude = [
            "BUILD",
            "CHANGELOG.md",
            "tests/unit/components/__snapshots__/*",
        ],
    ),
)

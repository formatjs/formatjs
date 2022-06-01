load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "pkg_npm")
load("@npm//@bazel/esbuild:index.bzl", "esbuild")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("@npm//test262-harness:index.bzl", "test262_harness_test")
load("//tools:index.bzl", "check_format", "package_json_test", "ts_compile")
load("//tools:jest.bzl", "jest_test")

exports_files(["package.json"])

PACKAGE_NAME = "intl-locale"

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
    ],
    deps = [
        ":dist",
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

SRCS = glob(["*.ts"])

SRC_DEPS = [
    "//packages/ecma402-abstract:dist",
    "//packages/intl-getcanonicallocales:dist",
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
    deps = [
        "//packages/intl-getcanonicallocales:types",
        "//packages/ecma402-abstract:types",
    ] + SRC_DEPS,
)

# Test262
ts_project(
    name = "test262-main-bundle",
    srcs = SRCS,
    declaration = True,
    declaration_map = True,
    extends = "//:tsconfig.json",
    out_dir = "test262",
    resolve_json_module = True,
    tsconfig = "//:tsconfig.es6.json",
    deps = SRC_DEPS,
)

esbuild(
    name = "test262-polyfill",
    entry_point = "test262/polyfill-force.js",
    target = "es6",
    deps = [
        ":test262-main-bundle",
    ] + SRC_DEPS,
)

test262_harness_test(
    name = "test262",
    size = "large",
    data = [
        "test262-polyfill.js",
        "@com_github_tc39_test262//:test262-harness",
        "@com_github_tc39_test262//:test262-locale",
    ],
    templated_args = [
        "--reporter-keys",
        "file,attrs,result",
        "--errorForFailures",
        "--timeout",
        "30000",
        "--prelude",
        "$(rootpath test262-polyfill.js)",
        "--test262Dir",
        "../com_github_tc39_test262",
        "../com_github_tc39_test262/test/intl402/Locale/**/*.js",
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
            "CHANGELOG.md",
        ],
    ),
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

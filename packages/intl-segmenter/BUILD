load("@aspect_bazel_lib//lib:copy_file.bzl", "copy_file")
load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_esbuild//esbuild:defs.bzl", "esbuild")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("@npm//:test262-harness/package_json.bzl", test262_harness_bin = "bin")
load("//tools:index.bzl", "generate_src_file", "ts_compile")
load("//tools:vitest.bzl", "vitest")
load(":index.bzl", "unicode_file_name")

npm_link_all_packages()

PACKAGE_NAME = "intl-segmenter"

npm_package(
    name = "pkg",
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
        ":dist",
        # polyfill-library uses this
        "polyfill.iife.js",
    ],
    package = "@formatjs/%s" % PACKAGE_NAME,
    visibility = ["//visibility:public"],
)

SRC_DEPS = [
    ":node_modules/@formatjs/ecma402-abstract",
    ":node_modules/@formatjs/intl-localematcher",
]

TEST_UNICODE_FILES = [
    "@GraphemeBreakTest//file",
    "@WordBreakTest//file",
    "@SentenceBreakTest//file",
]

TEST_DEPS = SRC_DEPS + [
    "//:node_modules/@types/node",
    "//:node_modules/@bazel/runfiles",
] + TEST_UNICODE_FILES

SRCS = glob(
    [
        "src/**/*.ts",
        "*.ts",
    ],
    exclude = [
        #for development only
        "debug.ts",
        "benchmark.ts",
        "tests/**/*",
    ],
)

TESTS = glob([
    "tests/*.test.ts",
])

ts_compile(
    name = "dist",
    srcs = [":srcs"],
    skip_esm = False,
    deps = SRC_DEPS,
)

vitest(
    name = "unit_test",
    srcs = SRCS + TESTS + ["tests/test-utils.ts"],
    no_copy_to_bin = [
        "@GraphemeBreakTest//file",
        "@WordBreakTest//file",
        "@SentenceBreakTest//file",
    ],
    deps = TEST_DEPS,
)

generate_src_file(
    name = "test262-main",
    src = "test262-main.ts",
    entry_point = "scripts/test262-main-gen.ts",
    visibility = [
        "//:__pkg__",
    ],
)

# Test262
esbuild(
    name = "test262-polyfill",
    srcs = [":srcs"],
    entry_point = "test262-main.ts",
    target = "es6",
    deps = SRC_DEPS,
)

test262_harness_bin.test262_harness_test(
    name = "test262",
    args = [
        "--reporter-keys",
        "file,attrs,result",
        "--errorForFailures",
        "--timeout",
        "30000",
        "--prelude",
        "$(rootpath test262-polyfill.js)",
        "--test262Dir",
        "../+_repo_rules+com_github_tc39_test262",
        "../+_repo_rules+com_github_tc39_test262/test/intl402/Segmenter/**/*.js",
    ],
    data = [
        "test262-polyfill.js",
        "@com_github_tc39_test262//:test262-harness-copy",
        "@com_github_tc39_test262//:test262-segmenter-copy",
    ],
    # TODO: fix
    tags = ["manual"],
)

write_source_files(
    name = "generated-files",
    files = {"tsconfig.json": "//tools:tsconfig.golden.json"},
    visibility = ["//:__pkg__"],
)

esbuild(
    name = "polyfill.iife",
    srcs = [":srcs"],
    entry_point = "polyfill.ts",
    target = "es6",
    deps = [
        "//:node_modules/tslib",
    ] + SRC_DEPS,
)

UNICODE_FILES = [
    "@DerivedCombiningClass//file",
    "@DerivedEastAsianWidth//file",
    "@GraphemeBreakProperty//file",
    "@IndicSyllabicCategory//file",
    "@SentenceBreakProperty//file",
    "@WordBreakProperty//file",
]

[
    copy_file(
        # Name is something like DerivedCombiningClass
        name = unicode_file_name(f),
        src = f,
        out = "%s.txt" % unicode_file_name(f),
    )
    for f in UNICODE_FILES
]

# Segmentation UCDs
generate_src_file(
    name = "generate-cldr-segmentation-rules",
    src = "src/cldr-segmentation-rules.generated.ts",
    args = ["--unicodeFiles=$(rootpath :%s)" % unicode_file_name(f) for f in UNICODE_FILES],
    data =
        [":%s" % unicode_file_name(f) for f in UNICODE_FILES] + [
            "//:node_modules/@types/regenerate",
            "//:node_modules/cldr-segments-full",
            "//:node_modules/json-stable-stringify",
            "//:node_modules/regexpu-core",
        ],
    entry_point = "scripts/generate-cldr-segmentation-rules.ts",
)

copy_to_bin(
    name = "srcs",
    srcs = SRCS,
)

load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_esbuild//esbuild:defs.bzl", "esbuild")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("@npm//:test262-harness/package_json.bzl", test262_harness_bin = "bin")
load("//tools:index.bzl", "generate_src_file", "package_json_test", "ts_compile", "ts_script")
load("//tools:vitest.bzl", "vitest")

npm_link_all_packages()

ALL_LOCALES = [
    "af",
    "ak",
    "am",
    "an",
    "ar",
    "ars",
    "as",
    "asa",
    "ast",
    "az",
    "bal",
    "be",
    "bem",
    "bez",
    "bg",
    "bho",
    "bm",
    "bn",
    "bo",
    "br",
    "brx",
    "bs",
    "ca",
    "ce",
    "ceb",
    "cgg",
    "chr",
    "ckb",
    "cs",
    "cy",
    "da",
    "de",
    "doi",
    "dsb",
    "dv",
    "dz",
    "ee",
    "el",
    "en",
    "eo",
    "es",
    "et",
    "eu",
    "fa",
    "ff",
    "fi",
    "fil",
    "fo",
    "fr",
    "fur",
    "fy",
    "ga",
    "gd",
    "gl",
    "gsw",
    "gu",
    "guw",
    "gv",
    "ha",
    "haw",
    "he",
    "hi",
    "hnj",
    "hr",
    "hsb",
    "hu",
    "hy",
    "ia",
    "id",
    "ig",
    "ii",
    "io",
    "is",
    "it",
    "iu",
    "ja",
    "jbo",
    "jgo",
    "jmc",
    "jv",
    "jw",
    "ka",
    "kab",
    "kaj",
    "kcg",
    "kde",
    "kea",
    "kk",
    "kkj",
    "kl",
    "km",
    "kn",
    "ko",
    "ks",
    "ksb",
    "ksh",
    "ku",
    "kw",
    "ky",
    "lag",
    "lb",
    "lg",
    "lij",
    "lkt",
    "ln",
    "lo",
    "lt",
    "lv",
    "mas",
    "mg",
    "mgo",
    "mk",
    "ml",
    "mn",
    "mo",
    "mr",
    "ms",
    "mt",
    "my",
    "nah",
    "naq",
    "nb",
    "nd",
    "ne",
    "nl",
    "nn",
    "nnh",
    "no",
    "nqo",
    "nr",
    "nso",
    "ny",
    "nyn",
    "om",
    "or",
    "os",
    "osa",
    "pa",
    "pap",
    "pcm",
    "pl",
    "prg",
    "ps",
    "pt",
    "pt-PT",
    "rm",
    "ro",
    "rof",
    "ru",
    "rwk",
    "sah",
    "saq",
    "sat",
    "sc",
    "scn",
    "sd",
    "sdh",
    "se",
    "seh",
    "ses",
    "sg",
    "sh",
    "shi",
    "si",
    "sk",
    "sl",
    "sma",
    "smi",
    "smj",
    "smn",
    "sms",
    "sn",
    "so",
    "sq",
    "sr",
    "ss",
    "ssy",
    "st",
    "su",
    "sv",
    "sw",
    "syr",
    "ta",
    "te",
    "teo",
    "th",
    "ti",
    "tig",
    "tk",
    "tl",
    "tn",
    "to",
    "tpi",
    "tr",
    "ts",
    "tzm",
    "ug",
    "uk",
    "und",
    "ur",
    "uz",
    "ve",
    "vi",
    "vo",
    "vun",
    "wa",
    "wae",
    "wo",
    "xh",
    "xog",
    "yi",
    "yo",
    "yue",
    "zh",
    "zu",
]

PACKAGE_NAME = "intl-pluralrules"

TEST_LOCALES = [
    "en",
    "zh",
    "fr",
]

TEST_LOCALE_DATA = ["tests/locale-data/%s.ts" % locale for locale in TEST_LOCALES]

npm_package(
    name = "pkg",
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
        ":dist",
        ":locale-data",
        # polyfill-library uses this
        "polyfill.iife.js",
    ],
    package = "@formatjs/%s" % PACKAGE_NAME,
    visibility = ["//visibility:public"],
)

SRCS = glob(
    [
        "*.ts",
        "abstract/*.ts",
    ],
    exclude = ["test*.*"],
)

TESTS = glob([
    "tests/*.test.ts",
])

SRC_DEPS = [
    ":node_modules/@formatjs/ecma402-abstract",
    ":node_modules/@formatjs/intl-localematcher",
    "//:node_modules/decimal.js",
]

ts_compile(
    name = "dist",
    srcs = [":srcs"],
    skip_esm = False,
    deps = SRC_DEPS,
)

vitest(
    name = "unit_test",
    srcs = SRCS + TESTS + TEST_LOCALE_DATA,
    skip_typecheck = True,
    deps = SRC_DEPS + [
        ":node_modules/@formatjs/intl-getcanonicallocales",
        ":node_modules/@formatjs/intl-locale",
    ],
)

# CLDR
CLDR_RAW_FILES = ["cldr-raw/%s.js" % locale for locale in ALL_LOCALES]

ts_script(
    name = "cldr-raw",
    srcs = [
        ":node_modules/@formatjs/ecma402-abstract",
        "//:node_modules/@types/serialize-javascript",
        "//:node_modules/cldr-core",
        "//:node_modules/fs-extra",
        "//:node_modules/json-stable-stringify",
        "//:node_modules/make-plural-compiler",
        "//:node_modules/minimist",
        "//:node_modules/serialize-javascript",
    ],
    outs = CLDR_RAW_FILES,
    args = [
        "--outDir",
        "cldr-raw",
    ],
    chdir = package_name(),
    entry_point = "scripts/cldr-raw.ts",
)

genrule(
    name = "supported-locales-gen",
    srcs = [],
    outs = ["supported-locales.tmp"],
    cmd = "echo 'export const supportedLocales: string[] = %s' > $@" % ALL_LOCALES,
)

ts_script(
    name = "locale-data",
    srcs = CLDR_RAW_FILES + [
        "//:node_modules/fs-extra",
        "//:node_modules/minimist",
    ],
    outs = ["locale-data/%s.js" % locale for locale in ALL_LOCALES] + ["locale-data/%s.d.ts" % locale for locale in ALL_LOCALES],
    args = [
        "--cldrFile %s" % f
        for f in CLDR_RAW_FILES
    ] + [
        "--outDir",
        "locale-data",
    ],
    chdir = package_name(),
    entry_point = "scripts/cldr.ts",
    visibility = ["//visibility:public"],
)

[genrule(
    name = "tests-locale-data-%s" % locale,
    srcs = ["cldr-raw/%s.js" % locale],
    outs = ["tests-locale-data/%s.ts" % locale],
    cmd = "printf \"%s %s\n\" \"/* @generated */\n// prettier-ignore\n// @ts-nocheck\nexport default\" \"$$(cat $<)\" > $@",
) for locale in TEST_LOCALES]

generate_src_file(
    name = "test262-main",
    src = "test262-main.ts",
    args = [
        "--cldrFile %s/%s" % (
            package_name(),
            f,
        )
        for f in CLDR_RAW_FILES
    ],
    data = [":cldr-raw"],
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
    size = "small",
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
        "../+_repo_rules+com_github_tc39_test262/test/intl402/PluralRules/**/*.js",
    ],
    data = [
        "test262-polyfill.js",
        "@com_github_tc39_test262//:test262-harness-copy",
        "@com_github_tc39_test262//:test262-pluralrules-copy",
    ],
)

# bundle_karma_tests(
#     name = "bundled-karma-tests",
#     srcs = [":srcs"],
#     data = TEST_LOCALE_DATA,
#     esbuild_deps = [
#         ":node_modules/@formatjs/intl-getcanonicallocales",
#         ":node_modules/@formatjs/intl-locale",
#     ],
#     tests = TESTS,
#     deps = SRC_DEPS + [
#         "//:node_modules/@types/node",
#     ],
# )

write_source_files(
    name = "generated-files",
    files = {
        "supported-locales.generated.ts": ":supported-locales-gen",
        "tsconfig.json": "//tools:tsconfig.golden.json",
    },
    visibility = ["//:__pkg__"],
)

write_source_files(
    name = "generated-test-files",
    files = {
        "tests/locale-data/%s.ts" % k: ":tests-locale-data/%s.ts" % k
        for k in TEST_LOCALES
    },
    visibility = ["//:__pkg__"],
)

esbuild(
    name = "polyfill.iife",
    srcs = [":srcs"],
    entry_point = "polyfill.ts",
    target = "es6",
    # TODO: fix this and set it back to es5
    deps = [
        "//:node_modules/tslib",
    ] + SRC_DEPS,
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

copy_to_bin(
    name = "srcs",
    srcs = SRCS,
)

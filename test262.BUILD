load("@bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")

# Include every upstream case. Failures belong in reviewed baselines, not globs.

filegroup(
    name = "test262-collator",
    srcs = glob(["test/intl402/Collator/**/*.js"]),
    visibility = ["@//packages/intl-collator:__pkg__"],
)
copy_to_bin(
    name = "test262-collator-copy",
    srcs = [":test262-collator"],
    visibility = ["@//tools/test262:__pkg__", "@//packages/intl-collator:__pkg__"],
)

filegroup(
    name = "test262-datetimeformat",
    srcs = glob(["test/intl402/DateTimeFormat/**/*.js"]),
    visibility = ["@//packages/intl-datetimeformat:__pkg__"],
)
copy_to_bin(
    name = "test262-datetimeformat-copy",
    srcs = [":test262-datetimeformat"],
    visibility = ["@//tools/test262:__pkg__", "@//packages/intl-datetimeformat:__pkg__"],
)

filegroup(
    name = "test262-displaynames",
    srcs = glob(["test/intl402/DisplayNames/**/*.js"]),
    visibility = ["@//packages/intl-displaynames:__pkg__"],
)
copy_to_bin(
    name = "test262-displaynames-copy",
    srcs = [":test262-displaynames"],
    visibility = ["@//tools/test262:__pkg__", "@//packages/intl-displaynames:__pkg__"],
)

filegroup(
    name = "test262-durationformat",
    srcs = glob(["test/intl402/DurationFormat/**/*.js"]),
    visibility = ["@//packages/intl-durationformat:__pkg__"],
)
copy_to_bin(
    name = "test262-durationformat-copy",
    srcs = [":test262-durationformat"],
    visibility = ["@//tools/test262:__pkg__", "@//packages/intl-durationformat:__pkg__"],
)

filegroup(
    name = "test262-getcanonicallocales",
    srcs = glob(["test/intl402/Intl/getCanonicalLocales/**/*.js"]),
    visibility = ["@//packages/intl-getcanonicallocales:__pkg__"],
)
copy_to_bin(
    name = "test262-getcanonicallocales-copy",
    srcs = [":test262-getcanonicallocales"],
    visibility = ["@//tools/test262:__pkg__", "@//packages/intl-getcanonicallocales:__pkg__"],
)

filegroup(
    name = "test262-listformat",
    srcs = glob(["test/intl402/ListFormat/**/*.js"]),
    visibility = ["@//packages/intl-listformat:__pkg__"],
)
copy_to_bin(
    name = "test262-listformat-copy",
    srcs = [":test262-listformat"],
    visibility = ["@//tools/test262:__pkg__", "@//packages/intl-listformat:__pkg__"],
)

filegroup(
    name = "test262-locale",
    srcs = glob(["test/intl402/Locale/**/*.js"]),
    visibility = ["@//packages/intl-locale:__pkg__"],
)
copy_to_bin(
    name = "test262-locale-copy",
    srcs = [":test262-locale"],
    visibility = ["@//tools/test262:__pkg__", "@//packages/intl-locale:__pkg__"],
)

filegroup(
    name = "test262-numberformat",
    srcs = glob(["test/intl402/NumberFormat/**/*.js"]),
    visibility = ["@//packages/intl-numberformat:__pkg__"],
)
copy_to_bin(
    name = "test262-numberformat-copy",
    srcs = [":test262-numberformat"],
    visibility = ["@//tools/test262:__pkg__", "@//packages/intl-numberformat:__pkg__"],
)

filegroup(
    name = "test262-pluralrules",
    srcs = glob(["test/intl402/PluralRules/**/*.js"]),
    visibility = ["@//packages/intl-pluralrules:__pkg__"],
)
copy_to_bin(
    name = "test262-pluralrules-copy",
    srcs = [":test262-pluralrules"],
    visibility = ["@//tools/test262:__pkg__", "@//packages/intl-pluralrules:__pkg__"],
)

filegroup(
    name = "test262-relativetimeformat",
    srcs = glob(["test/intl402/RelativeTimeFormat/**/*.js"]),
    visibility = ["@//packages/intl-relativetimeformat:__pkg__"],
)
copy_to_bin(
    name = "test262-relativetimeformat-copy",
    srcs = [":test262-relativetimeformat"],
    visibility = ["@//tools/test262:__pkg__", "@//packages/intl-relativetimeformat:__pkg__"],
)

filegroup(
    name = "test262-segmenter",
    srcs = glob(["test/intl402/Segmenter/**/*.js"]),
    visibility = ["@//packages/intl-segmenter:__pkg__"],
)
copy_to_bin(
    name = "test262-segmenter-copy",
    srcs = [":test262-segmenter"],
    visibility = ["@//tools/test262:__pkg__", "@//packages/intl-segmenter:__pkg__"],
)

filegroup(
    name = "test262-supportedvaluesof",
    srcs = glob(["test/intl402/Intl/supportedValuesOf/**/*.js"]),
    visibility = ["@//packages/intl-supportedvaluesof:__pkg__"],
)
copy_to_bin(
    name = "test262-supportedvaluesof-copy",
    srcs = [":test262-supportedvaluesof"],
    visibility = ["@//tools/test262:__pkg__", "@//packages/intl-supportedvaluesof:__pkg__"],
)

filegroup(
    name = "test262-harness",
    srcs = glob(["harness/**/*.js"]) + ["package.json"],
)
copy_to_bin(
    name = "test262-harness-copy",
    srcs = [":test262-harness"],
    visibility = ["//visibility:public"],
)

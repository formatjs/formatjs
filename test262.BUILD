load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")

filegroup(
    name = "test262-pluralrules",
    srcs = glob(
        ["test/intl402/PluralRules/**/*.js"],
        # TODO: support selectRange
        exclude = [
            "**/proto-from-ctor-realm.js",
            "**/selectRange/**",
        ],
    ),
    visibility = ["@//packages/intl-pluralrules:__pkg__"],
)

filegroup(
    name = "test262-numberformat",
    srcs = glob(
        ["test/intl402/NumberFormat/**/*.js"],
        exclude = [
            "**/builtin.js",  # Built-in functions cannot have `prototype` property.
            "**/constructor-order.js",  # buggy test case. The spec states that impl should throw RangeError.
            "**/constructor-locales-hasproperty.js",  # This checks that we only iterate once...
            "**/constructor-unit.js",  # buggy test case. The spec states that impl should throw RangeError.
            "**/currency-digits.js",  # AFN's currency digits differ from CLDR data.
            "**/legacy-regexp-statics-not-modified.js",  # TODO
            "**/proto-from-ctor-realm.js",  # Bc of Realm support
            "**/constructor-locales-get-tostring.js",  # Bc our Intl.getCanonicalLocales isn't really spec-compliant
            "**/taint-Object-prototype.js",  # Bc our Intl.getCanonicalLocales isn't really spec-compliant
            "**/numbering-systems.js",  # See https://github.com/tc39/ecma402/issues/479
            "**/dft-currency-mnfd-range-check-mxfd.js",  # TODO
            "**/intl-legacy-constructed-symbol-on-unwrap.js",
        ],
    ),
    visibility = ["@//packages/intl-numberformat:__pkg__"],
)

filegroup(
    name = "test262-listformat",
    srcs = glob(
        ["test/intl402/ListFormat/**/*.js"],
        exclude = [
            "**/options-undefined.js",  # TODO
            "**/options-toobject-prototype.js",  # TODO
            "**/locales-valid.js",  # f7e8dba39b1143b45c37ee137e406889b56bc335 added grandfathered locale which we
            "**/proto-from-ctor-realm.js",  # Bc of Realm support
        ],
    ),
    visibility = ["@//packages/intl-listformat:__pkg__"],
)

filegroup(
    name = "test262-locale",
    srcs = glob(
        ["test/intl402/Locale/**/*.js"],
        exclude = [
            "**/branding.js",  # TODO: lazy
            "**/*-grandfathered.js",  # TODO: we don't care about grandfathered tbh
            "**/proto-from-ctor-realm.js",  # TODO: not sure how to deal w/ Realm
            "**/canonicalize-locale-list-take-locale.js",
            "**/constructor-apply-options-canonicalizes-twice.js",
            "**/constructor-getter-order.js",
            "**/constructor-non-iana-canon.js",
            "**/constructor-options-canonicalized.js",
            "**/constructor-options-region-valid.js",
            "**/constructor-tag-tostring.js",
            "**/removing-likely-subtags-first-adds-likely-subtags.js",
            "**/likely-subtags.js",
            "**/constructor-tag.js",
        ],
    ),
    visibility = ["@//packages/intl-locale:__pkg__"],
)

filegroup(
    name = "test262-datetimeformat",
    srcs = glob(
        ["test/intl402/DateTimeFormat/**/*.js"],
        exclude = [
            "**/formatRange.js",  # See https://github.com/tc39/ecma402/pull/438
        ],
    ),
    visibility = ["@//packages/intl-datetimeformat:__pkg__"],
)

filegroup(
    name = "test262-relativetimeformat",
    srcs = glob(
        ["test/intl402/RelativeTimeFormat/**/*.js"],
        exclude = [
            "**/options-undefined.js",  # TODO
            "**/options-proto.js",  # TODO
            "**/options-toobject-prototype.js",  # TODO
            "**/locales-valid.js",  # f7e8dba39b1143b45c37ee137e406889b56bc335 added grandfathered locale which we
            "**/proto-from-ctor-realm.js",  # Bc of Realm support
            # TODO
            "**/pl-pl-style-long.js",
            "**/pl-pl-style-narrow.js",
            "**/pl-pl-style-short.js",
        ],
    ),
    visibility = ["@//packages/intl-relativetimeformat:__pkg__"],
)

filegroup(
    name = "test262-displaynames",
    srcs = glob(
        ["test/intl402/DisplayNames/**/*.js"],
        exclude = [
            "**/return-object.js",  # We need to fix default content support.
            "**/proto-from-ctor-realm.js",  # Bc of Realm support
            "**/options-type-invalid-throws.js",  # TODO
        ],
    ),
    visibility = ["@//packages/intl-displaynames:__pkg__"],
)

filegroup(
    name = "test262-segmenter",
    srcs = glob(
        ["test/intl402/Segmenter/**/*.js"],
        exclude = [
            #"**/return-object.js",  # We need to fix default content support.
            "**/options-undefined.js",  # TODO
            "**/proto-from-ctor-realm.js",  # Bc of Realm support
            #"**/options-type-invalid-throws.js",  # TODO
        ],
    ),
    visibility = ["@//packages/intl-segmenter:__pkg__"],
)

filegroup(
    name = "test262-harness",
    srcs = glob(
        [
            "harness/**/*.js",
        ] + ["package.json"],
    ),
)

copy_to_bin(
    name = "test262-harness-copy",
    srcs = [":test262-harness"],
    visibility = ["//visibility:public"],
)

copy_to_bin(
    name = "test262-pluralrules-copy",
    srcs = [":test262-pluralrules"],
    visibility = ["@//packages/intl-pluralrules:__pkg__"],
)

copy_to_bin(
    name = "test262-displaynames-copy",
    srcs = [":test262-displaynames"],
    visibility = ["@//packages/intl-displaynames:__pkg__"],
)

copy_to_bin(
    name = "test262-segmenter-copy",
    srcs = [":test262-segmenter"],
    visibility = ["@//packages/intl-segmenter:__pkg__"],
)

copy_to_bin(
    name = "test262-listformat-copy",
    srcs = [":test262-listformat"],
    visibility = ["@//packages/intl-listformat:__pkg__"],
)

copy_to_bin(
    name = "test262-numberformat-copy",
    srcs = [":test262-numberformat"],
    visibility = ["@//packages/intl-numberformat:__pkg__"],
)

copy_to_bin(
    name = "test262-datetimeformat-copy",
    srcs = [":test262-datetimeformat"],
    visibility = ["@//packages/intl-datetimeformat:__pkg__"],
)

copy_to_bin(
    name = "test262-relativetimeformat-copy",
    srcs = [":test262-relativetimeformat"],
    visibility = ["@//packages/intl-relativetimeformat:__pkg__"],
)

copy_to_bin(
    name = "test262-locale-copy",
    srcs = [":test262-locale"],
    visibility = ["@//packages/intl-locale:__pkg__"],
)

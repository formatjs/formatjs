load("@build_bazel_rules_nodejs//:index.bzl", "copy_to_bin")
load("@npm//karma:index.bzl", "karma_test")
# Add rules here to build your software
# See https://docs.bazel.build/versions/master/build-ref.html#BUILD_files

# Allow any ts_library rules in this workspace to reference the config
# Note: if you move the tsconfig.json file to a subdirectory, you can add an alias() here instead
#   so that ts_library rules still use it by default.
#   See https://www.npmjs.com/package/@bazel/typescript#installation
exports_files(
    [
        "tsconfig.json",
        "tsconfig.esm.json",
        "tsconfig.node.json",
        "tsconfig.es6.json",
        "api-extractor.json",
        "rollup.config.js",
        "karma.conf.js",
        "karma.conf-ci.js",
        "jest.config.js",
    ],
    visibility = ["//:__subpackages__"],
)

copy_to_bin(
    name = "setup-api-extractor",
    srcs = [
        "api-extractor.json",
        "tsconfig.json",
    ],
    visibility = ["//:__subpackages__"],
)

filegroup(
    name = "test262-pluralrules",
    srcs = glob(
        ["test262/test/intl402/PluralRules/**/*.js"],
        exclude = ["**/proto-from-ctor-realm.js"],
    ),
    visibility = ["//packages/intl-pluralrules:__subpackages__"],
)

filegroup(
    name = "test262-numberformat",
    srcs = glob(
        ["test262/test/intl402/NumberFormat/**/*.js"],
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
            "**/numbering-systems.js",  # See https://github.com/tc39/ecma402/pull/438
        ],
    ),
    visibility = ["//packages/intl-numberformat:__subpackages__"],
)

filegroup(
    name = "test262-listformat",
    srcs = glob(
        ["test262/test/intl402/ListFormat/**/*.js"],
        exclude = [
            "**/options-undefined.js",  # TODO
            "**/options-toobject-prototype.js",  # TODO
            "**/locales-valid.js",  # f7e8dba39b1143b45c37ee137e406889b56bc335 added grandfathered locale which we
            "**/proto-from-ctor-realm.js",  # Bc of Realm support
        ],
    ),
    visibility = ["//packages/intl-listformat:__subpackages__"],
)

filegroup(
    name = "test262-datetimeformat",
    srcs = glob(
        ["test262/test/intl402/DateTimeFormat/**/*.js"],
        exclude = [
            "**/formatRange.js",  # See https://github.com/tc39/ecma402/pull/438
        ],
    ),
    visibility = ["//packages/intl-datetimeformat:__subpackages__"],
)

filegroup(
    name = "test262-relativetimeformat",
    srcs = glob(
        ["test262/test/intl402/RelativeTimeFormat/**/*.js"],
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
    visibility = ["//packages/intl-relativetimeformat:__subpackages__"],
)

filegroup(
    name = "test262-displaynames",
    srcs = glob(
        ["test262/test/intl402/DisplayNames/**/*.js"],
        exclude = [
            "**/return-object.js",  # We need to fix default content support.
            "**/proto-from-ctor-realm.js",  # Bc of Realm support
        ],
    ),
    visibility = ["//packages/intl-displaynames:__subpackages__"],
)

filegroup(
    name = "test262-all",
    srcs = glob([
        "test262/**/*.js",
        "test262/**/*.json",
    ]) + ["test262/README.md"],
    visibility = ["//visibility:public"],
)

# We run this centrally so it doesn't spawn
# multiple browser sessions which overwhelms SauceLabs
KARMA_TESTS = [
    "//packages/intl-displaynames:bundled-karma-tests",
    "//packages/intl-getcanonicallocales:bundled-karma-tests",
    "//packages/intl-listformat:bundled-karma-tests",
    "//packages/intl-pluralrules:bundled-karma-tests",
    "//packages/intl-relativetimeformat:bundled-karma-tests",
]

karma_test(
    name = "karma",
    data = [
        "//:karma.conf.js",
        "@npm//karma-jasmine",
        "@npm//karma-chrome-launcher",
        "@npm//karma-jasmine-matchers",
    ] + KARMA_TESTS,
    templated_args = [
        "start",
        "$(rootpath //:karma.conf.js)",
    ] + ["$$(rlocation $(locations %s))" % f for f in KARMA_TESTS],
)

karma_test(
    name = "karma-ci",
    configuration_env_vars = [
        "SAUCE_USERNAME",
        "SAUCE_ACCESS_KEY",
    ],
    data = [
        "//:karma.conf-ci.js",
        "@npm//karma-jasmine",
        "@npm//karma-sauce-launcher",
        "@npm//karma-jasmine-matchers",
    ] + KARMA_TESTS,
    templated_args = [
        "start",
        "$(rootpath //:karma.conf-ci.js)",
    ] + ["$$(rlocation $(locations %s))" % f for f in KARMA_TESTS],
)

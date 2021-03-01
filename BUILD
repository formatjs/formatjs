load("@com_github_ash2k_bazel_tools//multirun:def.bzl", "multirun")
load("@bazelbuild_buildtools//buildifier:def.bzl", "buildifier")
load("@npm//karma:index.bzl", "karma_test")
load("//tools:index.bzl", "BUILDIFIER_WARNINGS")

# Allow any ts_library rules in this workspace to reference the config
# Note: if you move the tsconfig.json file to a subdirectory, you can add an alias() here instead
#   so that ts_library rules still use it by default.
#   See https://www.npmjs.com/package/@bazel/typescript#installation
exports_files(
    [
        "tsconfig.json",
        "tsconfig.esm.json",
        "tsconfig.es6.json",
        "karma.conf.js",
        "karma.conf-ci.js",
        "jest.config.js",
        ".prettierrc.json",
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
            "**/numbering-systems.js",  # See https://github.com/tc39/ecma402/issues/479
            "**/dft-currency-mnfd-range-check-mxfd.js",  # TODO
            "**/intl-legacy-constructed-symbol-on-unwrap.js",
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
    name = "test262-locale",
    srcs = glob(
        ["test262/test/intl402/Locale/**/*.js"],
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
    visibility = ["//packages/intl-locale:__subpackages__"],
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
            "**/options-type-invalid-throws.js",  # TODO
        ],
    ),
    visibility = ["//packages/intl-displaynames:__subpackages__"],
)

filegroup(
    name = "test262-all",
    srcs = glob(
        [
            "test262/**/*.js",
            "test262/**/*.json",
        ],
        exclude = ["test262/test/**/*"],
    ) + ["test262/README.md"],
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
    configuration_env_vars = [
        "SAUCE_USERNAME",
        "SAUCE_ACCESS_KEY",
    ],
    data = [
        "//:karma.conf.js",
        "@npm//karma-jasmine",
        "@npm//karma-chrome-launcher",
        "@npm//karma-sauce-launcher",
        "@npm//karma-jasmine-matchers",
    ] + KARMA_TESTS,
    tags = ["manual"],
    templated_args = [
        "start",
        "$(rootpath //:karma.conf.js)",
        "--browsers",
        "ChromeHeadless",
    ],
)

karma_test(
    name = "karma-ci",
    size = "large",
    configuration_env_vars = [
        "SAUCE_USERNAME",
        "SAUCE_ACCESS_KEY",
        "GITHUB_RUN_ID",
    ],
    data = [
        "//:karma.conf.js",
        "@npm//karma-jasmine",
        "@npm//karma-chrome-launcher",
        "@npm//karma-sauce-launcher",
        "@npm//karma-jasmine-matchers",
    ] + KARMA_TESTS,
    tags = ["manual"],
    templated_args = [
        "start",
        "$(rootpath //:karma.conf.js)",
        "--browsers",
        "sl_edge,sl_chrome,sl_firefox,sl_ie_11,sl_safari",
    ],
)

multirun(
    name = "prettier_all",
    commands = [
        "//packages/babel-plugin-formatjs:prettier",
        "//packages/cli:prettier",
        "//packages/ecma402-abstract:prettier",
        "//packages/eslint-plugin-formatjs:prettier",
        "//packages/intl-datetimeformat:prettier",
        "//packages/intl-displaynames:prettier",
        "//packages/intl-getcanonicallocales:prettier",
        "//packages/intl-listformat:prettier",
        "//packages/intl-locale:prettier",
        "//packages/intl-localematcher:prettier",
        "//packages/intl-messageformat-parser:prettier",
        "//packages/intl-messageformat:prettier",
        "//packages/intl-numberformat:prettier",
        "//packages/intl-pluralrules:prettier",
        "//packages/intl-relativetimeformat:prettier",
        "//packages/intl:prettier",
        "//packages/react-intl:prettier",
        "//packages/ts-transformer:prettier",
        "//packages/vue-intl:prettier",
        "//tools:prettier",
        "//website:prettier",
    ],
)

multirun(
    name = "tests-locale-data-all.update",
    testonly = True,
    commands = [
        "//packages/intl-datetimeformat:test262-main.update",
        "//packages/intl-datetimeformat:tests-locale-data-all.update",
        "//packages/intl-displaynames:test262-main.update",
        "//packages/intl-displaynames:tests-locale-data-all.update",
        "//packages/intl-listformat:test262-main.update",
        "//packages/intl-listformat:tests-locale-data-all.update",
        "//packages/intl-numberformat:test262-main.update",
        "//packages/intl-numberformat:tests-locale-data-all.update",
        "//packages/intl-pluralrules:test262-main.update",
        "//packages/intl-pluralrules:tests-locale-data-all.update",
        "//packages/intl-relativetimeformat:test262-main.update",
        "//packages/intl-relativetimeformat:tests-locale-data-all.update",
    ],
)

buildifier(
    name = "buildifier",
    exclude_patterns = ["./node_modules/*"],
    lint_mode = "fix",
    lint_warnings = BUILDIFIER_WARNINGS,
    verbose = True,
)

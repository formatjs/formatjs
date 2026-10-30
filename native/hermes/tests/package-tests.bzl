"""Run existing package assertions against native Hermes formatters."""

load("@aspect_rules_js//js:defs.bzl", "js_run_binary", "js_test")

def package_formatter_conformance(kind):
    js_run_binary(
        name = kind + "_package_bundles",
        srcs = depset(([
            "//crates/intl_" + kind + ":locale_data",
        ] if kind in ["pluralrules", "listformat", "displaynames", "numberformat", "datetimeformat", "relativetimeformat"] else []) + ([
            "//crates/intl_numberformat:locale_data",
            "//crates/intl_listformat:locale_data",
        ] if kind == "durationformat" else []) + ([
            "//:node_modules/@formatjs/intl-numberformat",
        ] if kind in ["numberformat", "datetimeformat", "relativetimeformat", "durationformat", "supportedvaluesof", "locale", "pluralrules"] else []) + ([
            "//:node_modules/@formatjs/intl-datetimeformat",
            "//:node_modules/@formatjs/intl-collator",
            "//:node_modules/@formatjs_generated/tz",
        ] if kind in ["supportedvaluesof", "locale", "datetimeformat"] else []) + ([
            "//:node_modules/@formatjs_generated/icu.calendar",
            "//:node_modules/temporal-polyfill",
            "//packages/ecma262-abstract",
            "//packages/ecma402-abstract",
            "//packages/ecma402-abstract/DateTimeFormat",
            "//packages/intl-datetimeformat/calendars",
        ] if kind == "datetimeformat" else []) + ([
            "//packages/ecma402-abstract/PluralRules",
        ] if kind == "pluralrules" else []) + ([
            "@GraphemeBreakTest//file",
            "@SentenceBreakTest//file",
            "@WordBreakTest//file",
        ] if kind == "segmenter" else []) + ([
            "//:node_modules/@formatjs/intl-listformat",
        ] if kind == "durationformat" else []) + [
            ":package_harness_sources",
            "//:node_modules/@formatjs/bigdecimal",
            "//:node_modules/@formatjs/intl-getcanonicallocales",
            "//:node_modules/@formatjs/intl-locale",
            "//:node_modules/@formatjs/intl-localematcher",
            "//:node_modules/@formatjs/intl-pluralrules",
            "//:node_modules/@formatjs/intl-" + kind,
            "//packages/ecma402-abstract/types",
            "//packages/intl-" + kind + ":hermes_package_tests",
        ]).to_list(),
        copy_srcs_to_bin = False,
        args = [
            "--kind",
            kind,
            "--out",
            "native/hermes/tests/" + kind + "_package_bundles",
        ] + (["--GraphemeBreakTest", "$(execpath @GraphemeBreakTest//file)", "--SentenceBreakTest", "$(execpath @SentenceBreakTest//file)", "--WordBreakTest", "$(execpath @WordBreakTest//file)"] if kind == "segmenter" else []),
        out_dirs = [kind + "_package_bundles"],
        tool = ":bundle_package_tests",
    )

    js_test(
        name = kind + "_package_conformance_test",
        size = "medium",
        args = [kind],
        data = ([":datetimeformat_prelude.js"] if kind == "datetimeformat" else []) + [
            ":" + kind + "_package_bundles",
            ":optimized_runtime",
            "//:node_modules/@bazel/runfiles",
            "//native/hermes:extension_bundle_bytecode",
        ],
        entry_point = "run-package-tests.ts",
        node_options = ["--experimental-transform-types"],
    )

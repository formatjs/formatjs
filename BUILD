load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_bazel_lib//lib:copy_to_directory.bzl", "copy_to_directory")
load("@aspect_rules_js//npm:defs.bzl", "npm_link_package")
load("@aspect_rules_lint//format:defs.bzl", "format_multirun", "format_test")
load("@aspect_rules_ts//ts:defs.bzl", "ts_config")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("@npm//:karma/package_json.bzl", karma_bin = "bin")
load("@npm//:prettier/package_json.bzl", prettier = "bin")
load("@rules_multirun//:defs.bzl", "multirun")

npm_link_all_packages()

exports_files(
    [
        "karma.conf.js",
        "karma.conf-ci.js",
    ] + glob(["npm_package_patches/*"]),
    visibility = ["//:__subpackages__"],
)

genrule(
    name = "pnpm_workspace_config",
    srcs = [],
    outs = ["pnpm-workspace.yaml"],
    cmd = "echo 'packages:\n\
  - 'packages/*' \
' > $@",
)

genrule(
    name = "dev_npmrc",
    srcs = [],
    outs = [".npmrc"],
    cmd = "echo 'registry=http://localhost:4000/\n\
//localhost:4000/:_authToken=\"PCQTYjgHpY1Wz8UNyiaQ4w==\"\n\
' > $@",
)

PACKAGES_TO_DIST = [
    "//packages/babel-plugin-formatjs",
    "//packages/cli-lib",
    "//packages/cli",
    "//packages/ecma376",
    "//packages/ecma402-abstract",
    "//packages/eslint-plugin-formatjs",
    "//packages/fast-memoize",
    "//packages/icu-messageformat-parser",
    "//packages/icu-skeleton-parser",
    "//packages/intl-datetimeformat",
    "//packages/intl-displaynames",
    "//packages/intl-durationformat",
    "//packages/intl-enumerator",
    "//packages/intl-getcanonicallocales",
    "//packages/intl-listformat",
    "//packages/intl-locale",
    "//packages/intl-localematcher",
    "//packages/intl-messageformat",
    "//packages/intl-numberformat",
    "//packages/intl-pluralrules",
    "//packages/intl-relativetimeformat",
    "//packages/intl-segmenter",
    "//packages/intl",
    "//packages/react-intl",
    "//packages/ts-transformer",
    "//packages/utils",
    "//packages/vue-intl",
]

PACKAGE_DIRNAMES = [p.split("packages/")[1] for p in PACKAGES_TO_DIST]

# pnpm_bin.pnpm(
#    name="deploy",
#    srcs=[":dist"],
#    out_dirs=["deploy_result"],
#    chdir="$(rootpath :dist)",
#    args=["deploy", "--filter", "@formatjs/cli-lib", "../$(@D)"]
# )

copy_to_directory(
    name = "dist",
    srcs = [
        # to verify, run verdaccio at port 4000 and enable this
        # ":dev_npmrc",
        ":pnpm_workspace_config",
        "package.json",
        "pnpm-lock.yaml",
    ] + ["%s:pkg" % pkg for pkg in PACKAGES_TO_DIST] + glob(["patches/*"]),
    out = "formatjs_dist",
    replace_prefixes = {k: v for k, v in [(
        "packages/%s/pkg" % p,
        "packages/%s" % p,
    ) for p in PACKAGE_DIRNAMES]},
)

# We run this centrally so it doesn't spawn
# multiple browser sessions which overwhelms SauceLabs
KARMA_TESTS = [
    # TODO: fix this
    "//packages/icu-messageformat-parser:bundled-karma-tests",
    "//packages/intl-displaynames:bundled-karma-tests",
    "//packages/intl-getcanonicallocales:bundled-karma-tests",
    "//packages/intl-listformat:bundled-karma-tests",
    "//packages/intl-pluralrules:bundled-karma-tests",
    "//packages/intl-relativetimeformat:bundled-karma-tests",
]

karma_bin.karma_test(
    name = "karma",
    args = [
        "start",
        "$(rootpath //:karma.conf.js)",
        "--no-single-run",
    ],
    # configuration_env_vars = [
    #     "SAUCE_USERNAME",
    #     "SAUCE_ACCESS_KEY",
    # ],
    data = [
        "//:karma.conf.js",
        "//:node_modules/karma-chrome-launcher",
        "//:node_modules/karma-jasmine",
        "//:node_modules/karma-jasmine-matchers",
        "//:node_modules/karma-sauce-launcher",
    ] + KARMA_TESTS,
    tags = ["manual"],
)

karma_bin.karma_test(
    name = "karma-ci",
    args = [
        "start",
        "$(rootpath //:karma.conf.js)",
        "--browsers",
        "sl_edge,sl_chrome,sl_firefox,sl_ie_11,sl_safari",
    ],
    # configuration_env_vars = [
    #     "SAUCE_USERNAME",
    #     "SAUCE_ACCESS_KEY",
    #     "GITHUB_RUN_ID",
    # ],
    data = [
        "//:karma.conf.js",
        "//:node_modules/karma-chrome-launcher",
        "//:node_modules/karma-jasmine",
        "//:node_modules/karma-jasmine-matchers",
        "//:node_modules/karma-sauce-launcher",
    ] + KARMA_TESTS,
    tags = ["manual"],
)

multirun(
    name = "generated-test-files",
    testonly = True,
    commands = [
        "//packages/intl-datetimeformat:test262-main",
        "//packages/intl-datetimeformat:generated-test-files",
        "//packages/intl-displaynames:test262-main",
        "//packages/intl-displaynames:generated-test-files",
        "//packages/intl-listformat:test262-main",
        "//packages/intl-listformat:generated-test-files",
        "//packages/intl-numberformat:test262-main",
        "//packages/intl-numberformat:generated-test-files",
        "//packages/intl-pluralrules:test262-main",
        "//packages/intl-pluralrules:generated-test-files",
        "//packages/intl-relativetimeformat:test262-main",
        "//packages/intl-relativetimeformat:generated-test-files",
        "//packages/intl-segmenter:test262-main",
        "//packages/intl-segmenter:generated-files",
        "//packages/intl-getcanonicallocales:aliases",
    ],
)

multirun(
    name = "generated-files",
    testonly = True,
    commands = [
        "//packages/intl-datetimeformat:generated-files",
        "//packages/intl-displaynames:generated-files",
        "//packages/intl-listformat:generated-files",
        "//packages/intl-numberformat:generated-files",
        "//packages/intl-pluralrules:generated-files",
        "//packages/intl-relativetimeformat:generated-files",
        "//packages/intl-segmenter:generated-files",
    ],
)

multirun(
    name = "cldr-gen",
    testonly = True,
    commands = [
        "//packages/icu-messageformat-parser:time-data",
        "//packages/intl-durationformat:numbering-systems",
        "//packages/intl-durationformat:time-separators",
        "//packages/intl-enumerator:currencies",
        "//packages/intl-enumerator:numbering-systems",
        "//packages/intl-getcanonicallocales:likelySubtags",
        "//packages/intl-locale:calendars",
        "//packages/intl-locale:character-orders",
        "//packages/intl-locale:hour-cycles",
        "//packages/intl-locale:numbering-systems",
        "//packages/intl-locale:timezones",
        "//packages/intl-locale:week-data",
        "//packages/intl-numberformat:numbering-systems",
        "//packages/intl-segmenter:generate-cldr-segmentation-rules",
        "//packages/utils:default-currency",
        "//packages/utils:default-locale",
    ],
)

CONFIG_FILES = [
    "jest.config.js",
    "jest-no-transpile.config.js",
    "package.json",
    "tsconfig.json",
]

[
    copy_to_bin(
        name = f.rsplit(".", 1)[0],
        srcs = [f],
        visibility = ["//visibility:public"],
    )
    for f in CONFIG_FILES
]

copy_to_bin(
    name = "swcrc",
    srcs = [".swcrc"],
    visibility = ["//visibility:public"],
)

TSCONFIG_FILES = [
    "tsconfig.es6.json",
    "tsconfig.node.json",
    "tsconfig.esm.json",
    "tsconfig.esm.esnext.json",
]

[
    ts_config(
        name = f.replace(".json", ""),
        src = f,
        visibility = ["//visibility:public"],
        deps = ["tsconfig.json"],
    )
    for f in TSCONFIG_FILES
]

# Symlink some workspaces to the root workspace, so scripts like benchmarks
# can easily depend on the distributable package via target `//:node_modules/<package_name>`.
npm_link_package(
    name = "node_modules/@formatjs/intl-pluralrules",
    src = "//packages/intl-pluralrules",
)

npm_link_package(
    name = "node_modules/@formatjs/intl-localematcher",
    src = "//packages/intl-localematcher",
)

prettier.prettier_binary(
    name = "prettier",
    data = [
        ".prettierignore",
        ".prettierrc.json",
    ],
    # Allow the binary to be run outside bazel
    env = {"BAZEL_BINDIR": "."},
)

format_multirun(
    name = "format",
    css = ":prettier",
    html = ":prettier",
    javascript = ":prettier",
    markdown = ":prettier",
    starlark = "@buildifier_prebuilt//:buildifier",
    visibility = ["//visibility:public"],
)

format_test(
    name = "format_test",
    size = "small",
    javascript = ":prettier",
    markdown = ":prettier",
    no_sandbox = True,  # Enables formatting the entire workspace, paired with 'workspace' attribute
    starlark = "@buildifier_prebuilt//:buildifier",
    workspace = "//:package.json",  # A file in the workspace root, where the no_sandbox mode will run the formatter
)

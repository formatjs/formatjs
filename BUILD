load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_bazel_lib//lib:copy_to_directory.bzl", "copy_to_directory")
load("@aspect_rules_ts//ts:defs.bzl", "ts_config")
load("@bazelbuild_buildtools//buildifier:def.bzl", "buildifier")
load("@com_github_ash2k_bazel_tools//multirun:def.bzl", "multirun")
load("@io_bazel_rules_docker//container:container.bzl", "container_image", "container_layer")
load("@io_bazel_rules_docker//docker/package_managers:download_pkgs.bzl", "download_pkgs")
load("@io_bazel_rules_docker//docker/package_managers:install_pkgs.bzl", "install_pkgs")
load("@io_bazel_rules_docker//docker/util:run.bzl", "container_run_and_extract")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("@npm//:karma/package_json.bzl", karma_bin = "bin")
load("//:index.bzl", "ZONES")
load("//tools:index.bzl", "BUILDIFIER_WARNINGS")

# Allow any ts_library rules in this workspace to reference the config
# Note: if you move the tsconfig.json file to a subdirectory, you can add an alias() here instead
#   so that ts_library rules still use it by default.
#   See https://www.npmjs.com/package/@aspect_rules_ts#installation
exports_files(
    [
        "karma.conf.js",
        "karma.conf-ci.js",
        "jest.config.js",
        ".prettierrc.json",
    ] + glob(["npm_package_patches/*"]),
    visibility = ["//:__subpackages__"],
)

copy_to_directory(
    name = "dist",
    srcs = [
        "package.json",
        "pnpm-lock.yaml",
        "//packages/babel-plugin-formatjs",
        "//packages/cli-lib",
        "//packages/ecma376",
        "//packages/ecma402-abstract",
        "//packages/eslint-plugin-formatjs",
        "//packages/fast-memoize",
        "//packages/icu-messageformat-parser",
        "//packages/icu-skeleton-parser",
        "//packages/intl",
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
        "//packages/react-intl",
        "//packages/swc-plugin",
        "//packages/ts-transformer",
        "//packages/vue-intl",
    ],
    out = "formatjs_dist",
)

npm_link_all_packages(name = "node_modules")

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
    # configuration_env_vars = [
    #     "SAUCE_USERNAME",
    #     "SAUCE_ACCESS_KEY",
    # ],
    data = [
        "//:karma.conf.js",
        "//:node_modules/karma-jasmine",
        "//:node_modules/karma-chrome-launcher",
        "//:node_modules/karma-sauce-launcher",
        "//:node_modules/karma-jasmine-matchers",
    ] + KARMA_TESTS,
    tags = ["manual"],
    args = [
        "start",
        "$(rootpath //:karma.conf.js)",
        "--no-single-run",
    ],
)

karma_bin.karma_test(
    name = "karma-ci",
    size = "large",
    # configuration_env_vars = [
    #     "SAUCE_USERNAME",
    #     "SAUCE_ACCESS_KEY",
    #     "GITHUB_RUN_ID",
    # ],
    data = [
        "//:karma.conf.js",
        "//:node_modules/karma-jasmine",
        "//:node_modules/karma-chrome-launcher",
        "//:node_modules/karma-sauce-launcher",
        "//:node_modules/karma-jasmine-matchers",
    ] + KARMA_TESTS,
    tags = ["manual"],
    args = [
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
        "//packages/cli-lib:prettier",
        "//packages/ecma376:prettier",
        "//packages/ecma402-abstract:prettier",
        "//packages/editor:prettier",
        "//packages/eslint-plugin-formatjs:prettier",
        "//packages/fast-memoize:prettier",
        "//packages/icu-messageformat-parser:prettier",
        "//packages/icu-skeleton-parser:prettier",
        "//packages/intl-datetimeformat:prettier",
        "//packages/intl-displaynames:prettier",
        "//packages/intl-durationformat:prettier",
        "//packages/intl-enumerator:prettier",
        "//packages/intl-getcanonicallocales:prettier",
        "//packages/intl-listformat:prettier",
        "//packages/intl-locale:prettier",
        "//packages/intl-localematcher:prettier",
        "//packages/intl-messageformat:prettier",
        "//packages/intl-numberformat:prettier",
        "//packages/intl-pluralrules:prettier",
        "//packages/intl-relativetimeformat:prettier",
        "//packages/intl:prettier",
        "//packages/react-intl:prettier",
        "//packages/swc-plugin:prettier",
        "//packages/ts-transformer:prettier",
        "//packages/vue-intl:prettier",
        "//tools:prettier",
        "//website:prettier",
    ],
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
    ],
)

buildifier(
    name = "buildifier",
    exclude_patterns = ["./node_modules/*"],
    lint_mode = "fix",
    lint_warnings = BUILDIFIER_WARNINGS,
    verbose = True,
)

# Build the Docker container so can compile tzcode + tzdata at the version we want
# First thing, apt install build-essential
download_pkgs(
    name = "build_essential_pkgs",
    image_tar = "@ubuntu2204//image",
    packages = [
        "build-essential",
    ],
)

install_pkgs(
    name = "ubuntu_build_essential_image",
    image_tar = "@ubuntu2204//image",
    installables_tar = ":build_essential_pkgs.tar",
    output_image_name = "ubuntu_build_essential_image",
)

# Package tzcode + tzdata into a single Docker layer
container_layer(
    name = "tz",
    directory = "tz",
    tars = [
        "@tzcode//file",
        "@tzdata//file",
    ],
)

# Create a new Docker image with build-essential, tzcode + tzdata
container_image(
    name = "build_essential_bazel_wrapper",
    base = ":ubuntu_build_essential_image.tar",
    layers = [":tz"],
)

# Pre-compile tzdata
ZIC_FILES = [
    "backward",
    "africa",
    "antarctica",
    "asia",
    "australasia",
    "etcetera",
    "europe",
    "northamerica",
    "southamerica",
]

container_run_and_extract(
    name = "tz_install",
    commands = [
                   "cd /tz",
                   # Run make install in the container
                   "make TOPDIR=/tzdir install",
                   "echo 'Compiling zic data'",
                   "/tzdir/usr/sbin/zic -d /zic %s" % " ".join(["/tz/%s" % f for f in ZIC_FILES]),
                   # Make a folder to house all the data we need to extract
                   "mkdir /tz_data",
                   # Copy backward file
                   "cp /tz/backward /tz_data",
                   # Compile zdump into it
                   "echo 'Compiling zdump data'",
               ] + [
                   "mkdir -p /tz_data/zdump/%s" %
                   zone.rsplit("/", 1)[0]
                   for zone in ZONES
               ] +
               ["/tzdir/usr/bin/zdump -c 2100 -v /zic/%s > /tz_data/zdump/%s" % (zone, zone) for zone in ZONES] + [
        "tar -czvf /tz_data.tar.gz /tz_data",
    ],
    extract_file = "/tz_data.tar.gz",
    image = ":build_essential_bazel_wrapper.tar",
    visibility = ["//packages/intl-datetimeformat:__pkg__"],
)

copy_to_bin(
    name = ".prettierrc",
    srcs = [".prettierrc.json"],
    visibility = ["//visibility:public"],
)

copy_to_bin(
    name = "tsconfig",
    srcs = ["tsconfig.json"],
    visibility = ["//visibility:public"],
)

copy_to_bin(
    name = "jest.config",
    srcs = ["jest.config.js"],
    visibility = ["//visibility:public"],
)

copy_to_bin(
    name = "package",
    srcs = ["package.json"],
    visibility = ["//visibility:public"],
)

ts_config(
    name = "tsconfig.es6",
    src = "tsconfig.es6.json",
    visibility = ["//:__subpackages__"],
    deps = ["tsconfig.json"],
)

ts_config(
    name = "tsconfig.node",
    src = "tsconfig.node.json",
    visibility = ["//:__subpackages__"],
    deps = ["tsconfig.json"],
)

ts_config(
    name = "tsconfig.esm",
    src = "tsconfig.esm.json",
    visibility = ["//:__subpackages__"],
    deps = ["tsconfig.json"],
)

ts_config(
    name = "tsconfig.esm.esnext",
    src = "tsconfig.esm.esnext.json",
    visibility = ["//:__subpackages__"],
    deps = ["tsconfig.json"],
)

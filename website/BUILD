load("@build_bazel_rules_nodejs//:index.bzl", "copy_to_bin")
load("@npm//@docusaurus/core:index.bzl", "docusaurus")
load("@npm//http-server:index.bzl", "http_server")
load("//tools:index.bzl", "check_format")

check_format(
    name = "prettier",
    srcs = glob(
        [
            "docs/**/*",
            "lang/*",
            "src/**/*",
            "*.js*",
        ],
    ) + [
        "BUILD",
    ],
    config = ".prettierrc.json",
)

DEPS = [
    ":copy",
    "//packages/intl-locale:dist",
    "//packages/intl-displaynames:dist",
    "//packages/intl-displaynames:locale-data",
    "//packages/intl-listformat:dist",
    "//packages/intl-listformat:locale-data",
    "//packages/intl-messageformat:dist",
    "//packages/icu-messageformat-parser:dist",
    "//packages/react-intl:dist",
    "@npm//@docusaurus/plugin-google-analytics",
    "@npm//@docusaurus/preset-classic",
    "@npm//@docusaurus/theme-live-codeblock",
    "@npm//classnames",
    "@npm//react",
    "@npm//react-dom",
]

copy_to_bin(
    name = "copy",
    srcs = glob([
        "docs/**/*",
        "lang/*",
        "src/**/*",
        "static/**/*",
        "*.js",
    ]),
)

docusaurus(
    name = "build",
    args = [
        "build",
        "--out-dir",
        "$(@D)",
        "$(BINDIR)/website",
    ],
    data = DEPS,
    output_dir = True,
)

docusaurus(
    name = "deploy",
    configuration_env_vars = [
        "USE_SSH",
        "GIT_USER",
    ],
    data = DEPS + [
        ":build",
        "docusaurus.config.js",
    ],
    templated_args = [
        "deploy",
        "--skip-build",
        "--out-dir",
        "$$(rlocation $(location :build))",
        "website",
    ],
)

http_server(
    name = "serve",
    data = [
        ":build",
    ],
    templated_args = [
        "$$(rlocation $(location :build))",
    ],
)

load("@build_bazel_rules_nodejs//:index.bzl", "copy_to_bin")
load("@npm//@docusaurus/core:index.bzl", "docusaurus")
load("//tools:index.bzl", "prettier_check")

prettier_check(
    name = "prettier",
    srcs = glob(
        [
            "docs/**/*",
            "lang/*",
            "src/**/*",
            "*.js*",
        ],
    ) + [
        "README.md",
    ],
    config = ".prettierrc.json",
)

DEPS = [
    ":copy",
    "//packages/intl-displaynames:dist",
    "//packages/intl-displaynames:locale-data",
    "//packages/intl-messageformat:dist",
    "//packages/intl-messageformat-parser:dist",
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
    name = "dist",
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
    data = DEPS + [":dist"],
    templated_args = [
        "deploy",
        "website",
    ],
)

docusaurus(
    name = "serve",
    data = DEPS + [
        ":dist",
        "docusaurus.config.js",
    ],
    templated_args = [
        "serve",
        "--dir",
        "$$(rlocation $(location :dist))",
        "$(BINDIR)/website",
    ],
)

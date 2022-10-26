load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("@npm//website:@docusaurus/core/package_json.bzl", docusaurus_bin = "bin")
load("@npm//website:http-server/package_json.bzl", http_server_bin = "bin")
load("//tools:index.bzl", "check_format")

npm_link_all_packages(name = "node_modules")

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
    ":node_modules/@docusaurus/plugin-google-analytics",
    ":node_modules/@docusaurus/preset-classic",
    ":node_modules/@docusaurus/theme-common",
    ":node_modules/@docusaurus/theme-live-codeblock",
    ":node_modules/@formatjs/icu-messageformat-parser",
    ":node_modules/classnames",
    ":node_modules/intl-messageformat",
    ":node_modules/react-intl",
    "//:node_modules/@types/react",
    "//:node_modules/react-dom",
    "//:node_modules/react",
]

copy_to_bin(
    name = "copy",
    srcs = glob([
        "docs/**/*",
        "lang/*",
        "src/**/*",
        "static/**/*",
        "*.js",
    ] + ["package.json"]),
)

docusaurus_bin.docusaurus(
    name = "build",
    args = [
        "build",
        "--out-dir",
        "$(@D)",
    ],
    srcs = DEPS + [
        "//:node_modules/tslib",
        "//:node_modules/hoist-non-react-statics",
        ":node_modules/react-live",
        ":node_modules/@mdx-js/react",
        "//:node_modules/clsx",
    ],
    out_dirs = ["build"],
    tags = ["manual"],
    chdir = package_name(),
)

docusaurus_bin.docusaurus_binary(
    name = "deploy",
    # configuration_env_vars = [
    #     "USE_SSH",
    #     "GIT_USER",
    #     "DEPLOYMENT_BRANCH",
    #     "NO_UPDATE_NOTIFIER",
    # ],
    data = DEPS + [
        ":build",
        "docusaurus.config.js",
    ],
    args = [
        "deploy",
        "--skip-build",
        "--out-dir",
        "$$(rlocation $(rootpath :build))",
        "website",
    ],
    tags = ["manual"],
)

http_server_bin.http_server_binary(
    name = "serve",
    data = [
        ":build",
    ],
    args = [
        "$$(rlocation $(location :build))",
    ],
    tags = ["manual"],
)

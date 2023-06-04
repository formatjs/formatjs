load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("@npm//website:@docusaurus/core/package_json.bzl", docusaurus_bin = "bin")
load("@npm//website:http-server/package_json.bzl", http_server_bin = "bin")

npm_link_all_packages(name = "node_modules")

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
    srcs = DEPS + [
        ":node_modules/@mdx-js/react",
        ":node_modules/react-live",
        "//:node_modules/clsx",
        "//:node_modules/hoist-non-react-statics",
        "//:node_modules/tslib",
    ],
    args = [
        "build",
        "--out-dir",
        "$(@D)",
    ],
    chdir = package_name(),
    out_dirs = ["build"],
    tags = ["manual"],
)

docusaurus_bin.docusaurus_binary(
    name = "deploy",
    args = [
        "deploy",
        "--skip-build",
        "--out-dir",
        "$$(rlocation $(rootpath :build))",
        "website",
    ],
    # configuration_env_vars = [
    #     "USE_SSH",
    #     "GIT_USER",
    #     "DEPLOYMENT_BRANCH",
    #     "NO_UPDATE_NOTIFIER",
    # ],
    data = DEPS + [
        "docusaurus.config.js",
        ":build",
    ],
    tags = ["manual"],
)

http_server_bin.http_server_binary(
    name = "serve",
    args = [
        "$$(rlocation $(location :build))",
    ],
    data = [
        ":build",
    ],
    tags = ["manual"],
)

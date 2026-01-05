"""Repository rules for FormatJS CLI toolchains."""

DEFAULT_VERSION = "0.1.0"

FORMATJS_CLI_VERSIONS = {
    "0.1.0": {
        "darwin-arm64": {
            "url": "https://github.com/formatjs/formatjs/releases/download/formatjs_cli_v0.1.0/formatjs_cli-darwin-arm64",
            "sha256": "9b2c736b48cc65e763cf19ac7c190e527f9a8d4aa0798185e602f58becb99feb",
        },
        "linux-x64": {
            "url": "https://github.com/formatjs/formatjs/releases/download/formatjs_cli_v0.1.0/formatjs_cli-linux-x64",
            "sha256": "884b9a41b9f6be649ea72277ebf22af0146043466d2ab94b28a57f95ffb7da1a",
        },
    },
}

def _formatjs_cli_repo_impl(rctx):
    """Implementation for formatjs_cli repository rule."""
    platform = rctx.attr.platform
    version = rctx.attr.version

    if version not in FORMATJS_CLI_VERSIONS:
        fail("Unsupported FormatJS CLI version: {}. Available versions: {}".format(
            version,
            FORMATJS_CLI_VERSIONS.keys(),
        ))

    if platform not in FORMATJS_CLI_VERSIONS[version]:
        fail("Unsupported platform: {} for version {}. Available platforms: {}".format(
            platform,
            version,
            FORMATJS_CLI_VERSIONS[version].keys(),
        ))

    info = FORMATJS_CLI_VERSIONS[version][platform]

    rctx.download(
        url = info["url"],
        output = "formatjs_cli",
        sha256 = info["sha256"],
        executable = True,
    )

    rctx.file("BUILD.bazel", content = """
load("@rules_formatjs//formatjs_cli:toolchain.bzl", "formatjs_cli_toolchain")

filegroup(
    name = "cli",
    srcs = ["formatjs_cli"],
    visibility = ["//visibility:public"],
)

formatjs_cli_toolchain(
    name = "toolchain_impl",
    cli = ":cli",
    visibility = ["//visibility:public"],
)

toolchain(
    name = "toolchain",
    toolchain = ":toolchain_impl",
    toolchain_type = "@rules_formatjs//formatjs_cli:toolchain_type",
    exec_compatible_with = {exec_compatible_with},
    target_compatible_with = {target_compatible_with},
    visibility = ["//visibility:public"],
)
""".format(
        exec_compatible_with = rctx.attr.exec_compatible_with,
        target_compatible_with = rctx.attr.target_compatible_with,
    ))

_formatjs_cli_repo = repository_rule(
    implementation = _formatjs_cli_repo_impl,
    attrs = {
        "version": attr.string(
            mandatory = True,
            doc = "FormatJS CLI version",
        ),
        "platform": attr.string(
            mandatory = True,
            doc = "Target platform (e.g., 'darwin-arm64', 'linux-x64')",
        ),
        "exec_compatible_with": attr.string_list(
            doc = "Execution platform constraints",
        ),
        "target_compatible_with": attr.string_list(
            doc = "Target platform constraints",
        ),
    },
)

def formatjs_cli_register_toolchains(name, version = DEFAULT_VERSION, register = True):
    """Register FormatJS CLI toolchains for all supported platforms.

    Args:
        name: Base name for the toolchain repositories
        version: FormatJS CLI version to use
        register: Whether to register the toolchains (set to False when called from module extension)
    """

    if version not in FORMATJS_CLI_VERSIONS:
        fail("Unsupported FormatJS CLI version: {}. Available versions: {}".format(
            version,
            FORMATJS_CLI_VERSIONS.keys(),
        ))

    toolchains = []

    # macOS Apple Silicon (darwin-arm64)
    if "darwin-arm64" in FORMATJS_CLI_VERSIONS[version]:
        repo_name = "{}_darwin_arm64".format(name)
        _formatjs_cli_repo(
            name = repo_name,
            version = version,
            platform = "darwin-arm64",
            exec_compatible_with = [
                "@platforms//os:macos",
                "@platforms//cpu:arm64",
            ],
            target_compatible_with = [],
        )
        toolchains.append("@{}//:toolchain".format(repo_name))

    # Linux x86_64
    if "linux-x64" in FORMATJS_CLI_VERSIONS[version]:
        repo_name = "{}_linux_x64".format(name)
        _formatjs_cli_repo(
            name = repo_name,
            version = version,
            platform = "linux-x64",
            exec_compatible_with = [
                "@platforms//os:linux",
                "@platforms//cpu:x86_64",
            ],
            target_compatible_with = [],
        )
        toolchains.append("@{}//:toolchain".format(repo_name))

    # Register toolchains
    if register:
        native.register_toolchains(*toolchains)

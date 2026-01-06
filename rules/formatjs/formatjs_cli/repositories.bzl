"""Repository rules for FormatJS CLI toolchains."""

DEFAULT_VERSION = "0.1.4"

FORMATJS_CLI_VERSIONS = {
    "0.1.4": {
        "darwin-arm64": {
            "url": "https://github.com/formatjs/formatjs/releases/download/formatjs_cli_v0.1.4/formatjs_cli-darwin-arm64",
            "sha256": "dfa300380ab8a482a0103dda5995f5ea595987cac848dd9255a33092e93e14ee",
        },
        "linux-x64": {
            "url": "https://github.com/formatjs/formatjs/releases/download/formatjs_cli_v0.1.4/formatjs_cli-linux-x64",
            "sha256": "9db56fd9e4118cd5e4408ea9d75cd93cc2d3152b6814ab238ea5fbfc6ba6742f",
        },
    },
    "0.1.3": {
        "darwin-arm64": {
            "url": "https://github.com/formatjs/formatjs/releases/download/formatjs_cli_v0.1.3/formatjs_cli-darwin-arm64",
            "sha256": "ea99b1444ae9b331d51dad2806f7c870d352a6d9e71de7176da6b3b6c973873c",
        },
        "linux-x64": {
            "url": "https://github.com/formatjs/formatjs/releases/download/formatjs_cli_v0.1.3/formatjs_cli-linux-x64",
            "sha256": "4ee7d9d06c933ef16292ca6d4af32de820756e47dd00f28cc821184cb94cd9be",
        },
    },
    "0.1.2": {
        "darwin-arm64": {
            "url": "https://github.com/formatjs/formatjs/releases/download/formatjs_cli_v0.1.2/formatjs_cli-darwin-arm64",
            "sha256": "ea99b1444ae9b331d51dad2806f7c870d352a6d9e71de7176da6b3b6c973873c",
        },
        "linux-x64": {
            "url": "https://github.com/formatjs/formatjs/releases/download/formatjs_cli_v0.1.2/formatjs_cli-linux-x64",
            "sha256": "4ee7d9d06c933ef16292ca6d4af32de820756e47dd00f28cc821184cb94cd9be",
        },
    },
    "0.1.1": {
        "darwin-arm64": {
            "url": "https://github.com/formatjs/formatjs/releases/download/formatjs_cli_v0.1.1/formatjs_cli-darwin-arm64",
            "sha256": "4a4218c3e3e40905e41bea0d0d988ca5c6a0a010502821b2f57d6928641437f6",
        },
        "linux-x64": {
            "url": "https://github.com/formatjs/formatjs/releases/download/formatjs_cli_v0.1.1/formatjs_cli-linux-x64",
            "sha256": "7bfbce944b780c0b12ec4d8362ae5e0e9ab8b745573f8a367228b14f64c7175b",
        },
    },
}

def _formatjs_cli_repo_impl(rctx):
    """Implementation for formatjs_cli repository rule."""
    platform = rctx.attr.platform
    version = rctx.attr.version

    # Allow custom URL and SHA256 to be provided
    custom_url = rctx.attr.url
    custom_sha256 = rctx.attr.sha256

    if custom_url and custom_sha256:
        # Use custom URL and SHA256 if provided
        url = custom_url
        sha256 = custom_sha256
    else:
        # Use built-in versions
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
        url = info["url"]
        sha256 = info["sha256"]

    rctx.download(
        url = url,
        output = "formatjs_cli",
        sha256 = sha256,
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
        "url": attr.string(
            doc = """Custom URL to download the FormatJS CLI binary from.

            If provided along with sha256, this overrides the built-in version URLs.
            Useful for testing unreleased versions or using custom builds.
            """,
        ),
        "sha256": attr.string(
            doc = """SHA256 checksum of the custom binary.

            Required if url is provided. This ensures the downloaded binary
            matches the expected checksum for security and reproducibility.
            """,
        ),
        "exec_compatible_with": attr.string_list(
            doc = "Execution platform constraints",
        ),
        "target_compatible_with": attr.string_list(
            doc = "Target platform constraints",
        ),
    },
)

def _formatjs_cli_placeholder_repo_impl(rctx):
    """Implementation for a placeholder repository for platforms without binaries yet."""
    rctx.file("BUILD.bazel", content = """# Placeholder repository for {platform}
# Binary not yet available for this platform.
# The toolchain definition exists in @formatjs_cli_toolchains but will not be selected
# unless you're building on this platform (which will fail with a clear error).

exports_files(["README.md"])
""".format(platform = rctx.attr.platform))

    rctx.file("README.md", content = """This is a placeholder repository for the FormatJS CLI on {platform}.

Binaries are not yet available for this platform. If you need support for this platform,
please file an issue or contribute a PR at:
https://github.com/formatjs/formatjs

The toolchain infrastructure is ready - only the binary build is needed.
""".format(platform = rctx.attr.platform))

_formatjs_cli_placeholder_repo = repository_rule(
    implementation = _formatjs_cli_placeholder_repo_impl,
    attrs = {
        "platform": attr.string(
            mandatory = True,
            doc = "Target platform (e.g., 'darwin-x86_64', 'windows-x86_64')",
        ),
    },
)

def _formatjs_cli_toolchains_repo_impl(rctx):
    """Implementation for the main toolchains repository that contains toolchain definitions for all platforms."""

    build_content = """# @generated by @rules_formatjs//formatjs_cli:repositories.bzl
#
# These can be registered in the workspace file or passed to --extra_toolchains flag.
# By default all these toolchains are registered by the formatjs_cli extension
# so you don't normally need to interact with these targets.

"""

    # Add toolchain definitions for each platform
    for platform_key, platform_info in [
        ("darwin_arm64", {
            "exec_compatible_with": ["\"@platforms//os:osx\"", "\"@platforms//cpu:arm64\""],
        }),
        ("darwin_x86_64", {
            "exec_compatible_with": ["\"@platforms//os:osx\"", "\"@platforms//cpu:x86_64\""],
        }),
        ("linux_x64", {
            "exec_compatible_with": ["\"@platforms//os:linux\"", "\"@platforms//cpu:x86_64\""],
        }),
        ("linux_aarch64", {
            "exec_compatible_with": ["\"@platforms//os:linux\"", "\"@platforms//cpu:aarch64\""],
        }),
        ("windows_x86_64", {
            "exec_compatible_with": ["\"@platforms//os:windows\"", "\"@platforms//cpu:x86_64\""],
        }),
    ]:
        build_content += """
toolchain(
    name = "{platform}_toolchain",
    exec_compatible_with = [{compatible_with}],
    toolchain = "@{user_repository_name}_{platform}//:toolchain_impl",
    toolchain_type = "@rules_formatjs//formatjs_cli:toolchain_type",
    visibility = ["//visibility:public"],
)
""".format(
            platform = platform_key,
            user_repository_name = rctx.attr.user_repository_name,
            compatible_with = ", ".join(platform_info["exec_compatible_with"]),
        )

    rctx.file("BUILD.bazel", build_content)

_formatjs_cli_toolchains_repo = repository_rule(
    implementation = _formatjs_cli_toolchains_repo_impl,
    doc = """Creates a repository with toolchain definitions for all known platforms
     which can be registered or selected.""",
    attrs = {
        "user_repository_name": attr.string(doc = "Base name for toolchains repository"),
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

    # macOS Intel (darwin-x86_64) - placeholder for now
    repo_name = "{}_darwin_x86_64".format(name)
    if "darwin-x86_64" in FORMATJS_CLI_VERSIONS[version]:
        _formatjs_cli_repo(
            name = repo_name,
            version = version,
            platform = "darwin-x86_64",
            exec_compatible_with = [
                "@platforms//os:macos",
                "@platforms//cpu:x86_64",
            ],
            target_compatible_with = [],
        )
    else:
        _formatjs_cli_placeholder_repo(
            name = repo_name,
            platform = "darwin-x86_64",
        )

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

    # Linux aarch64 - placeholder for now
    repo_name = "{}_linux_aarch64".format(name)
    if "linux-aarch64" in FORMATJS_CLI_VERSIONS[version]:
        _formatjs_cli_repo(
            name = repo_name,
            version = version,
            platform = "linux-aarch64",
            exec_compatible_with = [
                "@platforms//os:linux",
                "@platforms//cpu:aarch64",
            ],
            target_compatible_with = [],
        )
    else:
        _formatjs_cli_placeholder_repo(
            name = repo_name,
            platform = "linux-aarch64",
        )

    # Windows x86_64 - placeholder for now
    repo_name = "{}_windows_x86_64".format(name)
    if "windows-x86_64" in FORMATJS_CLI_VERSIONS[version]:
        _formatjs_cli_repo(
            name = repo_name,
            version = version,
            platform = "windows-x86_64",
            exec_compatible_with = [
                "@platforms//os:windows",
                "@platforms//cpu:x86_64",
            ],
            target_compatible_with = [],
        )
    else:
        _formatjs_cli_placeholder_repo(
            name = repo_name,
            platform = "windows-x86_64",
        )

    # Create the main toolchains repository with definitions for all platforms
    _formatjs_cli_toolchains_repo(
        name = name,
        user_repository_name = name,
    )

    # Register toolchains
    if register:
        native.register_toolchains("@{}//...".format(name))

# Export public versions of repository rules for use in module extensions
formatjs_cli_repo = _formatjs_cli_repo
formatjs_cli_toolchains_repo = _formatjs_cli_toolchains_repo

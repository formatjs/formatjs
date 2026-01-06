"""Module extension for configuring FormatJS CLI toolchains.

This module extension allows you to specify which version of the FormatJS CLI
to use in your Bazel workspace. The FormatJS CLI is a native binary (Rust-based)
that provides fast message extraction, compilation, and verification.

## Supported Versions

Available versions can be found in `repositories.bzl` under `FORMATJS_CLI_VERSIONS`.
The current default version is defined by `DEFAULT_VERSION`.

## Supported Platforms

Current binaries are available for:
- macOS Apple Silicon (darwin-arm64)
- Linux x86_64 (linux-x64)

Toolchain definitions also exist for future support:
- macOS Intel (darwin-x86_64)
- Linux aarch64 (linux-aarch64)
- Windows x86_64 (windows-x86_64)

## Usage

For most users, simply adding `rules_formatjs` as a dependency is sufficient:

```starlark
bazel_dep(name = "rules_formatjs", version = "1.0.0")
```

The toolchains are automatically registered and Bazel will select the appropriate
one for your platform.

### Advanced: Custom Version Selection

If you need to use a specific FormatJS CLI version different from the default,
you can configure it with the extension:

```starlark
formatjs_cli = use_extension("@rules_formatjs//formatjs_cli:extensions.bzl", "formatjs_cli")
formatjs_cli.toolchain(version = "0.1.1")
use_repo(
    formatjs_cli,
    "formatjs_cli_toolchains",
    "formatjs_cli_toolchains_darwin_arm64",
    "formatjs_cli_toolchains_darwin_x86_64",
    "formatjs_cli_toolchains_linux_x64",
    "formatjs_cli_toolchains_linux_aarch64",
    "formatjs_cli_toolchains_windows_x86_64",
)
register_toolchains("@formatjs_cli_toolchains//:all")
```

**Note**: This advanced configuration is only needed if you want to override the
default FormatJS CLI version. In most cases, using the default version provided
by `rules_formatjs` is recommended.
"""

load(":repositories.bzl", "DEFAULT_VERSION", "formatjs_cli_register_toolchains", "formatjs_cli_repo", "formatjs_cli_toolchains_repo")

def _formatjs_cli_toolchain_impl(module_ctx):
    """Module extension implementation for FormatJS CLI toolchains."""

    # Track which repositories we create
    direct_deps = []

    # Platform constraint mapping
    platform_constraints = {
        "darwin-arm64": ["@platforms//os:macos", "@platforms//cpu:arm64"],
        "darwin-x86_64": ["@platforms//os:macos", "@platforms//cpu:x86_64"],
        "linux-x64": ["@platforms//os:linux", "@platforms//cpu:x86_64"],
        "linux-aarch64": ["@platforms//os:linux", "@platforms//cpu:aarch64"],
        "windows-x86_64": ["@platforms//os:windows", "@platforms//cpu:x86_64"],
    }

    # Collect all toolchain calls
    for mod in module_ctx.modules:
        for toolchain in mod.tags.toolchain:
            name = toolchain.name if toolchain.name else "formatjs_cli_toolchains"
            version = toolchain.version if toolchain.version else DEFAULT_VERSION

            # Check if this is a custom configuration
            if toolchain.formatjs_repositories:
                # Custom configuration with formatjs_repositories
                # Format: key = "{version}.{platform}", value = "{url},{sha256}"
                for key, value in toolchain.formatjs_repositories.items():
                    # Parse key: "{version}.{platform}"
                    parts = key.rsplit(".", 1)
                    if len(parts) != 2:
                        fail("Invalid formatjs_repositories key '{}'. Expected format: '{{version}}.{{platform}}'".format(key))

                    repo_version, platform = parts[0], parts[1]

                    # Extract from list: [url, sha256]
                    if len(value) != 2:
                        fail("Invalid formatjs_repositories value for '{}'. Expected [url, sha256]".format(key))

                    url, sha256 = value[0], value[1]

                    if platform not in platform_constraints:
                        fail("Unsupported platform: {}. Must be one of: {}".format(
                            platform,
                            ", ".join(platform_constraints.keys()),
                        ))

                    # Create repository for this platform
                    platform_name = platform.replace("-", "_")
                    repo_name = "{}_{}".format(name, platform_name)

                    formatjs_cli_repo(
                        name = repo_name,
                        version = repo_version,
                        platform = platform,
                        url = url,
                        sha256 = sha256,
                        exec_compatible_with = platform_constraints[platform],
                        target_compatible_with = [],
                    )

                    direct_deps.append(repo_name)

                # Create the main toolchains repository for custom config
                formatjs_cli_toolchains_repo(
                    name = "{}_toolchains".format(name),
                    user_repository_name = name,
                )
                direct_deps.append("{}_toolchains".format(name))

            else:
                # Standard configuration using built-in versions
                formatjs_cli_register_toolchains(
                    name = name,
                    version = version,
                    register = False,
                )

                # Add standard repos to direct_deps
                direct_deps.extend([
                    name,
                    "{}_darwin_arm64".format(name),
                    "{}_darwin_x86_64".format(name),
                    "{}_linux_x64".format(name),
                    "{}_linux_aarch64".format(name),
                    "{}_windows_x86_64".format(name),
                ])

    return module_ctx.extension_metadata(
        root_module_direct_deps = direct_deps,
        root_module_direct_dev_deps = [],
    )

_toolchain = tag_class(
    attrs = {
        "name": attr.string(
            doc = """Name for this toolchain configuration.

            Used as a prefix for generated repositories. If not specified, defaults to "formatjs_cli_toolchains".
            For custom configurations, use a descriptive name like "formatjs_v0_1_0".

            Example:
            ```starlark
            formatjs_cli.toolchain(name = "formatjs_v0_1_0")
            ```
            """,
        ),
        "version": attr.string(
            doc = """Version of FormatJS CLI to use.

            If not specified, uses the default version: {}

            For built-in versions, see `FORMATJS_CLI_VERSIONS` in `repositories.bzl`.
            For custom binaries, specify any version string (e.g., "0.1.0", "0.1.3-rc1").

            Example:
            ```starlark
            formatjs_cli.toolchain(version = "0.1.2")
            ```
            """.format(DEFAULT_VERSION),
        ),
        "formatjs_repositories": attr.string_list_dict(
            doc = """Custom platform binaries configuration.

            Map keys use format "{version}.{platform}" and values are lists of [url, sha256].
            This allows specifying multiple platforms for a version.

            Example:
            ```starlark
            formatjs_repositories = {
                "0.1.0.darwin-arm64": [
                    "https://github.com/.../formatjs_cli-darwin-arm64",
                    "9b2c736b48cc65e763cf19ac7c190e527f9a8d4aa0798185e602f58becb99feb",
                ],
                "0.1.0.linux-x64": [
                    "https://github.com/.../formatjs_cli-linux-x64",
                    "884b9a41b9f6be649ea72277ebf22af0146043466d2ab94b28a57f95ffb7da1a",
                ],
            }
            ```

            Similar to rules_nodejs node_repositories pattern.
            """,
        ),
    },
)

formatjs_cli = module_extension(
    implementation = _formatjs_cli_toolchain_impl,
    tag_classes = {
        "toolchain": _toolchain,
    },
    doc = """Module extension for configuring FormatJS CLI toolchains.

    This extension manages the FormatJS CLI binary distribution across different
    platforms. The CLI is distributed as native binaries (no Node.js required) for
    fast execution and easy integration into Bazel builds.

    ## Features

    - **Version Selection**: Choose specific FormatJS CLI versions
    - **Multi-Platform**: Automatic platform detection across multiple architectures
    - **SHA256 Verification**: All binaries are verified with checksums
    - **No Node.js**: Native binaries for maximum performance
    - **Automatic Registration**: Toolchains are automatically registered when you
      add `rules_formatjs` as a dependency

    ## Basic Usage

    Most users don't need to interact with this extension directly. Simply add
    `rules_formatjs` as a dependency and the toolchains will be automatically
    configured:

    ```starlark
    bazel_dep(name = "rules_formatjs", version = "1.0.0")
    ```

    ## Advanced: Custom Version Selection

    If you need to override the default FormatJS CLI version, use this extension:

    ```starlark
    formatjs_cli = use_extension("@rules_formatjs//formatjs_cli:extensions.bzl", "formatjs_cli")
    formatjs_cli.toolchain(version = "0.1.1")
    use_repo(
        formatjs_cli,
        "formatjs_cli_toolchains",
        "formatjs_cli_toolchains_darwin_arm64",
        "formatjs_cli_toolchains_darwin_x86_64",
        "formatjs_cli_toolchains_linux_x64",
        "formatjs_cli_toolchains_linux_aarch64",
        "formatjs_cli_toolchains_windows_x86_64",
    )
    register_toolchains("@formatjs_cli_toolchains//:all")
    ```

    ## Advanced: Custom Platform Binaries

    If you need to use a custom binary for a specific platform (e.g., unreleased version,
    custom build, or older version not in the built-in list), configure custom platforms
    in a single toolchain call:

    ```starlark
    formatjs_cli = use_extension("@rules_formatjs//formatjs_cli:extensions.bzl", "formatjs_cli")

    # Configure custom binaries for version 0.1.0 (similar to rules_nodejs pattern)
    formatjs_cli.toolchain(
        name = "formatjs_v0_1_0",
        formatjs_repositories = {
            "0.1.0.darwin-arm64": [
                "https://github.com/formatjs/formatjs/releases/download/formatjs_cli_v0.1.0/formatjs_cli-darwin-arm64",
                "9b2c736b48cc65e763cf19ac7c190e527f9a8d4aa0798185e602f58becb99feb",
            ],
            "0.1.0.linux-x64": [
                "https://github.com/formatjs/formatjs/releases/download/formatjs_cli_v0.1.0/formatjs_cli-linux-x64",
                "884b9a41b9f6be649ea72277ebf22af0146043466d2ab94b28a57f95ffb7da1a",
            ],
        },
    )

    use_repo(
        formatjs_cli,
        "formatjs_cli_toolchains",
        "formatjs_v0_1_0_darwin_arm64",
        "formatjs_v0_1_0_linux_x64",
        "formatjs_v0_1_0_toolchains",
    )

    register_toolchains(
        "@formatjs_cli_toolchains//:all",
        "@formatjs_v0_1_0_toolchains//:all",
    )
    ```

    **formatjs_repositories** uses keys in `{version}.{platform}` format and values as `[url, sha256]` lists.
    Supported platforms: `darwin-arm64`, `darwin-x86_64`, `linux-x64`, `linux-aarch64`, `windows-x86_64`

    ## Version History

    - **0.1.2**: Latest version with native key sorting
    - **0.1.1**: Added key sorting support
    - **0.1.0**: Initial release

    ## Platform Support

    Bazel's toolchain resolution automatically selects the correct binary for your platform.

    **Binaries currently available for:**
    - **macOS Apple Silicon** (M1/M2/M3): darwin-arm64 binary
    - **Linux x86_64**: linux-x64 binary

    **Toolchain definitions exist for future support:**
    - **macOS Intel**: darwin-x86_64
    - **Linux aarch64**: linux-aarch64
    - **Windows x86_64**: windows-x86_64

    If your platform doesn't have a binary available yet, the build will fail with a clear
    error message. Contributions for additional platform binaries are welcome!

    ## See Also

    - `repositories.bzl`: Contains version definitions and checksums
    - `toolchain.bzl`: Toolchain implementation details
    """,
)

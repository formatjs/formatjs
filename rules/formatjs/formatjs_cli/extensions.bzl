"""Module extension for configuring FormatJS CLI toolchains.

This module extension allows you to specify which version of the FormatJS CLI
to use in your Bazel workspace. The FormatJS CLI is a native binary (Rust-based)
that provides fast message extraction, compilation, and verification.

## Supported Versions

Available versions can be found in `repositories.bzl` under `FORMATJS_CLI_VERSIONS`.
The current default version is defined by `DEFAULT_VERSION`.

## Supported Platforms

- macOS Apple Silicon (darwin-arm64)
- Linux x86_64 (linux-x64)

## Usage

In your `MODULE.bazel` file:

```starlark
# Use default version (recommended)
formatjs_cli = use_extension("@rules_formatjs//formatjs_cli:extensions.bzl", "formatjs_cli")
formatjs_cli.toolchain()
use_repo(formatjs_cli, "formatjs_cli_toolchains_darwin_arm64", "formatjs_cli_toolchains_linux_x64")

# Register the toolchains (required)
register_toolchains(
    "@formatjs_cli_toolchains_darwin_arm64//:toolchain",
    "@formatjs_cli_toolchains_linux_x64//:toolchain",
)

# Or specify a specific version
formatjs_cli.toolchain(version = "0.1.2")
```

**Note**: You must explicitly call `register_toolchains()` to make the FormatJS CLI
toolchains available for toolchain resolution. The extension creates the toolchain
repositories but does not automatically register them.
"""

load(":repositories.bzl", "DEFAULT_VERSION", "formatjs_cli_register_toolchains")

def _formatjs_cli_toolchain_impl(module_ctx):
    """Module extension implementation for FormatJS CLI toolchains."""

    # Collect all toolchain calls
    for mod in module_ctx.modules:
        for toolchain in mod.tags.toolchain:
            version = toolchain.version if toolchain.version else DEFAULT_VERSION
            formatjs_cli_register_toolchains(
                name = "formatjs_cli_toolchains",
                version = version,
                register = False,
            )

    return module_ctx.extension_metadata(
        root_module_direct_deps = [
            "formatjs_cli_toolchains_darwin_arm64",
            "formatjs_cli_toolchains_linux_x64",
        ],
        root_module_direct_dev_deps = [],
    )

_toolchain = tag_class(
    attrs = {
        "version": attr.string(
            doc = """Version of FormatJS CLI to use.

            If not specified, uses the default version: {}

            Available versions:
            - 0.1.2 (latest, with native key sorting)
            - 0.1.1 (supports key sorting via CLI flag)
            - 0.1.0 (initial release)

            Example:
            ```starlark
            formatjs_cli.toolchain(version = "0.1.2")
            ```

            To see all available versions and their checksums, check the
            `FORMATJS_CLI_VERSIONS` dictionary in `repositories.bzl`.
            """.format(DEFAULT_VERSION),
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
    - **Multi-Platform**: Automatic platform detection (macOS arm64, Linux x64)
    - **SHA256 Verification**: All binaries are verified with checksums
    - **No Node.js**: Native binaries for maximum performance

    ## Default Behavior

    When you add `rules_formatjs` to your MODULE.bazel, you need to configure the extension
    and register the toolchains. The extension defaults to the latest CLI version.

    ## Custom Version

    To use a specific CLI version:

    ```starlark
    formatjs_cli = use_extension("@rules_formatjs//formatjs_cli:extensions.bzl", "formatjs_cli")
    formatjs_cli.toolchain(version = "0.1.1")  # Use specific version
    use_repo(formatjs_cli, "formatjs_cli_toolchains_darwin_arm64", "formatjs_cli_toolchains_linux_x64")

    # Must explicitly register toolchains
    register_toolchains(
        "@formatjs_cli_toolchains_darwin_arm64//:toolchain",
        "@formatjs_cli_toolchains_linux_x64//:toolchain",
    )
    ```

    ## Version History

    - **0.1.2**: Latest version with native key sorting
    - **0.1.1**: Added key sorting support
    - **0.1.0**: Initial release

    ## Platform Support

    The extension automatically selects the correct binary for your platform:
    - **macOS Apple Silicon** (M1/M2/M3): darwin-arm64 binary
    - **Linux x86_64**: linux-x64 binary

    If your platform is not supported, the build will fail with a clear error message
    listing available platforms.

    ## See Also

    - `repositories.bzl`: Contains version definitions and checksums
    - `toolchain.bzl`: Toolchain implementation details
    """,
)

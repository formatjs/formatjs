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
            "formatjs_cli_toolchains",
            "formatjs_cli_toolchains_darwin_arm64",
            "formatjs_cli_toolchains_darwin_x86_64",
            "formatjs_cli_toolchains_linux_x64",
            "formatjs_cli_toolchains_linux_aarch64",
            "formatjs_cli_toolchains_windows_x86_64",
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

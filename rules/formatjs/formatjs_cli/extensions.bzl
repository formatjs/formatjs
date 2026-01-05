"""Module extension for FormatJS CLI toolchains."""

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
            doc = "Version of FormatJS CLI to use (default: {})".format(DEFAULT_VERSION),
        ),
    },
)

formatjs_cli = module_extension(
    implementation = _formatjs_cli_toolchain_impl,
    tag_classes = {
        "toolchain": _toolchain,
    },
)

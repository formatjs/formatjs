"""FormatJS CLI toolchain implementation."""

FormatjsCliToolchainInfo = provider(
    doc = "Information about the FormatJS CLI toolchain",
    fields = {
        "cli": "The FormatJS CLI executable",
        "cli_path": "Path to the FormatJS CLI executable",
    },
)

def _formatjs_cli_toolchain_impl(ctx):
    """Implementation of formatjs_cli_toolchain rule."""
    toolchain_info = platform_common.ToolchainInfo(
        formatjs_cli_info = FormatjsCliToolchainInfo(
            cli = ctx.executable.cli,
            cli_path = ctx.executable.cli.path,
        ),
    )
    return [toolchain_info]

formatjs_cli_toolchain = rule(
    implementation = _formatjs_cli_toolchain_impl,
    attrs = {
        "cli": attr.label(
            mandatory = True,
            executable = True,
            cfg = "exec",
            doc = "The FormatJS CLI executable",
        ),
    },
    doc = "Defines a FormatJS CLI toolchain",
)

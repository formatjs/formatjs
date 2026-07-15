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

def _formatjs_cli_executable_impl(ctx):
    """Expose the selected FormatJS CLI as an executable target."""
    formatjs_cli = ctx.toolchains["@rules_formatjs//formatjs_cli:toolchain_type"].formatjs_cli_info.cli
    extension = ".exe" if formatjs_cli.basename.endswith(".exe") else ""
    executable = ctx.actions.declare_file(ctx.label.name + extension)

    ctx.actions.symlink(
        output = executable,
        target_file = formatjs_cli,
        is_executable = True,
    )

    return [DefaultInfo(
        executable = executable,
        runfiles = ctx.runfiles(files = [formatjs_cli]),
    )]

formatjs_cli_executable = rule(
    implementation = _formatjs_cli_executable_impl,
    executable = True,
    toolchains = ["@rules_formatjs//formatjs_cli:toolchain_type"],
    doc = "Exposes the FormatJS CLI selected by the toolchain as an executable target",
)

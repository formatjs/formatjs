"""Rules for compiling messages using FormatJS CLI"""

def _formatjs_compile_impl(ctx):
    """Implementation of formatjs_compile rule."""
    # Get FormatJS CLI from toolchain
    toolchain = ctx.toolchains["@rules_formatjs//formatjs_cli:toolchain_type"]
    formatjs_cli_info = toolchain.formatjs_cli_info

    out_file = ctx.outputs.out

    # Build arguments
    args = ctx.actions.args()
    args.add("compile")
    args.add(ctx.file.src)
    args.add("--out-file", out_file)
    args.add("--format", ctx.attr.format)

    if ctx.attr.ast:
        args.add("--ast")

    ctx.actions.run(
        executable = formatjs_cli_info.cli,
        arguments = [args],
        inputs = [ctx.file.src],
        outputs = [out_file],
        mnemonic = "FormatjsCompile",
        progress_message = "Compiling messages for %{label}",
        env = {
            "BAZEL_BINDIR": ".",
        },
    )

    return [DefaultInfo(files = depset([out_file]))]

formatjs_compile = rule(
    implementation = _formatjs_compile_impl,
    doc = """Compile extracted messages into optimized formats.

    This rule compiles FormatJS message files into optimized runtime formats,
    optionally as AST for faster parsing at runtime.

    Example:
        ```starlark
        formatjs_compile(
            name = "messages_compiled",
            src = "messages.json",
            ast = True,
        )
        ```
    """,
    attrs = {
        "src": attr.label(
            allow_single_file = [".json"],
            mandatory = True,
            doc = "Source JSON file with extracted messages",
        ),
        "out": attr.output(
            mandatory = True,
            doc = "Output compiled JSON file",
        ),
        "ast": attr.bool(
            default = False,
            doc = "Whether to compile to AST format for faster runtime parsing",
        ),
        "format": attr.string(
            default = "simple",
            values = ["simple", "crowdin", "smartling", "transifex"],
            doc = "Input format of the source file",
        ),
    },
    toolchains = ["@rules_formatjs//formatjs_cli:toolchain_type"],
)

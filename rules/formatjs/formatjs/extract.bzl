"""Rules for extracting messages from source files using @formatjs/cli"""

FormatjsExtractInfo = provider(
    doc = "Information about extracted FormatJS messages",
    fields = {
        "messages": "File containing extracted messages in JSON format",
        "srcs": "depset of source files that were extracted from",
        "id_interpolation_pattern": "Pattern used for message ID generation",
    },
)

def _formatjs_extract_impl(ctx):
    """Implementation of the formatjs_extract rule."""

    # Determine output file
    if ctx.attr.out:
        out_file = ctx.actions.declare_file(ctx.attr.out)
    else:
        out_file = ctx.actions.declare_file(ctx.label.name + ".json")

    # Build arguments for formatjs CLI
    args = ctx.actions.args()
    args.add("extract")
    args.add_all(ctx.files.srcs)
    args.add("--out-file", out_file)
    args.add("--format", "simple")

    if ctx.attr.id_interpolation_pattern:
        args.add("--id-interpolation-pattern", ctx.attr.id_interpolation_pattern)

    if ctx.attr.extract_from_format_message_call:
        args.add("--extract-from-format-message-call")

    for component in ctx.attr.additional_component_names:
        args.add("--additional-component-names", component)

    for function in ctx.attr.additional_function_names:
        args.add("--additional-function-names", function)

    # Run formatjs extract
    ctx.actions.run(
        executable = ctx.executable.formatjs_cli,
        arguments = [args],
        inputs = depset(ctx.files.srcs),
        outputs = [out_file],
        mnemonic = "FormatjsExtract",
        progress_message = "Extracting messages from %{label}",
        env = {
            "BAZEL_BINDIR": ".",
        },
    )

    return [
        DefaultInfo(files = depset([out_file])),
        FormatjsExtractInfo(
            messages = out_file,
            srcs = depset(ctx.files.srcs),
            id_interpolation_pattern = ctx.attr.id_interpolation_pattern,
        ),
    ]

_formatjs_extract_rule = rule(
    implementation = _formatjs_extract_impl,
    doc = """Extract messages from source files using @formatjs/cli.

    This rule extracts internationalized messages from TypeScript, JavaScript, JSX, and TSX files.
    It produces a JSON file containing all extracted messages with their IDs, default messages,
    and descriptions.

    Aspects can be attached to this rule to perform additional analysis or transformations
    on the extracted messages or their source files.

    Example:
        ```starlark
        formatjs_extract(
            name = "messages",
            srcs = glob(["src/**/*.tsx"]),
            id_interpolation_pattern = "[sha512:contenthash:base64:6]",
            extract_from_format_message_call = True,
        )
        ```
    """,
    attrs = {
        "srcs": attr.label_list(
            allow_files = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"],
            doc = "Source files to extract messages from",
            mandatory = True,
        ),
        "out": attr.string(
            doc = "Output file name (defaults to target name + '.json')",
        ),
        "id_interpolation_pattern": attr.string(
            doc = """Pattern for generating message IDs.
            Example: '[sha512:contenthash:base64:6]' for content-based IDs""",
        ),
        "extract_from_format_message_call": attr.bool(
            default = False,
            doc = "Extract messages from formatMessage() function calls",
        ),
        "additional_component_names": attr.string_list(
            default = [],
            doc = "Additional React component names to extract messages from",
        ),
        "additional_function_names": attr.string_list(
            default = [],
            doc = "Additional function names to extract messages from",
        ),
        "deps": attr.label_list(
            default = [],
            doc = "Dependencies that this extraction depends on (for aspect propagation)",
            providers = [[FormatjsExtractInfo], [DefaultInfo]],
        ),
        "formatjs_cli": attr.label(
            mandatory = True,
            executable = True,
            cfg = "exec",
            doc = "The formatjs CLI tool (typically @npm//@formatjs/cli/bin:formatjs)",
        ),
    },
)

def formatjs_extract(formatjs_cli = "@npm//@formatjs/cli/bin:formatjs", **kwargs):
    """Macro wrapper for _formatjs_extract_rule that sets formatjs_cli from caller's context.

    Args:
        formatjs_cli: Label for the formatjs CLI tool. Defaults to @npm//@formatjs/cli/bin:formatjs
        **kwargs: All other arguments are passed to the underlying rule
    """
    _formatjs_extract_rule(
        formatjs_cli = formatjs_cli,
        **kwargs
    )

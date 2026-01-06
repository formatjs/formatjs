"""Rules for compiling messages into optimized runtime formats.

This module provides the `formatjs_compile` rule for compiling extracted message
files into optimized formats for use at runtime. The compilation process can
optionally generate AST (Abstract Syntax Tree) format for faster parsing and
reduced bundle size in production applications.

Compiled messages are optimized for runtime performance and can be used directly
with react-intl or other FormatJS libraries.

For more information about the FormatJS CLI and its compilation features, see:
https://formatjs.github.io/docs/tooling/cli
"""

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
    doc = """Compile extracted messages into optimized runtime formats.

    This rule compiles FormatJS message files (typically from `formatjs_extract` or
    translation files) into optimized formats suitable for production use. The compilation
    process pre-parses messages and can generate AST format for faster runtime performance.

    ## Features

    - **AST Compilation**: Pre-parse messages into AST for faster runtime evaluation
    - **Multiple Input Formats**: Support for simple, Crowdin, Smartling, and Transifex formats
    - **Optimized Output**: Reduces bundle size and improves runtime performance
    - **Toolchain Support**: Uses native FormatJS CLI for fast compilation

    ## Benefits of AST Compilation

    When `ast = True`, messages are pre-parsed into Abstract Syntax Tree format:
    - **Faster Runtime**: No parsing overhead when formatting messages
    - **Smaller Bundles**: Parser code not needed in your application
    - **Better Performance**: Especially beneficial for complex ICU MessageFormat strings

    ## Examples

    ### Basic compilation:
    ```starlark
    formatjs_compile(
        name = "messages_compiled",
        src = ":messages",  # from formatjs_extract
        out = "messages.json",
    )
    ```

    ### Compile with AST for production:
    ```starlark
    formatjs_compile(
        name = "messages_prod",
        src = "translations/en.json",
        out = "compiled-en.json",
        ast = True,
    )
    ```

    ### Compile translation files from Crowdin:
    ```starlark
    formatjs_compile(
        name = "fr_messages",
        src = "translations/fr.json",
        out = "compiled-fr.json",
        format = "crowdin",
        ast = True,
    )
    ```

    ## Output

    The compiled messages can be imported directly in your application:
    ```javascript
    import messages from './compiled-en.json';

    <IntlProvider messages={messages} locale="en">
      <App />
    </IntlProvider>
    ```

    ## See Also

    - `formatjs_extract`: Extract messages from source files
    - `formatjs_verify_test`: Verify translations before compilation
    - FormatJS CLI documentation: https://formatjs.github.io/docs/tooling/cli
    """,
    attrs = {
        "src": attr.label(
            allow_single_file = [".json"],
            mandatory = True,
            doc = """Source JSON file with extracted messages.

            This can be:
            - Output from `formatjs_extract` rule
            - Translation file from translators
            - Aggregated messages from `formatjs_aggregate`

            The file should contain messages in FormatJS JSON format.
            """,
        ),
        "out": attr.output(
            mandatory = True,
            doc = """Output compiled JSON file name.

            Example: `out = "messages-compiled.json"`

            The compiled file will be placed in the bazel-bin directory and can be
            referenced by other rules or copied to your output directory.
            """,
        ),
        "ast": attr.bool(
            default = False,
            doc = """Compile to AST (Abstract Syntax Tree) format for faster runtime parsing.

            When enabled, messages are pre-parsed into an optimized AST representation:
            - Faster message formatting at runtime
            - Smaller JavaScript bundles (parser not needed)
            - Ideal for production builds

            Recommended: Enable for production, disable for development for easier debugging.
            """,
        ),
        "format": attr.string(
            default = "simple",
            values = ["simple", "crowdin", "smartling", "transifex"],
            doc = """Input format of the source file.

            Supported formats:
            - `simple`: Standard FormatJS JSON format (default)
            - `crowdin`: Crowdin translation platform format
            - `smartling`: Smartling translation platform format
            - `transifex`: Transifex translation platform format

            Use the appropriate format based on your translation management system.
            """,
        ),
    },
    toolchains = ["@rules_formatjs//formatjs_cli:toolchain_type"],
)

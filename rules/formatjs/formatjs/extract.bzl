"""Rules for extracting internationalized messages from source files.

This module provides the `formatjs_extract` rule for extracting messages from
TypeScript, JavaScript, JSX, and TSX files using the FormatJS CLI. The extracted
messages are output in JSON format with automatic key sorting.

The FormatJS CLI supports various message formats including:
- `<FormattedMessage>` components
- `intl.formatMessage()` calls (with `extract_from_format_message_call = True`)
- Custom component names (via `additional_component_names`)
- Custom function names (via `additional_function_names`)

Message IDs can be automatically generated using content-based hashing patterns,
ensuring consistent IDs across your codebase.
"""

FormatjsExtractInfo = provider(
    doc = """Provider containing information about extracted FormatJS messages.

    This provider is returned by the `formatjs_extract` rule and can be used by
    aspects or other rules to access the extracted messages and metadata.
    """,
    fields = {
        "messages": "File containing extracted messages in JSON format with sorted keys",
        "srcs": "depset of source files that were extracted from",
        "id_interpolation_pattern": "Pattern used for message ID generation (e.g., '[sha512:contenthash:base64:6]')",
    },
)

def _formatjs_extract_impl(ctx):
    """Implementation of the formatjs_extract rule."""

    # Get FormatJS CLI from toolchain
    toolchain = ctx.toolchains["@rules_formatjs//formatjs_cli:toolchain_type"]
    formatjs_cli_info = toolchain.formatjs_cli_info

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

    if ctx.attr.id_interpolation_pattern:
        args.add("--id-interpolation-pattern", ctx.attr.id_interpolation_pattern)

    if ctx.attr.extract_from_format_message_call:
        args.add("--extract-from-format-message-call")

    for component in ctx.attr.additional_component_names:
        args.add("--additional-component-names", component)

    for function in ctx.attr.additional_function_names:
        args.add("--additional-function-names", function)

    # Run formatjs extract (v0.1.1+ sorts keys by default)
    ctx.actions.run(
        executable = formatjs_cli_info.cli,
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

formatjs_extract = rule(
    implementation = _formatjs_extract_impl,
    doc = """Extract internationalized messages from source files using FormatJS CLI.

    This rule extracts i18n messages from TypeScript, JavaScript, JSX, and TSX files
    using the native FormatJS CLI toolchain. The extracted messages are output as a
    JSON file with alphabetically sorted keys for deterministic builds.

    ## Features

    - **Automatic ID Generation**: Use content-based hashing to generate stable message IDs
    - **Multiple Formats**: Extract from `<FormattedMessage>` components, `formatMessage()` calls, and custom components
    - **Sorted Output**: Keys are automatically sorted alphabetically (formatjs_cli v0.1.1+)
    - **Toolchain Support**: Uses native FormatJS CLI binaries for fast extraction

    ## Message Format

    The output JSON file contains messages in the format:
    ```json
    {
      "message.id": {
        "id": "message.id",
        "defaultMessage": "Hello, world!",
        "description": "Greeting message"
      }
    }
    ```

    ## Examples

    ### Basic extraction with auto-generated IDs:
    ```starlark
    formatjs_extract(
        name = "messages",
        srcs = glob(["src/**/*.tsx"]),
        id_interpolation_pattern = "[sha512:contenthash:base64:6]",
    )
    ```

    ### Extract from formatMessage() calls:
    ```starlark
    formatjs_extract(
        name = "messages",
        srcs = ["src/app.tsx"],
        extract_from_format_message_call = True,
    )
    ```

    ### Custom components and functions:
    ```starlark
    formatjs_extract(
        name = "messages",
        srcs = glob(["src/**/*.tsx"]),
        additional_component_names = ["Trans", "Translate"],
        additional_function_names = ["t", "$t"],
    )
    ```

    ## Output

    The rule produces a JSON file (default: `<name>.json`) containing all extracted
    messages. This file can be used with `formatjs_compile` to generate compiled
    message catalogs or with `formatjs_aggregate` to merge messages from multiple
    targets.

    ## See Also

    - `formatjs_compile`: Compile messages for runtime use
    - `formatjs_aggregate`: Merge messages from multiple extraction targets
    - `formatjs_verify_test`: Verify translation files against extracted messages
    """,
    attrs = {
        "srcs": attr.label_list(
            allow_files = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"],
            doc = """Source files to extract messages from.

            Supports TypeScript (.ts, .tsx), JavaScript (.js, .jsx), and ES modules (.mjs, .cjs).
            Use glob patterns to extract from multiple files:
            ```starlark
            srcs = glob(["src/**/*.{ts,tsx}"])
            ```
            """,
            mandatory = True,
        ),
        "out": attr.string(
            doc = """Output file name (optional).

            If not specified, defaults to `<target_name>.json`.
            Example: `out = "extracted-messages.json"`
            """,
        ),
        "id_interpolation_pattern": attr.string(
            doc = """Pattern for generating message IDs automatically.

            Uses content-based hashing to generate stable, unique IDs. Common patterns:
            - `[sha512:contenthash:base64:6]` - 6-char base64-encoded SHA-512 hash
            - `[sha256:contenthash:hex:8]` - 8-char hex-encoded SHA-256 hash
            - `[contenthash:5]` - 5-char hash (default algorithm)

            If not specified, messages must provide explicit `id` attributes.
            """,
        ),
        "extract_from_format_message_call": attr.bool(
            default = False,
            doc = """Extract messages from `intl.formatMessage()` function calls.

            When enabled, the extractor will process imperative formatMessage calls
            in addition to declarative `<FormattedMessage>` components.

            Example code that will be extracted:
            ```javascript
            const msg = intl.formatMessage({
              id: "greeting",
              defaultMessage: "Hello {name}",
              description: "Greeting message"
            });
            ```
            """,
        ),
        "additional_component_names": attr.string_list(
            default = [],
            doc = """Additional React component names to extract messages from.

            Allows extraction from custom wrapper components that use FormatJS internally.
            Example: `additional_component_names = ["Trans", "LocalizedText"]`

            The components should accept FormatJS-compatible props like `id`, `defaultMessage`,
            and `description`.
            """,
        ),
        "additional_function_names": attr.string_list(
            default = [],
            doc = """Additional function names to extract messages from.

            Allows extraction from custom wrapper functions that use FormatJS internally.
            Example: `additional_function_names = ["t", "$t", "i18n"]`

            The functions should accept FormatJS-compatible message descriptors.
            """,
        ),
        "deps": attr.label_list(
            default = [],
            doc = """Dependencies that this extraction depends on (for aspect propagation).

            Used when applying aspects that need to traverse the dependency graph.
            Typically not needed for basic extraction workflows.
            """,
            providers = [[FormatjsExtractInfo], [DefaultInfo]],
        ),
    },
    toolchains = ["@rules_formatjs//formatjs_cli:toolchain_type"],
)

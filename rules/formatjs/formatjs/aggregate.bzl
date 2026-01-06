"""Rules and aspects for aggregating messages across dependency trees.

This module provides tools for merging extracted messages from multiple targets
and their dependencies into a single, consolidated JSON file. This is useful for
large monorepo projects where messages are extracted from multiple packages or
modules and need to be combined for translation or compilation.

## Platform Support

These rules work across all platforms supported by the jq.bzl toolchain:
- macOS (Apple Silicon and Intel)
- Linux (x86_64 and aarch64)
- Windows (x86_64)

Bazel automatically selects the appropriate jq binary for your platform through
the toolchain resolution system. No platform-specific configuration is needed.

## Aggregation Process

1. Traverses the dependency graph collecting all extracted message files
2. Merges messages using jq with object multiplication semantics
3. Sorts keys alphabetically for deterministic output
4. Handles duplicate message IDs (later values override earlier ones)

## Usage Patterns

Aggregation can be used via:
- `formatjs_aggregate` rule: Declarative approach for common use cases
- `formatjs_aggregate_aspect`: Aspect-based approach for advanced scenarios

## Dependencies

This module depends on:
- `jq.bzl` toolchain for JSON merging and sorting operations
- `FormatjsExtractInfo` provider from extract.bzl for message collection
"""

load(":extract.bzl", "FormatjsExtractInfo")

FormatjsAggregateInfo = provider(
    doc = """Provider containing aggregated messages from multiple targets.

    This provider is returned by both the `formatjs_aggregate` rule and the
    `formatjs_aggregate_aspect`. It contains the collected message files and
    metadata about the aggregation.
    """,
    fields = {
        "messages": "depset of message JSON files collected from the target and its dependencies",
        "count": "Number of message files collected (integer)",
    },
)

def _formatjs_aggregate_aspect_impl(target, ctx):
    """Aspect implementation that collects messages from dependencies.

    This aspect traverses the dependency graph and collects all FormatjsExtractInfo
    providers, aggregating their message files.
    """

    messages = []

    # Collect from this target if it provides FormatjsExtractInfo
    if FormatjsExtractInfo in target:
        messages.append(target[FormatjsExtractInfo].messages)

    # Collect from dependencies
    if hasattr(ctx.rule.attr, "deps"):
        for dep in ctx.rule.attr.deps:
            if FormatjsAggregateInfo in dep:
                messages.extend(dep[FormatjsAggregateInfo].messages.to_list())

    if hasattr(ctx.rule.attr, "srcs"):
        for src in ctx.rule.attr.srcs:
            if FormatjsAggregateInfo in src:
                messages.extend(src[FormatjsAggregateInfo].messages.to_list())

    # Create merged file if we have messages
    merged_file = None
    if messages:
        # Create a unique name for the merged file
        merged_file = ctx.actions.declare_file(
            ctx.label.name + "_aggregated_messages.json",
        )

        # Build jq command to merge all JSON files with sorted top-level keys only
        jq_toolchain = ctx.toolchains["@jq.bzl//jq/toolchain:type"]

        args = ctx.actions.args()
        args.add("-s")  # slurp mode
        args.add("reduce .[] as $item ({}; . * $item) | to_entries | sort_by(.key) | from_entries")
        args.add_all(messages)

        ctx.actions.run_shell(
            command = '"{jq}" "$@" > "{output}"'.format(
                jq = jq_toolchain.jqinfo.bin.path,
                output = merged_file.path,
            ),
            arguments = [args],
            inputs = depset(messages),
            outputs = [merged_file],
            tools = [jq_toolchain.jqinfo.bin],
            mnemonic = "AggregateMessages",
            progress_message = "Aggregating %d message files for %s" % (len(messages), ctx.label),
        )

    return [
        FormatjsAggregateInfo(
            messages = depset(messages),
            count = len(messages),
        ),
        OutputGroupInfo(
            aggregated_messages = depset([merged_file]) if merged_file else depset(),
            all_messages = depset(messages),
        ),
    ]

formatjs_aggregate_aspect = aspect(
    implementation = _formatjs_aggregate_aspect_impl,
    attr_aspects = ["deps", "srcs"],
    toolchains = ["@jq.bzl//jq/toolchain:type"],
    doc = """Aspect that aggregates extracted messages across dependency graphs.

    This aspect provides a powerful way to collect and merge FormatJS messages from
    a target and all its transitive dependencies. It automatically traverses the
    dependency graph, collecting messages from any target that provides `FormatjsExtractInfo`.

    ## Platform Support

    Works across all platforms through Bazel's toolchain resolution:
    - macOS (Apple Silicon and Intel)
    - Linux (x86_64 and aarch64)
    - Windows (x86_64)

    The jq.bzl toolchain automatically provides the correct binary for your platform.

    ## How It Works

    The aspect:
    1. Attaches to targets via `deps` and `srcs` attributes
    2. Collects message files from targets with `FormatjsExtractInfo`
    3. Recursively collects from dependencies
    4. Merges all messages into a single JSON file using jq
    5. Sorts keys alphabetically for deterministic builds

    ## Merge Strategy

    Messages are merged using jq's object multiplication (`*`) operator:
    - Later values override earlier ones for duplicate message IDs
    - All unique message IDs are preserved
    - Sorted alphabetically by key in the final output
    - Ensures deterministic output across all platforms

    ## Usage Patterns

    ### Basic aspect usage - aggregate all messages:
    ```bash
    bazel build //app:main \\
        --aspects=@rules_formatjs//formatjs:aggregate.bzl%formatjs_aggregate_aspect \\
        --output_groups=aggregated_messages
    ```

    ### Get individual message files (not merged):
    ```bash
    bazel build //app:main \\
        --aspects=@rules_formatjs//formatjs:aggregate.bzl%formatjs_aggregate_aspect \\
        --output_groups=all_messages
    ```

    ## Output Groups

    - `aggregated_messages`: Single merged JSON file with all messages
    - `all_messages`: All individual message JSON files (not merged)

    The aggregated file will be named: `<target_name>_aggregated_messages.json`

    ## Cross-Platform Considerations

    - JSON output is identical across all platforms (UTF-8, sorted keys)
    - jq binary is automatically selected for your build platform
    - No platform-specific configuration needed in BUILD files
    """,
)

def _formatjs_aggregate_impl(ctx):
    """Implementation of the formatjs_aggregate rule.

    This rule takes extract targets as deps. The formatjs_aggregate_aspect (attached to deps)
    traverses the dependency graph and provides FormatjsAggregateInfo with all collected messages.
    This rule then merges those messages into a single JSON file.
    """

    # Collect all messages from dependencies via the aspect
    # The aspect runs on each dep and provides FormatjsAggregateInfo
    all_messages = []
    for dep in ctx.attr.deps:
        if FormatjsAggregateInfo in dep:
            # Get the messages collected by the aspect
            all_messages.extend(dep[FormatjsAggregateInfo].messages.to_list())
        else:
            fail("Dependency %s does not provide FormatjsAggregateInfo. " % dep.label +
                 "Make sure the formatjs_aggregate_aspect is applied (this should happen automatically).")

    if not all_messages:
        fail("No messages found in dependencies. Make sure deps contain formatjs_extract targets.")

    # Create the final aggregated output file
    output = ctx.outputs.out or ctx.actions.declare_file(ctx.attr.name + ".json")

    # Use jq to merge all messages and sort keys
    jq_toolchain = ctx.toolchains["@jq.bzl//jq/toolchain:type"]

    # Build jq command with sorted top-level keys only
    args = ctx.actions.args()
    args.add("-s")  # slurp mode
    args.add("reduce .[] as $item ({}; . * $item) | to_entries | sort_by(.key) | from_entries")
    args.add_all(all_messages)

    ctx.actions.run_shell(
        command = '"{jq}" "$@" > "{output}"'.format(
            jq = jq_toolchain.jqinfo.bin.path,
            output = output.path,
        ),
        arguments = [args],
        inputs = depset(all_messages),
        outputs = [output],
        tools = [jq_toolchain.jqinfo.bin],
        mnemonic = "AggregateFormatjsMessages",
        progress_message = "Aggregating %d message files into %s" % (len(all_messages), output.short_path),
    )

    return [
        DefaultInfo(files = depset([output])),
        FormatjsAggregateInfo(
            messages = depset(all_messages),
            count = len(all_messages),
        ),
    ]

formatjs_aggregate = rule(
    implementation = _formatjs_aggregate_impl,
    attrs = {
        "out": attr.output(
            doc = "Output file for the aggregated messages (JSON format). Defaults to <name>.json",
        ),
        "deps": attr.label_list(
            doc = """Dependencies to aggregate messages from.

            Should be `formatjs_extract` targets or other targets that provide
            `FormatjsExtractInfo`. The rule will automatically apply the
            `formatjs_aggregate_aspect` to traverse the entire dependency graph
            and collect all messages.

            Example:
            ```starlark
            deps = [
                "//frontend:messages",
                "//backend:messages",
                "//shared:messages",
            ]
            ```
            """,
            aspects = [formatjs_aggregate_aspect],
        ),
    },
    toolchains = ["@jq.bzl//jq/toolchain:type"],
    doc = """Aggregate messages from multiple extraction targets into a single file.

    This rule provides a declarative way to merge messages from multiple `formatjs_extract`
    targets across your codebase. It's ideal for monorepos where messages are extracted
    from different packages or modules and need to be combined for translation workflows.

    ## Platform Support

    Works seamlessly across all platforms through Bazel's toolchain resolution:
    - macOS (Apple Silicon and Intel)
    - Linux (x86_64 and aarch64)
    - Windows (x86_64)

    The jq.bzl toolchain automatically provides the correct binary for your build platform.
    No platform-specific configuration is required in BUILD files.

    ## Features

    - **Automatic Traversal**: Automatically applies aspect to collect messages from dependencies
    - **Transitive Collection**: Gathers messages from the entire dependency graph
    - **Merge & Sort**: Merges all messages and sorts keys alphabetically
    - **Duplicate Handling**: Later values override earlier ones for duplicate message IDs
    - **Simple API**: Just list your extraction targets as deps
    - **Cross-Platform**: Identical output across all platforms (UTF-8, sorted keys)

    ## How It Works

    1. The rule attaches `formatjs_aggregate_aspect` to all `deps`
    2. The aspect traverses the dependency graph collecting message files
    3. All collected messages are merged using jq
    4. Keys are sorted alphabetically for deterministic output
    5. Result is written to `<name>.json`

    ## Use Cases

    ### Monorepo with multiple packages:
    ```starlark
    # Package 1 - Frontend
    formatjs_extract(
        name = "frontend_messages",
        srcs = glob(["frontend/**/*.tsx"]),
    )

    # Package 2 - Backend
    formatjs_extract(
        name = "backend_messages",
        srcs = glob(["backend/**/*.tsx"]),
    )

    # Aggregate all messages
    formatjs_aggregate(
        name = "all_messages",
        deps = [
            ":frontend_messages",
            ":backend_messages",
        ],
    )
    ```

    ### Multi-module application:
    ```starlark
    formatjs_aggregate(
        name = "app_messages",
        deps = [
            "//modules/auth:messages",
            "//modules/dashboard:messages",
            "//modules/settings:messages",
            "//modules/admin:messages",
        ],
    )
    ```

    ### Nested aggregation:
    ```starlark
    # Aggregate messages per feature
    formatjs_aggregate(
        name = "feature_a_messages",
        deps = [
            "//features/a/component1:messages",
            "//features/a/component2:messages",
        ],
    )

    # Aggregate all features
    formatjs_aggregate(
        name = "all_features",
        deps = [
            ":feature_a_messages",
            "//features/b:messages",
            "//features/c:messages",
        ],
    )
    ```

    ## Output

    The rule produces a JSON file named `<target_name>.json` in bazel-bin:
    ```bash
    bazel build //:all_messages
    # Output: bazel-bin/all_messages.json
    ```

    The output format is standard FormatJS JSON:
    ```json
    {
      "app.auth.login": {
        "id": "app.auth.login",
        "defaultMessage": "Log in",
        "description": "Login button"
      },
      "app.dashboard.welcome": {
        "id": "app.dashboard.welcome",
        "defaultMessage": "Welcome back!",
        "description": "Dashboard greeting"
      }
    }
    ```

    ## Duplicate Message IDs

    If the same message ID appears in multiple sources, the last one wins:
    - Messages are merged in the order they appear in the dependency graph
    - Later definitions override earlier ones
    - This allows for intentional overrides (e.g., customizing messages per module)

    ## Usage in Translation Workflow

    ```starlark
    # 1. Aggregate all messages
    formatjs_aggregate(
        name = "source_messages",
        deps = ["//..."],  # All extraction targets
    )

    # 2. Verify translations
    formatjs_verify_test(
        name = "verify_translations",
        translations = [
            ":source_messages",
            "translations/fr.json",
            "translations/de.json",
        ],
    )

    # 3. Compile for production
    formatjs_compile(
        name = "compiled_fr",
        src = "translations/fr.json",
        out = "compiled-fr.json",
        ast = True,
    )
    ```

    ## Cross-Platform Builds

    The aggregation process produces identical output across all platforms:
    - JSON is UTF-8 encoded with consistent line endings
    - Keys are sorted alphabetically for deterministic output
    - Checksums match across macOS, Linux, and Windows builds
    - Remote caching works seamlessly across heterogeneous build fleets

    This ensures that:
    - CI builds are reproducible regardless of runner platform
    - Developers on different OS can share build artifacts
    - Remote execution works with mixed execution platforms

    ## See Also

    - `formatjs_extract`: Extract messages from source files
    - `formatjs_aggregate_aspect`: Lower-level aspect for advanced use cases
    - `formatjs_verify_test`: Verify translations against aggregated messages
    - `formatjs_compile`: Compile aggregated messages for production
    """,
)

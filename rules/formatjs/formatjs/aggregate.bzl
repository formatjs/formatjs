"""Aspect for aggregating extracted messages across dependency trees

This aspect collects all extracted messages from a target and its dependencies,
merging them into a single JSON file.
"""

load(":extract.bzl", "FormatjsExtractInfo")

FormatjsAggregateInfo = provider(
    doc = "Aggregated messages from a target and its dependencies",
    fields = {
        "messages": "depset of message JSON files",
        "count": "Number of message files collected",
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
    doc = """Aspect that aggregates extracted messages across dependencies.

    This aspect collects all FormatJS extracted message files from a target and
    its transitive dependencies, merging them into a single JSON file using jq.

    The merge strategy uses jq's object multiplication (*) which merges objects
    with later values overwriting earlier ones for duplicate keys.

    Usage:
        # Aggregate messages from a target and all its dependencies
        bazel build //path/to:target \\
            --aspects=@rules_formatjs//formatjs:aggregate.bzl%formatjs_aggregate_aspect \\
            --output_groups=aggregated_messages

        # Get all individual message files (not merged)
        bazel build //path/to:target \\
            --aspects=@rules_formatjs//formatjs:aggregate.bzl%formatjs_aggregate_aspect \\
            --output_groups=all_messages

    Output:
        - aggregated_messages: Single merged JSON file with all messages
        - all_messages: All individual message JSON files (not merged)

    The aggregated file will be named: <target_name>_aggregated_messages.json
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
    output = ctx.actions.declare_file(ctx.attr.name + ".json")

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
        "deps": attr.label_list(
            doc = "Dependencies to aggregate messages from. Should be formatjs_extract targets.",
            aspects = [formatjs_aggregate_aspect],
        ),
    },
    toolchains = ["@jq.bzl//jq/toolchain:type"],
    doc = """Rule that aggregates messages from dependencies.

    This rule automatically applies the formatjs_aggregate_aspect to traverse
    dependencies and collect all messages, then merges them into a single JSON file.

    Example:
        ```starlark
        formatjs_aggregate(
            name = "all_messages",
            deps = [
                "//module1:messages",
                "//module2:messages",
                "//module3:messages",
            ],
        )

        # Simply build the target to get the aggregated messages:
        # bazel build //:all_messages
        #
        # The output will be at: bazel-bin/all_messages.json
        ```
    """,
)

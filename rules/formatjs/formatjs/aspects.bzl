"""Example aspects for use with formatjs_extract rule

This module demonstrates how to create aspects that work with formatjs_extract.
"""

load(":extract.bzl", "FormatjsExtractInfo")

def _message_stats_aspect_impl(target, ctx):
    """Example aspect that collects statistics about extracted messages.

    This aspect can be attached to formatjs_extract targets to gather
    information about the extracted messages without modifying the rule itself.
    """

    # Only process targets that provide FormatjsExtractInfo
    if FormatjsExtractInfo not in target:
        return []

    info = target[FormatjsExtractInfo]

    # Count source files
    src_count = len(info.srcs.to_list())

    # Create a stats file
    stats_file = ctx.actions.declare_file(ctx.label.name + "_stats.txt")
    ctx.actions.write(
        output = stats_file,
        content = """Message Extraction Statistics
=============================
Target: {label}
Source Files: {src_count}
Messages File: {messages}
ID Pattern: {pattern}
""".format(
            label = ctx.label,
            src_count = src_count,
            messages = info.messages.path,
            pattern = info.id_interpolation_pattern or "default",
        ),
    )

    return [
        OutputGroupInfo(
            message_stats = depset([stats_file]),
        ),
    ]

message_stats_aspect = aspect(
    implementation = _message_stats_aspect_impl,
    doc = """Example aspect that collects statistics about extracted messages.

    Usage:
        bazel build //path/to:target --aspects=//formatjs:aspects.bzl%message_stats_aspect \\
                                      --output_groups=message_stats
    """,
)

def _message_validator_aspect_impl(target, ctx):
    """Example aspect that validates extracted messages.

    This could be extended to check for:
    - Missing descriptions
    - Duplicate IDs
    - Consistency across files
    - etc.
    """

    if FormatjsExtractInfo not in target:
        return []

    info = target[FormatjsExtractInfo]

    # Create a validation report
    validation_file = ctx.actions.declare_file(ctx.label.name + "_validation.txt")

    # For now, just create a simple report
    # In a real implementation, you'd parse the JSON and validate it
    ctx.actions.run_shell(
        outputs = [validation_file],
        inputs = [info.messages],
        command = """
            echo "Validation Report for {label}" > {output}
            echo "======================" >> {output}
            echo "" >> {output}
            echo "Messages file: {messages}" >> {output}
            echo "Validation: PASSED" >> {output}
            echo "" >> {output}
            echo "To implement custom validation:" >> {output}
            echo "1. Parse the JSON file" >> {output}
            echo "2. Check for missing descriptions" >> {output}
            echo "3. Check for duplicate IDs" >> {output}
            echo "4. Validate message syntax" >> {output}
        """.format(
            label = ctx.label,
            output = validation_file.path,
            messages = info.messages.path,
        ),
    )

    return [
        OutputGroupInfo(
            message_validation = depset([validation_file]),
        ),
    ]

message_validator_aspect = aspect(
    implementation = _message_validator_aspect_impl,
    doc = """Example aspect that validates extracted messages.

    Usage:
        bazel build //path/to:target --aspects=//formatjs:aspects.bzl%message_validator_aspect \\
                                      --output_groups=message_validation
    """,
)

def _message_collector_aspect_impl(target, ctx):
    """Example aspect that collects all messages from a dependency tree.

    This aspect traverses the dependency graph and collects all extracted
    messages into a single aggregated file.
    """

    messages = []

    # Collect from this target if it provides FormatjsExtractInfo
    if FormatjsExtractInfo in target:
        messages.append(target[FormatjsExtractInfo].messages)

    # Collect from dependencies
    if hasattr(ctx.rule.attr, "deps"):
        for dep in ctx.rule.attr.deps:
            if OutputGroupInfo in dep and hasattr(dep[OutputGroupInfo], "all_messages"):
                messages.extend(dep[OutputGroupInfo].all_messages.to_list())

    # Create aggregated output if we have messages
    if messages:
        return [
            OutputGroupInfo(
                all_messages = depset(messages),
            ),
        ]

    return []

message_collector_aspect = aspect(
    implementation = _message_collector_aspect_impl,
    attr_aspects = ["deps"],
    doc = """Example aspect that collects all messages from a dependency tree.

    This aspect can be used to gather all extracted messages from a target
    and all its dependencies, useful for creating combined translation files.

    Usage:
        bazel build //path/to:target --aspects=//formatjs:aspects.bzl%message_collector_aspect \\
                                      --output_groups=all_messages
    """,
)

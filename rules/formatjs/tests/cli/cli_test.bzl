"""Tests for the public FormatJS CLI executable target."""

def _formatjs_cli_executable_test_impl(ctx):
    ctx.actions.write(
        output = ctx.outputs.executable,
        content = """#!/usr/bin/env bash
set -euo pipefail

"${TEST_SRCDIR}/formatjs_cli" --version
""",
        is_executable = True,
    )

    return [DefaultInfo(
        executable = ctx.outputs.executable,
        runfiles = ctx.runfiles(root_symlinks = {
            "formatjs_cli": ctx.executable.cli,
        }),
    )]

formatjs_cli_executable_test = rule(
    implementation = _formatjs_cli_executable_test_impl,
    attrs = {
        "cli": attr.label(
            executable = True,
            cfg = "exec",
            mandatory = True,
        ),
    },
    test = True,
)

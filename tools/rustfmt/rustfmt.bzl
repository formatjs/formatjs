"""Run the pinned formatter without building a Rust wrapper."""

def _rustfmt_binary_impl(ctx):
    toolchain = ctx.toolchains["@rules_rust//rust/rustfmt:toolchain_type"]
    rustfmt_path = toolchain.rustfmt.short_path
    if rustfmt_path.startswith("../"):
        rustfmt_path = rustfmt_path[3:]
    else:
        rustfmt_path = ctx.workspace_name + "/" + rustfmt_path

    runfiles_path = "bazel_tools/tools/bash/runfiles/runfiles.bash"
    executable = ctx.actions.declare_file(ctx.label.name)
    ctx.actions.write(
        executable,
        """#!/usr/bin/env bash
set -euo pipefail
source "${RUNFILES_DIR:-$0.runfiles}/%s" 2>/dev/null ||
  source "$(grep -sm1 '^%s ' "${RUNFILES_MANIFEST_FILE:-/dev/null}" | cut -d' ' -f2-)"
rustfmt=$(rlocation "%s")
cd "${BUILD_WORKSPACE_DIRECTORY:-$PWD}"
exec "$rustfmt" --edition 2024 --config skip_children=true "$@"
""" % (runfiles_path, runfiles_path, rustfmt_path),
        is_executable = True,
    )
    return [DefaultInfo(
        executable = executable,
        runfiles = ctx.runfiles(transitive_files = toolchain.all_files).merge(
            ctx.attr._runfiles[DefaultInfo].default_runfiles,
        ),
    )]

rustfmt_binary = rule(
    implementation = _rustfmt_binary_impl,
    executable = True,
    attrs = {
        "_runfiles": attr.label(
            default = "@rules_shell//shell/runfiles",
        ),
    },
    toolchains = ["@rules_rust//rust/rustfmt:toolchain_type"],
)

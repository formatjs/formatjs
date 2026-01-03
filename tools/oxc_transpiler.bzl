"""Bazel rule for oxc-transform transpiler"""

def _oxc_transpiler_impl(ctx):
    """Implementation of the oxc_transpiler rule."""

    # Collect all TypeScript source files from srcs
    # Skip .d.ts declaration files
    ts_files = []
    for src in ctx.files.srcs:
        if (src.path.endswith(".ts") or src.path.endswith(".tsx")) and not src.path.endswith(".d.ts"):
            ts_files.append(src)

    # Generate output files
    # Generate both JS and .d.ts files using oxc-transform
    js_outputs = []
    dts_outputs = []

    for ts_file in ts_files:
        # Calculate output path for JS and .d.ts, preserving directory structure
        # Get the path relative to the current package
        # ts_file.short_path is relative to workspace root, but we want relative to package
        package_prefix = ctx.label.package + "/"
        relative_path = ts_file.short_path

        # Remove package prefix if present
        if relative_path.startswith(package_prefix):
            relative_path = relative_path[len(package_prefix):]

        # Always output .js files regardless of whether input is .ts or .tsx
        if relative_path.endswith(".tsx"):
            js_path = relative_path[:-4] + ".js"
            dts_path = relative_path[:-4] + ".d.ts"
        else:  # .ts
            js_path = relative_path[:-3] + ".js"
            dts_path = relative_path[:-3] + ".d.ts"

        js_out = ctx.actions.declare_file(js_path)
        dts_out = ctx.actions.declare_file(dts_path)
        js_outputs.append(js_out)
        dts_outputs.append(dts_out)

        # Create action to transpile this file to JS and .d.ts
        # Set BAZEL_BINDIR as required by js_binary
        ctx.actions.run(
            inputs = [ts_file] + ctx.files._oxc_transform,
            outputs = [js_out, dts_out],
            executable = ctx.executable._transpiler,
            arguments = [ts_file.path, js_out.path],
            env = {
                "BAZEL_BINDIR": ctx.bin_dir.path,
            },
            mnemonic = "OxcTranspile",
            progress_message = "Transpiling %s with oxc-transform" % ts_file.short_path,
        )

    return [
        DefaultInfo(files = depset(js_outputs + dts_outputs)),
    ]

oxc_transpiler_rule = rule(
    implementation = _oxc_transpiler_impl,
    attrs = {
        "srcs": attr.label_list(
            allow_files = [".ts", ".tsx"],
            mandatory = True,
            doc = "TypeScript source files to transpile",
        ),
        "_transpiler": attr.label(
            default = "//tools/oxc-transpiler:transpile",
            executable = True,
            cfg = "exec",
        ),
        "_oxc_transform": attr.label(
            default = "//:node_modules/oxc-transform",
            allow_files = True,
        ),
    },
    doc = "Transpiles TypeScript files to JavaScript using oxc-transform",
)

def oxc_transpiler(name, srcs, **kwargs):
    """
    Wrapper macro for oxc_transpiler_rule that matches ts_project transpiler signature.

    This can be used as a transpiler for ts_project.

    Args:
        name: target name
        srcs: source TypeScript files
        **kwargs: additional attributes
    """
    oxc_transpiler_rule(
        name = name,
        srcs = srcs,
        tags = kwargs.get("tags", []),
        visibility = kwargs.get("visibility", None),
        testonly = kwargs.get("testonly", False),
    )

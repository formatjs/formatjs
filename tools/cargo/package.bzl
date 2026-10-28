"""Assemble standalone Cargo sources from declared Bazel outputs."""

def _cargo_release_impl(ctx):
    output = ctx.actions.declare_directory(ctx.label.name)
    manifest = ctx.actions.declare_file(ctx.label.name + ".inputs.json")
    metadata = {}
    for target, destination in ctx.attr.metadata.items():
        crate, variable = destination.split(":")
        if crate not in metadata:
            metadata[crate] = {}
        metadata[crate][variable] = [file.path for file in target.files.to_list()]
    compiled = {crate: [file.path for file in target.files.to_list()] for target, crate in ctx.attr.compiled.items()}
    ctx.actions.write(manifest, json.encode({
        "sources": {file.path: file.short_path for file in ctx.files.srcs},
        "metadata": metadata,
        "compiled": compiled,
        "calendars": [file.path for file in ctx.files.calendars],
        "notices": {file.basename: file.path for file in ctx.files.notices},
    }))
    inputs = ctx.files.srcs + ctx.files.notices + ctx.files.calendars + [manifest]
    for target in list(ctx.attr.metadata.keys()) + list(ctx.attr.compiled.keys()):
        inputs.extend(target.files.to_list())
    ctx.actions.run(
        executable = ctx.executable._tool,
        inputs = depset(inputs),
        outputs = [output],
        arguments = ["--inputs", manifest.path, "--out", output.path],
        mnemonic = "CargoReleasePackage",
        progress_message = "Assemble Cargo release packages %{label}",
    )
    return [DefaultInfo(files = depset([output]))]

cargo_release = rule(
    implementation = _cargo_release_impl,
    attrs = {
        "srcs": attr.label_list(allow_files = True),
        "metadata": attr.label_keyed_string_dict(),
        "compiled": attr.label_keyed_string_dict(),
        "calendars": attr.label(allow_files = True),
        "notices": attr.label_list(allow_files = True),
        "_tool": attr.label(default = "//tools/cargo:package", executable = True, cfg = "exec"),
    },
)

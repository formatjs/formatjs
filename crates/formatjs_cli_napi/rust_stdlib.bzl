"""Helpers for packaging Rust runtime libraries with Node addons."""

def _rust_stdlib_shared_library_impl(ctx):
    stdlibs = [
        src
        for src in ctx.files.srcs
        if src.basename.startswith("libstd-") and src.basename.endswith(".so")
    ]
    if len(stdlibs) != 1:
        fail("expected exactly one libstd-*.so in srcs, got %d" % len(stdlibs))

    stdlib = stdlibs[0]
    output = ctx.actions.declare_file(stdlib.basename)
    ctx.actions.run_shell(
        arguments = [
            stdlib.path,
            output.path,
        ],
        command = "cp \"$1\" \"$2\"",
        inputs = [stdlib],
        outputs = [output],
    )
    return [DefaultInfo(files = depset([output]))]

rust_stdlib_shared_library = rule(
    implementation = _rust_stdlib_shared_library_impl,
    attrs = {
        "srcs": attr.label_list(
            allow_files = True,
            mandatory = True,
        ),
    },
)

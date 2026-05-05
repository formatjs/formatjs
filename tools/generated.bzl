"Macros for #formatjs_generated packages — generated data that lives only in Bazel output."

load("@aspect_rules_js//js:defs.bzl", "js_library")
load("//tools:index.bzl", "ts_run_binary")
load("//tools:oxc_transpiler.bzl", "oxc_transpiler")

def generate_package_file(name, src, entry_point = None, tool = None, chdir = None, args = [], data = [], tags = [], visibility = None):
    """Generate a single .ts file for inclusion in a generated package.

    Runs ts_run_binary to produce the file. Output stays in Bazel — no
    write_source_files, no formatting (generated data files don't need it).

    Args:
        name: target name (the output file is available as :{name})
        src: output filename (e.g. "timezones.ts")
        entry_point: generation script entry point
        tool: tool binary label
        chdir: whether to chdir to another dir
        args: args to generation script
        data: dependent data labels
        tags: tags to apply
        visibility: target visibility (needed for cross-package references)
    """
    kwargs = {}
    if visibility:
        kwargs["visibility"] = visibility
    ts_run_binary(
        name = name,
        outs = [src],
        entry_point = entry_point,
        tool = tool,
        args = args + [
            "--out",
            "$(rootpath %s)" % src,
        ],
        chdir = chdir,
        srcs = data + [
            "//:node_modules/fs-extra",
            "//:node_modules/minimist",
        ],
        tags = tags + ["codegen"],
        **kwargs
    )

def formatjs_generated_package(name, package_name, srcs, visibility = ["//visibility:public"]):
    """Create a #formatjs_generated js_library from generated .ts files.

    Compiles TypeScript sources to .js + .d.ts via oxc_transpiler. Consumers
    import these outputs with #formatjs_generated/<output-path>/* and depend
    on this target directly.

    Args:
        name: Bazel target name (e.g. "tz_pkg")
        package_name: logical generated package identifier, used for registry/docs
        srcs: list of labels pointing to generated .ts files
        visibility: target visibility
    """

    # Compile .ts → .js + .d.ts
    oxc_transpiler(
        name = "%s_compiled" % name,
        srcs = srcs,
    )

    js_library(
        name = name,
        srcs = [
            ":%s_compiled" % name,
        ],
        visibility = visibility,
    )

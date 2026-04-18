"Macros for @formatjs_generated packages — generated data that lives only in Bazel output."

load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("//tools:index.bzl", "ts_run_binary")
load("//tools:oxc_transpiler.bzl", "oxc_transpiler")

def generate_package_file(name, src, entry_point = None, tool = None, chdir = None, args = [], data = [], tags = []):
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
    """
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
    )

def formatjs_generated_package(name, package_name, srcs, visibility = ["//visibility:public"]):
    """Create an @formatjs_generated npm package from generated .ts files.

    Compiles TypeScript sources to .js + .d.ts via oxc_transpiler, generates
    a package.json, and creates an npm_package.

    Args:
        name: Bazel target name (e.g. "tz_pkg")
        package_name: npm package suffix (e.g. "tz" → @formatjs_generated/tz)
        srcs: list of labels pointing to generated .ts files
        visibility: target visibility
    """

    # Compile .ts → .js + .d.ts
    oxc_transpiler(
        name = "%s_compiled" % name,
        srcs = srcs,
    )

    # Generate package.json
    pkg_json_name = "%s_package_json" % name
    native.genrule(
        name = pkg_json_name,
        outs = ["%s_package.json" % name],
        cmd = """echo '{"name":"@formatjs_generated/%s","type":"module","sideEffects":false,"exports":{"./*":"./*"}}' > $@""" % package_name,
    )

    npm_package(
        name = name,
        srcs = [
            ":%s_compiled" % name,
            ":%s" % pkg_json_name,
        ],
        package = "@formatjs_generated/%s" % package_name,
        replace_prefixes = {
            "%s_package.json" % name: "package.json",
        },
        visibility = visibility,
    )

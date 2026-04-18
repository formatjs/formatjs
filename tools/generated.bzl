"Macros for @formatjs_generated packages — generated data that lives only in Bazel output."

load("@aspect_rules_js//js:defs.bzl", "js_run_binary")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("//tools:index.bzl", "ts_run_binary")
load("//tools:oxc_transpiler.bzl", "oxc_transpiler")

def generate_package_file(name, src, entry_point = None, tool = None, chdir = None, args = [], data = [], tags = []):
    """Generate a single .ts file for inclusion in a generated package.

    Same pipeline as generate_src_file() (ts_run_binary + oxfmt) but without
    write_source_files — output stays in Bazel sandbox.

    Args:
        name: target name (the formatted file is available as :{name})
        src: output filename (e.g. "timezones.ts")
        entry_point: generation script entry point
        tool: tool binary label
        chdir: whether to chdir to another dir
        args: args to generation script
        data: dependent data labels
        tags: tags to apply
    """
    file_ext = src[src.rindex(".") + 1:]
    tmp_filename = "%s.tmp.%s" % (name, file_ext)

    ts_run_binary(
        name = "%s_raw" % name,
        outs = [tmp_filename],
        entry_point = entry_point,
        tool = tool,
        args = args + [
            "--out",
            "$(rootpath %s)" % tmp_filename,
        ],
        chdir = chdir,
        srcs = data + [
            "//:node_modules/fs-extra",
            "//:node_modules/minimist",
        ],
    )

    # Format with oxfmt
    native.genrule(
        name = name,
        srcs = [tmp_filename],
        outs = [src],
        cmd = "cat $(location %s) | $(location //:oxfmt) --stdin-filepath=$(location %s) > $@" % (tmp_filename, tmp_filename),
        tools = ["//:oxfmt"],
        tags = tags + ["codegen"],
    )

def formatjs_generated_package(name, package_name, srcs, visibility = ["//visibility:public"]):
    """Create an @formatjs_generated npm package from generated .ts files.

    Compiles TypeScript sources to .js + .d.ts via oxc_transpiler, generates
    a package.json, and creates an npm_package.

    Args:
        name: Bazel target name (e.g. "pkg")
        package_name: npm package suffix (e.g. "cldr.locale" → @formatjs_generated/cldr.locale)
        srcs: dict of {output_path: label} mapping filenames to generated file targets
        visibility: target visibility
    """

    # Collect all generated .ts source labels
    ts_srcs = srcs.values()

    # Compile .ts → .js + .d.ts
    oxc_transpiler(
        name = "%s_compiled" % name,
        srcs = ts_srcs,
    )

    # Generate package.json
    native.genrule(
        name = "%s_package_json" % name,
        outs = ["%s_package.json" % name],
        cmd = """echo '{"name":"@formatjs_generated/%s","type":"module","sideEffects":false,"exports":{"./*":"./*"}}' > $@""" % package_name,
    )

    npm_package(
        name = name,
        srcs = [
            ":%s_compiled" % name,
            ":%s_package_json" % name,
        ],
        package = "@formatjs_generated/%s" % package_name,
        replace_prefixes = {
            "%s_package.json" % name: "package.json",
        },
        visibility = visibility,
    )

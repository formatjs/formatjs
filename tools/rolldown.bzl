"Bazel macro for bundling JS with rolldown."

load("@aspect_rules_js//js:defs.bzl", "js_run_binary")

def rolldown_bundle(name, entry_point, srcs = [], output = None, deps = [], external = [], format = "esm", target = "es2020", global_name = None, config = None, platform = None, define = None, code_splitting = False, dts = False, visibility = None, **kwargs):
    """Bundle JS/TS with rolldown.

    Drop-in replacement for the esbuild() macro. Bundles an entry point into
    a single output file, resolving #packages/* workspace imports.

    Args:
        name: target name
        srcs: source files
        entry_point: entry .ts file
        output: output .js file name
        deps: dependencies
        external: list of external package names
        format: output format (esm, cjs, iife)
        target: JS target (es2020, esnext, etc.)
        global_name: global variable name for iife format
        config: unused, kept for esbuild() API compatibility
        dts: if True, generate bundled .d.ts alongside .js using rolldown-plugin-dts
        visibility: target visibility
        **kwargs: additional args (ignored, for esbuild compat)
    """

    effective_output = output or (name + ".js")

    args = [
        "--input",
        native.package_name() + "/" + entry_point,
        "--output",
        "$(rootpath %s)" % effective_output,
        "--format",
        format,
        "--target",
        target,
    ]

    for ext in external:
        args += ["--external", ext]

    if global_name:
        args += ["--globalName", global_name]

    if platform:
        args += ["--platform", platform]

    if define:
        for k, v in define.items():
            args += ["--define", "%s=%s" % (k, v)]

    if dts:
        args += ["--dts"]

    dts_deps = ["//:node_modules/rolldown-plugin-dts"] if dts else []

    # Use out_dirs when code splitting or dts is expected (both produce multiple chunks)
    if code_splitting or dts:
        # Build args with --output (script derives dir from it when --dts) or --outDir
        dir_args = [
            "--input",
            native.package_name() + "/" + entry_point,
            "--format",
            format,
            "--target",
            target,
        ]

        if dts:
            # Use --output so the script can derive the output dir
            dir_args += ["--output", native.package_name() + "/" + name + "/" + effective_output]
            dir_args += ["--dts"]
        else:
            dir_args += ["--outDir", native.package_name() + "/" + name]

        for ext in external:
            dir_args += ["--external", ext]
        if global_name:
            dir_args += ["--globalName", global_name]
        if platform:
            dir_args += ["--platform", platform]
        if define:
            for k, v in define.items():
                dir_args += ["--define", "%s=%s" % (k, v)]

        js_run_binary(
            name = name,
            tool = "//tools:rolldown-bundle-bin",
            srcs = srcs + deps + [
                "//:node_modules/rolldown",
                "//:node_modules/minimist",
            ] + dts_deps,
            out_dirs = [name],
            args = dir_args,
            visibility = visibility,
        )
    else:
        js_run_binary(
            name = name,
            tool = "//tools:rolldown-bundle-bin",
            srcs = srcs + deps + [
                "//:node_modules/rolldown",
                "//:node_modules/minimist",
            ],
            outs = [effective_output, effective_output + ".map"],
            args = args,
            visibility = visibility,
        )

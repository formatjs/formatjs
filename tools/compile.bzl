"Macro for TypeScript compilation + rolldown bundling."

load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_rules_js//js:defs.bzl", "js_library")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@npm//:@typescript/native-preview/package_json.bzl", tsgo_bin = "bin")
load("//tools:rolldown.bzl", "rolldown_bundle")
load("//tools:tsconfig.bzl", "packages_tsconfig")

def formatjs_compile(
        name,
        srcs,
        deps = [],
        project_references = [],
        entry_points = ["index.ts"],
        types = False,
        tsconfig = None):
    """TypeScript compilation + rolldown bundling.

    Generates:
    - copy_to_bin(name = "srcs") for sandbox compatibility
    - ts_project(name = "typecheck") for type checking (tsgo, no emit)
    - rolldown_bundle per entry point (dts=True, esm, es2020)
    - Optionally ts_project(name = "types") with emit_declaration_only

    Args:
        name: target name (e.g. "dist")
        srcs: source files (already globbed)
        deps: external npm dependencies (e.g. //:node_modules/react)
        project_references: internal package dependencies (e.g. //packages/ecma402-abstract)
        entry_points: list of .ts entry points to bundle
        types: if True, generate a "types" ts_project with emit_declaration_only
        tsconfig: optional tsconfig dict override (defaults to packages_tsconfig())
    """
    all_deps = deps + project_references
    effective_tsconfig = tsconfig or packages_tsconfig()

    # Compute external packages for rolldown (only node_modules deps are externalized)
    external_packages = [
        dep.split("node_modules/")[1]
        for dep in deps
        if "node_modules/" in dep
    ]

    copy_to_bin(
        name = "srcs",
        srcs = srcs,
    )

    # js_library wrapping source files so formatjs_test can depend on them
    # instead of including them in srcs.
    js_library(
        name = "src_lib",
        srcs = [":srcs"],
        deps = all_deps,
    )

    ts_project(
        name = "typecheck",
        srcs = [":srcs"],
        declaration = True,
        no_emit = True,
        resolve_json_module = True,
        transpiler = tsgo_bin.tsgo,
        tsconfig = effective_tsconfig,
        deps = all_deps,
    )

    for entry in entry_points:
        rolldown_bundle(
            name = "%s-bundle" % entry.replace(".ts", ""),
            srcs = [":srcs"],
            dts = True,
            entry_point = entry,
            external = external_packages,
            format = "esm",
            output = "%s.js" % entry.replace(".ts", ""),
            target = "es2020",
            deps = all_deps,
        )

    if types:
        ts_project(
            name = "types",
            srcs = [":srcs"],
            declaration = True,
            emit_declaration_only = True,
            resolve_json_module = True,
            transpiler = tsgo_bin.tsgo,
            tsconfig = effective_tsconfig,
            visibility = ["//visibility:public"],
            deps = all_deps,
        )

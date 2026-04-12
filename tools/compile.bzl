"Macro for TypeScript compilation + rolldown bundling + npm packaging."

load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_rules_js//js:defs.bzl", "js_library")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@npm//:@typescript/native-preview/package_json.bzl", tsgo_bin = "bin")
load("//tools:index.bzl", "generate_ide_tsconfig_json", "no_internal_imports_test", "package_exports_test", "package_json_test")
load("//tools:rolldown.bzl", "rolldown_bundle")
load("//tools:tsconfig.bzl", "packages_tsconfig")

def _formatjs_package(
        package_name,
        entry_points,
        npm_package_name,
        extra_npm_srcs,
        allow_overwrites):
    """npm packaging + validation tests (private).

    Generates:
    - js_library(name = {package_name}) with bundles + package.json
    - npm_package(name = "pkg")
    - no_internal_imports_test
    - package_json_test
    - package_exports_test
    - generate_ide_tsconfig_json()
    """
    effective_npm_name = npm_package_name or ("@formatjs/%s" % package_name)

    bundles = [":%s-bundle" % entry.replace(".ts", "") for entry in entry_points]
    replace_prefixes = {
        "%s-bundle/" % entry.replace(".ts", ""): ""
        for entry in entry_points
    }

    js_library(
        name = package_name,
        srcs = bundles + ["package.json"],
        visibility = ["//visibility:public"],
    )

    npm_pkg_kwargs = {}
    if allow_overwrites:
        npm_pkg_kwargs["allow_overwrites"] = True

    npm_package(
        name = "pkg",
        srcs = [
            "LICENSE.md",
            "README.md",
            "package.json",
        ] + bundles + extra_npm_srcs,
        package = effective_npm_name,
        replace_prefixes = replace_prefixes,
        visibility = ["//visibility:public"],
        **npm_pkg_kwargs
    )

    no_internal_imports_test(
        name = "no_internal_imports_test",
        data = bundles,
    )

    package_json_test(
        name = "package_json_test",
    )

    package_exports_test(
        name = "package_exports_test",
        pkg = ":pkg",
    )

    generate_ide_tsconfig_json()

def formatjs_library(
        name,
        srcs,
        deps = [],
        project_references = [],
        entry_points = ["index.ts"],
        types = False,
        tsconfig = None,
        npm_package_name = None,
        extra_npm_srcs = [],
        allow_overwrites = False):
    """TypeScript compilation + rolldown bundling + optional npm packaging.

    Generates:
    - copy_to_bin(name = "srcs") for sandbox compatibility
    - ts_project(name = "typecheck") for type checking (tsgo, no emit)
    - rolldown_bundle per entry point (dts=True, esm, es2020)
    - Optionally ts_project(name = "types") with emit_declaration_only
    - If package.json exists: js_library, npm_package, and validation tests

    Args:
        name: target name (e.g. "dist")
        srcs: source files (already globbed)
        deps: external npm dependencies (e.g. //:node_modules/react)
        project_references: internal package dependencies (e.g. //packages/ecma402-abstract)
        entry_points: list of .ts entry points to bundle
        types: if True, generate a "types" ts_project with emit_declaration_only
        tsconfig: optional tsconfig dict override (defaults to packages_tsconfig())
        npm_package_name: npm package name for publishing (default "@formatjs/{dir_name}")
        extra_npm_srcs: additional files for npm_package (iife bundles, locale-data, etc.)
        allow_overwrites: passed to npm_package (default False)
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

    # Auto-generate npm packaging if package.json exists
    if native.glob(["package.json"], allow_empty = True):
        package_dir_name = native.package_name().split("/")[-1]
        _formatjs_package(
            package_name = package_dir_name,
            entry_points = entry_points,
            npm_package_name = npm_package_name,
            extra_npm_srcs = extra_npm_srcs,
            allow_overwrites = allow_overwrites,
        )

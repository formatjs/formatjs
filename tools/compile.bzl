"Macro for TypeScript compilation + rolldown bundling + npm packaging."

load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_rules_js//js:defs.bzl", "js_library")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@npm//:@typescript/native-preview/package_json.bzl", tsgo_bin = "bin")
load("//tools:index.bzl", "generate_ide_tsconfig_json", "no_internal_imports_test", "package_exports_test", "package_json_test")
load("//tools:oxc_transpiler.bzl", "oxc_transpiler")
load("//tools:rolldown.bzl", "rolldown_bundle")
load("//tools:tsconfig.bzl", "packages_tsconfig")

def _formatjs_package(
        package_name,
        entry_points,
        deps,
        external_packages,
        npm_package_name,
        extra_npm_srcs,
        allow_overwrites):
    """Rolldown bundling + npm packaging + validation tests (private).

    Generates:
    - rolldown_bundle per entry point (dts=True, esm, es2020)
    - js_library(name = {package_name}) with bundles + package.json
    - npm_package(name = "pkg")
    - no_internal_imports_test
    - package_json_test
    - package_exports_test
    - generate_ide_tsconfig_json()
    """
    effective_npm_name = npm_package_name or ("@formatjs/%s" % package_name)

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
            deps = deps,
        )

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
        allow_overwrites = False,
        visibility = None):
    """TypeScript compilation + optional npm packaging.

    For npm-published packages (with package.json): rolldown bundling + npm_package.
    For internal packages (no package.json): oxc per-file transpilation.

    Generates:
    - copy_to_bin(name = "srcs") for sandbox compatibility
    - js_library(name = "lib") wrapping sources + deps
    - ts_project(name = "typecheck") for type checking (tsgo, no emit)
    - Optionally ts_project(name = "types") with emit_declaration_only
    - If package.json exists: rolldown bundles, npm_package, and validation tests
    - If no package.json: oxc per-file transpilation

    Args:
        name: target name (e.g. "dist")
        srcs: source files (gazelle-managed)
        deps: external npm dependencies (e.g. //:node_modules/react)
        project_references: internal package dependencies (e.g. //packages/ecma402-abstract)
        entry_points: list of .ts entry points to bundle
        types: if True, generate a "types" ts_project with emit_declaration_only
        tsconfig: optional tsconfig dict override (defaults to packages_tsconfig())
        npm_package_name: npm package name for publishing (default "@formatjs/{dir_name}")
        extra_npm_srcs: additional files for npm_package (iife bundles, locale-data, etc.)
        allow_overwrites: passed to npm_package (default False)
        visibility: visibility for the js_library target
    """
    all_deps = deps + project_references
    effective_tsconfig = tsconfig or packages_tsconfig()
    has_package_json = native.glob(["package.json"], allow_empty = True)

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

    if has_package_json:
        # Published package: use :srcs for lib, rolldown for bundling
        js_library(
            name = "lib",
            srcs = [":srcs"],
            deps = all_deps,
            visibility = visibility,
        )
    else:
        # Internal package: oxc per-file transpilation
        # The js_library name matches the directory name so that
        # //packages/foo/bar resolves to the :bar target.
        lib_name = native.package_name().split("/")[-1]

        ts_project(
            name = "%s-esm" % lib_name,
            srcs = [":srcs"],
            declaration = True,
            tsconfig = effective_tsconfig,
            resolve_json_module = True,
            deps = all_deps + ["//:node_modules/oxc-transform"],
            transpiler = oxc_transpiler,
            declaration_transpiler = oxc_transpiler,
        )

        js_library(
            name = lib_name,
            srcs = [":%s-esm" % lib_name] + has_package_json,
            visibility = visibility,
        )

        # Alias so formatjs_test's :lib reference works
        native.alias(
            name = "lib",
            actual = ":%s" % lib_name,
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
    if has_package_json:
        # Compute external packages for rolldown (only node_modules deps are externalized).
        # Exclude @formatjs_generated — generated data is bundled inline, not externalized.
        external_packages = [
            dep.split("node_modules/")[1]
            for dep in deps
            if "node_modules/" in dep and "@formatjs_generated" not in dep
        ]

        package_dir_name = native.package_name().split("/")[-1]
        _formatjs_package(
            package_name = package_dir_name,
            entry_points = entry_points,
            deps = all_deps,
            external_packages = external_packages,
            npm_package_name = npm_package_name,
            extra_npm_srcs = extra_npm_srcs,
            allow_overwrites = allow_overwrites,
        )

    generate_ide_tsconfig_json(
        composite = not has_package_json,
        project_references = project_references,
    )

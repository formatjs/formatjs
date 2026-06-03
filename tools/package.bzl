"Macro for npm packaging + validation tests."

load("@aspect_rules_js//js:defs.bzl", "js_library")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("//tools:index.bzl", "generate_ide_tsconfig_json", "no_internal_imports_test", "package_exports_test", "package_json_test")

def formatjs_package(
        name,
        entry_points = ["index.ts"],
        npm_package_name = None,
        package_json = ":package_json",
        extra_npm_srcs = [],
        allow_overwrites = False,
        **_kwargs):
    """npm packaging + validation tests.

    Generates:
    - js_library(name = {name}) with bundles + package.json
    - npm_package(name = "pkg")
    - no_internal_imports_test
    - package_json_test
    - package_exports_test
    - generate_ide_tsconfig_json()

    Expects formatjs_library to have been called first, producing
    "{entry}-bundle" targets for each entry point.

    Args:
        name: package name (e.g. "fast-memoize"), used as js_library target name
        entry_points: list of .ts entry points (must match formatjs_library's entry_points)
        npm_package_name: npm package name for publishing (default "@formatjs/{name}")
        package_json: generated package.json label.
        extra_npm_srcs: additional files for npm_package (iife bundles, locale-data, etc.)
        allow_overwrites: passed to npm_package (default False)
    """
    effective_npm_name = npm_package_name or ("@formatjs/%s" % name)

    bundles = [":%s-bundle" % entry.replace(".ts", "") for entry in entry_points]
    replace_prefixes = {
        "%s-bundle/" % entry.replace(".ts", ""): ""
        for entry in entry_points
    }

    js_library(
        name = name,
        srcs = bundles + [package_json],
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
            package_json,
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
        package_json = package_json,
    )

    package_exports_test(
        name = "package_exports_test",
        pkg = ":pkg",
    )

    generate_ide_tsconfig_json()

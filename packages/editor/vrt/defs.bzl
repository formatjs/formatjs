"""Gazelle source graphs with typechecking for Vite and Playwright."""

load("@aspect_rules_js//js:defs.bzl", "js_library")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("//tools:tsconfig.bzl", "ESNEXT_SKIP_LIB_CHECK_TSCONFIG", "packages_tsconfig")

def vrt_library(name, srcs, deps = [], data = [], tsconfig_types = [], visibility = None):
    """Keep source files for Vite while checking Gazelle-discovered imports."""
    js_library(
        name = name,
        srcs = srcs + data,
        types = srcs,  # Specs import fixture types without a separate emitted bundle.
        deps = deps,
        visibility = visibility,
    )
    config = packages_tsconfig(ESNEXT_SKIP_LIB_CHECK_TSCONFIG)
    if tsconfig_types:
        config["compilerOptions"]["types"] = tsconfig_types
    ts_project(
        name = name + "_typecheck",
        srcs = srcs,
        deps = deps,
        declaration = True,
        no_emit = True,
        resolve_json_module = True,
        tsconfig = config,
    )

    ts_project(
        name = name + "_compiled",
        srcs = srcs,
        deps = deps,
        declaration = True,
        transpiler = "tsc",
        resolve_json_module = True,
        tsconfig = config,
    )

def vrt_test(name, srcs, deps = [], data = [], tsconfig_types = [], visibility = None):
    """Typecheck Playwright tests; the visual harness owns execution."""
    vrt_library(name, srcs, deps, data, tsconfig_types, visibility)

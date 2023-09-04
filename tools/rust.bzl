"""Rust setup utilities"""

load("@rules_rust//rust:defs.bzl", "rust_binary")

def _rust_wasm_transition_impl(_settings, _attr):
    return {
        "//command_line_option:platforms": "@rules_rust//rust/platform:wasm",
    }

def _rust_wasi_transition_impl(_settings, _attr):
    return {
        "//command_line_option:platforms": "@rules_rust//rust/platform:wasi",
    }

_rust_wasm_transition = transition(
    implementation = _rust_wasm_transition_impl,
    inputs = [],
    outputs = [
        "//command_line_option:platforms",
    ],
)

_rust_wasi_transition = transition(
    implementation = _rust_wasi_transition_impl,
    inputs = [],
    outputs = [
        "//command_line_option:platforms",
    ],
)

def _wasm_library_impl(ctx):
    out = ctx.actions.declare_file(ctx.label.name)

    ctx.actions.run(
        executable = "cp",
        arguments = [ctx.files.library[0].path, out.path],
        outputs = [out],
        inputs = ctx.files.library,
    )

    return [DefaultInfo(files = depset([out]), runfiles = ctx.runfiles([out]))]

def _wasm_attrs(transition):
    return {
        "library": attr.label(mandatory = True, cfg = transition),
        "_whitelist_function_transition": attr.label(default = "@bazel_tools//tools/whitelists/function_transition_whitelist"),
    }

_rust_wasm_library_rule = rule(
    implementation = _wasm_library_impl,
    attrs = _wasm_attrs(_rust_wasm_transition),
)

_rust_wasi_library_rule = rule(
    implementation = _wasm_library_impl,
    attrs = _wasm_attrs(_rust_wasi_transition),
)

def rust_wasm_library(name, tags = [], wasi = False, **kwargs):
    """Cross compile Rust library to WASM.

    Based on https://github.com/envoyproxy/envoy/blob/main/bazel/wasm/wasm.bzl

    Args:
        name: Name of the target.
        tags: Tags applied to this rule.
        wasi: If true, build wasm32-wasi target. Otherwise, build wasm-unknown-unknown target.
        **kwargs: Passthru args to `rust_binary`.
    """
    wasm_name = "_wasm_" + name.replace(".", "_")
    kwargs.setdefault("visibility", ["//visibility:public"])

    rust_binary(
        name = wasm_name,
        crate_type = "cdylib",
        out_binary = True,
        tags = ["manual"],
        **kwargs
    )

    bin_rule = _rust_wasm_library_rule
    if wasi:
        bin_rule = _rust_wasi_library_rule

    bin_rule(
        name = name,
        library = ":" + wasm_name,
        tags = ["manual"] + tags,
        visibility = kwargs.get("visibility"),
    )

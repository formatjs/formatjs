"""Standalone Rust test aggregates with Gazelle-generated crate roots."""

load("@gazelle_rs//:defs.bzl", "rust_test_main_gen")
load("@rules_rs//rs:rust_test.bzl", _rust_test = "rust_test")

def _formatjs_rust_test_impl(name, visibility, srcs, crate_root, crate, **kwargs):
    if crate == None and crate_root == None:
        rust_test_main_gen(
            name = name + "_main",
            srcs = srcs,
            testonly = True,
            visibility = ["//visibility:private"],
            target_compatible_with = kwargs.get("target_compatible_with", []),
        )
        crate_root = ":" + name + "_main"
        srcs = srcs + [crate_root]
    _rust_test(
        name = name,
        visibility = visibility,
        srcs = srcs,
        crate_root = crate_root,
        crate = crate,
        **kwargs
    )

formatjs_rust_test = macro(
    inherit_attrs = _rust_test,
    implementation = _formatjs_rust_test_impl,
)

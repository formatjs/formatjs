"""Optimized, platform-scoped Temporal WASM artifact."""

load("@bazel_lib//lib:copy_file.bzl", "copy_file")
load("@with_cfg.bzl", "with_cfg")

temporal_wasm, _temporal_wasm = with_cfg(copy_file).set(
    "compilation_mode",
    "opt",
).set(
    "platforms",
    [Label("@rules_rs//rs/platforms:wasm32-unknown-unknown")],
).build()

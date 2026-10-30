"""Keep the full differential corpus on the shipping Rust profile."""

load("@with_cfg.bzl", "with_cfg")

optimized_datetime_runtime, _optimized_datetime_runtime_internal = with_cfg(native.filegroup).set(
    "compilation_mode",
    "opt",
).build()

"""Use the shipping runtime profile for formatter differential suites."""

load("@with_cfg.bzl", "with_cfg")

optimized_runtime, _optimized_runtime_internal = with_cfg(native.filegroup).set(
    "compilation_mode",
    "opt",
).build()

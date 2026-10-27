"""Exercise embedded native data with a small locale selection."""

load("@with_cfg.bzl", "with_cfg")

compiled_runtime, _compiled_runtime_internal = with_cfg(native.filegroup).set(
    "compilation_mode",
    "opt",
).set(
    Label("//crates/intl_data:compiled"),
    True,
).set(
    Label("//crates/intl_data:locales"),
    ["en", "fr", "zh-TW"],
).build()

chromium_runtime, _chromium_runtime_internal = with_cfg(native.filegroup).set(
    "compilation_mode",
    "opt",
).set(
    Label("//crates/intl_data:compiled"),
    True,
).build()

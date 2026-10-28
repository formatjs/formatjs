"""Build Hermes runtimes with selected embedded locale data."""

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

test262_runtime, _test262_runtime_internal = with_cfg(native.filegroup).set(
    "compilation_mode",
    "opt",
).set(
    Label("//crates/intl_data:compiled"),
    True,
).set(
    Label("//crates/intl_data:locales"),
    ["*"],
).build()

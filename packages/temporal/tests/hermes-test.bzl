"""Run Temporal conformance against the shipping Hermes profile."""

load("@rules_shell//shell:sh_test.bzl", _sh_test = "sh_test")
load("@with_cfg.bzl", "with_cfg")

sh_test, _sh_test_internal = with_cfg(_sh_test).set(
    "compilation_mode",
    "opt",
).build()

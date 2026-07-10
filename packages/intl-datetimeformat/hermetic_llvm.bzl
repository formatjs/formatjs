"""Target-scoped hermetic LLVM configuration for timezone build tools."""

load("@rules_cc//cc:cc_binary.bzl", "cc_binary")
load("@with_cfg.bzl", "with_cfg")

_EXEC_HOSTS = [
    "linux_aarch64",
    "linux_x86_64",
    "macos_aarch64",
    "macos_x86_64",
]

def _llvm_exec_toolchains():
    return [
        Label("@llvm_toolchains//:%s%s_to_%s" % (prefix, host, host))
        for host in _EXEC_HOSTS
        for prefix in ["bootstrap_", ""]
    ]

def with_hermetic_llvm(rule):
    """Apply identity LLVM toolchains after any caller-provided toolchains."""
    return with_cfg(
        rule,
    ).extend(
        "extra_toolchains",
        _llvm_exec_toolchains(),
    ).set(
        Label("@llvm//config:experimental_stub_libgcc_s"),
        True,
    ).set(
        Label("@llvm//config/bootstrap:experimental_stub_libgcc_s"),
        True,
    ).build()

hermetic_llvm_cc_binary, hermetic_llvm_cc_binary_internal = with_hermetic_llvm(cc_binary)

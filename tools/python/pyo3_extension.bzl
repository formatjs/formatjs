"""PyO3 extension rule for the repository's rules_rs toolchain."""

load("@bazel_lib//lib:copy_file.bzl", "copy_file")
load("@rules_rs//rs:rust_shared_library.bzl", "rust_shared_library")

def pyo3_extension(name, srcs, deps, module_name, visibility = None):
    """Build an abi3 extension at its import-package path."""
    output = module_name.replace(".", "/") + ".abi3.so"
    basename = module_name.split(".")[-1]

    rust_shared_library(
        name = name + "_cdylib",
        srcs = srcs,
        compile_data = select({
            "@platforms//os:linux": ["@llvm//runtimes/libunwind:libunwind.static"],
            "//conditions:default": [],
        }),
        crate_features = [
            "pyo3/abi3-py312",
            "pyo3/extension-module",
        ],
        crate_name = basename,
        edition = "2024",
        deps = deps,
        rustc_flags = select({
            "@platforms//os:macos": [
                "-Clink-arg=-undefined",
                "-Clink-arg=dynamic_lookup",
                "-Clink-arg=-Wl,-install_name,@loader_path/" + basename + ".abi3.so",
            ],
            "@platforms//os:linux": [
                "-Cpanic=abort",
                # Keep wheels independent of a host libunwind installation.
                "-Clink-arg=$(location @llvm//runtimes/libunwind:libunwind.static)",
                "-Clink-arg=-Wl,--unresolved-symbols=ignore-all",
            ],
            "//conditions:default": [],
        }),
        visibility = ["//visibility:private"],
    )

    copy_file(
        name = name,
        src = ":" + name + "_cdylib",
        out = output,
        allow_symlink = True,
        visibility = visibility or ["//visibility:public"],
    )

"""PyO3 extension rule for the repository's rules_rs toolchain."""

load("@rules_rs//rs:rust_shared_library.bzl", "rust_shared_library")

def _copy_python_extension_impl(ctx):
    suffix = ".pyd" if ctx.target_platform_has_constraint(ctx.attr._windows[platform_common.ConstraintValueInfo]) else ".abi3.so"
    output = ctx.actions.declare_file(ctx.attr.module_name.replace(".", "/") + suffix)
    libraries = [file for file in ctx.files.src if file.extension in ["dll", "so", "dylib", "pyd"]]
    if len(libraries) != 1:
        fail("Expected one Python shared library, got: " + str(ctx.files.src))
    ctx.actions.symlink(output = output, target_file = libraries[0])
    return [DefaultInfo(files = depset([output]))]

copy_python_extension = rule(
    implementation = _copy_python_extension_impl,
    attrs = {
        "src": attr.label(allow_files = True, mandatory = True),
        "module_name": attr.string(mandatory = True),
        "_windows": attr.label(default = "@platforms//os:windows"),
    },
    doc = "Place a native extension at its target-platform Python import path.",
)

def pyo3_extension(name, srcs, deps, module_name, visibility = None, crate_root = None, crate_name = "_native", edition = "2024", proc_macro_deps = []):
    """Build an abi3 extension at its import-package path."""
    basename = module_name.split(".")[-1]

    rust_shared_library(
        name = name + "_cdylib",
        # Keep wheels independent of host C++ runtimes.
        cc_runtime_linkage = select({
            "@platforms//os:linux": "static",
            "//conditions:default": "dynamic",
        }),
        srcs = srcs,
        compile_data = select({
            "@platforms//os:linux": ["@llvm//runtimes/libunwind:libunwind.static"],
            "//conditions:default": [],
        }),
        crate_features = [
            "pyo3/abi3-py312",
            "pyo3/extension-module",
        ],
        crate_root = crate_root,
        crate_name = crate_name,
        edition = edition,
        proc_macro_deps = proc_macro_deps,
        deps = deps + select({
            "@platforms//os:windows": ["@rules_python//python/cc:current_py_cc_headers_abi3"],
            "//conditions:default": [],
        }),
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

    copy_python_extension(
        name = name,
        src = ":" + name + "_cdylib",
        module_name = module_name,
        visibility = visibility or ["//visibility:public"],
    )

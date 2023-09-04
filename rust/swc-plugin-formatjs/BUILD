load("@crate_index//:defs.bzl", "aliases", "all_crate_deps")
load("@rules_rust//rust:defs.bzl", "rust_library", "rust_test")
load("//tools:rust.bzl", "rust_wasm_library")

rust_library(
    name = "swc-plugin-formatjs",
    srcs = glob(["src/**/*.rs"]),
    aliases = aliases(),
    proc_macro_deps = all_crate_deps(
        proc_macro = True,
    ),
    deps = ["//rust/swc-formatjs-visitor"] + all_crate_deps(
        normal = True,
    ),
)

rust_test(
    name = "unit_test",
    size = "small",
    aliases = aliases(
        normal_dev = True,
        proc_macro_dev = True,
    ),
    crate = ":swc-plugin-formatjs",
    proc_macro_deps = all_crate_deps(
        proc_macro_dev = True,
    ),
    deps = all_crate_deps(
        normal_dev = True,
    ),
)

rust_wasm_library(
    name = "swc_plugin_formatjs.wasm",
    srcs = glob(["src/**/*.rs"]),
    aliases = aliases(),
    proc_macro_deps = all_crate_deps(
        proc_macro = True,
    ),
    visibility = ["@//packages/swc-plugin-experimental:__pkg__"],
    wasi = True,
    deps = ["//rust/swc-formatjs-visitor"] + all_crate_deps(
        normal = True,
    ),
)

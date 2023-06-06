load("@crate_index//:defs.bzl", "aliases", "all_crate_deps")
load("@rules_rust//rust:defs.bzl", "rust_library", "rust_test")

package(default_visibility = ["//rust:__subpackages__"])

# TODO: support `custom_transform` feature.
rust_library(
    name = "swc-formatjs-visitor",
    srcs = glob(["src/**/*.rs"]),
    aliases = aliases(),
    crate_features = ["plugin"],
    proc_macro_deps = all_crate_deps(
        proc_macro = True,
    ),
    deps = ["//rust/icu-messageformat-parser"] + all_crate_deps(
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
    crate = ":swc-formatjs-visitor",
    proc_macro_deps = all_crate_deps(
        proc_macro_dev = True,
    ),
    deps = all_crate_deps(
        normal_dev = True,
    ),
)

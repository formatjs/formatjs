load("@crate_index//:defs.bzl", "aliases", "all_crate_deps")
load("@rules_rust//rust:defs.bzl", "rust_library", "rust_test", "rust_test_suite")

package(default_visibility = ["//rust:__subpackages__"])

rust_library(
    name = "icu-messageformat-parser",
    srcs = glob(["src/**/*.rs"]),
    aliases = aliases(),
    proc_macro_deps = all_crate_deps(
        proc_macro = True,
    ),
    deps = all_crate_deps(
        normal = True,
    ),
    crate_features = ["utf16"]
)

rust_test(
    name = "unit_test",
    aliases = aliases(
        normal_dev = True,
        proc_macro_dev = True,
    ),
    crate = ":icu-messageformat-parser",
    proc_macro_deps = all_crate_deps(
        proc_macro_dev = True,
    ),
    deps = all_crate_deps(
        normal_dev = True,
    ),
)

rust_test_suite(
    name = "integrate_test",
    srcs = glob(["tests/**/*.rs"]),
    aliases = aliases(
        normal_dev = True,
        proc_macro_dev = True,
    ),
    data = glob(["tests/fixtures/**/*"]),
    proc_macro_deps = all_crate_deps(
        proc_macro_dev = True,
    ),
    deps = [":icu-messageformat-parser"] + all_crate_deps(
        normal = True,
        normal_dev = True,
    ),
)

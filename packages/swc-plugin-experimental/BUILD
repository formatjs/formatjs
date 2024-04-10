load("@aspect_bazel_lib//lib:copy_file.bzl", "copy_file")
load("@aspect_bazel_lib//lib:copy_to_directory.bzl", "copy_to_directory")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")

npm_link_all_packages(name = "node_modules")

copy_file(
    name = "wasm",
    src = "//rust/swc-plugin-formatjs:swc_plugin_formatjs.wasm",
    out = "index.wasm",
)

# These fixtures are made available to Jest tests under `tests/fixtures`.
copy_to_directory(
    name = "test_fixtures",
    srcs = ["//packages/babel-plugin-formatjs/tests/fixtures:files"],
    out = "tests/fixtures",
    replace_prefixes = {"packages/babel-plugin-formatjs/tests/fixtures/": ""},
    verbose = True,
)

npm_package(
    name = "swc-plugin-experimental",
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
        ":index.wasm",
    ],
    package = "@formatjs/swc-plugin-experimental",
    visibility = ["//visibility:public"],
)

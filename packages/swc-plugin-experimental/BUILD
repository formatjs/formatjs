load("@aspect_bazel_lib//lib:copy_file.bzl", "copy_file")
load("@aspect_rules_js//npm/private:npm_package.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:jest.bzl", "jest_test")

npm_link_all_packages(name = "node_modules")

copy_file(
    name = "wasm",
    src = "//rust/swc-plugin-formatjs:swc_plugin_formatjs.wasm",
    out = "index.wasm",
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

jest_test(
    name = "plugin_test",
    data = [
        "tests/transform.ts",
        ":index.wasm",
        "//:node_modules/@swc/core",
        "//:node_modules/@swc/jest",
        "//:node_modules/@types/node",
    ] + glob([
        "tests/**/*.test.ts",
        "tests/fixtures/**/*",
    ]),
    snapshots = glob(["tests/__snapshots__/*.snap"]),
)

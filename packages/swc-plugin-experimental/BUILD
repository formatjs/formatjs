load("@aspect_bazel_lib//lib:copy_file.bzl", "copy_file")
load("@aspect_rules_jest//jest:defs.bzl", aspect_jest_test = "jest_test")
load("@aspect_rules_js//npm/private:npm_package.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")

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

# NOTE: move this into its own Bazel rule and include common dependencies automatically.
aspect_jest_test(
    name = "plugin_test",
    config = "//:jest-aspect.config",
    data = [
        "tests/transform.ts",
        ":index.wasm",
        "//:node_modules/@jest/transform",
        "//:node_modules/@swc/core",
        "//:node_modules/@swc/jest",
        "//:node_modules/@types/jest",
        "//:node_modules/@types/node",
        "//:node_modules/ts-jest",
        "//:node_modules/tslib",
        "//:tsconfig",
    ] + glob(
        ["tests/**/*.test.ts"],
    ) + glob(
        ["tests/fixtures/**/*"],
    ),
    node_modules = "//:node_modules",
    snapshots = glob(["tests/__snapshots__/*.snap"]),
)

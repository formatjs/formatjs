load("@aspect_bazel_lib//lib:copy_file.bzl", "copy_file")
load("@aspect_rules_js//npm/private:npm_package.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("@aspect_rules_jest//jest:defs.bzl", aspect_jest_test = "jest_test")

npm_link_all_packages(name = "node_modules")

PACKAGE_NAME = "swc-plugin-experimental"

copy_file(
    name = "wasm",
    src = "//rust/swc-plugin-formatjs:swc_plugin_formatjs.wasm",
    out = "index.wasm",
)

npm_package(
    name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "index.wasm",
        "package.json",
    ],
    package = "@formatjs/%s" % PACKAGE_NAME,
    visibility = ["//visibility:public"],
)

# NOTE: move this into its own Bazel rule and include common dependencies automatically.
aspect_jest_test(
    name = "test_plugin",
    config = "//:jest-aspect.config",
    data = [
        "index.wasm",
        "tests/transform.ts",
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
    snapshots = glob(["tests/__snapshots__/*.snap"])
)

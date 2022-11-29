load("@npm//:defs.bzl", "npm_link_all_packages")
load("@aspect_rules_js//npm/private:npm_package.bzl", "npm_package")
load("@aspect_bazel_lib//lib:copy_file.bzl", "copy_file")
load("//tools:jest.bzl", "jest_test")

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
        "package.json",
        "index.wasm",
    ],
    package = "@formatjs/%s" % PACKAGE_NAME,
    visibility = ["//visibility:public"],
)

jest_test(
    name = "test_plugin",
    srcs = glob(
        ["tests/**/*.test.ts"],
    ),
    snapshots = glob([
        "tests/**/*.snap",
    ]),
    deps = [
        "index.wasm",
        "tests/transform.ts",
        "//:node_modules/@swc/core",
        "//:node_modules/@swc/jest",
        "//:node_modules/@types/node",
    ] + glob([
        "tests/fixtures/**/*",
    ]),
)

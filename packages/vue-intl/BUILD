load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:index.bzl", "package_json_test", "ts_compile_node")

npm_link_all_packages(name = "node_modules")

PACKAGE_NAME = "vue-intl"

npm_package(
    name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
        ":dist",
    ],
    visibility = ["//visibility:public"],
)

SRCS = glob([
    "*.ts",
])

SRC_DEPS = [
    "//:node_modules/vue",
    "//:node_modules/@babel/types",
    ":node_modules/@formatjs/intl",
    ":node_modules/@formatjs/icu-messageformat-parser",
]

ts_compile_node(
    name = "dist",
    srcs = SRCS,
    package = PACKAGE_NAME,
    deps = SRC_DEPS,
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

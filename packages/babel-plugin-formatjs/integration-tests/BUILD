load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:vitest.bzl", "vitest")

npm_link_all_packages()

vitest(
    name = "vue_integration_test",
    srcs = glob(["vue/fixtures/*"]) + [
        "vue/integration.test.ts",
    ],
    deps = [
        ":node_modules/babel-plugin-formatjs",
        "//:node_modules/@babel/types",
        "//:node_modules/@types/webpack",
        "//:node_modules/babel-loader",
        "//:node_modules/typescript",
        "//:node_modules/vue",
        "//:node_modules/vue-loader",
        "//:node_modules/webpack",
    ],
)

load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:jest.bzl", "jest_test")

npm_link_all_packages(name = "node_modules")

jest_test(
    name = "vue_integration_test",
    data = glob(["vue/fixtures/*"]) + [
        "vue/integration.test.ts",
        ":node_modules/babel-plugin-formatjs",
        "//:node_modules/@types/node",
        "//:node_modules/@types/webpack",
        "//:node_modules/babel-loader",
        "//:node_modules/vue",
        "//:node_modules/vue-loader",
        "//:node_modules/webpack",
    ],
    # flaky = True,
)

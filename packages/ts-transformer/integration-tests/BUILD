load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:jest.bzl", "jest_test")

npm_link_all_packages(name = "node_modules")

jest_test(
    name = "integration",
    srcs = glob([
        "integration/*.ts*",
    ]),
    jest_config = "integration/jest.config.js",
    deps = [
        ":node_modules/@formatjs/ts-transformer",
        "//:node_modules/@types/react",
        "//:node_modules/@types/react-dom",
        "//:node_modules/react",
        "//:node_modules/react-dom",
    ],
)

jest_test(
    name = "integration-vue",
    srcs = ["vue/integration.test.ts"] + glob([
        "vue/fixtures/*",
    ]),
    flaky = True,
    deps = [
        ":node_modules/@formatjs/ts-transformer",
        "//:node_modules/@types/node",
        "//:node_modules/@types/webpack",
        "//:node_modules/ts-loader",
        "//:node_modules/vue",
        "//:node_modules/vue-class-component",
        "//:node_modules/vue-loader",
        "//:node_modules/webpack",
    ],
)

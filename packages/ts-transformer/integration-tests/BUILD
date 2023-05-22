load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:jest.bzl", "jest_test")

npm_link_all_packages(name = "node_modules")

jest_test(
    name = "integration_test",
    data = glob([
        "integration/*.ts*",
    ]) + [
        ":node_modules/@formatjs/ts-transformer",
        "//:node_modules/@types/react",
        "//:node_modules/@types/react-dom",
        "//:node_modules/react",
        "//:node_modules/react-dom",
        # ts-jest deps
        "//:node_modules/ts-jest",
        "//:tsconfig",
        "//:node_modules/tslib",
    ],
    jest_config = "integration/jest.config.js",
)

jest_test(
    name = "vue_integration_test",
    data = [
        "vue/integration.test.ts",
        ":node_modules/@formatjs/ts-transformer",
        "//:node_modules/@types/node",
        "//:node_modules/@types/webpack",
        "//:node_modules/ts-loader",
        "//:node_modules/vue",
        "//:node_modules/vue-class-component",
        "//:node_modules/vue-loader",
        "//:node_modules/webpack",
        # ts-loader deps
        "//:tsconfig",
        "//:node_modules/tslib",
    ] + glob([
        "vue/fixtures/*",
    ]),
    flaky = True,
)

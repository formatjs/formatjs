load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:vitest.bzl", "vitest")

npm_link_all_packages()

# vitest(
#     name = "integration_test",
#     srcs = glob([
#         "integration/*.ts*",
#     ]) + [
#         "//:tsconfig",
#     ],
#     deps = [
#         ":node_modules/@formatjs/ts-transformer",
#         "//:node_modules/@types/react",
#         "//:node_modules/@types/react-dom",
#         "//:node_modules/react",
#         "//:node_modules/react-dom",
#         # ts-jest deps
#         ":node_modules/ts-jest",
#     ],
# )

vitest(
    name = "vue_integration_test",
    srcs = [
        "vue/integration.test.ts",
        # ts-loader deps
        "//:tsconfig",
    ],
    fixtures = glob([
        "vue/fixtures/*",
    ]),
    flaky = True,
    deps = [
        ":node_modules/@formatjs/ts-transformer",
        "//:node_modules/@babel/types",
        "//:node_modules/@types/webpack",
        "//:node_modules/ts-loader",
        "//:node_modules/typescript",
        "//:node_modules/vue",
        "//:node_modules/vue-class-component",
        "//:node_modules/vue-loader",
        "//:node_modules/webpack",
    ],
)

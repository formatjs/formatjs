load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:jest.bzl", "jest_test_v2")

npm_link_all_packages()

TEST_DEPS = [
    ":node_modules/react-intl",
    "//:node_modules/@jest/globals",
    "//:node_modules/@testing-library/jest-dom",
    "//:node_modules/@testing-library/react",
    "//:node_modules/@types/aria-query",
    "//:node_modules/@types/node",
    "//:node_modules/@types/react-dom",
    "//:node_modules/@types/react",
    "//:node_modules/jest-environment-jsdom",
    "//:node_modules/react-dom",
    "//:node_modules/react",
    "//:node_modules/tslib",
]

jest_test_v2(
    name = "test",
    srcs = glob(["*.ts*"]),
    jest_config = "jest.config.js",
    tsconfig = "tsconfig.json",
    deps = TEST_DEPS,
)

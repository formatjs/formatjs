load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:vitest.bzl", "vitest")

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
    "//:node_modules/react-dom",
    "//:node_modules/react",
    "//:node_modules/tslib",
]

vitest(
    name = "test",
    srcs = glob(["*.ts*"]),
    dom = True,
    deps = TEST_DEPS,
)

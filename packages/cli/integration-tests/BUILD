load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:jest.bzl", "jest_test")
load("@aspect_rules_jest//jest:defs.bzl", aspect_jest_test = "jest_test")

npm_link_all_packages(name = "node_modules")

jest_test(
    name = "integration-compile-folder",
    size = "large",
    srcs = glob(
        [
            "compile_folder/**/*",
        ],
    ),
    flaky = True,
    deps = [
        ":node_modules/@formatjs/cli",
        "//:node_modules/@types/fs-extra",
        "//:node_modules/@types/rimraf",
        "//:node_modules/fast-glob",
        "//:node_modules/fs-extra",
        "//:node_modules/rimraf",
    ],
)

jest_test(
    name = "integration-extract",
    size = "large",
    srcs = [
        "formatter.js",
    ] + glob(
        [
            "extract/**/*",
        ],
    ),
    flaky = True,
    deps = [
        ":node_modules/@formatjs/cli",
        "//:node_modules/@types/fs-extra",
        "//:node_modules/@types/rimraf",
        "//:node_modules/fast-glob",
        "//:node_modules/fs-extra",
        "//:node_modules/rimraf",
    ],
)

jest_test(
    name = "integration-extract-vue",
    size = "large",
    srcs = glob(
        [
            "extract-vue/**/*",
        ],
    ),
    flaky = True,
    deps = [
        ":node_modules/@formatjs/cli",
        "//:node_modules/@babel/types",
        "//:node_modules/@types/node",
        "//:node_modules/@vue/compiler-core",
        "//:node_modules/@vue/compiler-sfc",
        "//:node_modules/fast-glob",
    ],
)

aspect_jest_test(
    name = "integration-compile",
    config = "//:jest-aspect.config",
    data = [
        "formatter.js",
        ":node_modules/@formatjs/cli",
        "//:node_modules/@jest/transform",
        "//:node_modules/@types/jest",
        "//:node_modules/@types/rimraf",
        "//:node_modules/rimraf",
        "//:node_modules/ts-jest",
        "//:node_modules/tslib",
        "//:tsconfig",
    ] + glob(
        ["compile/**/*"],
        exclude = ["compile/__snapshots__/**/*"],
    ),
    # To update snapshots run,
    #    bazel run //packages/cli/integration-tests:integration-compile_update_snapshots
    snapshots = glob(["compile/__snapshots__/*.snap"]),
)

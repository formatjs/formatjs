load("//tools:jest.bzl", "jest_test")
load("@npm//:defs.bzl", "npm_link_all_packages")

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
        "//:node_modules/@vue/compiler-core",
        "//:node_modules/@babel/types",
        "//:node_modules/@vue/compiler-sfc",
        "//:node_modules/fast-glob",
        "//:node_modules/@types/node",
    ],
)


jest_test(
    name = "integration-compile",
    size = "large",
    srcs = [
        "formatter.js",
    ] + glob(
        [
            "compile/**/*",
        ],
    ),
    flaky = True,
    deps = [
        ":node_modules/@formatjs/cli",
        "//:node_modules/@types/rimraf",
        "//:node_modules/rimraf",
    ],
)
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:jest.bzl", "jest_test")

npm_link_all_packages(name = "node_modules")

jest_test(
    name = "compile_folder_integration_test",
    size = "large",
    data = glob(["compile_folder/**/*"]) + [
        ":node_modules/@formatjs/cli",
        "//:node_modules/@types/fs-extra",
        "//:node_modules/@types/rimraf",
        "//:node_modules/fast-glob",
        "//:node_modules/fs-extra",
        "//:node_modules/rimraf",
    ],
    flaky = True,
)

jest_test(
    name = "extract_integration_test",
    size = "large",
    data = glob(["extract/**/*"]) + [
        "formatter.js",
        ":node_modules/@formatjs/cli",
        "//:node_modules/@types/fs-extra",
        "//:node_modules/@types/rimraf",
        "//:node_modules/fast-glob",
        "//:node_modules/fs-extra",
        "//:node_modules/rimraf",
    ],
    flaky = True,
)

jest_test(
    name = "extract_vue_integration_test",
    size = "large",
    data = glob(["extract-vue/**/*"]) + [
        ":node_modules/@formatjs/cli",
        "//:node_modules/@babel/types",
        "//:node_modules/@types/node",
        "//:node_modules/@vue/compiler-core",
        "//:node_modules/@vue/compiler-sfc",
        "//:node_modules/fast-glob",
    ],
    flaky = True,
)

jest_test(
    name = "compile_integration_test",
    data = [
        "formatter.js",
        ":node_modules/@formatjs/cli",
        "//:node_modules/@types/rimraf",
        "//:node_modules/rimraf",
    ] + glob(
        ["compile/**/*"],
        exclude = ["compile/__snapshots__/**/*"],
    ),
    snapshots = glob(["compile/__snapshots__/*.snap"]),
)

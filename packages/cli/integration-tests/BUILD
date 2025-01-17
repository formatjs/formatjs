load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:jest.bzl", "jest_test")

npm_link_all_packages()

GLIMMER_HBS_DEPS = [
    "//:node_modules/@glimmer/env",
    "//:node_modules/@glimmer/reference",
    "//:node_modules/@glimmer/syntax",
    "//:node_modules/@glimmer/validator",
    "//:node_modules/content-tag",
    "//:node_modules/ember-template-recast",
]

jest_test(
    name = "compile_folder_integration_test",
    data = glob(
        ["compile_folder/**/*"],
        exclude = ["compile_folder/__snapshots__/*"],
    ) + [
        ":node_modules/@formatjs/cli",
        "//:node_modules/@types/fs-extra",
        "//:node_modules/fast-glob",
        "//:node_modules/fs-extra",
    ],
    flaky = True,
    snapshots = glob(["compile_folder/__snapshots__/*"]),
)

jest_test(
    name = "extract_integration_test",
    data = glob(
        ["extract/**/*"],
        exclude = ["extract/__snapshots__/*"],
    ) + [
        "formatter.js",
        ":node_modules/@formatjs/cli",
        "//:node_modules/@types/fs-extra",
        "//:node_modules/fast-glob",
        "//:node_modules/fs-extra",
    ],
    flaky = True,
    snapshots = glob(["extract/__snapshots__/*"]),
)

jest_test(
    name = "extract_vue_integration_test",
    data = glob(
        ["extract-vue/**/*"],
        exclude = ["extract-vue/__snapshots__/*"],
    ) + [
        ":node_modules/@formatjs/cli",
        "//:node_modules/@babel/types",
        "//:node_modules/@types/node",
        "//:node_modules/@vue/compiler-core",
        "//:node_modules/fast-glob",
        "//:node_modules/vue",
    ],
    flaky = True,
    snapshots = glob(["extract-vue/__snapshots__/*"]),
)

jest_test(
    name = "extract_glimmer_integration_test",
    data = glob(
        ["extract-glimmer/**/*"],
        exclude = ["extract-glimmer/__snapshots__/*"],
    ) + [
        ":node_modules/@formatjs/cli",
        "//:node_modules/@babel/types",
        "//:node_modules/@types/node",
        "//:node_modules/fast-glob",
    ] + GLIMMER_HBS_DEPS,
    flaky = True,
    snapshots = glob(["extract-glimmer/__snapshots__/*"]),
)

jest_test(
    name = "compile_integration_test",
    data = [
        "formatter.js",
        ":node_modules/@formatjs/cli",
    ] + glob(
        ["compile/**/*"],
        exclude = ["compile/__snapshots__/**/*"],
    ),
    snapshots = glob(["compile/__snapshots__/*.snap"]),
)

jest_test(
    name = "verify_integration_test",
    data = [
        ":node_modules/@formatjs/cli",
    ] + glob(
        ["verify/**/*"],
    ),
)

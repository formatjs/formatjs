load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:jest.bzl", "jest_test")
load("//tools:vitest.bzl", "vitest")

npm_link_all_packages()

GLIMMER_HBS_DEPS = [
    "//:node_modules/@glimmer/env",
    "//:node_modules/@glimmer/reference",
    "//:node_modules/@glimmer/syntax",
    "//:node_modules/@glimmer/validator",
    "//:node_modules/content-tag",
    "//:node_modules/ember-template-recast",
]

vitest(
    name = "compile_folder_integration_test",
    srcs = glob(
        ["compile_folder/*.test.ts"],
    ),
    fixtures = glob(
        ["compile_folder/**/*"],
        exclude = ["compile_folder/*.test.ts"],
    ),
    flaky = True,
    deps = [
        ":node_modules/@formatjs/cli",
        "//:node_modules/@types/fs-extra",
        "//:node_modules/fast-glob",
        "//:node_modules/fs-extra",
    ],
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

vitest(
    name = "extract_vue_integration_test",
    srcs = glob(
        ["extract-vue/*.test.ts"],
    ),
    fixtures = glob(
        ["extract-vue/**/*"],
        exclude = ["extract-vue/*.test.ts"],
    ),
    flaky = True,
    deps = [
        ":node_modules/@formatjs/cli",
        "//:node_modules/@babel/types",
        "//:node_modules/@vue/compiler-core",
        "//:node_modules/fast-glob",
        "//:node_modules/vue",
    ],
)

vitest(
    name = "extract_glimmer_integration_test",
    srcs = glob(
        ["extract-glimmer/*.test.ts"],
    ),
    fixtures = glob(
        ["extract-glimmer/**/*"],
        exclude = ["extract-glimmer/*.test.ts"],
    ),
    flaky = True,
    deps = [
        ":node_modules/@formatjs/cli",
        "//:node_modules/@babel/types",
        "//:node_modules/fast-glob",
    ] + GLIMMER_HBS_DEPS,
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

vitest(
    name = "verify_integration_test",
    srcs = glob(
        ["verify/*.test.ts"],
    ),
    fixtures = glob(
        ["verify/**/*"],
        exclude = [
            "verify/*.test.ts",
            "verify/__snapshots__/*",
        ],
    ),
    deps = [
        ":node_modules/@formatjs/cli",
    ],
)

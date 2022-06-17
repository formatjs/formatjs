load("@aspect_rules_js//npm/private:npm_package.bzl", "npm_package")
load("//tools:index.bzl", "check_format", "package_json_test", "ts_compile_node")
load("//tools:jest.bzl", "jest_test")

PACKAGE_NAME = "vue-intl"

npm_package(
    name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
        ":dist",
    ],
)

SRCS = glob([
    "*.ts",
])

SRC_DEPS = [
    "//:node_modules/vue",
    "//:node_modules/@vue/runtime-core",
    "//:node_modules/@babel/types",
    "//:node_modules/@formatjs/intl",
    "//:node_modules/@formatjs/icu-messageformat-parser",
]

ts_compile_node(
    name = "dist",
    srcs = SRCS,
    package = PACKAGE_NAME,
    deps = SRC_DEPS,
)

jest_test(
    name = "unit",
    srcs = SRCS + ["tests/index.test.ts"] + glob([
        "tests/__snapshots__/*.snap",
    ]),
    additional_args = [
        "--env",
        "jsdom",
    ],
    deps = SRC_DEPS + [
        "//:node_modules/@vue/test-utils",
    ],
)

check_format(
    name = "prettier",
    srcs = glob(
        [
            "**/*",
        ],
        exclude = [
            "CHANGELOG.md",
            "tests/__snapshots__/*",
        ],
    ),
)

package_json_test(
    name = "package_json_test",
    deps = SRC_DEPS,
)

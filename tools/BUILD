load("//tools:index.bzl", "prettier_check")

exports_files([
    "jest-reporter.js",
    "tsconfig.golden.json",
])

prettier_check(
    name = "prettier",
    srcs = glob(
        [
            "*.js",
        ],
    ),
)

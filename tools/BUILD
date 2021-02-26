load("//tools:index.bzl", "check_format")

exports_files([
    "jest-reporter.js",
    "tsconfig.golden.json",
])

check_format(
    name = "prettier",
    srcs = glob(
        [
            "*.*",
        ],
        exclude = ["tsconfig.golden.json"],
    ),
)

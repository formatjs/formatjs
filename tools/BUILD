load("//tools:index.bzl", "check_format")

exports_files([
    "jest-reporter.js",
    "tsconfig.golden.json",
    "check-package-json.ts",
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

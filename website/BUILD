load("//tools:index.bzl", "prettier_check")

prettier_check(
    name = "prettier",
    srcs = glob(
        [
            "docs/**/*",
            "lang/*",
            "src/**/*",
            "*.js*",
        ],
    ) + [
        "README.md",
    ],
    config = ".prettierrc.json",
)

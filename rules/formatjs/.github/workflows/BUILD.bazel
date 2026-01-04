load("@buildifier_prebuilt//:rules.bzl", "buildifier")

buildifier(
    name = "buildifier.check",
    exclude_patterns = ["./.git/*"],
    lint_mode = "warn",
    mode = "diff",
)

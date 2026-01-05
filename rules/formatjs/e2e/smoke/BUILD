"""Provides a simple way to test your rules as an external workspace.
Add a basic smoke-test target below.
"""

load("@bazel_skylib//rules:build_test.bzl", "build_test")
# load("@rules_formatjs//formatjs:defs.bzl", "formatjs_extract", "formatjs_compile")

# Replace with a usage of your rule/macro
filegroup(name = "empty")

build_test(
    name = "smoke_test",
    targets = [
        # targets you add above
        ":empty",
    ],
)

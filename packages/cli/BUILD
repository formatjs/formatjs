load("@build_bazel_rules_nodejs//:index.bzl", "pkg_npm")

PACKAGE_NAME = "cli"

exports_files(["package.json"])

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
    ],
    deps = [
        "package.json",
        "//packages/cli-lib:bin/formatjs",
    ],
)

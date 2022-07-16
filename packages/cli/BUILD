load("@build_bazel_rules_nodejs//:index.bzl", "pkg_npm")

PACKAGE_NAME = "cli"

exports_files(["package.json"])

genrule(
    name = "bin",
    srcs = ["//packages/cli-lib:formatjs.js"],
    outs = ["bin/formatjs"],
    cmd = "cp $< $@",
)

pkg_npm(
    name = PACKAGE_NAME,
    package_name = "@formatjs/%s" % PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
    ],
    deps = [
        "package.json",
        ":bin/formatjs",
    ],
)

alias(
    name = "publish",
    actual = "%s.publish" % PACKAGE_NAME,
)

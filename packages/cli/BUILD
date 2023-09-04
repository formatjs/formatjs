load("@aspect_rules_js//npm:defs.bzl", "npm_package")

PACKAGE_NAME = "cli"

genrule(
    name = "bin",
    srcs = ["//packages/cli-lib:formatjs.js"],
    outs = ["bin/formatjs"],
    cmd = "cp $< $@",
)

npm_package(
    name = PACKAGE_NAME,
    srcs = [
        "LICENSE.md",
        "README.md",
        "package.json",
        ":bin/formatjs",
    ],
    package = "@formatjs/%s" % PACKAGE_NAME,
    visibility = ["//visibility:public"],
)

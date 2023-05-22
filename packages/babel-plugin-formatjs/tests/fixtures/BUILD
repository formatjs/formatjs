# Export these files for reuse by @formatjs/swc-plugin-experimental test cases.
load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")

# Export file group for reuse by @formatjs/swc-plugin-experimental test cases.
filegroup(
    name = "files",
    srcs = glob(["*.js"]),
    visibility = [
        "//packages/babel-plugin-formatjs:__subpackages__",
        "//packages/swc-plugin-experimental:__subpackages__",
    ],
)

# This target places fixtures in the correct location for
# the jest test in the parent package to find.
copy_to_bin(
    name = "fixtures",
    srcs = [":files"],
    visibility = [
        "//packages/babel-plugin-formatjs:__subpackages__",
        "//packages/swc-plugin-experimental:__subpackages__",
    ],
)

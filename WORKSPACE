# Bazel workspace created by @bazel/create 1.7.0

# Declares that this directory is the root of a Bazel workspace.
# See https://docs.bazel.build/versions/master/build-ref.html#workspace
workspace(
    # How this workspace would be referenced with absolute labels from another workspace
    name = "formatjs",
    # Map the @npm bazel workspace to the node_modules directory.
    # This lets Bazel use the same node_modules as other local tooling.
    managed_directories = {
        "@npm": ["node_modules"],
        # "@website_npm": ["website/node_modules"],
    },
)

# new_local_repository(
#     name="build_bazel_rules_nodejs",
#     path = "./third_party/github.com/bazelbuild/rules_nodejs",
#     build_file = "//third_party/github.com/bazelbuild/rules_nodejs:BUILD.bazel"
# )

# new_local_repository(
#     name = "test262",
#     build_file = "BUILD.test262",
#     path = "./test262",
# )

# Install the nodejs "bootstrap" package
# This provides the basic tools for running and packaging nodejs programs in Bazel
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "build_bazel_rules_nodejs",
    sha256 = "5bf77cc2d13ddf9124f4c1453dd96063774d755d4fc75d922471540d1c9a8ea8",
    urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/2.0.0/rules_nodejs-2.0.0.tar.gz"],
)

load("@build_bazel_rules_nodejs//:index.bzl", "yarn_install")

# node_repositories(
#     node_version = "14.5.0",
#     package_json = ["//:package.json"],
#     node_repositories = {
#         "14.5.0-darwin_amd64": ("node-v14.5.0-darwin-x64.tar.gz", "node-v14.5.0-darwin-x64", "47dfd88abcd4d6d6f7b7516c95645f9760ba9c93d04b51a92895584c945b2953"),
#         "14.5.0-linux_amd64": ("node-v14.5.0-linux-x64.tar.xz", "node-v14.5.0-linux-x64", "8b0235c318de87ecf8eec9a39e5c5df80757dbec571addda7123276dfcb34d5b"),
#         "14.5.0-windows_amd64": ("node-v14.5.0-win-x64.zip", "node-v14.5.0-win-x64", "ab5728c85ece98210036fc9c38984fa2410a882dd99075b3d5bece58e4cc6ea2"),
#     },
#     node_urls = ["https://nodejs.org/dist/v{version}/{filename}"],
# )

# The yarn_install rule runs yarn anytime the package.json or yarn.lock file changes.
# It also extracts and installs any Bazel rules distributed in an npm package.

yarn_install(
    # Name this npm so that Bazel Label references look like @npm//package
    name = "npm",
    package_json = "//:package.json",
    yarn_lock = "//:yarn.lock",
)

# yarn_install(
#     # Name this npm so that Bazel Label references look like @npm//package
#     name = "website_npm",
#     package_json = "//website:package.json",
#     yarn_lock = "//website:yarn.lock",
# )

# Setup skylib
http_archive(
    name = "bazel_skylib",
    sha256 = "97e70364e9249702246c0e9444bccdc4b847bed1eb03c5a3ece4f83dfe6abc44",
    urls = [
        "https://mirror.bazel.build/github.com/bazelbuild/bazel-skylib/releases/download/1.0.2/bazel-skylib-1.0.2.tar.gz",
        "https://github.com/bazelbuild/bazel-skylib/releases/download/1.0.2/bazel-skylib-1.0.2.tar.gz",
    ],
)

load("@bazel_skylib//:workspace.bzl", "bazel_skylib_workspace")

bazel_skylib_workspace()

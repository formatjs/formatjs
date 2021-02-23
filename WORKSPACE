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

_ESBUILD_VERSION = "0.8.48"

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

# new_local_repository(
#     name = "remote-website",
#     build_file = "formatjs.github.io.BUILD",
#     path = "./formatjs.github.io",
# )

load("@bazel_tools//tools/build_defs/repo:git.bzl", "git_repository")

# Install the nodejs "bootstrap" package
# This provides the basic tools for running and packaging nodejs programs in Bazel
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "build_bazel_rules_nodejs",
    sha256 = "bfacf15161d96a6a39510e7b3d3b522cf61cb8b82a31e79400a84c5abcab5347",
    urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/3.2.1/rules_nodejs-3.2.1.tar.gz"],
)

http_archive(
    name = "tzdata",
    build_file = "@//:packages/intl-datetimeformat/tzdata.BUILD",
    sha256 = "8d813957de363387696f05af8a8889afa282ab5016a764c701a20758d39cbaf3",
    urls = ["https://data.iana.org/time-zones/releases/tzdata2020d.tar.gz"],
)

http_archive(
    name = "tzcode",
    build_file = "@//:packages/intl-datetimeformat/tzcode.BUILD",
    sha256 = "6cf050ba28e8053029d3f32d71341d11a794c6b5dd51a77fc769d6dae364fad5",
    urls = ["https://data.iana.org/time-zones/releases/tzcode2020d.tar.gz"],
)

load("@build_bazel_rules_nodejs//:index.bzl", "node_repositories", "yarn_install")

node_repositories(
    node_version = "14.9.0",
    package_json = ["//:package.json"],
    yarn_version = "1.22.4",
)

http_archive(
    name = "esbuild_darwin",
    build_file_content = """exports_files(["bin/esbuild"])""",
    sha256 = "d21a722873ed24586f071973b77223553fca466946f3d7e3976eeaccb14424e6",
    strip_prefix = "package",
    urls = [
        "https://registry.npmjs.org/esbuild-darwin-64/-/esbuild-darwin-64-%s.tgz" % _ESBUILD_VERSION,
    ],
)

http_archive(
    name = "esbuild_windows",
    build_file_content = """exports_files(["esbuild.exe"])""",
    sha256 = "fe5dcb97b4c47f9567012f0a45c19c655f3d2e0d76932f6dd12715dbebbd6eb0",
    strip_prefix = "package",
    urls = [
        "https://registry.npmjs.org/esbuild-windows-64/-/esbuild-windows-64-%s.tgz" % _ESBUILD_VERSION,
    ],
)

http_archive(
    name = "esbuild_linux",
    build_file_content = """exports_files(["bin/esbuild"])""",
    sha256 = "60dabe141e5dfcf99e7113bded6012868132068a582a102b258fb7b1cfdac14b",
    strip_prefix = "package",
    urls = [
        "https://registry.npmjs.org/esbuild-linux-64/-/esbuild-linux-64-%s.tgz" % _ESBUILD_VERSION,
    ],
)

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

# multirun is written in Go and hence needs rules_go to be built.
# See https://github.com/bazelbuild/rules_go for the up to date setup instructions.
http_archive(
    name = "io_bazel_rules_go",
    sha256 = "08c3cd71857d58af3cda759112437d9e63339ac9c6e0042add43f4d94caf632d",
    urls = [
        "https://mirror.bazel.build/github.com/bazelbuild/rules_go/releases/download/v0.24.2/rules_go-v0.24.2.tar.gz",
        "https://github.com/bazelbuild/rules_go/releases/download/v0.24.2/rules_go-v0.24.2.tar.gz",
    ],
)

load("@io_bazel_rules_go//go:deps.bzl", "go_register_toolchains", "go_rules_dependencies")

go_rules_dependencies()

go_register_toolchains()

git_repository(
    name = "com_github_atlassian_bazel_tools",
    commit = "64cad21247d8039660f90abc02549dd8012ebb5e",
    remote = "https://github.com/atlassian/bazel-tools.git",
)

load("@com_github_atlassian_bazel_tools//multirun:deps.bzl", "multirun_dependencies")

multirun_dependencies()

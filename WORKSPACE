# Bazel workspace created by @bazel/create 1.7.0

# Declares that this directory is the root of a Bazel workspace.
# See https://docs.bazel.build/versions/master/build-ref.html#workspace
workspace(
    # How this workspace would be referenced with absolute labels from another workspace
    name = "formatjs",
)

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive", "http_file")

# rules_js
http_archive(
    name = "aspect_rules_js",
    sha256 = "630a71aba66c4023a5b16ab3efafaeed8b1a2865ccd168a34611eb73876b3fc4",
    strip_prefix = "rules_js-1.37.1",
    url = "https://github.com/aspect-build/rules_js/releases/download/v1.37.1/rules_js-v1.37.1.tar.gz",
)

load("@aspect_rules_js//js:repositories.bzl", "rules_js_dependencies")

rules_js_dependencies()

load("@rules_nodejs//nodejs:repositories.bzl", "nodejs_register_toolchains")

nodejs_register_toolchains(
    name = "nodejs",
    node_version = "18.17.0",
)

load("@aspect_rules_js//npm:npm_import.bzl", "npm_translate_lock")

npm_translate_lock(
    name = "npm",
    data = [
        "//:patches/@commitlint__rules@17.0.0.patch",
        "//:patches/make-plural-compiler@5.1.0.patch",
    ],
    patch_args = {"*": ["-p1"]},
    pnpm_lock = "//:pnpm-lock.yaml",
    verify_node_modules_ignored = "//:.bazelignore",
)

load("@npm//:repositories.bzl", "npm_repositories")

npm_repositories()

IANA_TZ_VERSION = "2024b"

http_file(
    name = "tzdata",
    downloaded_file_path = "tzdata.tar.gz",
    sha256 = "70e754db126a8d0db3d16d6b4cb5f7ec1e04d5f261255e4558a67fe92d39e550",
    urls = ["https://data.iana.org/time-zones/releases/tzdata%s.tar.gz" % IANA_TZ_VERSION],
)

http_file(
    name = "tzcode",
    downloaded_file_path = "tzcode.tar.gz",
    sha256 = "5e438fc449624906af16a18ff4573739f0cda9862e5ec28d3bcb19cbaed0f672",
    urls = ["https://data.iana.org/time-zones/releases/tzcode%s.tar.gz" % IANA_TZ_VERSION],
)

# esbuild
# https://github.com/aspect-build/rules_esbuild/issues/58
# this tag preserve symlink which makes esbuild escape the sandbox, but w/o it it cannot
# resolve transitive dep
http_archive(
    name = "aspect_rules_esbuild",
    sha256 = "2ea31bd97181a315e048be693ddc2815fddda0f3a12ca7b7cc6e91e80f31bac7",
    strip_prefix = "rules_esbuild-0.14.4",
    url = "https://github.com/aspect-build/rules_esbuild/releases/download/v0.14.4/rules_esbuild-v0.14.4.tar.gz",
)

load("@aspect_rules_esbuild//esbuild:dependencies.bzl", "rules_esbuild_dependencies")

rules_esbuild_dependencies()

# Register a toolchain containing esbuild npm package and native bindings
load("@aspect_rules_esbuild//esbuild:repositories.bzl", "LATEST_VERSION", "esbuild_register_toolchains")

esbuild_register_toolchains(
    name = "esbuild",
    esbuild_version = LATEST_VERSION,
)

# Typescript
http_archive(
    name = "aspect_rules_ts",
    sha256 = "97a8246bf6d1c7077b296e90a6e307bf8eabed02c5bca84d46db81efbf6ead41",
    strip_prefix = "rules_ts-2.4.0",
    url = "https://github.com/aspect-build/rules_ts/releases/download/v2.4.0/rules_ts-v2.4.0.tar.gz",
)

##################
# rules_ts setup #
##################
# Fetches the rules_ts dependencies.
# If you want to have a different version of some dependency,
# you should fetch it *before* calling this.
# Alternatively, you can skip calling this function, so long as you've
# already fetched all the dependencies.
load("@aspect_rules_ts//ts:repositories.bzl", "rules_ts_dependencies")

rules_ts_dependencies(
    ts_integrity = "sha512-mI4WrpHsbCIcwT9cF4FZvr80QUeKvsUsUvKDoR+X/7XHQH98xYD8YHZg7ANtz2GtZt/CBq2QJ0thkGJMHfqc1w==",
    ts_version_from = "//:package.json",
)

load("@bazel_features//:deps.bzl", "bazel_features_deps")

bazel_features_deps()

load("@aspect_bazel_lib//lib:repositories.bzl", "register_copy_directory_toolchains", "register_copy_to_directory_toolchains")

register_copy_directory_toolchains()

register_copy_to_directory_toolchains()

# Jest
http_archive(
    name = "aspect_rules_jest",
    sha256 = "d3bb833f74b8ad054e6bff5e41606ff10a62880cc99e4d480f4bdfa70add1ba7",
    strip_prefix = "rules_jest-0.18.4",
    url = "https://github.com/aspect-build/rules_jest/releases/download/v0.18.4/rules_jest-v0.18.4.tar.gz",
)

####################
# rules_jest setup #
####################
# Fetches the rules_jest dependencies.
# If you want to have a different version of some dependency,
# you should fetch it *before* calling this.
# Alternatively, you can skip calling this function, so long as you've
# already fetched all the dependencies.
load("@aspect_rules_jest//jest:dependencies.bzl", "rules_jest_dependencies")

rules_jest_dependencies()

# Multirun

http_archive(
    name = "io_bazel_rules_go",
    sha256 = "099a9fb96a376ccbbb7d291ed4ecbdfd42f6bc822ab77ae6f1b5cb9e914e94fa",
    urls = [
        "https://mirror.bazel.build/github.com/bazelbuild/rules_go/releases/download/v0.35.0/rules_go-v0.35.0.zip",
        "https://github.com/bazelbuild/rules_go/releases/download/v0.47.1/rules_go-v0.35.0.zip",
    ],
)

load("@io_bazel_rules_go//go:deps.bzl", "go_register_toolchains", "go_rules_dependencies")

go_rules_dependencies()

go_register_toolchains(version = "1.18")

http_archive(
    name = "rules_multirun",
    sha256 = "504612040149edce01376c4809b33f2e0c5331cdd0ec56df562dc89ecbc045a0",
    strip_prefix = "rules_multirun-0.9.0",
    url = "https://github.com/keith/rules_multirun/archive/refs/tags/0.9.0.tar.gz",
)

# Buildifier
http_archive(
    name = "buildifier_prebuilt",
    sha256 = "8ada9d88e51ebf5a1fdff37d75ed41d51f5e677cdbeafb0a22dda54747d6e07e",
    strip_prefix = "buildifier-prebuilt-6.4.0",
    urls = [
        "http://github.com/keith/buildifier-prebuilt/archive/6.4.0.tar.gz",
    ],
)

load("@buildifier_prebuilt//:deps.bzl", "buildifier_prebuilt_deps")

buildifier_prebuilt_deps()

load("@bazel_skylib//:workspace.bzl", "bazel_skylib_workspace")

bazel_skylib_workspace()

load("@buildifier_prebuilt//:defs.bzl", "buildifier_prebuilt_register_toolchains")

buildifier_prebuilt_register_toolchains()

# Test262
TEST262_COMMIT = "ade328d530525333751e8a3b58f02e18624da085"

DOCKER_RULES_COMMIT = "b6231a43e19b7d2a32c7a7487ce9f4f40d85e992"

http_archive(
    name = "com_github_tc39_test262",
    build_file = "@//:test262.BUILD",
    sha256 = "f4915077f38016d0f20ad8cbeaeec4e3d4a5eca3a98a895e01653f3375802a4b",
    strip_prefix = "tc39-test262-%s" % TEST262_COMMIT[:7],
    type = "tar.gz",
    urls = ["https://github.com/tc39/test262/tarball/%s" % TEST262_COMMIT],
)

# Docker
http_archive(
    name = "io_bazel_rules_docker",
    sha256 = "d429279fa3f1ccd2a44c5db8cd995a06564fa9a349e6fd48dded19fc66d131b6",
    strip_prefix = "rules_docker-%s" % DOCKER_RULES_COMMIT,
    type = "tar.gz",
    urls = ["https://github.com/bassco/rules_docker/archive/%s.tar.gz" % DOCKER_RULES_COMMIT],
)

load(
    "@io_bazel_rules_docker//repositories:repositories.bzl",
    container_repositories = "repositories",
)

container_repositories()

load("@io_bazel_rules_docker//repositories:deps.bzl", container_deps = "deps")

container_deps()

load(
    "@io_bazel_rules_docker//container:container.bzl",
    "container_pull",
)

container_pull(
    name = "ubuntu23",
    architecture = "amd64",
    digest = "sha256:fd7fe639db24c4e005643921beea92bc449aac4f4d40d60cd9ad9ab6456aec01",
    registry = "index.docker.io",
    repository = "library/ubuntu",
    tag = "23.10",
)

http_archive(
    name = "io_buildbuddy_buildbuddy_toolchain",
    sha256 = "baa9af1b9fcc96d18ac90a4dd68ebd2046c8beb76ed89aea9aabca30959ad30c",
    strip_prefix = "buildbuddy-toolchain-287d6042ad151be92de03c83ef48747ba832c4e2",
    urls = ["https://github.com/buildbuddy-io/buildbuddy-toolchain/archive/287d6042ad151be92de03c83ef48747ba832c4e2.tar.gz"],
)

load("@io_buildbuddy_buildbuddy_toolchain//:deps.bzl", "buildbuddy_deps")

buildbuddy_deps()

load("@io_buildbuddy_buildbuddy_toolchain//:rules.bzl", "buildbuddy")

buildbuddy(name = "buildbuddy_toolchain")

# Rust# ----

# To find additional information on this release or newer ones visit:
# https://github.com/bazelbuild/rules_rust/releases
http_archive(
    name = "rules_rust",
    # Workaround for https://github.com/bazelbuild/rules_rust/issues/1330
    patches = ["//tools:rules_rust.patch"],
    sha256 = "042acfb73469b2d1848fe148d81c3422c61ea47a9e1900f1c9ec36f51e8e7193",
    urls = ["https://github.com/bazelbuild/rules_rust/releases/download/0.51.0/rules_rust-v0.51.0.tar.gz"],
)

load("@rules_rust//crate_universe:defs.bzl", "crates_repository")
load("@rules_rust//rust:repositories.bzl", "rules_rust_dependencies", "rust_register_toolchains")

rules_rust_dependencies()

rust_register_toolchains(
    edition = "2021",
    extra_target_triples = [
        "wasm32-unknown-unknown",
        "wasm32-wasi",
    ],
)

# Run `CARGO_BAZEL_REPIN=1 bazel sync --only=crate_index` after updating
crates_repository(
    name = "crate_index",
    cargo_lockfile = "//rust:Cargo.lock",
    lockfile = "//rust:cargo-bazel-lock.json",
    manifests = [
        "//rust:Cargo.toml",
        "//rust/icu-messageformat-parser:Cargo.toml",
        "//rust/swc-formatjs-visitor:Cargo.toml",
        "//rust/swc-plugin-formatjs:Cargo.toml",
        # FIX THIS
        # "//rust/swc-formatjs-custom-transform:Cargo.toml",
    ],
)

load("@crate_index//:defs.bzl", "crate_repositories")

crate_repositories()

# Linter
# ------------------------------------------------------------------------------

http_archive(
    name = "aspect_rules_lint",
    sha256 = "ddc21b1399c03708f82e5a46d6c747bf23d55484bad1efdaa92a22d5fee20ea1",
    strip_prefix = "rules_lint-0.5.0",
    url = "https://github.com/aspect-build/rules_lint/releases/download/v0.5.0/rules_lint-v0.5.0.tar.gz",
)

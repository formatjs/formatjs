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
    sha256 = "dcd1567d4a93a8634ec0b888b371a60b93c18d980f77dace02eb176531a71fcf",
    strip_prefix = "rules_js-1.26.0",
    url = "https://github.com/aspect-build/rules_js/releases/download/v1.26.0/rules_js-v1.26.0.tar.gz",
)

load("@aspect_rules_js//js:repositories.bzl", "rules_js_dependencies")

rules_js_dependencies()

load("@rules_nodejs//nodejs:repositories.bzl", "DEFAULT_NODE_VERSION", "nodejs_register_toolchains")

nodejs_register_toolchains(
    name = "nodejs",
    node_version = DEFAULT_NODE_VERSION,
)

load("@aspect_rules_js//npm:npm_import.bzl", "npm_translate_lock")

npm_translate_lock(
    name = "npm",
    patch_args = {
        "make-plural-compiler@5.1.0": ["-p1"],
    },
    patches = {
        "make-plural-compiler@5.1.0": ["//:npm_package_patches/make-plural-compiler+5.1.0.patch"],
    },
    pnpm_lock = "//:pnpm-lock.yaml",
    verify_node_modules_ignored = "//:.bazelignore",
)

load("@npm//:repositories.bzl", "npm_repositories")

npm_repositories()

IANA_TZ_VERSION = "2023c"

http_file(
    name = "tzdata",
    downloaded_file_path = "tzdata.tar.gz",
    sha256 = "3f510b5d1b4ae9bb38e485aa302a776b317fb3637bdb6404c4adf7b6cadd965c",
    urls = ["https://data.iana.org/time-zones/releases/tzdata%s.tar.gz" % IANA_TZ_VERSION],
)

http_file(
    name = "tzcode",
    downloaded_file_path = "tzcode.tar.gz",
    sha256 = "46d17f2bb19ad73290f03a203006152e0fa0d7b11e5b71467c4a823811b214e7",
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
    sha256 = "ace5b609603d9b5b875d56c9c07182357c4ee495030f40dcefb10d443ba8c208",
    strip_prefix = "rules_ts-1.4.0",
    url = "https://github.com/aspect-build/rules_ts/releases/download/v1.4.0/rules_ts-v1.4.0.tar.gz",
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
    ts_integrity = "sha512-cW9T5W9xY37cc+jfEnaUvX91foxtHkza3Nw3wkoF4sSlKn0MONdkdEndig/qPBWXNkmplh3NzayQzCiHM4/hqw==",
    ts_version_from = "//:package.json",
)

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
        "https://github.com/bazelbuild/rules_go/releases/download/v0.39.1/rules_go-v0.35.0.zip",
    ],
)

load("@io_bazel_rules_go//go:deps.bzl", "go_register_toolchains", "go_rules_dependencies")

go_rules_dependencies()

go_register_toolchains(version = "1.18")

http_archive(
    name = "rules_multirun",
    sha256 = "9ced12fb88f793c2f0a8c19f498485c4a95c22c91bb51fc4ec6812d41fc3331d",
    strip_prefix = "rules_multirun-0.6.0",
    url = "https://github.com/keith/rules_multirun/archive/refs/tags/0.6.0.tar.gz",
)

# Buildifier
http_archive(
    name = "buildifier_prebuilt",
    sha256 = "e46c16180bc49487bfd0f1ffa7345364718c57334fa0b5b67cb5f27eba10f309",
    strip_prefix = "buildifier-prebuilt-6.1.0",
    urls = [
        "http://github.com/keith/buildifier-prebuilt/archive/6.1.0.tar.gz",
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
    sha256 = "b1e80761a8a8243d03ebca8845e9cc1ba6c82ce7c5179ce2b295cd36f7e394bf",
    urls = ["https://github.com/bazelbuild/rules_docker/releases/download/v0.25.0/rules_docker-v0.25.0.tar.gz"],
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
    name = "ubuntu22",
    architecture = "amd64",
    digest = "sha256:d69f6ed3c483abe6ed19d7310acacd14012fd62874ea98edccddf6ac7af3ce93",
    registry = "index.docker.io",
    repository = "library/ubuntu",
    tag = "22.10",
)

http_archive(
    name = "io_buildbuddy_buildbuddy_toolchain",
    sha256 = "a430e0b50ee9c64713cfc476c610f80e9a8a3f84fb27c96f0da886f21d5bf3e1",
    strip_prefix = "buildbuddy-toolchain-f0a5cf35d2f580e623996fcf13108f319a79d8c5",
    urls = ["https://github.com/buildbuddy-io/buildbuddy-toolchain/archive/f0a5cf35d2f580e623996fcf13108f319a79d8c5.tar.gz"],
)

load("@io_buildbuddy_buildbuddy_toolchain//:deps.bzl", "buildbuddy_deps")

buildbuddy_deps()

load("@io_buildbuddy_buildbuddy_toolchain//:rules.bzl", "buildbuddy")

buildbuddy(name = "buildbuddy_toolchain")

# Rust
# ----

# To find additional information on this release or newer ones visit:
# https://github.com/bazelbuild/rules_rust/releases
http_archive(
    name = "rules_rust",
    # Workaround for https://github.com/bazelbuild/rules_rust/issues/1330
    patches = ["//tools:rules_rust.patch"],
    sha256 = "324c2a86a8708d30475f324846b35965c432b63a35567ed2b5051b86791ce345",
    urls = ["https://github.com/bazelbuild/rules_rust/releases/download/0.13.0/rules_rust-v0.13.0.tar.gz"],
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

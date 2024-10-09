# Bazel workspace created by @bazel/create 1.7.0

# Declares that this directory is the root of a Bazel workspace.
# See https://docs.bazel.build/versions/master/build-ref.html#workspace
workspace(
    # How this workspace would be referenced with absolute labels from another workspace
    name = "formatjs",
)

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

# rules_js
http_archive(
    name = "aspect_rules_js",
    sha256 = "2cfb3875e1231cefd3fada6774f2c0c5a99db0070e0e48ea398acbff7c6c765b",
    strip_prefix = "rules_js-1.42.3",
    url = "https://github.com/aspect-build/rules_js/releases/download/v1.42.3/rules_js-v1.42.3.tar.gz",
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
    sha256 = "f69a6452b129d39d9b05f3dff8b1057185bb195b4daf0cff419988de757c6c31",
    strip_prefix = "rules_ts-2.4.2",
    url = "https://github.com/aspect-build/rules_ts/releases/download/v2.4.2/rules_ts-v2.4.2.tar.gz",
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
    name = "rules_python",
    sha256 = "e85ae30de33625a63eca7fc40a94fea845e641888e52f32b6beea91e8b1b2793",
    strip_prefix = "rules_python-0.27.1",
    url = "https://github.com/bazelbuild/rules_python/releases/download/0.27.1/rules_python-0.27.1.tar.gz",
)

load("@rules_python//python:repositories.bzl", "py_repositories")

py_repositories()

http_archive(
    name = "rules_multirun",
    sha256 = "0e124567fa85287874eff33a791c3bbdcc5343329a56faa828ef624380d4607c",
    url = "https://github.com/keith/rules_multirun/releases/download/0.9.0/rules_multirun.0.9.0.tar.gz",
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

http_archive(
    name = "com_github_tc39_test262",
    build_file = "@//:test262.BUILD",
    sha256 = "f4915077f38016d0f20ad8cbeaeec4e3d4a5eca3a98a895e01653f3375802a4b",
    strip_prefix = "tc39-test262-%s" % TEST262_COMMIT[:7],
    type = "tar.gz",
    urls = ["https://github.com/tc39/test262/tarball/%s" % TEST262_COMMIT],
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
    integrity = "sha256-JLN47ZcAbx9wEr5Jiib4HduZATGLiDgK7oUi/fvotzU=",
    # Workaround for https://github.com/bazelbuild/rules_rust/issues/1330
    patches = ["//tools:rules_rust.patch"],
    urls = ["https://github.com/bazelbuild/rules_rust/releases/download/0.42.1/rules_rust-v0.42.1.tar.gz"],
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

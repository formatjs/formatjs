load("@with_cfg.bzl", "with_cfg")
load(
    "//crates/formatjs_cli:release_binary.bzl",
    "release_binary_darwin_arm64",
    "release_binary_darwin_x64",
    "release_binary_linux_arm64",
    "release_binary_linux_arm64_gnu",
    "release_binary_linux_x64",
    "release_binary_linux_x64_gnu",
    "release_binary_windows_arm64",
    "release_binary_windows_x64",
    _release_node_linux_arm64_musl = "release_node_linux_arm64_musl",
    _release_node_linux_x64_musl = "release_node_linux_x64_musl",
)

release_node_freebsd_x64, _release_node_freebsd_x64_internal = with_cfg(
    native.genrule,
).set(
    "compilation_mode",
    "opt",
).set(
    "platforms",
    [Label("@rules_rs//rs/platforms:x86_64-unknown-freebsd")],
).extend(
    "extra_toolchains",
    [Label("//tools/freebsd:linux_x86_64_to_freebsd_x86_64")],
).build()

release_node_darwin_arm64 = release_binary_darwin_arm64
release_node_linux_arm64 = release_binary_linux_arm64_gnu
release_node_linux_arm64_musl = _release_node_linux_arm64_musl
release_node_linux_x64 = release_binary_linux_x64_gnu
release_node_linux_x64_musl = _release_node_linux_x64_musl
release_node_win32_x64 = release_binary_windows_x64

release_node_darwin_x64 = release_binary_darwin_x64
release_node_win32_arm64 = release_binary_windows_arm64

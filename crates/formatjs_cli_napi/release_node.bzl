load("@with_cfg.bzl", "with_cfg")
load(
    "//crates/formatjs_cli:release_binary.bzl",
    "release_binary_darwin_arm64",
    "release_binary_linux_arm64_gnu",
    "release_binary_linux_x64_gnu",
)

def _host_release_node():
    return with_cfg(
        native.genrule,
    ).set(
        "compilation_mode",
        "opt",
    ).build()

release_node_darwin_arm64 = release_binary_darwin_arm64
release_node_linux_arm64 = release_binary_linux_arm64_gnu
release_node_linux_x64 = release_binary_linux_x64_gnu
release_node_win32_x64, _release_node_win32_x64_internal = _host_release_node()

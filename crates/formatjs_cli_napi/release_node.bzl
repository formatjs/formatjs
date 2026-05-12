load("//crates/formatjs_cli:release_binary.bzl", "release_binary_darwin_arm64", "release_binary_linux_x64_gnu")

release_node_darwin_arm64 = release_binary_darwin_arm64
release_node_linux_x64 = release_binary_linux_x64_gnu

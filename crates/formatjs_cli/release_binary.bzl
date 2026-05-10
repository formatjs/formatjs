load("@with_cfg.bzl", "with_cfg")

release_binary_linux_x64, _release_binary_linux_x64_internal = with_cfg(
    native.genrule,
).set(
    "compilation_mode",
    "opt",
).set(
    "platforms",
    [Label("//crates/formatjs_cli/platforms:linux_x86_64_musl")],
).extend(
    "extra_toolchains",
    [
        Label("@llvm_toolchains//:bootstrap_linux_aarch64_to_linux_x86_64"),
        Label("@llvm_toolchains//:bootstrap_linux_x86_64_to_linux_x86_64"),
        Label("@llvm_toolchains//:bootstrap_macos_aarch64_to_linux_x86_64"),
        Label("@llvm_toolchains//:bootstrap_macos_x86_64_to_linux_x86_64"),
        Label("@llvm_toolchains//:bootstrap_windows_aarch64_to_linux_x86_64"),
        Label("@llvm_toolchains//:bootstrap_windows_x86_64_to_linux_x86_64"),
        Label("@llvm_toolchains//:linux_aarch64_to_linux_x86_64"),
        Label("@llvm_toolchains//:linux_x86_64_to_linux_x86_64"),
        Label("@llvm_toolchains//:macos_aarch64_to_linux_x86_64"),
        Label("@llvm_toolchains//:macos_x86_64_to_linux_x86_64"),
        Label("@llvm_toolchains//:windows_aarch64_to_linux_x86_64"),
        Label("@llvm_toolchains//:windows_x86_64_to_linux_x86_64"),
    ],
).set(
    Label("@llvm//config:experimental_stub_libgcc_s"),
    True,
).set(
    Label("@llvm//config/bootstrap:experimental_stub_libgcc_s"),
    True,
).build()

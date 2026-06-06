load("@with_cfg.bzl", "with_cfg")

_HOSTS = [
    "linux_aarch64",
    "linux_x86_64",
    "macos_aarch64",
    "macos_x86_64",
    "windows_aarch64",
    "windows_x86_64",
]

def _llvm_toolchains(target):
    return [
        Label("@llvm_toolchains//:bootstrap_%s_to_%s" % (host, target))
        for host in _HOSTS
    ] + [
        Label("@llvm_toolchains//:%s_to_%s" % (host, target))
        for host in _HOSTS
    ]

def _release_binary(platform, llvm_target = None, extra_rustc_flags = []):
    builder = with_cfg(
        native.genrule,
    ).set(
        "compilation_mode",
        "opt",
    ).set(
        "platforms",
        [Label(platform)],
    )
    if llvm_target:
        builder = builder.extend(
            "extra_toolchains",
            _llvm_toolchains(llvm_target),
        ).set(
            Label("@llvm//config:experimental_stub_libgcc_s"),
            True,
        ).set(
            Label("@llvm//config/bootstrap:experimental_stub_libgcc_s"),
            True,
        )
    if extra_rustc_flags:
        builder = builder.extend(
            Label("@rules_rust//rust/settings:extra_rustc_flag"),
            extra_rustc_flags,
        )
    return builder.build()

release_binary_darwin_arm64, _release_binary_darwin_arm64_internal = _release_binary(
    "//crates/formatjs_cli/platforms:darwin_arm64",
    "macos_aarch64",
)

release_binary_linux_x64, _release_binary_linux_x64_internal = _release_binary(
    "//crates/formatjs_cli/platforms:linux_x86_64_musl",
    "linux_x86_64",
)

release_binary_linux_arm64, _release_binary_linux_arm64_internal = _release_binary(
    "//crates/formatjs_cli/platforms:linux_aarch64_musl",
    "linux_aarch64",
)

release_node_linux_x64_musl, _release_node_linux_x64_musl_internal = _release_binary(
    "//crates/formatjs_cli/platforms:linux_x86_64_musl",
    "linux_x86_64",
    extra_rustc_flags = ["-Cprefer-dynamic"],
)

release_node_linux_arm64_musl, _release_node_linux_arm64_musl_internal = _release_binary(
    "//crates/formatjs_cli/platforms:linux_aarch64_musl",
    "linux_aarch64",
    extra_rustc_flags = ["-Cprefer-dynamic"],
)

release_binary_linux_x64_gnu, _release_binary_linux_x64_gnu_internal = _release_binary(
    "//crates/formatjs_cli/platforms:linux_x86_64",
    "linux_x86_64",
)

release_binary_linux_arm64_gnu, _release_binary_linux_arm64_gnu_internal = _release_binary(
    "//crates/formatjs_cli/platforms:linux_aarch64",
    "linux_aarch64",
)

release_binary_windows_x64, _release_binary_windows_x64_internal = _release_binary(
    "//crates/formatjs_cli/platforms:windows_x86_64_msvc",
)

release_binary_windows_x64_gnullvm, _release_binary_windows_x64_gnullvm_internal = _release_binary(
    "//crates/formatjs_cli/platforms:windows_x86_64_gnullvm",
    "windows_x86_64",
)

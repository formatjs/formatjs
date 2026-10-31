"""Cross-compiled Rust archives for the standalone Hermes SDK."""

load("@with_cfg.bzl", "with_cfg")

_HOSTS = [
    "linux_aarch64",
    "linux_x86_64",
    "macos_aarch64",
    "macos_x86_64",
    "windows_aarch64",
    "windows_x86_64",
]

def _archive(platform, llvm_target):
    return with_cfg(native.filegroup).set(
        "compilation_mode",
        "opt",
    ).set(
        Label("@rules_rust//rust/settings:lto"),
        "thin",
    ).set(
        "platforms",
        [Label(platform)],
    ).extend(
        "extra_toolchains",
        [Label("@llvm//toolchain:%s_to_%s" % (host, llvm_target)) for host in _HOSTS],
    ).set(
        Label("@llvm//config:experimental_stub_libgcc_s"),
        True,
    ).set(
        Label("@llvm//config/bootstrap:experimental_stub_libgcc_s"),
        True,
    ).build()

linux_archive, _linux_archive_internal = _archive(
    "//native/hermes/package:linux_x86_64",
    "linux_x86_64",
)

darwin_archive, _darwin_archive_internal = _archive(
    "//native/hermes/package:darwin_arm64",
    "macos_aarch64",
)

android_archive, _android_archive_internal = with_cfg(native.filegroup).set(
    "compilation_mode",
    "opt",
).set(
    Label("@rules_rust//rust/settings:lto"),
    "thin",
).set(
    "platforms",
    [Label("//native/hermes/package:android_arm64")],
).build()

android_x86_64_archive, _android_x86_64_archive_internal = with_cfg(native.filegroup).set(
    "compilation_mode",
    "opt",
).set(
    Label("@rules_rust//rust/settings:lto"),
    "thin",
).set(
    "platforms",
    [Label("//native/hermes/package:android_x86_64")],
).build()

darwin_x86_64_archive, _darwin_x86_64_archive_internal = _archive(
    "//native/hermes/package:darwin_x86_64",
    "macos_x86_64",
)

ios_arm64_archive, _ios_arm64_archive_internal = with_cfg(native.filegroup).set(
    "compilation_mode",
    "opt",
).set(
    Label("@rules_rust//rust/settings:lto"),
    "thin",
).set(
    "platforms",
    [Label("//native/hermes/package:ios_arm64")],
).extend(
    "extra_toolchains",
    [Label("//tools/apple_archive:linux_" + host + "_to_ios_arm64") for host in ["x86_64", "aarch64"]],
).build()

ios_sim_arm64_archive, _ios_sim_arm64_archive_internal = with_cfg(native.filegroup).set(
    "compilation_mode",
    "opt",
).set(
    Label("@rules_rust//rust/settings:lto"),
    "thin",
).set(
    "platforms",
    [Label("//native/hermes/package:ios_sim_arm64")],
).extend(
    "extra_toolchains",
    [Label("//tools/apple_archive:linux_" + host + "_to_ios_sim_arm64") for host in ["x86_64", "aarch64"]],
).build()

ios_sim_x86_64_archive, _ios_sim_x86_64_archive_internal = with_cfg(native.filegroup).set(
    "compilation_mode",
    "opt",
).set(
    Label("@rules_rust//rust/settings:lto"),
    "thin",
).set(
    "platforms",
    [Label("//native/hermes/package:ios_sim_x86_64")],
).extend(
    "extra_toolchains",
    [Label("//tools/apple_archive:linux_" + host + "_to_ios_sim_x86_64") for host in ["x86_64", "aarch64"]],
).build()

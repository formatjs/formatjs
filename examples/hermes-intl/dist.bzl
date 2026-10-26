"""Cross-build the consumer with its own development toolchain."""

load("@with_cfg.bzl", "with_cfg")

_macos_arm64 = with_cfg(native.filegroup)
_macos_arm64.set("platforms", [Label("@llvm//platforms:macos_aarch64")])
_macos_arm64.set("compilation_mode", "opt")
smoke_macos_arm64, _smoke_macos_arm64_internal = _macos_arm64.build()

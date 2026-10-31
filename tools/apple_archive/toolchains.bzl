"""SDK-free Linux tools for Rust archives and their header-free allocator shim."""

load("@llvm//toolchain:selects.bzl", "platform_cc_tool_map")
load("@rules_cc//cc/toolchains:args.bzl", "cc_args")
load("@rules_cc//cc/toolchains:toolchain.bzl", "cc_toolchain")

_TARGETS = {
    "ios_arm64": ("aarch64", "arm64-apple-ios15.1"),
    "ios_sim_arm64": ("aarch64", "arm64-apple-ios15.1-simulator"),
    "ios_sim_x86_64": ("x86_64", "x86_64-apple-ios15.1-simulator"),
}

def apple_archive_toolchains():
    """Declare archive tools; Apple SDK consumer linking still uses Xcode."""
    for target, (cpu, triple) in _TARGETS.items():
        cc_args(
            name = target + "_compile_args",
            actions = ["@rules_cc//cc/toolchains/actions:compile_actions"],
            args = ["--target=" + triple, "-fPIC"],
            tags = ["manual"],
        )
        for host in ["x86_64", "aarch64"]:
            name = "linux_" + host + "_to_" + target
            cc_toolchain(
                name = name + "_cc",
                tool_map = platform_cc_tool_map("linux", host),
                args = [":" + target + "_compile_args"],
                compiler = "clang",
                cpu = cpu,
                target_libc = "ios",
                target_system_name = triple,
                supports_param_files = True,
                tags = ["manual"],
            )
            native.toolchain(
                name = name,
                toolchain = ":" + name + "_cc",
                toolchain_type = "@bazel_tools//tools/cpp:toolchain_type",
                tags = ["manual"],
                exec_compatible_with = [
                    "@platforms//os:linux",
                    "@platforms//cpu:" + host,
                ],
                target_compatible_with = [
                    "@platforms//os:ios",
                    "@platforms//cpu:" + cpu,
                ] + (["@apple_support//constraints:simulator"] if "sim" in target else []),
            )

#!/usr/bin/env bash
set -euo pipefail
artifact_dir=$(mktemp -d)
trap 'rm -rf "$artifact_dir"' EXIT

bazel_build_args=(--config=bb-workflow --compilation_mode=opt --remote_download_outputs=all)
bazel_query_args=(--config=bb-workflow --compilation_mode=opt)

bazel build "${bazel_build_args[@]}" \
  //crates/formatjs_cli:release_binary_darwin_arm64 \
  //crates/formatjs_cli:release_binary_linux_x64 \
  //crates/formatjs_cli:release_binary_linux_arm64 \
  //crates/formatjs_cli:release_binary_windows_x64 \
  //packages/cli-native-darwin-arm64:pkg \
  //packages/cli-native-linux-x64-musl:pkg \
  //packages/cli-native-linux-arm64-musl:pkg \
  //packages/cli-native-linux-x64:pkg \
  //packages/cli-native-linux-arm64:pkg \
  //packages/cli-native-win32-x64:pkg

darwin_path=$(bazel cquery "${bazel_query_args[@]}" --output=files //crates/formatjs_cli:release_binary_darwin_arm64 | tail -n 1)
darwin_package_dir=$(bazel cquery "${bazel_query_args[@]}" --output=files //packages/cli-native-darwin-arm64:pkg | tail -n 1)
windows_path=$(bazel cquery "${bazel_query_args[@]}" --output=files //crates/formatjs_cli:release_binary_windows_x64 | tail -n 1)
windows_package_dir=$(bazel cquery "${bazel_query_args[@]}" --output=files //packages/cli-native-win32-x64:pkg | tail -n 1)
mkdir -p "$artifact_dir"/cli-native-darwin-arm64 "$artifact_dir"/cli-native-win32-x64
cp "$darwin_path" "$artifact_dir"/formatjs_cli-darwin-arm64
cp -RL "$darwin_package_dir"/. "$artifact_dir"/cli-native-darwin-arm64/
cp "$windows_path" "$artifact_dir"/formatjs_cli-win32-x64.exe
cp -RL "$windows_package_dir"/. "$artifact_dir"/cli-native-win32-x64/

for arch in x64 arm64; do
  package="cli-native-linux-$arch-musl"
  package_dir=$(bazel cquery "${bazel_query_args[@]}" --output=files "//packages/$package:pkg" | tail -n 1)
  binary_path=$(bazel cquery "${bazel_query_args[@]}" --output=files "//crates/formatjs_cli:release_binary_linux_$arch" | tail -n 1)
  mkdir -p "$artifact_dir/$package"
  cp -RL "$package_dir"/. "$artifact_dir/$package/"
  cp "$binary_path" "$artifact_dir/$package/formatjs_cli"
done

darwin_info=$(file "$artifact_dir"/formatjs_cli-darwin-arm64)
darwin_addon_info=$(file "$artifact_dir"/cli-native-darwin-arm64/formatjs_cli_napi.node)
binary_info=$(file "$artifact_dir"/formatjs_cli-win32-x64.exe)
addon_info=$(file "$artifact_dir"/cli-native-win32-x64/formatjs_cli_napi.node)
echo "$darwin_info"
echo "$darwin_addon_info"
echo "$binary_info"
echo "$addon_info"
case "$darwin_info" in
  *"Mach-O 64-bit"*"arm64"*) ;;
  *)
    echo "Darwin CLI must be an arm64 Mach-O executable"
    exit 1
    ;;
esac
[[ "$darwin_addon_info" == *"Mach-O 64-bit"* && "$darwin_addon_info" == *"shared library"* && "$darwin_addon_info" == *"arm64"* ]] || {
  echo "Darwin native addon must be an arm64 Mach-O shared library"
  exit 1
}
case "$binary_info" in
  *"PE32+"*"console"*"x86-64"*) ;;
  *)
    echo "Windows CLI must be an x86-64 PE console executable"
    exit 1
    ;;
esac
case "$addon_info" in
  *"PE32+"*"DLL"*"x86-64"*) ;;
  *)
    echo "Windows native addon must be an x86-64 PE DLL"
    exit 1
    ;;
esac

for package in cli-native-linux-x64-musl cli-native-linux-arm64-musl; do
  artifact_info=$(file "$artifact_dir/$package/formatjs_cli_napi.node")
  binary_info=$(file "$artifact_dir/$package/formatjs_cli")
  echo "$artifact_info"
  echo "$binary_info"
  case "$package:$artifact_info" in
    cli-native-linux-x64-musl:*"x86-64"* | cli-native-linux-arm64-musl:*"ARM aarch64"*) ;;
    *)
      echo "Linux native addon has wrong architecture"
      exit 1
      ;;
  esac
  case "$artifact_info" in
    *"static-pie linked"* | *"statically linked"*)
      echo "musl Node addon must dynamically link libc"
      exit 1
      ;;
  esac
  if nm -a "$artifact_dir/$package/formatjs_cli_napi.node" | grep 'init_have_lse_atomics' >/dev/null; then
    echo "musl Node addon must not run compiler-rt outline atomics init during dlopen"
    exit 1
  fi
  case "$package:$binary_info" in
    cli-native-linux-x64-musl:*"x86-64"* | cli-native-linux-arm64-musl:*"ARM aarch64"*) ;;
    *)
      echo "Linux CLI has wrong architecture"
      exit 1
      ;;
  esac
  if readelf -l "$artifact_dir/$package/formatjs_cli" | grep 'INTERP' >/dev/null ||
    readelf -d "$artifact_dir/$package/formatjs_cli" | grep '(NEEDED)' >/dev/null; then
    echo "Linux release CLI should be a static musl binary"
    exit 1
  fi
done

for package in cli-native-linux-x64 cli-native-linux-arm64; do
  package_dir=$(bazel cquery "${bazel_query_args[@]}" --output=files "//packages/$package:pkg" | tail -n 1)
  mkdir -p "$artifact_dir/$package"
  cp -RL "$package_dir"/. "$artifact_dir/$package/"
  # Node happens to have libgcc_s loaded, so it hides missing unwinder
  # symbols that make the addon fail to load in other hosts like Bun.
  if nm -D --undefined-only "$artifact_dir/$package/formatjs_cli_napi.node" | grep '_Unwind_'; then
    echo "glibc Node addon must not leave _Unwind_* symbols undefined"
    exit 1
  fi
done

"$artifact_dir"/cli-native-linux-x64-musl/formatjs_cli --version
"$artifact_dir"/cli-native-linux-x64-musl/formatjs_cli --help
if strings "$artifact_dir"/cli-native-linux-x64-musl/formatjs_cli | grep 'GLIBC_' >/dev/null; then
  echo "Linux musl binary unexpectedly references glibc symbols" >&2
  exit 1
fi

tar -czf "$BUILDBUDDY_ARTIFACTS_DIRECTORY/release-cross-build-smoke.tar.gz" -C "$artifact_dir" .

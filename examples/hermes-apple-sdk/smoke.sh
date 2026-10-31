#!/usr/bin/env bash
set -euo pipefail

sdk_dir=$(cd "$1" && pwd)
cd "$(dirname "$0")"
args=("--override_module=formatjs_intl_getcanonicallocales_hermes=$sdk_dir")
build_info=$(mktemp)
trap 'rm -f "$build_info"' EXIT
while read -r platform triple architecture expected_platform; do
  library="$sdk_dir/lib/$triple/libformatjs_intl_hermes.a"
  test -s "$library"
  xcrun lipo -verify_arch "$architecture" "$library"
  bazel build "${args[@]}" --platforms="//:$platform" //:link_smoke
  executable=$(bazel cquery "${args[@]}" --platforms="//:$platform" --output=files //:link_smoke)
  xcrun vtool -show-build "$executable" | tee "$build_info"
  grep -Eq "platform[[:space:]]+$expected_platform$" "$build_info"
  if [[ "$platform" == "macos_$(uname -m)" ]]; then
    "$executable"
  fi
done <<'PLATFORMS'
ios_arm64 aarch64-apple-ios arm64 IOS
ios_sim_arm64 aarch64-apple-ios-sim arm64 IOSSIMULATOR
ios_sim_x86_64 x86_64-apple-ios x86_64 IOSSIMULATOR
macos_arm64 aarch64-apple-darwin arm64 MACOS
macos_x86_64 x86_64-apple-darwin x86_64 MACOS
PLATFORMS

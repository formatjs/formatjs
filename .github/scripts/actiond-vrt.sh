#!/usr/bin/env bash
# Build the pinned worker and run the editor's real remote capture/comparison.
set -euo pipefail
repo=$(pwd)
work=${RUNNER_TEMP:-/tmp}/formatjs-actiond
[[ $(uname -sm) == 'Linux x86_64' ]] || { echo 'VRT worker requires Linux x86_64'; exit 1; }
for device in /dev/kvm /dev/vhost-vsock; do
  [[ -c "$device" && -r "$device" && -w "$device" ]] || {
    echo "VRT worker requires read/write access to $device"; exit 1;
  }
done
bazel_bin=$(command -v bazel) || { echo "Install Bazel before building the VRT worker"; exit 1; }
mkdir -p "$work"
if [[ ! -d "$work/source/.git" ]]; then
  git init "$work/source"
  git -C "$work/source" remote add origin https://github.com/hermeticbuild/actiond.git
fi
git -C "$work/source" fetch --depth=1 origin 8a42c3d481df3a1bf1b80e95a9bb991a207fc035
git -C "$work/source" checkout --detach FETCH_HEAD
if git -C "$work/source" apply --check "$repo/tools/browser/actiond-advice.patch"; then
  git -C "$work/source" apply "$repo/tools/browser/actiond-advice.patch"
else
  git -C "$work/source" apply --reverse --check "$repo/tools/browser/actiond-advice.patch"
fi
(
  cd "$work/source"
  "$bazel_bin" build --bes_backend= --remote_executor= --remote_cache= --spawn_strategy=local --jobs=2 \
    //cmd/linux-actiond:linux-actiond_linux_x86_64 > "$work/build.log" 2>&1 || { tail -n 100 "$work/build.log"; exit 1; }
  worker=$("$bazel_bin" cquery --bes_backend= //cmd/linux-actiond:linux-actiond_linux_x86_64 \
    --output=starlark '--starlark:expr=providers(target)["DefaultInfo"].files_to_run.executable.path')
  cp "$worker" "$work/actiond"
)
"$work/actiond" serve-vm --root="$work/vm" --listen=127.0.0.1:8980 \
  --memory-mib=6144 --cpus=2 --cas-image-size-mib=4096 > "$work/vm.log" 2>&1 &
worker_pid=$!
trap 'kill "$worker_pid" 2>/dev/null || true' EXIT
ready=false
for attempt in $(seq 1 90); do
  kill -0 "$worker_pid"
  if (echo > /dev/tcp/127.0.0.1/8980) 2>/dev/null; then ready=true; break; fi
  sleep 1
done
"$ready" || { cat "$work/vm.log"; exit 1; }
flags=(--config=vrt --remote_executor=grpc://127.0.0.1:8980 --remote_cache=grpc://127.0.0.1:8980)
"$bazel_bin" test "${flags[@]}" //packages/editor/vrt:visual_test --test_output=errors
"$bazel_bin" run "${flags[@]}" //packages/editor/vrt:visual_test.update
git diff --exit-code -- packages/editor/vrt/__screenshots__

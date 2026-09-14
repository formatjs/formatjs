#!/usr/bin/env bash
# Build the pinned worker and run the editor's real remote capture/comparison.
set -euo pipefail
work=${RUNNER_TEMP:-/tmp}/formatjs-actiond
[[ $(uname -sm) == 'Linux x86_64' ]] || { echo 'VRT worker requires Linux x86_64'; exit 1; }
for device in /dev/kvm /dev/vhost-vsock; do
  [[ -c "$device" && -r "$device" && -w "$device" ]] || {
    echo "VRT worker requires read/write access to $device"; exit 1;
  }
done
bazel_bin=$(command -v bazel) || { echo "Install Bazel before building the VRT worker"; exit 1; }
mkdir -p "$work"
source=$(mktemp -d "$work/source.XXXXXX")
worker_pid=
cleanup() {
  if [[ -n "$worker_pid" ]]; then kill "$worker_pid" 2>/dev/null || true; fi
  rm -rf "$source"
}
trap cleanup EXIT
# Bazel owns source acquisition and checksum verification as well as builds.
"$bazel_bin" build @rules_web_e2e//tests/actiond:worker_source
archive=$("$bazel_bin" cquery @rules_web_e2e//tests/actiond:worker_source --output=files)
execution_root=$("$bazel_bin" info execution_root)
tar -xf "$execution_root/$archive" --strip-components=1 -C "$source"
(
  cd "$source"
  "$bazel_bin" --nosystem_rc --nohome_rc build --bes_backend= --remote_executor= --remote_cache= --spawn_strategy=local --jobs=2 \
    //cmd/linux-actiond:linux-actiond_linux_x86_64 > "$work/build.log" 2>&1 || { tail -n 100 "$work/build.log"; exit 1; }
  worker=$("$bazel_bin" --nosystem_rc --nohome_rc cquery --bes_backend= //cmd/linux-actiond:linux-actiond_linux_x86_64 \
    --output=starlark '--starlark:expr=providers(target)["DefaultInfo"].files_to_run.executable.path')
  cp "$worker" "$work/actiond"
)
"$work/actiond" serve-vm --root="$work/vm" --listen=127.0.0.1:8980 \
  --memory-mib=6144 --cpus=2 --cas-image-size-mib=4096 > "$work/vm.log" 2>&1 &
worker_pid=$!
ready=false
for attempt in $(seq 1 90); do
  kill -0 "$worker_pid"
  if (echo > /dev/tcp/127.0.0.1/8980) 2>/dev/null; then ready=true; break; fi
  sleep 1
done
"$ready" || { cat "$work/vm.log"; exit 1; }
worker_sha=$(sha256sum "$work/actiond" | cut -d ' ' -f 1)
flags=(--remote_default_exec_properties="actiond-worker-sha256=$worker_sha" --config=vrt --remote_executor=grpc://127.0.0.1:8980 --remote_cache=grpc://127.0.0.1:8980)
"$bazel_bin" test "${flags[@]}" //packages/editor/vrt:e2e_test //packages/editor/vrt:component_test //packages/editor/vrt:visual_test --test_output=errors
"$bazel_bin" build "${flags[@]}" //packages/editor/vrt:visual_test_capture
capture=$("$bazel_bin" cquery "${flags[@]}" //packages/editor/vrt:visual_test_capture --output=files)
# The action reports test failure in result.json, even when Bazel succeeds.
# Comparison above enforces matching.ts; PNG byte equality is stricter than it.
python3 - "$capture" packages/editor/vrt/__screenshots__ <<'PYTHON'
import json
from pathlib import Path
import sys

capture, references = map(Path, sys.argv[1:])
result = json.loads((capture / "result.json").read_text())
if result["exitCode"] != 0:
    raise SystemExit(f"Capture failed: {result}")
actual = {p.name for p in (capture / "baselines").glob("*.png")}
expected = {p.name for p in references.glob("*.png")}
if not actual or actual != expected:
    raise SystemExit(f"Capture set differs: expected {sorted(expected)}, got {sorted(actual)}")
print(f"Captured all {len(actual)} baselines; source files are unchanged.")
PYTHON

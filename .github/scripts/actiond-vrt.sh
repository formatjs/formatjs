#!/usr/bin/env bash
# CI owns the worker lifecycle; Bazel owns the worker download and browser tests.
set -euo pipefail
work=${RUNNER_TEMP:-/tmp}/formatjs-actiond
mkdir -p "$work"
bazel build //tools:actiond
worker=$(bazel cquery //tools:actiond --output=files)
worker_sha=$(sha256sum "$worker" | cut -d ' ' -f 1)
"$worker" serve-vm --root="$work/vm" --listen=127.0.0.1:8980 \
  --memory-mib=6144 --cpus=2 --cas-image-size-mib=4096 > "$work/vm.log" 2>&1 &
worker_pid=$!
trap 'kill "$worker_pid" 2>/dev/null || true; wait "$worker_pid" 2>/dev/null || true' EXIT

ready=false
for attempt in $(seq 1 90); do
  kill -0 "$worker_pid" || { cat "$work/vm.log"; exit 1; }
  if (echo > /dev/tcp/127.0.0.1/8980) 2>/dev/null; then ready=true; break; fi
  sleep 1
done
"$ready" || { cat "$work/vm.log"; exit 1; }

status=0
bazel test --config=vrt \
  --remote_executor=grpc://127.0.0.1:8980 \
  --remote_cache=grpc://127.0.0.1:8980 \
  --remote_default_exec_properties="actiond-worker-sha256=$worker_sha" \
  //packages/editor/vrt:e2e_test \
  //packages/editor/vrt:component_test \
  //packages/editor/vrt:visual_test \
  --test_output=errors || status=$?

if ((status != 0)); then
  bazel run --config=vrt \
    --remote_executor=grpc://127.0.0.1:8980 \
    --remote_cache=grpc://127.0.0.1:8980 \
    --remote_default_exec_properties="actiond-worker-sha256=$worker_sha" \
    //packages/editor/vrt:visual_test.update
fi
exit "$status"

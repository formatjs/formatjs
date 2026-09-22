#!/usr/bin/env bash
# Run outside `bazel run`: the supervisor invokes Bazel itself.
set -euo pipefail
work=${RUNNER_TEMP:-/tmp}/formatjs-actiond
mkdir -p "$work"
bazel run --script_path="$work/run-browser-tests" @rules_web_e2e//worker:runner
"$work/run-browser-tests" --log-dir="$work/logs" test \
  //packages/editor/vrt:e2e_test \
  //packages/editor/vrt:component_test \
  //packages/editor/vrt:visual_test \
  --test_output=errors

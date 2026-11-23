#!/usr/bin/env bash
set -euo pipefail
original="$PWD/$1"
preprocessor="$PWD/$2"
shift 2
export FORMATJS_TEMPORAL_SHARD_BASELINE="$PWD/$7"
export FORMATJS_TEMPORAL_SHARD_OUTPUT="${TEST_UNDECLARED_OUTPUTS_DIR:?}/shard-baseline.json"
if [[ "${TEST_TOTAL_SHARDS:-0}" == 0 ]]; then
  export TEST_TOTAL_SHARDS=1 TEST_SHARD_INDEX=0
fi
if [[ -n "${TEST_SHARD_STATUS_FILE:-}" ]]; then
  touch "$TEST_SHARD_STATUS_FILE"
fi
exec "$original" "${@:1:6}" "$FORMATJS_TEMPORAL_SHARD_OUTPUT" "${@:8}" \
  "--preprocessor=$preprocessor"

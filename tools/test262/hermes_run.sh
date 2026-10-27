#!/usr/bin/env bash
set -euo pipefail

harness="$1"
host="$2"
runner="$3"
suite="$4"
timeout="$5"
temporal_prelude="$6"
temporal_shim="$7"
root="../+http_archive+com_github_tc39_test262"
report="${TEST_UNDECLARED_OUTPUTS_DIR:?}/results.json"

export FORMATJS_HERMES_RUNNER="$PWD/$runner"
export FORMATJS_HERMES_TEMPORAL_PRELUDE="$PWD/$temporal_prelude"
export FORMATJS_HERMES_TEMPORAL_SHIM="$PWD/$temporal_shim"
export BAZEL_BINDIR=.
status=0
"$harness" \
  --host-type=hermes \
  --host-path="$PWD/$host" \
  --threads=4 \
  --reporter=json \
  --reporter-keys=file,scenario,result,rawResult \
  --errorForFailures \
  --timeout="$timeout" \
  --test262Dir="$root" \
  "$root/test/intl402/$suite/**/*.js" >"$report" 2>"${TEST_UNDECLARED_OUTPUTS_DIR}/stderr.txt" || status=$?

if ! grep -q '"file":' "$report"; then
  echo "Test262 discovered no tests for $suite" >&2
  exit 1
fi
if (( status != 0 )); then
  echo "Hermes Test262 $suite: $(grep -c '"pass":false' "$report") failures; see results.json" >&2
  exit "$status"
fi

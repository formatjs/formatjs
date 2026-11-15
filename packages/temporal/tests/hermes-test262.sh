#!/usr/bin/env bash
set -euo pipefail
harness="$1"
host="$PWD/$2"
export FORMATJS_TEMPORAL_HERMES_RUNNER="$PWD/$3"
prelude="$4"
mode="$5"
unset FORMATJS_TEMPORAL_HERMES_COMPILER
if [[ "$mode" == bytecode ]]; then
  export FORMATJS_TEMPORAL_HERMES_COMPILER="$PWD/$6"
fi
baseline="$7"
validator="$8"
shift 8
root="../+http_archive+com_github_tc39_test262"
export BAZEL_BINDIR=.
report="${TEST_UNDECLARED_OUTPUTS_DIR:?}/results.json"
status=0
"$harness" --host-type=hermes --host-path="$host" --threads=4 \
  --reporter=json --reporter-keys=file,scenario,result,rawResult \
  --errorForFailures --timeout=30000 --test262Dir="$root" \
  --prelude="$prelude" "$@" >"$report" 2>"${TEST_UNDECLARED_OUTPUTS_DIR}/stderr.txt" || status=$?
printf '%s\n' "$status" >"${TEST_UNDECLARED_OUTPUTS_DIR}/exit-code.txt"
exec "$validator" --suite Temporal.Instant --baseline "$baseline" --report "$report" \
  --status "${TEST_UNDECLARED_OUTPUTS_DIR}/exit-code.txt" \
  --stderr "${TEST_UNDECLARED_OUTPUTS_DIR}/stderr.txt"

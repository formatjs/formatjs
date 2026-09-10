#!/usr/bin/env bash
set -euo pipefail

harness="$1"
validator="$2"
suite="$3"
baseline="$4"
shift 4
report_dir="${TEST_UNDECLARED_OUTPUTS_DIR:?}"
status=0
"$harness" "$@" >"$report_dir/results.json" 2>"$report_dir/stderr.txt" || status=$?
printf '%s\n' "$status" >"$report_dir/exit-code.txt"
exec "$validator" --suite "$suite" --baseline "$baseline" --report "$report_dir/results.json" --status "$report_dir/exit-code.txt" --stderr "$report_dir/stderr.txt"

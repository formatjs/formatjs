#!/usr/bin/env bash
set -euo pipefail

tests="$1"
shift
export TEST262_REPORT_DIR="${TEST_UNDECLARED_OUTPUTS_DIR:?}"
for fixture in pass fail empty; do
    status=0
    "$1" --reporter json --reporter-keys file,scenario,result --errorForFailures --test262Dir tools/test262/fixtures "tools/test262/fixtures/test/$fixture.js" >"$TEST262_REPORT_DIR/fixture-$fixture.json" || status=$?
    printf '%s\n' "$status" >"$TEST262_REPORT_DIR/fixture-$fixture.status"
    shift
done
exec "$tests"

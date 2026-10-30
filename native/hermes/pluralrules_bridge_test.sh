#!/usr/bin/env bash
set -euo pipefail
"$1" "--extensions=$2" "$3" > "$TEST_TMPDIR/bridge.stdout"
cat "$TEST_TMPDIR/bridge.stdout"
grep -q 'Hermes PluralRules bridge passed' "$TEST_TMPDIR/bridge.stdout"

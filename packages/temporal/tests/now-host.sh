#!/usr/bin/env bash
set -euo pipefail
runner="$PWD/$1"
compiler="$PWD/$2"
source="$PWD/$3"
"$compiler" -O -emit-binary -Xes6-block-scoping -Wno-undefined-variable \
  -out "${TEST_TMPDIR:?}/now.hbc" "$source"
for zone in UTC America/New_York Asia/Kathmandu; do
  TZ="$zone" "$runner" --es6-block-scoping "$source"
  TZ="$zone" "$runner" --es6-block-scoping "${TEST_TMPDIR}/now.hbc"
done

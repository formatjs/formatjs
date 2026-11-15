#!/usr/bin/env bash
set -euo pipefail
runner="$PWD/$1"
compiler="$PWD/$2"
source="$PWD/$3"
"$runner" --es6-block-scoping "$source"
"$compiler" -O -emit-binary -Xes6-block-scoping -Wno-undefined-variable \
  -out "${TEST_TMPDIR:?}/oracle.hbc" "$source"
"$runner" --es6-block-scoping "${TEST_TMPDIR}/oracle.hbc"

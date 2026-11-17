#!/usr/bin/env bash
set -euo pipefail
runner="$PWD/$1"
compiler="$PWD/$2"
probe="$PWD/$3"
"$runner" --es6-block-scoping "$probe"
"$compiler" -O -emit-binary -Xes6-block-scoping -Wno-undefined-variable \
  -out "${TEST_TMPDIR:?}/probe.hbc" "$probe"
"$runner" --es6-block-scoping "${TEST_TMPDIR}/probe.hbc"

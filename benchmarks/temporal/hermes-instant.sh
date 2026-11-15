#!/usr/bin/env bash
set -euo pipefail
runner="$PWD/$1"
compiler="$PWD/$2"
source="$PWD/$3"
temporary="$(mktemp -d)"
trap 'rm -rf "$temporary"' EXIT
"$compiler" -O -emit-binary -Xes6-block-scoping -Wno-undefined-variable -out "$temporary/instant.hbc" "$source"
unset FORMATJS_TEMPORAL_RUST_ISO
for profile in typescript rust; do
  if [[ "$profile" == rust ]]; then export FORMATJS_TEMPORAL_RUST_ISO=1; fi
  for mode in source bytecode; do
    file="$source"
    if [[ "$mode" == bytecode ]]; then file="$temporary/instant.hbc"; fi
    result="$(TZ=UTC "$runner" --es6-block-scoping --native-datetimeformat "$file")"
    printf '{"mode":"%s","result":%s}\n' "$mode" "$result"
  done
done

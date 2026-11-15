#!/usr/bin/env bash
set -euo pipefail
args=()
for arg in "$@"; do
  case "$arg" in
    -Xintl|-enable-eval|-fenable-tdz|-non-strict) ;;
    *) args+=("$arg") ;;
  esac
done
if [[ -n "${FORMATJS_TEMPORAL_HERMES_COMPILER:-}" ]]; then
  directory="$(mktemp -d)"
  trap 'rm -rf "$directory"' EXIT
  # Temporal is installed dynamically; eshost treats compiler warnings as errors.
  "$FORMATJS_TEMPORAL_HERMES_COMPILER" -Xes6-block-scoping -Wno-undefined-variable -O -emit-binary -out "$directory/test.hbc" "${args[@]}"
  "$FORMATJS_TEMPORAL_HERMES_RUNNER" --es6-block-scoping "${FORMATJS_TEMPORAL_HERMES_PRELUDE:?}" "$directory/test.hbc"
  exit $?
fi
exec "${FORMATJS_TEMPORAL_HERMES_RUNNER:?}" --es6-block-scoping "${FORMATJS_TEMPORAL_HERMES_PRELUDE:?}" "${args[@]}"

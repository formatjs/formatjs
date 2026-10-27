#!/usr/bin/env bash
set -euo pipefail

args=()
for arg in "$@"; do
  case "$arg" in
    -Xintl|-enable-eval|-fenable-tdz|-non-strict) ;;
    *) args+=("$arg") ;;
  esac
done

exec "${FORMATJS_HERMES_RUNNER:?}" \
  --es6-block-scoping \
  "--prelude=${FORMATJS_HERMES_TEMPORAL_SHIM:?}" \
  "--prelude=${FORMATJS_HERMES_TEMPORAL_PRELUDE:?}" \
  --native-pluralrules --native-listformat --native-displaynames \
  --native-segmenter --native-collator --native-numberformat \
  --native-relativetimeformat --native-datetimeformat --native-durationformat \
  "${args[@]}"

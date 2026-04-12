#!/usr/bin/env bash
# Run ast-grep rule tests against the compiled tree-sitter grammar.
set -euo pipefail

# Find the native sg binary from the ast-grep npm package locations
SG=""
for arg in "$@"; do
  if [[ "$arg" == */@ast-grep/cli ]] && [ -d "$arg" ]; then
    if [ -x "$arg/sg" ]; then
      SG="$(cd "$arg" && pwd)/sg"
      break
    fi
  fi
done

if [ -z "$SG" ]; then
  echo "ERROR: could not find ast-grep sg binary in args: $*"
  exit 1
fi

# Create a temp working directory with the necessary structure.
# ast-grep needs sgconfig.yml, the .so, sg-rules/, and sg-rule-tests/
# all accessible from one directory.
WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT

TEST_DIR="packages/tree-sitter-icu-messageformat/integration-tests"
DYLIB="packages/tree-sitter-icu-messageformat/icu-messageformat.so"

cp "$DYLIB" "$WORKDIR/icu-messageformat.so"
cp "$TEST_DIR/sgconfig.yml" "$WORKDIR/"
cp -r "$TEST_DIR/sg-rules" "$WORKDIR/"
cp -r "$TEST_DIR/sg-rule-tests" "$WORKDIR/"

cd "$WORKDIR"
exec "$SG" test --skip-snapshot-tests

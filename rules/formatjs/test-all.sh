#!/bin/bash
set -euo pipefail

echo "===================="
echo "Running tests in root workspace"
echo "===================="
bazel test //...

# Find all example workspaces and run their tests
for example in examples/*/MODULE.bazel; do
  if [ -f "$example" ]; then
    example_dir=$(dirname "$example")
    echo ""
    echo "===================="
    echo "Running tests in $example_dir"
    echo "===================="
    (cd "$example_dir" && bazel test //...)
  fi
done

echo ""
echo "===================="
echo "✓ All tests passed!"
echo "===================="

#!/bin/bash
# Run the FormatJS CLI benchmark: Rust vs TypeScript
set -e

echo "🔥 FormatJS CLI Benchmark Runner"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "benchmark-tinybench.mjs" ]; then
  echo "❌ Error: Must be run from benchmarks/cli-comparison directory"
  exit 1
fi

cd ../..

# Step 1: Build both CLIs
echo "📦 Step 1/3: Building CLIs..."
echo "  - Building TypeScript CLI..."
bazel build //packages/cli:bin

echo "  - Building Rust CLI (optimized)..."
bazel build //rust/formatjs_cli --compilation_mode=opt

# Step 2: Generate test files
echo ""
echo "📁 Step 2/3: Generating test files..."
if [ -d "bazel-bin/benchmarks/cli-comparison/test-files" ]; then
  echo "  ✓ Test files already exist, skipping generation"
else
  echo "  - Generating 100,000 test files (this may take a few minutes)..."
  bazel build //benchmarks/cli-comparison:generate
fi

# Step 3: Run benchmark
echo ""
echo "⏱️  Step 3/3: Running benchmark with tinybench..."
echo ""
cd benchmarks/cli-comparison
node benchmark-tinybench.mjs

echo ""
echo "✅ Benchmark complete!"
echo ""
echo "📊 Results saved to:"
echo "  - benchmark-results.json (detailed statistics)"
echo "  - Console output above (formatted results)"

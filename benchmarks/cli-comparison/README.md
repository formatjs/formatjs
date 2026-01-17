# FormatJS CLI Benchmark: Rust vs TypeScript

This benchmark compares the performance of the Rust CLI implementation against the TypeScript CLI for the `extract` command.

## Overview

The benchmark:

- Generates 100,000 TypeScript/React files with ICU MessageFormat messages
- Tests all message extraction patterns:
  - `defineMessage` - individual message definitions
  - `defineMessages` - grouped message definitions
  - `intl.formatMessage()` - imperative formatting
  - `<FormattedMessage />` - JSX component formatting
- Message complexity distribution: 40% simple, 30% with variables, 15% plural, 10% select, 5% complex nested
- Measures execution time, throughput (messages/second), and statistical confidence

## Benchmark Results

### Test Environment

- **OS**: macOS 25.2.0 (Darwin)
- **CPU**: Apple Silicon
- **Node.js**: v24.12.0
- **Date**: 2026-01-04

### Results (1,000 files, 9,656 messages)

| Metric                 | TypeScript | Rust     | Speedup   |
| ---------------------- | ---------- | -------- | --------- |
| **Mean Time**          | 601.63ms   | 131.77ms | **4.57x** |
| **Operations/sec**     | 1.66       | 7.59     | **4.57x** |
| **Messages/sec**       | 16,050     | 73,279   | **4.57x** |
| **Margin of Error**    | ±31.94ms   | ±2.82ms  | -         |
| **Samples**            | 9          | 38       | -         |
| **Messages Extracted** | 9,656      | 9,656    | ✓         |

**Summary**: The Rust CLI is **4.57x faster** (356.6% faster) than the TypeScript CLI, processing 73,279 messages/second vs 16,050 messages/second.

These results include all message extraction patterns: `defineMessage`, `defineMessages`, `intl.formatMessage()`, and `<FormattedMessage />`.

## Quick Start

### Option 1: Using the convenience script (Recommended)

```bash
cd benchmarks/cli-comparison
./run-benchmark.sh
```

This script will:

1. Build both TypeScript and Rust CLIs
2. Generate 100K test files (if not already present)
3. Run the benchmark with statistical analysis

### Option 2: Manual steps

```bash
# From the repository root

# 1. Generate test files (100K files with mixed message formats)
bazel build //benchmarks/cli-comparison:generate

# 2. Build both CLIs
bazel build //packages/cli:bin
bazel build //crates/formatjs_cli --compilation_mode=opt

# 3. Run the benchmark
cd benchmarks/cli-comparison
node benchmark-tinybench.mjs
```

### Option 3: Using Bazel

```bash
# Build and run via Bazel
bazel run //benchmarks/cli-comparison:benchmark
```

The benchmark script automatically looks for test files and CLIs in `bazel-bin/` output directories.

## How It Works

### Test File Generation

The generator creates realistic React/TypeScript files with a mix of message patterns:

```tsx
// 25% defineMessages (grouped)
const messages = defineMessages({
  greeting: {
    id: 'msg_0_0',
    defaultMessage: 'Hello, World!',
    description: 'Greeting message',
  },
})

// 25% defineMessage (individual)
const greeting = defineMessage({
  id: 'msg_1_0',
  defaultMessage: 'Welcome, {name}!',
  description: 'Welcome message',
})

// 25% intl.formatMessage (imperative)
const message = intl.formatMessage({
  id: 'msg_2_0',
  defaultMessage: 'You have {count, plural, one {# item} other {# items}}',
})

// 25% FormattedMessage (JSX)
<FormattedMessage
  id="msg_3_0"
  defaultMessage="Order is {status, select, pending {processing} shipped {in transit} other {unknown}}"
/>
```

### Message Complexity

Messages include various ICU MessageFormat features:

- **Simple**: `"Hello, World!"`
- **Variables**: `"Welcome, {name}!"`
- **Plural**: `"{count, plural, one {# item} other {# items}}"`
- **Select**: `"{status, select, active {Active} inactive {Inactive} other {Unknown}}"`
- **Complex**: Nested plural/select with rich text markup

### Benchmark Methodology

Uses [tinybench](https://github.com/tinylibs/tinybench) for statistical benchmarking:

- **Warmup**: 1 second, 1 iteration
- **Measurement**: 5 seconds minimum, at least 3 iterations
- **Metrics**: Mean time, margin of error, operations/sec, messages/sec
- **Validation**: Both CLIs must extract identical message counts

## Output

```
================================================================================
BENCHMARK RESULTS
================================================================================

📊 Performance Metrics:
────────────────────────────────────────────────────────────────────────────────
Metric                                        TypeScript                 Rust           Ratio
────────────────────────────────────────────────────────────────────────────────
Mean Time (ms)                                    601.63               131.77           4.57x
Operations/sec                                      1.66                 7.59           4.57x
Messages/sec                                       16,050               73,279           4.57x
Margin of Error (ms)                              ±31.94                ±2.82               -
Samples                                                9                   38               -
Messages Extracted                                 9,656                9,656               -
────────────────────────────────────────────────────────────────────────────────

✨ Summary:
   🚀 Rust is 4.57x faster (356.6% faster)
   📈 7.59 ops/sec vs 1.66 ops/sec
   💬 Processes 73,279 msg/s vs 16,050 msg/s
   ✓ Both extracted 9,656 messages
```

Results are saved to `benchmark-results.json` with detailed statistics.

## Troubleshooting

### "Rust CLI not found"

```bash
bazel build //crates/formatjs_cli --compilation_mode=opt
```

### "TypeScript CLI not found"

```bash
bazel build //packages/cli:bin
```

### "Test files not found"

```bash
bazel build //benchmarks/cli-comparison:generate
```

### "Cannot find module 'tinybench'"

```bash
cd benchmarks/cli-comparison
pnpm install
```

### Out of memory with 100K files

Reduce the file count in BUILD.bazel:

```python
env = {"NUM_FILES": "10000"},  # Reduce from 100000 to 10000
```

## System Requirements

- **Node.js**: v18 or later
- **Bazel**: Latest version
- **Memory**: At least 4GB available RAM
- **Disk**: ~2GB for test files (100K files)

## License

Same as the main FormatJS project (MIT).

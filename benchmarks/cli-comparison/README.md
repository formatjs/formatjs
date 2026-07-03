# FormatJS CLI Benchmark: Rust vs TypeScript

This benchmark compares the performance of the Rust CLI implementation against the TypeScript CLI for the `extract` command.

## Overview

The benchmark:

- Generates 1,000 TypeScript/React files with ICU MessageFormat messages
- Tests all message extraction patterns:
  - `defineMessage` - individual message definitions
  - `defineMessages` - grouped message definitions
  - `intl.formatMessage()` - imperative formatting
  - `<FormattedMessage />` - JSX component formatting
- Message complexity distribution: 40% simple, 30% with variables, 15% plural, 10% select, 5% complex nested
- Measures execution time, throughput (messages/second), and statistical confidence

## Benchmark Results

### Test Environment

- **OS**: macOS 26.2 (Darwin)
- **CPU**: Apple Silicon (arm64)
- **Node.js**: v24.12.0
- **Rayon threads**: default worker count (available logical CPUs)
- **Date**: 2026-05-22

### Results (1,000 files, 9,406 messages)

| Metric                 | TypeScript | Rust    | Speedup    |
| ---------------------- | ---------- | ------- | ---------- |
| **Mean Time**          | 744.86ms   | 35.65ms | **20.90x** |
| **Operations/sec**     | 1.34       | 28.05   | **20.90x** |
| **Messages/sec**       | 12,628     | 263,876 | **20.90x** |
| **Margin of Error**    | ±39.47ms   | ±0.56ms | -          |
| **Samples**            | 7          | 141     | -          |
| **Messages Extracted** | 9,406      | 9,406   | ✓          |

**Summary**: The Rust CLI is **20.90x faster** (1,989.6% faster) than the TypeScript CLI, processing 263,876 messages/second vs 12,628 messages/second.

These results include all message extraction patterns: `defineMessage`, `defineMessages`, `intl.formatMessage()`, and `<FormattedMessage />`.

## Quick Start

### Option 1: Using the convenience script (Recommended)

```bash
cd benchmarks/cli-comparison
./run-benchmark.sh
```

This script will:

1. Build both TypeScript and Rust CLIs
2. Generate 1,000 test files (if not already present)
3. Run the benchmark with statistical analysis

### Option 2: Manual steps

```bash
# From the repository root

# 1. Generate test files (1,000 files with mixed message formats)
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

### Controlling Rust CLI Threads

The Rust CLI parallelizes per-file work with Rayon. Rayon defaults to the
available logical CPU count. Set `RAYON_NUM_THREADS` to cap worker threads:

```bash
RAYON_NUM_THREADS=4 bazel run //benchmarks/cli-comparison:benchmark
```

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
Mean Time (ms)                                    744.86                35.65          20.90x
Operations/sec                                      1.34                28.05          20.90x
Messages/sec                                       12,628              263,876          20.90x
Margin of Error (ms)                              ±39.47                ±0.56               -
Samples                                                7                  141               -
Messages Extracted                                 9,406                9,406               -
────────────────────────────────────────────────────────────────────────────────

✨ Summary:
   🚀 Rust is 20.90x faster (1989.6% faster)
   📈 28.05 ops/sec vs 1.34 ops/sec
   💬 Processes 263,875.72 msg/s vs 12,627.948 msg/s
   ✓ Both extracted 9,406 messages
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

### Running a Larger Corpus

The Bazel target defaults to 1,000 files so routine benchmark runs complete quickly. Increase the file count in BUILD.bazel for larger local stress runs:

```python
env = {"NUM_FILES": "10000"},
```

## System Requirements

- **Node.js**: v20 or later
- **Bazel**: Latest version
- **Memory**: At least 4GB available RAM
- **Disk**: ~50MB for the default 1,000-file corpus; larger corpora scale with file count

## License

Same as the main FormatJS project (MIT).

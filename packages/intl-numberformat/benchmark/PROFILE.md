# CPU Profiling Guide for IntlNumberFormat

This guide explains how to profile and analyze the performance of `@formatjs/intl-numberformat` using Node.js's built-in CPU profiler.

## Quick Start

### 1. Generate CPU Profile

```bash
bazel run //packages/intl-numberformat/benchmark:profile_cpu
```

### 2. Analyze Results

```bash
bazel run //packages/intl-numberformat/benchmark:analyze_profile
```

## Detailed Workflow

### Step 1: Run CPU Profiler

```bash
bazel run //packages/intl-numberformat/benchmark:profile_cpu
```

**What this does:**

- Runs the profile script with Node's `--cpu-prof` flag enabled
- Generates a `.cpuprofile` file in `/tmp/`
- Samples stack traces every 100 microseconds
- Executes 900,000 format() calls
- Displays total execution time

**Output:**

```
Starting profiling...
Warming up...
Running profiled iterations...
Total time: 3.376s
Completed 900000 format() calls
```

**Profile file location:** `/tmp/CPU.*.cpuprofile`

### Step 2: Analyze the Profile

#### Automatic Analysis (Latest Profile)

```bash
bazel run //packages/intl-numberformat/benchmark:analyze_profile
```

The analyzer will automatically find and analyze the most recent `.cpuprofile` file in `/tmp/`.

#### Specify a Profile File

```bash
# Using positional argument
bazel run //packages/intl-numberformat/benchmark:analyze_profile -- /tmp/CPU.20251222.230039.35420.0.001.cpuprofile

# Using --profile flag
bazel run //packages/intl-numberformat/benchmark:analyze_profile -- --profile /tmp/CPU.20251222.230039.35420.0.001.cpuprofile

# Using -p shorthand
bazel run //packages/intl-numberformat/benchmark:analyze_profile -- -p /tmp/CPU.20251222.230039.35420.0.001.cpuprofile
```

### Profile Analysis Output

The analyzer provides two comprehensive views:

#### 1. Top 40 Functions by CPU Time

Shows individual functions sorted by CPU time:

```
Top 40 functions by CPU time (hit count):
==========================================

1. Decimal [decimal.js:4291]
   Hit count: 6317
   File: file:///Users/.../node_modules/decimal.js/decimal.js

2. P.times.P.mul [decimal.js:1871]
   Hit count: 4872
   File: file:///Users/.../node_modules/decimal.js/decimal.js
...
```

**What each field means:**

- **Function name**: Name of the function (or `(anonymous)` for unnamed functions)
- **File and line number**: Source location `[filename:line]`
- **Hit count**: Number of times this function was sampled (higher = more CPU time)
- **File path**: Full path to the source file

#### 2. Top 20 Files by CPU Time

Aggregated view showing which files consume the most CPU time:

```
Top 20 files by CPU time:
=========================

1. decimal.js/decimal.js: 21575 hits
2. ecma402-abstract/NumberFormat/format_to_parts.ts: 3080 hits
3. ecma402-abstract/NumberFormat/ToRawFixed.ts: 947 hits
...
```

**Filters:**

- Excludes Node.js internals (`node:internal`)
- Only shows formatjs-related code

## Alternative Analysis Tools

### Chrome DevTools (Visual Analysis)

1. Open Chrome and press F12 to open DevTools
2. Navigate to the **Performance** tab
3. Click the **Load profile** button (⬆️ icon)
4. Select your `.cpuprofile` file from `/tmp/`
5. Explore the flame graph and call tree

**Benefits:**

- Interactive flame graph visualization
- Bottom-up and top-down views
- Function-level drill-down
- Time range selection

### VS Code (IDE Integration)

1. Install the **JavaScript Profiler** extension
2. Open your `.cpuprofile` file in VS Code
3. View the interactive profile

**Benefits:**

- Integrated with your code editor
- Jump to source code directly
- Filter and search capabilities

### Command Line (Direct)

```bash
node packages/intl-numberformat/benchmark/analyze-profile.ts /tmp/CPU.*.cpuprofile
```

## Available Bazel Targets

| Target            | Description                           |
| ----------------- | ------------------------------------- |
| `profile`         | Quick timing test without profiling   |
| `profile_cpu`     | CPU profiling with .cpuprofile output |
| `analyze_profile` | Analyze .cpuprofile files             |
| `benchmark`       | Full benchmark suite                  |

## Understanding the Results

### Hit Counts

- **Hit count** represents CPU sampling frequency
- Higher hit count = more time spent in that function
- Samples are taken every 100 microseconds
- Total hits ≈ (execution time in seconds) × 10,000

### Identifying Bottlenecks

Look for:

1. **High hit count functions** - These consume the most CPU time
2. **Unexpected functions** - Functions that shouldn't be hot
3. **Deep call stacks** - May indicate recursion or nested loops
4. **External dependencies** - Library code that's unexpectedly slow

### Optimization History

After our optimizations:

- **Decimal.js overhead**: Reduced from 270,631 hits to 21,575 hits (92% reduction)
- **Logarithm operations**: Eliminated from hot path using native `Math.log10()`
- **Power-of-10 caching**: Reduced `Decimal.pow()` calls

## Troubleshooting

### No profile files found

```bash
# Check if files exist
ls -lth /tmp/CPU.*.cpuprofile | head -5

# If empty, try running the profiler again
bazel run //packages/intl-numberformat/benchmark:profile_cpu
```

### Profile files in wrong location

The profiler writes to `/tmp/` by default. To change this:

1. Edit `BUILD.bazel` and modify `--cpu-prof-dir=/tmp`
2. Update the default path in `analyze-profile.ts` line 106

### Bazel build errors

```bash
# Clean build cache
bazel clean

# Rebuild
bazel build //packages/intl-numberformat/benchmark:all
```

### Permission errors

If you can't write to `/tmp/`:

```bash
# Use a different directory
mkdir -p ~/profiles
# Then update BUILD.bazel: --cpu-prof-dir=$HOME/profiles
```

## Best Practices

### Before Profiling

1. Warm up the code (already done in profile.ts)
2. Run enough iterations (900K provides good signal)
3. Close other applications to reduce noise

### During Analysis

1. Focus on formatjs code, not Node.js internals
2. Look for patterns across multiple runs
3. Compare before/after optimization profiles

### After Optimization

1. Run the benchmark suite to measure improvement
2. Verify correctness with unit tests
3. Profile again to find the next bottleneck

## Related Documentation

- [Benchmark README](./README.md) - Full benchmark suite documentation
- [Fast-path optimizations tests](../tests/fast-path-optimizations.test.ts)
- [Node.js Profiling Guide](https://nodejs.org/en/docs/guides/simple-profiling)
- [Chrome DevTools Profiling](https://developer.chrome.com/docs/devtools/performance/)

## Contributing

When adding profiling capabilities:

1. Add new profiling scenarios to `profile.ts`
2. Update this documentation
3. Consider adding visualization tools
4. Share interesting findings in PRs

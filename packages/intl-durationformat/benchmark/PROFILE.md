# CPU Profiling Guide for IntlDurationFormat

This guide explains how to profile and analyze the performance of `@formatjs/intl-durationformat` using Node.js's built-in CPU profiler.

## Quick Start

### 1. Generate CPU Profile

```bash
bazel run //packages/intl-durationformat/benchmark:profile_cpu
```

### 2. Analyze Results

```bash
bazel run //packages/intl-durationformat/benchmark:analyze_profile
```

## Detailed Workflow

### Step 1: Run CPU Profiler

```bash
bazel run //packages/intl-durationformat/benchmark:profile_cpu
```

**What this does:**

- Runs the profile script with Node's `--cpu-prof` flag enabled
- Generates a `.cpuprofile` file in `/tmp/`
- Samples stack traces every 100 microseconds
- Executes 1,800,000 format() calls across different styles
- Displays total execution time

**Output:**

```
Starting profiling...
Warming up...
Running profiled iterations...
Total time: XXXms
Completed 1800000 format() calls
```

**Profile file location:** `/tmp/CPU.*.cpuprofile`

### Step 2: Analyze the Profile

#### Automatic Analysis (Latest Profile)

```bash
bazel run //packages/intl-durationformat/benchmark:analyze_profile
```

The analyzer will automatically find and analyze the most recent `.cpuprofile` file in `/tmp/`.

#### Specify a Profile File

```bash
# Using positional argument
bazel run //packages/intl-durationformat/benchmark:analyze_profile -- /tmp/CPU.20251223.120000.12345.0.001.cpuprofile

# Using --profile flag
bazel run //packages/intl-durationformat/benchmark:analyze_profile -- --profile /tmp/CPU.20251223.120000.12345.0.001.cpuprofile

# Using -p shorthand
bazel run //packages/intl-durationformat/benchmark:analyze_profile -- -p /tmp/CPU.20251223.120000.12345.0.001.cpuprofile
```

### Profile Analysis Output

The analyzer provides two comprehensive views:

#### 1. Top 40 Functions by CPU Time

Shows individual functions sorted by CPU time:

```
Top 40 functions by CPU time (hit count):
==========================================

1. PartitionDurationFormatPattern [PartitionDurationFormatPattern.ts:42]
   Hit count: 5234
   File: file:///Users/.../intl-durationformat/src/abstract/PartitionDurationFormatPattern.ts

2. GetNumberFormatUnit [GetNumberFormatUnit.ts:15]
   Hit count: 3456
   File: file:///Users/.../ecma402-abstract/NumberFormat/GetNumberFormatUnit.ts
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

1. intl-durationformat/src/abstract/PartitionDurationFormatPattern.ts: 8765 hits
2. ecma402-abstract/NumberFormat/format_to_parts.ts: 3210 hits
3. intl-durationformat/src/core.ts: 1543 hits
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
node packages/intl-durationformat/benchmark/analyze-profile.ts /tmp/CPU.*.cpuprofile
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
4. **Number formatting overhead** - Heavy use of Intl.NumberFormat
5. **String concatenation** - Inefficient string building

### Common Performance Patterns

#### Hot Paths to Optimize

1. **Number Formatting**
   - Creating `Intl.NumberFormat` instances repeatedly
   - Formatting the same numbers multiple times (0-59 for time units)
   - Solution: Cache formatters and pre-format common values

2. **String Building**
   - Concatenating many small strings
   - Solution: Use arrays and join, or template literals

3. **Unit Processing**
   - Processing all units even when many are zero
   - Solution: Early exit for zero values

4. **Style Resolution**
   - Recalculating display options repeatedly
   - Solution: Cache resolved options

## Troubleshooting

### No profile files found

```bash
# Check if files exist
ls -lth /tmp/CPU.*.cpuprofile | head -5

# If empty, try running the profiler again
bazel run //packages/intl-durationformat/benchmark:profile_cpu
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
bazel build //packages/intl-durationformat/benchmark:all
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
2. Run enough iterations (1.8M provides good signal)
3. Close other applications to reduce noise

### During Analysis

1. Focus on formatjs code, not Node.js internals
2. Look for patterns across multiple runs
3. Compare before/after optimization profiles

### After Optimization

1. Run the benchmark suite to measure improvement
2. Verify correctness with unit tests
3. Profile again to find the next bottleneck

## Optimization Strategies

Based on profiling results, consider these optimizations:

### 1. Number Format Caching

```typescript
// Cache NumberFormat instances per locale/style
const formatCache = new Map<string, Intl.NumberFormat>()
```

### 2. Pre-format Common Values

```typescript
// Pre-format 0-59 for time units (minutes, seconds)
const preFormattedValues = new Map<number, string>()
for (let i = 0; i < 60; i++) {
  preFormattedValues.set(i, formatter.format(i))
}
```

### 3. Fast Path for Digital Format

```typescript
// Special handling for digital format (most common for video)
if (style === 'digital' && isSimpleDuration(duration)) {
  return formatDigitalFast(duration)
}
```

### 4. Skip Zero Units

```typescript
// Don't process units that are zero (unless display is 'always')
if (value === 0 && display !== 'always') {
  continue
}
```

## Related Documentation

- [Benchmark README](./README.md) - Full benchmark suite documentation
- [DurationFormat core implementation](../src/core.ts)
- [Node.js Profiling Guide](https://nodejs.org/en/docs/guides/simple-profiling)
- [Chrome DevTools Profiling](https://developer.chrome.com/docs/devtools/performance/)

## Contributing

When adding profiling capabilities:

1. Add new profiling scenarios to `profile.ts`
2. Update this documentation
3. Consider adding visualization tools
4. Share interesting findings in PRs

#!/usr/bin/env node
/**
 * Benchmark script using tinybench to compare Rust CLI vs TypeScript CLI performance
 */

import {Bench} from 'tinybench'
import {execSync} from 'child_process'
import fs from 'fs'
import path from 'path'
import {fileURLToPath} from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Try to use Bazel runfiles if available, otherwise fall back to bazel-bin
let TEST_FILES_DIR, TS_CLI, RUST_CLI

try {
  // Try importing @bazel/runfiles for proper Bazel sandbox support
  const {Runfiles} = await import('@bazel/runfiles')
  const runfiles = Runfiles.create()

  // Resolve paths through runfiles
  TEST_FILES_DIR = runfiles.resolve(
    '_main/benchmarks/cli-comparison/test-files'
  )
  TS_CLI = runfiles.resolve('_main/packages/cli/bin/formatjs')
  RUST_CLI = runfiles.resolve('_main/rust/formatjs_cli/formatjs_cli')
} catch {
  // Fall back to bazel-bin for manual execution
  const BAZEL_BIN = path.join(__dirname, '../../bazel-bin')
  TEST_FILES_DIR = path.join(BAZEL_BIN, 'benchmarks/cli-comparison/test-files')
  TS_CLI = path.join(BAZEL_BIN, 'packages/cli/bin/formatjs')
  RUST_CLI = path.join(BAZEL_BIN, 'rust/formatjs_cli/formatjs_cli')
}

const OUTPUT_DIR = path.join(__dirname, 'benchmark-output')

// Check if TypeScript CLI is built
if (!fs.existsSync(TS_CLI)) {
  console.error('❌ Error: TypeScript CLI not found. Please build it first:')
  console.error('  bazel build //packages/cli:bin')
  process.exit(1)
}

// Check if Rust CLI is built
if (!fs.existsSync(RUST_CLI)) {
  console.error('❌ Error: Rust CLI not found. Please build it first:')
  console.error('  bazel build //rust/formatjs_cli --compilation_mode=opt')
  process.exit(1)
}

// Check if test files exist
if (!fs.existsSync(TEST_FILES_DIR)) {
  console.error('❌ Error: Test files not found. Please generate them first:')
  console.error('  bazel build //benchmarks/cli-comparison:generate')
  console.error(`  (Looking for test files at: ${TEST_FILES_DIR})`)
  process.exit(1)
}

// Clean and create output directory
try {
  fs.rmSync(OUTPUT_DIR, {recursive: true})
} catch {
  // Directory doesn't exist, that's fine
}
fs.mkdirSync(OUTPUT_DIR, {recursive: true})

// Count test files
function countFiles(dir, count = 0) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      count = countFiles(filePath, count)
    } else if (file.endsWith('.tsx')) {
      count++
    }
  }
  return count
}

const fileCount = countFiles(TEST_FILES_DIR)
const pattern = path.join(TEST_FILES_DIR, '**/*.tsx')

console.log('🔥 FormatJS CLI Benchmark: Rust vs TypeScript (using tinybench)')
console.log('='.repeat(80))
console.log(
  `\n📁 Test files: ${fileCount.toLocaleString()} TypeScript/React files`
)
console.log(`📂 Test directory: ${TEST_FILES_DIR}`)
console.log('\n⏱️  Running benchmarks...\n')

// Create benchmark suite
const bench = new Bench({
  time: 5000, // Run for 5 seconds minimum per benchmark
  iterations: 3, // At least 3 iterations
  warmupTime: 1000, // 1 second warmup
  warmupIterations: 1,
})

let tsMessageCount = 0
let rustMessageCount = 0

// TypeScript CLI benchmark
bench.add('TypeScript CLI', () => {
  const outputFile = path.join(OUTPUT_DIR, `typescript-${Date.now()}.json`)
  const command = `"${TS_CLI}" extract "${pattern}" --out-file "${outputFile}"`

  try {
    execSync(command, {
      stdio: 'pipe',
      maxBuffer: 1024 * 1024 * 100, // 100MB buffer
    })

    // Count messages on first run
    if (tsMessageCount === 0) {
      const output = JSON.parse(fs.readFileSync(outputFile, 'utf8'))
      tsMessageCount = Object.keys(output).length
    }

    // Clean up output file
    fs.unlinkSync(outputFile)
  } catch (error) {
    console.error('Error running TypeScript CLI:', error.message)
    throw error
  }
})

// Rust CLI benchmark
bench.add('Rust CLI', () => {
  const outputFile = path.join(OUTPUT_DIR, `rust-${Date.now()}.json`)
  const command = `"${RUST_CLI}" extract "${pattern}" --out-file "${outputFile}"`

  try {
    execSync(command, {
      stdio: 'pipe',
      maxBuffer: 1024 * 1024 * 100, // 100MB buffer
    })

    // Count messages on first run
    if (rustMessageCount === 0) {
      const output = JSON.parse(fs.readFileSync(outputFile, 'utf8'))
      rustMessageCount = Object.keys(output).length
    }

    // Clean up output file
    fs.unlinkSync(outputFile)
  } catch (error) {
    console.error('Error running Rust CLI:', error.message)
    throw error
  }
})

// Run benchmarks
await bench.run()

// Display results
console.log('\n' + '='.repeat(80))
console.log('BENCHMARK RESULTS')
console.log('='.repeat(80))

const tsResult = bench.tasks.find(t => t.name === 'TypeScript CLI')
const rustResult = bench.tasks.find(t => t.name === 'Rust CLI')

if (!tsResult?.result || !rustResult?.result) {
  console.log('\n⚠️  Benchmark incomplete - one or more runs failed')
  process.exit(1)
}

// Calculate metrics
const tsMean = tsResult.result.mean // Already in ms
const rustMean = rustResult.result.mean // Already in ms
const speedup = tsMean / rustMean

const tsMsgPerSec = tsMessageCount / (tsMean / 1000)
const rustMsgPerSec = rustMessageCount / (rustMean / 1000)

console.log('\n📊 Performance Metrics:')
console.log('─'.repeat(80))
console.log(
  `${'Metric'.padEnd(35)} ${'TypeScript'.padStart(20)} ${'Rust'.padStart(20)} ${'Ratio'.padStart(15)}`
)
console.log('─'.repeat(80))

// Mean execution time
console.log(
  `${'Mean Time (ms)'.padEnd(35)} ${`${tsMean.toFixed(2)}`.padStart(20)} ${`${rustMean.toFixed(2)}`.padStart(20)} ${`${speedup.toFixed(2)}x`.padStart(15)}`
)

// Operations per second
const tsOpsPerSec = 1000 / tsMean
const rustOpsPerSec = 1000 / rustMean
console.log(
  `${'Operations/sec'.padEnd(35)} ${`${tsOpsPerSec.toFixed(2)}`.padStart(20)} ${`${rustOpsPerSec.toFixed(2)}`.padStart(20)} ${`${(rustOpsPerSec / tsOpsPerSec).toFixed(2)}x`.padStart(15)}`
)

// Messages per second
console.log(
  `${'Messages/sec'.padEnd(35)} ${`${tsMsgPerSec.toFixed(0)}`.padStart(20)} ${`${rustMsgPerSec.toFixed(0)}`.padStart(20)} ${`${(rustMsgPerSec / tsMsgPerSec).toFixed(2)}x`.padStart(15)}`
)

// Margin of error
const tsError = ((tsResult.result.rme / 100) * tsMean).toFixed(2)
const rustError = ((rustResult.result.rme / 100) * rustMean).toFixed(2)
console.log(
  `${'Margin of Error (ms)'.padEnd(35)} ${`±${tsError}`.padStart(20)} ${`±${rustError}`.padStart(20)} ${'-'.padStart(15)}`
)

// Sample size
console.log(
  `${'Samples'.padEnd(35)} ${`${tsResult.result.samples.length}`.padStart(20)} ${`${rustResult.result.samples.length}`.padStart(20)} ${'-'.padStart(15)}`
)

// Messages extracted
console.log(
  `${'Messages Extracted'.padEnd(35)} ${`${tsMessageCount.toLocaleString()}`.padStart(20)} ${`${rustMessageCount.toLocaleString()}`.padStart(20)} ${'-'.padStart(15)}`
)

console.log('─'.repeat(80))

// Statistical significance
const tsHz = 1000 / tsMean
const rustHz = 1000 / rustMean
const percentFaster = ((speedup - 1) * 100).toFixed(1)

console.log('\n✨ Summary:')
console.log(
  `   🚀 Rust is ${speedup.toFixed(2)}x faster (${percentFaster}% faster)`
)
console.log(`   📈 ${rustHz.toFixed(2)} ops/sec vs ${tsHz.toFixed(2)} ops/sec`)
console.log(
  `   💬 Processes ${rustMsgPerSec.toLocaleString()} msg/s vs ${tsMsgPerSec.toLocaleString()} msg/s`
)

if (Math.abs(tsMessageCount - rustMessageCount) > 0) {
  console.log(
    `   ⚠️  Message count differs: TS=${tsMessageCount}, Rust=${rustMessageCount}`
  )
} else {
  console.log(`   ✓ Both extracted ${tsMessageCount.toLocaleString()} messages`)
}

// Save results
const resultsFile = path.join(__dirname, 'benchmark-results.json')
const results = {
  timestamp: new Date().toISOString(),
  testFiles: {
    count: fileCount,
    messages: tsMessageCount,
    pattern: pattern,
  },
  typescript: {
    mean: tsMean,
    marginOfError: parseFloat(tsError),
    opsPerSec: tsOpsPerSec,
    messagesPerSec: tsMsgPerSec,
    samples: tsResult.result.samples.length,
    rme: tsResult.result.rme,
  },
  rust: {
    mean: rustMean,
    marginOfError: parseFloat(rustError),
    opsPerSec: rustOpsPerSec,
    messagesPerSec: rustMsgPerSec,
    samples: rustResult.result.samples.length,
    rme: rustResult.result.rme,
  },
  comparison: {
    speedup: speedup,
    percentFaster: parseFloat(percentFaster),
  },
}

fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2))
console.log(`\n📄 Detailed results saved to: ${resultsFile}`)

console.log('\n' + '='.repeat(80))
console.log('✅ Benchmark complete!')
console.log('='.repeat(80) + '\n')

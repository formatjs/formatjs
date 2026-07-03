#!/usr/bin/env node

import {runfiles} from '@bazel/runfiles'
import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {performance} from 'node:perf_hooks'

const outputDir = fs.mkdtempSync(
  path.join(os.tmpdir(), 'formatjs-oss-react-intl-')
)

type Corpus = {
  name: string
  repo: string
  runfilesRepo: string
  marker: string
  patterns: string[]
}

type BenchmarkResult = {
  name: string
  repo: string
  files: number
  messages: number
  rustMedianMs: number
  rustTimesMs: number[]
  typeScriptMedianMs?: number
  typeScriptTimesMs?: number[]
  typeScriptMessages?: number
}

const corpus: Corpus[] = [
  {
    name: 'mattermost',
    repo: 'mattermost/mattermost',
    runfilesRepo: 'oss_react_intl_mattermost',
    marker: 'webapp',
    patterns: ['webapp/**/*.{js,jsx,ts,tsx}'],
  },
  {
    name: 'kibana',
    repo: 'elastic/kibana',
    runfilesRepo: 'oss_react_intl_kibana',
    marker: 'src',
    patterns: [
      'packages/**/*.{js,jsx,ts,tsx}',
      'src/**/*.{js,jsx,ts,tsx}',
      'x-pack/**/*.{js,jsx,ts,tsx}',
    ],
  },
  {
    name: 'mattermost_desktop',
    repo: 'mattermost/desktop',
    runfilesRepo: 'oss_react_intl_mattermost_desktop',
    marker: 'src',
    patterns: ['src/**/*.{js,jsx,ts,tsx}'],
  },
]

const workspaceName = process.env.TEST_WORKSPACE ?? '_main'

function resolveMain(pathInWorkspace: string): string {
  return runfiles.resolve(`${workspaceName}/${pathInWorkspace}`)
}

function resolveRepoRoot(repoName: string, marker: string): string {
  const candidates = [
    `+http_archive+${repoName}/${marker}`,
    `${repoName}/${marker}`,
    `${workspaceName}/../+http_archive+${repoName}/${marker}`,
    `${workspaceName}/../${repoName}/${marker}`,
  ]

  for (const candidate of candidates) {
    try {
      const markerPath = runfiles.resolve(candidate)
      if (fs.existsSync(markerPath)) {
        return path.dirname(markerPath)
      }
    } catch {
      // Try the next runfiles spelling.
    }
  }

  throw new Error(`Unable to resolve runfiles repo root for ${repoName}`)
}

function countSourceFiles(root: string, patterns: string[]): number {
  const exts = new Set(['.js', '.jsx', '.ts', '.tsx'])
  const includePrefixes = patterns.map(pattern => pattern.split('/**/')[0])
  let count = 0

  function visit(dir: string): void {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      if (
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === 'coverage' ||
        entry.name === 'target' ||
        entry.name === '__snapshots__'
      ) {
        continue
      }

      const entryPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        visit(entryPath)
      } else if (entry.isFile() && exts.has(path.extname(entry.name))) {
        count += 1
      }
    }
  }

  for (const prefix of includePrefixes) {
    const dir = path.join(root, prefix)
    if (fs.existsSync(dir)) {
      visit(dir)
    }
  }

  return count
}

function runCli(binary: string, args: string[]): number {
  const started = performance.now()
  execFileSync(binary, args, {
    env: {
      ...process.env,
      RAYON_NUM_THREADS: process.env.RAYON_NUM_THREADS ?? '8',
    },
    maxBuffer: 1024 * 1024 * 100,
    stdio: 'pipe',
  })
  return performance.now() - started
}

function countMessages(outputFile: string): number {
  return Object.keys(JSON.parse(fs.readFileSync(outputFile, 'utf8'))).length
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

const rustCli = resolveMain('crates/formatjs_cli/formatjs_cli')
const tsCli = resolveMain('packages/cli/bin/formatjs')
const iterations = Number(process.env.ITERATIONS ?? '3')
const warmupIterations = Number(process.env.WARMUP_ITERATIONS ?? '1')
const includeTypeScript = process.env.INCLUDE_TS_CLI === '1'

const results: BenchmarkResult[] = []

for (const item of corpus) {
  const root = resolveRepoRoot(item.runfilesRepo, item.marker)
  const patterns = item.patterns.map(pattern => path.join(root, pattern))
  const files = countSourceFiles(root, item.patterns)

  console.log(`\n${item.name} (${item.repo})`)
  console.log(`  root: ${root}`)
  console.log(`  source files: ${files.toLocaleString()}`)

  const rustTimes: number[] = []
  let rustMessages = 0
  for (let i = 0; i < warmupIterations; i++) {
    const outputFile = path.join(
      outputDir,
      `${item.name}-rust-warmup-${i}.json`
    )
    runCli(rustCli, ['extract', ...patterns, '--out-file', outputFile])
    fs.unlinkSync(outputFile)
  }
  for (let i = 0; i < iterations; i++) {
    const outputFile = path.join(outputDir, `${item.name}-rust-${i}.json`)
    const elapsed = runCli(rustCli, [
      'extract',
      ...patterns,
      '--out-file',
      outputFile,
    ])
    rustTimes.push(elapsed)
    if (i === 0) {
      rustMessages = countMessages(outputFile)
    }
    fs.unlinkSync(outputFile)
  }

  const tsTimes: number[] = []
  let tsMessages = 0
  if (includeTypeScript) {
    for (let i = 0; i < warmupIterations; i++) {
      const outputFile = path.join(
        outputDir,
        `${item.name}-typescript-warmup-${i}.json`
      )
      runCli(tsCli, ['extract', ...patterns, '--out-file', outputFile])
      fs.unlinkSync(outputFile)
    }
    for (let i = 0; i < iterations; i++) {
      const outputFile = path.join(
        outputDir,
        `${item.name}-typescript-${i}.json`
      )
      const elapsed = runCli(tsCli, [
        'extract',
        ...patterns,
        '--out-file',
        outputFile,
      ])
      tsTimes.push(elapsed)
      if (i === 0) {
        tsMessages = countMessages(outputFile)
      }
      fs.unlinkSync(outputFile)
    }
  }

  const typeScriptMedianMs = includeTypeScript ? median(tsTimes) : undefined
  const result: BenchmarkResult = {
    name: item.name,
    repo: item.repo,
    files,
    messages: rustMessages,
    rustMedianMs: median(rustTimes),
    rustTimesMs: rustTimes,
    ...(includeTypeScript
      ? {
          typeScriptMedianMs,
          typeScriptTimesMs: tsTimes,
          typeScriptMessages: tsMessages,
        }
      : {}),
  }

  results.push(result)
  console.log(`  messages: ${rustMessages.toLocaleString()}`)
  console.log(`  Rust median: ${result.rustMedianMs.toFixed(2)} ms`)
  if (typeScriptMedianMs !== undefined) {
    console.log(`  TypeScript median: ${typeScriptMedianMs.toFixed(2)} ms`)
  }
}

console.log('\nJSON results:')
console.log(JSON.stringify(results, null, 2))

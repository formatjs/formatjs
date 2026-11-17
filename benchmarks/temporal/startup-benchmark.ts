import assert from 'node:assert/strict'
import {
  closeSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import {tmpdir, cpus} from 'node:os'
import {join} from 'node:path'
import {performance} from 'node:perf_hooks'
import {spawnSync} from 'node:child_process'
import {gzipSync} from 'node:zlib'
import {buildSync} from 'esbuild'
import {runfiles} from '@bazel/runfiles'

interface Sample {
  importMilliseconds: number
  compileMilliseconds: number
  instantiateMilliseconds: number
  configureMilliseconds: number
  firstInstantMilliseconds: number
  firstTimezoneMilliseconds: number
  firstCalendarMilliseconds: number | null
  linearMemoryBytes: number
  retainedHeapDeltaBytes: number
  residentDeltaBytes: number
  output: {iso: string; zoned: string; chinese: string | null}
  processMilliseconds: number
  readyMilliseconds: number
  isoTimezoneReadyMilliseconds: number
}
const directory = runfiles.resolve(process.argv[2])
const child = runfiles.resolve(process.argv[3])
const resolve = (file: string): string =>
  runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/benchmarks/temporal/${file}`
  )
const temporary = mkdtempSync(join(tmpdir(), 'temporal-startup-'))
const wasmPath = join(directory, 'temporal-backend.wasm')
const binary = readFileSync(wasmPath)
const sampleCount = Number(process.env.FORMATJS_TEMPORAL_STARTUP_SAMPLES || 9)
if (!Number.isInteger(sampleCount) || sampleCount < 1)
  throw new RangeError('Positive startup sample count required')
const specifications = [
  {
    name: 'typescript',
    backend: 'typescript',
    calendar: true,
    source: `export {Temporal} from ${JSON.stringify(join(directory, 'index.js'))}`,
  },
  {
    name: 'standalone',
    backend: 'typescript',
    calendar: true,
    source: `export {Temporal} from ${JSON.stringify(join(directory, 'standalone.js'))}`,
  },
  {
    name: 'officialReference',
    backend: 'typescript',
    // ICU 78.2: 0.5.1 throws 'Unexpected leap month suffix: Mo1'.
    calendar: false,
    source: `export {Temporal} from '@js-temporal/polyfill'`,
  },
  {
    name: 'referenceFull',
    backend: 'typescript',
    calendar: true,
    source: `export {Temporal} from ${JSON.stringify(resolve('reference-full-bundle.js'))}`,
  },
  {
    name: 'referenceBasic',
    backend: 'typescript',
    calendar: false,
    source: `export {Temporal} from ${JSON.stringify(resolve('reference-bundle.js'))}`,
  },
  {
    name: 'hybridWasm',
    backend: 'hybrid',
    calendar: true,
    source: `export {Temporal} from ${JSON.stringify(join(directory, 'index.js'))}; export {configureWasmBackend} from ${JSON.stringify(join(directory, 'wasm.js'))}`,
  },
  {
    name: 'nativeDataWasm',
    backend: 'native',
    calendar: true,
    source: `export {configureTemporalWasm} from ${JSON.stringify(join(directory, 'wasm-native.js'))}`,
  },
]
try {
  const profiles = specifications.map(profile => {
    const source = buildSync({
      stdin: {
        contents: profile.source,
        resolveDir: directory,
        sourcefile: 'consumer.mjs',
      },
      bundle: true,
      format: 'esm',
      platform: 'node',
      target: 'es2022',
      minify: true,
      legalComments: 'none',
      write: false,
    }).outputFiles[0].contents
    const entry = join(temporary, profile.name + '.mjs')
    writeFileSync(entry, source)
    return {
      ...profile,
      entry,
      bundleBytes: source.byteLength,
      bundleGzipBytes: gzipSync(source, {level: 9}).length,
      samples: [] as Sample[],
    }
  })
  for (let round = 0; round < sampleCount; round++) {
    for (let step = 0; step < profiles.length; step++) {
      const profile = profiles[(step + round) % profiles.length]
      const stderrPath = join(temporary, 'stderr.txt')
      const stderrFile = openSync(stderrPath, 'w')
      const start = performance.now()
      const result = spawnSync(
        process.execPath,
        [
          '--expose-gc',
          child,
          profile.entry,
          profile.backend,
          wasmPath,
          String(profile.calendar),
        ],
        {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', stderrFile],
          timeout: 120000,
          env: {...process.env, NODE_DISABLE_COMPILE_CACHE: '1'},
        }
      )
      const processMilliseconds = performance.now() - start
      closeSync(stderrFile)
      const stderr = readFileSync(stderrPath, 'utf8')
      if (result.error || result.status !== 0) {
        throw new Error(
          `${profile.name} startup failed: ${
            result.error?.message ||
            stderr
              .split('\n')
              .filter(line => line.length < 1000)
              .slice(-12)
              .join('\n')
          }`
        )
      }
      const sample: Sample = {...JSON.parse(result.stdout), processMilliseconds}
      assert.equal(sample.output.iso, '2020-02-28T18:14:59.123456789Z')
      assert.equal(
        sample.output.zoned,
        '2020-02-28T13:14:59.123456789-05:00[America/New_York]'
      )
      assert.equal(
        sample.output.chinese,
        profile.calendar ? '2024-03-10[u-ca=chinese]' : null
      )
      profile.samples.push(sample)
    }
  }
  const keys = [
    'importMilliseconds',
    'compileMilliseconds',
    'instantiateMilliseconds',
    'configureMilliseconds',
    'firstInstantMilliseconds',
    'firstTimezoneMilliseconds',
    'firstCalendarMilliseconds',
    'processMilliseconds',
    'readyMilliseconds',
    'isoTimezoneReadyMilliseconds',
    'linearMemoryBytes',
    'retainedHeapDeltaBytes',
    'residentDeltaBytes',
  ] as const
  const results = profiles.map(
    ({name, backend, calendar, bundleBytes, bundleGzipBytes, samples}) => {
      const medians = Object.fromEntries(
        keys.map(key => {
          const values = samples
            .map(sample => sample[key])
            .filter(value => value !== null)
            .sort((a, b) => a - b)
          return [
            key,
            values.length ? values[Math.floor(values.length / 2)] : null,
          ]
        })
      )
      return {
        name,
        backend,
        calendar,
        calendarUnavailableReason:
          name === 'officialReference'
            ? '0.5.1 on ICU 78.2: Chinese month addition throws RangeError: Unexpected leap month suffix: Mo1'
            : undefined,
        bundleBytes,
        bundleGzipBytes,
        binaryBytes: backend === 'typescript' ? 0 : binary.byteLength,
        binaryGzipBytes:
          backend === 'typescript' ? 0 : gzipSync(binary, {level: 9}).length,
        medians,
        samples,
      }
    }
  )
  console.log(
    JSON.stringify(
      {
        node: process.version,
        v8: process.versions.v8,
        icu: process.versions.icu,
        cpu: cpus()[0]?.model,
        sampleCount,
        method:
          'Fresh Node process per sample, rotating profile order; persistent V8 module compile cache disabled and checked, filesystem cache warm. Minified es2022 ESM consumer bundles. Import excludes Node bootstrap. WASM file read precedes compile timing; configure includes contract validation. First Instant/timezone/calendar operations measured separately, in that order. ISO/timezone ready time stops before the optional Chinese workload and is comparable across all profiles. Ready time includes import, WASM file read/setup and these first operations; excludes Node bootstrap. End-to-end process time includes Node startup, GC and shutdown. Explicit GC before/after; heap/RSS deltas are process measurements, not shipping size or browser estimates. WASM linear memory reported separately.',
        scope:
          'Namespace imports without global installation. Official @js-temporal/polyfill 0.5.1 plus forced temporal-polyfill 1.0.7 full and basic implementations; full calendar comparison excludes basic and officialReference (documented ICU 78.2 incompatibility). TS default uses captured installed Intl for named timezones and Umm al-Qura, with compact owned Chinese/Dangi arithmetic/data. Standalone owns calendar packs and IANA histories. Both WASM profiles use Rust timezone data; native-data WASM drops duplicate TS packs while hybrid retains compact TS calendars. All matched outputs asserted. Diagnostic one-sample mode does not establish representative timings.',
        results,
      },
      null,
      2
    )
  )
} finally {
  rmSync(temporary, {recursive: true, force: true})
}

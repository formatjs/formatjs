import {readFileSync} from 'node:fs'
import {performance} from 'node:perf_hooks'
import {spawnSync} from 'node:child_process'
import {cpus} from 'node:os'
import {fileURLToPath, pathToFileURL} from 'node:url'
import {gzipSync} from 'node:zlib'
import {runfiles} from '@bazel/runfiles'
import {transformSync} from 'esbuild'
import type {Temporal as ReferenceTemporal} from 'temporal-polyfill/implementation'
import {instantInputs, durationInputs, operationNames} from './wasm-inputs.ts'

const root = process.env.TEST_WORKSPACE || '_main'
const resolve = (file: string): string => runfiles.resolve(`${root}/${file}`)
const moduleURL = (file: string): string =>
  pathToFileURL(resolve(`benchmarks/temporal/${file}.js`)).href
const cold: Record<string, {loadMs: number; firstOperationMs: number}> = {}
let ts!: {run(operation: number, value: string): string | number}
let wasm!: {
  readonly memoryBytes: number
  run(operation: number, value: string): string | number
}
let reference!: typeof ReferenceTemporal
for (const backend of process.argv.includes('--reverse')
  ? ['reference', 'wasm', 'ts']
  : ['ts', 'wasm', 'reference']) {
  const start = performance.now()
  let first: () => unknown
  const value = instantInputs[0][0]
  if (backend === 'ts') {
    ts = await import(moduleURL('wasm-ts-code'))
    first = () => ts.run(0, value)
  } else if (backend === 'wasm') {
    const {createWasmCore} = await import(moduleURL('wasm-bridge-code'))
    wasm = await createWasmCore(
      readFileSync(resolve('crates/temporal/temporal-core.wasm'))
    )
    first = () => wasm.run(0, value)
  } else {
    const {Temporal} = await import(moduleURL('reference-bundle'))
    reference = Temporal
    first = () => reference.Instant.from(value).epochNanoseconds.toString()
  }
  const loaded = performance.now()
  if (first() !== '1') throw new Error(`Cold output mismatch: ${backend}`)
  cold[backend] = {
    loadMs: loaded - start,
    firstOperationMs: performance.now() - loaded,
  }
}
if (process.argv.includes('--cold')) {
  console.log(JSON.stringify(cold))
  process.exit(0)
}
const coldSamples = Array.from({length: 12}, (_, index) => {
  const child = spawnSync(
    process.execPath,
    [
      fileURLToPath(import.meta.url),
      '--cold',
      ...(index % 2 ? ['--reverse'] : []),
    ],
    {encoding: 'utf8'}
  )
  if (child.status !== 0) throw new Error(child.stderr)
  return JSON.parse(child.stdout)
})
const median = (samples: number[]): number =>
  [...samples].sort((a, b) => a - b)[Math.floor(samples.length / 2)]
let sink = 0
const consume = (value: string | number): void => {
  sink += typeof value === 'string' ? value.length : value / 1e22
}
const throughput = []
for (let profile = 0; profile < 2; profile++) {
  for (let operation = 0; operation < 5; operation++) {
    const inputs = (operation < 3 ? instantInputs : durationInputs)[profile]
    const control = (value: string): string | number => {
      if (operation < 3) {
        const instant = reference.Instant.from(value)
        return operation === 0
          ? instant.epochNanoseconds.toString()
          : operation === 1
            ? instant.round('microsecond').epochNanoseconds.toString()
            : instant.toJSON()
      }
      const duration = reference.Duration.from(value)
      return operation === 3 ? duration.toJSON() : duration.total('microsecond')
    }
    const implementations = [
      ts.run,
      wasm.run,
      (_operation: number, value: string) => control(value),
    ]
    for (let index = 0; index < 5000; index++) {
      const input = inputs[index % inputs.length],
        expected = control(input)
      for (const run of implementations) {
        const actual = run(operation, input)
        if (actual !== expected)
          throw new Error(`Output mismatch: ${profile}/${operation}/${input}`)
        consume(actual)
      }
    }
    const samples: number[][] = [[], [], []]
    for (let sample = 0; sample < 9; sample++) {
      for (let offset = 0; offset < 3; offset++) {
        const backend = (sample + offset) % 3,
          run = implementations[backend]
        const start = performance.now()
        for (let index = 0; index < 30000; index++)
          consume(run(operation, inputs[index % inputs.length]))
        samples[backend].push(((performance.now() - start) * 1e6) / 30000)
      }
    }
    throughput.push({
      profile: profile === 0 ? 'ordinary' : 'boundaries',
      name: operationNames[operation],
      tsMedianNs: median(samples[0]),
      wasmMedianNs: median(samples[1]),
      referenceMedianNs: median(samples[2]),
      samples,
    })
  }
}
const sizes = ['wasm-ts-code', 'wasm-bridge-code', 'reference-bundle'].map(
  name => {
    const source = readFileSync(
      resolve(`benchmarks/temporal/${name}.js`),
      'utf8'
    )
    const code = transformSync(source, {
      loader: 'js',
      target: 'es2022',
      minify: true,
      legalComments: 'none',
    }).code
    return {
      file: `${name}.js`,
      raw: Buffer.byteLength(source),
      minified: Buffer.byteLength(code),
      gzip: gzipSync(code, {level: 9}).length,
    }
  }
)
const binary = readFileSync(resolve('crates/temporal/temporal-core.wasm'))
console.log(
  JSON.stringify(
    {
      node: process.version,
      v8: process.versions.v8,
      platform: process.platform,
      arch: process.arch,
      cpu: cpus()[0]?.model,
      rust: '1.97.0',
      wasmTarget: 'wasm32-unknown-unknown',
      rustFlags:
        'opt configuration; cdylib -Copt-level=z -Cstrip=symbols -Cpanic=abort; core dependency uses opt configuration defaults; no wasm-opt or wasm-bindgen',
      wasmMemoryBytes: wasm.memoryBytes,
      scope:
        'Partial Instant/Duration operations, no calendar/timezone data. TS primitives versus no_std Rust WASM using the shared numeric calendar core, with JS string encoding/decoding per call; forced temporal-polyfill 1.0.7 reference has broader API and uses host Intl. No full-polyfill equivalence claim.',
      method:
        '5000 equality-checked warmup inputs; nine rotating backend-order batches of 30000 calls; twelve fresh-child cold module loads after benchmark infrastructure startup, alternating load order; filesystem cache may be warm. Load and first operation times reported separately. Timings execute Bazel bundles; JS size additionally measures esbuild minification and gzip level 9.',
      sizes: [
        ...sizes,
        {
          file: 'temporal-core.wasm',
          raw: binary.length,
          gzip: gzipSync(binary, {level: 9}).length,
        },
      ],
      cold: Object.fromEntries(
        ['ts', 'wasm', 'reference'].map(name => [
          name,
          {
            loadMedianMs: median(coldSamples.map(value => value[name].loadMs)),
            firstOperationMedianMs: median(
              coldSamples.map(value => value[name].firstOperationMs)
            ),
            samples: coldSamples.map(value => value[name]),
          },
        ])
      ),
      throughput,
      sink,
    },
    null,
    2
  )
)

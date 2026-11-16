import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {cpus} from 'node:os'
import {performance} from 'node:perf_hooks'
import {pathToFileURL} from 'node:url'
import {gzipSync} from 'node:zlib'
import {transformSync} from 'esbuild'
import {runfiles} from '@bazel/runfiles'
import {instantInputs, durationInputs, operationNames} from './wasm-inputs.ts'

const resolve = (file: string): string =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${file}`)
const imported = async (file: string) =>
  import(pathToFileURL(resolve(file)).href)
const {run: typescript} = await imported('benchmarks/temporal/wasm-ts-code.js')
const {Temporal: Reference} = await imported(
  'benchmarks/temporal/reference-bundle.js'
)
interface Kernel {
  name: string
  run(operation: number, value: string): string
  memoryBytes?: () => number
}
interface Exports {
  memory: WebAssembly.Memory
  input_ptr(): number
  output_ptr(): number
  run(operation: number, length: number): number
}
const sizes = []
const kernels: Kernel[] = []
for (const [name, file] of [
  ['formatjsWasm', 'crates/temporal/temporal-core.wasm'],
  ['temporalRsWasm', 'benchmarks/temporal/rust/temporal-rs-core.wasm'],
]) {
  const bytes = readFileSync(resolve(file))
  const compiled = await WebAssembly.compile(bytes)
  assert.deepEqual(
    WebAssembly.Module.imports(compiled),
    [],
    'WASM must need no host imports'
  )
  const instance = await WebAssembly.instantiate(compiled, {})
  const core = instance.exports as unknown as Exports
  const encoder = new TextEncoder(),
    decoder = new TextDecoder()
  kernels.push({
    name,
    memoryBytes: () => core.memory.buffer.byteLength,
    run(operation, value) {
      const written = encoder.encodeInto(
        value,
        new Uint8Array(core.memory.buffer, core.input_ptr(), 256)
      )
      assert.equal(written.read, value.length)
      const length = core.run(operation, written.written)
      if (length < 0) throw new RangeError('Invalid Temporal input')
      return decoder.decode(
        new Uint8Array(core.memory.buffer, core.output_ptr(), length)
      )
    },
  })
  sizes.push({
    name,
    rawBytes: bytes.length,
    gzipBytes: gzipSync(bytes, {level: 9}).length,
    initialMemoryBytes: core.memory.buffer.byteLength,
  })
}
kernels.push({name: 'formatjsTypeScript', run: typescript})
kernels.push({
  name: 'temporalPolyfillBasic',
  run(operation, value) {
    if (operation === 3) return Reference.Duration.from(value).toJSON()
    const instant = Reference.Instant.from(value)
    return operation === 0
      ? instant.epochNanoseconds.toString()
      : operation === 1
        ? instant.round('microsecond').epochNanoseconds.toString()
        : instant.toJSON()
  },
})
for (const [name, file] of [
  ['formatjsTypeScript', 'benchmarks/temporal/wasm-ts-code.js'],
  ['temporalPolyfillBasic', 'benchmarks/temporal/reference-bundle.js'],
]) {
  const source = transformSync(readFileSync(resolve(file), 'utf8'), {
    minify: true,
    target: 'es2022',
    legalComments: 'none',
    loader: 'js',
  }).code
  sizes.push({
    name,
    rawBytes: Buffer.byteLength(source),
    gzipBytes: gzipSync(source, {level: 9}).length,
  })
}
const median = (values: number[]) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const results = []
let sink = 0
for (let profile = 0; profile < 2; profile++) {
  for (let operation = 0; operation < 4; operation++) {
    const inputs = (operation === 3 ? durationInputs : instantInputs)[profile]
    for (const input of inputs) {
      const expected = kernels[3].run(operation, input)
      for (const kernel of kernels)
        assert.equal(
          kernel.run(operation, input),
          expected,
          `${kernel.name}/${operation}/${input}`
        )
    }
    for (let i = 0; i < 1024; i++)
      for (const kernel of kernels)
        sink += kernel.run(operation, inputs[i % inputs.length]).length
    const samples: number[][] = kernels.map(() => [])
    const iterations = 8192
    for (let round = 0; round < 9; round++) {
      for (let step = 0; step < kernels.length; step++) {
        const index = (round + step) % kernels.length,
          kernel = kernels[index]
        let checksum = 0
        const start = performance.now()
        for (let i = 0; i < iterations; i++)
          checksum += kernel.run(operation, inputs[i % inputs.length]).length
        samples[index].push(((performance.now() - start) * 1e6) / iterations)
        sink += checksum
      }
    }
    results.push({
      profile: profile === 0 ? 'ordinary' : 'boundary',
      operation: operationNames[operation],
      iterations,
      measurements: kernels.map((kernel, i) => ({
        name: kernel.name,
        nanoseconds: median(samples[i]),
        samples: samples[i],
      })),
    })
  }
}
for (const kernel of kernels.slice(0, 2)) {
  for (const [operation, value] of [
    [0, '2020-02-30T00:00Z'],
    [0, '2020-01-01T00:00'],
    [3, 'P1DT-1H'],
  ] as const)
    assert.throws(() => kernel.run(operation, value), RangeError)
}
console.log(
  JSON.stringify(
    {
      temporalRsVersion: '0.2.6',
      node: process.version,
      v8: process.versions.v8,
      cpu: cpus()[0]?.model,
      method:
        'Optimized Rust WASM, same 256-byte UTF-8 input/output ABI and JS bridge for both engines. Exact outputs checked against forced temporal-polyfill basic on every input. 1,024 warmup calls, nine rotating samples per engine, 8,192 calls per sample. Encoding, parsing, operation, output formatting/decoding and checksum included. Native Rust APIs measured separately. Invalid-input controls run for both WASM engines.',
      scope:
        'Instant parsing/rounding/serialization and Duration parsing/serialization only. No calendar/timezone data or JS Temporal class facade. FormatJS WASM uses no_std and buffer formatting; temporal_rs wrapper uses std allocator, public Writeable output for Instant, public String formatting for Duration. Minimal Rust WASM sizes are not full polyfill or full backend sizes. TS module exports additional primitive operations; basic reference includes eight classes. No cold-start performance claim.',
      sizes,
      results,
      finalMemory: kernels
        .filter(kernel => kernel.memoryBytes)
        .map(kernel => ({name: kernel.name, bytes: kernel.memoryBytes!()})),
      sink,
    },
    null,
    2
  )
)

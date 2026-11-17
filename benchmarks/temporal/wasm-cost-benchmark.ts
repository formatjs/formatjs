import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {cpus} from 'node:os'
import {runfiles} from '@bazel/runfiles'

const directory = runfiles.resolve(process.argv[2])
const load = (file: string) => import(pathToFileURL(join(directory, file)).href)
const {Temporal} = await load('index.js')
const {configureNativeTemporal} = await load('native.js')
const {createWasmQuery} = await load('wasm.js')
const instance = new WebAssembly.Instance(
  new WebAssembly.Module(
    readFileSync(join(directory, 'temporal-backend.wasm'))
  ),
  {}
)
const query = createWasmQuery(instance)
const strings = Array.from(
  {length: 8},
  (_, i) => `2020-02-${21 + i}T23:59:59.123456789+05:45`
)
const instants = strings.map(value => Temporal.Instant.from(value))
const dates = strings.map(value => Temporal.PlainDate.from(value.slice(0, 10)))
const cases: Record<string, (index: number) => string> = {
  parse: i => Temporal.Instant.from(strings[i]).epochNanoseconds.toString(),
  format: i => instants[i].toString({fractionalSecondDigits: 9}),
  add: i =>
    instants[i].add({hours: 1, nanoseconds: 1}).epochNanoseconds.toString(),
  dateYear: i => String(dates[i].year),
  dateFields: i => {
    const value = dates[i]
    return [
      value.year,
      value.month,
      value.monthCode,
      value.day,
      value.daysInMonth,
      value.monthsInYear,
      value.daysInYear,
      value.dayOfYear,
    ].join(',')
  },
}
const iterations = 4000,
  samples = 7,
  warmup = 2000
let checksum = 0
function measure(run: (index: number) => number): {
  medianNanoseconds: number
  samplesNanoseconds: number[]
} {
  for (let i = 0; i < warmup; i++) checksum += run(i & 7)
  const times = []
  for (let sample = 0; sample < samples; sample++) {
    const start = performance.now()
    for (let i = 0; i < iterations; i++) checksum += run(i & 7)
    times.push(((performance.now() - start) * 1e6) / iterations)
  }
  const sorted = [...times].sort((a, b) => a - b)
  return {medianNanoseconds: sorted[samples >> 1], samplesNanoseconds: times}
}
const expected = Object.fromEntries(
  Object.entries(cases).map(([name, run]) => [
    name,
    strings.map((_, i) => run(i)),
  ])
)
function measurePublic() {
  return Object.fromEntries(
    Object.entries(cases).map(([name, run]) => {
      for (let i = 0; i < 8; i++)
        if (run(i) !== expected[name][i])
          throw Error('Output mismatch: ' + name)
      return [name, measure(i => run(i).length)]
    })
  )
}
const typescript = measurePublic()
const responses = new Map<string, string>()
let calls: Record<string, number> = {}
configureNativeTemporal((request: string) => {
  const result = query(request)
  if (typeof result !== 'string') throw Error('Backend status: ' + result)
  responses.set(request, result)
  const op = JSON.parse(request).op
  calls[op] = (calls[op] || 0) + 1
  return result
})
const callCounts: Record<string, Record<string, number>> = {}
for (const [name, run] of Object.entries(cases)) {
  calls = {}
  for (let i = 0; i < 8; i++) {
    if (run(i) !== expected[name][i]) throw Error('Output mismatch: ' + name)
  }
  callCounts[name] = Object.fromEntries(
    Object.entries(calls).map(([op, count]) => [op, count / 8])
  )
}
const replayQuery = (request: string): string => {
  const result = responses.get(request)
  if (result === undefined) throw Error('Unrecorded request: ' + request)
  return result
}
const order = process.argv.includes('--reverse')
  ? ['replay', 'wasm']
  : ['wasm', 'replay']
const publicResults: Record<string, ReturnType<typeof measurePublic>> = {}
for (const profile of order) {
  configureNativeTemporal(profile === 'wasm' ? query : replayQuery)
  publicResults[profile] = measurePublic()
}
const {wasm, replay} = publicResults
configureNativeTemporal(query)
interface Core {
  memory: WebAssembly.Memory
  temporal_alloc(length: number): number
  temporal_free(pointer: number, length: number): void
  temporal_query(pointer: number, length: number, output: number): number
}
const core = instance.exports as unknown as Core
const encoder = new TextEncoder(),
  decoder = new TextDecoder('utf-8', {fatal: true})
const groups = new Map<string, [string, string][]>()
for (const [request, response] of responses) {
  const op = JSON.parse(request).op
  if (!groups.has(op)) groups.set(op, [])
  groups.get(op)!.push([request, response])
}
const numericInstance = new WebAssembly.Instance(
  new WebAssembly.Module(readFileSync(runfiles.resolve(process.argv[3]))),
  {}
)
const numeric = numericInstance.exports as unknown as {
  memory: WebAssembly.Memory
  output_ptr(): number
  calendar_from_epoch_day(epoch: number): number
}
const numericOutput = numeric.output_ptr()
const layers = []
for (const [op, entries] of groups) {
  const inputs = Array.from({length: 8}, (_, i) => entries[i % entries.length])
  const objects = inputs.map(([request]) => JSON.parse(request))
  const outputBytes = inputs.map(([, response]) => encoder.encode(response))
  const allocated = inputs.map(([request]) => {
    const bytes = encoder.encode(request),
      pointer = core.temporal_alloc(bytes.length)
    new Uint8Array(core.memory.buffer, pointer, bytes.length).set(bytes)
    return {pointer, length: bytes.length}
  })
  const output = core.temporal_alloc(8)
  const raw = (i: number): number => {
    const {pointer, length} = allocated[i]
    const status = core.temporal_query(pointer, length, output)
    if (status) throw Error('Raw status: ' + status)
    const view = new DataView(core.memory.buffer, output, 8)
    const result = view.getUint32(0, true),
      size = view.getUint32(4, true)
    // Equality check happens outside timed loops below.
    core.temporal_free(result, size)
    return size
  }
  for (let i = 0; i < 8; i++) {
    const {pointer, length} = allocated[i]
    if (core.temporal_query(pointer, length, output))
      throw Error('Raw query failed')
    const view = new DataView(core.memory.buffer, output, 8)
    const result = view.getUint32(0, true),
      size = view.getUint32(4, true)
    const text = decoder.decode(
      new Uint8Array(core.memory.buffer, result, size)
    )
    core.temporal_free(result, size)
    if (text !== inputs[i][1]) throw Error('Raw output mismatch: ' + op)
  }
  let numericControl
  let numericFields
  if (op === 'calendarFromEpochDay') {
    const run = (i: number): string => {
      if (numeric.calendar_from_epoch_day(objects[i].epoch))
        throw Error('Numeric status')
      const fields = new Int32Array(numeric.memory.buffer, numericOutput, 4)
      return JSON.stringify({
        year: fields[0],
        month: fields[1],
        day: fields[2],
        monthCode: 'M' + String(fields[3]).padStart(2, '0'),
      })
    }
    for (let i = 0; i < 8; i++)
      if (run(i) !== inputs[i][1]) throw Error('Numeric calendar mismatch')
    numericControl = measure(i => run(i).length)
    numericFields = measure(i => {
      if (numeric.calendar_from_epoch_day(objects[i].epoch))
        throw Error('Numeric status')
      const fields = new Int32Array(numeric.memory.buffer, numericOutput, 4)
      return fields[0] + fields[1] + fields[2] + fields[3]
    })
  }
  layers.push({
    op,
    numericControl,
    numericFields,
    request: inputs[0][0],
    response: inputs[0][1],
    stringify: measure(i => JSON.stringify(objects[i]).length),
    parse: measure(i => {
      const value = JSON.parse(inputs[i][1])
      return typeof value === 'string'
        ? value.length
        : typeof value === 'number'
          ? value
          : value === null
            ? 0
            : value.year
    }),
    encode: measure(i => encoder.encode(inputs[i][0]).length),
    decode: measure(i => decoder.decode(outputBytes[i]).length),
    query: measure(i => {
      const value = query(inputs[i][0])
      if (typeof value !== 'string') throw Error('Query failed')
      return value.length
    }),
    preallocatedQuery: measure(raw),
  })
  core.temporal_free(output, 8)
  for (const {pointer, length} of allocated) core.temporal_free(pointer, length)
}
console.log(
  JSON.stringify(
    {
      node: process.version,
      v8: process.versions.v8,
      cpu: cpus()[0]?.model,
      iterations,
      samples,
      warmup,
      checksum,
      order,
      scope:
        'Legacy JSON control path with current facade caching, not the default binary WASM adapter. Matched public ISO operations. Replay preserves JS normalization/JSON but replaces WASM with recorded response lookup. Preallocated query retains Rust JSON/compute/serialization/output allocation; omits input encoding/copy, input/descriptor allocation and output decoding. Layer timings are independent, not additive.',
      typescript,
      wasm,
      replay,
      callCounts,
      layers,
    },
    null,
    2
  )
)
if (
  process.argv.includes('--assert-competitive') &&
  wasm.dateFields.medianNanoseconds >
    typescript.dateFields.medianNanoseconds * 2
)
  throw Error('WASM dateFields exceeds 2x TS')

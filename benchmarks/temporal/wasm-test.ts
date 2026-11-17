import {strict as assert} from 'node:assert'
import {readFileSync} from 'node:fs'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'
import {instantInputs, durationInputs} from './wasm-inputs.ts'

const root = process.env.TEST_WORKSPACE || '_main'
const resolve = (file: string): string => runfiles.resolve(`${root}/${file}`)
const {createWasmCore} = await import(
  pathToFileURL(resolve('benchmarks/temporal/wasm-bridge-code.js')).href
)
const {run} = await import(
  pathToFileURL(resolve('benchmarks/temporal/wasm-ts-code.js')).href
)
const {Temporal} = await import(
  pathToFileURL(resolve('benchmarks/temporal/reference-bundle.js')).href
)
const bytes = readFileSync(resolve('crates/temporal/temporal-core.wasm'))
const wasm = await createWasmCore(bytes)
for (let operation = 0; operation < 5; operation++) {
  for (const value of (operation < 3 ? instantInputs : durationInputs).flat()) {
    const expected =
      operation < 3
        ? operation === 0
          ? Temporal.Instant.from(value).epochNanoseconds.toString()
          : operation === 1
            ? Temporal.Instant.from(value)
                .round('microsecond')
                .epochNanoseconds.toString()
            : Temporal.Instant.from(value).toJSON()
        : operation === 3
          ? Temporal.Duration.from(value).toJSON()
          : Temporal.Duration.from(value).total('microsecond')
    assert.equal(wasm.run(operation, value), expected, `${operation}: ${value}`)
    assert.equal(run(operation, value), expected, `${operation}: ${value}`)
  }
}
for (const value of [
  '2023-02-29T00Z',
  '1970-01-01T00',
  '-000000-01-01T00Z',
  '\ufffd',
  'x'.repeat(257),
])
  assert.throws(() => wasm.run(0, value), RangeError)
for (const value of ['P', 'PT', 'PT1.5H1M', 'PT9007199254740992S'])
  assert.throws(() => wasm.run(3, value), RangeError)
assert.throws(() => wasm.run(100, 'PT1S'), RangeError)
assert.throws(() => wasm.roundDuration('1', 100, 0), RangeError)
assert.throws(() => wasm.roundDuration('1', 0, 100), RangeError)
assert.ok(Number.isNaN(wasm.total('PT1S', 100)))
// Exercise guards at the exported ABI, bypassing JS glue.
const {instance} = await WebAssembly.instantiate(bytes, {})
const raw = instance.exports as unknown as {
  memory: WebAssembly.Memory
  input_ptr(): number
  run(operation: number, length: number): number
}
assert.equal(raw.run(0, 257), -1)
assert.equal(raw.run(0, -1), -1)
new Uint8Array(raw.memory.buffer, raw.input_ptr(), 1)[0] = 255
assert.equal(raw.run(0, 1), -1)

const units = [
  'nanosecond',
  'microsecond',
  'millisecond',
  'second',
  'minute',
  'hour',
  'day',
]
const modes = [
  'ceil',
  'floor',
  'expand',
  'trunc',
  'halfCeil',
  'halfFloor',
  'halfExpand',
  'halfTrunc',
  'halfEven',
]
let count = 0
for (const line of readFileSync(runfiles.resolve(process.argv[2]), 'utf8')
  .trim()
  .split('\n')) {
  if (line.startsWith('#')) continue
  const [kind, text, unit, mode, expected] = line.split('\t')
  if (kind === 'round') {
    if (
      BigInt(expected) <= -9007199254740992000000000n ||
      BigInt(expected) >= 9007199254740992000000000n
    )
      assert.throws(
        () =>
          wasm.roundDuration(text, units.indexOf(unit), modes.indexOf(mode)),
        RangeError
      )
    else
      assert.equal(
        wasm.roundDuration(text, units.indexOf(unit), modes.indexOf(mode)),
        expected,
        line
      )
  } else {
    const value = BigInt(text),
      absolute = value < 0n ? -value : value
    const input = `${value < 0n ? '-' : ''}PT${absolute / 1000000000n}.${String(absolute % 1000000000n).padStart(9, '0')}S`
    assert.equal(wasm.total(input, units.indexOf(unit)), Number(expected), line)
  }
  count++
}
assert.equal(count, 5430)
console.log(
  `${count} independent ICU cases pass through WASM; boundary and forced temporal-polyfill checks pass`
)

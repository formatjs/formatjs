import {Temporal} from '#packages/temporal/index.js'
import {
  configureNativeTemporal,
  type NativeQuery,
} from '#packages/temporal/native.js'
import {Temporal as reference} from 'temporal-polyfill/implementation'

declare function print(value: string): void
declare const performance: {now(): number}
const host = globalThis as typeof globalThis & {
  __formatjsTemporalISOQuery?: NativeQuery
}
const query = host.__formatjsTemporalISOQuery
if (query) {
  configureNativeTemporal(query)
  delete host.__formatjsTemporalISOQuery
}
const strings = Array.from(
  {length: 8},
  (_, index) => `2020-02-${String(21 + index)}T23:59:59.123456789+05:45`
)
const owned = strings.map(value => Temporal.Instant.from(value))
const other = strings.map(value => reference.Instant.from(value))
const clocks = strings.map((_, index) => `23:59:${51 + index}.12345678${index}`)
const times = clocks.map(value => Temporal.PlainTime.from(value))
const referenceTimes = clocks.map(value => reference.PlainTime.from(value))
const cases = [
  {
    name: 'parse',
    owned: (index: number) =>
      Temporal.Instant.from(strings[index]).epochNanoseconds.toString(),
    reference: (index: number) =>
      reference.Instant.from(strings[index]).epochNanoseconds.toString(),
  },
  {
    name: 'format',
    owned: (index: number) =>
      owned[index].toString({fractionalSecondDigits: 9}),
    reference: (index: number) =>
      other[index].toString({fractionalSecondDigits: 9}),
  },
  {
    name: 'add',
    owned: (index: number) =>
      owned[index].add({hours: 1, nanoseconds: 1}).epochNanoseconds.toString(),
    reference: (index: number) =>
      other[index].add({hours: 1, nanoseconds: 1}).epochNanoseconds.toString(),
  },
  {
    name: 'round',
    owned: (index: number) =>
      owned[index]
        .round({
          smallestUnit: 'millisecond',
          roundingIncrement: 125,
          roundingMode: 'halfEven',
        })
        .epochNanoseconds.toString(),
    reference: (index: number) =>
      other[index]
        .round({
          smallestUnit: 'millisecond',
          roundingIncrement: 125,
          roundingMode: 'halfEven',
        })
        .epochNanoseconds.toString(),
  },
  {
    name: 'until',
    owned: (index: number) =>
      owned[index]
        .until(owned[(index + 1) & 7], {
          largestUnit: 'hour',
          smallestUnit: 'microsecond',
          roundingMode: 'halfExpand',
        })
        .toString(),
    reference: (index: number) =>
      other[index]
        .until(other[(index + 1) & 7], {
          largestUnit: 'hour',
          smallestUnit: 'microsecond',
          roundingMode: 'halfExpand',
        })
        .toString(),
  },
  {
    name: 'timeParse',
    owned: (index: number) =>
      Temporal.PlainTime.from(clocks[index]).nanosecond.toString(),
    reference: (index: number) =>
      reference.PlainTime.from(clocks[index]).nanosecond.toString(),
  },
  {
    name: 'timeFormat',
    owned: (index: number) =>
      times[index].toString({fractionalSecondDigits: 9}),
    reference: (index: number) =>
      referenceTimes[index].toString({fractionalSecondDigits: 9}),
  },
  {
    name: 'timeAdd',
    owned: (index: number) =>
      times[index].add({hours: 1, nanoseconds: 1}).nanosecond.toString(),
    reference: (index: number) =>
      referenceTimes[index]
        .add({hours: 1, nanoseconds: 1})
        .nanosecond.toString(),
  },
  {
    name: 'timeRoundFormat',
    owned: (index: number) =>
      times[index]
        .round({
          smallestUnit: 'millisecond',
          roundingIncrement: 125,
          roundingMode: 'halfEven',
        })
        .toString(),
    reference: (index: number) =>
      referenceTimes[index]
        .round({
          smallestUnit: 'millisecond',
          roundingIncrement: 125,
          roundingMode: 'halfEven',
        })
        .toString(),
  },
  {
    name: 'timeUntil',
    owned: (index: number) =>
      times[index]
        .until(times[(index + 1) & 7], {
          largestUnit: 'hour',
          smallestUnit: 'microsecond',
          roundingMode: 'halfExpand',
        })
        .toString(),
    reference: (index: number) =>
      referenceTimes[index]
        .until(referenceTimes[(index + 1) & 7], {
          largestUnit: 'hour',
          smallestUnit: 'microsecond',
          roundingMode: 'halfExpand',
        })
        .toString(),
  },
]
const iterations = 5000,
  samples = 5,
  warmup = 1000
let checksum = 0
const results = cases.map(test => {
  for (let index = 0; index < 8; index++)
    if (test.owned(index) !== test.reference(index))
      throw new Error('Benchmark parity: ' + test.name)
  const measure = (run: (index: number) => string) => {
    for (let index = 0; index < warmup; index++)
      checksum += run(index & 7).length
    const elapsed = []
    for (let sample = 0; sample < samples; sample++) {
      const start = performance.now()
      for (let index = 0; index < iterations; index++)
        checksum += run(index & 7).length
      elapsed.push(((performance.now() - start) * 1_000_000) / iterations)
    }
    elapsed.sort((a, b) => a - b)
    return {
      medianNanoseconds: elapsed[Math.floor(samples / 2)],
      samplesNanoseconds: elapsed,
    }
  }
  return {
    operation: test.name,
    owned: measure(test.owned),
    reference: measure(test.reference),
  }
})
print(
  JSON.stringify({
    scope:
      'Public Instant/PlainTime facade; Rust ISO/Instant/PlainTime JSON bridge optional, remaining namespace operations TS. Reference temporal-polyfill 1.0.7 basic implementation. timeParse/timeAdd read nanosecond; timeRoundFormat includes formatting. Not complete native Temporal or WASM comparison.',
    backend: query ? 'rust-iso-instant-time' : 'typescript',
    iterations,
    samples,
    warmup,
    inputs: 8,
    checksum,
    results,
    native: query ? JSON.parse(query('{"op":"info"}') as string) : undefined,
  })
)

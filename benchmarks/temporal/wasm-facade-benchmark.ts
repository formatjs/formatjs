import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {cpus} from 'node:os'
import {pathToFileURL} from 'node:url'
import {gzipSync} from 'node:zlib'
import {runfiles} from '@bazel/runfiles'
import {buildSync, transformSync} from 'esbuild'
import {Temporal as reference} from 'temporal-polyfill/implementation'

const directory = runfiles.resolve(process.argv[2])
const load = (name: string) => import(pathToFileURL(join(directory, name)).href)
const {Temporal} = await load('index.js')
const {configureWasmBackend, createWasmQuery} = await load('wasm.js')
const iterations = 10000,
  samples = 7,
  warmup = 3000
const strings = Array.from(
  {length: 8},
  (_, index) => `2020-02-${21 + index}T23:59:59.123456789+05:45`
)
let checksum = 0
function measure(namespace: typeof reference): unknown[] {
  const values = strings.map(value => namespace.Instant.from(value))
  const expected = strings.map(value => reference.Instant.from(value))
  const clocks = strings.map(
    (_, index) => `23:59:${51 + index}.12345678${index}`
  )
  const times = clocks.map(value => namespace.PlainTime.from(value))
  const expectedTimes = clocks.map(value => reference.PlainTime.from(value))
  const dates = strings.map(value =>
    namespace.PlainDate.from(value.slice(0, 10))
  )
  const expectedDates = strings.map(value =>
    reference.PlainDate.from(value.slice(0, 10))
  )
  const yearMonths = dates.map((value, index) =>
    value.toPlainYearMonth().add({months: index})
  )
  const expectedYearMonths = expectedDates.map((value, index) =>
    value.toPlainYearMonth().add({months: index})
  )
  const dateFields = (value: InstanceType<typeof reference.PlainDate>) =>
    [
      value.year,
      value.month,
      value.monthCode,
      value.day,
      value.daysInMonth,
      value.monthsInYear,
      value.daysInYear,
      value.dayOfYear,
    ].join(',')
  const cases = [
    {
      name: 'parse',
      run: (index: number) =>
        namespace.Instant.from(strings[index]).epochNanoseconds.toString(),
      check: (index: number) =>
        reference.Instant.from(strings[index]).epochNanoseconds.toString(),
    },
    {
      name: 'format',
      run: (index: number) =>
        values[index].toString({fractionalSecondDigits: 9}),
      check: (index: number) =>
        expected[index].toString({fractionalSecondDigits: 9}),
    },
    {
      name: 'add',
      run: (index: number) =>
        values[index]
          .add({hours: 1, nanoseconds: 1})
          .epochNanoseconds.toString(),
      check: (index: number) =>
        expected[index]
          .add({hours: 1, nanoseconds: 1})
          .epochNanoseconds.toString(),
    },
    {
      name: 'round',
      run: (index: number) =>
        values[index]
          .round({
            smallestUnit: 'millisecond',
            roundingIncrement: 125,
            roundingMode: 'halfEven',
          })
          .epochNanoseconds.toString(),
      check: (index: number) =>
        expected[index]
          .round({
            smallestUnit: 'millisecond',
            roundingIncrement: 125,
            roundingMode: 'halfEven',
          })
          .epochNanoseconds.toString(),
    },
    {
      name: 'until',
      run: (index: number) =>
        values[index]
          .until(values[(index + 1) & 7], {
            largestUnit: 'hour',
            smallestUnit: 'microsecond',
            roundingMode: 'halfExpand',
          })
          .toString(),
      check: (index: number) =>
        expected[index]
          .until(expected[(index + 1) & 7], {
            largestUnit: 'hour',
            smallestUnit: 'microsecond',
            roundingMode: 'halfExpand',
          })
          .toString(),
    },
    {
      name: 'timeParse',
      run: (index: number) =>
        namespace.PlainTime.from(clocks[index]).nanosecond.toString(),
      check: (index: number) =>
        reference.PlainTime.from(clocks[index]).nanosecond.toString(),
    },
    {
      name: 'timeFormat',
      run: (index: number) =>
        times[index].toString({fractionalSecondDigits: 9}),
      check: (index: number) =>
        expectedTimes[index].toString({fractionalSecondDigits: 9}),
    },
    {
      name: 'timeAdd',
      run: (index: number) =>
        times[index].add({hours: 1, nanoseconds: 1}).nanosecond.toString(),
      check: (index: number) =>
        expectedTimes[index]
          .add({hours: 1, nanoseconds: 1})
          .nanosecond.toString(),
    },
    {
      name: 'timeRoundFormat',
      run: (index: number) =>
        times[index]
          .round({
            smallestUnit: 'millisecond',
            roundingIncrement: 125,
            roundingMode: 'halfEven',
          })
          .toString(),
      check: (index: number) =>
        expectedTimes[index]
          .round({
            smallestUnit: 'millisecond',
            roundingIncrement: 125,
            roundingMode: 'halfEven',
          })
          .toString(),
    },
    {
      name: 'timeUntil',
      run: (index: number) =>
        times[index]
          .until(times[(index + 1) & 7], {
            largestUnit: 'hour',
            smallestUnit: 'microsecond',
            roundingMode: 'halfExpand',
          })
          .toString(),
      check: (index: number) =>
        expectedTimes[index]
          .until(expectedTimes[(index + 1) & 7], {
            largestUnit: 'hour',
            smallestUnit: 'microsecond',
            roundingMode: 'halfExpand',
          })
          .toString(),
    },
    {
      name: 'dateFromFields',
      run: (index: number) =>
        namespace.PlainDate.from({
          year: 2020,
          monthCode: 'M02',
          day: 21 + index,
        }).day.toString(),
      check: (index: number) =>
        reference.PlainDate.from({
          year: 2020,
          monthCode: 'M02',
          day: 21 + index,
        }).day.toString(),
    },
    {
      name: 'dateFields',
      run: (index: number) => dateFields(dates[index]),
      check: (index: number) => dateFields(expectedDates[index]),
    },
    {
      name: 'dateAdd',
      run: (index: number) =>
        dates[index].add({years: 1, months: 2, days: 3}).toString(),
      check: (index: number) =>
        expectedDates[index].add({years: 1, months: 2, days: 3}).toString(),
    },
    {
      name: 'dateUntil',
      run: (index: number) =>
        dates[index]
          .until(dates[(index + 1) & 7], {largestUnit: 'month'})
          .toString(),
      check: (index: number) =>
        expectedDates[index]
          .until(expectedDates[(index + 1) & 7], {largestUnit: 'month'})
          .toString(),
    },
    {
      name: 'yearMonthAdd',
      run: (index: number) =>
        yearMonths[index].add({years: 1, months: 3}).toString(),
      check: (index: number) =>
        expectedYearMonths[index].add({years: 1, months: 3}).toString(),
    },
  ]
  return cases.map(test => {
    for (let index = 0; index < 8; index++)
      if (test.run(index) !== test.check(index))
        throw new Error('Benchmark parity: ' + test.name)
    for (let index = 0; index < warmup; index++)
      checksum += test.run(index & 7).length
    const elapsed = []
    for (let sample = 0; sample < samples; sample++) {
      const start = performance.now()
      for (let index = 0; index < iterations; index++)
        checksum += test.run(index & 7).length
      elapsed.push(((performance.now() - start) * 1_000_000) / iterations)
    }
    elapsed.sort((a, b) => a - b)
    return {
      operation: test.name,
      medianNanoseconds: elapsed[Math.floor(samples / 2)],
      samplesNanoseconds: elapsed,
    }
  })
}
const typescript = measure(Temporal)
const bytes = readFileSync(join(directory, 'temporal-backend.wasm'))
let start = performance.now()
const module = new WebAssembly.Module(bytes)
const compileMilliseconds = performance.now() - start
start = performance.now()
const instance = new WebAssembly.Instance(module, {})
const instantiateMilliseconds = performance.now() - start
configureWasmBackend(instance)
const query = createWasmQuery(instance)
const initialMemoryBytes = query.memoryBytes
start = performance.now()
checksum += Temporal.Instant.from(strings[0]).epochNanoseconds.toString().length
const firstNativeOperationMilliseconds = performance.now() - start
start = performance.now()
checksum += Temporal.PlainDate.from({
  calendar: 'chinese',
  year: 2020,
  monthCode: 'M01',
  day: 1,
}).monthCode.length
const firstCalendarOperationMilliseconds = performance.now() - start
const wasm = measure(Temporal)
const referenceResults = measure(reference)
const minify = (file: string) => {
  const source = readFileSync(join(directory, file), 'utf8')
  const code = transformSync(source, {
    target: 'es2022',
    minify: true,
    legalComments: 'none',
  }).code
  return {
    file,
    raw: Buffer.byteLength(source),
    minified: Buffer.byteLength(code),
    gzip: gzipSync(code, {level: 9}).length,
  }
}
const bundle = (wasm: boolean) => {
  const code = buildSync({
    stdin: {
      contents: `export * from './index.js';${wasm ? "export {configureWasmBackend} from './wasm.js';" : ''}`,
      resolveDir: directory,
      sourcefile: 'measurement-entry.js',
      loader: 'js',
    },
    bundle: true,
    write: false,
    format: 'esm',
    target: 'es2022',
    minify: true,
    legalComments: 'none',
  }).outputFiles[0].contents
  return {minified: code.byteLength, gzip: gzipSync(code, {level: 9}).length}
}
const modules = ['index.js', 'native.js', 'wasm.js'].map(minify)
const binary = {raw: bytes.byteLength, gzip: gzipSync(bytes, {level: 9}).length}
const tsBundle = bundle(false),
  wasmBundle = bundle(true)
const separateTS = modules[0].gzip + modules[1].gzip
console.log(
  JSON.stringify(
    {
      node: process.version,
      v8: process.versions.v8,
      platform: process.platform + ' ' + process.arch,
      cpu: cpus()[0]?.model ?? 'unknown',
      memoryScope:
        'WASM linear memory only; excludes JS heap and compiled code.',
      scope:
        'Actual published Temporal namespace, all16 owned calendars and IANA data. WASM delegates ISO/Instant/PlainTime/calendar math with16 native calendars; remaining algorithms and fallback data remain TS. ISO date workloads use basic reference, not non-ISO coverage. Reference temporal-polyfill1.0.7 basic. Partial WASM backend, not full Rust namespace.',
      method:
        'Eight inputs, parity checked, 3000 warmup +7 samples x10000 calls; TS then WASM then reference in one process. First native/calendar calls measured separately after warmed JS/TS; calendar call includes registry validation. Hot operations exclude startup. timeParse/timeAdd read nanosecond; timeRoundFormat includes formatting. Gzip level9, esbuild es2022 minification. Separately compressed module sums and consumer bundles are alternative delivery modes.',
      iterations,
      samples,
      warmup,
      checksum,
      typescript,
      wasm,
      reference: referenceResults,
      compileMilliseconds,
      instantiateMilliseconds,
      firstNativeOperationMilliseconds,
      firstCalendarOperationMilliseconds,
      initialMemoryBytes,
      finalMemoryBytes: query.memoryBytes,
      native: JSON.parse(query('{"op":"info"}')),
      size: {
        modules,
        binary,
        consumer: {
          typescript: tsBundle,
          wasmJS: wasmBundle,
          wasmCombinedGzip: wasmBundle.gzip + binary.gzip,
        },
        separateModules: {
          typescriptGzip: separateTS,
          wasmCombinedGzip: separateTS + modules[2].gzip + binary.gzip,
        },
      },
    },
    null,
    2
  )
)

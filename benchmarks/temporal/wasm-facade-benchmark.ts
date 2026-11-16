import {zonedInputs} from './zoned-inputs.ts'
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
const dateStrings = strings.map(value => value.slice(0, 10))
const dateTimeStrings = strings.map(value => value.slice(0, -6))
const yearMonthStrings = strings.map(
  (_, index) => `2020-${String(index + 2).padStart(2, '0')}`
)
const monthDayStrings = strings.map(value => value.slice(5, 10))
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
  const dateTimes = strings.map(value =>
    namespace.PlainDateTime.from(value.slice(0, -6))
  )
  const referenceDateTimes = strings.map(value =>
    reference.PlainDateTime.from(value.slice(0, -6))
  )
  const dateTimeEnds = dateTimes.map(value =>
    value.add({months: 1, days: 3, hours: 2, nanoseconds: 481})
  )
  const referenceDateTimeEnds = referenceDateTimes.map(value =>
    value.add({months: 1, days: 3, hours: 2, nanoseconds: 481})
  )
  const yearMonths = dates.map((value, index) =>
    value.toPlainYearMonth().add({months: index})
  )
  const expectedYearMonths = expectedDates.map((value, index) =>
    value.toPlainYearMonth().add({months: index})
  )
  const monthDays = dates.map(value => value.toPlainMonthDay())
  const referenceMonthDays = expectedDates.map(value => value.toPlainMonthDay())
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
  const zonedStrings = zonedInputs.map(([id, local]) => local + '[' + id + ']')
  const zonedValues = zonedStrings.map(value =>
    namespace.ZonedDateTime.from(value)
  )
  const referenceZonedValues = zonedStrings.map(value =>
    reference.ZonedDateTime.from(value)
  )
  const zonedEnds = zonedValues.map(value => value.add({days: 1, hours: 1}))
  const referenceZonedEnds = referenceZonedValues.map(value =>
    value.add({days: 1, hours: 1})
  )
  const durationStrings = strings.map(
    (_, index) => `P1DT${index + 1}H2M3.12345678${index}S`
  )
  const durations = durationStrings.map(value => namespace.Duration.from(value))
  const referenceDurations = durationStrings.map(value =>
    reference.Duration.from(value)
  )
  const calendarDurations = durations.map(value => value.with({months: 1}))
  const referenceCalendarDurations = referenceDurations.map(value =>
    value.with({months: 1})
  )
  const durationAnchors = dates.map((value, index) =>
    index % 2 ? value : zonedValues[index]
  )
  const referenceDurationAnchors = expectedDates.map((value, index) =>
    index % 2 ? value : referenceZonedValues[index]
  )
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
      name: 'dateParse',
      run: (index: number) =>
        namespace.PlainDate.from(dateStrings[index]).day.toString(),
      check: (index: number) =>
        reference.PlainDate.from(dateStrings[index]).day.toString(),
    },
    {
      name: 'dateTimeParse',
      run: (index: number) =>
        namespace.PlainDateTime.from(
          dateTimeStrings[index]
        ).nanosecond.toString(),
      check: (index: number) =>
        reference.PlainDateTime.from(
          dateTimeStrings[index]
        ).nanosecond.toString(),
    },
    {
      name: 'yearMonthParse',
      run: (index: number) =>
        namespace.PlainYearMonth.from(yearMonthStrings[index]).month.toString(),
      check: (index: number) =>
        reference.PlainYearMonth.from(yearMonthStrings[index]).month.toString(),
    },
    {
      name: 'monthDayParse',
      run: (index: number) =>
        namespace.PlainMonthDay.from(monthDayStrings[index]).day.toString(),
      check: (index: number) =>
        reference.PlainMonthDay.from(monthDayStrings[index]).day.toString(),
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
      name: 'dateTimeAdd',
      run: (index: number) =>
        dateTimes[index].add({months: 1, hours: 25, nanoseconds: 1}).toString(),
      check: (index: number) =>
        referenceDateTimes[index]
          .add({months: 1, hours: 25, nanoseconds: 1})
          .toString(),
    },
    {
      name: 'dateTimeUntil',
      run: (index: number) =>
        dateTimes[index]
          .until(dateTimeEnds[index], {
            largestUnit: 'month',
            smallestUnit: 'microsecond',
            roundingMode: 'halfEven',
          })
          .toString(),
      check: (index: number) =>
        referenceDateTimes[index]
          .until(referenceDateTimeEnds[index], {
            largestUnit: 'month',
            smallestUnit: 'microsecond',
            roundingMode: 'halfEven',
          })
          .toString(),
    },
    {
      name: 'dateTimeRoundFormat',
      run: (index: number) =>
        dateTimes[index]
          .round({
            smallestUnit: 'microsecond',
            roundingIncrement: 125,
            roundingMode: 'halfEven',
          })
          .toString(),
      check: (index: number) =>
        referenceDateTimes[index]
          .round({
            smallestUnit: 'microsecond',
            roundingIncrement: 125,
            roundingMode: 'halfEven',
          })
          .toString(),
    },
    {
      name: 'dateFormat',
      run: (index: number) => dates[index].toString({calendarName: 'critical'}),
      check: (index: number) =>
        expectedDates[index].toString({calendarName: 'critical'}),
    },
    {
      name: 'dateTimeFormat',
      run: (index: number) =>
        dateTimes[index].toString({
          calendarName: 'always',
          smallestUnit: 'second',
          roundingMode: 'ceil',
        }),
      check: (index: number) =>
        referenceDateTimes[index].toString({
          calendarName: 'always',
          smallestUnit: 'second',
          roundingMode: 'ceil',
        }),
    },
    {
      name: 'yearMonthFormat',
      run: (index: number) =>
        yearMonths[index].toString({calendarName: 'critical'}),
      check: (index: number) =>
        expectedYearMonths[index].toString({calendarName: 'critical'}),
    },
    {
      name: 'monthDayFormat',
      run: (index: number) =>
        monthDays[index].toString({calendarName: 'always'}),
      check: (index: number) =>
        referenceMonthDays[index].toString({calendarName: 'always'}),
    },
    {
      name: 'zonedFormat',
      run: (index: number) =>
        zonedValues[index].toString({
          calendarName: 'critical',
          timeZoneName: 'critical',
          smallestUnit: 'second',
        }),
      check: (index: number) =>
        referenceZonedValues[index].toString({
          calendarName: 'critical',
          timeZoneName: 'critical',
          smallestUnit: 'second',
        }),
    },
    {
      name: 'yearMonthUntil',
      run: (index: number) =>
        yearMonths[index]
          .until(yearMonths[(index + 1) & 7], {largestUnit: 'year'})
          .toString(),
      check: (index: number) =>
        expectedYearMonths[index]
          .until(expectedYearMonths[(index + 1) & 7], {largestUnit: 'year'})
          .toString(),
    },
    {
      name: 'yearMonthToDate',
      run: (index: number) =>
        yearMonths[index].toPlainDate({day: 31}).toString(),
      check: (index: number) =>
        expectedYearMonths[index].toPlainDate({day: 31}).toString(),
    },
    {
      name: 'monthDayToDate',
      run: (index: number) =>
        monthDays[index].toPlainDate({year: 2024 + index}).toString(),
      check: (index: number) =>
        referenceMonthDays[index].toPlainDate({year: 2024 + index}).toString(),
    },
    {
      name: 'yearMonthAdd',
      run: (index: number) =>
        yearMonths[index].add({years: 1, months: 3}).toString(),
      check: (index: number) =>
        expectedYearMonths[index].add({years: 1, months: 3}).toString(),
    },
    {
      name: 'zonedParse',
      run: (index: number) =>
        namespace.ZonedDateTime.from(
          zonedStrings[index]
        ).epochNanoseconds.toString(),
      check: (index: number) =>
        reference.ZonedDateTime.from(
          zonedStrings[index]
        ).epochNanoseconds.toString(),
    },
    {
      name: 'zonedOffset',
      run: (index: number) => zonedValues[index].offsetNanoseconds.toString(),
      check: (index: number) =>
        referenceZonedValues[index].offsetNanoseconds.toString(),
    },
    {
      name: 'zonedAddDay',
      run: (index: number) =>
        zonedValues[index].add({days: 1}).epochNanoseconds.toString(),
      check: (index: number) =>
        referenceZonedValues[index].add({days: 1}).epochNanoseconds.toString(),
    },
    {
      name: 'zonedUntilDay',
      run: (index: number) =>
        zonedValues[index]
          .until(zonedEnds[index], {largestUnit: 'day'})
          .toString(),
      check: (index: number) =>
        referenceZonedValues[index]
          .until(referenceZonedEnds[index], {largestUnit: 'day'})
          .toString(),
    },
    {
      name: 'zonedRound',
      run: (index: number) =>
        zonedValues[index]
          .round({
            smallestUnit: 'hour',
            roundingIncrement: 1,
            roundingMode: 'halfEven',
          })
          .epochNanoseconds.toString(),
      check: (index: number) =>
        referenceZonedValues[index]
          .round({
            smallestUnit: 'hour',
            roundingIncrement: 1,
            roundingMode: 'halfEven',
          })
          .epochNanoseconds.toString(),
    },
    {
      name: 'zonedDayStart',
      run: (index: number) =>
        zonedValues[index].startOfDay().epochNanoseconds.toString(),
      check: (index: number) =>
        referenceZonedValues[index].startOfDay().epochNanoseconds.toString(),
    },
    {
      name: 'zonedHoursInDay',
      run: (index: number) => zonedValues[index].hoursInDay.toString(),
      check: (index: number) =>
        referenceZonedValues[index].hoursInDay.toString(),
    },
    {
      name: 'zonedTransition',
      iterations: 512,
      warmup: 128,
      run: (index: number) =>
        zonedValues[index]
          .getTimeZoneTransition('next')
          ?.epochNanoseconds.toString() ?? 'null',
      check: (index: number) =>
        referenceZonedValues[index]
          .getTimeZoneTransition('next')
          ?.epochNanoseconds.toString() ?? 'null',
    },
    {
      name: 'durationParse',
      run: (index: number) =>
        namespace.Duration.from(durationStrings[index]).nanoseconds.toString(),
      check: (index: number) =>
        reference.Duration.from(durationStrings[index]).nanoseconds.toString(),
    },
    {
      name: 'durationFormat',
      run: (index: number) =>
        durations[index].toString({
          smallestUnit: 'microsecond',
          roundingMode: 'halfEven',
        }),
      check: (index: number) =>
        referenceDurations[index].toString({
          smallestUnit: 'microsecond',
          roundingMode: 'halfEven',
        }),
    },
    {
      name: 'durationAdd',
      run: (index: number) =>
        durations[index].add({hours: 25, nanoseconds: 1}).toString(),
      check: (index: number) =>
        referenceDurations[index].add({hours: 25, nanoseconds: 1}).toString(),
    },
    {
      name: 'durationRoundRelative',
      run: (index: number) =>
        calendarDurations[index]
          .round({
            relativeTo: durationAnchors[index],
            largestUnit: 'month',
            smallestUnit: 'day',
            roundingMode: 'halfEven',
          })
          .toString(),
      check: (index: number) =>
        referenceCalendarDurations[index]
          .round({
            relativeTo: referenceDurationAnchors[index],
            largestUnit: 'month',
            smallestUnit: 'day',
            roundingMode: 'halfEven',
          })
          .toString(),
    },
    {
      name: 'durationTotalRelative',
      run: (index: number) =>
        calendarDurations[index]
          .total({relativeTo: durationAnchors[index], unit: 'hour'})
          .toString(),
      check: (index: number) =>
        referenceCalendarDurations[index]
          .total({relativeTo: referenceDurationAnchors[index], unit: 'hour'})
          .toString(),
    },
  ]
  return cases.map(test => {
    const caseIterations = test.iterations ?? iterations
    const caseWarmup = test.warmup ?? warmup
    for (let index = 0; index < 8; index++)
      if (test.run(index) !== test.check(index))
        throw new Error('Benchmark parity: ' + test.name)
    for (let index = 0; index < caseWarmup; index++)
      checksum += test.run(index & 7).length
    const elapsed = []
    for (let sample = 0; sample < samples; sample++) {
      const start = performance.now()
      for (let index = 0; index < caseIterations; index++)
        checksum += test.run(index & 7).length
      elapsed.push(((performance.now() - start) * 1_000_000) / caseIterations)
    }
    elapsed.sort((a, b) => a - b)
    return {
      operation: test.name,
      iterations: caseIterations,
      warmup: caseWarmup,
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
start = performance.now()
checksum += Temporal.ZonedDateTime.from(
  zonedInputs[0][1] + '[' + zonedInputs[0][0] + ']'
).epochNanoseconds.toString().length
const firstTimezoneOperationMilliseconds = performance.now() - start
start = performance.now()
checksum += Temporal.Duration.from('P1M1DT2H')
  .total({relativeTo: '2020-01-31', unit: 'hour'})
  .toString().length
const firstDurationOperationMilliseconds = performance.now() - start
const wasm = measure(Temporal)
const nativeDataTemporal = (await load('wasm-native.js')).configureTemporalWasm(
  instance
)
const nativeDataWasm = measure(nativeDataTemporal)
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
const bundle = (wasm: boolean, nativeData = false) => {
  const code = buildSync({
    stdin: {
      contents: nativeData
        ? "export * from './wasm-native.js';"
        : `export * from './index.js';${wasm ? "export {configureWasmBackend} from './wasm.js';" : ''}`,
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
const modules = ['index.js', 'native.js', 'wasm.js', 'wasm-native.js'].map(
  minify
)
const binary = {raw: bytes.byteLength, gzip: gzipSync(bytes, {level: 9}).length}
const tsBundle = bundle(false),
  wasmBundle = bundle(true),
  nativeDataBundle = bundle(true, true)
const separateTS = modules[0].gzip + modules[1].gzip
console.log(
  JSON.stringify(
    {
      node: process.version,
      v8: process.versions.v8,
      icu: process.versions.icu,
      platform: process.platform + ' ' + process.arch,
      cpu: cpus()[0]?.model ?? 'unknown',
      memoryScope:
        'WASM linear memory only; excludes JS heap and compiled code.',
      scope:
        'Actual published Temporal namespace. Default TS uses compact ICU4X lunisolar data/arithmetic and host Intl Umm al-Qura; owned IANA data remains. WASM delegates ISO/Instant/PlainTime/calendar/timezone/Duration math, plain/zoned/short-date arithmetic, string parsing and date formatting with16 native calendars and all IANA records; object semantics and host/Intl integration remain JS/TS. Native-data profile removes duplicated TS calendar/IANA tables; hybrid retains compact TS calendars and timezone data. ISO date and zoned workloads use basic reference; no non-ISO throughput claim. Transition cases use512 iterations and128 warmup. Reference temporal-polyfill1.0.7 basic. Partial WASM backend, not full Rust namespace.',
      method:
        'Eight inputs, parity checked, 3000 warmup +7 samples x10000 calls; TS then WASM with fallback data then WASM with native data only then reference in one process. First native/calendar/timezone calls measured separately after warmed JS/TS; calendar call includes registry validation. Hot operations exclude startup. timeParse/timeAdd read nanosecond; timeRoundFormat includes formatting. Gzip level9, esbuild es2022 minification. Separately compressed module sums and consumer bundles are alternative delivery modes.',
      iterations,
      samples,
      warmup,
      checksum,
      typescript,
      wasm,
      nativeDataWasm,
      reference: referenceResults,
      compileMilliseconds,
      instantiateMilliseconds,
      firstNativeOperationMilliseconds,
      firstCalendarOperationMilliseconds,
      firstTimezoneOperationMilliseconds,
      firstDurationOperationMilliseconds,
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
          nativeDataWasmJS: nativeDataBundle,
          nativeDataWasmCombinedGzip: nativeDataBundle.gzip + binary.gzip,
        },
        separateModules: {
          typescriptGzip: separateTS,
          wasmCombinedGzip: separateTS + modules[2].gzip + binary.gzip,
          nativeDataWasmCombinedGzip: modules[3].gzip + binary.gzip,
        },
      },
    },
    null,
    2
  )
)

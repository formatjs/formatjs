import en from '../../crates/intl_datetimeformat/locale-data/en.json' with {type: 'json'}
import packed from '@formatjs_generated/tz/all-tz.js'
import {zonedInputs} from './zoned-inputs.ts'
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
const dateTimeFormat = Intl.DateTimeFormat as typeof Intl.DateTimeFormat & {
  __addLocaleData(data: string): void
  __addTZData(data: string): void
}
dateTimeFormat.__addLocaleData(JSON.stringify(en))
dateTimeFormat.__addTZData(JSON.stringify(packed))
const strings = Array.from(
  {length: 8},
  (_, index) => `2020-02-${String(21 + index)}T23:59:59.123456789+05:45`
)
const owned = strings.map(value => Temporal.Instant.from(value))
const other = strings.map(value => reference.Instant.from(value))
const clocks = strings.map((_, index) => `23:59:${51 + index}.12345678${index}`)
const times = clocks.map(value => Temporal.PlainTime.from(value))
const referenceTimes = clocks.map(value => reference.PlainTime.from(value))
const dates = strings.map(value => Temporal.PlainDate.from(value.slice(0, 10)))
const referenceDates = strings.map(value =>
  reference.PlainDate.from(value.slice(0, 10))
)
const yearMonths = dates.map((value, index) =>
  value.toPlainYearMonth().add({months: index})
)
const referenceYearMonths = referenceDates.map((value, index) =>
  value.toPlainYearMonth().add({months: index})
)
const dateFields = (
  value:
    | InstanceType<typeof Temporal.PlainDate>
    | InstanceType<typeof reference.PlainDate>
) =>
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
  Temporal.ZonedDateTime.from(value)
)
const referenceZonedValues = zonedStrings.map(value =>
  reference.ZonedDateTime.from(value)
)
const zonedEnds = zonedValues.map(value => value.add({days: 1, hours: 1}))
const referenceZonedEnds = referenceZonedValues.map(value =>
  value.add({days: 1, hours: 1})
)
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
  {
    name: 'dateFromFields',
    owned: (index: number) =>
      Temporal.PlainDate.from({
        year: 2020,
        monthCode: 'M02',
        day: 21 + index,
      }).day.toString(),
    reference: (index: number) =>
      reference.PlainDate.from({
        year: 2020,
        monthCode: 'M02',
        day: 21 + index,
      }).day.toString(),
  },
  {
    name: 'dateFields',
    owned: (index: number) => dateFields(dates[index]),
    reference: (index: number) => dateFields(referenceDates[index]),
  },
  {
    name: 'dateAdd',
    owned: (index: number) =>
      dates[index].add({years: 1, months: 2, days: 3}).toString(),
    reference: (index: number) =>
      referenceDates[index].add({years: 1, months: 2, days: 3}).toString(),
  },
  {
    name: 'dateUntil',
    owned: (index: number) =>
      dates[index]
        .until(dates[(index + 1) & 7], {largestUnit: 'month'})
        .toString(),
    reference: (index: number) =>
      referenceDates[index]
        .until(referenceDates[(index + 1) & 7], {largestUnit: 'month'})
        .toString(),
  },
  {
    name: 'yearMonthAdd',
    owned: (index: number) =>
      yearMonths[index].add({years: 1, months: 3}).toString(),
    reference: (index: number) =>
      referenceYearMonths[index].add({years: 1, months: 3}).toString(),
  },
  {
    name: 'zonedParse',
    owned: (index: number) =>
      Temporal.ZonedDateTime.from(
        zonedStrings[index]
      ).epochNanoseconds.toString(),
    reference: (index: number) =>
      reference.ZonedDateTime.from(
        zonedStrings[index]
      ).epochNanoseconds.toString(),
  },
  {
    name: 'zonedOffset',
    owned: (index: number) => zonedValues[index].offsetNanoseconds.toString(),
    reference: (index: number) =>
      referenceZonedValues[index].offsetNanoseconds.toString(),
  },
  {
    name: 'zonedAddDay',
    owned: (index: number) =>
      zonedValues[index].add({days: 1}).epochNanoseconds.toString(),
    reference: (index: number) =>
      referenceZonedValues[index].add({days: 1}).epochNanoseconds.toString(),
  },
  {
    name: 'zonedUntilDay',
    owned: (index: number) =>
      zonedValues[index]
        .until(zonedEnds[index], {largestUnit: 'day'})
        .toString(),
    reference: (index: number) =>
      referenceZonedValues[index]
        .until(referenceZonedEnds[index], {largestUnit: 'day'})
        .toString(),
  },
  {
    name: 'zonedTransition',
    iterations: 512,
    warmup: 128,
    owned: (index: number) =>
      zonedValues[index]
        .getTimeZoneTransition('next')
        ?.epochNanoseconds.toString() ?? 'null',
    reference: (index: number) =>
      referenceZonedValues[index]
        .getTimeZoneTransition('next')
        ?.epochNanoseconds.toString() ?? 'null',
  },
]
const iterations = 5000,
  samples = 5,
  warmup = 1000
let checksum = 0
const results = cases.map(test => {
  const caseIterations = test.iterations ?? iterations
  const caseWarmup = test.warmup ?? warmup
  for (let index = 0; index < 8; index++)
    if (test.owned(index) !== test.reference(index))
      throw new Error('Benchmark parity: ' + test.name)
  const measure = (run: (index: number) => string) => {
    for (let index = 0; index < caseWarmup; index++)
      checksum += run(index & 7).length
    const elapsed = []
    for (let sample = 0; sample < samples; sample++) {
      const start = performance.now()
      for (let index = 0; index < caseIterations; index++)
        checksum += run(index & 7).length
      elapsed.push(((performance.now() - start) * 1_000_000) / caseIterations)
    }
    elapsed.sort((a, b) => a - b)
    return {
      medianNanoseconds: elapsed[Math.floor(samples / 2)],
      samplesNanoseconds: elapsed,
    }
  }
  return {
    operation: test.name,
    iterations: caseIterations,
    warmup: caseWarmup,
    owned: measure(test.owned),
    reference: measure(test.reference),
  }
})
print(
  JSON.stringify({
    scope:
      'Public Instant/PlainTime/ISO-date/zoned workloads; Rust ISO/Instant/PlainTime/calendar/timezone JSON bridge optional, all16 calendars and IANA records bundled, remaining orchestration TS. Reference temporal-polyfill 1.0.7 basic implementation. timeParse/timeAdd read nanosecond; timeRoundFormat includes formatting. Zoned cases include gaps/folds/half-hour and skipped-day changes. Transition cases use512 iterations and128 warmup. Not complete native Temporal or WASM comparison.',
    intlProvider:
      'FormatJS native DateTimeFormat with registered en locale and owned IANA data',
    backend: query ? 'rust-iso-instant-time-calendars-zones' : 'typescript',
    iterations,
    samples,
    warmup,
    inputs: 8,
    checksum,
    results,
    native: query ? JSON.parse(query('{"op":"info"}') as string) : undefined,
  })
)

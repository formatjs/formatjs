import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {performance} from 'node:perf_hooks'
import {pathToFileURL} from 'node:url'
import {gzipSync} from 'node:zlib'
import {transformSync} from 'esbuild'

const resolve = (file: string) =>
  runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/benchmarks/temporal/${file}`
  )
const {
  Instant,
  Duration,
  PlainTime,
  PlainDate,
  PlainDateTime,
  PlainYearMonth,
  PlainMonthDay,
  ZonedDateTime,
} = await import(pathToFileURL(resolve('instant-code.js')).href)
const {Temporal: reference} = await import(
  pathToFileURL(resolve('reference-bundle.js')).href
)
const zonedStrings = [
  '2020-03-07T12:00-05:00[America/New_York]',
  '2020-11-01T01:30-05:00[America/New_York]',
  '2000-02-29T23:59:59.123456789+05:30[+05:30]',
  '1970-01-01T00:00Z[UTC]',
]
const zonedValues = zonedStrings.map(value => ZonedDateTime.from(value))
const zonedEnds = zonedValues.map(value => value.add({days: 8, hours: 12}))
const referenceZonedValues = zonedStrings.map(value =>
  reference.ZonedDateTime.from(value)
)
const referenceZonedEnds = referenceZonedValues.map(value =>
  value.add({days: 8, hours: 12})
)
const inputs = [-1000001n, -1n, 0n, 1n, 123456789n, 8640000000000000000000n]
type Value = bigint | string | number
const pairs: [string, (i: number) => Value, (i: number) => Value][] = [
  [
    'construct/get epochNanoseconds',
    i => new Instant(inputs[i % inputs.length]).epochNanoseconds,
    i => new reference.Instant(inputs[i % inputs.length]).epochNanoseconds,
  ],
  [
    'fromEpochNanoseconds/get epochMilliseconds',
    i =>
      BigInt(
        Instant.fromEpochNanoseconds(inputs[i % inputs.length])
          .epochMilliseconds
      ),
    i =>
      BigInt(
        reference.Instant.fromEpochNanoseconds(inputs[i % inputs.length])
          .epochMilliseconds
      ),
  ],
  [
    'fromEpochMilliseconds/get epochNanoseconds',
    i => Instant.fromEpochMilliseconds((i % 10001) - 5000).epochNanoseconds,
    i =>
      reference.Instant.fromEpochMilliseconds((i % 10001) - 5000)
        .epochNanoseconds,
  ],
]
pairs.push([
  'ZonedDateTime parse/add day/toJSON',
  i =>
    ZonedDateTime.from(zonedStrings[i % zonedStrings.length])
      .add({days: 1})
      .toJSON(),
  i =>
    reference.ZonedDateTime.from(zonedStrings[i % zonedStrings.length])
      .add({days: 1})
      .toJSON(),
])
pairs.push([
  'ZonedDateTime parse/round hour/toJSON',
  i =>
    ZonedDateTime.from(zonedStrings[i % zonedStrings.length])
      .round('hour')
      .toJSON(),
  i =>
    reference.ZonedDateTime.from(zonedStrings[i % zonedStrings.length])
      .round('hour')
      .toJSON(),
])
pairs.push([
  'ZonedDateTime until days/toJSON',
  i =>
    zonedValues[i % 4]
      .until(zonedEnds[i % 4], {largestUnit: 'day', smallestUnit: 'minute'})
      .toJSON(),
  i =>
    referenceZonedValues[i % 4]
      .until(referenceZonedEnds[i % 4], {
        largestUnit: 'day',
        smallestUnit: 'minute',
      })
      .toJSON(),
])
pairs.push([
  'ZonedDateTime next transition/get epochNanoseconds',
  i => zonedValues[i % 4].getTimeZoneTransition('next')?.epochNanoseconds ?? 0n,
  i =>
    referenceZonedValues[i % 4].getTimeZoneTransition('next')
      ?.epochNanoseconds ?? 0n,
])
const relativeDurations = ['P1M14D', 'P3M15D', '-P1M15D', 'P0D']
pairs.push([
  'Duration parse/total months relative to date',
  i =>
    Duration.from(relativeDurations[i % 4]).total({
      relativeTo: '2019-01-01',
      unit: 'month',
    }),
  i =>
    reference.Duration.from(relativeDurations[i % 4]).total({
      relativeTo: '2019-01-01',
      unit: 'month',
    }),
])
pairs.push([
  'Duration parse/round months relative to date/toJSON',
  i =>
    Duration.from(relativeDurations[i % 4])
      .round({
        relativeTo: '2019-01-01',
        largestUnit: 'month',
        smallestUnit: 'month',
        roundingMode: 'halfEven',
      })
      .toJSON(),
  i =>
    reference.Duration.from(relativeDurations[i % 4])
      .round({
        relativeTo: '2019-01-01',
        largestUnit: 'month',
        smallestUnit: 'month',
        roundingMode: 'halfEven',
      })
      .toJSON(),
])
pairs.push([
  'Duration compare day versus 24 hours relative to zone',
  i =>
    Duration.compare({days: 1}, {hours: 24}, {relativeTo: zonedValues[i % 4]}),
  i =>
    reference.Duration.compare(
      {days: 1},
      {hours: 24},
      {relativeTo: referenceZonedValues[i % 4]}
    ),
])
const strings = [
  '1970-01-01T00:00:00.000000001Z',
  '20000229T123456.123456789+0530',
  '1969-12-31T23:59:59.999999999Z',
  '+275760-09-13T23:59:59.999999999+23:59:59.999999999',
  '1970-01-01T00Z[!America/New_York][u-ca=hebrew]',
]
pairs.push([
  'from ISO string/get epochNanoseconds',
  i => Instant.from(strings[i % strings.length]).epochNanoseconds,
  i => reference.Instant.from(strings[i % strings.length]).epochNanoseconds,
])
pairs.push(
  [
    'round microsecond/get epochNanoseconds',
    i =>
      new Instant(inputs[i % inputs.length]).round('microsecond')
        .epochNanoseconds,
    i =>
      new reference.Instant(inputs[i % inputs.length]).round('microsecond')
        .epochNanoseconds,
  ],
  [
    'toJSON',
    i => new Instant(inputs[i % inputs.length]).toJSON(),
    i => new reference.Instant(inputs[i % inputs.length]).toJSON(),
  ],
  [
    'toString named timezone',
    i =>
      new Instant(inputs[i % inputs.length]).toString({
        timeZone: 'America/New_York',
      }),
    i =>
      new reference.Instant(inputs[i % inputs.length]).toString({
        timeZone: 'America/New_York',
      }),
  ]
)
const durationStrings = [
  'PT1H2M3.123456789S',
  '-PT0.000000001S',
  'P1DT23H59M59.999999999S',
  'PT9007199254740991.999999999S',
]
pairs.push(
  [
    'Duration parse/toJSON',
    i => Duration.from(durationStrings[i % durationStrings.length]).toJSON(),
    i =>
      reference.Duration.from(
        durationStrings[i % durationStrings.length]
      ).toJSON(),
  ],
  [
    'Duration total microseconds',
    i =>
      Duration.from(durationStrings[i % durationStrings.length]).total(
        'microsecond'
      ),
    i =>
      reference.Duration.from(
        durationStrings[i % durationStrings.length]
      ).total('microsecond'),
  ],
  [
    'Instant until/toJSON',
    i =>
      new Instant(inputs[i % inputs.length])
        .until(new Instant(inputs[(i + 1) % inputs.length]))
        .toJSON(),
    i =>
      new reference.Instant(inputs[i % inputs.length])
        .until(new reference.Instant(inputs[(i + 1) % inputs.length]))
        .toJSON(),
  ]
)
let numberSink = 0
const yearMonths = ['2020-02', '1970-01', '-000001-12', '+275760-08']
const monthDays = ['02-29', '--1231', '2000-02-29', '+999999-10-01']
pairs.push(
  [
    'PlainYearMonth parse/add/toJSON',
    i =>
      PlainYearMonth.from(yearMonths[i % yearMonths.length])
        .add('P1M')
        .toJSON(),
    i =>
      reference.PlainYearMonth.from(yearMonths[i % yearMonths.length])
        .add('P1M')
        .toJSON(),
  ],
  [
    'PlainMonthDay parse/toPlainDate/toJSON',
    i =>
      PlainMonthDay.from(monthDays[i % monthDays.length])
        .toPlainDate({year: 2001})
        .toJSON(),
    i =>
      reference.PlainMonthDay.from(monthDays[i % monthDays.length])
        .toPlainDate({year: 2001})
        .toJSON(),
  ]
)
const dates = ['2020-02-29', '2000-01-31', '1970-01-01', '-000001-12-31']
pairs.push(
  [
    'PlainDate parse/add/toJSON',
    i =>
      PlainDate.from(dates[i % dates.length])
        .add('P1Y1M')
        .toJSON(),
    i =>
      reference.PlainDate.from(dates[i % dates.length])
        .add('P1Y1M')
        .toJSON(),
  ],
  [
    'PlainDateTime parse/add/toJSON',
    i =>
      PlainDateTime.from(dates[i % dates.length] + 'T23:59:59.999999999')
        .add('P1MT0.000000001S')
        .toJSON(),
    i =>
      reference.PlainDateTime.from(
        dates[i % dates.length] + 'T23:59:59.999999999'
      )
        .add('P1MT0.000000001S')
        .toJSON(),
  ]
)
const times = ['00:00:00', '01:06', '23:59:59.999999999', 'T1231']
pairs.push(
  [
    'PlainTime parse/round/toJSON',
    i =>
      PlainTime.from(times[i % times.length])
        .round({
          smallestUnit: 'minute',
          roundingIncrement: 12,
          roundingMode: 'halfEven',
        })
        .toJSON(),
    i =>
      reference.PlainTime.from(times[i % times.length])
        .round({
          smallestUnit: 'minute',
          roundingIncrement: 12,
          roundingMode: 'halfEven',
        })
        .toJSON(),
  ],
  [
    'PlainTime parse/add/toJSON',
    i =>
      PlainTime.from(times[i % times.length])
        .add('PT1.000000001S')
        .toJSON(),
    i =>
      reference.PlainTime.from(times[i % times.length])
        .add('PT1.000000001S')
        .toJSON(),
  ]
)
let sink = 0n
function consume(value: Value): void {
  if (typeof value === 'number') {
    numberSink += value
    return
  }
  sink ^= typeof value === 'string' ? BigInt(value.length) : value
}
const throughput = pairs.map(([name, ours, theirs]) => {
  for (let i = 0; i < 5000; i++) {
    if (ours(i) !== theirs(i)) throw new Error(`Results disagree: ${name}`)
    consume(ours(i))
    consume(theirs(i))
  }
  const samples: number[][] = [[], []]
  for (let sample = 0; sample < 7; sample++) {
    for (const index of sample % 2 ? [1, 0] : [0, 1]) {
      const operation = index === 0 ? ours : theirs
      const start = performance.now()
      for (let i = 0; i < 50000; i++) consume(operation(i))
      samples[index].push(((performance.now() - start) * 1e6) / 50000)
    }
  }
  for (const values of samples) values.sort((a, b) => a - b)
  return {
    name,
    oursMedianNs: samples[0][3],
    referenceMedianNs: samples[1][3],
    samples,
  }
})
const sizes = [
  'instant-code.js',
  'instant-primitives-code.js',
  'calendar-code.js',
  'reference-bundle.js',
].map(file => {
  const source = readFileSync(resolve(file), 'utf8')
  const code = transformSync(source, {
    loader: 'js',
    target: 'es2022',
    minify: true,
    legalComments: 'none',
  }).code
  return {
    file,
    minified: Buffer.byteLength(code),
    minifiedGzip: gzipSync(code, {level: 9}).length,
  }
})
console.log(
  JSON.stringify(
    {
      node: process.version,
      v8: process.versions.v8,
      platform: process.platform,
      arch: process.arch,
      scope:
        'Instant, Duration, PlainTime, PlainDate, PlainDateTime, PlainYearMonth, PlainMonthDay and ZonedDateTime paths, parsing, arithmetic, totals and serialization, versus forced temporal-polyfill 1.0.7 classes. Owned IANA 2026f data included; reference uses host Intl timezone data. Partial API; no full-polyfill size or conformance claim.',
      sizes,
      throughput,
      sink: String(sink),
      numberSink,
    },
    null,
    2
  )
)

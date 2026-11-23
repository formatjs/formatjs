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
const originalDateTime = Object.getOwnPropertyDescriptor(
  Intl,
  'DateTimeFormat'
)!
const originalDuration = Object.getOwnPropertyDescriptor(Intl, 'DurationFormat')
const {Temporal: reference} = await import(
  pathToFileURL(resolve('reference-full-bundle.js')).href
)
const {Temporal: ours} = await import(
  pathToFileURL(resolve('locale-code.js')).href
)
Object.defineProperty(Intl, 'DateTimeFormat', originalDateTime)
if (originalDuration)
  Object.defineProperty(Intl, 'DurationFormat', originalDuration)
else Reflect.deleteProperty(Intl, 'DurationFormat')
const options = {calendar: 'gregory', hourCycle: 'h23', timeZone: 'UTC'}
const profiles = [
  [
    'PlainDate',
    ['2020-02-03', '2000-02-29', '2024-12-31'],
    {...options, dateStyle: 'full'},
  ],
  [
    'PlainTime',
    ['12:34:56', '00:00:00', '23:59:59.123456789'],
    {...options, timeStyle: 'short'},
  ],
  [
    'PlainDateTime',
    ['2020-02-03T12:34:56', '2000-02-29T00:00', '2024-12-31T23:59'],
    {...options, dateStyle: 'long', timeStyle: 'short'},
  ],
  [
    'PlainYearMonth',
    [
      '2020-02-01[u-ca=gregory]',
      '2000-02-01[u-ca=gregory]',
      '2024-12-01[u-ca=gregory]',
    ],
    options,
  ],
  [
    'PlainMonthDay',
    [
      '2020-02-03[u-ca=gregory]',
      '2000-02-29[u-ca=gregory]',
      '2024-12-31[u-ca=gregory]',
    ],
    options,
  ],
  [
    'Instant',
    ['2020-02-03T12:34:56Z', '2000-02-29T00:00Z', '2024-12-31T23:59Z'],
    {...options, dateStyle: 'long', timeStyle: 'short'},
  ],
  [
    'ZonedDateTime',
    [
      '2020-02-03T12:34:56-05:00[America/New_York]',
      '2000-02-29T00:00+00:00[Europe/London]',
      '2024-12-31T23:59+05:30[+05:30]',
    ],
    {
      calendar: 'gregory',
      hourCycle: 'h23',
      dateStyle: 'long',
      timeStyle: 'short',
    },
  ],
  [
    'Duration',
    ['PT1H2M3.004005006S', 'PT23H59M59.999999999S', 'PT0S'],
    {style: 'digital', fractionalDigits: 9},
  ],
] as const

let sink = 0
const throughput = profiles.map(([kind, inputs, options]) => {
  const left = inputs.map(value => ours[kind].from(value))
  const right = inputs.map(value => reference[kind].from(value))
  const operations = [left, right].map(
    values =>
      (i: number): string =>
        values[i % values.length].toLocaleString('en', options)
  )
  for (let i = 0; i < 60; i++) {
    const a = operations[0](i),
      b = operations[1](i)
    if (a !== b)
      throw new Error(
        `${kind} locale results differ: ${JSON.stringify([a, b])}`
      )
    sink ^= a.length ^ b.length
  }
  const samples: number[][] = [[], []]
  for (let sample = 0; sample < 7; sample++) {
    for (const index of sample % 2 ? [1, 0] : [0, 1]) {
      const start = performance.now()
      for (let i = 0; i < 300; i++) sink ^= operations[index](i).length
      samples[index].push(((performance.now() - start) * 1e6) / 300)
    }
  }
  return {
    name: `${kind}.toLocaleString`,
    oursMedianNs: [...samples[0]].sort((a, b) => a - b)[3],
    referenceMedianNs: [...samples[1]].sort((a, b) => a - b)[3],
    samples,
  }
})
const sizes = [
  'locale-code.js',
  'instant-code.js',
  'reference-full-bundle.js',
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
        'Eight public locale methods. Owned Temporal captures DateTimeFormat (English data, all calendars/timezones) and DurationFormat; remaining Intl prerequisites use host. Globals restored before measurement: forced temporal-polyfill 1.0.7 full/implementation uses host Intl. Complete output equality checked for each workload. Bundle sizes are alternatives; reference excludes host Intl implementation/data. Complete WASM facade/data unavailable; matched primitive measurements remain separate.',
      method:
        '60 equality/warmup calls; 7 samples of 300 calls, alternating implementation order. Median ns/call; esbuild es2022 minification, gzip level 9.',
      sizes,
      throughput,
      sink,
    },
    null,
    2
  )
)

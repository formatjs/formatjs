import {readFileSync, readdirSync} from 'node:fs'
import {join} from 'node:path'
import {performance} from 'node:perf_hooks'
import {runfiles} from '@bazel/runfiles'
import {NumberFormat} from '@formatjs/intl-numberformat'
import {runInNewContext} from 'node:vm'
import type {PluralRules} from '@formatjs/intl-pluralrules'
import type {NumberFormatOptions} from '#packages/ecma402-abstract/types/number.js'

const polyfilledPlurals = process.argv.includes('--polyfill-plurals')
if (polyfilledPlurals) {
  await import('@formatjs/intl-pluralrules/polyfill-force.js')
  const raw = readFileSync(
    runfiles.resolve(
      `${process.env.TEST_WORKSPACE || '_main'}/packages/intl-pluralrules/cldr-raw/en.js`
    ),
    'utf8'
  )
  ;(Intl.PluralRules as unknown as typeof PluralRules).__addLocaleData(
    runInNewContext(`(${raw})`)
  )
}

NumberFormat.__addLocaleData(
  JSON.parse(
    readFileSync(
      runfiles.resolve(
        `${process.env.TEST_WORKSPACE || '_main'}/packages/intl-numberformat/cldr-raw/en.json`
      ),
      'utf8'
    )
  )
)
const registrationStart = performance.now()
if (process.argv.includes('--all-locales')) {
  const directory = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/crates/intl_numberformat/locale-data`
  )
  for (const file of readdirSync(directory).filter(file =>
    file.endsWith('.json')
  ))
    NumberFormat.__addLocaleData(
      JSON.parse(readFileSync(join(directory, file), 'utf8'))
    )
}
const registrationMilliseconds = performance.now() - registrationStart
const iterations = Number(
  process.argv
    .find(value => value.startsWith('--iterations='))
    ?.split('=')[1] || 20000
)
const rounds = 7
const profiles: [string, NumberFormatOptions][] = [
  ['decimal', {}],
  ['currency', {style: 'currency', currency: 'USD'}],
  ['unit', {style: 'unit', unit: 'meter', unitDisplay: 'long'}],
  ['scientific', {notation: 'scientific'}],
  ['compact', {notation: 'compact'}],
  [
    'compact currency',
    {style: 'currency', currency: 'USD', notation: 'compact'},
  ],
  [
    'compact significant digits',
    {notation: 'compact', maximumSignificantDigits: 3},
  ],
]
const values = [0, -0, 1.025, -1.025, 1234.5, 999.5, 999999.5, 1e-7, 1e21]
const results = []
for (const [name, options] of profiles) {
  const formatter = new NumberFormat('en', options)
  let checksum = 0
  for (let i = 0; i < 2000; i++)
    checksum += formatter.format(values[i % values.length]).length
  const timings = []
  for (let round = 0; round < rounds; round++) {
    const start = performance.now()
    for (let i = 0; i < iterations; i++)
      checksum += formatter.format(values[i % values.length]).length
    timings.push(((performance.now() - start) * 1000) / iterations)
  }
  timings.sort((a, b) => a - b)
  results.push({
    name,
    medianMicroseconds: timings[Math.floor(rounds / 2)],
    minMicroseconds: timings[0],
    maxMicroseconds: timings.at(-1),
    checksum,
  })
}
for (const [name, locale, localeMatcher] of [
  ['construct exact', 'en', 'best fit'],
  ['construct fallback', 'de-XX', 'best fit'],
  ['construct lookup', 'de-XX', 'lookup'],
] as const) {
  const count = Math.min(iterations, 1000)
  let checksum = 0
  for (let i = 0; i < 100; i++)
    checksum += new NumberFormat(locale, {localeMatcher}).resolvedOptions()
      .locale.length
  const timings = []
  for (let round = 0; round < rounds; round++) {
    const start = performance.now()
    for (let i = 0; i < count; i++)
      checksum += new NumberFormat(locale, {localeMatcher}).resolvedOptions()
        .locale.length
    timings.push(((performance.now() - start) * 1000) / count)
  }
  timings.sort((a, b) => a - b)
  results.push({
    name,
    medianMicroseconds: timings[Math.floor(rounds / 2)],
    minMicroseconds: timings[0],
    maxMicroseconds: timings.at(-1),
    checksum,
  })
}
console.log(
  JSON.stringify(
    {
      node: process.version,
      pluralRules: polyfilledPlurals ? 'polyfill' : 'host',
      icu: process.versions.icu,
      iterations,
      rounds,
      registeredLocales: NumberFormat.availableLocales.size,
      registrationMilliseconds,
      results,
    },
    null,
    2
  )
)

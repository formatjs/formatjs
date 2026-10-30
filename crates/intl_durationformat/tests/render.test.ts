import '@formatjs/intl-getcanonicallocales/polyfill-force.js'
import '@formatjs/intl-pluralrules/polyfill-force.js'
import {NumberFormat} from '@formatjs/intl-numberformat'
import type {PluralRules} from '@formatjs/intl-pluralrules'
import ListFormat from '@formatjs/intl-listformat'
import {DurationFormat} from '@formatjs/intl-durationformat'
import type {DurationFormatOptions} from '@formatjs/intl-durationformat'
import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {runInNewContext} from 'node:vm'
import {expect, it} from 'vitest'

const resolve = (path: string) =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
const read = (path: string) => readFileSync(resolve(path), 'utf8')
const units = [
  'years',
  'months',
  'weeks',
  'days',
  'hours',
  'minutes',
  'seconds',
  'milliseconds',
  'microseconds',
  'nanoseconds',
] as const
const locales = ['en', 'fr', 'ar', 'de', 'ja', 'ru', 'zh', 'fa']

it('matches native number/list composition, exact folding, signs and parts', () => {
  Object.defineProperty(Intl, 'NumberFormat', {
    value: NumberFormat,
    configurable: true,
    writable: true,
  })
  Object.defineProperty(Intl, 'ListFormat', {
    value: ListFormat,
    configurable: true,
    writable: true,
  })
  const requests: object[] = []
  for (const locale of locales) {
    const number = read(`crates/intl_numberformat/locale-data/${locale}.json`)
    const list = read(`crates/intl_listformat/locale-data/${locale}.json`)
    ;(Intl.PluralRules as unknown as typeof PluralRules).__addLocaleData(
      runInNewContext(
        '(' + read(`packages/intl-pluralrules/cldr-raw/${locale}.js`) + ')'
      )
    )
    NumberFormat.__addLocaleData(JSON.parse(number))
    ListFormat.__addLocaleData(
      JSON.parse(read(`packages/intl-listformat/cldr-raw/${locale}.json`))
    )
    requests.push(
      {method: 'numberData', data: number},
      {method: 'listData', data: list}
    )
  }
  const registrationCount = requests.length
  const values = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 2, 3, 4, 5, 6, 7, 473, 456, 789],
    [0, 0, 0, 0, 0, 0, 1, 473, 0, 0],
    [0, 0, 0, 0, 1, 0, 2, 0, 0, 0],
    [0, 0, 0, 0, 10000, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 1000000000000000100, 123],
    [0, 0, 0, 0, 0, 0, 9007199254740991, 999, 999, 999],
  ]
  const profiles: DurationFormatOptions[] = [
    ...(['long', 'short', 'narrow', 'digital'] as const).map(style => ({
      style,
    })),
    ...[0, 1, 3, 6, 9].map(fractionalDigits => ({
      style: 'digital' as const,
      fractionalDigits,
    })),
    {hours: 'numeric', minutesDisplay: 'auto', secondsDisplay: 'auto'},
    {
      style: 'digital',
      hoursDisplay: 'auto',
      minutesDisplay: 'auto',
      secondsDisplay: 'auto',
    },
    {seconds: 'long', milliseconds: 'numeric', fractionalDigits: 3},
    {milliseconds: 'short', microseconds: 'numeric', fractionalDigits: 6},
    {microseconds: 'long', nanoseconds: 'numeric'},
    {years: 'long', yearsDisplay: 'always'},
    {style: 'digital', numberingSystem: 'arab'},
    {style: 'digital', numberingSystem: 'hanidec', fractionalDigits: 3},
  ]
  const cases: {
    locale: string
    options: DurationFormatOptions
    values: number[]
    expected: unknown
  }[] = []
  for (const locale of locales)
    for (const options of profiles) {
      const reference = new DurationFormat(locale, options)
      const resolved = reference.resolvedOptions()
      for (const unsigned of values)
        for (const sign of [1, -1]) {
          const values = unsigned.map(value => value * sign)
          const record = Object.fromEntries(
            units.map((unit, index) => [unit, values[index]])
          )
          const parts = reference.formatToParts(record)
          const expected = {options: resolved, parts}
          expect(parts.map(part => part.value).join('')).toBe(
            reference.format(record)
          )
          cases.push({locale, options, values, expected})
          requests.push({
            method: 'renderResolved',
            options,
            values: values.map(String),
            locales: [locale],
            resolution: options,
          })
        }
    }
  const result = spawnSync(
    resolve('crates/intl_durationformat/conformance'),
    [],
    {
      input: requests.map(request => JSON.stringify(request)).join('\n') + '\n',
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    }
  )
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  const responses = result.stdout
    .trim()
    .split('\n')
    .map(line => JSON.parse(line))
  expect(responses.slice(0, registrationCount)).toEqual(
    Array(registrationCount).fill(true)
  )
  expect(responses.length).toBe(requests.length)
  for (let index = 0; index < cases.length; index++) {
    const {expected, ...context} = cases[index]
    expect(
      responses[registrationCount + index],
      JSON.stringify(context)
    ).toEqual(expected)
  }
}, 60_000)

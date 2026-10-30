import '@formatjs/intl-getcanonicallocales/polyfill-force.js'
import '@formatjs/intl-pluralrules/polyfill-force.js'
import '@formatjs/intl-numberformat/polyfill-force.js'
import type {NumberFormat} from '@formatjs/intl-numberformat'
import type {PluralRules} from '@formatjs/intl-pluralrules'
import Reference from '@formatjs/intl-relativetimeformat'
import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync, readdirSync} from 'node:fs'
import {join} from 'node:path'
import {runInNewContext} from 'node:vm'
import {beforeAll, expect, it} from 'vitest'

const resolve = (path: string) =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
const directory = resolve('crates/intl_relativetimeformat/locale-data')
const files = readdirSync(directory)
  .filter(file => file.endsWith('.json'))
  .sort(
    (a, b) =>
      Number(b === 'en.json') - Number(a === 'en.json') || a.localeCompare(b)
  )
const number = Intl.NumberFormat as unknown as typeof NumberFormat
const plural = Intl.PluralRules as unknown as typeof PluralRules
beforeAll(() => {
  const pluralDirectory = resolve('crates/intl_pluralrules/locale-data')
  const pluralFiles = readdirSync(pluralDirectory)
    .filter(file => file.endsWith('.json'))
    .sort(
      (a, b) =>
        Number(b === 'en.json') - Number(a === 'en.json') || a.localeCompare(b)
    )
  for (const file of pluralFiles)
    plural.__addLocaleData(
      runInNewContext(
        '(' +
          readFileSync(
            resolve(
              'packages/intl-pluralrules/cldr-raw/' +
                file.replace('.json', '.js')
            ),
            'utf8'
          ) +
          ')'
      )
    )
  const numberDirectory = resolve('crates/intl_numberformat/locale-data')
  const numberFiles = readdirSync(numberDirectory)
    .filter(file => file.endsWith('.json'))
    .sort(
      (a, b) =>
        Number(b === 'en.json') - Number(a === 'en.json') || a.localeCompare(b)
    )
  for (const file of numberFiles)
    number.__addLocaleData(
      JSON.parse(readFileSync(join(numberDirectory, file), 'utf8'))
    )
  for (const file of files)
    Reference.__addLocaleData(
      JSON.parse(readFileSync(join(directory, file), 'utf8'))
    )
})
interface Options extends Intl.RelativeTimeFormatOptions {
  numberingSystem?: string
}
interface Case {
  locales: string[]
  options: Options
  values: number[]
  units: string[]
}
interface Sample {
  text?: string
  parts?: unknown[]
  error?: string
}
interface Result {
  options: unknown
  values: Sample[]
  error?: string
}
function wire(value: number): string {
  return Object.is(value, -0) ? '-0' : String(value)
}
function compare(cases: Case[]) {
  const result = spawnSync(
    resolve('crates/intl_relativetimeformat/conformance'),
    [directory],
    {
      input:
        cases
          .map(value =>
            JSON.stringify({...value, values: value.values.map(wire)})
          )
          .join('\n') + '\n',
      encoding: 'utf8',
      maxBuffer: 128 * 1024 * 1024,
    }
  )
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  const output: Result[] = result.stdout
    .trim()
    .split('\n')
    .map(line => JSON.parse(line))
  expect(output.length).toBe(cases.length)
  for (let index = 0; index < cases.length; index++) {
    const entry = cases[index],
      actual = output[index]
    const description = JSON.stringify({
      locales: entry.locales,
      options: entry.options,
    })
    expect(actual.error, description).toBeUndefined()
    const reference = new Reference(entry.locales, entry.options)
    expect(actual.options, description).toEqual(reference.resolvedOptions())
    let position = 0
    for (const value of entry.values)
      for (const unit of entry.units) {
        let expected: Sample
        try {
          expected = {
            text: reference.format(value, unit as Intl.RelativeTimeFormatUnit),
            parts: reference.formatToParts(
              value,
              unit as Intl.RelativeTimeFormatUnit
            ),
          }
        } catch (error) {
          expected = {error: (error as Error).name}
        }
        expect(
          actual.values[position++],
          description + ' ' + wire(value) + ' ' + unit
        ).toEqual(expected)
      }
  }
}
const units = [
  'second',
  'minute',
  'hour',
  'day',
  'week',
  'month',
  'quarter',
  'year',
]
const values = [
  0,
  -0,
  1,
  -1,
  2,
  -2,
  3,
  -3,
  1.25,
  -1.25,
  1234.5678,
  1e-7,
  1e21,
  NaN,
  Infinity,
  -Infinity,
]
it('compares every unit/style/numeric mode across locale families', () => {
  const cases: Case[] = []
  for (const locale of [
    'en',
    'fr',
    'ar',
    'pl',
    'ru',
    'cy',
    'sl',
    'lv',
    'ja',
    'zh',
    'bn',
    'hi',
    'sr-Latn',
    'gsw',
    'my',
    'ne',
  ])
    for (const style of ['long', 'short', 'narrow'] as const)
      for (const numeric of ['always', 'auto'] as const)
        cases.push({
          locales: [locale],
          options: {style, numeric},
          values,
          units: [...units, ...units.map(unit => unit + 's')],
        })
  compare(cases)
}, 180_000)
it.each([
  {name: 'calendar', units: ['day', 'week', 'month', 'year']},
  {name: 'clock and quarter', units: ['second', 'minute', 'hour', 'quarter']},
])(
  'compares every generated locale including sparse plural and named forms: $name',
  ({units}) => {
    const cases: Case[] = []
    for (const file of files) {
      const pack = JSON.parse(readFileSync(join(directory, file), 'utf8')) as {
        locale: string
      }
      for (const style of ['long', 'short', 'narrow'] as const)
        for (const numeric of ['always', 'auto'] as const)
          cases.push({
            locales: [pack.locale],
            options: {style, numeric},
            values: [-2, -1, -0, 0, 1, 2, 1.25, 1234.5678],
            units,
          })
    }
    compare(cases)
  },
  300_000
)
it('compares all digit systems and Unicode extension resolution', () => {
  const systems = (
    JSON.parse(readFileSync(join(directory, 'en.json'), 'utf8')) as {
      data: {nu: string[]}
    }
  ).data.nu
  const cases: Case[] = systems.map(numberingSystem => ({
    locales: ['en'],
    options: {numberingSystem},
    values: [0, -0, 1.25, -2.5, 1234.5678],
    units,
  }))
  for (const locale of [
    'en-u-nu-arab',
    'en-u-nu-thai',
    'en-u-nu-foobar',
    'fr-u-ca-buddhist-nu-arab',
    'sr-Latn-u-nu-latn',
  ])
    for (const numberingSystem of [undefined, 'arab', 'latn', 'LATN', 'foobar'])
      for (const localeMatcher of ['lookup', 'best fit'] as const)
        cases.push({
          locales: [locale],
          options: {numberingSystem, localeMatcher},
          values: [0, -0, -1, 1.25, 12345],
          units: ['day', 'year'],
        })
  for (const localeMatcher of ['lookup', 'best fit'] as const)
    cases.push({
      locales: ['en-u-nu-arab', 'en-u-nu-thai'],
      options: {localeMatcher},
      values: [-0, 1.25],
      units,
    })
  compare(cases)
}, 180_000)
it('keeps Number conversion, plural rounding and large magnitudes in sync', () => {
  const cases: Case[] = []
  for (const locale of ['en', 'ar', 'pl', 'ru', 'lv', 'sl'])
    for (const numeric of ['always', 'auto'] as const)
      cases.push({
        locales: [locale],
        options: {numeric},
        values: [
          0.00049, 0.0005, -0.0005, 1.0004, 1.0005, 2.0005, 1000000000000000100,
          1e100, 1e300, 1e-300,
        ],
        units,
      })
  compare(cases)
}, 180_000)

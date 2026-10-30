import '@formatjs/intl-getcanonicallocales/polyfill-force.js'
import {PluralRules} from '@formatjs/intl-pluralrules'
import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {runInNewContext} from 'node:vm'
import {isDeepStrictEqual} from 'node:util'
import {expect, it} from 'vitest'

const resolve = (path: string) =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
const locales = [
  'en',
  'ar',
  'fr',
  'ru',
  'sl',
  'lv',
  'cy',
  'pt',
  'pt-PT',
  'ja',
  'cs',
  'it',
  'es',
]
const values = [
  '0',
  '-0',
  '1',
  '-1',
  '1.00',
  '1.005',
  '2.5',
  '-2.5',
  '0.0000123',
  '0.09995',
  '9.995',
  '99.95',
  '999',
  '999.95',
  '1000',
  '999999',
  '1000000',
  '2000000',
  '9007199254740993',
  'NaN',
  'Infinity',
  '-Infinity',
  '000000000000000000001',
]
const ranges = [
  ['-1', '1'],
  ['1.0001', '1.0002'],
  ['1', '2'],
  ['0', '1'],
  ['2', '5'],
  ['Infinity', '1'],
  ['Infinity', 'Infinity'],
  ['-Infinity', 'Infinity'],
]
const digitKeys = [
  'minimumIntegerDigits',
  'minimumFractionDigits',
  'maximumFractionDigits',
  'minimumSignificantDigits',
  'maximumSignificantDigits',
  'roundingIncrement',
  'roundingMode',
  'roundingPriority',
  'trailingZeroDisplay',
]
const configurations: any[] = [
  {},
  {minimumFractionDigits: 2},
  {maximumFractionDigits: 0},
  {maximumFractionDigits: 2},
  {minimumIntegerDigits: 21},
  {minimumSignificantDigits: 2, maximumSignificantDigits: 3},
  {maximumSignificantDigits: 1},
  {minimumSignificantDigits: 3},
  {
    maximumSignificantDigits: 2,
    maximumFractionDigits: 0,
    roundingPriority: 'morePrecision',
  },
  {
    maximumSignificantDigits: 2,
    maximumFractionDigits: 0,
    roundingPriority: 'lessPrecision',
  },
  {trailingZeroDisplay: 'stripIfInteger', minimumFractionDigits: 2},
]
for (const roundingMode of [
  'ceil',
  'floor',
  'expand',
  'trunc',
  'halfCeil',
  'halfFloor',
  'halfExpand',
  'halfTrunc',
  'halfEven',
])
  configurations.push(
    {roundingMode, maximumFractionDigits: 0},
    {roundingMode, maximumFractionDigits: 2}
  )
for (const roundingIncrement of [
  1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000,
])
  configurations.push(
    {roundingIncrement, minimumFractionDigits: 2, maximumFractionDigits: 2},
    {
      roundingIncrement,
      roundingMode: 'halfEven',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }
  )
for (const notation of ['standard', 'scientific', 'engineering', 'compact'])
  for (const compactDisplay of ['short', 'long'])
    configurations.push({notation, compactDisplay})
configurations.push(
  {roundingIncrement: 3},
  {minimumFractionDigits: 5, maximumFractionDigits: 2},
  {maximumSignificantDigits: 22},
  {roundingIncrement: 5, maximumSignificantDigits: 2}
)

it('matches Intl.PluralRules digit resolution, rounded selection and ranges against TypeScript', () => {
  const packs = locales.map(locale => {
    const pack = readFileSync(
      resolve(`crates/intl_pluralrules/locale-data/${locale}.json`),
      'utf8'
    )
    const raw = runInNewContext(
      '(' +
        readFileSync(
          resolve(`packages/intl-pluralrules/cldr-raw/${locale}.js`),
          'utf8'
        ) +
        ')'
    )
    PluralRules.__addLocaleData(raw)
    return {locale, pack}
  })
  const cases = [false, true].flatMap(ordinal =>
    values.map(decimal => ({decimal, ordinal, exponent: 0}))
  )
  const rangeCases = [false, true].flatMap(ordinal =>
    ranges.map(([start, end]) => ({start, end, ordinal}))
  )
  const records = packs.flatMap(({locale, pack}) =>
    configurations.map(options => {
      const {
        notation = 'standard',
        compactDisplay = 'short',
        ...digits
      } = options
      const request = {
        pack,
        cases,
        ranges: rangeCases,
        digits,
        notation,
        compactDisplay,
      }
      try {
        const rules = [
          new PluralRules(locale, {...options, type: 'cardinal'}),
          new PluralRules(locale, {...options, type: 'ordinal'}),
        ]
        const resolved = rules[0].resolvedOptions() as any
        const expected = {
          resolved: rules.map(rule => rule.resolvedOptions()),
          digits: Object.fromEntries(
            digitKeys
              .filter(key => key in resolved)
              .map(key => [key, resolved[key]])
          ),
          values: cases.map(input =>
            rules[input.ordinal ? 1 : 0].select(input.decimal as any)
          ),
          ranges: rangeCases.map(input =>
            rules[input.ordinal ? 1 : 0].selectRange(
              input.start as any,
              input.end as any
            )
          ),
        }
        return {locale, options, request, expected}
      } catch (error) {
        return {
          locale,
          options,
          request,
          expected: {error: (error as Error).name},
        }
      }
    })
  )
  const result = spawnSync(resolve('crates/intl_pluralrules/conformance'), [], {
    input:
      records.map(record => JSON.stringify(record.request)).join('\n') + '\n',
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  const results = result.stdout
    .trim()
    .split('\n')
    .map(line => JSON.parse(line))
  expect(results.length).toBe(records.length)
  const mismatches = records.flatMap<unknown>((record, index) => {
    const actual = results[index],
      expected = record.expected as any
    if ('error' in expected)
      return actual.error === expected.error
        ? []
        : [{locale: record.locale, options: record.options, actual, expected}]
    const fields = []
    if (!isDeepStrictEqual(actual.resolved, expected.resolved))
      fields.push({
        key: 'resolved',
        actual: actual.resolved,
        expected: expected.resolved,
      })
    if (!isDeepStrictEqual(actual.digits, expected.digits))
      fields.push({
        key: 'digits',
        actual: actual.digits,
        expected: expected.digits,
      })
    for (const key of ['values', 'ranges'])
      for (let sample = 0; sample < expected[key].length; sample++)
        if (actual[key][sample] !== expected[key][sample])
          fields.push({
            key,
            input: key === 'values' ? cases[sample] : rangeCases[sample],
            actual: actual[key][sample],
            expected: expected[key][sample],
          })
    return fields.length
      ? [
          {
            locale: record.locale,
            options: record.options,
            fields: fields.slice(0, 8),
          },
        ]
      : []
  })
  expect(records.length).toBeGreaterThan(800)
  if (mismatches.length)
    console.error(
      JSON.stringify({
        count: mismatches.length,
        examples: mismatches.slice(0, 25),
      })
    )
  expect(mismatches.length).toBe(0)
}, 180_000)

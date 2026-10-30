import '@formatjs/intl-getcanonicallocales/polyfill-force.js'
import '@formatjs/intl-pluralrules/polyfill-force.js'
import type {PluralRules} from '@formatjs/intl-pluralrules'
import {NumberFormat} from '@formatjs/intl-numberformat'
import type {NumberFormatOptions} from '#packages/ecma402-abstract/types/number.js'
import {ToIntlMathematicalValue} from '#packages/ecma402-abstract/ToIntlMathematicalValue.js'
import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync, readdirSync} from 'node:fs'
import {join} from 'node:path'
import {runInNewContext} from 'node:vm'
import {beforeAll, expect, it} from 'vitest'

const resolve = (path: string) =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
const directory = resolve('crates/intl_numberformat/locale-data')
const referencePluralRules = Intl.PluralRules as unknown as typeof PluralRules
const files = readdirSync(directory)
  .filter(file => file.endsWith('.json'))
  .sort(
    (a, b) =>
      Number(b === 'en.json') - Number(a === 'en.json') || a.localeCompare(b)
  )
beforeAll(() => {
  const plurals = resolve('crates/intl_pluralrules/locale-data')
  const pluralFiles = readdirSync(plurals)
    .filter(file => file.endsWith('.json'))
    .sort(
      (a, b) =>
        Number(b === 'en.json') - Number(a === 'en.json') || a.localeCompare(b)
    )
  for (const file of pluralFiles) {
    const raw = runInNewContext(
      '(' +
        readFileSync(
          resolve(
            'packages/intl-pluralrules/cldr-raw/' + file.replace('.json', '.js')
          ),
          'utf8'
        ) +
        ')'
    )
    referencePluralRules.__addLocaleData(raw)
  }
  for (const file of files)
    NumberFormat.__addLocaleData(
      JSON.parse(readFileSync(join(directory, file), 'utf8'))
    )
})
type Input = number | string | bigint
interface Case {
  locales: string[]
  options: NumberFormatOptions
  values: readonly Input[]
  ranges?: readonly (readonly [Input, Input])[]
}
interface Result {
  options: unknown
  values: unknown[]
  ranges: unknown[]
  error?: string
}
function wire(input: Input): string {
  const value = ToIntlMathematicalValue(input)
  return value.isZero() && value.isNegative() ? '-0' : value.toString()
}
function compare(cases: Case[]) {
  const result = spawnSync(
    resolve('crates/intl_numberformat/conformance'),
    [directory],
    {
      input:
        cases
          .map(value =>
            JSON.stringify({
              ...value,
              values: value.values.map(wire),
              ranges: value.ranges?.map(([a, b]) => [wire(a), wire(b)]),
            })
          )
          .join('\n') + '\n',
      encoding: 'utf8',
      maxBuffer: 128 * 1024 * 1024,
    }
  )
  if (result.error) throw new Error(String(result.error) + '\n' + result.stderr)
  expect(result.status, result.stderr).toBe(0)
  const output: Result[] = result.stdout
    .trim()
    .split('\n')
    .map(line => JSON.parse(line))
  expect(output.length).toBe(cases.length)
  for (let index = 0; index < cases.length; index++) {
    const value = cases[index],
      actual = output[index]
    const description = JSON.stringify({
      locales: value.locales,
      options: value.options,
    })
    expect(actual.error, description).toBeUndefined()
    const reference = new NumberFormat(value.locales, value.options)
    expect(actual.options, description).toEqual(reference.resolvedOptions())
    for (let sample = 0; sample < value.values.length; sample++) {
      const input = value.values[sample]
      expect(actual.values[sample], description + ' ' + String(input)).toEqual({
        text: reference.format(input),
        parts: reference.formatToParts(input),
      })
    }
    for (let sample = 0; sample < (value.ranges?.length || 0); sample++) {
      const [start, end] = value.ranges![sample]
      expect(
        actual.ranges[sample],
        description + ' range ' + String(start) + ' ' + String(end)
      ).toEqual({
        text: reference.formatRange(start, end),
        parts: reference.formatRangeToParts(start, end),
      })
    }
  }
}
const values = [
  0,
  -0,
  1,
  2,
  -1.25,
  1.23456,
  999.9995,
  12345.678,
  999999.5,
  1e-7,
  NaN,
  Infinity,
  -Infinity,
  '9007199254740993.125',
  9007199254740993n,
] as const

it('matches compact currency fallback across numbering systems', () => {
  compare(
    ['ar-SS', 'ar-SA', 'ckb'].flatMap(locale =>
      ['arab', 'arabext', 'latn'].flatMap(numberingSystem =>
        (['short', 'long'] as const).map(compactDisplay => ({
          locales: [locale],
          options: {
            style: 'currency' as const,
            currency: 'USD',
            notation: 'compact' as const,
            compactDisplay,
            numberingSystem,
          },
          values: [999, 1234, -5_600_000],
          ranges: [[1234, 5_600_000] as const],
        }))
      )
    )
  )
})

it('compares number styles and notations with TS across locale families', () => {
  const options: NumberFormatOptions[] = [
    {},
    {style: 'percent'},
    {style: 'currency', currency: 'USD'},
    {style: 'currency', currency: 'JPY'},
    {
      style: 'currency',
      currency: 'CHF',
      currencyDisplay: 'code',
      currencySign: 'accounting',
    },
    {style: 'currency', currency: 'USD', currencyDisplay: 'name'},
    {style: 'unit', unit: 'meter', unitDisplay: 'long'},
    {style: 'unit', unit: 'kilometer-per-hour'},
    {notation: 'compact'},
    {notation: 'compact', compactDisplay: 'long'},
    {notation: 'scientific'},
    {notation: 'engineering'},
  ]
  compare(
    [
      'en',
      'fr',
      'de',
      'pl',
      'hi',
      'ar',
      'ja',
      'zh',
      'ko',
      'ru',
      'bn',
      'sw',
      'lv',
      'sr-Latn',
    ].flatMap(locale =>
      options.map(options => ({
        locales: [locale],
        options,
        values,
        ranges: [
          [1, 2],
          [2.999, 3],
          [1234, 5678],
        ],
      }))
    )
  )
}, 120_000)

it('compares every generated locale for decimal, currency, percent, unit and compact styles', () => {
  const options: NumberFormatOptions[] = [
    {},
    {style: 'currency', currency: 'USD'},
    {style: 'currency', currency: 'USD', currencyDisplay: 'name'},
    {style: 'percent'},
    {style: 'unit', unit: 'day', unitDisplay: 'long'},
    {notation: 'compact'},
  ]
  compare(
    files.flatMap(file => {
      const locale = (
        JSON.parse(readFileSync(join(directory, file), 'utf8')) as {
          locale: string
        }
      ).locale
      return options.map(options => ({
        locales: [locale],
        options,
        values: [0, 1, 2, 1.25, -1.25, 12345.678, 1e6, NaN, Infinity],
      }))
    })
  )
}, 300_000)

it('compares every advertised numbering system and requested extension resolution', () => {
  const raw = JSON.parse(readFileSync(join(directory, 'en.json'), 'utf8')) as {
    data: {nu: string[]}
  }
  const cases: Case[] = raw.data.nu.flatMap(system => [
    {
      locales: ['en-u-nu-' + system],
      options: {},
      values: [12345.678, -0, Infinity],
      ranges: [[1, 2]],
    },
    {
      locales: ['en'],
      options: {numberingSystem: system, notation: 'scientific'},
      values: [0.00012345, 12345678],
    },
  ])
  for (const locales of [
    ['zz-ZZ', 'en-u-nu-arab'],
    ['en-u-nu-arab', 'en-u-nu-deva'],
    ['fr-FR-u-nu-arab'],
    ['en-u-nu-latn'],
  ])
    for (const numberingSystem of [
      undefined,
      'latn',
      'arab',
      'foobar',
      'foobar-baz',
      'LATN',
    ])
      for (const localeMatcher of ['lookup', 'best fit'] as const)
        cases.push({
          locales,
          options: {numberingSystem, localeMatcher},
          values: [12345.67],
        })
  compare(cases)
}, 120_000)

it('compares units and compound units across plural families', () => {
  const units = [
    'acre',
    'bit',
    'celsius',
    'day',
    'degree',
    'fluid-ounce',
    'meter',
    'microsecond',
    'nanosecond',
    'mile-scandinavian',
    'meter-per-second',
    'mile-per-hour',
    'liter-per-kilometer',
    'byte-per-second',
  ]
  compare(
    ['en', 'fr', 'ar', 'ru', 'pl', 'ja', 'zh', 'hi', 'lv', 'he'].flatMap(
      locale =>
        units.flatMap(unit =>
          (['long', 'short', 'narrow'] as const).map(unitDisplay => ({
            locales: [locale],
            options: {style: 'unit', unit, unitDisplay},
            values: [0, 1, 2, 3, 11, 1.5, -2.5],
            ranges: [
              [1, 2],
              [2, 3],
            ],
          }))
        )
    )
  )
}, 120_000)

it('compares currency digits, precision defaults and range affixes', () => {
  const cases: Case[] = []
  for (const locale of ['en', 'de', 'fr', 'ar', 'zh', 'hi'])
    for (const currency of ['USD', 'JPY', 'BHD', 'CLF', 'CHF', 'XXX', 'ZZZ'])
      for (const currencyDisplay of [
        'symbol',
        'narrowSymbol',
        'code',
        'name',
      ] as const)
        for (const currencySign of ['standard', 'accounting'] as const)
          cases.push({
            locales: [locale],
            options: {
              style: 'currency',
              currency,
              currencyDisplay,
              currencySign,
            },
            values: [0, -0, 1, -1.2345, 12345.6789],
            ranges: [
              [1, 2],
              [-2, -1],
              [-1, 1],
              [1.234, 1.235],
            ],
          })
  for (const options of [
    {style: 'currency', currency: 'USD', maximumFractionDigits: 0},
    {style: 'currency', currency: 'BHD', maximumFractionDigits: 1},
    {style: 'currency', currency: 'JPY', minimumFractionDigits: 2},
    {style: 'currency', currency: 'USD', roundingIncrement: 5},
    {style: 'percent', roundingIncrement: 5},
    {minimumFractionDigits: 3, trailingZeroDisplay: 'stripIfInteger'},
  ] satisfies NumberFormatOptions[])
    cases.push({locales: ['en'], options, values: [...values, 1.025, -1.025]})
  compare(cases)
}, 120_000)

it('preserves large integers, long fractions and notation carries', () => {
  const cases: Case[] = []
  for (const options of [
    {useGrouping: false},
    {maximumSignificantDigits: 3},
    {notation: 'scientific'},
    {notation: 'engineering'},
    {
      notation: 'scientific',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      roundingIncrement: 5,
    },
    {
      notation: 'engineering',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      roundingIncrement: 5,
    },
    {notation: 'compact'},
    {maximumFractionDigits: 100},
  ] satisfies NumberFormatOptions[])
    cases.push({
      locales: ['en'],
      options,
      values: [
        BigInt('1234567890'.repeat(100)),
        BigInt('9'.repeat(400)),
        '1.' + '0'.repeat(99) + '5',
        '999.99999999999999999999999',
        -999.9995,
        1e-300,
        1e300,
      ],
    })
  compare(cases)
}, 120_000)
it('compares rounding, precision, sign and grouping options with TS', () => {
  const cases: Case[] = []
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
  ] as const)
    for (const signDisplay of [
      'auto',
      'always',
      'never',
      'exceptZero',
      'negative',
    ] as const)
      for (const options of [
        {maximumFractionDigits: 2},
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          roundingIncrement: 5 as const,
        },
        {maximumSignificantDigits: 3},
        {
          roundingPriority: 'morePrecision' as const,
          maximumFractionDigits: 1,
          maximumSignificantDigits: 3,
        },
      ])
        cases.push({
          locales: ['en'],
          options: {...options, roundingMode, signDisplay},
          values: [...values, 1.025, -1.025, 0.001, -0.001],
        })
  for (const locale of ['en', 'hi', 'pl', 'es'])
    for (const useGrouping of [
      false,
      true,
      'auto',
      'always',
      'min2',
      'true',
      'false',
    ] as const)
      cases.push({
        locales: [locale],
        options: {
          useGrouping: useGrouping as NumberFormatOptions['useGrouping'],
          minimumIntegerDigits: 4,
        },
        values: [1, 1234, 12345, 1234567.89],
      })
  compare(cases)
}, 120_000)

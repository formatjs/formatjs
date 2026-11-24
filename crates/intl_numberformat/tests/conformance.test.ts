import '@formatjs/intl-getcanonicallocales/polyfill-force.js'
import {NumberFormat} from '@formatjs/intl-numberformat'
import type {NumberFormatOptions} from '#packages/ecma402-abstract/types/number.js'
import {ToIntlMathematicalValue} from '#packages/ecma402-abstract/ToIntlMathematicalValue.js'
import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {beforeAll, expect, it} from 'vitest'

const resolve = (path: string) =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
const directory = resolve('crates/intl_numberformat/locale-data')
const files = readdirSync(directory)
  .filter(file => file.endsWith('.json'))
  .sort(
    (a, b) =>
      Number(b === 'en.json') - Number(a === 'en.json') || a.localeCompare(b)
  )
beforeAll(() => {
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
function wire(input: Input) {
  const value = ToIntlMathematicalValue(input)
  return {
    ...value,
    value:
      value.value.isZero() && value.value.isNegative()
        ? '-0'
        : value.value.toString(),
  }
}
function compare(cases: Case[], localeDirectory = directory) {
  const result = spawnSync(
    resolve('crates/intl_numberformat/conformance'),
    [localeDirectory],
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

it('uses exact rounded operands for Russian unit, currency and compact plurals', () => {
  const values = [9007199254741021n, '9007199254741021', '9007199254741022']
  const cases: Case[] = [
    {
      locales: ['ru'],
      options: {style: 'unit', unit: 'meter', unitDisplay: 'long'},
      values,
    },
    {
      locales: ['ru'],
      options: {
        style: 'currency',
        currency: 'RUB',
        currencyDisplay: 'name',
        maximumFractionDigits: 0,
      },
      values,
    },
  ]
  compare(cases)
  for (const {options} of cases) {
    const formatter = new NumberFormat('ru', options)
    expect(
      values.map(
        value =>
          formatter
            .formatToParts(value)
            .find(part => part.type === options.style)?.value
      )
    ).toEqual(
      options.style === 'unit'
        ? ['метр', 'метр', 'метра']
        : ['российский рубль', 'российский рубль', 'российских рубля']
    )
  }
  const compact: Case = {
    locales: ['ru'],
    options: {
      notation: 'compact',
      compactDisplay: 'long',
      maximumFractionDigits: 0,
    },
    values: [9007199254741021000000000000n, '9007199254741022000000000000'],
  }
  compare([compact])
  const formatter = new NumberFormat('ru', compact.options)
  expect(
    compact.values.map(
      value =>
        formatter.formatToParts(value).find(part => part.type === 'compact')
          ?.value
    )
  ).toEqual(['триллион', 'триллиона'])
})

it('uses fallback patterns for sanctioned units missing from locale data', () => {
  const original = JSON.parse(readFileSync(join(directory, 'en.json'), 'utf8'))
  const sparse = structuredClone(original)
  delete sparse.data.units.simple.meter
  const path = mkdtempSync(join(process.env.TEST_TMPDIR || tmpdir(), 'units-'))
  try {
    const cases: Case[] = ['meter', 'meter-per-acre'].map(unit => ({
      locales: ['en'],
      options: {style: 'unit', unit, unitDisplay: 'long'},
      values: [-2],
      ranges: [[1, 2]],
    }))
    writeFileSync(join(path, 'en.json'), JSON.stringify(sparse))
    NumberFormat.__addLocaleData(sparse)
    compare(cases, path)
    for (const {options} of cases) {
      const formatter = new NumberFormat('en', options)
      expect(formatter.formatToParts(-2)).toEqual([
        {type: 'minusSign', value: '-'},
        {type: 'integer', value: '2'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: options.unit},
      ])
    }

    const fallback = {other: '[{0}] units'}
    sparse.data.units.simple.fallback = {
      long: fallback,
      short: fallback,
      narrow: fallback,
      perUnit: {},
    }
    writeFileSync(join(path, 'en.json'), JSON.stringify(sparse))
    NumberFormat.__addLocaleData(sparse)
    compare(cases, path)
    expect(new NumberFormat('en', cases[0].options).format(-2)).toBe(
      '[-2] units'
    )
  } finally {
    NumberFormat.__addLocaleData(original)
    rmSync(path, {recursive: true, force: true})
  }
})

it('selects Russian compact labels from the displayed mantissa', () => {
  const compact = {notation: 'compact', compactDisplay: 'long'} as const
  const cases = [
    [compact, '1000', '1,0 тысячи'],
    [{...compact, trailingZeroDisplay: 'stripToMinimum'}, '1000', '1 тысяча'],
    [
      {
        ...compact,
        minimumFractionDigits: 1,
        trailingZeroDisplay: 'stripIfInteger',
      },
      1000,
      '1 тысяча',
    ],
  ] as const
  compare(
    cases.map(([options, value]) => ({
      locales: ['ru'],
      options,
      values: [value],
    }))
  )
  for (const [options, value, expected] of cases) {
    expect(new NumberFormat('ru', options).format(value)).toBe(expected)
  }
})

it('selects scientific and engineering labels after shifting the mantissa', () => {
  const unit = {style: 'unit', unit: 'meter', unitDisplay: 'long'} as const
  const currency = {
    style: 'currency',
    currency: 'RUB',
    currencyDisplay: 'name',
  } as const
  const cases = (['scientific', 'engineering'] as const).flatMap(notation => [
    {
      options: {...unit, notation, minimumFractionDigits: 2},
      values: [1, 1000, 1200],
      expected: ['1,00E0 метра', '1,00E3 метров', '1,20E3 метров'],
    },
    {
      options: {...currency, notation, maximumFractionDigits: 0},
      values: [0.001, 1, 1000],
      expected: [
        '1E-3 российского рубля',
        '1E0 российский рубль',
        '1E3 российских рублей',
      ],
    },
  ])
  compare(
    cases.map(({options, values}) => ({locales: ['ru'], options, values}))
  )
  for (const {options, values, expected} of cases) {
    const formatter = new NumberFormat('ru', options)
    expect(values.map(value => formatter.format(value))).toEqual(expected)
  }
})

it('selects long unit and currency names from visible trailing zeros', () => {
  const unit = {style: 'unit', unit: 'meter', unitDisplay: 'long'} as const
  const currency = {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'name',
    minimumFractionDigits: 0,
  } as const
  const cases = [
    [unit, '1.0', '1.0 meters'],
    [{...unit, unit: 'meter-per-second'}, '1.0', '1.0 meters per second'],
    [
      {...unit, unit: 'meter-per-acre', minimumFractionDigits: 2},
      2,
      '2.00 meters per acre',
    ],
    [{...unit, trailingZeroDisplay: 'stripToMinimum'}, '1.0', '1 meter'],
    [{...unit, minimumFractionDigits: 2}, 1, '1.00 meters'],
    [
      {
        ...unit,
        minimumFractionDigits: 2,
        trailingZeroDisplay: 'stripIfInteger',
      },
      1,
      '1 meter',
    ],
    [currency, '1.0', '1.0 US dollars'],
    [
      {...currency, trailingZeroDisplay: 'stripIfInteger'},
      '1.0',
      '1 US dollar',
    ],
  ] as const
  compare(
    cases.map(([options, value]) => ({
      locales: ['en'],
      options,
      values: [value],
    }))
  )
  for (const [options, value, expected] of cases) {
    expect(new NumberFormat('en', options).format(value)).toBe(expected)
  }
})

it('uses visible fractions in Arabic, Czech and Polish unit plurals', () => {
  const value = '9007199254740993.125'
  const options = {style: 'unit', unit: 'meter', unitDisplay: 'long'} as const
  const cases = [
    ['ar', 'متر'],
    ['cs', 'metru'],
    ['pl', 'metra'],
  ] as const
  compare(
    cases.map(([locale]) => ({locales: [locale], options, values: [value]}))
  )
  // LDML plural ranges contain integers. Arabic n % 100 = 11..99 therefore
  // cannot match 93.125, even though ICU 79 picks the “many” unit form here.
  // https://unicode.org/reports/tr35/tr35-numbers.html#Plural_rules_syntax
  for (const [locale, unit] of cases) {
    const parts = new NumberFormat(locale, options).formatToParts(value)
    expect(parts.find(part => part.type === 'unit')?.value, locale).toBe(unit)
  }
})

it('compares number styles and notations with TS across locale families', () => {
  const options: NumberFormatOptions[] = [
    {},
    {style: 'percent'},
    {style: 'percent', notation: 'compact'},
    {
      style: 'percent',
      notation: 'compact',
      compactDisplay: 'long',
      signDisplay: 'always',
    },
    {
      style: 'currency',
      currency: 'USD',
      currencySign: 'accounting',
      notation: 'compact',
      compactDisplay: 'long',
    },
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
    {style: 'percent', notation: 'compact'},
    {style: 'currency', currency: 'USD', notation: 'compact'},
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

it('adds an approximation sign without changing the rendered endpoint', () => {
  const cases = [
    {
      locales: ['ar'],
      options: {style: 'unit', unit: 'meter', unitDisplay: 'long'},
      values: [],
      ranges: [[1, 1]],
      sign: '~',
    },
    {
      locales: ['de-CH'],
      options: {style: 'currency', currency: 'CHF', currencyDisplay: 'code'},
      values: [],
      ranges: [['1.0001', '1.0002']],
      sign: '≈',
    },
    {
      locales: ['de-CH'],
      options: {
        style: 'currency',
        currency: 'USD',
        currencySign: 'accounting',
        notation: 'compact',
        compactDisplay: 'long',
      },
      values: [],
      ranges: [[999.5, 1000.5]],
      sign: '≈',
    },
  ] satisfies (Case & {sign: string})[]
  compare(cases)
  // ECMA-402 §16.5.19 step 2 inserts one part into the endpoint's List.
  // https://tc39.es/ecma402/#sec-formatapproximately
  for (const {
    locales,
    options,
    ranges: [[start, end]],
    sign,
  } of cases) {
    const formatter = new NumberFormat(locales, options)
    expect(formatter.format(start)).toBe(formatter.format(end))
    const parts = formatter.formatRangeToParts(start, end)
    expect(parts.filter(part => part.type === 'approximatelySign')).toEqual([
      {type: 'approximatelySign', value: sign, source: 'shared'},
    ])
    expect(parts.filter(part => part.type !== 'approximatelySign')).toEqual(
      formatter.formatToParts(start).map(part => ({...part, source: 'shared'}))
    )
  }
})

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
it('agrees on exact decimals below scientific notation thresholds', () => {
  compare([
    {
      locales: ['en'],
      options: {
        notation: 'scientific',
        maximumFractionDigits: 2,
        roundingMode: 'trunc',
      },
      values: ['9999999999999999999999999', '0.0999999999999999999'],
    },
  ])
})
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

it('keeps original source precision across styles, notations, strip modes and ranges', () => {
  const inputs = [
    1,
    1n,
    '1.00',
    '001.00',
    '1.20e1',
    '1.20e-1',
    '0.00e1',
    '-0.00',
    '1e-9999',
    '-1e-9999',
    '0e-99999999999999999999',
    '1.000e9999',
    '1000',
    '1.200e3',
  ] as const
  compare(
    ['en', 'fr', 'ar'].flatMap(locale =>
      [
        {},
        {style: 'percent', maximumFractionDigits: 3},
        {notation: 'scientific'},
        {notation: 'engineering'},
        {notation: 'compact'},
        {minimumSignificantDigits: 4, maximumSignificantDigits: 5},
        {trailingZeroDisplay: 'stripIfInteger'},
        {trailingZeroDisplay: 'stripToMinimum'},
        {minimumFractionDigits: 2, trailingZeroDisplay: 'stripToMinimum'},
        {
          maximumFractionDigits: 2,
          maximumSignificantDigits: 5,
          roundingPriority: 'morePrecision',
        },
        {
          maximumFractionDigits: 2,
          maximumSignificantDigits: 5,
          roundingPriority: 'lessPrecision',
        },
      ].map(options => ({
        locales: [locale],
        options: options as NumberFormatOptions,
        values: inputs,
        ranges: [
          ['1', '1.00'],
          ['1.0', '1.00'],
          ['1.00', '1.00'],
          ['0.00', '-0.00'],
        ] as const,
      }))
    )
  )
})

it('public source precision matches independent ICU formatting fixtures', () => {
  const rows = readFileSync(
    resolve('conformance-tests/precision/public-fixtures.tsv'),
    'utf8'
  )
    .trimEnd()
    .split('\n')
    .slice(1)
  expect(rows).toHaveLength(17)
  const cases: Case[] = rows.map(row => {
    const [input, , , options, , expected] = row.split('\t')
    const parsed = JSON.parse(options)
    expect(new NumberFormat('en', parsed).format(input), row).toBe(expected)
    return {locales: ['en'], options: parsed, values: [input]}
  })
  compare(cases)
})

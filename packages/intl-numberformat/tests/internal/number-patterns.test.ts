import {expect, it} from 'vitest'
import {NumberFormat} from '#packages/intl-numberformat/index.js'
import {
  compileNumberPatterns,
  getNumberPattern,
} from '#packages/ecma402-abstract/NumberFormat/number-patterns.js'
import type {
  NumberFormatOptions,
  RawNumberLocaleData,
  RawNumberData,
} from '#packages/ecma402-abstract/types/number.js'
import en from '#packages/intl-numberformat/tests/locale-data/en.json' with {type: 'json'}

NumberFormat.__addLocaleData(en as unknown as RawNumberLocaleData)

it('keeps compiled and legacy text, parts, and approximate ranges identical', () => {
  const original = NumberFormat.localeData.en!
  const data = JSON.parse(JSON.stringify(original)) as typeof original
  const profiles: NumberFormatOptions[] = [
    {},
    {style: 'percent'},
    {style: 'percent', notation: 'compact'},
    {style: 'currency', currency: 'CHF', currencyDisplay: 'code'},
    {style: 'currency', currency: 'USD', currencySign: 'accounting'},
    {style: 'unit', unit: 'meter', unitDisplay: 'long'},
    {notation: 'scientific'},
    {notation: 'compact'},
    {style: 'currency', currency: 'USD', notation: 'compact'},
    {
      style: 'currency',
      currency: 'USD',
      currencySign: 'accounting',
      notation: 'compact',
      compactDisplay: 'long',
    },
  ]
  const collect = () =>
    profiles.flatMap(options =>
      (['auto', 'always', 'never'] as const).map(signDisplay => {
        const formatter = new NumberFormat('en', {
          ...options,
          signDisplay,
        })
        return {
          values: [0, -0, 1.025, -12345.5, Infinity, NaN, '1e21'].map(value => [
            formatter.format(value),
            formatter.formatToParts(value),
          ]),
          ranges: [
            [1.00001, 1.00002],
            [-1.00002, -1.00001],
            [-0, 0],
          ].map(([a, b]) => formatter.formatRangeToParts(a, b)),
        }
      })
    )
  try {
    data.numbers.patternPlans = compileNumberPatterns(data.numbers)
    NumberFormat.__addLocaleData({locale: 'en', data})
    const compiled = collect()
    delete data.numbers.patternPlans
    NumberFormat.__addLocaleData({locale: 'en', data})
    expect(collect()).toEqual(compiled)
  } finally {
    NumberFormat.__addLocaleData({locale: 'en', data: original})
  }
})

it('deduplicates numbering-system plans without mutating the locale payload', () => {
  const data = JSON.parse(
    JSON.stringify(NumberFormat.localeData.en!.numbers)
  ) as RawNumberData
  const before = JSON.stringify(data)
  const compiled = compileNumberPatterns(data)
  expect(JSON.stringify(data)).toBe(before)
  data.decimal.test = data.decimal.latn
  data.currency.test = data.currency.latn
  data.percent.test = data.percent.latn
  expect(compileNumberPatterns(data)).toEqual(compiled)
  expect(compiled.tokens.filter(([kind]) => kind === 'number')).toHaveLength(1)
})

it('uses legacy compilation for changed patterns missing from generated plans', () => {
  const original = NumberFormat.localeData.en!
  const data = JSON.parse(JSON.stringify(original)) as typeof original
  data.numbers.patternPlans = compileNumberPatterns(data.numbers)
  try {
    data.numbers.decimal.latn.standard = '#,##,##0.###'
    NumberFormat.__addLocaleData({locale: 'en', data})
    expect(new NumberFormat('en').format(1234567.5)).toBe('12,34,567.5')
    data.numbers.decimal.latn.standard = '0.###'
    NumberFormat.__addLocaleData({locale: 'en', data})
    expect(new NumberFormat('en', {useGrouping: false}).format(1234567.5)).toBe(
      '1234567.5'
    )
  } finally {
    NumberFormat.__addLocaleData({locale: 'en', data: original})
  }
})

it('represents literal-only compact templates without inventing a number slot', () => {
  const plan = getNumberPattern(
    NumberFormat.localeData.en!.numbers,
    'mille',
    true,
    0,
    false
  )
  expect(plan.parts).toEqual([['compact', 'mille']])
})

it('decodes legacy patterns on first use without public regexp or map methods', () => {
  const original = NumberFormat.localeData.en!
  const data = structuredClone(original)
  delete data.numbers.patternPlans
  const exec = RegExp.prototype.exec
  const map = Array.prototype.map
  const get = Map.prototype.get
  let result: string
  let parts: ReturnType<typeof getNumberPattern>['parts']
  try {
    NumberFormat.__addLocaleData({locale: 'en', data})
    const formatter = new NumberFormat('en')
    const unexpected = (): never => {
      throw new Error('Used a public pattern decoding operation')
    }
    RegExp.prototype.exec = unexpected
    Array.prototype.map = unexpected
    result = formatter.format(1234.5)
    Map.prototype.get = unexpected
    parts = getNumberPattern(data.numbers, '0K', true, 0, true).parts
  } finally {
    RegExp.prototype.exec = exec
    Array.prototype.map = map
    Map.prototype.get = get
    NumberFormat.__addLocaleData({locale: 'en', data: original})
  }
  expect(result!).toBe('1,234.5')
  expect(parts!).toEqual([
    ['approximatelySign', ''],
    ['number', ''],
    ['compact', 'K'],
  ])
})

it('keeps style around a numberless notation template', () => {
  const original = NumberFormat.localeData.en!
  const data = structuredClone(original)
  data.numbers.decimal.latn.short['1000'] = {other: 'mille'}
  try {
    NumberFormat.__addLocaleData({locale: 'en', data})
    expect(
      new NumberFormat('en', {style: 'percent', notation: 'compact'}).format(
        -10
      )
    ).toBe('-mille%')
  } finally {
    NumberFormat.__addLocaleData({locale: 'en', data: original})
  }
})
it('keeps the locale data resolved before reading style', () => {
  const localeData = NumberFormat.localeData.en!
  let formatter: InstanceType<typeof NumberFormat>
  try {
    formatter = new NumberFormat('en', {
      get style() {
        delete NumberFormat.localeData.en
        return 'decimal' as const
      },
    })
  } finally {
    NumberFormat.localeData.en = localeData
  }
  expect(formatter.format(1234)).toBe('1,234')
})

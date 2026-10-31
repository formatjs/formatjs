import {expect, it, vi} from 'vitest'
import {NumberFormat} from '#packages/intl-numberformat/index.js'
import * as exponentModule from '#packages/ecma402-abstract/NumberFormat/ComputeExponent.js'
import type {
  NumberFormatOptions,
  RawNumberLocaleData,
} from '#packages/ecma402-abstract/types/number.js'
import en from '#packages/intl-numberformat/tests/locale-data/en.json' with {type: 'json'}

NumberFormat.__addLocaleData(en as unknown as RawNumberLocaleData)

it('matches separate preview/final rounding across signs, rollover, and digit options', () => {
  const compute = exponentModule.ComputeExponent
  const spy = vi.spyOn(exponentModule, 'ComputeExponent')
  const modes = [
    'ceil',
    'floor',
    'expand',
    'trunc',
    'halfCeil',
    'halfFloor',
    'halfExpand',
    'halfTrunc',
    'halfEven',
  ] as const
  const digits: NumberFormatOptions[] = [
    {},
    {maximumFractionDigits: 0},
    {minimumFractionDigits: 2, maximumFractionDigits: 2, roundingIncrement: 25},
    {maximumSignificantDigits: 2},
    {minimumFractionDigits: 2, trailingZeroDisplay: 'stripIfInteger'},
    {
      maximumFractionDigits: 1,
      maximumSignificantDigits: 2,
      roundingPriority: 'morePrecision',
    },
    {
      maximumFractionDigits: 1,
      maximumSignificantDigits: 2,
      roundingPriority: 'lessPrecision',
    },
  ]
  const values = [
    '0',
    '-0',
    '0.0000001',
    '-0.0000001',
    '1.25',
    '-1.25',
    '999.5',
    '-999.5',
    '999999.5',
    '-999999.5',
    '1000000',
    '-1000000',
    '9007199254740993.125',
    '-9007199254740993.125',
  ]
  try {
    for (const notation of ['scientific', 'engineering', 'compact'] as const) {
      for (const roundingMode of modes) {
        for (const options of digits) {
          for (const style of ['decimal', 'percent'] as const) {
            const formatter = new NumberFormat('en', {
              ...options,
              notation,
              roundingMode,
              style,
            })
            const collect = () => ({
              parts: values.map(value => formatter.formatToParts(value)),
              ranges: [
                [1.249, 1.251],
                [-1.251, -1.249],
                [999.4, 999.6],
              ].map(([a, b]) => formatter.formatRangeToParts(a, b)),
            })
            spy.mockImplementation(compute)
            const reused = collect()
            spy.mockImplementation((...args) => {
              const [exponent, magnitude] = compute(...args)
              return [exponent, magnitude]
            })
            expect(
              collect(),
              JSON.stringify({notation, roundingMode, style, ...options})
            ).toEqual(reused)
          }
        }
      }
    }
  } finally {
    spy.mockRestore()
  }
})

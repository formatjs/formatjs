import {shouldPolyfill} from '#packages/intl-numberformat/should-polyfill.js'
import {describe, it, expect} from 'vitest'
import '@formatjs/intl-pluralrules/polyfill.js'
import '@formatjs/intl-pluralrules/locale-data/en'
import en from '#packages/intl-numberformat/tests/locale-data/en.json' with {type: 'json'}
import {NumberFormat} from '#packages/intl-numberformat/core'
NumberFormat.__addLocaleData(en as any)
const toNumberResults = [
  [undefined, NaN],
  [null, +0],
  [true, 1],
  [false, +0],
  ['42', 42],
  ['foo', NaN],
]

describe('value-tonumber', function () {
  const nf = new NumberFormat()
  for (const [val1, val2] of toNumberResults) {
    it(`${val1} === ${val2}`, function () {
      expect(nf.formatToParts(val1 as number)).toEqual(
        nf.formatToParts(val2 as number)
      )
    })
  }
})

describe('Keep trailing zeros', () => {
  it.each([
    [1, {}, '1'],
    [1n, {}, '1'],
    ['1.00', {}, '1.00'],
    ['001.00', {}, '1.00'],
    ['1.0000', {}, '1.000'],
    ['1.20e1', {}, '12.0'],
    ['1.20e-1', {}, '0.120'],
    ['1.200e3', {}, '1,200'],
    ['0.00e1', {}, '0.0'],
    ['0.00e-1', {}, '0.000'],
    ['-0.00', {}, '-0.00'],
    ['1e-9999', {}, '0.000'],
    ['-1e-9999', {}, '-0.000'],
    ['0e9999', {}, '0'],
    ['1.000e9999', {}, '∞'],
    ['0x001', {}, '1'],
    [' \uFEFF1.00 ', {}, '1.00'],
    ['9.995', {maximumFractionDigits: 2}, '10.00'],
    ['.0100', {style: 'percent', maximumFractionDigits: 3}, '1.00%'],
    ['1000', {notation: 'scientific'}, '1.000E3'],
    ['1.20e3', {notation: 'engineering'}, '1.20E3'],
    ['0.00', {notation: 'scientific'}, '0.00E0'],
    ['1000', {notation: 'compact'}, '1.0K'],
    ['1200', {notation: 'compact', maximumFractionDigits: 3}, '1.200K'],
    ['1.00', {trailingZeroDisplay: 'stripToMinimum'}, '1'],
    ['1.00', {trailingZeroDisplay: 'stripIfInteger'}, '1'],
    ['1.20', {trailingZeroDisplay: 'stripIfInteger'}, '1.20'],
    [
      '1.000',
      {minimumFractionDigits: 2, trailingZeroDisplay: 'stripToMinimum'},
      '1.00',
    ],
    [
      '1.20',
      {minimumSignificantDigits: 4, trailingZeroDisplay: 'stripToMinimum'},
      '1.200',
    ],
  ] as const)('formats %s with %j', (input, options, expected) => {
    const formatter = new NumberFormat('en', options)
    expect(formatter.format(input)).toBe(expected)
    expect(
      formatter
        .formatToParts(input)
        .map(part => part.value)
        .join('')
    ).toBe(expected)
  })

  it('compares formatted endpoints including retained precision', () => {
    const keep = new NumberFormat('en')
    expect(keep.formatRange('1.0', '1.00')).toBe('1.0–1.00')
    expect(keep.formatRange('1.00', '1.00')).toBe('~1.00')
    const parts = keep.formatRangeToParts('1.0', '1.00')
    expect(
      parts
        .filter(part => part.source === 'startRange')
        .map(part => part.value)
        .join('')
    ).toBe('1.0')
    expect(
      parts
        .filter(part => part.source === 'endRange')
        .map(part => part.value)
        .join('')
    ).toBe('1.00')
    const strip = new NumberFormat('en', {
      trailingZeroDisplay: 'stripToMinimum',
    })
    expect(strip.formatRange('1.0', '1.00')).toBe('~1')
    expect(strip.resolvedOptions().trailingZeroDisplay).toBe('stripToMinimum')
  })

  it('coerces once with number hint and retains the returned primitive kind', () => {
    const formatter = new NumberFormat('en')
    const hints: string[] = []
    expect(
      formatter.format({
        [Symbol.toPrimitive](hint: string) {
          hints.push(hint)
          return '1.00'
        },
      } as any)
    ).toBe('1.00')
    expect(hints).toEqual(['number'])
    expect(formatter.format(Object(1n))).toBe('1')
    expect(
      formatter.format({[Symbol.toPrimitive]: null, valueOf: () => null} as any)
    ).toBe('0')
    const callable = Object.assign(() => 0, {
      [Symbol.toPrimitive]: () => '1.00',
    })
    expect(formatter.format(callable as any)).toBe('1.00')
    expect(() =>
      formatter.format({[Symbol.toPrimitive]: () => Symbol()} as any)
    ).toThrow(TypeError)
    expect(() =>
      formatter.format({[Symbol.toPrimitive]: () => ({})} as any)
    ).toThrow(TypeError)
  })
})

it('detects missing source precision in native NumberFormat', () => {
  const original = Intl.NumberFormat
  try {
    ;(Intl as any).NumberFormat = NumberFormat
    expect(shouldPolyfill('en')).toBeUndefined()
    ;(Intl as any).NumberFormat = class extends NumberFormat {
      constructor(...args: ConstructorParameters<typeof NumberFormat>) {
        super(...args)
        const format = this.format
        Object.defineProperty(this, 'format', {
          value: (input: any) =>
            format(typeof input === 'string' ? Number(input) : input),
        })
      }
    }
    expect(shouldPolyfill('en')).toBe('en')
  } finally {
    ;(Intl as any).NumberFormat = original
  }
})

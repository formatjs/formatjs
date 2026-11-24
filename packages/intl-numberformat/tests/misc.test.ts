import {describe, it, test, expect} from 'vitest'
import '@formatjs/intl-pluralrules/polyfill.js'
import '@formatjs/intl-pluralrules/locale-data/en.js'
import '@formatjs/intl-pluralrules/locale-data/da.js'
import '@formatjs/intl-pluralrules/locale-data/de.js'
import '@formatjs/intl-pluralrules/locale-data/es.js'
import '@formatjs/intl-pluralrules/locale-data/fr.js'
import '@formatjs/intl-pluralrules/locale-data/id.js'
import '@formatjs/intl-pluralrules/locale-data/it.js'
import '@formatjs/intl-pluralrules/locale-data/ja.js'
import '@formatjs/intl-pluralrules/locale-data/ko.js'
import '@formatjs/intl-pluralrules/locale-data/ms.js'
import '@formatjs/intl-pluralrules/locale-data/nb.js'
import '@formatjs/intl-pluralrules/locale-data/nl.js'
import '@formatjs/intl-pluralrules/locale-data/pl.js'
import '@formatjs/intl-pluralrules/locale-data/pt.js'
import '@formatjs/intl-pluralrules/locale-data/ru.js'
import '@formatjs/intl-pluralrules/locale-data/sv.js'
import '@formatjs/intl-pluralrules/locale-data/th.js'
import '@formatjs/intl-pluralrules/locale-data/tr.js'
import '@formatjs/intl-pluralrules/locale-data/uk.js'
import '@formatjs/intl-pluralrules/locale-data/zh.js'
import {NumberFormat} from '#packages/intl-numberformat/core'
import {
  installNumberLocaleMethods,
  toLocaleString,
} from '#packages/intl-numberformat/to_locale_string.js'

const LOCALES = [
  'en',
  'en-GB',
  'da',
  'de',
  'de-AT',
  'es',
  'fr',
  'fr-CH',
  'id',
  'it',
  'ja',
  'ko',
  'ms',
  'nb',
  'nl',
  'pl',
  'pt',
  'pt-PT',
  'ru',
  'sv',
  'th',
  'tr',
  'uk',
  'zh',
  'zh-Hans',
  'zh-Hant',
  'en-BS',
  'de-CH',
  'es-CL',
  'fy',
  'ar-SS',
]

LOCALES.forEach(locale => {
  NumberFormat.__addLocaleData(require(`./locale-data/${locale}.json`))
})

// Percent style wraps the compact notation subpattern.
it('formats percentage with compact notation', () => {
  expect(
    NumberFormat('en-BS', {
      style: 'percent',
      notation: 'compact',
    }).format(10_000)
  ).toBe('1M%')
})

it('formats compact currency in a numbering system without compact patterns', () => {
  const nf = NumberFormat('ar-SS', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
  })
  expect(nf.format(1234)).toBe('\u200f١٫٢\u00a0ألف\u00a0US$')
  expect(nf.format(-5_600_000)).toBe('\u061c-\u200f٥٫٦\u00a0مليون\u00a0US$')
})

it.each([
  ['latn', '\u200f1.2\u00a0ألف\u00a0US$'],
  ['arabext', '\u200f۱٫۲\u00a0ألف\u00a0US$'],
])(
  'formats compact currency with numbering system %s',
  (numberingSystem, expected) => {
    expect(
      NumberFormat('ar-SS', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        numberingSystem,
      }).format(1234)
    ).toBe(expected)
  }
)

it('should lookup locale correctly', function () {
  expect(
    new NumberFormat('en-BS', {
      style: 'unit',
      unit: 'bit',
    }).format(1000)
  ).toBe('1,000 bit')
  expect(
    new NumberFormat('en-BS', {
      style: 'unit',
      unit: 'celsius',
    }).format(1000)
  ).toBe('1,000°C')
  expect(
    new NumberFormat('en-BS', {
      style: 'unit',
      unit: 'gallon',
    }).format(1000)
  ).toBe('1,000 US gal')
})

it('supportedLocalesOf uses best fit by default and honors prefix lookup', () => {
  const locales = ['zh', 'en-US', 'af', 'zz-ZZ']
  expect(NumberFormat.supportedLocalesOf(locales)).toEqual([
    'zh',
    'en-US',
    'af',
  ])
  expect(
    NumberFormat.supportedLocalesOf(locales, {localeMatcher: 'lookup'})
  ).toEqual(['zh', 'en-US'])
})
it('should not crash if unit is not specified', function () {
  expect(new NumberFormat().resolvedOptions().unit).toBeUndefined()
})

it('formats BigInt values through toLocaleString ponyfill', function () {
  expect(toLocaleString(1234567890123456789n, 'en')).toBe(
    '1,234,567,890,123,456,789'
  )
})

it('installed number locale methods read their own receiver slots', () => {
  const numberDescriptor = Object.getOwnPropertyDescriptor(
    Number.prototype,
    'toLocaleString'
  )!
  const bigIntDescriptor = Object.getOwnPropertyDescriptor(
    BigInt.prototype,
    'toLocaleString'
  )!
  const options = {
    get style(): never {
      throw new Error('options read')
    },
  }
  const boxed = Object(1234)
  boxed.valueOf = () => 0

  installNumberLocaleMethods()
  try {
    const numberMethod = Number.prototype.toLocaleString
    const bigIntMethod = BigInt.prototype.toLocaleString
    expect(numberMethod.length).toBe(0)
    expect(bigIntMethod.length).toBe(0)
    expect(Reflect.apply(numberMethod, boxed, ['en'])).toBe('1,234')
    expect(Reflect.apply(bigIntMethod, Object(1234n), ['en'])).toBe('1,234')
    expect(() => Reflect.apply(numberMethod, 12n, ['en', options])).toThrow(
      TypeError
    )
    expect(() => Reflect.apply(bigIntMethod, 12, ['en', options])).toThrow(
      TypeError
    )
  } finally {
    Object.defineProperty(Number.prototype, 'toLocaleString', numberDescriptor)
    Object.defineProperty(BigInt.prototype, 'toLocaleString', bigIntDescriptor)
  }
})

// Some test262
describe('test262 examples', function () {
  const tests = [
    ['0.000345', '345E-6', '3,45E-4'],
    ['0.345', '345E-3', '3,45E-1'],
    ['3.45', '3,45E0', '3,45E0'],
    ['34.5', '34,5E0', '3,45E1'],
    ['543', '543E0', '5,43E2'],
    ['5430', '5,43E3', '5,43E3'],
    ['543000', '543E3', '5,43E5'],
    ['543211.1', '543,211E3', '5,432E5'],
  ]

  it('10000', function () {
    expect(
      new NumberFormat('th', {
        notation: 'compact',
        signDisplay: 'exceptZero',
        compactDisplay: 'short',
      }).format(10000)
    ).toBe('+10K')
  })

  it('10000 currency', function () {
    expect(
      new NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        currencySign: 'standard',
        signDisplay: 'exceptZero',
        currencyDisplay: 'narrowSymbol',
        notation: 'standard',
        compactDisplay: 'short',
      }).format(10000)
    ).toBe('+$10,000.00')
    expect(
      new NumberFormat('en-US', {
        style: 'currency',
        currency: 'ZWD',
        currencySign: 'standard',
        signDisplay: 'exceptZero',
        currencyDisplay: 'narrowSymbol',
        notation: 'compact',
        compactDisplay: 'short',
      }).format(10000)
    ).toBe('+ZWD 10K')
    expect(
      new NumberFormat('en-US', {
        style: 'currency',
        currency: 'ZWD',
        currencySign: 'standard',
        signDisplay: 'exceptZero',
        currencyDisplay: 'narrowSymbol',
        notation: 'compact',
        compactDisplay: 'long',
      }).format(10000)
    ).toBe('+ZWD 10 thousand')
    expect(
      new NumberFormat('en-US', {
        style: 'currency',
        currency: 'ZWD',
        currencySign: 'standard',
        signDisplay: 'exceptZero',
        currencyDisplay: 'name',
        notation: 'compact',
        compactDisplay: 'long',
      }).format(10000)
    ).toBe('+10 thousand Zimbabwean dollars (1980–2008)')
    expect(
      new NumberFormat('uk', {
        style: 'currency',
        currency: 'GBP',
        currencySign: 'standard',
        signDisplay: 'exceptZero',
        currencyDisplay: 'name',
        notation: 'compact',
        compactDisplay: 'short',
      }).format(10000)
    ).toBe('+10 тис. англійських фунтів')
  })

  it('10000 currency uk scientific', function () {
    expect(
      new NumberFormat('uk', {
        style: 'currency',
        currency: 'GBP',
        currencySign: 'accounting',
        signDisplay: 'exceptZero',
        currencyDisplay: 'name',
        notation: 'scientific',
        compactDisplay: 'short',
      }).format(10000)
    ).toBe('+1Е4 англійських фунтів')
  })

  it('10000 currency de compactLong', function () {
    expect(
      new NumberFormat('de', {
        style: 'currency',
        currency: 'USD',
        currencySign: 'accounting',
        signDisplay: 'auto',
        currencyDisplay: 'name',
        notation: 'compact',
        compactDisplay: 'long',
      }).format(10000)
    ).toBe('10 Tausend US-Dollar')
  })

  it.each(tests)(`number %s`, (number, engineering, scientific) => {
    const nfEngineering = new NumberFormat('de-DE', {
      notation: 'engineering',
    })
    expect(nfEngineering.format(+number)).toBe(engineering)
    const nfScientific = new NumberFormat('de-DE', {
      notation: 'scientific',
    })
    expect(nfScientific.format(+number)).toBe(scientific)
  })
})

// https://github.com/formatjs/formatjs/issues/1670
it('chose compact pattern with rounded number', () => {
  const nf = new NumberFormat('en', {
    // maximumIntegerDigits: 3,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
    style: 'decimal',
    notation: 'compact',
  })

  expect(nf.format(999.995)).toEqual('1.00K')
  expect(nf.format(999995000)).toEqual('1.00B')
})

test('fraction digit limits expose positive zero for negative zero inputs', () => {
  const formatter = new NumberFormat('en', {
    minimumFractionDigits: -0,
    maximumFractionDigits: -0,
  })
  const {minimumFractionDigits, maximumFractionDigits} =
    formatter.resolvedOptions()
  expect(minimumFractionDigits).toBe(0)
  expect(maximumFractionDigits).toBe(0)
})

describe('For wrong options NumberFormat correctly throws exception', () => {
  it.each([1, 3])(
    'checks rounding increment %i without public collection methods',
    roundingIncrement => {
      const originalFrom = Array.from
      const originalJoin = Array.prototype.join
      const unexpected = (): never => {
        throw new TypeError('Read a public collection method')
      }
      let formatter: InstanceType<typeof NumberFormat> | undefined
      let error: unknown
      try {
        formatter = Reflect.construct(NumberFormat, [
          'en',
          {
            get roundingIncrement() {
              Array.from = unexpected
              Array.prototype.join = unexpected
              return roundingIncrement
            },
          },
        ])
      } catch (caught) {
        error = caught
      } finally {
        Array.from = originalFrom
        Array.prototype.join = originalJoin
      }
      if (roundingIncrement === 1) {
        expect(error).toBeUndefined()
        expect(formatter?.resolvedOptions().roundingIncrement).toBe(1)
      } else {
        expect(error).toBeInstanceOf(RangeError)
      }
    }
  )

  it('uses an invalid value for rounding increment', () => {
    const createInstance = () =>
      new NumberFormat('en', {roundingIncrement: 3 as any})

    expect(createInstance).toThrow(RangeError)
    expect(createInstance).toThrow(
      `Invalid rounding increment value: 3.
Valid values are 1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000.`
    )
  })

  it('roundingIncrement > 1 with undefined fraction digits', () => {
    const createInstance = () =>
      new NumberFormat('en', {
        roundingIncrement: 2,
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      })

    expect(createInstance).toThrow(RangeError)
    expect(createInstance).toThrow(
      'With roundingIncrement > 1, maximumFractionDigits and minimumFractionDigits must be equal.'
    )
  })
})

// https://github.com/formatjs/formatjs/issues/1692
it('correctly rounds UP the number in the compact notation', () => {
  const nf = new NumberFormat('en', {
    notation: 'compact',
    compactDisplay: 'short',
  })
  expect(nf.format(9990)).toEqual('10K')
})

it('avoids floating point precision loss at best effort when formatting huge numbers (significantDigits)', () => {
  const nf = new NumberFormat([], {minimumSignificantDigits: 1})
  expect(nf.format(1e41)).toEqual(
    '100,000,000,000,000,000,000,000,000,000,000,000,000,000'
  )
})

it('avoids floating point precision loss at best effort when formatting huge numbers (fractionDigits)', () => {
  const nf = new NumberFormat([], {minimumFractionDigits: 0})
  expect(nf.format(1e41)).toEqual(
    '100,000,000,000,000,000,000,000,000,000,000,000,000,000'
  )
})

test('NaN zh-TW', function () {
  expect(new NumberFormat('zh-TW').format(NaN)).toBe('非數值')
})

it('ignore-invalid-unicode-ext-values.js', function () {
  var locales = ['ja-JP', 'zh-Hans-CN', 'zh-Hant-TW']
  var input = 1234567.89

  locales.forEach(function (locale) {
    var defaultNumberFormat = new NumberFormat([locale])
    var defaultOptions = defaultNumberFormat.resolvedOptions()
    var defaultLocale = defaultOptions.locale
    var defaultFormatted = defaultNumberFormat.format(input)

    const keyValues = {
      cu: ['USD', 'EUR', 'JPY', 'CNY', 'TWD', 'invalid'],
      nu: ['native', 'traditio', 'finance', 'invalid'],
    }

    Object.getOwnPropertyNames(keyValues).forEach(function (key) {
      keyValues[key as 'cu'].forEach(function (value) {
        var numberFormat = new NumberFormat([
          locale + '-u-' + key + '-' + value,
        ])
        var options = numberFormat.resolvedOptions()
        expect(options.locale).toBe(defaultLocale)
        expect(options).toEqual(defaultOptions)
        expect(numberFormat.format(input)).toBe(defaultFormatted)
      })
    })
  })
})

it('GH#2887', function () {
  expect(
    new NumberFormat('en', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
    }).format(30.0)
  ).toBe('€30')
})

it('correctly set default options', () => {
  const nf = new NumberFormat('en', {minimumFractionDigits: 1})
  expect(nf.resolvedOptions()).toEqual({
    locale: 'en',
    maximumFractionDigits: 3,
    minimumFractionDigits: 1,
    minimumIntegerDigits: 1,
    notation: 'standard',
    numberingSystem: 'latn',
    roundingIncrement: 1,
    roundingMode: 'halfExpand',
    roundingPriority: 'auto',
    signDisplay: 'auto',
    style: 'decimal',
    trailingZeroDisplay: 'auto',
    useGrouping: 'auto',
  })
})

test('#4422', () => {
  const nf = new NumberFormat('de-AT', {
    style: 'currency',
    currency: 'EUR',
  })
  expect(nf.format(12345678)).toEqual('€ 12.345.678,00')
})

test('currencyDecimal', () => {
  const nf = new NumberFormat('fr-CH', {
    style: 'currency',
    currency: 'USD',
  })
  expect(nf.format(12345678)).toEqual("12'345'678.00 $US")
})

test('#4678', () => {
  const nf = new NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
    roundingMode: 'trunc',
  })
  expect(nf.format(1050)).toEqual('1K')
})

test('#4476', () => {
  const formatter = new NumberFormat('zh-Hant', {
    notation: 'compact',
    useGrouping: 'always',
  })
  expect(formatter.format(1000)).toEqual('1,000')
})

test('#4771', function () {
  const nf = new NumberFormat('en', {
    style: 'currency',
    currency: 'USD',
  })
  expect(nf.format('1234567891234567.35')).toEqual('$1,234,567,891,234,567.35')
})

// https://github.com/formatjs/formatjs/issues/4359
// roundingIncrement should properly round numbers
test('#4359 roundingIncrement with roundingMode floor', () => {
  const nf = new NumberFormat('en-CA', {
    roundingIncrement: 5,
    roundingMode: 'floor',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })
  expect(nf.format(27.07)).toBe('25')
  expect(nf.format(22)).toBe('20')
  expect(nf.format(23)).toBe('20')
  expect(nf.format(27)).toBe('25')
  expect(nf.format(28)).toBe('25')
  expect(nf.format(29)).toBe('25')
  expect(nf.format(30)).toBe('30')
})

test('#4359 roundingIncrement with roundingMode ceil', () => {
  const nf = new NumberFormat('en-CA', {
    roundingIncrement: 5,
    roundingMode: 'ceil',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })
  expect(nf.format(27.07)).toBe('30')
  expect(nf.format(21)).toBe('25')
  expect(nf.format(25)).toBe('25')
  expect(nf.format(26)).toBe('30')
})

test('#4359 roundingIncrement with roundingMode halfExpand', () => {
  const nf = new NumberFormat('en-CA', {
    roundingIncrement: 5,
    roundingMode: 'halfExpand',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })
  expect(nf.format(27.07)).toBe('25')
  expect(nf.format(27.5)).toBe('30')
  expect(nf.format(22.4)).toBe('20')
  expect(nf.format(22.5)).toBe('25')
})

test('#4359 roundingIncrement with fraction digits', () => {
  const nf = new NumberFormat('en-US', {
    roundingIncrement: 5,
    roundingMode: 'halfExpand',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })
  expect(nf.format(1.234)).toBe('1.25')
  expect(nf.format(1.222)).toBe('1.20')
  expect(nf.format(1.227)).toBe('1.25')
})

test('resolvedOptions includes rounding options', () => {
  const nf = new NumberFormat('en-US', {
    roundingIncrement: 5,
    roundingMode: 'ceil',
    trailingZeroDisplay: 'stripIfInteger',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })
  const resolved = nf.resolvedOptions()

  expect(resolved.roundingIncrement).toBe(5)
  expect(resolved.roundingMode).toBe('ceil')
  expect(resolved.roundingPriority).toBe('auto')
  expect(resolved.trailingZeroDisplay).toBe('stripIfInteger')
  expect(nf.format(1.221)).toBe('1.25')
  expect(nf.format(1)).toBe('1')
})

// https://github.com/formatjs/formatjs/issues/4236
// Bug fixed: formatting very large numbers (> 1000 trillion) with compact notation
test('#4236 compact notation with very large numbers (quadrillion scale)', () => {
  const formatter = new NumberFormat('en', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })

  // Test cases for various magnitudes
  expect(formatter.format(1e12)).toBe('1T') // 1 trillion
  expect(formatter.format(1.5e12)).toBe('1.5T') // 1.5 trillion
  expect(formatter.format(1e13)).toBe('10T') // 10 trillion
  expect(formatter.format(1e14)).toBe('100T') // 100 trillion

  // Numbers >= 1000 trillion (1e15) should use the largest available pattern
  // 1.75682e15 = 1,756,820,000,000,000 (1.757 quadrillion) → 1756.82T
  expect(formatter.format(1.75682e15)).toBe('1756.82T')

  // 1e15 = 1,000,000,000,000,000 (1 quadrillion) → 1000T
  expect(formatter.format(1e15)).toBe('1000T')

  // Even larger numbers should continue to use the T suffix
  expect(formatter.format(1e16)).toBe('10,000T') // 10 quadrillion
  expect(formatter.format(5.5e16)).toBe('55,000T') // 55 quadrillion
})

it('negotiates well-formed numbering systems and rejects malformed ones', () => {
  for (const numberingSystem of ['foobar', 'foo-bar', 'LATN']) {
    expect(
      new NumberFormat('en', {numberingSystem}).resolvedOptions()
        .numberingSystem
    ).toBe('latn')
  }
  for (const numberingSystem of ['', 'ab', 'abc_def', 'abcdefghi']) {
    expect(() => new NumberFormat('en', {numberingSystem})).toThrow(RangeError)
  }
})

test('accepts callable options and reads their properties', () => {
  const options = Object.assign(
    () => {
      throw new Error('called')
    },
    {
      maximumFractionDigits: 2,
      useGrouping: false,
    }
  )
  expect(new NumberFormat('en', options).format(1234.567)).toBe('1234.57')
})

describe('NaN sign display', () => {
  for (const signDisplay of [
    'auto',
    'always',
    'never',
    'exceptZero',
    'negative',
  ] as const) {
    it(signDisplay, () => {
      const formatter = new NumberFormat('en', {signDisplay})
      const sign = signDisplay === 'always' ? '+' : ''
      expect(formatter.format(NaN)).toBe(`${sign}NaN`)
      expect(formatter.formatToParts(NaN)).toEqual([
        ...(sign ? [{type: 'plusSign', value: '+'}] : []),
        {type: 'nan', value: 'NaN'},
      ])
    })
  }

  it('preserves exceptZero signs for zeros and infinities', () => {
    const formatter = new NumberFormat('en', {signDisplay: 'exceptZero'})
    expect(formatter.format(0)).toBe('0')
    expect(formatter.format(-0)).toBe('0')
    expect(formatter.format(Infinity)).toBe('+∞')
    expect(formatter.format(-Infinity)).toBe('-∞')
  })
})

describe.each(['formatRange', 'formatRangeToParts'] as const)(
  '%s endpoints',
  method => {
    it('rejects missing endpoints before coercing either argument', () => {
      const nf = new NumberFormat('en')
      const endpoint = {
        valueOf() {
          throw new Error('must not coerce')
        },
      }
      for (const args of [
        [],
        [1],
        [undefined, 1],
        [1, undefined],
        [undefined, undefined],
        [endpoint, undefined],
        [undefined, endpoint],
      ]) {
        expect(() => (nf[method] as Function)(...args)).toThrow(TypeError)
      }
    })
    it('keeps NaN endpoints as RangeError', () => {
      const nf = new NumberFormat('en')
      expect(() => nf[method](NaN, 1)).toThrow(RangeError)
      expect(() => nf[method](1, NaN)).toThrow(RangeError)
    })
  }
)

describe('Symbol coercion', () => {
  const symbol = Symbol('number')
  const values = [
    symbol,
    Object(symbol),
    {valueOf: () => symbol},
    {[Symbol.toPrimitive]: () => symbol},
  ]
  it.each(values)('rejects a Symbol primitive from %s', value => {
    const nf = new NumberFormat('en')
    expect(() => nf.format(value as any)).toThrow(TypeError)
    expect(() => nf.formatToParts(value as any)).toThrow(TypeError)
    for (const method of ['formatRange', 'formatRangeToParts'] as const) {
      expect(() => nf[method](value as any, 1)).toThrow(TypeError)
      expect(() => nf[method](1, value as any)).toThrow(TypeError)
    }
  })
  it('stops before converting the second endpoint when the first throws', () => {
    const nf = new NumberFormat('en')
    const calls: string[] = []
    const start = {
      [Symbol.toPrimitive](hint: string) {
        calls.push(hint)
        return symbol
      },
    }
    const end = {
      valueOf() {
        calls.push('end')
        return 1
      },
    }
    expect(() => nf.formatRange(start as any, end as any)).toThrow(TypeError)
    expect(calls).toEqual(['number'])
  })
  it('preserves invalid numeric string fallback', () => {
    const nf = new NumberFormat('en')
    expect(nf.format('invalid' as any)).toBe(nf.format(NaN))
  })
})

it('normalizes currency without reading a public uppercase method', () => {
  const original = String.prototype.toUpperCase
  let currency
  try {
    currency = new NumberFormat('en', {
      style: 'currency',
      currency: 'usd',
      get unitDisplay() {
        String.prototype.toUpperCase = () => {
          throw new Error('Read a public uppercase method')
        }
        return 'short' as const
      },
    }).resolvedOptions().currency
  } finally {
    String.prototype.toUpperCase = original
  }
  expect(currency).toBe('USD')
})

describe('unit option case sensitivity', () => {
  it.each([
    'MILE',
    'Mile',
    'meter-per-SECOND',
    'METER-per-second',
    'meter-PER-second',
  ])('rejects %s regardless of style', unit => {
    for (const style of ['decimal', 'percent', 'currency', 'unit'] as const) {
      expect(
        () => new NumberFormat('en', {style, currency: 'USD', unit})
      ).toThrow(RangeError)
    }
  })
  it.each([
    'mile',
    'meter-per-second',
    'microsecond',
    'nanosecond',
    'microsecond-per-nanosecond',
  ])('accepts %s', unit => {
    expect(() => new NumberFormat('en', {style: 'unit', unit})).not.toThrow()
  })
})

it.each(['microsecond', 'nanosecond'])(
  'formats %s using generated locale data',
  unit => {
    expect(
      new NumberFormat('en', {style: 'unit', unit, unitDisplay: 'long'}).format(
        2
      )
    ).toBe(`2 ${unit}s`)
  }
)

describe('built-in method functions', () => {
  it.each([
    ['formatToParts', NumberFormat.prototype, 1],
    ['formatRange', NumberFormat.prototype, 2],
    ['formatRangeToParts', NumberFormat.prototype, 2],
    ['resolvedOptions', NumberFormat.prototype, 0],
    ['supportedLocalesOf', NumberFormat, 1],
  ] as const)('%s is non-constructible', (name, owner, length) => {
    const method = (owner as any)[name]
    expect(method.name).toBe(name)
    expect(method.length).toBe(length)
    expect(Object.hasOwn(method, 'prototype')).toBe(false)
    expect(() => Reflect.construct(method, [])).toThrow(TypeError)
    expect(Object.getOwnPropertyDescriptor(owner, name)).toMatchObject({
      writable: true,
      enumerable: false,
      configurable: true,
    })
  })
})

describe('rounding priority precision', () => {
  it.each([
    ['morePrecision', '1.0'],
    ['lessPrecision', '1.00'],
  ] as const)(
    '%s compares rounding magnitudes',
    (roundingPriority, expected) => {
      const formatter = new NumberFormat('en', {
        minimumSignificantDigits: 2,
        minimumFractionDigits: 2,
        roundingPriority,
        useGrouping: false,
      })
      expect(formatter.format(1)).toBe(expected)
      expect(formatter.format(-1)).toBe('-' + expected)
      expect(
        formatter
          .formatToParts(1)
          .map(part => part.value)
          .join('')
      ).toBe(expected)
    }
  )
})

describe('NumberFormat receiver branding', () => {
  const format = Object.getOwnPropertyDescriptor(
    NumberFormat.prototype,
    'format'
  )!.get!
  it('rejects inherited and proxied receivers without coercing arguments', () => {
    const value = {
      valueOf() {
        throw new Error('must not coerce')
      },
    }
    const receivers = [
      undefined,
      null,
      1,
      Symbol(),
      {},
      Object.create(NumberFormat.prototype),
      new Proxy(new NumberFormat('en'), {}),
    ]
    for (const receiver of receivers) {
      for (let attempt = 0; attempt < 2; attempt++) {
        expect(() => format.call(receiver)).toThrow(TypeError)
        expect(() =>
          NumberFormat.prototype.resolvedOptions.call(receiver)
        ).toThrow(TypeError)
        expect(() =>
          NumberFormat.prototype.formatToParts.call(receiver, value as any)
        ).toThrow(TypeError)
        expect(() =>
          NumberFormat.prototype.formatRange.call(
            receiver,
            value as any,
            value as any
          )
        ).toThrow(TypeError)
        expect(() =>
          NumberFormat.prototype.formatRangeToParts.call(
            receiver,
            value as any,
            value as any
          )
        ).toThrow(TypeError)
      }
    }
  })

  it('accepts a branded receiver after its prototype changes', () => {
    const formatter = new NumberFormat('en')
    Object.setPrototypeOf(formatter, null)
    expect(format.call(formatter)(123)).toBe('123')
    expect(NumberFormat.prototype.resolvedOptions.call(formatter).locale).toBe(
      'en'
    )
  })
})

test('uses the exact magnitude for decimal strings just below a power of ten', () => {
  const formatter = new NumberFormat('en', {
    notation: 'scientific',
    maximumFractionDigits: 2,
    roundingMode: 'trunc',
  })
  expect(formatter.format('9999999999999999999999999')).toBe('9.99E24')
  expect(formatter.format('0.0999999999999999999')).toBe('9.99E-2')
})

test('resolvedOptions defines own properties without invoking inherited setters', () => {
  const formatter = new NumberFormat('en', {roundingPriority: 'morePrecision'})
  const previous = Object.getOwnPropertyDescriptor(
    Object.prototype,
    'roundingPriority'
  )
  let options: ReturnType<typeof formatter.resolvedOptions>
  try {
    Object.defineProperty(Object.prototype, 'roundingPriority', {
      configurable: true,
      set() {
        throw new Error('called inherited roundingPriority setter')
      },
    })
    options = formatter.resolvedOptions()
  } finally {
    if (previous)
      Object.defineProperty(Object.prototype, 'roundingPriority', previous)
    else Reflect.deleteProperty(Object.prototype, 'roundingPriority')
  }
  expect(
    Object.getOwnPropertyDescriptor(options, 'roundingPriority')?.value
  ).toBe('morePrecision')
})

test.each(['auto', 'morePrecision', 'lessPrecision'] as const)(
  'resolvedOptions preserves rounding property order for %s',
  roundingPriority => {
    const options = new NumberFormat('en', {roundingPriority}).resolvedOptions()
    expect(Object.keys(options).slice(-4)).toEqual([
      'roundingIncrement',
      'roundingMode',
      'roundingPriority',
      'trailingZeroDisplay',
    ])
    expect(options.roundingPriority).toBe(roundingPriority)
  }
)

describe('internal PluralRules options', () => {
  it('does not observe inherited option getters', () => {
    const previous = Object.getOwnPropertyDescriptor(
      Object.prototype,
      'localeMatcher'
    )
    let formatted: string
    Object.defineProperty(Object.prototype, 'localeMatcher', {
      configurable: true,
      get() {
        throw new Error('Inherited localeMatcher read')
      },
    })
    try {
      formatted = new NumberFormat('en', Object.create(null)).format(123)
    } finally {
      if (previous)
        Object.defineProperty(Object.prototype, 'localeMatcher', previous)
      else delete (Object.prototype as {localeMatcher?: unknown}).localeMatcher
    }
    expect(formatted!).toBe('123')
  })
})

describe('locale minimum grouping digits', () => {
  it('uses Polish grouping preferences for auto', () => {
    const nf = new NumberFormat('pl')
    expect(nf.format(1000)).toBe('1000')
    expect(nf.format(-1000)).toBe('-1000')
    expect(nf.format(10000)).toBe('10\u00a0000')
    expect(new NumberFormat('pl', {useGrouping: 'always'}).format(1000)).toBe(
      '1\u00a0000'
    )
    expect(new NumberFormat('en', {useGrouping: 'min2'}).format(1000)).toBe(
      '1000'
    )
  })
})

it('preserves range separators and only collapses matching affixes', () => {
  const portuguese = new NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  })
  expect(portuguese.formatRange(3, 5)).toBe('3 - 5 €')
  expect(
    portuguese.formatRangeToParts(3, 5).filter(part => part.type === 'currency')
  ).toEqual([{type: 'currency', value: '€', source: 'shared'}])
  const currency = {style: 'currency', currency: 'USD'} as const
  expect(
    new NumberFormat('en', {...currency, maximumFractionDigits: 0}).formatRange(
      3,
      5
    )
  ).toBe('$3 – $5')
  const signed = new NumberFormat('en', {...currency, signDisplay: 'always'})
  expect(signed.formatRange(2.9, 3.1)).toBe('+$2.90–3.10')
  expect(signed.formatRange(-2.9, 3.1)).toBe('-$2.90 – +$3.10')
  expect(signed.formatRangeToParts(2.9, 3.1).slice(0, 2)).toEqual([
    {type: 'plusSign', value: '+', source: 'shared'},
    {type: 'currency', value: '$', source: 'shared'},
  ])
  const scientific = new NumberFormat('en', {notation: 'scientific'})
  expect(scientific.formatRange(3000, 5000)).toBe('3E3–5E3')
})

it('keeps affix-only range endpoints intact', () => {
  const original = require('./locale-data/en.json')
  const fixture = JSON.parse(JSON.stringify(original))
  // A locale can supply a unit affix with no number for a particular category.
  fixture.data.units.simple.meter.long.one = 'meters'
  fixture.data.units.simple.meter.long.other = 'meters{0}meters'
  try {
    NumberFormat.__addLocaleData(fixture)
    const formatter = new NumberFormat('en', {
      style: 'unit',
      unit: 'meter',
      unitDisplay: 'long',
    })
    expect(formatter.formatRangeToParts(1, 2)).toEqual([
      {type: 'unit', value: 'meters', source: 'startRange'},
      {type: 'literal', value: ' – ', source: 'shared'},
      {type: 'unit', value: 'meters', source: 'endRange'},
      {type: 'integer', value: '2', source: 'endRange'},
      {type: 'unit', value: 'meters', source: 'endRange'},
    ])
    expect(formatter.formatRangeToParts(1, 1)).toEqual([
      {type: 'approximatelySign', value: '~', source: 'shared'},
      {type: 'unit', value: 'meters', source: 'shared'},
    ])
  } finally {
    NumberFormat.__addLocaleData(original)
  }
})

it('creates range parts without invoking public array methods or source setters', () => {
  const formatter = new NumberFormat('en')
  const map = Array.prototype.map
  const splice = Array.prototype.splice
  const source = Object.getOwnPropertyDescriptor(Object.prototype, 'source')
  let setterCalls = 0
  let reversed: ReturnType<typeof formatter.formatRangeToParts>
  let approximate: ReturnType<typeof formatter.formatRangeToParts>
  let formatted: string
  try {
    const unexpected = (): never => {
      throw new Error('Used a public number range operation')
    }
    Array.prototype.map = unexpected
    Array.prototype.splice = unexpected
    Object.defineProperty(Object.prototype, 'source', {
      configurable: true,
      set() {
        setterCalls++
      },
    })
    reversed = formatter.formatRangeToParts(5, 3)
    approximate = formatter.formatRangeToParts(2, 2)
    formatted = formatter.formatRange(5, 3)
  } finally {
    Array.prototype.map = map
    Array.prototype.splice = splice
    if (source) Object.defineProperty(Object.prototype, 'source', source)
    else Reflect.deleteProperty(Object.prototype, 'source')
  }
  // ECMA-402 §16.5.18 steps 2–9 preserve order and assign source fields.
  // https://tc39.es/ecma402/#sec-partitionnumberrangepattern
  expect(reversed!).toEqual([
    {type: 'integer', value: '5', source: 'startRange'},
    {type: 'literal', value: '–', source: 'shared'},
    {type: 'integer', value: '3', source: 'endRange'},
  ])
  expect(approximate!).toEqual([
    {type: 'approximatelySign', value: '~', source: 'shared'},
    {type: 'integer', value: '2', source: 'shared'},
  ])
  expect(formatted!).toBe('5–3')
  expect(setterCalls).toBe(0)
})

it.each([
  ['en', '~', 0],
  ['de-CH', '≈', 2],
  ['es-CL', '~', 2],
  ['fy', '~', 3],
  ['ar-SS', '~', 1],
] as const)(
  'inserts the %s approximation sign while retaining the endpoint parts',
  (locale, sign, index) => {
    const nf = new NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      numberingSystem: 'latn',
      maximumFractionDigits: 0,
    })
    const expected = nf
      .formatToParts(2.9)
      .map(part => ({...part, source: 'shared'}))
    expected.splice(index, 0, {
      type: 'approximatelySign',
      value: sign,
      source: 'shared',
    })
    expect(nf.formatRangeToParts(2.9, 3.1)).toEqual(expected)
  }
)

it('formats approximate ranges with signs, accounting, and compact notation', () => {
  const currency = {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  } as const
  expect(new NumberFormat('en', currency).formatRange(2.9, 3.1)).toBe('~$3')
  const signed = new NumberFormat('en', {...currency, signDisplay: 'always'})
  expect(signed.formatRange(2.9, 3.1)).toBe('~+$3')
  expect(signed.formatRange(-3.1, -2.9)).toBe('~-$3')
  const accounting = new NumberFormat('en', {
    ...currency,
    currencySign: 'accounting',
  })
  expect(accounting.formatRange(-3.1, -2.9)).toBe('~($3)')
  expect(
    new NumberFormat('en', {
      notation: 'compact',
      maximumFractionDigits: 0,
    }).formatRange(2900, 3100)
  ).toBe('~3K')
  expect(
    new NumberFormat('en', {
      style: 'unit',
      unit: 'meter',
      unitDisplay: 'long',
      maximumFractionDigits: 0,
    }).formatRange(2.9, 3.1)
  ).toBe('~3 meters')
})

it('retains negative endpoint signs with a shared currency suffix', () => {
  const nf = new NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    signDisplay: 'always',
  })
  expect(nf.formatRange(2.9, 3.1)).toBe('+2,90 - 3,10 €')
  expect(
    nf.formatRangeToParts(2.9, 3.1).filter(part => part.type === 'plusSign')
  ).toEqual([{type: 'plusSign', value: '+', source: 'shared'}])
  expect(nf.formatRange(-3.1, -2.9)).toBe('-3,10 - -2,90 €')
  expect(nf.formatRange(-2.9, 3.1)).toBe('-2,90 - +3,10 €')
  expect(
    nf
      .formatRangeToParts(-2.9, 3.1)
      .filter(part => part.type === 'minusSign' || part.type === 'plusSign')
      .map(part => part.source)
  ).toEqual(['startRange', 'endRange'])
  expect(
    new NumberFormat('en', {signDisplay: 'always'}).formatRange(3, 5)
  ).toBe('+3 – +5')
})

it('accepts complete numeric systems with locale-specific symbols', () => {
  expect(
    new NumberFormat('en', {numberingSystem: 'adlm'}).format(12345.67)
  ).toBe('𞥑𞥒,𞥓𞥔𞥕.𞥖𞥗')
  expect(new NumberFormat('en', {numberingSystem: 'lepc'}).format(123)).toBe(
    '᱁᱂᱃'
  )
  expect(
    new NumberFormat('en', {numberingSystem: 'arab'}).format(12345.67)
  ).toBe('١٢٬٣٤٥٫٦٧')
  expect(
    new NumberFormat('en-u-nu-arab', {
      numberingSystem: 'invalid',
    }).resolvedOptions()
  ).toMatchObject({
    locale: 'en-u-nu-arab',
    numberingSystem: 'arab',
  })
})

it('hydrates numbering-system aliases without mutating supplied data', () => {
  const source = JSON.parse(JSON.stringify(require('./locale-data/en.json')))
  expect(source.data.numbers.aliases.adlm).toBe('latn')
  for (const field of [
    'symbols',
    'decimal',
    'percent',
    'currency',
    'aliases',
  ]) {
    Object.freeze(source.data.numbers[field])
  }
  Object.freeze(source.data.numbers)
  Object.freeze(source.data)
  Object.freeze(source)
  NumberFormat.__addLocaleData(source)
  expect(source.data.numbers.symbols.adlm).toBeUndefined()
  expect(NumberFormat.localeData.en!.numbers.symbols.adlm).toBe(
    NumberFormat.localeData.en!.numbers.symbols.latn
  )
  expect(new NumberFormat('en', {numberingSystem: 'adlm'}).format(123)).toBe(
    '𞥑𞥒𞥓'
  )
})

it('does not attach compact suffixes to tiny fractions', () => {
  for (const options of [
    {notation: 'compact'},
    {notation: 'compact', style: 'currency', currency: 'USD'},
  ] as const) {
    const model = new NumberFormat('en', options)
    const native = new Intl.NumberFormat('en', options)
    for (const value of [1e-7, -1e-7, 1e-20]) {
      expect(model.format(value)).toBe(native.format(value))
      expect(model.formatToParts(value)).toEqual(native.formatToParts(value))
    }
  }
})

it('falls back to the currency code when a locale has no translated currency name', () => {
  const data = NumberFormat.localeData.en!
  NumberFormat.__addLocaleData({
    locale: 'en-XX',
    data: {
      ...data,
      currencies: {
        ...data.currencies,
        USD: {...data.currencies.USD, displayName: {other: ''}},
      },
    },
  })
  const model = new NumberFormat('en-XX', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'name',
  })
  expect(model.format(1)).toBe('1.00 USD')
  expect(
    model.formatToParts(1).filter(part => part.type === 'currency')
  ).toEqual([{type: 'currency', value: 'USD'}])
})

it('uses the registered English name for XAD', () => {
  const formatter = new NumberFormat('en', {
    style: 'currency',
    currency: 'XAD',
    currencyDisplay: 'name',
  })
  expect(formatter.formatToParts(1)).toContainEqual({
    type: 'currency',
    value: 'Arab Accounting Dinar',
  })
})

it.each(['symbol', 'narrowSymbol', 'name', 'code'] as const)(
  'uses the currency code when %s has no locale entry',
  currencyDisplay => {
    const currency = 'ZZQ'
    const formatter = new NumberFormat('en', {
      style: 'currency',
      currency,
      currencyDisplay,
    })
    const previous = Object.getOwnPropertyDescriptor(Object.prototype, currency)
    let parts: ReturnType<typeof formatter.formatToParts>
    try {
      Object.defineProperty(Object.prototype, currency, {
        configurable: true,
        get() {
          throw new Error('inherited currency data')
        },
      })
      parts = formatter.formatToParts(2)
    } finally {
      if (previous) Object.defineProperty(Object.prototype, currency, previous)
      else Reflect.deleteProperty(Object.prototype, currency)
    }
    expect(parts.filter(part => part.type === 'currency')).toEqual([
      {type: 'currency', value: currency},
    ])
  }
)

it('localizes exponent digits without applying mantissa rounding increments', () => {
  for (const options of [
    {notation: 'scientific', numberingSystem: 'arab'},
    {notation: 'engineering', numberingSystem: 'adlm'},
    {
      notation: 'scientific',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      roundingIncrement: 5,
    },
  ] as const) {
    const model = new NumberFormat('en', options)
    const native = new Intl.NumberFormat('en', options)
    for (const value of [1234, 0.0001234, -1234]) {
      expect(
        model
          .formatToParts(value)
          .filter(part => part.type === 'exponentInteger')
      ).toEqual(
        native
          .formatToParts(value)
          .filter(part => part.type === 'exponentInteger')
      )
    }
  }
})

it('keeps localized mantissa, grouping, and exponent digits private', () => {
  // Use a fresh locale pack so the first render decodes its pattern plan.
  NumberFormat.__addLocaleData(
    JSON.parse(JSON.stringify(require('./locale-data/en.json')))
  )
  const grouped = new NumberFormat('en', {numberingSystem: 'adlm'})
  const scientific = new NumberFormat('en', {
    notation: 'scientific',
    numberingSystem: 'arab',
  })
  const originalExec = RegExp.prototype.exec
  const originalEntries = Array.prototype.entries
  const originalMap = Array.prototype.map
  void /probe(.)/.exec('probe!')
  const before = RegExp.lastMatch
  let parts: ReturnType<typeof grouped.formatToParts>
  let sci: ReturnType<typeof scientific.formatToParts>
  let after: string
  try {
    const unexpected = (): never => {
      throw new Error('Used a public digit partitioning operation')
    }
    RegExp.prototype.exec = unexpected
    Array.prototype.entries = unexpected
    Array.prototype.map = unexpected
    parts = grouped.formatToParts(12345.67)
    sci = scientific.formatToParts(0.0001234)
    after = RegExp.lastMatch
  } finally {
    RegExp.prototype.exec = originalExec
    Array.prototype.entries = originalEntries
    Array.prototype.map = originalMap
  }
  // ECMA-402 §16.5.4 step 4.c.iii groups and substitutes private digit strings.
  // https://tc39.es/ecma402/#sec-partitionnotationsubpattern
  expect(parts!).toEqual([
    {type: 'integer', value: '𞥑𞥒'},
    {type: 'group', value: ','},
    {type: 'integer', value: '𞥓𞥔𞥕'},
    {type: 'decimal', value: '.'},
    {type: 'fraction', value: '𞥖𞥗'},
  ])
  expect(sci!.find(part => part.type === 'exponentInteger')?.value).toBe('٤')
  expect(after!).toBe(before)
})

it('renders currency, compound units, and compact patterns without public regex hooks', () => {
  NumberFormat.__addLocaleData(
    JSON.parse(JSON.stringify(require('./locale-data/en.json')))
  )
  const code = new NumberFormat('en', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'code',
  })
  const name = new NumberFormat('en', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'name',
  })
  const unit = new NumberFormat('en', {
    style: 'unit',
    unit: 'meter-per-second',
    unitDisplay: 'long',
  })
  const compact = new NumberFormat('en', {notation: 'compact'})
  const exec = RegExp.prototype.exec
  const replace = String.prototype.replace
  void /probe(.)/.exec('probe!')
  const before = RegExp.lastMatch
  let result: string[]
  let parts: ReturnType<typeof unit.formatToParts>
  let after: string
  try {
    const unexpected = (): never => {
      throw new Error('Used a public number pattern operation')
    }
    RegExp.prototype.exec = unexpected
    String.prototype.replace = unexpected
    result = [code.format(2), name.format(2), compact.format(2000)]
    parts = unit.formatToParts(2)
    after = RegExp.lastMatch
  } finally {
    RegExp.prototype.exec = exec
    String.prototype.replace = replace
  }
  // ECMA-402 §16.5.3 step 9 expands patterns from private locale data.
  // https://tc39.es/ecma402/#sec-partitionnumberpattern
  expect(result!).toEqual(['USD\u00a02.00', '2.00 US dollars', '2K'])
  expect(parts!).toEqual([
    {type: 'integer', value: '2'},
    {type: 'literal', value: ' '},
    {type: 'unit', value: 'meters per second'},
  ])
  expect(after!).toBe(before)
})

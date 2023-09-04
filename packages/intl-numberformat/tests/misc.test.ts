import '@formatjs/intl-pluralrules/polyfill'
import {NumberFormat} from '../src/core'

const LOCALES = [
  'en',
  'en-GB',
  'da',
  'de',
  'es',
  'fr',
  'id',
  'it',
  'ja',
  'ko',
  'ms',
  'nb',
  'nl',
  'pl',
  'pt',
  'ru',
  'sv',
  'th',
  'tr',
  'uk',
  'zh',
  'zh-Hans',
  'zh-Hant',
  'en-BS',
]

LOCALES.forEach(locale => {
  require(`@formatjs/intl-pluralrules/locale-data/${locale.split('-')[0]}`)
  NumberFormat.__addLocaleData(require(`./locale-data/${locale}.json`))
})

// Replicate Google Chrome's behavior: when there is a compact pattern, drop the percentage sign.
// For example, 10000 is formatted to "1M" (10000 * 100 = 1M).
it('formats percentage with comapct notation', () => {
  expect(
    NumberFormat('en-BS', {
      style: 'percent',
      notation: 'compact',
    }).format(10_000)
  ).toBe('1M')
})

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

it('supportedLocalesOf should return correct result based on data loaded', function () {
  expect(NumberFormat.supportedLocalesOf(['zh', 'en-US', 'af'])).toEqual([
    'zh',
    'en',
  ])
  expect(NumberFormat.supportedLocalesOf(['af'])).toEqual([])
})
it('should not crash if unit is not specified', function () {
  expect(new NumberFormat().resolvedOptions().unit).toBeUndefined()
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
    ).toBe('+ZWD 10K')
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
    ).toBe('+1,00Е4 англійського фунта')
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

  for (const [number, engineering, scientific] of tests) {
    it(`number ${number}`, function () {
      const nfEngineering = new NumberFormat('de-DE', {
        notation: 'engineering',
      })
      expect(nfEngineering.format(+number)).toBe(engineering)
      const nfScientific = new NumberFormat('de-DE', {
        notation: 'scientific',
      })
      expect(nfScientific.format(+number)).toBe(scientific)
    })
  }
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

describe('For wrong options NumberFormat correctly throws exception', () => {
  it('uses an invalid value for rounding incremenet', () => {
    const createInstance = () => new NumberFormat('en', {roundingIncrement: 3})

    expect(createInstance).toThrowError(
      new RangeError(
        'Invalid rounding increment value: 3.\nValid values are 1,2,5,10,20,25,50,100,200,250,500,1000,2000.'
      )
    )
  })

  it('roundingIncrement > 1 with undefined fraction digits', () => {
    const createInstance = () => new NumberFormat('en', {roundingIncrement: 2})

    expect(createInstance).toThrowError(
      new RangeError(
        'With roundingIncrement > 1, maximumFractionDigits and minimumFractionDigits must be equal.'
      )
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
    roundingPriority: 'auto',
    signDisplay: 'auto',
    style: 'decimal',
    useGrouping: 'auto',
  })
})

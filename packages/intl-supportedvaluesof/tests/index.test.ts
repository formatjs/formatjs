import {supportedValuesOf} from '#packages/intl-supportedvaluesof/index.js'
import '#packages/intl-supportedvaluesof/polyfill-force.js'
import {describe, expect, it} from 'vitest'

describe('Intl.supportedValuesOf', () => {
  it('installs with native-compatible property descriptors', () => {
    expect(
      Object.getOwnPropertyDescriptor(Intl, 'supportedValuesOf')
    ).toMatchObject({
      writable: true,
      enumerable: false,
      configurable: true,
    })
  })

  it('ignores inherited options when probing formatter capabilities', () => {
    const keys = ['currency', 'unit', 'timeZone'] as const
    const expected = keys.map(key => supportedValuesOf(key))
    const {NumberFormat, DateTimeFormat} = Intl
    const previous = Object.getOwnPropertyDescriptor(
      Object.prototype,
      'localeMatcher'
    )
    let actual: string[][]
    try {
      Intl.NumberFormat =
        class extends NumberFormat {} as unknown as typeof NumberFormat
      Intl.DateTimeFormat =
        class extends DateTimeFormat {} as unknown as typeof DateTimeFormat
      Object.defineProperty(Object.prototype, 'localeMatcher', {
        configurable: true,
        get() {
          throw new Error('Read an inherited formatter option')
        },
      })
      actual = keys.map(key => supportedValuesOf(key))
    } finally {
      if (previous)
        Object.defineProperty(Object.prototype, 'localeMatcher', previous)
      else Reflect.deleteProperty(Object.prototype, 'localeMatcher')
      Intl.NumberFormat = NumberFormat
      Intl.DateTimeFormat = DateTimeFormat
    }
    expect(actual).toEqual(expected)
  })

  it.each([
    'calendar',
    'collation',
    'currency',
    'numberingSystem',
    'timeZone',
    'unit',
  ] as const)('enumerates %s with private list operations', key => {
    const expected = supportedValuesOf(key)
    const {filter, sort} = Array.prototype
    const fail = () => {
      throw new Error('Public array method called')
    }
    let result: string[]
    try {
      Array.prototype.filter = fail
      Array.prototype.sort = fail
      result = supportedValuesOf(key)
    } finally {
      Array.prototype.filter = filter
      Array.prototype.sort = sort
    }
    expect(result).toEqual(expected)
    expect(result).not.toBe(expected)
  })

  describe('ECMA-402 spec compliance', () => {
    it('should return an array for valid keys', () => {
      // ECMA-402 Spec: Must return an array
      const result = supportedValuesOf('calendar')
      expect(Array.isArray(result)).toBe(true)
    })

    it('should throw RangeError for invalid key', () => {
      // ECMA-402 Spec: Throw RangeError for invalid keys
      // @ts-expect-error
      expect(() => supportedValuesOf('invalid')).toThrow(RangeError)
      // @ts-expect-error
      expect(() => supportedValuesOf('calendars')).toThrowError(
        'Invalid key: calendars'
      )
      // @ts-expect-error
      expect(() => supportedValuesOf('calendarz')).toThrowError(RangeError)
    })

    it('should return sorted arrays', () => {
      // ECMA-402 Spec: Results must be sorted lexicographically
      const keys = [
        'calendar',
        'collation',
        'currency',
        'numberingSystem',
        'timeZone',
        'unit',
      ] as const

      for (const key of keys) {
        const result = supportedValuesOf(key)
        const sorted = [...result].sort()
        expect(result).toEqual(sorted)
      }
    })

    it('should return non-empty arrays for all keys', () => {
      // Implementation: All keys must return at least some supported values
      const keys = [
        'calendar',
        'collation',
        'currency',
        'numberingSystem',
        'timeZone',
        'unit',
      ] as const

      for (const key of keys) {
        const result = supportedValuesOf(key)
        expect(result.length).toBeGreaterThan(0)
      }
    })

    it('should return unique values', () => {
      // ECMA-402 Spec: Array must contain unique values
      const keys = [
        'calendar',
        'collation',
        'currency',
        'numberingSystem',
        'timeZone',
        'unit',
      ] as const

      for (const key of keys) {
        const result = supportedValuesOf(key)
        const unique = [...new Set(result)]
        expect(result).toEqual(unique)
      }
    })
  })

  it('uses the installed DateTimeFormat and its current locale data', () => {
    const original = Intl.DateTimeFormat
    const originalCalendars = supportedValuesOf('calendar')
    let calendar = 'gregory'
    class DateTimeFormat {
      static polyfilled = true
      resolvedOptions() {
        return {calendar}
      }
    }

    try {
      Intl.DateTimeFormat =
        DateTimeFormat as unknown as typeof Intl.DateTimeFormat
      expect(supportedValuesOf('calendar')).toEqual(['gregory'])
      calendar = 'japanese'
      expect(supportedValuesOf('calendar')).toEqual(['japanese'])
    } finally {
      Intl.DateTimeFormat = original
    }
    expect(supportedValuesOf('calendar')).toEqual(originalCalendars)
  })

  it('enumerates available calendars without constructing a formatter', () => {
    const original = Intl.DateTimeFormat
    const key = Symbol.for('@formatjs/intl-datetimeformat/availableCalendars')
    let available = ['gregory']
    class DateTimeFormat {
      static polyfilled = true
      static __addLocaleData() {
        available = ['japanese', 'gregory', 'custom', 'islamicc', 'gregory']
      }
      static [key]() {
        return available
      }
      constructor() {
        throw new Error('Unexpected formatter construction')
      }
    }

    const loadLocale = DateTimeFormat.__addLocaleData
    try {
      Intl.DateTimeFormat =
        DateTimeFormat as unknown as typeof Intl.DateTimeFormat
      expect(supportedValuesOf('calendar')).toEqual(['gregory'])
      loadLocale()
      expect(supportedValuesOf('calendar')).toEqual(['gregory', 'japanese'])
    } finally {
      Intl.DateTimeFormat = original
    }
  })

  it.each([
    ['DateTimeFormat', ['calendar', 'timeZone']],
    ['NumberFormat', ['currency', 'numberingSystem', 'unit']],
    ['Collator', ['collation']],
  ] as const)('enumerates with retained %s operations', (name, keys) => {
    const Constructor = Intl[name]
    const expected = keys.map(key => supportedValuesOf(key))
    const constructor = Object.getOwnPropertyDescriptor(Intl, name)!
    const prototype = Constructor.prototype
    const methods =
      name === 'NumberFormat'
        ? ['resolvedOptions', 'format', 'formatToParts']
        : ['resolvedOptions']
    const descriptors = methods.map(method =>
      Object.getOwnPropertyDescriptor(prototype, method)!
    )
    const marker = Object.getOwnPropertyDescriptor(Constructor, 'polyfilled')
    const fail = {
      configurable: true,
      get() {
        throw new Error('Read public formatter property')
      },
    }
    let actual: string[][]
    try {
      Object.defineProperty(Intl, name, fail)
      Object.defineProperty(Constructor, 'polyfilled', fail)
      for (const method of methods)
        Object.defineProperty(prototype, method, fail)
      actual = keys.map(key => supportedValuesOf(key))
    } finally {
      Object.defineProperty(Intl, name, constructor)
      for (const [index, method] of methods.entries())
        Object.defineProperty(prototype, method, descriptors[index])
      if (marker) Object.defineProperty(Constructor, 'polyfilled', marker)
      else Reflect.deleteProperty(Constructor, 'polyfilled')
    }
    expect(actual).toEqual(expected)
  })

  describe('calendar', () => {
    it('should return an array of supported calendars', () => {
      const result = supportedValuesOf('calendar')
      expect(result).toEqual(expect.any(Array))
      expect(result.length).toBeGreaterThan(0)
    })

    it('should include gregorian calendar', () => {
      // Implementation: Gregorian calendar should always be supported
      const result = supportedValuesOf('calendar')
      expect(result).toContain('gregory')
    })
  })

  describe('collation', () => {
    it('includes collations supported outside English', () => {
      const result = supportedValuesOf('collation')
      for (const [locale, collation] of [
        ['de', 'phonebk'],
        ['es', 'trad'],
        ['si', 'dict'],
      ] as const) {
        expect(
          new Intl.Collator(locale, {collation}).resolvedOptions().collation
        ).toBe(collation)
        expect(result).toContain(collation)
      }
      if (
        new Intl.Collator('zh-Hant', {collation: 'pinyin'}).resolvedOptions()
          .collation === 'pinyin'
      ) {
        expect(result).toContain('pinyin')
      }
      expect(result).not.toContain('standard')
      expect(result).not.toContain('search')
    })
    it('should return an array of supported collations', () => {
      const result = supportedValuesOf('collation')
      expect(result).toEqual(expect.any(Array))
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('currency', () => {
    it('includes registry codes when the runtime has a localized name', () => {
      const code = 'CNX'
      const parts = new Intl.NumberFormat('en', {
        style: 'currency',
        currencyDisplay: 'name',
        currency: code,
      }).formatToParts(123)
      expect(supportedValuesOf('currency').includes(code)).toBe(
        parts.some(part => part.type === 'currency' && part.value !== code)
      )
    })

    it('should return an array of supported currencies', () => {
      const result = supportedValuesOf('currency')
      expect(result).toEqual(expect.any(Array))
      expect(result.length).toBeGreaterThan(0)
    })

    it('should include common currencies', () => {
      // Implementation: Common currencies should be supported
      const result = supportedValuesOf('currency')
      expect(result).toContain('USD')
      expect(result).toContain('EUR')
    })
  })

  describe('numberingSystem', () => {
    it('keeps Table 30 numbering systems when the host falls back to localized digits', () => {
      const NumberFormat = Intl.NumberFormat
      const expected = supportedValuesOf('numberingSystem')
      let result: string[]
      try {
        Intl.NumberFormat = class extends NumberFormat {
          constructor() {
            super('ar', {numberingSystem: 'arab'})
          }
        } as unknown as typeof NumberFormat
        result = supportedValuesOf('numberingSystem')
      } finally {
        Intl.NumberFormat = NumberFormat
      }
      expect(result!).toEqual(expected)
      expect(result!).toEqual(
        expect.arrayContaining(['arab', 'latn', 'outlined'])
      )
    })

    it('should return an array of supported numbering systems', () => {
      const result = supportedValuesOf('numberingSystem')
      expect(result).toEqual(expect.any(Array))
      expect(result.length).toBeGreaterThan(0)
    })

    it('should include latin numbering system', () => {
      // Implementation: Latin numbering system should always be supported
      const result = supportedValuesOf('numberingSystem')
      expect(result).toContain('latn')
    })
  })

  describe('timeZone', () => {
    it('enumerates available zones without a locale or formatter', () => {
      const original = Intl.DateTimeFormat
      const key = Symbol.for('@formatjs/intl-datetimeformat/hasTimeZone')
      let available = ['UTC', 'US/Eastern']
      class DateTimeFormat {
        static [key](name: string) {
          return available.includes(name)
        }
        constructor() {
          throw new Error('Unexpected formatter construction')
        }
      }
      try {
        Intl.DateTimeFormat =
          DateTimeFormat as unknown as typeof Intl.DateTimeFormat
        expect(supportedValuesOf('timeZone')).toEqual(['UTC'])
        available = ['UTC', 'America/New_York', 'US/Eastern']
        expect(supportedValuesOf('timeZone')).toEqual([
          'America/New_York',
          'UTC',
        ])
      } finally {
        Intl.DateTimeFormat = original
      }
    })

    it('keeps primary IDs when host Intl uses older aliases', () => {
      const result = supportedValuesOf('timeZone')
      for (const zone of [
        'America/Edmonton',
        'Asia/Kathmandu',
        'Europe/Kyiv',
        'Africa/Accra',
        'Africa/Abidjan',
      ]) {
        expect(result).toContain(zone)
      }
      for (const alias of [
        'America/Yellowknife',
        'America/Montreal',
        'Asia/Katmandu',
        'Europe/Kiev',
      ]) {
        expect(result).not.toContain(alias)
      }
    })
    it('should return an array of supported time zones', () => {
      const result = supportedValuesOf('timeZone')
      expect(result).toEqual(expect.any(Array))
      expect(result.length).toBeGreaterThan(0)
    })

    it('should include common IANA timezones', () => {
      // Implementation: Common IANA timezones should be supported
      const result = supportedValuesOf('timeZone')
      // Test for a commonly available timezone
      const hasCommonTimezone =
        result.includes('America/New_York') ||
        result.includes('Europe/London') ||
        result.includes('Asia/Tokyo')
      expect(hasCommonTimezone).toBe(true)
    })
  })

  describe('unit', () => {
    it('returns all sanctioned units even when the installed formatter rejects every unit', () => {
      const original = Intl.NumberFormat
      const expected = supportedValuesOf('unit')
      let calls = 0
      try {
        Intl.NumberFormat = class extends original {
          constructor() {
            super()
            calls++
            throw new RangeError('No unit data')
          }
        } as unknown as typeof original
        expect(supportedValuesOf('unit')).toEqual(expected)
        expect(expected).toEqual(
          expect.arrayContaining(['microsecond', 'nanosecond'])
        )
        expect(calls).toBe(0)
      } finally {
        Intl.NumberFormat = original
      }
    })
  })
})

it('coerces keys once with a string hint', () => {
  const hints: string[] = []
  const key = {
    [Symbol.toPrimitive](hint: string) {
      hints.push(hint)
      return 'unit'
    },
  }
  expect(supportedValuesOf(key as any)).toEqual(supportedValuesOf('unit'))
  expect(hints).toEqual(['string'])
  expect(supportedValuesOf(new String('unit') as any)).toEqual(
    supportedValuesOf('unit')
  )
})
it('preserves key coercion errors', () => {
  expect(() => supportedValuesOf(Symbol('unit') as any)).toThrow(TypeError)
  const error = new Error('coercion')
  expect(() =>
    supportedValuesOf({
      toString() {
        throw error
      },
    } as any)
  ).toThrow(error)
})

it('supportedValuesOf is a non-constructible built-in function', () => {
  expect(supportedValuesOf.name).toBe('supportedValuesOf')
  expect(supportedValuesOf.length).toBe(1)
  expect(Object.hasOwn(supportedValuesOf, 'prototype')).toBe(false)
  expect(() => Reflect.construct(supportedValuesOf, ['unit'])).toThrow(
    TypeError
  )
})

it('enumerates non-continental primary time zones', () => {
  const zones = supportedValuesOf('timeZone')
  expect(zones).toEqual(
    expect.arrayContaining([
      'UTC',
      'Etc/GMT+1',
      'Etc/GMT+12',
      'Etc/GMT-1',
      'Etc/GMT-14',
    ])
  )
  expect(zones).not.toContain('Etc/UTC')
  expect(zones).not.toContain('Etc/GMT')
})

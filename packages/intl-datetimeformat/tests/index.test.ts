import calendars from '#packages/intl-datetimeformat/calendars/all.js'
import '@formatjs/intl-getcanonicallocales/polyfill.js'
import '@formatjs/intl-locale/polyfill.js'
import {DateTimeFormat} from '#packages/intl-datetimeformat/core'
import {NumberFormat} from '@formatjs/intl-numberformat'
import type {RawNumberLocaleData} from '#packages/ecma402-abstract/types/number.js'
import enNumber from '#packages/intl-numberformat/tests/locale-data/en.json' with {type: 'json'}
import allData from '@formatjs_generated/tz/all-tz.js'
import arEG from '#packages/intl-datetimeformat/tests/locale-data/ar-EG.json' with {type: 'json'}
import bn from '#packages/intl-datetimeformat/tests/locale-data/bn.json' with {type: 'json'}
import enCA from '#packages/intl-datetimeformat/tests/locale-data/en-CA.json' with {type: 'json'}
import enGB from '#packages/intl-datetimeformat/tests/locale-data/en-GB.json' with {type: 'json'}
import en from '#packages/intl-datetimeformat/tests/locale-data/en.json' with {type: 'json'}
import fa from '#packages/intl-datetimeformat/tests/locale-data/fa.json' with {type: 'json'}
import ja from '#packages/intl-datetimeformat/tests/locale-data/ja.json' with {type: 'json'}
import my from '#packages/intl-datetimeformat/tests/locale-data/my.json' with {type: 'json'}
import ne from '#packages/intl-datetimeformat/tests/locale-data/ne.json' with {type: 'json'}
import zhHans from '#packages/intl-datetimeformat/tests/locale-data/zh-Hans.json' with {type: 'json'}
import {describe, expect, it, afterEach} from 'vitest'
import {shouldPolyfill} from '#packages/intl-datetimeformat/should-polyfill.js'
DateTimeFormat.__addCalendarData(...calendars)
// @ts-ignore
DateTimeFormat.__addLocaleData(en, enGB, enCA, ja, zhHans, fa, arEG, bn, my, ne)
DateTimeFormat.__addTZData(allData)
const DEFAULT_TIMEZONE = DateTimeFormat.getDefaultTimeZone()

it('preserves legacy RegExp state when selecting fractional second patterns', () => {
  void /probe(.)/.exec('probe!')
  const before = [RegExp.lastMatch, RegExp.$1]

  const formatter = new DateTimeFormat('en', {
    timeZone: 'UTC',
    second: 'numeric',
    fractionalSecondDigits: 3,
    formatMatcher: 'basic',
  })

  const after = [RegExp.lastMatch, RegExp.$1]
  expect(after).toEqual(before)
  expect(formatter.formatToParts(123)).toContainEqual({
    type: 'fractionalSecond',
    value: '123',
  })
})

it.each(['ja', 'zh'])(
  'keeps the GMT offset separate from date fields in %s',
  locale => {
    const time = Date.UTC(2026, 0, 15, 15, 30)
    for (const formatMatcher of ['basic', 'best fit'] as const) {
      const formatter = new DateTimeFormat(locale, {
        timeZone: 'America/New_York',
        timeZoneName: 'short',
        formatMatcher,
      })
      expect(formatter.format(time)).toBe('2026/1/15 GMT-5')
      expect(formatter.formatToParts(time)).toContainEqual({
        type: 'timeZoneName',
        value: 'GMT-5',
      })
      expect(formatter.resolvedOptions()).not.toHaveProperty('hour')
      expect(formatter.resolvedOptions()).not.toHaveProperty('hourCycle')
      expect(formatter.resolvedOptions()).not.toHaveProperty('hour12')
    }
  }
)

describe('Intl.DateTimeFormat', function () {
  afterEach(() => {
    DateTimeFormat.__setDefaultTimeZone(DEFAULT_TIMEZONE)
  })
  it.each([
    ['us/eastern', 'US/Eastern', 'America/New_York'],
    ['asia/calcutta', 'Asia/Calcutta', 'Asia/Kolkata'],
    ['europe/bratislava', 'Europe/Bratislava', 'Europe/Prague'],
    ['america/yellowknife', 'America/Yellowknife', 'America/Edmonton'],
    ['etc/gmt', 'Etc/GMT', 'UTC'],
    ['etc/utc', 'Etc/UTC', 'UTC'],
    ['gmt', 'GMT', 'UTC'],
    ['zulu', 'Zulu', 'UTC'],
  ])(
    'preserves %s as %s while formatting with target data',
    (input, identifier, primary) => {
      const options = {
        dateStyle: 'full',
        timeStyle: 'long',
      } as const
      const formatter = new DateTimeFormat('en', {...options, timeZone: input})
      const reference = new DateTimeFormat('en', {
        ...options,
        timeZone: primary,
      })
      expect(formatter.resolvedOptions().timeZone).toBe(identifier)
      for (const start of [Date.UTC(2024, 0, 1), Date.UTC(2024, 6, 1)]) {
        const end = start + 86_400_000
        expect(formatter.format(start)).toBe(reference.format(start))
        expect(formatter.formatToParts(start)).toEqual(
          reference.formatToParts(start)
        )
        expect(formatter.formatRange(start, end)).toBe(
          reference.formatRange(start, end)
        )
        expect(formatter.formatRangeToParts(start, end)).toEqual(
          reference.formatRangeToParts(start, end)
        )
      }
      DateTimeFormat.__setDefaultTimeZone(input)
      expect(DateTimeFormat.getDefaultTimeZone()).toBe(identifier)
      const defaultFormatter = new DateTimeFormat('en', options)
      expect(defaultFormatter.resolvedOptions().timeZone).toBe(identifier)
      expect(defaultFormatter.format(0)).toBe(reference.format(0))
    }
  )
  it.each([
    ['prototype', 'formatRange'],
    ['prototype', 'formatRangeToParts'],
    ['prototype', 'formatToParts'],
    ['constructor', 'supportedLocalesOf'],
  ] as const)('detects non-callable native %s.%s', (owner, method) => {
    const original = Intl.DateTimeFormat
    const polyfill = DateTimeFormat as unknown as typeof Intl.DateTimeFormat
    const target = owner === 'prototype' ? polyfill.prototype : polyfill
    const descriptor = Object.getOwnPropertyDescriptor(target, method)!
    let complete: string | undefined
    let incomplete: string | undefined
    try {
      Intl.DateTimeFormat = polyfill
      complete = shouldPolyfill('en')
      Object.defineProperty(target, method, {value: undefined})
      incomplete = shouldPolyfill('en')
    } finally {
      Object.defineProperty(target, method, descriptor)
      Intl.DateTimeFormat = original
    }
    expect(complete).toBeUndefined()
    expect(incomplete).toBe('en')
  })
  it.each(['locale getter', 'locale method', 'parts method'] as const)(
    'selects locale data when the native %s throws',
    kind => {
      const original = Intl.DateTimeFormat
      const polyfill = DateTimeFormat as unknown as typeof Intl.DateTimeFormat
      const unsupported = () => {
        throw new RangeError('Host formatter support unavailable')
      }
      try {
        Intl.DateTimeFormat = polyfill
        expect(shouldPolyfill('en')).toBeUndefined()
        Intl.DateTimeFormat = new Proxy(polyfill, {
          get(target, key, receiver) {
            if (key === 'supportedLocalesOf' && kind !== 'parts method') {
              if (kind === 'locale getter') unsupported()
              return unsupported
            }
            return Reflect.get(target, key, receiver)
          },
          construct(target, args) {
            const formatter = Reflect.construct(target, args)
            if (kind === 'parts method') {
              Object.defineProperty(formatter, 'formatToParts', {
                value: unsupported,
              })
            }
            return formatter
          },
        })
        expect(shouldPolyfill('en')).toBe('en')
      } finally {
        Intl.DateTimeFormat = original
      }
    }
  )
  it.each([
    ['Asia/Calcutta', 'Asia/Kolkata'],
    ['Etc/UTC', 'UTC'],
  ])('detects native canonicalization of %s', (identifier, primary) => {
    const original = Intl.DateTimeFormat
    const polyfill = DateTimeFormat as unknown as typeof Intl.DateTimeFormat
    try {
      Intl.DateTimeFormat = polyfill
      expect(shouldPolyfill('en')).toBeUndefined()
      Intl.DateTimeFormat = new Proxy(polyfill, {
        construct(target, [locales, options]) {
          return new target(locales, {
            ...options,
            timeZone:
              options?.timeZone === identifier ? primary : options?.timeZone,
          })
        },
      })
      expect(shouldPolyfill('en')).toBe('en')
    } finally {
      Intl.DateTimeFormat = original
    }
  })
  it('does not add an hour to minute/second-only requests', () => {
    const date = Date.UTC(2020, 0, 2, 1, 2, 3, 456)
    for (const hourCycle of ['h11', 'h12', 'h23', 'h24'] as const) {
      const formatter = new DateTimeFormat('en', {
        timeZone: 'UTC',
        minute: 'numeric',
        second: 'numeric',
        hourCycle,
      })
      expect(formatter.format(date)).toBe('02:03')
      expect(formatter.resolvedOptions().hourCycle).toBeUndefined()
    }
    expect(
      new DateTimeFormat('en', {
        timeZone: 'UTC',
        minute: 'numeric',
        second: 'numeric',
        fractionalSecondDigits: 3,
      }).format(date)
    ).toBe('02:03.456')
  })

  it.each(['basic', 'best fit'] as const)(
    'renders standalone time fields with the %s matcher',
    formatMatcher => {
      const timeZone = 'UTC'
      const time = Date.UTC(2024, 0, 1, 2, 3, 4, 56)
      for (const [field, value] of [
        ['minute', '3'],
        ['second', '4'],
      ] as const) {
        const formatter = new DateTimeFormat('en', {
          timeZone,
          formatMatcher,
          [field]: 'numeric',
        })
        expect(formatter.formatToParts(time)).toEqual([{type: field, value}])
      }
      for (const [digits, value] of [
        [1, '٠'],
        [2, '٠٥'],
        [3, '٠٥٦'],
      ] as const) {
        const formatter = new DateTimeFormat('en-u-nu-arab', {
          timeZone,
          formatMatcher,
          fractionalSecondDigits: digits,
        })
        expect(formatter.resolvedOptions().fractionalSecondDigits).toBe(digits)
        expect(formatter.formatToParts(time)).toEqual([
          {type: 'fractionalSecond', value},
        ])
      }
      const formatter = new DateTimeFormat('en', {
        timeZone,
        formatMatcher,
        minute: 'numeric',
        fractionalSecondDigits: 3,
      })
      expect(formatter.format(time)).toBe('03:04.056')
      expect(formatter.resolvedOptions()).toMatchObject({
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
      })
    }
  )

  it.each(
    ['en', 'fr', 'ja'].flatMap(locale =>
      (['basic', 'best fit'] as const).map(
        matcher => [locale, matcher] as const
      )
    )
  )('selects the hour layout for %s using %s', (locale, formatMatcher) => {
    const options = {
      timeZone: 'UTC',
      formatMatcher,
      hour: '2-digit',
      minute: '2-digit',
    } as const
    const twelveHour = new DateTimeFormat(locale, {
      ...options,
      hourCycle: 'h12',
    })
    const twentyFourHour = new DateTimeFormat(locale, {
      ...options,
      hourCycle: 'h23',
    })
    expect(twelveHour.formatToParts(0)).toContainEqual({
      type: 'hour',
      value: '12',
    })
    expect(
      twelveHour.formatToParts(0).find(part => part.type === 'dayPeriod')
    ).toBeDefined()
    const parts = twentyFourHour.formatToParts(0)
    expect(Number(parts.find(part => part.type === 'hour')?.value)).toBe(0)
    expect(parts.find(part => part.type === 'dayPeriod')).toBeUndefined()
    const withPeriod = new DateTimeFormat(locale, {
      ...options,
      hourCycle: 'h23',
      dayPeriod: 'long',
    })
    expect(withPeriod.formatToParts(0)).toEqual(parts)
    expect(withPeriod.resolvedOptions()).not.toHaveProperty('dayPeriod')
    expect(withPeriod.formatRangeToParts(0, 43200000)).toEqual(
      twentyFourHour.formatRangeToParts(0, 43200000)
    )
  })

  it('uses explicitly supplied ISO locale patterns', () => {
    const original = DateTimeFormat.localeData.en
    try {
      DateTimeFormat.__addLocaleData({
        ...en,
        data: {
          ...en.data,
          formats: {...en.data.formats, iso8601: en.data.formats.gregory},
          calendarData: {},
        },
      } as any)
      const gregorian = new DateTimeFormat('en', {timeZone: 'UTC'})
      const iso = new DateTimeFormat('en', {
        calendar: 'iso8601',
        timeZone: 'UTC',
      })
      expect(iso.resolvedOptions().calendar).toBe('iso8601')
      expect(iso.formatToParts(0)).toEqual(gregorian.formatToParts(0))
    } finally {
      DateTimeFormat.localeData.en = original
    }
  })

  it('does not mistake inherited properties for Temporal records', () => {
    const formatter = new DateTimeFormat('en', {timeZone: 'UTC'})
    const format = () => [
      formatter.format(0),
      formatter.formatToParts(0),
      formatter.formatRange(0, 86400000),
      formatter.formatRangeToParts(0, 86400000),
    ]
    const expected = format()
    const previous = Object.getOwnPropertyDescriptor(Object.prototype, 'kind')
    let actual
    try {
      Object.defineProperty(Object.prototype, 'kind', {
        configurable: true,
        get() {
          throw new Error('inherited kind read')
        },
      })
      actual = format()
    } finally {
      if (previous) Object.defineProperty(Object.prototype, 'kind', previous)
      else Reflect.deleteProperty(Object.prototype, 'kind')
    }
    expect(actual).toEqual(expected)
  })

  it.each(['gregory', 'chinese'])(
    'parses cold %s formats without inherited setters',
    calendar => {
      const original = DateTimeFormat.localeData.en
      DateTimeFormat.__addLocaleData(en as any)
      const keys = ['hour', 'dayPeriod', '1']
      const descriptors = keys.map(key =>
        Object.getOwnPropertyDescriptor(Object.prototype, key)
      )
      let failure: unknown
      let value: unknown
      try {
        for (const key of keys)
          Object.defineProperty(Object.prototype, key, {
            configurable: true,
            set() {
              throw new Error(`inherited setter: ${key}`)
            },
          })
        value = new DateTimeFormat('en', {
          calendar,
          timeZone: 'UTC',
          hour: 'numeric',
          dayPeriod: 'long',
        })
      } catch (error) {
        failure = error
      } finally {
        for (let i = 0; i < keys.length; i++) {
          const descriptor = descriptors[i]
          if (descriptor)
            Object.defineProperty(Object.prototype, keys[i], descriptor)
          else Reflect.deleteProperty(Object.prototype, keys[i])
        }
        DateTimeFormat.localeData.en = original
      }
      expect(failure).toBeUndefined()
      expect(value).toBeInstanceOf(DateTimeFormat)
    }
  )

  it.each(['UTC', '+0530', '-00'] as const)(
    'preserves legacy RegExp statics when constructing with %s',
    timeZone => {
      DateTimeFormat.__addLocaleData(en as any)
      ;/sent(inel)/.exec('sentinel')
      const before = [RegExp.lastMatch, RegExp.$1]
      new DateTimeFormat('en', {year: 'numeric', month: 'long', timeZone})
      const after = [RegExp.lastMatch, RegExp.$1]
      expect(after).toEqual(before)
    }
  )
  it.each(['exotic', 'ordinary'] as const)(
    'numeric formatting avoids private %s coercion hooks',
    kind => {
      const formatter = new DateTimeFormat('en', {timeZone: 'UTC'})
      const runs = [
        () => formatter.format(1.9),
        () => formatter.formatToParts(1.9),
        () => formatter.formatRange(-1.9, 1.9),
        () => formatter.formatRangeToParts(-1.9, 1.9),
      ]
      const expected = runs.map(run => run())
      const key = kind === 'exotic' ? Symbol.toPrimitive : 'valueOf'
      const original = Object.getOwnPropertyDescriptor(Object.prototype, key)
      let actual: unknown
      try {
        Object.defineProperty(Object.prototype, key, {
          configurable: true,
          get() {
            throw new Error('Private timestamp coercion reached')
          },
        })
        actual = runs.map(run => run())
      } finally {
        if (original) Object.defineProperty(Object.prototype, key, original)
        else Reflect.deleteProperty(Object.prototype, key)
      }
      expect(actual).toEqual(expected)
    }
  )

  it.each(['format', 'formatToParts'] as const)(
    '%s reads current time without mutable Date.now',
    method => {
      const formatter = new DateTimeFormat('en', {timeZone: 'UTC'})
      const before = JSON.stringify(formatter[method](Date.now()))
      const original = Object.getOwnPropertyDescriptor(Date, 'now')!
      let actual: unknown
      try {
        Object.defineProperty(Date, 'now', {
          configurable: true,
          get() {
            throw new Error('Mutable timestamp clock reached')
          },
        })
        actual = formatter[method]()
      } finally {
        Object.defineProperty(Date, 'now', original)
      }
      const after = JSON.stringify(formatter[method](Date.now()))
      expect([before, after]).toContain(JSON.stringify(actual))
    }
  )

  it('rejects values one millisecond beyond the exact TimeClip bounds', () => {
    const dtf = new DateTimeFormat('en', {timeZone: 'UTC'})
    const limit = 8_640_000_000_000_000
    for (const sign of [-1, 1]) {
      const boundary = sign * limit
      const outside = sign * (limit + 1)
      expect(() => dtf.format(outside)).toThrow(RangeError)
      expect(() => dtf.formatToParts(outside)).toThrow(RangeError)
      expect(() => dtf.formatRange(outside, outside)).toThrow(RangeError)
      expect(() => dtf.formatRangeToParts(outside, outside)).toThrow(RangeError)
      expect(typeof dtf.format(boundary)).toBe('string')
      const offset = new DateTimeFormat('en', {
        timeZone: sign < 0 ? '-23:59' : '+23:59',
      })
      expect(typeof offset.format(boundary)).toBe('string')
    }
  })

  it('requires internal slots before argument coercion', () => {
    const forged = Object.create(DateTimeFormat.prototype)
    const value = {
      valueOf() {
        throw new Error('coerced')
      },
    }
    expect(() => forged.format).toThrow(TypeError)
    expect(() => forged.resolvedOptions()).toThrow(TypeError)
    for (const method of [
      'formatToParts',
      'formatRange',
      'formatRangeToParts',
    ] as const) {
      expect(() =>
        Reflect.apply(DateTimeFormat.prototype[method], forged, [value, value])
      ).toThrow(TypeError)
    }
    const real = new DateTimeFormat('en', {timeZone: 'UTC'})
    const format = Object.getOwnPropertyDescriptor(
      DateTimeFormat.prototype,
      'format'
    )!.get!
    Object.setPrototypeOf(real, null)
    expect(() => format.call(real)(0)).not.toThrow()
    expect(DateTimeFormat.prototype.resolvedOptions.call(real).locale).toBe(
      'en'
    )
  })

  it('returns resolved option properties in specification order', () => {
    expect(
      Object.getOwnPropertyDescriptor(DateTimeFormat, 'prototype')?.writable
    ).toBe(false)
    expect(
      Object.keys(
        new DateTimeFormat('en', {
          timeZone: 'UTC',
          timeStyle: 'short',
          dateStyle: 'short',
        }).resolvedOptions()
      )
    ).toEqual([
      'locale',
      'calendar',
      'numberingSystem',
      'timeZone',
      'hourCycle',
      'hour12',
      'dateStyle',
      'timeStyle',
    ])
    const keys = Object.keys(
      new DateTimeFormat('en', {
        timeZone: 'UTC',
        hour: 'numeric',
        minute: 'numeric',
      }).resolvedOptions()
    )
    expect(keys.indexOf('hour12')).toBe(keys.indexOf('hourCycle') + 1)
    expect(keys.indexOf('hour')).toBeGreaterThan(keys.indexOf('hour12'))
  })

  it('formats astronomical year zero as 1 BC', () => {
    const dtf = new DateTimeFormat('en', {
      timeZone: 'UTC',
      year: 'numeric',
      era: 'short',
    })
    for (const [year, expectedYear, era] of [
      [-1, '2', 'BC'],
      [0, '1', 'BC'],
      [1, '1', 'AD'],
    ] as const) {
      const date = new Date(0)
      date.setUTCFullYear(year, 0, 1)
      const parts = dtf.formatToParts(date)
      expect(parts.find(part => part.type === 'era')?.value).toBe(era)
      expect(parts.find(part => part.type === 'year')?.value).toBe(expectedYear)
    }
  })

  it('normalizes zero offsets and rejects non-ASCII timezone lookalikes', () => {
    for (const timeZone of ['-00', '-0000', '-00:00', '+00']) {
      expect(
        new DateTimeFormat('en', {timeZone}).resolvedOptions().timeZone
      ).toBe('+00:00')
    }
    expect(
      new DateTimeFormat('en', {timeZone: 'asia/baku'}).resolvedOptions()
        .timeZone
    ).toBe('Asia/Baku')
    expect(() => new DateTimeFormat('en', {timeZone: 'asıa/baku'})).toThrow(
      RangeError
    )
  })

  it('reads each constructor option once in specification order', () => {
    const reads: PropertyKey[] = []
    const options = new Proxy(
      {timeZone: 'UTC'},
      {
        get(target, key, receiver) {
          reads.push(key)
          return Reflect.get(target, key, receiver)
        },
      }
    )
    new DateTimeFormat('en', options)
    expect(reads).toEqual([
      'localeMatcher',
      'calendar',
      'numberingSystem',
      'hour12',
      'hourCycle',
      'timeZone',
      'weekday',
      'era',
      'year',
      'month',
      'day',
      'dayPeriod',
      'hour',
      'minute',
      'second',
      'fractionalSecondDigits',
      'timeZoneName',
      'formatMatcher',
      'dateStyle',
      'timeStyle',
    ])
    const frozen = Object.freeze({timeZone: 'UTC'})
    expect(new DateTimeFormat('en', frozen).format(0)).toBe('1/1/1970')
  })

  it.each(['basic', 'best fit'] as const)(
    'uses private default fields with the %s matcher',
    formatMatcher => {
      const {prototype} = Array
      const original = Object.getOwnPropertyDescriptor(
        prototype,
        Symbol.iterator
      )!
      const reject = () => {
        throw new Error('Private date-time fields used the Array iterator')
      }
      let formatter: InstanceType<typeof DateTimeFormat>
      try {
        formatter = new DateTimeFormat('en', {
          timeZone: 'UTC',
          formatMatcher,
          get timeStyle() {
            Object.defineProperty(prototype, Symbol.iterator, {
              ...original,
              value: reject,
            })
            return undefined
          },
        })
      } finally {
        Object.defineProperty(prototype, Symbol.iterator, original)
      }
      expect(formatter.format(0)).toBe('1/1/1970')
    }
  )

  it.each([
    ['basic', {year: 'numeric', formatMatcher: 'basic'}],
    ['best fit', {year: 'numeric', formatMatcher: 'best fit'}],
    ['date style', {dateStyle: 'short'}],
    ['combined styles', {dateStyle: 'short', timeStyle: 'short'}],
    ['style hour-cycle match', {timeStyle: 'short', hourCycle: 'h23'}],
  ] as const)(
    'keeps %s constructor precision records private',
    (_name, fields) => {
      const options = {
        __proto__: null,
        ...fields,
        timeZone: 'UTC',
        fractionalSecondDigits: undefined,
      } as const
      const expected = new DateTimeFormat('en', options).formatToParts(0)
      const original = Object.getOwnPropertyDescriptor(
        Object.prototype,
        'fractionalSecondDigits'
      )
      let calls = 0,
        actual: InstanceType<typeof DateTimeFormat> | undefined,
        error: unknown
      try {
        Object.defineProperty(Object.prototype, 'fractionalSecondDigits', {
          configurable: true,
          get() {
            calls++
            throw new Error('Inherited private constructor precision')
          },
        })
        actual = new DateTimeFormat('en', options)
      } catch (caught) {
        error = caught
      } finally {
        if (original)
          Object.defineProperty(
            Object.prototype,
            'fractionalSecondDigits',
            original
          )
        else Reflect.deleteProperty(Object.prototype, 'fractionalSecondDigits')
      }
      expect(calls).toBe(0)
      expect(error).toBeUndefined()
      expect(actual!.formatToParts(0)).toEqual(expected)
    }
  )

  it.each([
    ['Object.create', Object, 'create'],
    ['Object.keys', Object, 'keys'],
    ['Array.find', Array.prototype, 'find'],
    ['Array.map', Array.prototype, 'map'],
    ['Array.join', Array.prototype, 'join'],
    ['Array iterator', Array.prototype, Symbol.iterator],
    ['String.replace', String.prototype, 'replace'],
    ['String @@replace', String.prototype, Symbol.replace],
    [
      'opposite hour-cycle iterator',
      Array.prototype,
      Symbol.iterator,
      'en',
      'short',
      'h23',
    ],
    ['numeric medium date lookup', Array.prototype, 'find', 'ja', 'medium'],
    [
      'numeric medium date inherited weekday',
      Object.prototype,
      'weekdayStandalone',
      'ja',
      'medium',
      undefined,
      true,
    ],
  ] as const)(
    'keeps combined style construction private from %s',
    (
      _name,
      target,
      key,
      locale = 'en',
      dateStyle: 'short' | 'medium' = 'short',
      hourCycle?: 'h23',
      getter: boolean = false
    ) => {
      const fields = {
        timeZone: 'UTC',
        dateStyle,
        timeStyle: 'short',
        hourCycle,
      } as const
      const baseline = new DateTimeFormat(locale, fields)
      const expectedDate = baseline.formatRangeToParts(0, 86400000)
      const expectedTime = baseline.formatRangeToParts(0, 3600000)
      const original = Object.getOwnPropertyDescriptor(target, key)
      const sentinel = new Error('Private combined style operation')
      let calls = 0,
        reads = 0,
        actual: InstanceType<typeof DateTimeFormat> | undefined,
        error: unknown
      try {
        actual = new DateTimeFormat(locale, {
          timeZone: 'UTC',
          dateStyle,
          hourCycle,
          get timeStyle() {
            reads++
            const reject = () => {
              calls++
              throw sentinel
            }
            Object.defineProperty(target, key, {
              configurable: true,
              ...(getter ? {get: reject} : {...original, value: reject}),
            })
            return 'short' as const
          },
        })
      } catch (caught) {
        error = caught
      } finally {
        if (original) Object.defineProperty(target, key, original)
        else Reflect.deleteProperty(target, key)
      }
      expect(reads).toBe(1)
      expect(calls).toBe(0)
      expect(error).toBeUndefined()
      expect(actual!.formatRangeToParts(0, 86400000)).toEqual(expectedDate)
      expect(actual!.formatRangeToParts(0, 3600000)).toEqual(expectedTime)
    }
  )

  it('reads inherited public precision once before private matching', () => {
    let reads = 0
    const options = Object.assign(
      Object.create({
        get fractionalSecondDigits() {
          reads++
          return 1
        },
      }),
      {timeZone: 'UTC', second: 'numeric'}
    )
    const formatter = new DateTimeFormat('en', options)
    expect(reads).toBe(1)
    expect(formatter.formatToParts(123)).toContainEqual({
      type: 'fractionalSecond',
      value: '1',
    })
    expect(reads).toBe(1)
  })

  it.each(['day', 'timeZone'])(
    'isolates internal records and resolved options from inherited %s setters',
    property => {
      const original = Object.getOwnPropertyDescriptor(
        Object.prototype,
        property
      )
      Object.defineProperty(Object.prototype, property, {
        configurable: true,
        set() {
          throw new Error('inherited day setter')
        },
      })
      try {
        const dtf = new DateTimeFormat('en', {timeZone: 'UTC'})
        expect(dtf.format(0)).toBe('1/1/1970')
        expect(dtf.resolvedOptions().timeZone).toBe('UTC')
      } finally {
        if (original)
          Object.defineProperty(Object.prototype, property, original)
        else Reflect.deleteProperty(Object.prototype, property)
      }
    }
  )

  it('accepts every hour cycle through options and Unicode extensions', () => {
    expect(
      new DateTimeFormat('ar-u-hc-h11', {
        hour: 'numeric',
        hour12: true,
        hourCycle: 'h24',
      }).resolvedOptions().locale
    ).toBe('ar')
    for (const hourCycle of ['h11', 'h12', 'h23', 'h24'] as const) {
      for (const locale of ['en', 'ar', 'ja']) {
        const options = {timeZone: 'UTC', hour: 'numeric'} as const
        expect(
          new DateTimeFormat(locale, {...options, hourCycle}).resolvedOptions()
            .hourCycle
        ).toBe(hourCycle)
        expect(
          new DateTimeFormat(
            `${locale}-u-hc-${hourCycle}`,
            options
          ).resolvedOptions().hourCycle
        ).toBe(hourCycle)
      }
    }
  })

  it('uses independent locale preferences for hour12', () => {
    for (const [locale, hourCycle12] of [
      ['en', 'h12'],
      ['fr', 'h12'],
      ['ja', 'h11'],
    ] as const) {
      expect(
        new DateTimeFormat(locale, {
          hour: 'numeric',
          hour12: true,
        }).resolvedOptions().hourCycle
      ).toBe(hourCycle12)
      expect(
        new DateTimeFormat(locale, {
          hour: 'numeric',
          hour12: false,
        }).resolvedOptions().hourCycle
      ).toBe('h23')
    }
  })

  it('supports ISO 8601 without advertising unimplemented calendars', () => {
    const date = Date.UTC(2020, 0, 2)
    const options = {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    } as const
    const iso = new DateTimeFormat('en-u-ca-iso8601', options)
    const gregory = new DateTimeFormat('en', {...options, calendar: 'gregory'})
    expect(iso.resolvedOptions().calendar).toBe('iso8601')
    expect(iso.format(date)).toBe('2020-01-02')
    expect(gregory.format(date)).toBe('01/02/2020')
    const unsupported = new DateTimeFormat('en', {
      ...options,
      calendar: 'unknown',
    })
    expect(unsupported.resolvedOptions().calendar).toBe('gregory')
    expect(unsupported.format(date)).toBe(gregory.format(date))
  })

  it('smoke test EST', function () {
    expect(
      new DateTimeFormat('en', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'long',
        timeZone: 'America/New_York',
      }).format(new Date(0))
    ).toBe('12/31/1969, 7:00:00 PM Eastern Standard Time')
  })
  it('en-GB default resolvedOptions, GH #1951', function () {
    expect(
      new DateTimeFormat('en-GB', {timeZone: 'UTC'}).resolvedOptions()
    ).toEqual({
      calendar: 'gregory',
      day: '2-digit',
      locale: 'en-GB',
      month: '2-digit',
      numberingSystem: 'latn',
      timeZone: 'UTC',
      year: 'numeric',
    })
  })
  it('en-GB default format, GH #1951', function () {
    expect(
      new DateTimeFormat('en-GB', {timeZone: 'UTC'}).format(new Date(0))
    ).toBe('01/01/1970')
  })
  it('resolvedOptions includes fractionalSecondDigits and dayPeriod', function () {
    const dtf = new DateTimeFormat('en', {
      fractionalSecondDigits: 3,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      dayPeriod: 'short',
      timeZone: 'UTC',
    })

    expect(dtf.resolvedOptions()).toMatchObject({
      dayPeriod: 'short',
      fractionalSecondDigits: 3,
    })
    expect(dtf.format(new Date(Date.UTC(2020, 0, 1, 10, 1, 2, 345)))).toBe(
      '10:01:02.345 in the morning'
    )
  })
  it('accepts hyphenated Unicode calendar type identifiers', function () {
    expect(
      new DateTimeFormat('en', {
        calendar: 'islamic-civil',
        timeZone: 'UTC',
      }).resolvedOptions().calendar
    ).toBe('islamic-civil')
  })
  it('smoke test CST', function () {
    expect(
      new DateTimeFormat('en', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'long',
        timeZone: 'Asia/Shanghai',
      }).format(new Date(0))
    ).toBe('1/1/1970, 8:00:00 AM China Standard Time')
  })
  it('CST w/ undefined TZ', function () {
    const {TZ} = process.env
    process.env.TZ = undefined
    expect(
      new DateTimeFormat('en', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'long',
        timeZone: 'Asia/Shanghai',
      }).format(new Date(0))
    ).toBe('1/1/1970, 8:00:00 AM China Standard Time')
    process.env.TZ = TZ
  })
  it('smoke test for #1915', function () {
    const {TZ} = process.env
    process.env.TZ = undefined
    expect(
      new DateTimeFormat('zh-Hans', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }).format(new Date(0))
    ).toBe('1月1日星期四')
    process.env.TZ = TZ
  })
  it('test for GH issue #1915', function () {
    expect(
      new DateTimeFormat('en', {
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'Asia/Shanghai',
      }).format(new Date(0))
    ).toBe('8:00\u202fAM')
  })
  it('uses the host zone when its data is loaded and respects overrides', () => {
    const previous = process.env.TZ
    process.env.TZ = 'America/New_York'
    try {
      DateTimeFormat.__setDefaultTimeZone()
      const options = {hour: 'numeric', minute: 'numeric'} as const
      const host = new Intl.DateTimeFormat().resolvedOptions().timeZone
      // Node applies TZ changes to its host formatter. Hermes uses the
      // embedding's system zone through its installed host services.
      if (process.versions?.node) expect(host).toBe('America/New_York')
      const formatter = new DateTimeFormat('en', options)
      expect(formatter.resolvedOptions().timeZone).toBe(host)
      expect(formatter.format(0)).toBe(
        new DateTimeFormat('en', {...options, timeZone: host}).format(0)
      )

      DateTimeFormat.__setDefaultTimeZone('UTC')
      expect(new DateTimeFormat('en', options).resolvedOptions().timeZone).toBe(
        'UTC'
      )

      DateTimeFormat.__setDefaultTimeZone()
      DateTimeFormat.__addTZData({...allData, zones: [], future: {}})
      expect(new DateTimeFormat('en', options).resolvedOptions().timeZone).toBe(
        'UTC'
      )
    } finally {
      if (previous === undefined) delete process.env.TZ
      else process.env.TZ = previous
      DateTimeFormat.__addTZData(allData)
    }
  })

  it('uses the system zone without reading public constructor properties', () => {
    const host = Intl.DateTimeFormat
    const hostZone = new host().resolvedOptions().timeZone
    const hostMarker = Object.getOwnPropertyDescriptor(host, 'polyfilled')
    const getDefaultTimeZone = Object.getOwnPropertyDescriptor(
      DateTimeFormat,
      'getDefaultTimeZone'
    )!
    const previousOverride = Object.getOwnPropertyDescriptor(
      DateTimeFormat,
      '__defaultTimeZone'
    )
    const throwingGetter = {
      configurable: true,
      get() {
        throw new Error('Read public constructor property')
      },
    }
    DateTimeFormat.__setDefaultTimeZone()

    try {
      Object.defineProperty(host, 'polyfilled', throwingGetter)
      Object.defineProperty(
        DateTimeFormat,
        'getDefaultTimeZone',
        throwingGetter
      )
      Object.defineProperty(DateTimeFormat, '__defaultTimeZone', throwingGetter)
      expect(new DateTimeFormat('en').resolvedOptions().timeZone).toBe(hostZone)
      const formatter = new DateTimeFormat('en', {timeZone: 'UTC'})
      expect(formatter.formatToParts(0)).toEqual([
        {type: 'month', value: '1'},
        {type: 'literal', value: '/'},
        {type: 'day', value: '1'},
        {type: 'literal', value: '/'},
        {type: 'year', value: '1970'},
      ])
    } finally {
      if (hostMarker) Object.defineProperty(host, 'polyfilled', hostMarker)
      else Reflect.deleteProperty(host, 'polyfilled')
      Object.defineProperty(
        DateTimeFormat,
        'getDefaultTimeZone',
        getDefaultTimeZone
      )
      if (previousOverride)
        Object.defineProperty(
          DateTimeFormat,
          '__defaultTimeZone',
          previousOverride
        )
      else Reflect.deleteProperty(DateTimeFormat, '__defaultTimeZone')
    }
  })

  it('formats UTC without a packed row or inherited time-zone data', () => {
    const previous = Object.getOwnPropertyDescriptor(Object.prototype, 'UTC')
    DateTimeFormat.__addTZData({...allData, zones: [], future: {}})
    try {
      Object.defineProperty(Object.prototype, 'UTC', {
        configurable: true,
        get() {
          throw new Error('Read inherited UTC zone data')
        },
      })
      const formatter = new DateTimeFormat('en', {
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
      expect(formatter.format(0)).toBe('00:00')
      expect(formatter.format(3_600_000)).toBe('01:00')
    } finally {
      if (previous) Object.defineProperty(Object.prototype, 'UTC', previous)
      else Reflect.deleteProperty(Object.prototype, 'UTC')
      DateTimeFormat.__addTZData(allData)
    }
  })

  it('setDefaultTimeZone should work', function () {
    DateTimeFormat.__setDefaultTimeZone('Asia/Shanghai')
    expect(
      new DateTimeFormat('en', {
        hour: 'numeric',
        minute: 'numeric',
      }).format(new Date(0))
    ).toBe('8:00\u202fAM')
  })

  it('America/Indiana/Indianapolis, GH #4254', function () {
    DateTimeFormat.__setDefaultTimeZone('America/Indiana/Indianapolis')
    expect(
      new DateTimeFormat('en', {
        hour: 'numeric',
        minute: 'numeric',
      }).format(new Date(0))
    ).toBe('7:00\u202fPM')
  })
  it('diff tz should yield different result', function () {
    const {TZ} = process.env
    process.env.TZ = undefined
    const now = new Date()
    expect(
      new DateTimeFormat('en', {
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'Asia/Shanghai',
      }).format(now)
    ).not.toBe(
      new DateTimeFormat('en', {
        hour: 'numeric',
        minute: 'numeric',
      }).format(now)
    )
    process.env.TZ = TZ
  })
  it('month: long', function () {
    expect(
      new DateTimeFormat('en', {
        month: 'long',
      }).format(new Date(0))
    ).toBe('January')
  })
  it('negative ts', function () {
    expect(
      new DateTimeFormat('en', {weekday: 'short', timeZone: 'UTC'}).format(
        new Date(1899, 1, 1)
      )
    ).toBe('Wed')
  })
  it('test #2106', function () {
    expect(
      new DateTimeFormat('en', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Amsterdam',
      }).format(new Date('2020-09-16T11:55:32.491+02:00'))
    ).toBe('11:55 AM')
  })
  it.skip('test #2145', function () {
    expect(
      new DateTimeFormat('fa', {
        month: 'long',
        year: '2-digit',
        day: '2-digit',
      }).format(new Date('2020-09-16T11:55:32.491+02:00'))
    ).toBe('۲۶ شهریور ۹۹')
  })
  it('falls back to Gregorian for locales with an unsupported default calendar', () => {
    const options = {
      month: 'long',
      year: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    } as const
    const formatter = new DateTimeFormat('fa', options)
    const gregory = new DateTimeFormat('fa', {...options, calendar: 'gregory'})
    const date = new Date('2020-09-16T11:55:32.491+02:00')
    expect(formatter.resolvedOptions().calendar).toBe('gregory')
    expect(formatter.format(date)).toBe(gregory.format(date))
  })
  it('test #2192', function () {
    expect(
      new DateTimeFormat('en', {
        calendar: 'gregory',
        numberingSystem: 'latn',
        timeZone: 'Africa/Johannesburg', // UTC+2
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      }).format(Date.UTC(2020, 0, 1, 12, 0, 0))
    ).toBe('1/1/2020, 2:00:00\u202fPM')
  })
  it('respects numberingSystem with locales that default to non-latn digits, GH #6767', function () {
    for (const locale of ['my-MM', 'bn-BD', 'ne-NP']) {
      const formatter = new DateTimeFormat(locale, {
        numberingSystem: 'latn',
        timeZone: 'UTC',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      })
      const formatted = formatter.format(Date.UTC(2020, 0, 2))

      expect(formatter.resolvedOptions().numberingSystem).toBe('latn')
      expect(formatted).toMatch(/[0-9]/)
      expect(formatted).not.toMatch(
        /[\u1040-\u1049\u09e6-\u09ef\u0966-\u096f]/u
      )
    }
  })
  it('uses ar-EG numbering system when ar-EG locale data is loaded, GH #6912', function () {
    const formatter = new DateTimeFormat('ar-EG', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    })

    expect(formatter.resolvedOptions()).toMatchObject({
      locale: 'ar-EG',
      numberingSystem: 'arab',
    })
    expect(formatter.format(new Date('2007-03-21T21:26:00Z'))).toBe(
      'الأربعاء، ٢١ مارس'
    )
  })
  it('test #2170', function () {
    const formatter = new DateTimeFormat('en-GB', {
      calendar: 'gregory',
      hour: 'numeric',
      hourCycle: 'h23',
      timeZone: 'Europe/Berlin',
    })
    expect(formatter.format(new Date('2019-03-31T00:59:59.999Z'))).toBe('01')
    expect(formatter.format(new Date('2019-03-31T01:00:00.000Z'))).toBe('03')
    expect(formatter.format(new Date('2019-03-31T01:00:00.001Z'))).toBe('03')

    expect(formatter.format(new Date('2019-10-27T00:59:59.999Z'))).toBe('02')
    expect(formatter.format(new Date('2019-10-27T01:00:00.000Z'))).toBe('02')
    expect(formatter.format(new Date('2019-10-27T01:00:00.001Z'))).toBe('02')
  })
  it.each([
    ['America/Edmonton', '2026-11-01T09:00:00Z', '03:00'],
    ['Africa/Casablanca', '2026-09-20T02:00:00Z', '02:00'],
  ])('uses tzdb 2026c rules for %s, GH #6851', (timeZone, date, expected) => {
    const formatter = new DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone,
    })

    expect(formatter.format(new Date(date))).toBe(expected)
  })
  it.each([
    ['2026-11-01T07:59:59Z', '01:59:59'],
    ['2026-11-01T08:00:00Z', '02:00:00'],
    ['2027-01-15T12:00:00Z', '06:00:00'],
    ['2027-07-15T12:00:00Z', '06:00:00'],
  ])('keeps Inuvik on UTC-06 at %s, GH #7387', (date, expected) => {
    const formatter = new DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      timeZone: 'America/Inuvik',
    })

    expect(formatter.format(new Date(date))).toBe(expected)
  })
  it.each(['America/Winnipeg', 'Canada/Central'])(
    'keeps %s on UTC-05 after Manitoba ends DST, GH #7529',
    timeZone => {
      const formatter = new DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
        timeZone,
      })

      for (const [date, expected] of [
        ['2026-11-01T06:59:59Z', '01:59:59'],
        ['2026-11-01T07:00:00Z', '02:00:00'],
        ['2027-01-15T12:00:00Z', '07:00:00'],
        ['2027-07-15T12:00:00Z', '07:00:00'],
      ]) {
        expect(formatter.format(new Date(date))).toBe(expected)
      }
    }
  )
  it.each(['America/Havana', 'Cuba'])(
    'uses tzdb 2026f Cuba transitions for %s',
    timeZone => {
      const formatter = new DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
        timeZone,
      })
      for (const [date, expected] of [
        ['2026-11-01T04:59:59Z', '00:59:59'],
        ['2026-11-01T05:00:00Z', '01:00:00'],
        ['2027-01-15T12:00:00Z', '08:00:00'],
        ['2027-11-07T04:59:59Z', '00:59:59'],
        ['2027-11-07T05:00:00Z', '00:00:00'],
      ]) {
        expect(formatter.format(new Date(date))).toBe(expected)
      }
    }
  )
  it.each([
    ['1965-03-31T03:00:00Z', '01:00:00'],
    ['1965-04-01T01:59:59Z', '23:59:59'],
    ['1965-04-01T02:00:00Z', '23:00:00'],
    ['1966-03-01T02:59:59Z', '00:59:59'],
    ['1966-03-01T03:00:00Z', '00:00:00'],
  ])('uses corrected Brazil transitions at %s', (date, expected) => {
    const formatter = new DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      timeZone: 'America/Sao_Paulo',
    })
    expect(formatter.format(new Date(date))).toBe(expected)
  })
  it.each([
    ['1925-09-20T01:59:59Z', '02:59:59'],
    ['1925-09-20T02:00:00Z', '02:00:00'],
    ['1925-09-27T12:00:00Z', '12:00:00'],
  ])('uses Ireland’s corrected 1925 fallback at %s', (date, expected) => {
    const formatter = new DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      timeZone: 'Europe/Dublin',
    })

    expect(formatter.format(new Date(date))).toBe(expected)
  })
  it('test #2236', function () {
    const date = new Date('2020-09-16T11:55:32.491+02:00')
    const formatter = new DateTimeFormat('en-US', {
      year: undefined,
      month: undefined,
      day: undefined,
      hour: '2-digit',
      minute: '2-digit',
      second: undefined,
      timeZoneName: 'short',
      timeZone: 'Europe/Amsterdam',
    })
    expect(formatter.format(date)).toBe('11:55 AM GMT+2')
  })
  it('test #2291', function () {
    const date = new Date(2020, 1, 1, 10, 10, 10, 0)
    const dtf = new DateTimeFormat('zh-Hans', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      hourCycle: 'h12',
      localeMatcher: 'lookup',
      formatMatcher: 'best fit',
      timeZone: 'Asia/Kuala_Lumpur',
    })
    expect(dtf.format(date)).toBe('2020年2月01日 下午06:10:10')
  })

  describe('Basic matcher', function () {
    const date = new Date(2020, 1, 1, 10, 10, 10, 0)

    describe('timeZoneName', () => {
      const timezoneTests: Array<{
        timeZoneName: NonNullable<Intl.DateTimeFormatOptions['timeZoneName']>
        results: Record<string, string>
      }> = [
        {
          timeZoneName: 'long',
          results: {
            en: 'Singapore Standard Time',
            'zh-Hans': '新加坡标准时间',
          },
        },
        {
          timeZoneName: 'short',
          results: {
            en: 'GMT+8',
            'zh-Hans': 'GMT+8',
          },
        },
        {
          timeZoneName: 'longGeneric',
          results: {
            en: 'Singapore Standard Time',
            'zh-Hans': '新加坡标准时间',
          },
        },
        {
          timeZoneName: 'shortGeneric',
          results: {
            en: 'Singapore Time',
            'zh-Hans': '新加坡时间',
          },
        },
        {
          timeZoneName: 'longOffset',
          results: {
            en: 'GMT+08:00',
            'zh-Hans': 'GMT+08:00',
          },
        },
        {
          timeZoneName: 'shortOffset',
          results: {
            en: 'GMT+8',
            'zh-Hans': 'GMT+8',
          },
        },
      ]

      timezoneTests.forEach(({timeZoneName, results}) => {
        describe(`timeZoneName ${timeZoneName}`, () => {
          Object.keys(results).forEach(locale => {
            it(`locale ${locale}`, () => {
              const dtf = new DateTimeFormat(locale, {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
                hourCycle: 'h12',
                localeMatcher: 'lookup',
                timeZone: 'Asia/Kuala_Lumpur',
                formatMatcher: 'basic',
                timeZoneName,
              })
              expect(dtf.resolvedOptions().timeZoneName).toBe(timeZoneName)
              expect(
                dtf
                  .formatToParts(date)
                  .find(part => part.type === 'timeZoneName')
              ).toEqual({
                type: 'timeZoneName',
                value: results[locale],
              })
            })
          })
        })
      })
    })
  })

  it('test #2609, should handle Etc/GMT-14 short', function () {
    const date = new Date(2020, 1, 1, 10, 10, 10, 0)
    const dtf = new DateTimeFormat('zh-Hans', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      hourCycle: 'h12',
      localeMatcher: 'lookup',
      formatMatcher: 'best fit',
      timeZone: 'Etc/GMT-14',
      timeZoneName: 'short',
    })
    expect(dtf.format(date)).toContain('GMT+14')
  })
  it('test #2609, should handle Etc/GMT-14 long', function () {
    const date = new Date(2020, 1, 1, 10, 10, 10, 0)
    const dtf = new DateTimeFormat('zh-Hans', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      hourCycle: 'h12',
      localeMatcher: 'lookup',
      formatMatcher: 'best fit',
      timeZone: 'Etc/GMT-14',
      timeZoneName: 'long',
    })
    expect(dtf.format(date)).toContain('GMT+14:00')
  })

  describe('UTC offset timezones (issue #4804)', function () {
    it('should accept +01:00 offset timezone', function () {
      const dtf = new DateTimeFormat('en-GB', {
        timeZone: '+01:00',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      })
      // Unix epoch (Jan 1, 1970 00:00:00 UTC) should be 01:00:00 at +01:00
      expect(dtf.format(new Date(0))).toBe('01/01/1970, 01:00')
    })

    it('should accept -05:00 offset timezone', function () {
      const dtf = new DateTimeFormat('en-GB', {
        timeZone: '-05:00',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      })
      // Unix epoch should be Dec 31, 1969 19:00:00 at -05:00
      expect(dtf.format(new Date(0))).toBe('31/12/1969, 19:00')
    })

    it('should handle half-hour offset +05:30', function () {
      const dtf = new DateTimeFormat('en-GB', {
        timeZone: '+05:30',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      })
      // Unix epoch should be 05:30:00 at +05:30
      expect(dtf.format(new Date(0))).toBe('05:30')
    })

    it('should canonicalize offset formats in resolvedOptions', function () {
      // Test that various input formats are canonicalized to ±HH:MM
      const tests = [
        {input: '+01', expected: '+01:00'},
        {input: '+0100', expected: '+01:00'},
        {input: '+01:00', expected: '+01:00'},
        {input: '-05:30', expected: '-05:30'},
      ]

      tests.forEach(({input, expected}) => {
        const dtf = new DateTimeFormat('en-GB', {timeZone: input})
        expect(dtf.resolvedOptions().timeZone).toBe(expected)
      })
    })

    it('should reject invalid offset formats', function () {
      const invalidFormats = ['+24:00', '+01:60', '+1:00', '01:00']

      invalidFormats.forEach(timeZone => {
        expect(() => new DateTimeFormat('en-GB', {timeZone})).toThrow(
          RangeError
        )
      })
    })

    it('should work with @date-fns/tz pattern', function () {
      // This is the exact use case from issue #4804
      const dtf = new DateTimeFormat('en-GB', {
        timeZone: '+01:00',
        hour: 'numeric',
        timeZoneName: 'longOffset',
      })
      expect(() => dtf.format(new Date('2024-01-01T00:00:00Z'))).not.toThrow()
    })

    it('should handle UTC +00:00 offset', function () {
      const dtf = new DateTimeFormat('en-GB', {
        timeZone: '+00:00',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      })
      // Unix epoch should be Jan 1, 1970 00:00:00 at +00:00 (same as UTC)
      expect(dtf.format(new Date(0))).toBe('01/01/1970, 00:00')
    })

    it('should produce same output as UTC for +00:00', function () {
      const date = new Date('2024-01-01T12:00:00Z')
      const dtfOffset = new DateTimeFormat('en-GB', {
        timeZone: '+00:00',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      })
      const dtfUTC = new DateTimeFormat('en-GB', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      })
      expect(dtfOffset.format(date)).toBe(dtfUTC.format(date))
    })
  })

  it('range with ymdhM', function () {
    const date1 = new Date(Date.UTC(2021, 4, 19, 9, 0)) // "May 19, 2021, 9 AM"
    const date2 = new Date(Date.UTC(2021, 5, 19, 17, 0)) // "Jun 19, 2021, 5 PM"
    const dtf = new DateTimeFormat('en', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'America/New_York',
    })
    expect(dtf.formatRange(date1, date2)).toBe(
      '5/19/2021, 5:00\u202fAM – 6/19/2021, 1:00\u202fPM'
    )
  })
  it('GH issue #2909', function () {
    const date1 = new Date(Date.UTC(2021, 4, 19, 9, 0)) // "May 19, 2021, 9 AM"
    const date2 = new Date(Date.UTC(2021, 5, 19, 17, 0)) // "Jun 19, 2021, 5 PM"
    const dtf = new DateTimeFormat('en', {
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'America/New_York',
    })
    expect(() => dtf.formatRange(date1, date2)).not.toThrow()
  })
  it('GH issue #2951', function () {
    const date1 = new Date(Date.UTC(2021, 4, 19, 9, 0)) // "May 19, 2021, 9 AM"
    const dtf = new DateTimeFormat('en', {
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'Etc/UTC',
    })
    expect(() => dtf.format(date1)).not.toThrow()
  })
  it('GH issue #2915', function () {
    const date1 = new Date(Date.UTC(2021, 4, 19, 9, 0)) // "May 19, 2021, 9 AM"
    const date2 = new Date(Date.UTC(2021, 5, 19, 17, 0)) // "Jun 19, 2021, 5 PM"
    const dtf = new DateTimeFormat('en', {
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'America/New_York',
    })
    expect(dtf.formatRange(date1, date2)).toBe(
      '5/19/2021, 5:00\u202fAM – 6/19/2021, 1:00\u202fPM'
    )
  })
  it('toLocaleString returns "Invalid Date", GH #3508', function () {
    const date1 = new Date('')
    expect(date1.toLocaleString('en-US')).toBe('Invalid Date')
  })
  it('toLocaleString returns date and time with the default format, GH #3508', function () {
    const date1 = new Date(0)
    expect(date1.toLocaleString('en-US')).toMatch(
      /\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2}[ \u202f][AP]M/
    )
  })
  it('toLocaleTimeString returns "Invalid Date", GH #3508', function () {
    const date1 = new Date('')
    expect(date1.toLocaleTimeString('en-US')).toBe('Invalid Date')
  })
  it('toLocaleDateString returns "Invalid Date", GH #3508', function () {
    const date1 = new Date('')
    expect(date1.toLocaleDateString('en-US')).toBe('Invalid Date')
  })
  it('America/Detroit shows EDT/EST abbreviations, GH #4456', function () {
    const summer = new Date('2024-07-01T12:00:00Z')
    const winter = new Date('2024-01-01T12:00:00Z')

    const summerFmt = new DateTimeFormat('en', {
      timeZone: 'America/Detroit',
      timeZoneName: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
    }).format(summer)

    const winterFmt = new DateTimeFormat('en', {
      timeZone: 'America/Detroit',
      timeZoneName: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
    }).format(winter)

    // Should show EDT in summer and EST in winter, not GMT-4 or GMT-5
    expect(summerFmt).toContain('EDT')
    expect(winterFmt).toContain('EST')
  })
  it('America/Phoenix shows MST abbreviation, GH #4456', function () {
    const summer = new Date('2024-07-01T12:00:00Z')

    const summerFmt = new DateTimeFormat('en', {
      timeZone: 'America/Phoenix',
      timeZoneName: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
    }).format(summer)

    // Phoenix doesn't observe DST, so should show MST year-round, not GMT-7
    expect(summerFmt).toContain('MST')
  })

  it('formatRange with dateStyle and timeStyle, GH #4168', function () {
    // Bug: Using dateStyle/timeStyle causes "Cannot read property 'patternParts' of undefined"
    // when calling formatRange because rangePatterns.default is undefined
    const dtf = new DateTimeFormat('en', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'UTC',
    })

    const start = new Date('2023-01-15T10:00:00Z')
    const end = new Date('2023-01-15T14:00:00Z')

    // This should not throw "Cannot read property 'patternParts' of undefined"
    expect(() => dtf.formatRange(start, end)).not.toThrow()

    // Should format as a date range with time range
    const result = dtf.formatRange(start, end)
    expect(result).toBeTruthy()
    expect(result).toContain('10:00') // start time
    expect(result).toContain('2:00') // end time (14:00 UTC = 2:00 PM)
    expect(result).toContain('1/15/23') // date
  })

  it('formatRange with dateStyle/timeStyle different dates, GH #4168', function () {
    // Test with different dates to trigger the fallback pattern
    const start = new Date('2023-01-15T10:00:00Z')
    const end = new Date('2023-02-20T14:00:00Z')

    const dtfEn = new DateTimeFormat('en', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'UTC',
    })

    expect(() => dtfEn.formatRange(start, end)).not.toThrow()
    const resultEn = dtfEn.formatRange(start, end)

    // Verify it formats both dates correctly with the range separator
    // Native ICU output: "1/15/23, 6:00 AM – 2/20/23, 10:00 AM"
    // Note: Uses narrow no-break space (\u202f) before AM/PM
    // English uses en dash with thin spaces: "{0}\u2009–\u2009{1}" (U+2009 = thin space)
    expect(resultEn).toBe(
      '1/15/23, 10:00\u202fAM\u2009–\u20092/20/23, 2:00\u202fPM'
    )

    // Test Japanese locale which uses wave dash (～) instead of en dash (–)
    const dtfJa = new DateTimeFormat('ja', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'UTC',
    })

    expect(() => dtfJa.formatRange(start, end)).not.toThrow()
    const resultJa = dtfJa.formatRange(start, end)

    // Japanese uses wave dash without spaces: "{0}～{1}"
    // Native ICU output: "2023/01/15 10:00～2023/02/20 14:00"
    expect(resultJa).toBe('2023/01/15 10:00～2023/02/20 14:00')
  })

  it('Europe/London should show BST during daylight savings time, GH #5114', function () {
    // Issue #5114: DST timezone names not showing correctly for Europe/London
    // During British Summer Time (Mar-Oct), should show "BST" or "GMT+1", not "GMT"
    // This affects multiple locales including cy (Welsh) and en-GB

    DateTimeFormat.__setDefaultTimeZone('Europe/London')

    // Date during British Summer Time (July)
    const summerDate = new Date('2025-07-15T12:00:00Z')

    // Date during standard time (January)
    const winterDate = new Date('2025-01-15T12:00:00Z')

    // Test with en-GB locale
    const summerFmt = new DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(summerDate)

    const winterFmt = new DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(winterDate)

    expect(summerFmt).toBe('15 Jul 2025, 13:00 BST')
    expect(winterFmt).toBe('15 Jan 2025, 12:00 GMT')

    // Test with long timezone names
    const summerLong = new DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'long',
    }).format(summerDate)

    expect(summerLong).toBe('15 Jul 2025, 13:00 British Summer Time')
  })

  it('should support America/Coyhaique timezone from IANA 2025c, GH #5111', function () {
    // Issue #5111: IANA 2025c introduced new timezone America/Coyhaique
    // Chile's Aysén Region moves from -04/-03 to -03 year-round
    // This test will fail until timezone data is regenerated with IANA 2025c+

    // This should not throw RangeError: Invalid timeZoneName
    expect(() => {
      new DateTimeFormat('en-US', {
        timeZone: 'America/Coyhaique',
        dateStyle: 'full',
        timeStyle: 'full',
      })
    }).not.toThrow()

    // Test actual formatting
    const dtf = new DateTimeFormat('en-US', {
      timeZone: 'America/Coyhaique',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    // Test a date after the timezone was created (March 2025)
    const testDate = new Date('2025-04-01T12:00:00Z')
    const result = dtf.format(testDate)

    // America/Coyhaique is UTC-3 year-round after 2025-03-20
    // 12:00 UTC = 09:00 in Coyhaique (-03:00)
    expect(result).toBe('04/01/2025, 09:00')
  })

  it('honors hour12 with timeStyle, GH #6842', function () {
    const morning = new Date(Date.UTC(2000, 4, 31, 3, 0))
    const evening = new Date(Date.UTC(2000, 4, 31, 21, 0))

    expect(
      new DateTimeFormat('en-US', {
        timeStyle: 'short',
        hour12: false,
        timeZone: 'UTC',
      }).format(morning)
    ).toBe('03:00')

    expect(
      new DateTimeFormat('en-US', {
        timeStyle: 'short',
        hour12: false,
        timeZone: 'UTC',
      }).format(evening)
    ).toBe('21:00')

    expect(
      new DateTimeFormat('en-US', {
        dateStyle: 'short',
        timeStyle: 'short',
        hour12: false,
        timeZone: 'UTC',
      }).format(evening)
    ).toBe('5/31/00, 21:00')

    expect(
      new DateTimeFormat('en-GB', {
        timeStyle: 'short',
        hour12: true,
        timeZone: 'Europe/London',
      }).format(evening)
    ).toBe('10:00\u202fpm')

    expect(
      new DateTimeFormat('en-GB', {
        dateStyle: 'short',
        timeStyle: 'short',
        hour12: true,
        timeZone: 'Europe/London',
      }).format(evening)
    ).toBe('31/05/2000, 10:00\u202fpm')
  })
})

// https://github.com/formatjs/formatjs/issues/6020
describe('hourCycle override', function () {
  it('should allow explicit hourCycle override for locales with only h23', function () {
    const date = new Date('2024-01-01T15:00:00Z')

    // en-GB defaults to h23 (like Icelandic)
    const dtf24 = new DateTimeFormat('en-GB', {
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'UTC',
      hourCycle: 'h23',
    })
    expect(dtf24.resolvedOptions().hourCycle).toBe('h23')
    expect(dtf24.format(date)).toMatch(/15/)

    // Explicitly requesting h12 should be respected
    const dtf12 = new DateTimeFormat('en-GB', {
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'UTC',
      hourCycle: 'h12',
    })
    expect(dtf12.resolvedOptions().hourCycle).toBe('h12')
    expect(dtf12.format(date)).toMatch(/3/)
  })
})

it('rejects BigInt and Symbol date arguments', () => {
  const formatter = new DateTimeFormat('en', {timeZone: 'UTC'})
  for (const value of [
    0n,
    Object(0n),
    {valueOf: () => 0n},
    Symbol(),
    Object(Symbol()),
    {valueOf: () => Symbol()},
  ]) {
    expect(() => formatter.format(value as any)).toThrow(TypeError)
    expect(() => formatter.formatToParts(value as any)).toThrow(TypeError)
    expect(() => formatter.formatRange(value as any, 0)).toThrow(TypeError)
    expect(() => formatter.formatRangeToParts(0, value as any)).toThrow(
      TypeError
    )
  }
})

it('accepts minute offsets but rejects second and fractional offsets', () => {
  for (const timeZone of [
    '+01:00:00',
    '+010000',
    '+01:00:01',
    '+01:00:00.1',
    '+01.1',
  ]) {
    expect(() => new DateTimeFormat('en', {timeZone})).toThrow(RangeError)
  }
  for (const [timeZone, canonical] of [
    ['+01', '+01:00'],
    ['+0130', '+01:30'],
    ['-05:30', '-05:30'],
  ]) {
    expect(
      new DateTimeFormat('en', {timeZone}).resolvedOptions().timeZone
    ).toBe(canonical)
  }
})

describe('timestamp truncation', () => {
  const formatter = new DateTimeFormat('en', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  it.each([-1000.9, -1.9, -0.9, 0.9, 1.9, 1000.9])(
    'truncates %s before formatting',
    value => {
      const integer = Math.trunc(value)
      expect(formatter.format(value)).toBe(formatter.format(integer))
      expect(formatter.formatToParts(value)).toEqual(
        formatter.formatToParts(integer)
      )
      expect(formatter.formatRange(value, 10000)).toBe(
        formatter.formatRange(integer, 10000)
      )
      expect(formatter.formatRangeToParts(value, 10000)).toEqual(
        formatter.formatRangeToParts(integer, 10000)
      )
    }
  )
})

describe('DateTimeFormat built-in methods', () => {
  it.each(['getDefaultLocale', 'relevantExtensionKeys'] as const)(
    'constructs without consulting the public %s property',
    property => {
      const original = Object.getOwnPropertyDescriptor(DateTimeFormat, property)
      let options: Intl.ResolvedDateTimeFormatOptions
      try {
        Object.defineProperty(DateTimeFormat, property, {
          configurable: true,
          get() {
            throw new Error(`Read public ${property}`)
          },
        })
        options = new DateTimeFormat('en-u-nu-arab', {
          timeZone: 'UTC',
        }).resolvedOptions()
      } finally {
        if (original) Object.defineProperty(DateTimeFormat, property, original)
        else Reflect.deleteProperty(DateTimeFormat, property)
      }
      expect(options).toMatchObject({
        locale: 'en-u-nu-arab',
        numberingSystem: 'arab',
      })
    }
  )

  it('keeps inherited proxy traps out of legacy construction', () => {
    const receiver = Object.create(DateTimeFormat.prototype)
    const previous = Object.getOwnPropertyDescriptor(Object.prototype, 'get')
    let wrapped: unknown
    let bound: unknown
    try {
      Object.defineProperty(Object.prototype, 'get', {
        configurable: true,
        get() {
          throw new Error('looked up a private proxy trap on Object.prototype')
        },
      })
      wrapped = Reflect.apply(DateTimeFormat, receiver, [
        'en',
        {timeZone: 'UTC'},
      ])
      bound = receiver.format
    } finally {
      delete (Object.prototype as {get?: unknown}).get
      if (previous) Object.defineProperty(Object.prototype, 'get', previous)
    }
    expect(wrapped).toBe(receiver)
    expect(typeof bound).toBe('function')
  })

  it('shares the realm legacy symbol with an independently bundled NumberFormat', () => {
    NumberFormat.__addLocaleData(enNumber as unknown as RawNumberLocaleData)
    const number = Object.create(NumberFormat.prototype)
    const date = Object.create(DateTimeFormat.prototype)
    Reflect.apply(NumberFormat, number, ['en'])
    Reflect.apply(DateTimeFormat, date, ['en', {timeZone: 'UTC'}])
    const [symbol] = Object.getOwnPropertySymbols(number)
    expect(Object.getOwnPropertySymbols(date)).toEqual([symbol])
    expect(symbol.description).toBe('IntlLegacyConstructedSymbol')
    expect(Symbol.keyFor(symbol)).toBeUndefined()
    const hostNumber = Object.create(Intl.NumberFormat.prototype)
    if (Reflect.apply(Intl.NumberFormat, hostNumber, ['en']) === hostNumber)
      expect(Object.getOwnPropertySymbols(hostNumber)).toContain(symbol)
  })

  it.each([
    ['formatToParts', DateTimeFormat.prototype, 1],
    ['formatRange', DateTimeFormat.prototype, 2],
    ['formatRangeToParts', DateTimeFormat.prototype, 2],
    ['resolvedOptions', DateTimeFormat.prototype, 0],
    ['supportedLocalesOf', DateTimeFormat, 1],
  ] as const)('%s has built-in function behavior', (name, owner, length) => {
    const method = (owner as any)[name]
    expect(method.name).toBe(name)
    expect(method.length).toBe(length)
    expect(Object.hasOwn(method, 'prototype')).toBe(false)
    expect(() => Reflect.construct(method, [])).toThrow(TypeError)
  })
  it('wraps legacy receivers without giving them formatter slots', () => {
    const receiver = Object.create(DateTimeFormat.prototype)
    const options = {timeZone: 'UTC', year: 'numeric'} as const
    const expected = new DateTimeFormat('en', options)

    expect(Reflect.apply(DateTimeFormat, receiver, ['en', options])).toBe(
      receiver
    )
    expect(receiver.resolvedOptions()).toEqual(expected.resolvedOptions())
    expect(receiver.format(0)).toBe(expected.format(0))
    expect(() => receiver.formatToParts(0)).toThrow(TypeError)
    expect(() => receiver.formatRange(0, 1000)).toThrow(TypeError)

    expect(
      Reflect.apply(DateTimeFormat, expected, [
        'en',
        {timeZone: 'UTC', month: 'long'},
      ])
    ).toBe(expected)
    expect(expected.formatToParts(0)).toEqual([{type: 'year', value: '1970'}])
  })

  it('resolves options without consulting user-modified intrinsics', () => {
    const formatter = new DateTimeFormat('en', {timeZone: 'UTC'})
    const expected = formatter.resolvedOptions()
    const iterator = Array.prototype[Symbol.iterator]
    const defineProperty = Object.defineProperty
    const fail = () => {
      throw new Error('Unexpected intrinsic call')
    }
    let actual
    try {
      Array.prototype[Symbol.iterator] = fail
      Object.defineProperty = fail
      actual = formatter.resolvedOptions()
    } finally {
      Array.prototype[Symbol.iterator] = iterator
      Object.defineProperty = defineProperty
    }

    expect(actual).toEqual(expected)
  })

  it('has zero required constructor arguments', () => {
    expect(DateTimeFormat.length).toBe(0)
  })
})

it('keeps both supplementary digits in two-digit date fields', () => {
  const formatter = new DateTimeFormat('en', {
    numberingSystem: 'adlm',
    timeZone: 'UTC',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  })
  expect(formatter.resolvedOptions().numberingSystem).toBe('adlm')
  expect(formatter.formatToParts(Date.UTC(2024, 0, 2))).toEqual([
    {type: 'month', value: '𞥐𞥑'},
    {type: 'literal', value: '/'},
    {type: 'day', value: '𞥐𞥒'},
    {type: 'literal', value: '/'},
    {type: 'year', value: '𞥒𞥔'},
  ])
})

it('retains a supported numbering-system extension when the option is unsupported', () => {
  const formatter = new DateTimeFormat('en-u-nu-arab', {
    numberingSystem: 'invalid',
    timeZone: 'UTC',
    year: 'numeric',
  })
  expect(formatter.resolvedOptions()).toMatchObject({
    locale: 'en-u-nu-arab',
    numberingSystem: 'arab',
  })
  expect(formatter.format(Date.UTC(2024, 0, 2))).toBe('٢٠٢٤')
})

it('uses the selected numbering system decimal separator for fractional seconds', () => {
  const formatter = new DateTimeFormat('en-u-nu-arab', {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    fractionalSecondDigits: 3,
  })
  const date = Date.UTC(2024, 0, 1, 2, 35, 6, 789)
  expect(formatter.format(date)).toContain('٢:٣٥:٠٦٫٧٨٩')
  expect(formatter.formatToParts(date)).toContainEqual({
    type: 'literal',
    value: '٫',
  })
})

it('preserves the CLDR day-period separator with Han decimal digits', () => {
  const formatter = new DateTimeFormat('en-u-nu-hanidec', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const date = Date.UTC(2024, 0, 1, 2, 35, 6)
  // ECMA-402 §11.5.4 steps 8 and 15.b preserve digits and pattern literals.
  // https://tc39.es/ecma402/#sec-formatdatetimepattern
  // CLDR uses U+202F here. The pinned Test262 fixture expects ASCII space.
  // https://github.com/tc39/test262/blob/2a1ade303f72d3de80565c921d685222405c32ce/test/intl402/DateTimeFormat/prototype/format/numbering-system.js#L26
  // https://github.com/tc39/test262/issues/3711
  expect(formatter.format(date)).toBe('〇二:三五:〇六\u202fAM')
  expect(
    formatter
      .formatToParts(date)
      .map(part => part.value)
      .join('')
  ).toBe(formatter.format(date))
})

it('constructs private format records without mutable Object.assign', () => {
  const original = Object.getOwnPropertyDescriptor(Object, 'assign')!
  let actual: unknown
  try {
    Object.defineProperty(Object, 'assign', {
      configurable: true,
      get() {
        throw new Error('Mutable construction Object.assign reached')
      },
    })
    actual = new DateTimeFormat('en', {
      timeZone: 'UTC',
      year: 'numeric',
    }).format(0)
  } finally {
    Object.defineProperty(Object, 'assign', original)
  }
  expect(actual).toBe('1970')
})

import {Locale} from '#packages/intl-locale/index.js'
import {describe, expect, it} from 'vitest'

describe('Locale information follows script metadata and formatter defaults', () => {
  it('filters regional calendars through available DateTimeFormat data', () => {
    const descriptor = Object.getOwnPropertyDescriptor(Intl, 'DateTimeFormat')!
    let calendar = 'gregory'
    class DateTimeFormat {
      static polyfilled = true
      resolvedOptions() {
        return {calendar}
      }
    }
    try {
      Object.defineProperty(Intl, 'DateTimeFormat', {value: DateTimeFormat})
      const thai = new Locale('th-TH')
      expect(thai.getCalendars()).toEqual(['gregory'])
      calendar = 'buddhist'
      expect(thai.getCalendars()).toEqual(['buddhist'])
      expect(new Locale('ja-JP').getCalendars()).toEqual(['gregory'])
      expect(new Locale('ja-JP-u-ca-japanese').getCalendars()).toEqual([
        'japanese',
      ])
    } finally {
      Object.defineProperty(Intl, 'DateTimeFormat', descriptor)
    }
  })

  it('ignores inherited rows when a region has no preference data', () => {
    const locale = new Locale('en-AA')
    const preferences = () => [
      locale.getCalendars(),
      locale.getHourCycles(),
      locale.getTimeZones(),
      locale.getWeekInfo(),
    ]
    const expected = preferences()
    const keys = ['AA', 'aa', 'en-AA']
    const saved = keys.map(key =>
      Object.getOwnPropertyDescriptor(Object.prototype, key)
    )
    let actual: ReturnType<typeof preferences>
    try {
      for (const key of keys) {
        Object.defineProperty(Object.prototype, key, {
          configurable: true,
          get() {
            throw new Error('Read an inherited region preference')
          },
        })
      }
      actual = preferences()
    } finally {
      for (const [index, key] of keys.entries()) {
        const descriptor = saved[index]
        if (descriptor) Object.defineProperty(Object.prototype, key, descriptor)
        else Reflect.deleteProperty(Object.prototype, key)
      }
    }
    expect(actual).toEqual(expected)
  })

  it('deduplicates primary time zones after alias normalization', () => {
    const zones = new Locale('en-US').getTimeZones()!
    expect(zones.filter(zone => zone === 'America/Denver')).toHaveLength(1)
    expect(zones).toEqual([...new Set(zones)].sort())
  })
  for (const tag of ['ar-u-ca-gregory', 'en-Arab', 'abcde-Arab']) {
    it(`retains script direction for ${tag}`, () => {
      expect(new Locale(tag).getTextInfo()).toEqual({direction: 'rtl'})
    })
  }
  it('honors explicit Latin script over Arabic language', () => {
    expect(new Locale('ar-Latn').getTextInfo()).toEqual({direction: 'ltr'})
  })
  for (const tag of ['und-Zzzz', 'abcde']) {
    it(`preserves an own undefined direction for ${tag}`, () => {
      expect(
        Object.getOwnPropertyDescriptor(
          new Locale(tag).getTextInfo(),
          'direction'
        )
      ).toEqual({
        value: undefined,
        writable: true,
        enumerable: true,
        configurable: true,
      })
    })
  }
  it('returns one NumberFormat default independent of unrelated extensions', () => {
    const expected = new Intl.NumberFormat('ar-EG', {
      localeMatcher: 'lookup',
    }).resolvedOptions().numberingSystem
    expect(new Locale('ar-EG').getNumberingSystems()).toEqual([expected])
    expect(new Locale('ar-EG-u-ca-gregory').getNumberingSystems()).toEqual([
      expected,
    ])
    expect(new Locale('abcde').getNumberingSystems()).toEqual(['latn'])
  })
  it('uses an explicit numbering system even with no formatter installed', () => {
    const descriptor = Object.getOwnPropertyDescriptor(Intl, 'NumberFormat')!
    try {
      Object.defineProperty(Intl, 'NumberFormat', {value: undefined})
      expect(new Locale('ar-EG-u-nu-arab').getNumberingSystems()).toEqual([
        'arab',
      ])
      expect(new Locale('ar-EG').getNumberingSystems()).toEqual(['latn'])
    } finally {
      Object.defineProperty(Intl, 'NumberFormat', descriptor)
    }
  })

  it('uses fallback collations when the runtime has no Collator', () => {
    const descriptor = Object.getOwnPropertyDescriptor(Intl, 'Collator')!
    try {
      Object.defineProperty(Intl, 'Collator', {value: undefined})
      expect(new Locale('en').getCollations()).toEqual(['emoji', 'eor'])
      expect(new Locale('en-u-co-phonebk').getCollations()).toEqual(['phonebk'])
    } finally {
      Object.defineProperty(Intl, 'Collator', descriptor)
    }
  })

  it.each(['NumberFormat', 'Collator'] as const)(
    'reads locale data through retained %s operations',
    name => {
      const locale = new Locale(name === 'NumberFormat' ? 'ar-EG' : 'de')
      const read = () =>
        name === 'NumberFormat'
          ? locale.getNumberingSystems()
          : locale.getCollations()
      const expected = read()
      const Constructor = Intl[name]
      const properties = [
        [Intl, name],
        [Constructor, 'supportedLocalesOf'],
        [Constructor.prototype, 'resolvedOptions'],
      ] as const
      const descriptors = properties.map(([target, key]) =>
        Object.getOwnPropertyDescriptor(target, key)
      )
      const fail = {
        configurable: true,
        get() {
          throw new Error('Read public formatter operation')
        },
      }
      let actual: string[]
      try {
        for (const [target, key] of properties)
          Object.defineProperty(target, key, fail)
        actual = read()
      } finally {
        for (const [index, [target, key]] of properties.entries()) {
          const descriptor = descriptors[index]
          if (descriptor) Object.defineProperty(target, key, descriptor)
          else Reflect.deleteProperty(target, key)
        }
      }
      expect(actual).toEqual(expected)
    }
  )
})

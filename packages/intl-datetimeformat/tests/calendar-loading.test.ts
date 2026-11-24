import {expect, test} from 'vitest'
import {DateTimeFormat} from '#packages/intl-datetimeformat/core.js'
import hebrew from '#packages/intl-datetimeformat/calendars/implementations/hebrew.js'
import chinese from '#packages/intl-datetimeformat/calendars/implementations/chinese.js'
import buddhist from '#packages/intl-datetimeformat/calendars/implementations/buddhist.js'
import japanese from '#packages/intl-datetimeformat/calendars/implementations/japanese.js'
import en from '#packages/intl-datetimeformat/tests/locale-data/en.json' with {type: 'json'}
import type {
  RawDateTimeLocaleData,
  RawCalendarLocaleData,
} from '#packages/intl-datetimeformat/types.js'

const raw = en as unknown as RawDateTimeLocaleData
const {calendarData, formats, ...data} = raw.data
const base = {
  ...raw,
  data: {
    ...data,
    formats: {gregory: formats.gregory, iso8601: formats.iso8601},
  },
}
const patch = (calendar: string): RawCalendarLocaleData => ({
  locale: 'en',
  calendar,
  data: calendarData![calendar],
  formats: formats[calendar],
})
const formatter = (calendar: string) =>
  new DateTimeFormat('en', {
    calendar,
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

test('uses private hour-cycle preferences for legacy locale data', () => {
  const legacy = {...base.data}
  delete legacy.hourCycle12
  delete legacy.hourCycle24
  DateTimeFormat.__addLocaleData({
    ...base,
    locale: 'en-NZ',
    data: {...legacy, hc: [null, 'h11', 'h24']},
  })
  for (const [hour12, preference, expected] of [
    [true, 'hourCycle12', 'h11'],
    [false, 'hourCycle24', 'h24'],
  ] as const) {
    for (const [prototype, key] of [
      [Object.prototype, preference],
      [Array.prototype, 'find'],
    ] as const) {
      const original = Object.getOwnPropertyDescriptor(prototype, key)
      let cycle
      try {
        cycle = new DateTimeFormat('en-NZ', {
          timeZone: 'UTC',
          hour: 'numeric',
          hour12,
          get hourCycle() {
            Object.defineProperty(prototype, key, {
              configurable: true,
              get() {
                throw new Error(
                  'Read a public property for private hour-cycle data'
                )
              },
            })
            return undefined
          },
        }).resolvedOptions().hourCycle
      } finally {
        if (original) Object.defineProperty(prototype, key, original)
        else Reflect.deleteProperty(prototype, key)
      }
      expect(cycle).toBe(expected)
    }
  }
})

test('calendar availability includes patterns loaded outside the default locale', () => {
  const key = Symbol.for('@formatjs/intl-datetimeformat/availableCalendars')
  const availableCalendars = Object.getOwnPropertyDescriptor(
    DateTimeFormat,
    key
  )!.value as () => string[]
  DateTimeFormat.__addLocaleData(
    {
      ...base,
      data: {
        ...base.data,
        ca: ['gregory'],
        formats: {gregory: formats.gregory},
      },
    },
    {...base, locale: 'en-AU'}
  )
  expect(formatter('iso8601').resolvedOptions().calendar).toBe('iso8601')
  DateTimeFormat.__addCalendarLocaleData({
    ...patch('japanese'),
    locale: 'en-AU',
  })
  expect(availableCalendars()).not.toContain('japanese')
  DateTimeFormat.__addCalendarData(japanese)
  expect(formatter('japanese').resolvedOptions().calendar).toBe('gregory')
  expect(availableCalendars()).toContain('japanese')
})

test.each([
  ['-000544-01-01T00:00:00Z', '2', '02'],
  ['-000543-01-01T00:00:00Z', '1', '01'],
  ['-000542-01-01T00:00:00Z', '1', '01'],
])(
  'normalizes nonpositive Buddhist display years for %s',
  (iso, numeric, twoDigit) => {
    DateTimeFormat.__addLocaleData(base)
    DateTimeFormat.__addCalendarLocaleData(patch('buddhist'))
    DateTimeFormat.__addCalendarData(buddhist)
    const date = new Date(iso)
    for (const [width, year] of [
      ['numeric', numeric],
      ['2-digit', twoDigit],
    ] as const) {
      const options = {
        calendar: 'buddhist',
        year: width,
        timeZone: 'UTC',
      } as const
      const actual = new DateTimeFormat('en', options)
      expect(actual.resolvedOptions().calendar).toBe('buddhist')
      const native = new Intl.DateTimeFormat('en', options).formatToParts(date)
      expect(
        actual.formatToParts(date),
        JSON.stringify({native})
      ).toContainEqual({
        type: 'year',
        value: year,
      })
    }
  }
)

test.each([
  [buddhist, '2567'],
  [japanese, '6'],
] as const)('formats required date fields with %s', (provider, year) => {
  DateTimeFormat.__addLocaleData(base)
  DateTimeFormat.__addCalendarData(provider)
  DateTimeFormat.__addCalendarLocaleData(patch(provider.calendar))
  const options = {
    calendar: provider.calendar,
    timeZone: 'UTC',
    formatMatcher: 'basic',
    year: 'numeric',
    month: 'numeric',
  } as const
  const time = Date.UTC(2024, 0, 2, 3, 4, 5, 678)
  const dateOptions = {...options, day: 'numeric'} as const
  const weekdayOptions = {...dateOptions, weekday: 'short'} as const
  expect(new DateTimeFormat('en', options).format(time)).toBe(`1/${year}`)
  expect(new DateTimeFormat('en', dateOptions).format(time)).toBe(`1/2/${year}`)
  expect(new DateTimeFormat('en', weekdayOptions).format(time)).toBe(
    `Tue, 1/2/${year}`
  )
  const timestamp = new DateTimeFormat('en', {
    ...weekdayOptions,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hourCycle: 'h23',
  })
  expect(
    timestamp.formatToParts(time).filter(part => part.type !== 'literal')
  ).toEqual([
    {type: 'weekday', value: 'Tue'},
    {type: 'month', value: '1'},
    {type: 'day', value: '2'},
    {type: 'year', value: year},
    {type: 'hour', value: '03'},
    {type: 'minute', value: '04'},
    {type: 'second', value: '05'},
    {type: 'fractionalSecond', value: '678'},
  ])
  const explicitEra = new DateTimeFormat('en', {...dateOptions, era: 'short'})
  expect(
    explicitEra.formatToParts(time).some(part => part.type === 'era')
  ).toBe(true)
})

test('calendar arithmetic and locale patterns load independently in either order', () => {
  DateTimeFormat.__addLocaleData(base)
  expect(formatter('hebrew').resolvedOptions().calendar).toBe('gregory')
  expect(formatter('iso8601').resolvedOptions().calendar).toBe('iso8601')
  expect(formatter('gregory').format(Date.UTC(2024, 2, 11))).toBe(
    'March 11, 2024'
  )

  // Patterns alone cannot advertise a calendar whose arithmetic is absent.
  DateTimeFormat.__addCalendarLocaleData(patch('hebrew'))
  expect(formatter('hebrew').resolvedOptions().calendar).toBe('gregory')
  DateTimeFormat.__addCalendarData(hebrew)
  expect(formatter('hebrew').resolvedOptions().calendar).toBe('hebrew')
  expect(formatter('hebrew').format(Date.UTC(2024, 2, 11))).toContain('Adar II')
  const existing = formatter('hebrew')

  // Arithmetic alone cannot advertise a calendar whose locale patterns are absent.
  DateTimeFormat.__addCalendarData(chinese)
  expect(formatter('chinese').resolvedOptions().calendar).toBe('gregory')
  DateTimeFormat.__addCalendarLocaleData(patch('chinese'))
  expect(formatter('chinese').resolvedOptions().calendar).toBe('chinese')
  expect(formatter('chinese').format(Date.UTC(2024, 2, 11))).toContain('2024')
  expect(existing.format(Date.UTC(2024, 2, 11))).toContain('Adar II')
  expect(formatter('dangi').resolvedOptions().calendar).toBe('gregory')

  // Repeated base/calendar loading preserves other add-ons and existing formatters.
  DateTimeFormat.__addLocaleData(base)
  DateTimeFormat.__addCalendarLocaleData(patch('chinese'))
  expect(formatter('hebrew').resolvedOptions().calendar).toBe('hebrew')
  expect(existing.format(Date.UTC(2024, 2, 11))).toContain('Adar II')
})

test('calendar locale patterns can arrive before their base locale', () => {
  DateTimeFormat.__addCalendarLocaleData({...patch('hebrew'), locale: 'en-GB'})
  DateTimeFormat.__addLocaleData({...base, locale: 'en-GB'})
  expect(
    new DateTimeFormat('en-GB', {calendar: 'hebrew'}).resolvedOptions().calendar
  ).toBe('hebrew')
})

test('a rejected calendar patch leaves the last valid patch available for reloads', () => {
  const locale = 'en-recov'
  const localeData = {...base, locale}
  const valid = {...patch('buddhist'), locale}
  DateTimeFormat.__addCalendarData(buddhist)
  DateTimeFormat.__addLocaleData(localeData)
  DateTimeFormat.__addCalendarLocaleData(valid)

  const format = () =>
    new DateTimeFormat(locale, {
      calendar: 'buddhist',
      year: 'numeric',
      timeZone: 'UTC',
    }).formatToParts(0)

  expect(() =>
    DateTimeFormat.__addCalendarLocaleData({
      ...valid,
      get formats(): typeof valid.formats {
        throw new RangeError('Rejected calendar formats')
      },
    })
  ).toThrow('Rejected calendar formats')

  DateTimeFormat.__addLocaleData(localeData)
  expect(format()).toContainEqual({type: 'year', value: '2513'})
})

test('a user-supplied calendar uses its registered conversion for dates and ranges', () => {
  const calls: number[] = []
  DateTimeFormat.__addCalendarLocaleData({
    locale: 'en',
    calendar: 'custom',
    formats: formats.gregory,
    data: raw.data,
  })
  expect(formatter('custom').resolvedOptions().calendar).toBe('gregory')
  DateTimeFormat.__addCalendarData({
    calendar: 'custom',
    dateFromTime(t) {
      calls.push(t)
      const date = new Date(t)
      return {
        era: 'AD',
        year: date.getUTCFullYear() + 1000,
        month: date.getUTCMonth(),
        day: date.getUTCDate(),
      }
    },
  })
  const custom = new DateTimeFormat('en', {
    calendar: 'custom',
    timeZone: '+01:00',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const start = Date.UTC(2024, 0, 1)
  const end = Date.UTC(2024, 0, 2)
  expect(custom.resolvedOptions().calendar).toBe('custom')
  expect(custom.format(start)).toBe('January 1, 3024')
  expect(calls).toContain(start + 3600000)
  expect(custom.formatToParts(start)).toContainEqual({
    type: 'year',
    value: '3024',
  })
  expect(custom.formatRange(start, end)).toContain('3024')
  expect(custom.formatRangeToParts(start, end)).toContainEqual({
    type: 'year',
    value: '3024',
    source: 'shared',
  })
  expect(formatter('gregory').format(start)).toBe('January 1, 2024')
  expect(formatter('hebrew').resolvedOptions().calendar).toBe('hebrew')
  DateTimeFormat.__addLocaleData(base)
  expect(formatter('custom').resolvedOptions().calendar).toBe('custom')
})

test('calendar ranges compare signed-zero month ordinals by numeric value', () => {
  DateTimeFormat.__addCalendarLocaleData({
    locale: 'en',
    calendar: 'signzero',
    formats: formats.gregory,
    data: raw.data,
  })
  DateTimeFormat.__addCalendarData({
    calendar: 'signzero',
    dateFromTime(t) {
      return {
        era: 'AD',
        year: 2024,
        month: t === 0 ? -0 : t === 86400000 ? 0 : 1,
        day: 1,
      }
    },
  })
  const format = new DateTimeFormat('en', {
    calendar: 'signzero',
    timeZone: 'UTC',
    month: 'long',
  })
  expect(format.format(0)).toBe('January')
  expect(format.format(86400000)).toBe('January')
  expect(format.formatRange(0, 86400000)).toBe('January')
  expect(format.formatRangeToParts(0, 86400000)).toEqual([
    {type: 'month', value: 'January', source: 'shared'},
  ])
  const distinct = format.formatRangeToParts(0, 172800000)
  expect(distinct).toContainEqual({
    type: 'month',
    value: 'January',
    source: 'startRange',
  })
  expect(distinct).toContainEqual({
    type: 'month',
    value: 'February',
    source: 'endRange',
  })
})

test('warm formatters retain patterns but read replacement names and providers', () => {
  const fields = (year: number) => ({era: 'AD', year, month: 0, day: 1})
  const calendarPatch: RawCalendarLocaleData = {
    locale: 'en',
    calendar: 'cached',
    data: raw.data,
    formats: formats.gregory,
  }
  DateTimeFormat.__addCalendarLocaleData(calendarPatch)
  DateTimeFormat.__addCalendarData({
    calendar: 'cached',
    dateFromTime: () => fields(2024),
  })
  const existing = formatter('cached')
  expect(existing.format(0)).toBe('January 1, 2024')
  const parts = existing.formatToParts(0)
  parts[0].value = 'mutated'
  expect(existing.format(0)).toBe('January 1, 2024')
  DateTimeFormat.__addCalendarLocaleData({
    ...calendarPatch,
    data: {
      ...raw.data,
      month: {
        ...raw.data.month,
        long: ['Changed', ...raw.data.month.long.slice(1)],
      },
    },
  })
  DateTimeFormat.__addCalendarData({
    calendar: 'cached',
    dateFromTime: () => fields(3024),
  })
  expect(existing.format(0)).toBe('Changed 1, 3024')
  expect(existing.formatRange(0, 86400000)).toBe('Changed 1, 3024')
})

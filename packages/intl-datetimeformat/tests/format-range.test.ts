import '@formatjs/intl-getcanonicallocales/polyfill.js'
import '@formatjs/intl-locale/polyfill.js'
import {DateTimeFormat} from '#packages/intl-datetimeformat/core'
import allData from '@formatjs_generated/tz/all-tz.js'
import enGB from '#packages/intl-datetimeformat/tests/locale-data/en-GB.json' with {type: 'json'}
import en from '#packages/intl-datetimeformat/tests/locale-data/en.json' with {type: 'json'}
import ru from '#packages/intl-datetimeformat/tests/locale-data/ru.json' with {type: 'json'}
import fa from '#packages/intl-datetimeformat/tests/locale-data/fa.json' with {type: 'json'}
import nl from '#packages/intl-datetimeformat/tests/locale-data/nl.json' with {type: 'json'}
import zhHans from '#packages/intl-datetimeformat/tests/locale-data/zh-Hans.json' with {type: 'json'}
import {describe, expect, it, test} from 'vitest'
// @ts-ignore
DateTimeFormat.__addLocaleData(en, enGB, zhHans, fa, nl, ru)
DateTimeFormat.__addTZData(allData)
describe('range parity', () => {
  test('shares punctuation outside fallback endpoint fields', () => {
    const options: Intl.DateTimeFormatOptions = {
      calendar: 'gregory',
      timeZone: 'UTC',
      timeStyle: 'long',
    }
    const start = Date.UTC(2024, 0, 15, 10, 15)
    const end = Date.UTC(2024, 0, 15, 11, 45)
    expect(
      new DateTimeFormat('fa', options).formatRangeToParts(start, end)
    ).toEqual(
      new Intl.DateTimeFormat('fa', options).formatRangeToParts(start, end)
    )
  })
  test('uses CLDR ISO 8601 patterns independently of Gregorian patterns', () => {
    const formatter = new DateTimeFormat('en', {
      calendar: 'iso8601',
      timeZone: 'UTC',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })
    expect(formatter.format(0)).toBe('1970-01-01')
    expect(formatter.resolvedOptions().calendar).toBe('iso8601')
  })
  test.each([
    ['America/New_York', 'ET'],
    ['Europe/Paris', 'France Time'],
    ['Asia/Kathmandu', 'Nepal Time'],
    ['Pacific/Auckland', 'New Zealand Time'],
    ['UTC', 'GMT+0'],
  ])('uses generic timezone names for %s', (timeZone, value) => {
    const formatter = new DateTimeFormat('en', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'shortGeneric',
    })
    expect(
      formatter.formatToParts(0).find(part => part.type === 'timeZoneName')
    ).toEqual({type: 'timeZoneName', value})
  })
  test('retains fractional seconds in date-spanning intervals', () => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
      hourCycle: 'h23',
    }
    const formatter = new DateTimeFormat('en', options)
    const start = Date.UTC(2024, 0, 15, 10, 15, 0, 123)
    const end = Date.UTC(2024, 0, 17, 10, 45, 0, 789)
    expect(formatter.formatRangeToParts(start, end)).toEqual(
      new Intl.DateTimeFormat('en', options).formatRangeToParts(start, end)
    )
  })
  test('uses the preferred CLDR hour cycle independently of allowed cycles', () => {
    const options: Intl.DateTimeFormatOptions = {
      calendar: 'gregory',
      numberingSystem: 'latn',
      timeZone: 'UTC',
      hour: 'numeric',
      minute: '2-digit',
    }
    const formatter = new DateTimeFormat('fa', options)
    expect(formatter.resolvedOptions().hourCycle).toBe('h23')
    expect(formatter.format(0)).toBe(
      new Intl.DateTimeFormat('fa', options).format(0)
    )
  })
  test('resolves CLDR timezone aliases before looking up names', () => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kathmandu',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'long',
    }
    const formatter = new DateTimeFormat('en', options)
    expect(
      formatter.formatToParts(0).find(part => part.type === 'timeZoneName')
    ).toEqual({type: 'timeZoneName', value: 'Nepal Time'})
  })
  test.each(['en', 'en-GB', 'nl', 'zh-Hans'])(
    '%s includes dates when a time-only range crosses midnight',
    locale => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'UTC',
        hour: 'numeric',
        minute: '2-digit',
      }
      const formatter = new DateTimeFormat(locale, options)
      const oracle = new Intl.DateTimeFormat(locale, options)
      const start = Date.UTC(2024, 0, 15, 10, 15)
      const end = Date.UTC(2024, 0, 17, 10, 45)
      expect(formatter.formatRangeToParts(start, end)).toEqual(
        oracle.formatRangeToParts(start, end)
      )
    }
  )
  test('retains matched textual date widths in interval records', () => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'UTC',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
    const formatter = new DateTimeFormat('en', options)
    const oracle = new Intl.DateTimeFormat('en', options)
    const start = Date.UTC(2024, 0, 15)
    const end = Date.UTC(2024, 0, 17)
    expect(formatter.formatRangeToParts(start, end)).toEqual(
      oracle.formatRangeToParts(start, end)
    )
  })
  test('matches time-only intervals after hour width matching', () => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }
    const formatter = new DateTimeFormat('en-GB', options)
    const oracle = new Intl.DateTimeFormat('en-GB', options)
    const start = Date.UTC(2026, 10, 6, 20)
    const end = Date.UTC(2026, 10, 6, 21, 15)
    expect(formatter.formatRangeToParts(start, end)).toEqual(
      oracle.formatRangeToParts(start, end)
    )
  })
  test('uses interval widths without changing single-date widths', () => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'UTC',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }
    const formatter = new DateTimeFormat('en', options)
    const oracle = new Intl.DateTimeFormat('en', options)
    const start = Date.UTC(2026, 10, 6, 5)
    const end = Date.UTC(2026, 10, 6, 6, 15)
    const single = formatter.formatToParts(start)
    expect(formatter.formatRangeToParts(start, end)).toEqual(
      oracle.formatRangeToParts(start, end)
    )
    expect(formatter.formatToParts(start)).toEqual(single)
    expect(single.find(part => part.type === 'hour')?.value).toBe('05')
    expect(formatter.resolvedOptions().hour).toBe('2-digit')
  })
  test('keeps both AM/PM values across noon when no AM/PM interval exists', () => {
    const formatter = new DateTimeFormat('ru', {
      timeZone: 'UTC',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    const parts = formatter.formatRangeToParts(
      Date.UTC(2026, 10, 6, 11),
      Date.UTC(2026, 10, 6, 12, 15)
    )
    expect(
      parts
        .filter(part => part.type === 'dayPeriod')
        .map(({value, source}) => ({value, source}))
    ).toEqual([
      {value: 'AM', source: 'startRange'},
      {value: 'PM', source: 'endRange'},
    ])
  })
  test('combines date and time style intervals with a shared date', () => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'UTC',
      dateStyle: 'medium',
      timeStyle: 'short',
    }
    const formatter = new DateTimeFormat('en-GB', options)
    const oracle = new Intl.DateTimeFormat('en-GB', options)
    const start = Date.UTC(2026, 10, 6, 20)
    const end = Date.UTC(2026, 10, 6, 21, 15)
    expect(formatter.formatRangeToParts(start, end)).toEqual(
      oracle.formatRangeToParts(start, end)
    )
  })
})
describe('ICU shares dates across hidden day-period boundaries', () => {
  for (const locale of ['en', 'en-GB', 'nl', 'ru', 'fa', 'zh-Hans']) {
    for (const hour12 of [false, true]) {
      test(`${locale}, hour12=${hour12}`, () => {
        const options: Intl.DateTimeFormatOptions = {
          timeZone: 'UTC',
          calendar: 'gregory',
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12,
        }
        const formatter = new DateTimeFormat(locale, options)
        const oracle = new Intl.DateTimeFormat(locale, options)
        for (const [startHour, endHour] of [
          [5, 6],
          [11, 12],
          [17, 18],
          [20, 21],
        ]) {
          const start = Date.UTC(2026, 10, 6, startHour)
          const end = Date.UTC(2026, 10, 6, endHour, 15)
          const sources = (parts: {type: string; source?: string}[]) =>
            parts
              .filter(part => ['weekday', 'month', 'day'].includes(part.type))
              .map(({type, source}) => ({type, source}))
          expect(sources(formatter.formatRangeToParts(start, end))).toEqual(
            sources(oracle.formatRangeToParts(start, end))
          )
        }
      })
    }
  }
})
test('GH issue #7868 - hidden day periods do not repeat the date', () => {
  const formatter = new DateTimeFormat('en-GB', {
    timeZone: 'Europe/Amsterdam',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  expect(
    formatter.formatRange(
      new Date('2026-11-06T19:00:00Z'),
      new Date('2026-11-06T20:15:00Z')
    )
  ).toBe('Fri 6 Nov, 20:00–21:15')
})
test('shares date fields when combining date and time styles', () => {
  const formatter = new DateTimeFormat('fa', {
    calendar: 'gregory',
    timeZone: 'Pacific/Auckland',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const parts = formatter.formatRangeToParts(1730613599000, 1730613600000)
  expect(
    parts
      .filter(part => ['year', 'month', 'day'].includes(part.type))
      .map(part => part.type)
  ).toEqual(['day', 'month', 'year'])
  expect(
    parts
      .filter(part => ['year', 'month', 'day'].includes(part.type))
      .every(part => part.source === 'shared')
  ).toBe(true)
})
describe('DateTimeFormat range format', function () {
  it('basic', function () {
    const d1 = new Date(2020, 1, 1)
    const d2 = new Date(2020, 1, 15)
    const dtf = new DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
    })
    expect(dtf.formatRange(d1, d2)).toBe('Feb 1 – 15')
  })
  it('basic parts', function () {
    const d1 = new Date(2020, 1, 1)
    const d2 = new Date(2020, 1, 15)

    expect(
      new DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
      }).formatRangeToParts(d1, d2)
    ).toEqual([
      {
        source: 'shared',
        type: 'month',
        value: 'Feb',
      },
      {
        source: 'shared',
        type: 'literal',
        value: ' ',
      },
      {
        source: 'startRange',
        type: 'day',
        value: '1',
      },
      {
        source: 'shared',
        type: 'literal',
        value: ' – ',
      },
      {
        source: 'endRange',
        type: 'day',
        value: '15',
      },
    ])
  })
})

// Copyright 2019 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

test('descriptor', function () {
  let descriptor = Object.getOwnPropertyDescriptor(
    DateTimeFormat.prototype,
    'formatRange'
  )
  expect(descriptor?.writable).toBe(true)
  expect(descriptor?.enumerable).toBe(false)
  expect(descriptor?.configurable).toBe(true)
})

test('v8 test/intl/date-format/format-rage error', function () {
  const date1 = new Date('2019-1-3')
  const date2 = new Date('2019-1-5')
  const dtf = new DateTimeFormat(['en'])
  // @ts-ignore
  expect(() => dtf.formatRange()).toThrow(TypeError)
  // @ts-ignore
  expect(() => dtf.formatRange(date1)).toThrow(TypeError)
  // @ts-ignore
  expect(() => dtf.formatRange(undefined, date2)).toThrow(TypeError)
  // @ts-ignore
  expect(() => dtf.formatRange(date1, undefined)).toThrow(TypeError)
  // @ts-ignore
  expect(() => dtf.formatRange('2019-1-3', date2)).toThrow(RangeError)
  // @ts-ignore
  expect(() => dtf.formatRange(date1, '2019-5-4')).toThrow(RangeError)
  // @ts-ignore
  expect(() => dtf.formatRange(date1, date2)).not.toThrow()
})

test.skip('v8 test/intl/date-format/format-rage error negative', function () {
  const date1 = new Date('2019-1-3')
  const date2 = new Date('2019-1-5')
  const dtf = new DateTimeFormat(['en'])
  // @ts-ignore
  expect(() => dtf.formatRange(date2, date1)).toThrow(RangeError)
})

test('v8 test/intl/date-format/format-range', function () {
  const date1 = new Date('2019-1-3')
  const date2 = new Date('2019-1-5')
  const date3 = new Date('2019-3-4')
  const date4 = new Date('2020-3-4')
  var dtf = new DateTimeFormat(['en'])

  expect(dtf.formatRange(date1, date2)).toBe('1/3/2019 – 1/5/2019')
  expect(dtf.formatRange(date1, date3)).toBe('1/3/2019 – 3/4/2019')
  expect(dtf.formatRange(date1, date4)).toBe('1/3/2019 – 3/4/2020')
  expect(dtf.formatRange(date2, date3)).toBe('1/5/2019 – 3/4/2019')
  expect(dtf.formatRange(date2, date4)).toBe('1/5/2019 – 3/4/2020')
  expect(dtf.formatRange(date3, date4)).toBe('3/4/2019 – 3/4/2020')
})

test('v8 test/intl/date-format/format-range 2', function () {
  const date1 = new Date('2019-1-3')
  const date2 = new Date('2019-1-5')
  const date3 = new Date('2019-3-4')
  const date4 = new Date('2020-3-4')
  const dtf = new DateTimeFormat(['en'], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  expect(dtf.formatRange(date1, date2)).toBe('Jan 3 – 5, 2019')
  expect(dtf.formatRange(date1, date3)).toBe('Jan 3 – Mar 4, 2019')
  expect(dtf.formatRange(date1, date4)).toBe('Jan 3, 2019 – Mar 4, 2020')
  expect(dtf.formatRange(date2, date3)).toBe('Jan 5 – Mar 4, 2019')
  expect(dtf.formatRange(date2, date4)).toBe('Jan 5, 2019 – Mar 4, 2020')
  expect(dtf.formatRange(date3, date4)).toBe('Mar 4, 2019 – Mar 4, 2020')
})

test('v8 test/intl/date-format/format-range TimeClip', function () {
  const dtf = new DateTimeFormat(['en'], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  // Test the sequence of ToNumber and TimeClip
  var secondDateAccessed = false
  expect(() =>
    dtf.formatRange(
      new Date(864000000 * 10000000 + 1), // a date will cause TimeClip return NaN
      // @ts-ignore
      {
        // @ts-ignore
        get [Symbol.toPrimitive]() {
          secondDateAccessed = true
          return {}
        },
      }
    )
  ).toThrow(TypeError)
  expect(secondDateAccessed).toBe(true)
})

test.skip('v8 test/intl/date-format/format_range_hour_cycle.js', function () {
  let midnight = new Date(2019, 3, 4, 0)
  let noon = new Date(2019, 3, 4, 12)
  let df_11 = new DateTimeFormat('en', {
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h11',
  })
  expect(df_11.resolvedOptions().hourCycle).toBe('h11')
  expect(df_11.formatRange(midnight, midnight)).toBe('0:00 AM')
  expect(df_11.formatRange(noon, noon)).toBe('0:00 PM')

  let df_11_t = new DateTimeFormat('en', {
    timeStyle: 'short',
    hourCycle: 'h11',
  })
  expect(df_11_t.resolvedOptions().hourCycle).toBe('h11')
  expect(df_11_t.formatRange(midnight, midnight)).toBe('0:00 AM')
  expect(df_11_t.formatRange(noon, noon)).toBe('0:00 PM')

  let df_11_dt = new DateTimeFormat('en', {
    timeStyle: 'short',
    dateStyle: 'short',
    hourCycle: 'h11',
  })
  expect(df_11_dt.resolvedOptions().hourCycle).toBe('h11')
  expect(df_11_dt.formatRange(midnight, midnight)).toBe('4/4/19, 0:00 AM')
  expect(df_11_dt.formatRange(noon, noon)).toBe('4/4/19, 0:00 PM')

  let df_12 = new DateTimeFormat('en', {
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h12',
  })
  expect(df_12.resolvedOptions().hourCycle).toBe('h12')
  expect(df_12.formatRange(midnight, midnight)).toBe('12:00 AM')
  expect(df_12.formatRange(noon, noon)).toBe('12:00 PM')

  let df_12_t = new DateTimeFormat('en', {
    timeStyle: 'short',
    hourCycle: 'h12',
  })
  expect(df_12_t.resolvedOptions().hourCycle).toBe('h12')
  expect(df_12_t.formatRange(midnight, midnight)).toBe('12:00 AM')
  expect(df_12_t.formatRange(noon, noon)).toBe('12:00 PM')

  let df_12_dt = new DateTimeFormat('en', {
    timeStyle: 'short',
    dateStyle: 'short',
    hourCycle: 'h12',
  })
  expect(df_12_dt.resolvedOptions().hourCycle).toBe('h12')
  expect(df_12_dt.formatRange(midnight, midnight)).toBe('4/4/19, 12:00 AM')
  expect(df_12_dt.formatRange(noon, noon)).toBe('4/4/19, 12:00 PM')

  let df_23 = new DateTimeFormat('en', {
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  })
  expect(df_23.resolvedOptions().hourCycle).toBe('h23')
  expect(df_23.formatRange(midnight, midnight)).toBe('00:00')
  expect(df_23.formatRange(noon, noon)).toBe('12:00')

  let df_23_t = new DateTimeFormat('en', {
    timeStyle: 'short',
    hourCycle: 'h23',
  })
  expect(df_23_t.resolvedOptions().hourCycle).toBe('h23')
  expect(df_23_t.formatRange(midnight, midnight)).toBe('00:00')
  expect(df_23_t.formatRange(noon, noon)).toBe('12:00')

  let df_23_dt = new DateTimeFormat('en', {
    timeStyle: 'short',
    dateStyle: 'short',
    hourCycle: 'h23',
  })
  expect(df_23_dt.resolvedOptions().hourCycle).toBe('h23')
  expect(df_23_dt.formatRange(midnight, midnight)).toBe('4/4/19, 00:00')
  expect(df_23_dt.formatRange(noon, noon)).toBe('4/4/19, 12:00')

  let df_24 = new DateTimeFormat('en', {
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h24',
  })
  expect(df_24.resolvedOptions().hourCycle).toBe('h24')
  expect(df_24.formatRange(midnight, midnight)).toBe('24:00')
  expect(df_24.formatRange(noon, noon)).toBe('12:00')

  let df_24_t = new DateTimeFormat('en', {
    timeStyle: 'short',
    hourCycle: 'h24',
  })
  expect(df_24_t.resolvedOptions().hourCycle).toBe('h24')
  expect(df_24_t.formatRange(midnight, midnight)).toBe('24:00')
  expect(df_24_t.formatRange(noon, noon)).toBe('12:00')

  let df_24_dt = new DateTimeFormat('en', {
    timeStyle: 'short',
    dateStyle: 'short',
    hourCycle: 'h24',
  })
  expect(df_24_dt.resolvedOptions().hourCycle).toBe('h24')
  expect(df_24_dt.formatRange(midnight, midnight)).toBe('4/4/19, 24:00')
  expect(df_24_dt.formatRange(noon, noon)).toBe('4/4/19, 12:00')

  let df_11_ja = new DateTimeFormat('ja-JP', {
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h11',
  })
  expect(df_11_ja.resolvedOptions().hourCycle).toBe('h11')
  expect(df_11_ja.formatRange(midnight, midnight)).toBe('午前0:00')
  expect(df_11_ja.formatRange(noon, noon)).toBe('午後0:00')

  let df_11_ja_t = new DateTimeFormat('ja-JP', {
    timeStyle: 'short',
    hourCycle: 'h11',
  })
  expect(df_11_ja_t.resolvedOptions().hourCycle).toBe('h11')
  expect(df_11_ja_t.formatRange(midnight, midnight)).toBe('午前0:00')
  expect(df_11_ja_t.formatRange(noon, noon)).toBe('午後0:00')

  let df_11_ja_dt = new DateTimeFormat('ja-JP', {
    timeStyle: 'short',
    dateStyle: 'short',
    hourCycle: 'h11',
  })
  expect(df_11_ja_dt.resolvedOptions().hourCycle).toBe('h11')
  expect(df_11_ja_dt.formatRange(midnight, midnight)).toBe(
    '2019/04/04 午前0:00'
  )
  expect(df_11_ja_dt.formatRange(noon, noon)).toBe('2019/04/04 午後0:00')

  let df_12_ja = new DateTimeFormat('ja-JP', {
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h12',
  })
  expect(df_12_ja.resolvedOptions().hourCycle).toBe('h12')
  expect(df_12_ja.formatRange(midnight, midnight)).toBe('午前12:00')
  expect(df_12_ja.formatRange(noon, noon)).toBe('午後12:00')

  let df_12_ja_t = new DateTimeFormat('ja-JP', {
    timeStyle: 'short',
    hourCycle: 'h12',
  })
  expect(df_12_ja_t.resolvedOptions().hourCycle).toBe('h12')
  expect(df_12_ja_t.formatRange(midnight, midnight)).toBe('午前12:00')
  expect(df_12_ja_t.formatRange(noon, noon)).toBe('午後12:00')

  let df_12_ja_dt = new DateTimeFormat('ja-JP', {
    timeStyle: 'short',
    dateStyle: 'short',
    hourCycle: 'h12',
  })
  expect(df_12_ja_dt.resolvedOptions().hourCycle).toBe('h12')
  expect(df_12_ja_dt.formatRange(midnight, midnight)).toBe(
    '2019/04/04 午前12:00'
  )
  expect(df_12_ja_dt.formatRange(noon, noon)).toBe('2019/04/04 午後12:00')

  let df_23_ja = new DateTimeFormat('ja-JP', {
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  })
  expect(df_23_ja.resolvedOptions().hourCycle).toBe('h23')
  expect(df_23_ja.formatRange(midnight, midnight)).toBe('0:00')
  expect(df_23_ja.formatRange(noon, noon)).toBe('12:00')

  let df_23_ja_t = new DateTimeFormat('ja-JP', {
    timeStyle: 'short',
    hourCycle: 'h23',
  })
  expect(df_23_ja_t.resolvedOptions().hourCycle).toBe('h23')
  expect(df_23_ja_t.formatRange(midnight, midnight)).toBe('0:00')
  expect(df_23_ja_t.formatRange(noon, noon)).toBe('12:00')

  let df_23_ja_dt = new DateTimeFormat('ja-JP', {
    timeStyle: 'short',
    dateStyle: 'short',
    hourCycle: 'h23',
  })
  expect(df_23_ja_dt.resolvedOptions().hourCycle).toBe('h23')
  expect(df_23_ja_dt.formatRange(midnight, midnight)).toBe('2019/04/04 0:00')
  expect(df_23_ja_dt.formatRange(noon, noon)).toBe('2019/04/04 12:00')

  let df_24_ja = new DateTimeFormat('ja-JP', {
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h24',
  })
  expect(df_24_ja.resolvedOptions().hourCycle).toBe('h24')
  expect(df_24_ja.formatRange(midnight, midnight)).toBe('24:00')
  expect(df_24_ja.formatRange(noon, noon)).toBe('12:00')

  let df_24_ja_t = new DateTimeFormat('ja-JP', {
    timeStyle: 'short',
    hourCycle: 'h24',
  })
  expect(df_24_ja_t.resolvedOptions().hourCycle).toBe('h24')
  expect(df_24_ja_t.formatRange(midnight, midnight)).toBe('24:00')
  expect(df_24_ja_t.formatRange(noon, noon)).toBe('12:00')

  let df_24_ja_dt = new DateTimeFormat('ja-JP', {
    timeStyle: 'short',
    dateStyle: 'short',
    hourCycle: 'h24',
  })
  expect(df_24_ja_dt.resolvedOptions().hourCycle).toBe('h24')
  expect(df_24_ja_dt.formatRange(midnight, midnight)).toBe('2019/04/04 24:00')
  expect(df_24_ja_dt.formatRange(noon, noon)).toBe('2019/04/04 12:00')
})

test('default formatRange pattern (short), #2474', function () {
  const dtf = new DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  })
  let date1 = new Date(Date.UTC(2021, 0, 10)) // "Jan 10, 2021"
  let date2 = new Date(Date.UTC(2021, 0, 20)) // "Jan 20, 2021"
  expect(dtf.formatRange(date1, date2)).toBe(
    'Jan 10, 2021, 12:00\u202fAM – Jan 20, 2021, 12:00\u202fAM'
  )
})

test('default formatRange pattern (long), #2474', function () {
  const dtf = new DateTimeFormat('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  let date1 = new Date(Date.UTC(2021, 0, 10)) // "Jan 10, 2021"
  let date2 = new Date(Date.UTC(2021, 0, 20)) // "Jan 20, 2021"
  expect(dtf.formatRange(date1, date2)).toBe('January 10 – 20, 2021')
})

test('GH issue #4168', function () {
  const dtf = new DateTimeFormat('nl', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  })

  expect(
    dtf.formatRange(
      new Date('2023-10-16T10:00:00'),
      new Date('2023-10-16T14:00:00')
    )
  ).toBe('16 okt 2023, 10:00:00 – 14:00:00')
})

test('GH issue #4535 - same day range should not duplicate date', function () {
  const dtf = new DateTimeFormat('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  })

  const result = dtf.formatRange(
    new Date('2024-09-22T14:00:00'),
    new Date('2024-09-22T16:00:00')
  )
  expect(result).toBe('Sun, 22 Sept 2024, 14:00\u201316:00')
})

test('GH issue #4535 - same day range with hour12:true should not duplicate date (same period)', function () {
  const dtf = new DateTimeFormat('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })

  const result = dtf.formatRange(
    new Date('2024-09-22T14:00:00'),
    new Date('2024-09-22T16:00:00')
  )
  expect(result).toBe('Sun, 22 Sept 2024, 2:00\u2009\u2013\u20094:00\u202fpm')
})

test('GH issue #4535 - same day range with hour12:true crossing AM/PM should not duplicate date', function () {
  const dtf = new DateTimeFormat('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })

  const result = dtf.formatRange(
    new Date('2026-02-18T07:00:00'),
    new Date('2026-02-18T16:00:00')
  )
  expect(result).toBe(
    'Wed, 18 Feb 2026, 7:00\u202fam\u2009\u2013\u20094:00\u202fpm'
  )
})

test('GH issue #4535 - longer same day range should not duplicate date', function () {
  const dtf = new DateTimeFormat('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })

  const result = dtf.formatRange(
    new Date('2026-02-18T07:00:00'),
    new Date('2026-02-18T16:00:00')
  )
  expect(result).toBe('Wed, 18 Feb 2026, 07:00\u201316:00')
})

test('GH issue #4535 - midnight should be 00:00 not 24:00 on next day', function () {
  const dtf = new DateTimeFormat('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })

  const result = dtf.formatRange(
    new Date('2026-05-03T22:00:00'),
    new Date('2026-05-04T00:00:00')
  )

  expect(result).toBe(
    'Sun, 3 May 2026, 22:00\u2009\u2013\u2009Mon, 4 May 2026, 00:00'
  )
})

test('GH issue #4535 - en locale with hour12:true should not duplicate date (numeric)', function () {
  const dtf = new DateTimeFormat('en', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })
  const result = dtf.formatRange(
    new Date('2024-09-22T14:00:00'),
    new Date('2024-09-22T16:00:00')
  )
  expect(result).toBe('Sun, Sep 22, 2:00\u2009\u2013\u20094:00\u202fPM')
})

test('GH issue #4535 - en locale with hour12:true should not duplicate date (2-digit)', function () {
  const dtf = new DateTimeFormat('en', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  const result = dtf.formatRange(
    new Date('2024-09-22T14:00:00'),
    new Date('2024-09-22T16:00:00')
  )
  expect(result).toBe('Sun, Sep 22, 2:00\u2009\u2013\u20094:00\u202fPM')
})

describe('GH issue #4535 - shared parts in formatRange', function () {
  // Verify that shared date fields are not duplicated across various granularities
  it('same year, different month', function () {
    const dtf = new DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    })
    const result = dtf.formatRange(
      new Date('2024-09-22T14:00:00'),
      new Date('2024-10-22T16:00:00')
    )
    expect(result).toBe(
      'Sep 22, 2024, 2:00\u202fPM\u2009\u2013\u2009Oct 22, 2024, 4:00\u202fPM'
    )
  })

  it('same month, different day', function () {
    const dtf = new DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    })
    const result = dtf.formatRange(
      new Date('2024-09-20T14:00:00'),
      new Date('2024-09-22T16:00:00')
    )
    expect(result).toBe(
      'Sep 20, 2:00\u202fPM\u2009\u2013\u2009Sep 22, 4:00\u202fPM'
    )
  })

  it('same day, different hour (hour12)', function () {
    const dtf = new DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    })
    const result = dtf.formatRange(
      new Date('2024-09-22T14:00:00'),
      new Date('2024-09-22T16:00:00')
    )
    expect(result).toBe('Sep 22, 2:00\u2009\u2013\u20094:00\u202fPM')
  })

  it('same day, different hour (24h)', function () {
    const dtf = new DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    })
    const result = dtf.formatRange(
      new Date('2024-09-22T14:00:00'),
      new Date('2024-09-22T16:00:00')
    )
    expect(result).toBe('Sep 22, 14:00\u2009\u2013\u200916:00')
  })

  it('same day, crossing AM/PM boundary', function () {
    const dtf = new DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    })
    const result = dtf.formatRange(
      new Date('2024-09-22T07:00:00'),
      new Date('2024-09-22T16:00:00')
    )
    expect(result).toBe('Sep 22, 7:00\u202fAM\u2009\u2013\u20094:00\u202fPM')
  })

  it('same hour, different minute', function () {
    const dtf = new DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    })
    const result = dtf.formatRange(
      new Date('2024-09-22T14:00:00'),
      new Date('2024-09-22T14:30:00')
    )
    expect(result).toBe('Sep 22, 2:00\u2009\u2013\u20092:30\u202fPM')
  })

  it('same minute, different second', function () {
    const dtf = new DateTimeFormat('en', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
    })
    const result = dtf.formatRange(
      new Date('2024-09-22T14:30:00'),
      new Date('2024-09-22T14:30:45')
    )
    expect(result).toBe('2:30:00\u202fPM\u2009\u2013\u20092:30:45\u202fPM')
  })

  it('different year', function () {
    const dtf = new DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    })
    const result = dtf.formatRange(
      new Date('2024-09-22T14:00:00'),
      new Date('2025-09-22T16:00:00')
    )
    expect(result).toBe(
      'Sep 22, 2024, 2:00\u202fPM\u2009\u2013\u2009Sep 22, 2025, 4:00\u202fPM'
    )
  })

  it('same day with weekday and 2-digit hour (original user report)', function () {
    const dtf = new DateTimeFormat('en', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    const result = dtf.formatRange(
      new Date('2024-09-22T14:00:00'),
      new Date('2024-09-22T16:00:00')
    )
    expect(result).toBe('Sun, Sep 22, 2:00\u2009\u2013\u20094:00\u202fPM')
  })
})

test('GH issue #4535 - same day midnight should show 00:00 not 24:00', function () {
  // Bug report: same-day range starting at midnight shows "24:00-24:45"
  // Output: "Sun, 3 May 2026, 24:00-24:45"
  // Expected: "Sun, 3 May 2026, 00:00–00:45"
  const dtf = new DateTimeFormat('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })

  const result = dtf.formatRange(
    new Date('2026-05-03T00:00:00'),
    new Date('2026-05-03T00:45:00')
  )
  expect(result).toBe('Sun, 3 May 2026, 00:00\u201300:45')
})

it('compares ranges at displayed precision without changing shared patterns', () => {
  const start = Date.UTC(2020, 0, 2, 1, 2, 3, 234)
  const end = Date.UTC(2020, 0, 2, 1, 2, 3, 567)
  const options = {
    timeZone: 'UTC',
    minute: 'numeric',
    second: 'numeric',
  } as const
  const seconds = new DateTimeFormat('en', options)
  expect(seconds.formatRange(start, end)).toBe('02:03')
  expect(
    seconds
      .formatRangeToParts(start, end)
      .every(part => part.source === 'shared')
  ).toBe(true)
  for (const fractionalSecondDigits of [1, 3, 2, 1] as const) {
    const formatter = new DateTimeFormat('en', {
      ...options,
      fractionalSecondDigits,
    })
    expect(formatter.formatRange(start, end)).toBe(
      `${formatter.format(start)}\u2009–\u2009${formatter.format(end)}`
    )
  }
  expect(seconds.formatRange(start, end)).toBe('02:03')
})

it('preserves both day periods across 11 AM and noon', () => {
  const formatter = new DateTimeFormat('en', {
    timeZone: 'UTC',
    hour: 'numeric',
    hour12: true,
  })
  const parts = formatter.formatRangeToParts(
    Date.UTC(2020, 0, 2, 11),
    Date.UTC(2020, 0, 2, 12)
  )
  expect(
    parts.filter(part => part.type === 'dayPeriod').map(part => part.value)
  ).toEqual(['AM', 'PM'])
})

it('keeps date-context month grammar when the month is shared', () => {
  const formatter = new DateTimeFormat('ru', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  })
  const start = Date.UTC(2024, 4, 3)
  const end = Date.UTC(2024, 4, 5)
  const parts = formatter.formatRangeToParts(start, end)
  expect(parts).toContainEqual({type: 'month', value: 'мая', source: 'shared'})
  expect(
    parts.filter(part => part.type === 'day').map(part => part.source)
  ).toEqual(['startRange', 'endRange'])
  expect(parts.map(part => part.value).join('')).toBe(
    formatter.formatRange(start, end)
  )
})

it.each([
  [
    'same date',
    Date.UTC(2024, 4, 3),
    Date.UTC(2024, 4, 3, 0, 45),
    ['24', '24'],
  ],
  [
    'different dates',
    Date.UTC(2024, 4, 3, 22),
    Date.UTC(2024, 4, 4),
    ['22', '24'],
  ],
  ['equal endpoints', Date.UTC(2024, 4, 3), Date.UTC(2024, 4, 3), ['24']],
] as const)('uses h24 midnight for %s', (_name, start, end, hours) => {
  const formatter = new DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h24',
  })
  const parts = formatter.formatRangeToParts(start, end)
  expect(
    parts.filter(part => part.type === 'hour').map(part => part.value)
  ).toEqual(hours)
  expect(parts.map(part => part.value).join('')).toBe(
    formatter.formatRange(start, end)
  )
})

it.each([
  [
    'spring forward',
    Date.UTC(2024, 2, 10, 6, 30),
    Date.UTC(2024, 2, 10, 7, 30),
    ['01', '03'],
  ],
  [
    'fall back',
    Date.UTC(2024, 10, 3, 4, 30),
    Date.UTC(2024, 10, 3, 7, 30),
    ['00', '02'],
  ],
] as const)('uses each endpoint time across %s', (_name, start, end, hours) => {
  const formatter = new DateTimeFormat('en-GB', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  const parts = formatter.formatRangeToParts(start, end)
  expect(parts.filter(part => part.type === 'hour')).toEqual([
    {type: 'hour', value: hours[0], source: 'startRange'},
    {type: 'hour', value: hours[1], source: 'endRange'},
  ])
  expect(parts.map(part => part.value).join('')).toBe(
    formatter.formatRange(start, end)
  )
})

it('uses CLDR fallback hour width independently of single-date width', () => {
  const formatter = new DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
  const start = Date.UTC(2024, 0, 15, 5, 15)
  const end = Date.UTC(2024, 0, 17, 5, 45)
  expect(
    formatter.formatToParts(start).find(part => part.type === 'hour')?.value
  ).toBe('5')
  expect(
    formatter
      .formatRangeToParts(start, end)
      .filter(part => part.type === 'hour')
      .map(part => part.value)
  ).toEqual(['05', '05'])
})

it('formats shared timezone fields from the start endpoint across DST', () => {
  const formatter = new DateTimeFormat('en', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'long',
  })
  const start = Date.UTC(2024, 2, 10, 6, 59)
  const end = Date.UTC(2024, 2, 10, 7)
  expect(
    formatter
      .formatRangeToParts(start, end)
      .filter(part => part.type === 'timeZoneName')
  ).toEqual([{type: 'timeZoneName', value: 'EST', source: 'shared'}])
})

it('retains both flexible periods when their boundary precedes the hour difference', () => {
  const formatter = new DateTimeFormat('en', {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h12',
    dayPeriod: 'long',
  })
  expect(
    formatter
      .formatRangeToParts(
        Date.UTC(2026, 10, 6, 17),
        Date.UTC(2026, 10, 6, 18, 15)
      )
      .filter(part => part.type === 'dayPeriod')
  ).toEqual([
    {type: 'dayPeriod', value: 'in the afternoon', source: 'startRange'},
    {type: 'dayPeriod', value: 'in the evening', source: 'endRange'},
  ])
})

it('uses the closest CLDR zoned fallback independently of single-date widths', () => {
  const formatter = new DateTimeFormat('fa', {
    calendar: 'gregory',
    numberingSystem: 'latn',
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'long',
  })
  const start = Date.UTC(2024, 0, 15, 10, 15)
  const end = Date.UTC(2024, 0, 17, 10, 45)
  expect(
    formatter.formatToParts(start).find(part => part.type === 'hour')?.value
  ).toBe('5')
  expect(
    formatter
      .formatRangeToParts(start, end)
      .filter(part => part.type === 'hour')
      .map(part => part.value)
  ).toEqual(['05', '05'])
})

it('uses numeric CLDR dates for combined medium-style intervals', () => {
  const formatter = new DateTimeFormat('zh', {
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const start = Date.UTC(2024, 0, 15, 10, 15)
  expect(formatter.formatRange(start, Date.UTC(2024, 0, 15, 11, 45))).toBe(
    '2024/1/15 10:15–11:45'
  )
  expect(formatter.formatRange(start, Date.UTC(2024, 0, 17, 10, 45))).toBe(
    '2024/1/15 10:15 – 2024/1/17 10:45'
  )
})

it('uses complete fallback endpoints when an AM/PM interval is absent', () => {
  const base = en as unknown as Parameters<
    typeof DateTimeFormat.__addLocaleData
  >[0]
  DateTimeFormat.__addLocaleData({
    ...base,
    locale: 'en-XA',
    data: {
      ...base.data,
      calendarData: {},
      ca: ['gregory'],
      formats: {gregory: {hm: 'h:mm a'}},
      intervalFormats: {
        intervalFormatFallback: '{0} – {1}',
        hm: {h: 'h:mm–h:mm a', m: 'h:mm–h:mm a'},
      },
    },
  })
  const formatter = new DateTimeFormat('en-XA', {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  expect(
    formatter.formatRange(Date.UTC(2024, 0, 15, 1), Date.UTC(2024, 0, 15, 13))
  ).toBe('1:00 AM – 1:00 PM')
})

test('compact interval templates preserve connectors and endpoint order', () => {
  const base = en as unknown as Parameters<
    typeof DateTimeFormat.__addLocaleData
  >[0]
  DateTimeFormat.__addLocaleData({
    ...base,
    locale: 'en-XB',
    data: {
      ...base.data,
      calendarData: {},
      ca: ['gregory'],
      formats: {gregory: {'yMMMd, Hm': 'MMM d, y HH:mm'}},
      intervalFormats: {intervalFormatFallback: '{1} – {0}'},
      intervalFormatTemplates: {
        dates: [['yMMMd', 'MMM d, y', '{1}, {0}', "{1} 'at' {0}"]],
        times: [
          [
            'Hm',
            'HH:mm',
            {
              H: 'latestFirst:HH:mm–HH:mm',
              fallback: 'HH:mm–HH:mm',
            },
          ],
        ],
      },
    },
  })
  const formatter = new DateTimeFormat('en-XB', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  const start = Date.UTC(2024, 0, 15, 10, 15)
  const end = Date.UTC(2024, 0, 15, 11, 45)
  expect(formatter.formatRange(start, end)).toBe('Jan 15, 2024, 11:45–10:15')
  expect(formatter.formatRange(start, end + 86400000)).toBe(
    'Jan 16, 2024 at 11:45 – Jan 15, 2024 at 10:15'
  )
  expect(
    formatter
      .formatRangeToParts(start, end)
      .filter(part => part.type === 'hour')
      .map(part => part.source)
  ).toEqual(['endRange', 'startRange'])
})

it.each(['h11', 'h12'] as const)(
  'keeps default CLDR spacing for en-GB %s',
  hourCycle => {
    const formatter = new DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle,
    })
    expect(formatter.format(Date.UTC(2024, 0, 15, 12))).toBe(
      `${hourCycle === 'h11' ? '00' : '12'}:00\u202fpm`
    )
  }
)

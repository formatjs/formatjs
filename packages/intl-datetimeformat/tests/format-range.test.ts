import '@formatjs/intl-getcanonicallocales/polyfill'
import '@formatjs/intl-locale/polyfill'
import {DateTimeFormat} from '../src/core'
import * as en from './locale-data/en.json'
import * as enGB from './locale-data/en-GB.json'
import * as zhHans from './locale-data/zh-Hans.json'
import * as fa from './locale-data/fa.json'
import allData from '../src/data/all-tz'

// @ts-ignore
DateTimeFormat.__addLocaleData(en, enGB, zhHans, fa)
DateTimeFormat.__addTZData(allData)
describe('DateTimeFormat range format', function () {
  it('basic', function () {
    const d1 = new Date(2020, 1, 1)
    const d2 = new Date(2020, 1, 15)
    const dtf = new DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
    })
    expect(dtf.formatRange(d1, d2)).toBe('Feb 1 – 15')
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
        source: 'startRange',
        type: 'month',
        value: 'Feb',
      },
      {
        source: 'startRange',
        type: 'literal',
        value: ' ',
      },
      {
        source: 'startRange',
        type: 'day',
        value: '1',
      },
      {
        source: 'startRange',
        type: 'literal',
        value: ' – ',
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

  expect(dtf.formatRange(date1, date2)).toBe('1/3/2019 – 1/5/2019')
  expect(dtf.formatRange(date1, date3)).toBe('1/3/2019 – 3/4/2019')
  expect(dtf.formatRange(date1, date4)).toBe('1/3/2019 – 3/4/2020')
  expect(dtf.formatRange(date2, date3)).toBe('1/5/2019 – 3/4/2019')
  expect(dtf.formatRange(date2, date4)).toBe('1/5/2019 – 3/4/2020')
  expect(dtf.formatRange(date3, date4)).toBe('3/4/2019 – 3/4/2020')
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
  expect(dtf.formatRange(date1, date2)).toBe('Jan 3 – 5, 2019')
  expect(dtf.formatRange(date1, date3)).toBe('Jan 3 – Mar 4, 2019')
  expect(dtf.formatRange(date1, date4)).toBe('Jan 3, 2019 – Mar 4, 2020')
  expect(dtf.formatRange(date2, date3)).toBe('Jan 5 – Mar 4, 2019')
  expect(dtf.formatRange(date2, date4)).toBe('Jan 5, 2019 – Mar 4, 2020')
  expect(dtf.formatRange(date3, date4)).toBe('Mar 4, 2019 – Mar 4, 2020')
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
    'Jan 10, 2021, 12:00 AM – Jan 20, 2021, 12:00 AM'
  )
})

// TODO: This is still off
test.skip('default formatRange pattern (long), #2474', function () {
  const dtf = new DateTimeFormat('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  let date1 = new Date(Date.UTC(2021, 0, 10)) // "Jan 10, 2021"
  let date2 = new Date(Date.UTC(2021, 0, 20)) // "Jan 20, 2021"
  expect(dtf.formatRange(date1, date2)).toBe('January 10 – 20, 2021')
})

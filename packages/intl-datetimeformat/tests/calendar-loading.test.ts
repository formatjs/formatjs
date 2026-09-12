import {expect, test} from 'vitest'
import {DateTimeFormat} from '#packages/intl-datetimeformat/core.js'
import hebrew from '#packages/ecma402-abstract/DateTimeFormat/calendars/hebrew.js'
import chinese from '#packages/ecma402-abstract/DateTimeFormat/calendars/chinese.js'
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

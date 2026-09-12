import data from '#packages/ecma402-abstract/DateTimeFormat/calendars/all.js'
import {CalendarDateFromTime as convert} from '#packages/ecma402-abstract/DateTimeFormat/CalendarDateFromTime.js'
import {describe, expect, test} from 'vitest'

const registry = Object.fromEntries(
  data.map(({calendar, dateFromTime}) => [calendar, dateFromTime])
)
const CalendarDateFromTime = (t: number, calendar: string) =>
  convert(t, calendar, registry)

const calendars = [
  'gregory',
  'iso8601',
  'buddhist',
  'roc',
  'coptic',
  'ethiopic',
  'ethioaa',
  'japanese',
  'indian',
  'islamic-civil',
  'islamic-tbla',
  'islamic-umalqura',
  'persian',
  'hebrew',
  'chinese',
  'dangi',
]

describe('CalendarDateFromTime', () => {
  test('calendar conversion does not require native DateTimeFormat', () => {
    const date = (globalThis as any).Temporal.PlainDate.from('2024-03-11')
    const expected = calendars.map(calendar => {
      const value = date.withCalendar(calendar)
      return [value.eraYear ?? value.year, value.month, value.day]
    })
    const previous = Object.getOwnPropertyDescriptor(Intl, 'DateTimeFormat')!
    let actual
    try {
      Object.defineProperty(Intl, 'DateTimeFormat', {
        configurable: true,
        get() {
          throw new Error('native DateTimeFormat accessed')
        },
      })
      actual = calendars.map(calendar => {
        const value = CalendarDateFromTime(Date.UTC(2024, 2, 11), calendar)
        return [value.year, value.month + 1, value.day]
      })
    } finally {
      Object.defineProperty(Intl, 'DateTimeFormat', previous)
    }
    expect(actual).toEqual(expected)
  })

  test.each(calendars)(
    '%s agrees with Temporal across era boundaries and leap cycles',
    calendar => {
      const formatter = new Intl.DateTimeFormat('en', {
        calendar,
        timeZone: 'UTC',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      })
      expect(formatter.resolvedOptions().calendar).toBe(calendar)
      for (const year of [
        -5500, -544, -543, -1, 0, 1, 8, 9, 283, 284, 1900, 1911, 1912, 1999,
        2000, 2023, 2024, 2100, 1881, 1882, 1883, 2174, 2175, 2176,
      ]) {
        for (let month = 0; month < 12; month++) {
          for (const day of [1, 6, 11, 28, 30, 31]) {
            const date = new Date(0)
            date.setUTCFullYear(year, month, day)
            const parts = Object.fromEntries(
              formatter.formatToParts(date).map(part => [part.type, part.value])
            )
            const temporal = (globalThis as any).Temporal.PlainDate.from(
              date.toISOString().split('T')[0]
            ).withCalendar(calendar)
            const result = CalendarDateFromTime(+date, calendar)
            // Gregorian/ISO formatting uses era years. Other calendars use
            // Temporal's proleptic conversion, avoiding ICU's old Julian cutover.
            const expected =
              calendar === 'gregory' || calendar === 'iso8601'
                ? [Number(parts.year), Number(parts.month), Number(parts.day)]
                : [
                    temporal.eraYear ?? temporal.year,
                    temporal.month,
                    temporal.day,
                  ]
            expect(
              [result.year, result.month + 1, result.day],
              `${calendar} ${date.toISOString()}`
            ).toEqual([...expected])
          }
        }
      }
    }
  )

  test('keeps calendar-specific era numbering', () => {
    expect(CalendarDateFromTime(Date.UTC(1911, 11, 31), 'roc')).toMatchObject({
      era: '0',
      year: 1,
    })
    expect(CalendarDateFromTime(Date.UTC(1912, 0, 1), 'roc')).toMatchObject({
      era: '1',
      year: 1,
    })
    expect(CalendarDateFromTime(Date.UTC(2024, 8, 11), 'coptic')).toEqual({
      era: '1',
      year: 1741,
      month: 0,
      day: 1,
    })
    expect(CalendarDateFromTime(Date.UTC(2024, 8, 11), 'ethiopic')).toEqual({
      era: '1',
      year: 2017,
      month: 0,
      day: 1,
    })
    expect(CalendarDateFromTime(Date.UTC(2024, 8, 11), 'ethioaa')).toEqual({
      era: '0',
      year: 7517,
      month: 0,
      day: 1,
    })
  })

  test.each(['chinese', 'dangi'])(
    '%s agrees with Temporal across the full Date range',
    calendar => {
      for (let index = 0; index <= 256; index++) {
        const epochDay = Math.floor(-100000000 + (200000000 * index) / 256)
        const milliseconds = epochDay * 86400000
        const date = new Date(milliseconds)
        const temporal = (globalThis as any).Temporal.PlainDate.from(
          date.toISOString().split('T')[0]
        ).withCalendar(calendar)
        const result = CalendarDateFromTime(milliseconds, calendar)
        expect(
          [result.year, result.month + 1, result.day],
          `${calendar} ${date.toISOString()}`
        ).toEqual([temporal.year, temporal.month, temporal.day])
      }
    }
  )

  test('rejects unimplemented calendars', () => {
    expect(() => CalendarDateFromTime(0, 'unknown')).toThrow(RangeError)
  })
})

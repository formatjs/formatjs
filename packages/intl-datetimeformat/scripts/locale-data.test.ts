import {readFileSync} from 'node:fs'
import {runInNewContext} from 'node:vm'
import {expect, test} from 'vitest'

const source = readFileSync(
  new URL('../locale-data/en.js', import.meta.url),
  'utf8'
)
const expected = JSON.parse(
  readFileSync(new URL('../cldr-raw/en.json', import.meta.url), 'utf8')
)

const {calendarData, formats, ...base} = expected.data
const gregorian = {
  ...expected,
  data: {
    ...base,
    formats: {gregory: formats.gregory, iso8601: formats.iso8601},
  },
}

test('base locale registers only Gregorian patterns', () => {
  const registered: unknown[] = []
  runInNewContext(source, {
    Intl: {
      DateTimeFormat: {
        __addLocaleData(data: unknown) {
          registered.push(data)
        },
      },
    },
  })
  expect(registered).toHaveLength(1)
  expect(JSON.parse(JSON.stringify(registered[0]))).toEqual(gregorian)
})

test('base locale queues before installation', () => {
  const queue: unknown[] = ['existing']
  runInNewContext(source, {Intl: {}, __FORMATJS_DATETIMEFORMAT_DATA__: queue})
  expect(queue).toHaveLength(2)
  expect(queue[0]).toBe('existing')
  expect(JSON.parse(JSON.stringify(queue[1]))).toEqual(gregorian)
})

const hebrewSource = readFileSync(
  new URL('../calendar-data/hebrew/en.js', import.meta.url),
  'utf8'
)
const hebrew = {
  locale: 'en',
  calendar: 'hebrew',
  data: calendarData.hebrew,
  formats: formats.hebrew,
}

test('calendar locale module contains only its own names and patterns', () => {
  const received: unknown[] = []
  runInNewContext(hebrewSource, {
    Intl: {
      DateTimeFormat: {
        __addCalendarLocaleData(data: unknown) {
          received.push(data)
        },
      },
    },
  })
  expect(JSON.parse(JSON.stringify(received))).toEqual([hebrew])
  expect(source.length).toBeLessThan(JSON.stringify(expected).length / 2)
})

test('calendar locale module queues before installation', () => {
  const queue: unknown[] = []
  runInNewContext(hebrewSource, {
    Intl: {},
    __FORMATJS_DATETIMEFORMAT_CALENDAR_LOCALE_DATA__: queue,
  })
  expect(JSON.parse(JSON.stringify(queue))).toEqual([hebrew])
})

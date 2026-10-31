import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync, readdirSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {expect, it} from 'vitest'
import {DateTimeFormat as Reference} from '@formatjs/intl-datetimeformat'

type RawLocale = Parameters<typeof Reference.__addLocaleData>[number]
type Packed = RawLocale & {number: unknown}
const resolve = (file: string) =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${file}`)
function run<T = unknown>(request: unknown): T {
  const result = spawnSync(
    resolve('crates/intl_datetimeformat/pattern_conformance'),
    [],
    {
      input: JSON.stringify(request) + '\n',
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    }
  )
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  return JSON.parse(result.stdout) as T
}
it('loads and parses every generated base locale pack without optional calendar payloads', () => {
  const directory = dirname(
    resolve('crates/intl_datetimeformat/locale-data/en.json')
  )
  const files = readdirSync(directory)
    .filter(file => file.endsWith('.json'))
    .sort()
    .map(file => join(directory, file))
  const actual = run<
    Array<{
      locale: string
      available: string[]
      calendars: string[]
      count: number
      decimal: string
    }>
  >({method: 'packs', files})
  expect(actual.length).toBe(files.length)
  expect(files.length).toBe(657)
  for (let index = 0; index < files.length; index++) {
    const entry = JSON.parse(readFileSync(files[index], 'utf8')) as Packed
    expect(entry.data.calendarData, entry.locale).toBeUndefined()
    expect(
      Object.keys(entry.data.formats).every(
        calendar => calendar === 'gregory' || calendar === 'iso8601'
      ),
      entry.locale
    ).toBe(true)
    expect(actual[index], files[index]).toMatchObject({
      locale: entry.locale,
      available: entry.data.ca.filter(
        calendar => calendar === 'gregory' || calendar === 'iso8601'
      ),
      calendars: ['gregory', 'iso8601'],
      count: Object.keys(entry.data.formats.gregory).length,
    })
    expect(actual[index].decimal, entry.locale).not.toBe('')
  }
}, 120000)
it('preserves TS base data and supplies native numeric dependencies for rendering', () => {
  const tzJson = readFileSync(
    resolve('packages/intl-datetimeformat/tz-all.json'),
    'utf8'
  )
  for (const locale of ['en', 'fr', 'ar', 'ja', 'zh-Hans', 'ru', 'hi', 'he']) {
    const entry = JSON.parse(
      readFileSync(
        resolve(`crates/intl_datetimeformat/locale-data/${locale}.json`),
        'utf8'
      )
    ) as Packed
    const raw = JSON.parse(
      readFileSync(
        resolve(`packages/intl-datetimeformat/cldr-raw/${locale}.json`),
        'utf8'
      )
    ) as RawLocale
    const {calendarData: _calendars, formats, ...data} = raw.data
    expect(entry.data, locale).toEqual({
      ...data,
      formats: {
        gregory: formats.gregory,
        ...(formats.iso8601 ? {iso8601: formats.iso8601} : {}),
      },
    })
    expect(entry.number, locale).toEqual(
      JSON.parse(
        readFileSync(
          resolve(`crates/intl_numberformat/locale-data/${locale}.json`),
          'utf8'
        )
      )
    )
    Reference.localeData = {}
    Reference.availableLocales = new Set()
    Reference.__defaultLocale = ''
    Reference.calendarData = Object.create(null)
    Reference.__addLocaleData(entry)
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
      timeZone: '+05:30',
      numberingSystem: 'mathbold',
    }
    const formatter = new Reference([locale], options)
    const actual = run({
      method: 'render',
      json: JSON.stringify(entry),
      tzJson,
      cases: [
        {locales: [locale], options, values: [{type: 'date', value: '-1'}]},
      ],
    })
    expect(actual, locale).toEqual([
      [{parts: formatter.formatToParts(-1), text: formatter.format(-1)}],
    ])
  }
})

it('uses valid hour cycles and GMT fallback for sparse timezone names', () => {
  const tzJson = readFileSync(
    resolve('packages/intl-datetimeformat/tz-all.json'),
    'utf8'
  )
  for (const locale of ['agq', 'zh-Hant', 'ms', 'pt-CV']) {
    const entry = JSON.parse(
      readFileSync(
        resolve(`crates/intl_datetimeformat/locale-data/${locale}.json`),
        'utf8'
      )
    ) as Packed
    Reference.localeData = {}
    Reference.availableLocales = new Set()
    Reference.__defaultLocale = ''
    Reference.calendarData = Object.create(null)
    Reference.__addLocaleData(entry)
    Reference.__addTZData(JSON.parse(tzJson))
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Atlantic/Azores',
      timeZoneName: 'short',
    }
    const formatter = new Reference([locale], options)
    expect(['h11', 'h12', 'h23', 'h24']).toContain(
      formatter.resolvedOptions().hourCycle
    )
    const values = ['0', '1719792000000'].map(value => ({type: 'date', value}))
    const actual = run({
      method: 'render',
      json: JSON.stringify(entry),
      tzJson,
      cases: [{locales: [locale], options, values}],
    })
    expect(actual, locale).toEqual([
      values.map(({value}) => ({
        parts: formatter.formatToParts(Number(value)),
        text: formatter.format(Number(value)),
      })),
    ])
    expect(
      formatter.formatToParts(0).every(part => typeof part.value === 'string'),
      locale
    ).toBe(true)
  }
})

it.each([0, 1, 2, 3, 4])(
  'loads every optional calendar locale patch independently of arithmetic, batch %i',
  batch => {
    const directory = dirname(
      resolve('crates/intl_datetimeformat/locale-data/en.json')
    )
    const allBaseFiles = readdirSync(directory)
      .filter(file => file.endsWith('.json'))
      .sort()
      .map(file => join(directory, file))
    const size = Math.ceil(allBaseFiles.length / 5)
    const baseFiles = allBaseFiles.slice(batch * size, (batch + 1) * size)
    const calendars = [
      'buddhist',
      'chinese',
      'coptic',
      'dangi',
      'ethioaa',
      'ethiopic',
      'hebrew',
      'indian',
      'islamic-civil',
      'islamic-tbla',
      'islamic-umalqura',
      'japanese',
      'persian',
      'roc',
    ]
    const directories = Object.fromEntries(
      calendars.map(calendar => [
        calendar,
        dirname(
          resolve(
            `packages/intl-datetimeformat-calendar-${calendar}/locale-data-json/en.json`
          )
        ),
      ])
    )
    const rows = run<Array<{locale: string; calendar: string; count: number}>>({
      method: 'calendarPacks',
      baseFiles,
      directories,
    })
    expect(rows.length).toBe(baseFiles.length * calendars.length)
    expect(new Set(rows.map(row => row.calendar))).toEqual(new Set(calendars))
    expect(new Set(rows.map(row => row.locale)).size).toBe(baseFiles.length)
    expect(rows.every(row => row.count > 0)).toBe(true)
  },
  240000
)

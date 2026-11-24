import {readFileSync} from 'node:fs'
import {createContext, runInContext} from 'node:vm'
import {runfiles} from '@bazel/runfiles'
import {expect, it} from 'vitest'
import {DateTimeFormat} from '#packages/intl-datetimeformat/core.js'
import en from '#packages/intl-datetimeformat/tests/locale-data/en.json' with {type: 'json'}
import data from '@formatjs_generated/tz/all-tz.js'

it('resolves the host provider’s own ASCII time zone against loaded data', () => {
  const context = createContext({
    localeData: en,
    timeZoneData: data,
    hostOptions: undefined,
  })
  runInContext(
    `Intl.DateTimeFormat = class {
      resolvedOptions() {
        return hostOptions ?? {timeZone: hostTimeZone}
      }
    }`,
    context
  )
  runInContext(
    readFileSync(new URL('../polyfill.iife.js', import.meta.url), 'utf8'),
    context
  )
  runInContext(
    `Intl.DateTimeFormat.__addLocaleData(localeData)
     Intl.DateTimeFormat.__addTZData(timeZoneData)`,
    context
  )
  for (const [hostTimeZone, expected] of [
    ['asia/tokyo', 'Asia/Tokyo'],
    ['Aſia/Tokyo', 'UTC'],
    ['+0530', '+05:30'],
    ['+24:00', 'UTC'],
    ['Unknown/Zone', 'UTC'],
  ]) {
    context.hostTimeZone = hostTimeZone
    expect(
      runInContext(
        "new Intl.DateTimeFormat('en').resolvedOptions().timeZone",
        context
      ),
      hostTimeZone
    ).toBe(expected)
  }
  let reads = 0
  const options = {
    get timeZone() {
      reads++
      return 'Asia/Tokyo'
    },
  }
  for (const hostOptions of [options, Object.create(options)]) {
    context.hostOptions = hostOptions
    expect(
      runInContext(
        "new Intl.DateTimeFormat('en').resolvedOptions().timeZone",
        context
      )
    ).toBe('UTC')
  }
  expect(reads).toBe(0)

  context.hostOptions = {timeZone: 'europe/uzhgorod'}
  for (const [zones, expected, hour] of [
    [['Europe/Uzhgorod|,0,0,0'], 'Europe/Uzhgorod', '02'],
    [['Europe/Uzhgorod|,0,0,0', 'Europe/Kyiv|,0,1,0'], 'Europe/Kyiv', '03'],
    [[], 'UTC', '00'],
  ] as const) {
    context.timeZoneData = {abbrvs: 'EET', offsets: '5k0|8c0', zones}
    const actual = runInContext(
      `(() => {
        Intl.DateTimeFormat.__addTZData(timeZoneData)
        const formatter = new Intl.DateTimeFormat('en', {hour: 'numeric', hourCycle: 'h23'})
        return [formatter.resolvedOptions().timeZone, formatter.format(0)]
      })()`,
      context
    )
    expect(actual).toEqual([expected, hour])
  }
})

it('installs when the host time-zone probe cannot be read', () => {
  const context = createContext({localeData: en})
  runInContext(
    `Intl.DateTimeFormat = class {
      get resolvedOptions() { throw new Error('Host probe unavailable') }
    }`,
    context
  )
  runInContext(
    readFileSync(new URL('../polyfill.iife.js', import.meta.url), 'utf8'),
    context
  )
  expect(
    runInContext(
      `Intl.DateTimeFormat.__addLocaleData(localeData)
       new Intl.DateTimeFormat('en').resolvedOptions().timeZone`,
      context
    )
  ).toBe('UTC')
})

it('preserves direct zone names and historical offset seconds against ICU', () => {
  DateTimeFormat.__addLocaleData(en as any)
  DateTimeFormat.__addTZData(data)
  const fixture = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/historical-timezone-fixtures.tsv`
  )
  const rows = readFileSync(fixture, 'utf8').trim().split('\n')
  expect(rows).toHaveLength(64)
  for (const row of rows) {
    const [timeZone, epoch, width, expected] = row.split('\t')
    const formatter = new DateTimeFormat('en', {
      timeZone,
      timeZoneName: width as Intl.DateTimeFormatOptions['timeZoneName'],
    })
    expect(
      formatter
        .formatToParts(Number(epoch))
        .find(part => part.type === 'timeZoneName')?.value,
      row
    ).toBe(expected)
  }
})

it('keeps the primary host zone when its transitions share another zone', () => {
  DateTimeFormat.__addLocaleData(en as any)
  const previous = process.env.TZ
  process.env.TZ = 'Africa/Accra'
  try {
    DateTimeFormat.__setDefaultTimeZone()
    DateTimeFormat.__addTZData({
      ...data,
      zones: data.zones.filter(zone => !zone.startsWith('Africa/Accra|')),
    })
    const options = {hour: 'numeric', timeZoneName: 'short'} as const
    const formatter = new DateTimeFormat('en', options)
    expect(formatter.resolvedOptions().timeZone).toBe('Africa/Accra')
    expect(formatter.format(0)).toBe(
      new DateTimeFormat('en', {...options, timeZone: 'Africa/Accra'}).format(0)
    )
  } finally {
    if (previous === undefined) delete process.env.TZ
    else process.env.TZ = previous
    DateTimeFormat.__addTZData(data)
  }
})

it('uses the host zone after a timeZone getter returns undefined', () => {
  DateTimeFormat.__addLocaleData(en as any)
  DateTimeFormat.__addTZData(data)
  const previous = process.env.TZ
  const options = {
    get timeZone() {
      process.env.TZ = 'Asia/Tokyo'
      return undefined
    },
  }
  try {
    process.env.TZ = 'Etc/UTC'
    const native = new Intl.DateTimeFormat('en', options).resolvedOptions()
    process.env.TZ = 'Etc/UTC'
    const actual = new DateTimeFormat('en', options).resolvedOptions()
    expect(native.timeZone).toBe('Asia/Tokyo')
    expect(actual.timeZone).toBe(native.timeZone)
  } finally {
    if (previous === undefined) delete process.env.TZ
    else process.env.TZ = previous
  }
})

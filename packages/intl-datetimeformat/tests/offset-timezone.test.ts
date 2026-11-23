import '@formatjs/intl-getcanonicallocales/polyfill.js'
import '@formatjs/intl-locale/polyfill.js'
import {DateTimeFormat} from '#packages/intl-datetimeformat/core'
import allData from '@formatjs_generated/tz/all-tz.js'
import enGB from '#packages/intl-datetimeformat/tests/locale-data/en-GB.json' with {type: 'json'}
import en from '#packages/intl-datetimeformat/tests/locale-data/en.json' with {type: 'json'}
import {describe, expect, it, afterEach} from 'vitest'

// @ts-ignore
DateTimeFormat.__addLocaleData(en, enGB)
DateTimeFormat.__addTZData(allData)

const DEFAULT_TIMEZONE = DateTimeFormat.getDefaultTimeZone()

describe('Intl.DateTimeFormat with UTC offset timezones', function () {
  afterEach(() => {
    DateTimeFormat.__setDefaultTimeZone(DEFAULT_TIMEZONE)
  })

  it('formats fixed IANA zones without a transition pack', () => {
    DateTimeFormat.__addTZData({abbrvs: '', offsets: '', zones: []})
    try {
      for (const [timeZone, identifier, hour] of [
        ['etc/gmt+1', 'Etc/GMT+1', '23'],
        ['Etc/GMT+12', 'Etc/GMT+12', '12'],
        ['Etc/GMT-14', 'Etc/GMT-14', '14'],
      ]) {
        const formatter = new DateTimeFormat('en-GB', {
          timeZone,
          hour: 'numeric',
          hourCycle: 'h23',
        })
        expect(formatter.resolvedOptions().timeZone).toBe(identifier)
        expect(formatter.formatToParts(0)).toContainEqual({
          type: 'hour',
          value: hour,
        })
      }
      for (const timeZone of ['Etc/GMT+01', 'Etc/GMT+13', 'Etc/GMT-15']) {
        expect(() => new DateTimeFormat('en-GB', {timeZone})).toThrow(
          RangeError
        )
      }
    } finally {
      DateTimeFormat.__addTZData(allData)
    }
  })

  it('requires transition data for explicit IANA zones and their aliases', () => {
    DateTimeFormat.__addTZData({abbrvs: '', offsets: '', zones: []})
    try {
      for (const timeZone of ['America/New_York', 'US/Eastern']) {
        expect(() => new DateTimeFormat('en-GB', {timeZone})).toThrow(
          RangeError
        )
      }
      for (const timeZone of ['GMT', 'Etc/UTC', 'Etc/GMT']) {
        expect(new DateTimeFormat('en-GB', {timeZone}).format(0)).toBe(
          '01/01/1970'
        )
      }
      DateTimeFormat.__addTZData({
        abbrvs: 'EST',
        offsets: '-dw0',
        zones: ['US/Eastern|,0,0,0'],
      })
      const alias = new DateTimeFormat('en-GB', {
        timeZone: 'us/eastern',
        hour: 'numeric',
        hourCycle: 'h23',
      })
      expect(alias.resolvedOptions().timeZone).toBe('US/Eastern')
      expect(alias.formatToParts(0)).toContainEqual({type: 'hour', value: '19'})
    } finally {
      DateTimeFormat.__addTZData(allData)
    }
    const formatter = new DateTimeFormat('en-GB', {
      timeZone: 'us/eastern',
      hour: 'numeric',
      hourCycle: 'h23',
    })
    expect(formatter.resolvedOptions().timeZone).toBe('US/Eastern')
    expect(formatter.formatToParts(0)).toContainEqual({
      type: 'hour',
      value: '19',
    })
  })

  it('falls back while a configured zone is missing from the current pack', () => {
    const options = {hour: 'numeric', hourCycle: 'h23'} as const
    DateTimeFormat.__setDefaultTimeZone('US/Eastern')
    try {
      DateTimeFormat.__addTZData({abbrvs: '', offsets: '', zones: []})
      expect(
        new DateTimeFormat('en-GB', options).resolvedOptions().timeZone
      ).toBe('UTC')
      DateTimeFormat.__addTZData({
        abbrvs: 'EDT',
        offsets: '-b40',
        zones: ['US/Eastern|,0,0,0'],
      })
      const formatter = new DateTimeFormat('en-GB', options)
      expect(formatter.resolvedOptions().timeZone).toBe('US/Eastern')
      expect(formatter.formatToParts(0)).toContainEqual({
        type: 'hour',
        value: '20',
      })
    } finally {
      DateTimeFormat.__addTZData(allData)
    }
  })

  it('should accept +01:00 offset timezone', function () {
    expect(
      () =>
        new DateTimeFormat('en-GB', {
          timeZone: '+01:00',
          hour: 'numeric',
          minute: 'numeric',
        })
    ).not.toThrow()
  })

  it('should accept -05:00 offset timezone', function () {
    expect(
      () =>
        new DateTimeFormat('en-GB', {
          timeZone: '-05:00',
          hour: 'numeric',
        })
    ).not.toThrow()
  })

  it('should accept +00:00 (UTC offset)', function () {
    expect(
      () =>
        new DateTimeFormat('en-GB', {
          timeZone: '+00:00',
          hour: 'numeric',
        })
    ).not.toThrow()
  })

  it('should accept various offset formats', function () {
    const formats = ['+01', '+0100', '+01:00', '+01:30']
    formats.forEach(timeZone => {
      expect(() => new DateTimeFormat('en-GB', {timeZone})).not.toThrow()
    })
  })

  it('resolves fixed offsets without reading inherited named-zone entries', () => {
    const timeZone = '+0530'
    const original = Object.getOwnPropertyDescriptor(Object.prototype, timeZone)
    let resolved: string
    let resolvedDefault: string
    try {
      Object.defineProperty(Object.prototype, timeZone, {
        configurable: true,
        get() {
          throw new Error('read inherited named-zone entry')
        },
      })
      resolved = new DateTimeFormat('en-GB', {timeZone}).resolvedOptions()
        .timeZone
      DateTimeFormat.__setDefaultTimeZone(timeZone)
      resolvedDefault = new DateTimeFormat('en-GB').resolvedOptions().timeZone
    } finally {
      if (original) Object.defineProperty(Object.prototype, timeZone, original)
      else Reflect.deleteProperty(Object.prototype, timeZone)
    }
    expect(resolved).toBe('+05:30')
    expect(resolvedDefault).toBe('+05:30')
  })

  it('should reject invalid offset timezones', function () {
    const invalidFormats = [
      '+05:30:45', // Seconds are not allowed by CreateDateTimeFormat
      '+24:00', // Out of range
      '+01:60', // Invalid minutes
      '+1:00', // Wrong format
      '01:00', // Missing sign
    ]
    invalidFormats.forEach(timeZone => {
      expect(() => new DateTimeFormat('en-GB', {timeZone})).toThrow(RangeError)
    })
  })

  it('should format with +01:00 offset timezone', function () {
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
    const result = dtf.format(new Date(0))
    expect(result).toContain('01:00')
    expect(result).toContain('1970')
  })

  it('should format with -05:00 offset timezone', function () {
    const dtf = new DateTimeFormat('en-GB', {
      timeZone: '-05:00',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    })
    // Unix epoch (Jan 1, 1970 00:00:00 UTC) should be Dec 31, 1969 19:00:00 at -05:00
    const result = dtf.format(new Date(0))
    expect(result).toContain('19:00')
    expect(result).toContain('1969')
  })

  it('should resolve canonical format in resolvedOptions', function () {
    // Test that offset timezones are canonicalized
    const tests = [
      {input: '+01', expected: '+01:00'},
      {input: '+0100', expected: '+01:00'},
      {input: '+01:00', expected: '+01:00'},
      {input: '-05', expected: '-05:00'},
      {input: '-0530', expected: '-05:30'},
    ]

    tests.forEach(({input, expected}) => {
      const dtf = new DateTimeFormat('en-GB', {timeZone: input})
      expect(dtf.resolvedOptions().timeZone).toBe(expected)
    })
  })

  it('should work with @date-fns/tz pattern from issue #4804', function () {
    // This is the exact use case from the GitHub issue
    expect(
      () =>
        new DateTimeFormat('en-GB', {
          timeZone: '+01:00',
          hour: 'numeric',
          timeZoneName: 'longOffset',
        })
    ).not.toThrow()

    const dtf = new DateTimeFormat('en-GB', {
      timeZone: '+01:00',
      hour: 'numeric',
      timeZoneName: 'longOffset',
    })
    const result = dtf.format(new Date('2024-01-01T00:00:00Z'))
    expect(result).toBeTruthy()
  })

  it('should handle half-hour offsets like +05:30', function () {
    const dtf = new DateTimeFormat('en-GB', {
      timeZone: '+05:30',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    })
    // Unix epoch should be 05:30:00 at +05:30
    const result = dtf.format(new Date(0))
    expect(result).toContain('05:30')
  })

  it('should handle quarter-hour offsets like +05:45', function () {
    const dtf = new DateTimeFormat('en-GB', {
      timeZone: '+05:45',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    })
    // Unix epoch should be 05:45:00 at +05:45
    const result = dtf.format(new Date(0))
    expect(result).toContain('05:45')
  })

  it('should handle negative half-hour offset like -03:30', function () {
    const dtf = new DateTimeFormat('en-GB', {
      timeZone: '-03:30',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    })
    // Unix epoch (Jan 1, 1970 00:00:00 UTC) should be Dec 31, 1969 20:30:00 at -03:30
    const result = dtf.format(new Date(0))
    expect(result).toContain('20:30')
  })
})

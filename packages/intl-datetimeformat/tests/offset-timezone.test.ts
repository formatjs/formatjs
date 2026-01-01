import '@formatjs/intl-getcanonicallocales/polyfill.js'
import '@formatjs/intl-locale/polyfill.js'
import {DateTimeFormat} from '../src/core'
import allData from '../src/data/all-tz'
import * as enGB from './locale-data/en-GB.json' with {type: 'json'}
import * as en from './locale-data/en.json' with {type: 'json'}
import {describe, expect, it, afterEach} from 'vitest'

// @ts-ignore
DateTimeFormat.__addLocaleData(en, enGB)
DateTimeFormat.__addTZData(allData)

const DEFAULT_TIMEZONE = DateTimeFormat.getDefaultTimeZone()

describe('Intl.DateTimeFormat with UTC offset timezones', function () {
  afterEach(() => {
    DateTimeFormat.__setDefaultTimeZone(DEFAULT_TIMEZONE)
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
    const formats = ['+01', '+0100', '+01:00', '+01:30', '+05:30:45']
    formats.forEach(timeZone => {
      expect(() => new DateTimeFormat('en-GB', {timeZone})).not.toThrow()
    })
  })

  it('should reject invalid offset timezones', function () {
    const invalidFormats = [
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

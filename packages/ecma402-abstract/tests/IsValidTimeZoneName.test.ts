import {IsValidTimeZoneName} from '../IsValidTimeZoneName.js'
import {expect, test, describe} from 'vitest'

describe('IsValidTimeZoneName', () => {
  test('IANA timezone names', () => {
    expect(
      IsValidTimeZoneName('America/Los_Angeles', {
        zoneNamesFromData: ['America/Los_Angeles'],
        uppercaseLinks: {},
      })
    ).toBe(true)

    expect(
      IsValidTimeZoneName('America/Indiana/Indianapolis', {
        zoneNamesFromData: [
          'America/Indianapolis',
          'America/Fort_Wayne',
          'US/East-Indiana',
        ],
        uppercaseLinks: {
          'America/Fort_Wayne': 'America/Indiana/Indianapolis',
          'America/Indianapolis': 'America/Indiana/Indianapolis',
          'US/East-Indiana': 'America/Indiana/Indianapolis',
        },
      })
    ).toBe(true)

    expect(
      IsValidTimeZoneName('America/Indiana/Indianapolis', {
        zoneNamesFromData: ['America/New_York'],
        uppercaseLinks: {
          'America/Fort_Wayne': 'America/Indiana/Indianapolis',
          'America/Indianapolis': 'America/Indiana/Indianapolis',
          'US/East-Indiana': 'America/Indiana/Indianapolis',
        },
      })
    ).toBe(true)
  })

  test('UTC offset timezones - valid formats', () => {
    const testData = {
      zoneNamesFromData: ['America/New_York'],
      uppercaseLinks: {},
    }

    // ±HH:MM format
    expect(IsValidTimeZoneName('+00:00', testData)).toBe(true)
    expect(IsValidTimeZoneName('+01:00', testData)).toBe(true)
    expect(IsValidTimeZoneName('-05:00', testData)).toBe(true)
    expect(IsValidTimeZoneName('+05:30', testData)).toBe(true)
    expect(IsValidTimeZoneName('-12:00', testData)).toBe(true)
    expect(IsValidTimeZoneName('+23:59', testData)).toBe(true)

    // ±HHMM format (without colon)
    expect(IsValidTimeZoneName('+0100', testData)).toBe(true)
    expect(IsValidTimeZoneName('-0500', testData)).toBe(true)
    expect(IsValidTimeZoneName('+0530', testData)).toBe(true)

    // ±HH format (hours only)
    expect(IsValidTimeZoneName('+01', testData)).toBe(true)
    expect(IsValidTimeZoneName('-05', testData)).toBe(true)
    expect(IsValidTimeZoneName('+00', testData)).toBe(true)

    // With seconds ±HH:MM:SS
    expect(IsValidTimeZoneName('+01:30:45', testData)).toBe(true)
    expect(IsValidTimeZoneName('-05:00:00', testData)).toBe(true)

    // With fractional seconds ±HH:MM:SS.sss
    expect(IsValidTimeZoneName('+01:30:45.123', testData)).toBe(true)
    expect(IsValidTimeZoneName('-05:00:00.999999999', testData)).toBe(true)
  })

  test('UTC offset timezones - invalid formats', () => {
    const testData = {
      zoneNamesFromData: ['America/New_York'],
      uppercaseLinks: {},
    }

    // Out of range hours
    expect(IsValidTimeZoneName('+24:00', testData)).toBe(false)
    expect(IsValidTimeZoneName('+25:00', testData)).toBe(false)
    expect(IsValidTimeZoneName('-24:00', testData)).toBe(false)

    // Out of range minutes
    expect(IsValidTimeZoneName('+01:60', testData)).toBe(false)
    expect(IsValidTimeZoneName('+01:99', testData)).toBe(false)

    // Out of range seconds
    expect(IsValidTimeZoneName('+01:30:60', testData)).toBe(false)

    // Wrong format - single digit components
    expect(IsValidTimeZoneName('+1:00', testData)).toBe(false)
    expect(IsValidTimeZoneName('+01:0', testData)).toBe(false)
    expect(IsValidTimeZoneName('+1:0', testData)).toBe(false)

    // Missing sign
    expect(IsValidTimeZoneName('01:00', testData)).toBe(false)
    expect(IsValidTimeZoneName('0100', testData)).toBe(false)

    // Invalid characters
    expect(IsValidTimeZoneName('+01:00:00:00', testData)).toBe(false)
    expect(IsValidTimeZoneName('+01:00abc', testData)).toBe(false)
  })
})

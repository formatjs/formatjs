import {CanonicalizeTimeZoneName} from '../CanonicalizeTimeZoneName.js'
import {expect, test, describe} from 'vitest'

describe('CanonicalizeTimeZoneName', () => {
  test('IANA timezone names', () => {
    expect(
      CanonicalizeTimeZoneName('America/Los_Angeles', {
        zoneNames: ['America/Los_Angeles'],
        uppercaseLinks: {},
      })
    ).toBe('America/Los_Angeles')

    expect(
      CanonicalizeTimeZoneName('America/Indiana/Indianapolis', {
        zoneNames: ['America/Indiana/Indianapolis'],
        uppercaseLinks: {
          'America/Fort_Wayne': 'America/Indiana/Indianapolis',
          'America/Indianapolis': 'America/Indiana/Indianapolis',
        },
      })
    ).toBe('America/Indiana/Indianapolis')

    // Test UTC/GMT special cases
    expect(
      CanonicalizeTimeZoneName('Etc/UTC', {
        zoneNames: ['Etc/UTC'],
        uppercaseLinks: {},
      })
    ).toBe('UTC')

    expect(
      CanonicalizeTimeZoneName('Etc/GMT', {
        zoneNames: ['Etc/GMT'],
        uppercaseLinks: {},
      })
    ).toBe('UTC')
  })

  test('UTC offset timezones - canonicalization', () => {
    const testData = {
      zoneNames: ['America/New_York'],
      uppercaseLinks: {},
    }

    // ±HH:MM format (already canonical)
    expect(CanonicalizeTimeZoneName('+01:00', testData)).toBe('+01:00')
    expect(CanonicalizeTimeZoneName('-05:00', testData)).toBe('-05:00')
    expect(CanonicalizeTimeZoneName('+05:30', testData)).toBe('+05:30')
    expect(CanonicalizeTimeZoneName('+00:00', testData)).toBe('+00:00')

    // ±HHMM format → ±HH:MM
    expect(CanonicalizeTimeZoneName('+0100', testData)).toBe('+01:00')
    expect(CanonicalizeTimeZoneName('-0500', testData)).toBe('-05:00')
    expect(CanonicalizeTimeZoneName('+0530', testData)).toBe('+05:30')
    expect(CanonicalizeTimeZoneName('+0000', testData)).toBe('+00:00')

    // ±HH format → ±HH:00
    expect(CanonicalizeTimeZoneName('+01', testData)).toBe('+01:00')
    expect(CanonicalizeTimeZoneName('-05', testData)).toBe('-05:00')
    expect(CanonicalizeTimeZoneName('+00', testData)).toBe('+00:00')

    // With seconds (non-zero) - preserve seconds
    expect(CanonicalizeTimeZoneName('+01:30:45', testData)).toBe('+01:30:45')
    expect(CanonicalizeTimeZoneName('-05:00:30', testData)).toBe('-05:00:30')

    // With seconds (zero) - omit seconds
    expect(CanonicalizeTimeZoneName('+01:30:00', testData)).toBe('+01:30')
    expect(CanonicalizeTimeZoneName('-05:00:00', testData)).toBe('-05:00')

    // With fractional seconds - preserve non-zero fractional
    expect(CanonicalizeTimeZoneName('+01:30:45.123', testData)).toBe(
      '+01:30:45.123'
    )
    expect(CanonicalizeTimeZoneName('-05:00:30.5', testData)).toBe(
      '-05:00:30.5'
    )

    // With trailing zeros in fractional - remove trailing zeros
    expect(CanonicalizeTimeZoneName('+01:30:45.1000', testData)).toBe(
      '+01:30:45.1'
    )
    expect(CanonicalizeTimeZoneName('+01:30:45.000', testData)).toBe(
      '+01:30:45'
    )
  })

  test('Edge cases', () => {
    const testData = {
      zoneNames: ['America/New_York'],
      uppercaseLinks: {},
    }

    // Maximum valid offsets
    expect(CanonicalizeTimeZoneName('+23:59', testData)).toBe('+23:59')
    expect(CanonicalizeTimeZoneName('-23:59', testData)).toBe('-23:59')

    // Minimum offset
    expect(CanonicalizeTimeZoneName('+00:00', testData)).toBe('+00:00')
    expect(CanonicalizeTimeZoneName('-00:00', testData)).toBe('-00:00')
  })
})

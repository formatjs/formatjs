import {expect, it, vi} from 'vitest'
import {createHostTimeZone} from '#packages/temporal/host-timezone.js'
import {
  isoToEpochNanoseconds,
  epochNanosecondsToISO,
} from '#packages/temporal/kernel.js'

it('preserves nanoseconds across gaps, folds and negative-epoch transitions', () => {
  const zone = createHostTimeZone('America/New_York')
  const transition = isoToEpochNanoseconds({
    year: 1967,
    month: 4,
    day: 30,
    hour: 7,
  })
  expect(zone.offsetNanoseconds(transition - 1n)).toBe(-18000000000000n)
  expect(zone.offsetNanoseconds(transition)).toBe(-14400000000000n)
  const fold = {
    year: 2020,
    month: 11,
    day: 1,
    hour: 1,
    minute: 30,
    nanosecond: 123,
  }
  const early = isoToEpochNanoseconds({...fold, hour: 5}),
    late = isoToEpochNanoseconds({...fold, hour: 6})
  expect(zone.possibleInstants(fold)).toEqual([early, late])
  expect(zone.resolve(fold)).toBe(early)
  expect(zone.resolve(fold, 'later')).toBe(late)
  expect(() => zone.resolve(fold, 'reject')).toThrow(RangeError)
  const gap = {
    year: 2020,
    month: 3,
    day: 8,
    hour: 2,
    minute: 30,
    nanosecond: 123,
  }
  expect(zone.possibleInstants(gap)).toEqual([])
  expect(zone.resolve(gap, 'earlier')).toBe(
    isoToEpochNanoseconds({...gap, hour: 6})
  )
  expect(zone.resolve(gap)).toBe(isoToEpochNanoseconds({...gap, hour: 7}))
  expect(() => zone.resolve(gap, 'reject')).toThrow(RangeError)
})

it('handles non-hour changes, skipped dates, aliases and full instant bounds', () => {
  const lordHowe = createHostTimeZone('Australia/Lord_Howe'),
    fold = {year: 2020, month: 4, day: 5, hour: 1, minute: 45}
  const candidates = lordHowe.possibleInstants(fold)
  expect(candidates).toHaveLength(2)
  expect(candidates[1] - candidates[0]).toBe(1800000000000n)
  const apia = createHostTimeZone('Pacific/Apia'),
    gap = {year: 2011, month: 12, day: 30, hour: 12}
  expect(apia.possibleInstants(gap)).toEqual([])
  expect(apia.resolve(gap, 'later') - apia.resolve(gap, 'earlier')).toBe(
    86400000000000n
  )
  expect(createHostTimeZone('US/Eastern').offsetNanoseconds(0n)).toBe(
    createHostTimeZone('America/New_York').offsetNanoseconds(0n)
  )
  const utc = createHostTimeZone('UTC')
  for (const value of [-8640000000000000000000n, 8640000000000000000000n]) {
    expect(utc.offsetNanoseconds(value)).toBe(0n)
    expect(utc.resolve(epochNanosecondsToISO(value))).toBe(value)
  }
  expect(() => utc.offsetNanoseconds(8640000000000000000001n)).toThrow(
    RangeError
  )
  const kiritimati = createHostTimeZone('Pacific/Kiritimati'),
    maximum = 8640000000000000000000n
  expect(
    kiritimati.resolve(epochNanosecondsToISO(maximum + 50400000000000n))
  ).toBe(maximum)
  expect(
    createHostTimeZone('Asia/Kathmandu').offsetNanoseconds(
      isoToEpochNanoseconds({year: 1900, month: 1, day: 1})
    )
  ).toBe(20476000000000n)
})

it('retains captured host methods after prototype mutation', () => {
  const original = Intl.DateTimeFormat.prototype.formatToParts
  try {
    Intl.DateTimeFormat.prototype.formatToParts = () => {
      throw new Error('poisoned Intl')
    }
    expect(createHostTimeZone('Asia/Kathmandu').offsetNanoseconds(0n)).toBe(
      19800000000000n
    )
  } finally {
    Intl.DateTimeFormat.prototype.formatToParts = original
  }
})

it('extracts offsets when the host falls back to an Arabic locale', async () => {
  const Original = Intl.DateTimeFormat
  vi.resetModules()
  try {
    Intl.DateTimeFormat = class extends Original {
      constructor(_locales: unknown, options?: Intl.DateTimeFormatOptions) {
        super('ar-EG', options)
      }
    } as typeof Original
    const {createHostTimeZone: create} =
      await import('#packages/temporal/host-timezone.js')
    expect(create('Asia/Kathmandu').offsetNanoseconds(0n)).toBe(19800000000000n)
    expect(create('America/New_York').offsetNanoseconds(0n)).toBe(
      -18000000000000n
    )
  } finally {
    Intl.DateTimeFormat = Original
    vi.resetModules()
  }
})

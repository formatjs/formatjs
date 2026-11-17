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

it('finds transitions strictly before or after nanosecond boundaries', () => {
  const zone = createHostTimeZone('America/New_York')
  const spring = isoToEpochNanoseconds({year: 2020, month: 3, day: 8, hour: 7})
  const fall = isoToEpochNanoseconds({year: 2020, month: 11, day: 1, hour: 6})
  expect(zone.transition(spring - 1n, 'next')).toBe(spring)
  expect(zone.transition(spring, 'next')).toBe(fall)
  expect(zone.transition(fall + 1n, 'previous')).toBe(fall)
  expect(zone.transition(fall, 'previous')).toBe(spring)
  const far = isoToEpochNanoseconds({year: 2400, month: 3, day: 12, hour: 7})
  expect(zone.transition(far + 1n, 'previous')).toBe(far)
  expect(zone.transition(-8640000000000000000000n, 'previous')).toBe(null)
  expect(zone.transition(8640000000000000000000n, 'next')).toBe(null)
})

it('finds host-only transitions inside a generated fixed-zone probe interval', async () => {
  const Original = Intl.DateTimeFormat
  const first = Date.UTC(2024, 0, 8),
    last = Date.UTC(2024, 0, 22)
  vi.resetModules()
  try {
    Intl.DateTimeFormat = class extends Original {
      constructor(
        locales?: Intl.LocalesArgument,
        options?: Intl.DateTimeFormatOptions
      ) {
        super(locales, {...options, timeZone: 'UTC'})
      }
      formatToParts(value?: number | Date) {
        const milliseconds = Number(value)
        return super.formatToParts(
          milliseconds +
            (milliseconds >= first && milliseconds < last ? 3600000 : 0)
        )
      }
    } as typeof Original
    const {createHostTimeZone: create} =
      await import('#packages/temporal/host-timezone.js')
    // Abidjan has no generated modern transitions. Host adds a two-week season.
    const zone = create('Africa/Abidjan')
    const before = BigInt(Date.UTC(2024, 0, 1)) * 1000000n
    const after = BigInt(Date.UTC(2024, 1, 1)) * 1000000n
    expect(zone.transition(before, 'next')).toBe(BigInt(first) * 1000000n)
    expect(zone.transition(after, 'previous')).toBe(BigInt(last) * 1000000n)
    expect(zone.transition(BigInt(first) * 1000000n, 'next')).toBe(
      BigInt(last) * 1000000n
    )
    expect(zone.transition(BigInt(last) * 1000000n, 'previous')).toBe(
      BigInt(first) * 1000000n
    )
  } finally {
    Intl.DateTimeFormat = Original
    vi.resetModules()
  }
})

it('reuses observed fixed-offset history across overlapping transition searches', async () => {
  const Original = Intl.DateTimeFormat
  let probes = 0
  vi.resetModules()
  try {
    Intl.DateTimeFormat = class extends Original {
      constructor(
        locales?: Intl.LocalesArgument,
        options?: Intl.DateTimeFormatOptions
      ) {
        super(locales, {...options, timeZone: 'UTC'})
      }
      formatToParts(value?: number | Date) {
        probes++
        return super.formatToParts(value)
      }
    } as typeof Original
    const {createHostTimeZone: create} =
      await import('#packages/temporal/host-timezone.js')
    const zone = create('Africa/Abidjan')
    expect(
      zone.transition(
        isoToEpochNanoseconds({year: 2000, month: 1, day: 1}),
        'previous'
      )
    ).toBe(null)
    const initial = probes
    for (let month = 2; month <= 12; month++) {
      expect(
        zone.transition(
          isoToEpochNanoseconds({year: 2000, month, day: 1}),
          'previous'
        )
      ).toBe(null)
    }
    expect(probes - initial).toBeLessThan(128)
  } finally {
    Intl.DateTimeFormat = Original
    vi.resetModules()
  }
})

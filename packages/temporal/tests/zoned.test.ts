import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it, vi} from 'vitest'
import packed from '@formatjs_generated/tz/all-tz.js'
import {Temporal} from '#packages/temporal/index.js'
import {nativeTemporal} from '#packages/temporal/native.js'
import {epochNanosecondsToISO} from '#packages/temporal/kernel.js'

it('matches independent ICU offsets and local fields through future transitions', () => {
  const file = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-timezone-fixtures.tsv`
  )
  const names = new Set(
    packed.zones.map(zone => zone.slice(0, zone.indexOf('|')))
  )
  let count = 0,
    transitions = 0
  let previous: {name: string; instant: bigint; offset: bigint} | undefined
  for (const line of readFileSync(file, 'utf8').trim().split('\n')) {
    if (line.startsWith('#')) continue
    const [name, milliseconds, seconds] = line.split('\t')
    if (!names.has(name)) continue
    const instant = BigInt(milliseconds) * 1_000_000n,
      offset = BigInt(seconds) * 1_000_000_000n
    const zoned = new Temporal.ZonedDateTime(instant, name)
    expect(zoned.offsetNanoseconds, line).toBe(Number(offset))
    const expected = epochNanosecondsToISO(instant + offset)
    expect(zoned.toPlainDateTime().toString()).toBe(
      Temporal.PlainDateTime.from(expected).toString()
    )
    if (
      previous?.name === name &&
      instant === previous.instant + 1_000_000n &&
      offset !== previous.offset
    ) {
      const fields = epochNanosecondsToISO(
        instant + (offset + previous.offset) / 2n + 123n
      )
      const candidates = [
        instant + (offset + previous.offset) / 2n + 123n - offset,
        instant + (offset + previous.offset) / 2n + 123n - previous.offset,
      ].sort((a, b) => (a < b ? -1 : 1))
      const bag = {...fields, timeZone: name}
      expect(
        Temporal.ZonedDateTime.from(bag, {disambiguation: 'earlier'})
          .epochNanoseconds
      ).toBe(candidates[0])
      expect(
        Temporal.ZonedDateTime.from(bag, {disambiguation: 'later'})
          .epochNanoseconds
      ).toBe(candidates[1])
      expect(Temporal.ZonedDateTime.from(bag).epochNanoseconds).toBe(
        candidates[offset > previous.offset ? 1 : 0]
      )
      expect(() =>
        Temporal.ZonedDateTime.from(bag, {disambiguation: 'reject'})
      ).toThrow(RangeError)
      const before = new Temporal.ZonedDateTime(
        instant - 43_200_000_000_000n,
        name
      )
      expect(before.add({days: 1}).epochNanoseconds).toBe(
        before.epochNanoseconds + 86_400_000_000_000n + previous.offset - offset
      )
      expect(before.add({hours: 24}).epochNanoseconds).toBe(
        before.epochNanoseconds + 86_400_000_000_000n
      )
      expect(
        Temporal.Duration.compare({days: 1}, {hours: 24}, {relativeTo: before})
      ).toBe(previous.offset > offset ? 1 : -1)
      transitions++
    }
    previous = {name, instant, offset}
    count++
  }
  expect(count).toBe(13160)
  expect(transitions).toBe(1340)
})

it('preserves variable-length days, offsets, references and private conversions', () => {
  const value = Temporal.ZonedDateTime.from(
    '2020-03-07T12:00-05:00[america/new_york]'
  )
  expect(value.timeZoneId).toBe('America/New_York')
  expect(value.add({days: 1}).toString()).toBe(
    '2020-03-08T12:00:00-04:00[America/New_York]'
  )
  expect(value.add({hours: 24}).toString()).toBe(
    '2020-03-08T13:00:00-04:00[America/New_York]'
  )
  expect(value.add({days: 1}).hoursInDay).toBe(23)
  expect(
    Temporal.ZonedDateTime.from('2020-11-01T12:00-05:00[America/New_York]')
      .hoursInDay
  ).toBe(25)
  expect(() =>
    Temporal.ZonedDateTime.from('2020-03-08T12:00-05:00[America/New_York]')
  ).toThrow(RangeError)
  const shifted = Temporal.ZonedDateTime.from(
    '2020-03-08T12:00-05:00[America/New_York]',
    {offset: 'use'}
  )
  expect(shifted.hour).toBe(13)
  expect(Temporal.Instant.from(value).epochNanoseconds).toBe(
    value.epochNanoseconds
  )
  expect(Temporal.PlainDate.from(value).toString()).toBe('2020-03-07')
  expect(Temporal.PlainTime.from(value).toString()).toBe('12:00:00')
  expect(Temporal.PlainDateTime.from(value).toString()).toBe(
    '2020-03-07T12:00:00'
  )
  const alias = new Temporal.ZonedDateTime(value.epochNanoseconds, 'US/Eastern')
  expect(alias.timeZoneId).toBe('US/Eastern')
  expect(alias.equals(value)).toBe(true)
  expect(
    Temporal.Instant.from('1970-01-01T00:00Z')
      .toZonedDateTimeISO('-0130')
      .toJSON()
  ).toBe('1969-12-31T22:30:00-01:30[-01:30]')
  const skipped = Temporal.ZonedDateTime.from('2011-12-30[Pacific/Apia]')
  expect(skipped.toPlainDate().toString()).toBe('2011-12-31')
  const historical = Temporal.ZonedDateTime.from(
    '1900-01-01T00:00+00:09[Europe/Paris]'
  )
  expect(historical.offset).toBe('+00:09:21')
  expect(historical.toString()).toBe('1900-01-01T00:00:00+00:09[Europe/Paris]')
})

it.each(['iso8601', 'hebrew'])(
  'preserves frozen zoned values after reading offsets with %s calendar',
  calendar => {
    const value = Object.freeze(
      Temporal.ZonedDateTime.from(
        '2020-03-07T12:00-05:00[America/New_York]'
      ).withCalendar(calendar)
    )
    expect(value.offsetNanoseconds).toBe(-18_000_000_000_000)
    const copy = Temporal.ZonedDateTime.from(value)
    expect(copy).not.toBe(value)
    expect(copy.calendarId).toBe(calendar)
    expect(copy.equals(value)).toBe(true)

    const next = value.add({days: 1})
    expect(next.offsetNanoseconds).toBe(-14_400_000_000_000)
    expect(next.calendarId).toBe(calendar)
    expect(next.toInstant().toString()).toBe('2020-03-08T16:00:00Z')

    const shifted = value.withTimeZone('Asia/Kathmandu')
    expect(shifted.offsetNanoseconds).toBe(20_700_000_000_000)
    expect(shifted.calendarId).toBe(calendar)
    expect(shifted.epochNanoseconds).toBe(value.epochNanoseconds)
    const alternate = calendar === 'iso8601' ? 'hebrew' : 'iso8601'
    const recalendar = value.withCalendar(alternate)
    expect(recalendar.calendarId).toBe(alternate)
    expect(recalendar.offsetNanoseconds).toBe(-18_000_000_000_000)
    expect(value.calendarId).toBe(calendar)
    expect(value.offsetNanoseconds).toBe(-18_000_000_000_000)

    const options = {
      calendar,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
    } as const
    // Native format and formatToParts can use different narrow-space literals.
    const spacing = (text: string) => text.replace(/\u202f/g, ' ')
    expect(spacing(value.toLocaleString('en-US', options))).toBe(
      spacing(
        new Intl.DateTimeFormat('en-US', {
          ...options,
          timeZone: value.timeZoneId,
        }).format(new Date(value.epochMilliseconds))
      )
    )
  }
)

it('uses first valid instant for date-only gaps regardless of disambiguation', () => {
  const value = Temporal.ZonedDateTime.from('1986-01-01[Asia/Kathmandu]', {
    disambiguation: 'reject',
  })
  expect(value.toString()).toBe('1986-01-01T00:15:00+05:45[Asia/Kathmandu]')
  expect(value.startOfDay().epochNanoseconds).toBe(value.epochNanoseconds)
  const skipped = Temporal.ZonedDateTime.from('2011-12-30[Pacific/Apia]', {
    disambiguation: 'reject',
  })
  expect(skipped.toString()).toBe('2011-12-31T00:00:00+14:00[Pacific/Apia]')
})

it('matches historical offset strings according to syntactic precision', () => {
  const minute = Temporal.ZonedDateTime.from(
    '1900-01-01T00:00+00:09[Europe/Paris]'
  )
  for (const offset of ['+0009', '+00:09:21', '+000921.000000000']) {
    expect(
      Temporal.ZonedDateTime.from(`1900-01-01T00:00${offset}[Europe/Paris]`)
        .epochNanoseconds
    ).toBe(minute.epochNanoseconds)
  }
  for (const offset of ['+00:09:00', '+000900', '+00:09:00.000']) {
    const text = `1900-01-01T00:00${offset}[Europe/Paris]`
    expect(() => Temporal.ZonedDateTime.from(text)).toThrow(RangeError)
    expect(
      Temporal.ZonedDateTime.from(text, {offset: 'prefer'}).epochNanoseconds
    ).toBe(minute.epochNanoseconds)
    expect(
      Temporal.ZonedDateTime.from(text, {offset: 'ignore'}).epochNanoseconds
    ).toBe(minute.epochNanoseconds)
    expect(
      Temporal.ZonedDateTime.from(text, {offset: 'use'}).epochNanoseconds -
        minute.epochNanoseconds
    ).toBe(21_000_000_000n)
  }
  expect(() =>
    Temporal.ZonedDateTime.from({
      year: 1900,
      month: 1,
      day: 1,
      timeZone: 'Europe/Paris',
      offset: '+00:09',
    })
  ).toThrow(RangeError)
})

it('balances wall clocks before calendar months across spring gaps', () => {
  const start = new Temporal.ZonedDateTime(
    957258000000000000n,
    'America/Vancouver'
  )
  const end = new Temporal.ZonedDateTime(
    954669600000000000n,
    'America/Vancouver'
  )
  for (const largestUnit of ['year', 'month', 'day']) {
    expect(start.until(end, {largestUnit}).toString()).toBe('-P29DT23H')
    expect(start.since(end, {largestUnit}).toString()).toBe('P29DT23H')
  }
  expect(start.until(end, {largestUnit: 'hour'}).toString()).toBe('-PT719H')
})

it('rounds repeated civil dates to earliest midnight boundaries', () => {
  for (const [text, floor, ceil, half] of [
    ['2010-03-04T23:10+11:00', '2010-03-04', '2010-03-05', '2010-03-05'],
    ['2010-03-05T00:45+11:00', '2010-03-05', '2010-03-06', '2010-03-05'],
    ['2010-03-04T23:10+08:00', '2010-03-04', '2010-03-05', '2010-03-05'],
    ['2010-03-05T00:45+08:00', '2010-03-05', '2010-03-06', '2010-03-05'],
  ]) {
    const value = Temporal.ZonedDateTime.from(`${text}[Antarctica/Casey]`)
    for (const roundingMode of [
      'floor',
      'trunc',
      'ceil',
      'expand',
      'halfCeil',
      'halfFloor',
      'halfExpand',
      'halfTrunc',
      'halfEven',
    ]) {
      const date =
        roundingMode === 'floor' || roundingMode === 'trunc'
          ? floor
          : roundingMode === 'ceil' || roundingMode === 'expand'
            ? ceil
            : half
      expect(
        value.round({smallestUnit: 'day', roundingMode}).epochNanoseconds,
        `${text} ${roundingMode}`
      ).toBe(
        Temporal.ZonedDateTime.from(`${date}[Antarctica/Casey]`)
          .epochNanoseconds
      )
    }
  }
})

it('preserves the pinned lower-date guard for offset prefer and reject', () => {
  const text = '-271821-04-19T23:00-01:00[-01:00]'
  for (const offset of ['use', 'ignore'] as const)
    expect(Temporal.ZonedDateTime.from(text, {offset}).epochNanoseconds).toBe(
      -8_640_000_000_000_000_000_000n
    )
  for (const offset of ['prefer', 'reject'] as const)
    expect(() => Temporal.ZonedDateTime.from(text, {offset})).toThrow(
      RangeError
    )
})

it.each([
  '+999999-01-01T00:00[UTC]',
  '+999999-01-01[UTC]',
  '-271821-04-19T00:00[UTC]',
  '+275760-09-14T00:00[UTC]',
])('reads zoned string options before rejecting range: %s', text => {
  const reads: string[] = []
  const options = {
    get disambiguation() {
      reads.push('disambiguation')
      return 'compatible'
    },
    get offset() {
      reads.push('offset')
      return 'reject'
    },
    get overflow() {
      reads.push('overflow')
      return 'constrain'
    },
  }
  expect(() => Temporal.ZonedDateTime.from(text, options)).toThrow(RangeError)
  expect(reads).toEqual(['disambiguation', 'offset', 'overflow'])
})

it.each(['disambiguation', 'offset', 'overflow'])(
  'preserves abrupt %s completion before zoned string range failure',
  name => {
    const failure = {}
    const options = Object.defineProperty({}, name, {
      get() {
        throw failure
      },
    })
    let caught: unknown
    try {
      Temporal.ZonedDateTime.from('+999999-01-01T00:00[UTC]', options)
    } catch (error) {
      caught = error
    }
    expect(caught).toBe(failure)
  }
)

it.each([
  '+999999-02-30T00:00[UTC]',
  '+999999-01-01T00:00[NoSuch/Zone]',
  '+999999-01-01T00:00[UTC][u-ca=unknown]',
])(
  'rejects invalid syntax or identifiers before zoned string options: %s',
  text => {
    let read = false
    expect(() =>
      Temporal.ZonedDateTime.from(text, {
        get disambiguation() {
          read = true
          return 'compatible'
        },
      })
    ).toThrow(RangeError)
    expect(read).toBe(false)
  }
)

it('preserves minimum-Instant parsing despite the MakeDay witness ambiguity', () => {
  // ECMA-262 §21.4.1.28 step 8: https://tc39.es/ecma262/#sec-makeday
  // https://github.com/tc39/ecma262/issues/1087
  expect(
    Temporal.ZonedDateTime.from('-271821-04-20T00:00Z[UTC]').epochNanoseconds
  ).toBe(-8_640_000_000_000_000_000_000n)
})

it('preserves exact zoned instants when rounding to one nanosecond at the bounds', () => {
  for (const [epoch, zone] of [
    [-8_640_000_000_000_000_000_000n, '-01:00'],
    [8_640_000_000_000_000_000_000n, '+01:00'],
  ] as const) {
    const value = new Temporal.ZonedDateTime(epoch, zone)
    for (const roundTo of [
      'nanosecond',
      {smallestUnit: 'nanosecond', roundingIncrement: 1},
    ]) {
      const rounded = value.round(roundTo)
      expect(rounded).not.toBe(value)
      expect(rounded.epochNanoseconds).toBe(epoch)
      expect(rounded.timeZoneId).toBe(zone)
      expect(rounded.calendarId).toBe(value.calendarId)
    }
  }
})

it('validates rounding options before returning an unchanged zoned instant', () => {
  const value = new Temporal.ZonedDateTime(
    -8_640_000_000_000_000_000_000n,
    '-01:00'
  )
  const reads: string[] = []
  const rounded = value.round({
    get roundingIncrement() {
      reads.push('roundingIncrement')
      return 1
    },
    get roundingMode() {
      reads.push('roundingMode')
      return 'halfExpand'
    },
    get smallestUnit() {
      reads.push('smallestUnit')
      return 'nanosecond'
    },
  })
  expect(rounded.epochNanoseconds).toBe(value.epochNanoseconds)
  expect(reads).toEqual(['roundingIncrement', 'roundingMode', 'smallestUnit'])
  expect(() =>
    value.round({smallestUnit: 'nanosecond', roundingIncrement: 0})
  ).toThrow(RangeError)
  expect(() =>
    value.round({smallestUnit: 'nanosecond', roundingMode: 'invalid'})
  ).toThrow(RangeError)
  expect(() => value.round('minute')).toThrow(RangeError)
  expect(
    new Temporal.ZonedDateTime(1n, 'UTC').round({
      smallestUnit: 'nanosecond',
      roundingIncrement: 2,
    }).epochNanoseconds
  ).toBe(2n)
})

it.each([
  ['year', 1],
  ['nanosecond', 3],
  ['hour', 24],
  ['day', 2],
] as const)(
  'rejects %s increment %s before local conversion',
  (unit, increment) => {
    const value = new Temporal.ZonedDateTime(0n, 'UTC')
    const descriptor = Object.getOwnPropertyDescriptor(Map.prototype, 'get')!
    const reads: string[] = []
    let queries = 0
    let thrown: unknown
    Map.prototype.get = function () {
      queries++
      throw new Error('Unexpected local-time cache read')
    }
    try {
      value.round({
        get roundingIncrement() {
          reads.push('roundingIncrement')
          return increment
        },
        get roundingMode() {
          reads.push('roundingMode')
          return 'halfExpand'
        },
        get smallestUnit() {
          reads.push('smallestUnit')
          return unit
        },
      })
    } catch (error) {
      thrown = error
    } finally {
      Object.defineProperty(Map.prototype, 'get', descriptor)
    }
    expect(thrown).toBeInstanceOf(RangeError)
    expect(queries).toBe(0)
    expect(reads).toEqual(['roundingIncrement', 'roundingMode', 'smallestUnit'])
  }
)

it.each([
  ['get', 'UTC', 0],
  ['set', '+13:47', 49_620_000_000_000],
] as const)(
  'reads a valid fixed-zone offset without public Map.prototype.%s',
  async (method, zone, expected) => {
    vi.resetModules()
    try {
      const {Temporal: isolated} = await import('#packages/temporal/index.js')
      // Fresh module keeps the fixed kernel cold; all objects use its own slots.
      const value = new isolated.ZonedDateTime(0n, zone)
      const descriptor = Object.getOwnPropertyDescriptor(Map.prototype, method)!
      const sentinel = new Error('Observable zone cache method')
      let actual: number | undefined, error: unknown
      try {
        Object.defineProperty(Map.prototype, method, {
          ...descriptor,
          value() {
            throw sentinel
          },
        })
        actual = value.offsetNanoseconds
      } catch (caught) {
        error = caught
      } finally {
        Object.defineProperty(Map.prototype, method, descriptor)
      }
      expect(error).toBeUndefined()
      expect(actual).toBe(expected)
    } finally {
      vi.resetModules()
    }
  }
)

it('initializes private timezone spellings without a replacement Map constructor', async () => {
  vi.resetModules()
  try {
    const {Temporal: isolated} = await import('#packages/temporal/index.js')
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'Map')!
    const sentinel = new Error('Observable timezone Map constructor')
    let actual: string | undefined, error: unknown
    try {
      Object.defineProperty(globalThis, 'Map', {
        ...descriptor,
        value: function () {
          throw sentinel
        },
      })
      actual = new isolated.ZonedDateTime(0n, 'UTC').timeZoneId
    } catch (caught) {
      error = caught
    } finally {
      Object.defineProperty(globalThis, 'Map', descriptor)
    }
    expect(error).toBeUndefined()
    expect(actual).toBe('UTC')
  } finally {
    vi.resetModules()
  }
})

it.each(['toLowerCase', 'Object.keys'] as const)(
  'prepares first-use timezone names without public %s',
  async hook => {
    vi.resetModules()
    try {
      const {Temporal: isolated} = await import('#packages/temporal/index.js')
      const owner = hook === 'Object.keys' ? Object : String.prototype
      const key = hook === 'Object.keys' ? 'keys' : hook
      const descriptor = Object.getOwnPropertyDescriptor(owner, key)!
      const sentinel = new Error('Observable private timezone preparation')
      let actual: string | undefined, error: unknown
      try {
        Object.defineProperty(owner, key, {
          ...descriptor,
          value() {
            throw sentinel
          },
        })
        actual = new isolated.Instant(0n).toString({timeZone: 'uTc'})
      } catch (caught) {
        error = caught
      } finally {
        Object.defineProperty(owner, key, descriptor)
      }
      expect(error).toBeUndefined()
      expect(actual).toBe('1970-01-01T00:00:00+00:00')
    } finally {
      vi.resetModules()
    }
  }
)

it('formats an Instant UTC zone without public String.prototype.toUpperCase', async () => {
  vi.resetModules()
  try {
    const {Temporal: isolated} = await import('#packages/temporal/index.js')
    const value = new isolated.Instant(0n)
    const descriptor = Object.getOwnPropertyDescriptor(
      String.prototype,
      'toUpperCase'
    )!
    const sentinel = new Error('Observable private timezone case conversion')
    let actual: string | undefined, error: unknown
    try {
      Object.defineProperty(String.prototype, 'toUpperCase', {
        ...descriptor,
        value() {
          throw sentinel
        },
      })
      actual = value.toString({timeZone: 'uTc'})
    } catch (caught) {
      error = caught
    } finally {
      Object.defineProperty(String.prototype, 'toUpperCase', descriptor)
    }
    expect(error).toBeUndefined()
    expect(actual).toBe('1970-01-01T00:00:00+00:00')
  } finally {
    vi.resetModules()
  }
})

it.each(['iterator', 'push', 'sort', 'index setter', 'future setter'] as const)(
  'unpacks cold named-zone data without public Array.prototype %s',
  async hook => {
    vi.resetModules()
    try {
      const {Temporal: isolated} = await import('#packages/temporal/index.js')
      const future = hook === 'future setter'
      const value = new isolated.ZonedDateTime(
        0n,
        future ? 'America/New_York' : 'Africa/Monrovia'
      )
      const key =
        hook === 'iterator'
          ? Symbol.iterator
          : hook === 'index setter'
            ? '1'
            : future
              ? 'future'
              : hook
      const descriptor = Object.getOwnPropertyDescriptor(Array.prototype, key)
      const sentinel = new Error('Observable private timezone rows')
      const poison = () => {
        throw sentinel
      }
      let actual: number | undefined, error: unknown
      try {
        Object.defineProperty(
          Array.prototype,
          key,
          hook === 'index setter' || future
            ? {configurable: true, set: poison}
            : {...descriptor, value: poison}
        )
        actual = value.offsetNanoseconds
      } catch (caught) {
        error = caught
      } finally {
        if (descriptor) Object.defineProperty(Array.prototype, key, descriptor)
        else Reflect.deleteProperty(Array.prototype, key)
      }
      expect(error).toBeUndefined()
      expect(actual).toBe(future ? -18_000_000_000_000 : -2_670_000_000_000)
    } finally {
      vi.resetModules()
    }
  }
)

it.each([
  ['String', 'UTC'],
  ['padStart', 'UTC'],
  ['replace', 'Africa/Monrovia'],
  ['RegExp.test', 'UTC'],
  ['RegExp.exec', 'UTC'],
] as const)(
  'rounds a zoned instant with its raw offset without public %s',
  (hook, zone) => {
    const value = new Temporal.ZonedDateTime(1n, zone)
    const owner =
      hook === 'String'
        ? globalThis
        : hook === 'RegExp.test' || hook === 'RegExp.exec'
          ? RegExp.prototype
          : String.prototype
    const key =
      hook === 'RegExp.test' ? 'test' : hook === 'RegExp.exec' ? 'exec' : hook
    const descriptor = Object.getOwnPropertyDescriptor(owner, key)!
    const sentinel = new Error('Observable zoned rounding offset conversion')
    const reads: string[] = []
    let actual: bigint | undefined, error: unknown
    try {
      Object.defineProperty(owner, key, {
        ...descriptor,
        value: function () {
          throw sentinel
        },
      })
      actual = value.round({
        get roundingIncrement() {
          reads.push('roundingIncrement')
          return 1
        },
        get roundingMode() {
          reads.push('roundingMode')
          return 'halfExpand'
        },
        get smallestUnit() {
          reads.push('smallestUnit')
          return 'second'
        },
      }).epochNanoseconds
    } catch (caught) {
      error = caught
    } finally {
      Object.defineProperty(owner, key, descriptor)
    }
    expect(error).toBeUndefined()
    expect(actual).toBe(0n)
    expect(reads).toEqual(['roundingIncrement', 'roundingMode', 'smallestUnit'])
  }
)

it.each([
  [String.prototype, 'slice'],
  [String.prototype, 'indexOf'],
  [RegExp.prototype, 'test'],
  [RegExp.prototype, 'exec'],
] as const)('converts zoned strings without mutable %s.%s', (owner, key) => {
  expect(nativeTemporal()).toBeUndefined()
  const descriptor = Object.getOwnPropertyDescriptor(owner, key)!
  const sentinel = new Error('Observable zoned string classification')
  const actual: bigint[] = []
  const failures: unknown[] = []
  const reads: string[] = []
  try {
    Object.defineProperty(owner, key, {
      ...descriptor,
      value: function () {
        throw sentinel
      },
    })
    for (const text of [
      '1970-01-01[UTC]',
      '1970-01-01T00:00+00:00[UTC]',
      '1970-01-01T00:00:00+00:00:00[UTC]',
      '1970-01-01T00Z[UTC]',
    ]) {
      try {
        actual.push(
          Temporal.ZonedDateTime.from(text, {
            get disambiguation() {
              reads.push('disambiguation')
              return 'compatible'
            },
            get offset() {
              reads.push('offset')
              return 'reject'
            },
            get overflow() {
              reads.push('overflow')
              return 'reject'
            },
          }).epochNanoseconds
        )
      } catch (error) {
        failures.push(error)
      }
    }
  } finally {
    Object.defineProperty(owner, key, descriptor)
  }
  expect(failures).toEqual([])
  expect(actual).toEqual([0n, 0n, 0n, 0n])
  expect(reads).toEqual([
    'disambiguation',
    'offset',
    'overflow',
    'disambiguation',
    'offset',
    'overflow',
    'disambiguation',
    'offset',
    'overflow',
    'disambiguation',
    'offset',
    'overflow',
  ])
})

it('keeps minute and exact offset matching distinct after string classification', () => {
  expect(
    Temporal.ZonedDateTime.from('1970-01-01T00:00-00:45[Africa/Monrovia]')
      .epochNanoseconds
  ).toBe(2_670_000_000_000n)
  expect(() =>
    Temporal.ZonedDateTime.from('1970-01-01T00:00-00:45:00[Africa/Monrovia]')
  ).toThrow(RangeError)
})

it('rejects invalid offset syntax before zoned string options', () => {
  let reads = 0
  expect(() =>
    Temporal.ZonedDateTime.from('1970-01-01T00+24:00[UTC]', {
      get disambiguation() {
        reads++
        return 'compatible'
      },
    })
  ).toThrow(RangeError)
  expect(reads).toBe(0)
})

it.each(['America/New_York', 'US/Eastern'])(
  'keeps private primary-zone lookups out of difference validation with %s',
  otherZone => {
    const first = new Temporal.ZonedDateTime(0n, 'America/New_York')
    const last = new Temporal.ZonedDateTime(86_400_000_000_000n, otherZone)
    const key = 'America/New_York'
    const descriptor = Object.getOwnPropertyDescriptor(Object.prototype, key)
    let calls = 0,
      invalid: unknown,
      valid: unknown,
      validError: unknown
    try {
      Object.defineProperty(Object.prototype, key, {
        configurable: true,
        get() {
          calls++
          throw new Error('Inherited primary-zone lookup')
        },
      })
      try {
        first.until(last, {
          largestUnit: 'day',
          smallestUnit: 'hour',
          roundingIncrement: 24,
        })
      } catch (caught) {
        invalid = caught
      }
      try {
        valid = first
          .until(last, {largestUnit: 'day', smallestUnit: 'hour'})
          .toString()
      } catch (caught) {
        validError = caught
      }
    } finally {
      if (descriptor) Object.defineProperty(Object.prototype, key, descriptor)
      else Reflect.deleteProperty(Object.prototype, key)
    }
    expect(calls).toBe(0)
    expect(invalid).toBeInstanceOf(RangeError)
    expect(validError).toBeUndefined()
    expect(valid).toBe('P1D')
  }
)

it('collects both fold candidates without inherited array index setters', () => {
  const zone = 'America/New_York'
  void new Temporal.ZonedDateTime(0n, zone).offsetNanoseconds
  const original = Object.getOwnPropertyDescriptor(Array.prototype, '1')
  let epoch: bigint | undefined,
    error: unknown,
    calls = 0
  try {
    Object.defineProperty(Array.prototype, '1', {
      configurable: true,
      set() {
        calls++
        throw new Error('Inherited private fold candidate')
      },
    })
    epoch = Temporal.ZonedDateTime.from('2024-11-03T01:30[America/New_York]', {
      disambiguation: 'later',
    }).epochNanoseconds
  } catch (caught) {
    error = caught
  } finally {
    if (original) Object.defineProperty(Array.prototype, '1', original)
    else Reflect.deleteProperty(Array.prototype, '1')
  }
  expect(error).toBeUndefined()
  expect(calls).toBe(0)
  expect(epoch).toBe(1730615400000000000n)
})

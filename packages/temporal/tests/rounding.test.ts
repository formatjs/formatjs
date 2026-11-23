import {
  isTimeZoneOffsetString,
  parseOffsetNanoseconds,
} from '#packages/temporal/instant-string.js'
import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {Temporal as reference} from 'temporal-polyfill/implementation'
import {Instant, Temporal} from '#packages/temporal/index.js'
import {formatInstant} from '#packages/temporal/instant-format.js'

it('matches independent ICU decimal rounding across modes, increments and epoch signs', () => {
  const path = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-rounding-fixtures.tsv`
  )
  let count = 0
  for (const line of readFileSync(path, 'utf8').trim().split('\n')) {
    if (line.startsWith('#')) continue
    const [value, smallestUnit, increment, roundingMode, expected] =
      line.split('\t')
    expect(
      new Instant(BigInt(value)).round({
        smallestUnit,
        roundingIncrement: +increment,
        roundingMode,
      }).epochNanoseconds,
      line
    ).toBe(BigInt(expected))
    count++
  }
  expect(count).toBeGreaterThan(1500)
  console.log(`${count} independent ICU decimal rounding cases`)
})

it('serializes UTC, fixed and named zones across transitions and range boundaries', () => {
  const values = [
    -8640000000000000000000n,
    -1n,
    0n,
    1n,
    8640000000000000000000n,
    1636264800000000000n,
  ]
  for (const value of values) {
    for (const timeZone of [
      undefined,
      'UTC',
      '+23:59',
      '-23:59',
      'America/New_York',
      'US/Eastern',
      'europe/paris',
    ]) {
      for (const smallestUnit of [
        'minute',
        'second',
        'millisecond',
        'nanosecond',
      ] as const) {
        const options = {timeZone, smallestUnit}
        expect(
          new Instant(value).toString(options),
          `${value} ${timeZone} ${smallestUnit}`
        ).toBe(new reference.Instant(value).toString(options))
      }
    }
    expect(Instant.from(new Instant(value).toJSON()).epochNanoseconds).toBe(
      value
    )
  }
})

it('uses the full historical offset for fields but rounds its label to minutes', () => {
  expect(formatInstant(0n, 'auto', -1_000_000_000n)).toBe(
    '1969-12-31T23:59:59+00:00'
  )
  expect(formatInstant(0n, 'auto', 30_000_000_000n)).toBe(
    '1970-01-01T00:00:30+00:01'
  )
})

it('accepts every ISO string grammar used for timezone extraction', () => {
  for (const timeZone of [
    '0230[UTC]',
    '202013[UTC]',
    '2020[UTC]',
    '1970-01-01[UTC]',
    '1970-01[UTC]',
    '--01-01[UTC]',
    'T01:00+01',
    '01:00+01',
    '+999999-01-01T00Z',
  ]) {
    const expected = timeZone.includes('+01')
      ? '1970-01-01T01:00:00+01:00'
      : '1970-01-01T00:00:00+00:00'
    expect(new Instant(0n).toString({timeZone}), timeZone).toBe(expected)
  }
  for (const timeZone of [
    'T00Z',
    '1215-05',
    '02-30[UTC]',
    '1970-13[UTC]',
    '1970-01[UTC][u-ca=hebrew]',
  ])
    expect(() => new Instant(0n).toString({timeZone}), timeZone).toThrow(
      RangeError
    )
})

const unitNameCases: readonly [
  string,
  string,
  () => (unit: unknown) => unknown,
  unknown,
][] = [
  [
    'Instant.round',
    'minutes',
    () => {
      const value = new Temporal.Instant(90_000_000_000n)
      return unit => value.round({smallestUnit: unit}).epochNanoseconds
    },
    120_000_000_000n,
  ],
  [
    'PlainTime.round',
    'minutes',
    () => {
      const value = new Temporal.PlainTime(12, 34, 45)
      return unit => value.round({smallestUnit: unit}).minute
    },
    35,
  ],
  [
    'PlainDateTime.round',
    'minutes',
    () => {
      const value = new Temporal.PlainDateTime(2000, 1, 2, 12, 34, 45)
      return unit => value.round({smallestUnit: unit}).minute
    },
    35,
  ],
  [
    'ZonedDateTime.round',
    'minutes',
    () => {
      const value = Temporal.ZonedDateTime.from('2000-01-02T12:34:45Z[UTC]')
      return unit => value.round({smallestUnit: unit}).epochNanoseconds
    },
    946_816_500_000_000_000n,
  ],
  [
    'Duration.round',
    'hours',
    () => {
      const value = new Temporal.Duration(0, 0, 0, 0, 1, 30)
      return unit => value.round({smallestUnit: unit}).hours
    },
    2,
  ],
  [
    'Duration.total',
    'minutes',
    () => {
      const value = new Temporal.Duration(0, 0, 0, 0, 1, 30)
      return unit => value.total({unit})
    },
    90,
  ],
  [
    'PlainDate.until',
    'days',
    () => {
      const one = new Temporal.PlainDate(2024, 2, 28),
        two = new Temporal.PlainDate(2024, 3, 1)
      return unit =>
        one.until(two, {largestUnit: unit, smallestUnit: 'days'}).days
    },
    2,
  ],
  [
    'PlainYearMonth.until',
    'months',
    () => {
      const one = new Temporal.PlainYearMonth(2024, 1),
        two = new Temporal.PlainYearMonth(2024, 3)
      return unit => one.until(two, {largestUnit: unit}).months
    },
    2,
  ],
]
it.each(
  unitNameCases.flatMap(([name, text, prepare, expected]) =>
    (['endsWith', 'slice'] as const).map(key => ({
      name,
      text,
      prepare,
      expected,
      key,
    }))
  )
)(
  '$name matches units without String.prototype.$key',
  ({text, prepare, expected, key}) => {
    const run = prepare()
    const hints: string[] = []
    const value = {
      [Symbol.toPrimitive](hint: string) {
        hints.push(hint)
        return text
      },
    }
    const original = Object.getOwnPropertyDescriptor(String.prototype, key)!
    let actual: unknown
    try {
      Object.defineProperty(String.prototype, key, {
        configurable: true,
        get() {
          throw new Error('Private unit string hook reached')
        },
      })
      actual = run(value)
    } finally {
      Object.defineProperty(String.prototype, key, original)
    }
    expect(actual).toEqual(expected)
    expect(hints).toEqual(['string'])
  }
)

it('recognizes exactly both forms of all ten normal unit names', () => {
  const one = new Temporal.PlainDate(2024, 1, 1),
    two = new Temporal.PlainDate(2025, 2, 3)
  for (const [singular, plural, field, expected] of [
    ['year', 'years', 'years', 1],
    ['month', 'months', 'months', 13],
    ['week', 'weeks', 'weeks', 57],
    ['day', 'days', 'days', 399],
  ] as const) {
    for (const name of [singular, plural])
      expect(one.until(two, {largestUnit: name})[field], name).toBe(expected)
  }
  const hour = new Temporal.Duration(0, 0, 0, 0, 1)
  for (const [singular, plural, expected] of [
    ['hour', 'hours', 1],
    ['minute', 'minutes', 60],
    ['second', 'seconds', 3600],
    ['millisecond', 'milliseconds', 3_600_000],
    ['microsecond', 'microseconds', 3_600_000_000],
    ['nanosecond', 'nanoseconds', 3_600_000_000_000],
  ] as const) {
    for (const name of [singular, plural])
      expect(hour.total(name), name).toBe(expected)
  }
  for (const name of [
    'Minutes',
    'minutess',
    'minutes\n',
    'constructor',
    '__proto__',
    'toString',
    'auto',
  ]) {
    expect(() => hour.total(name), name).toThrow(RangeError)
  }
})

it('preserves one unit Get, string coercion and the exact abrupt completion', () => {
  const value = new Temporal.Instant(0n)
  const failure = {}
  const events: string[] = []
  let actual: unknown
  try {
    value.round({
      get smallestUnit() {
        events.push('get')
        return {
          [Symbol.toPrimitive](hint: string) {
            events.push(hint)
            throw failure
          },
        }
      },
    })
  } catch (error) {
    actual = error
  }
  expect(actual).toBe(failure)
  expect(events).toEqual(['get', 'string'])
})

it.each([
  ['hour', 24],
  ['minute', 60],
  ['second', 60],
  ['millisecond', 1000],
  ['microsecond', 1000],
  ['nanosecond', 1000],
] as const)(
  'uses strict divisor bounds for clock %s increments',
  (unit, maximum) => {
    const value = new Temporal.PlainTime()
    const duration = new Temporal.Duration()
    for (const increment of [1, 2.9, maximum / 2]) {
      expect(
        value.round({smallestUnit: unit, roundingIncrement: increment}).hour
      ).toBe(0)
      expect(
        value.until(value, {smallestUnit: unit, roundingIncrement: increment})
          .blank
      ).toBe(true)
      expect(
        duration.round({smallestUnit: unit, roundingIncrement: increment}).blank
      ).toBe(true)
    }
    for (const increment of [0, 7, maximum - 1, maximum, maximum + 1]) {
      expect(() =>
        duration.round({smallestUnit: unit, roundingIncrement: increment})
      ).toThrow(RangeError)
      expect(
        () => value.round({smallestUnit: unit, roundingIncrement: increment}),
        String(increment)
      ).toThrow(RangeError)
      expect(() =>
        value.until(value, {smallestUnit: unit, roundingIncrement: increment})
      ).toThrow(RangeError)
    }
  }
)

it.each([
  ['hour', 24],
  ['minute', 1440],
  ['second', 86_400],
  ['millisecond', 86_400_000],
] as const)(
  'allows the inclusive day divisor for Instant %s rounding',
  (unit, maximum) => {
    const value = new Temporal.Instant(0n)
    expect(
      value.round({smallestUnit: unit, roundingIncrement: maximum})
        .epochNanoseconds
    ).toBe(0n)
    for (const increment of [7, maximum + 1])
      expect(() =>
        value.round({smallestUnit: unit, roundingIncrement: increment})
      ).toThrow(RangeError)
  }
)

it.each(['year', 'month', 'week', 'day'])(
  'has no fixed time-unit increment cap for calendar %s',
  unit => {
    const anchor = new Temporal.PlainDate(2020, 1, 1)
    expect(
      new Temporal.Duration().round({
        largestUnit: unit,
        smallestUnit: unit,
        roundingIncrement: 1001,
        relativeTo: anchor,
      }).blank
    ).toBe(true)
  }
)

it.each([
  [undefined, 1_500_000_001n],
  [true, 1_500_000_001n],
  [1.9, 1_500_000_001n],
  [2.9, 1_500_000_002n],
  ['2.9', 1_500_000_002n],
  [1_000_000_000, 2_000_000_000n],
  [1_000_000_000.9, 2_000_000_000n],
])(
  'gets and truncates rounding increment %s before its numeric bounds',
  (raw, expected) => {
    const events: string[] = []
    const actual = new Temporal.Instant(1_500_000_001n).round({
      get roundingIncrement() {
        events.push('increment')
        return raw
      },
      get roundingMode() {
        events.push('mode')
        return undefined
      },
      get smallestUnit() {
        events.push('unit')
        return 'nanosecond'
      },
    })
    expect(actual.epochNanoseconds).toBe(expected)
    expect(events).toEqual(['increment', 'mode', 'unit'])
  }
)

it.each([
  [0, RangeError],
  [-0, RangeError],
  [-1, RangeError],
  [0.9, RangeError],
  [NaN, RangeError],
  [Infinity, RangeError],
  [-Infinity, RangeError],
  [1_000_000_001, RangeError],
  [1_080_000_000, RangeError],
  [Number.MAX_VALUE, RangeError],
  [1n, TypeError],
  [Symbol('increment'), TypeError],
])(
  'rejects invalid rounding increment %s before later options',
  (raw, ErrorType) => {
    const events: string[] = []
    expect(() =>
      new Temporal.Instant(0n).round({
        get roundingIncrement() {
          events.push('increment')
          return raw
        },
        get roundingMode() {
          throw new Error('Later roundingMode Get reached')
        },
        get smallestUnit() {
          throw new Error('Later smallestUnit Get reached')
        },
      })
    ).toThrow(ErrorType)
    expect(events).toEqual(['increment'])
  }
)

it('uses one number-hint conversion and propagates an abrupt increment exactly', () => {
  const events: string[] = []
  const value = new Temporal.Instant(1_500_000_001n)
  const increment = {
    [Symbol.toPrimitive](hint: string) {
      events.push(hint)
      return '2.9'
    },
  }
  expect(
    value.round({roundingIncrement: increment, smallestUnit: 'nanosecond'})
      .epochNanoseconds
  ).toBe(1_500_000_002n)
  expect(events).toEqual(['number'])
  const failure = {}
  let actual: unknown
  try {
    value.round({
      roundingIncrement: {
        [Symbol.toPrimitive]() {
          throw failure
        },
      },
      get roundingMode() {
        throw new Error('Later option reached')
      },
    })
  } catch (error) {
    actual = error
  }
  expect(actual).toBe(failure)
})

it.each(
  [
    {
      name: 'Instant',
      prepare: () => new Temporal.Instant(1_120_300_000n),
      expected: ['1970-01-01T00:00:01.1203Z', '1970-01-01T00:00:01.1203Z'],
    },
    {
      name: 'PlainTime',
      prepare: () => new Temporal.PlainTime(12, 34, 56, 120, 300),
      expected: ['12:34:56.1203', '12:34:56.1203'],
    },
    {
      name: 'Duration',
      prepare: () => new Temporal.Duration(0, 0, 0, 0, 0, 0, 1, 120, 300),
      expected: ['PT1.1203S', 'PT1.1203S'],
    },
  ].flatMap(test =>
    ['String', 'padStart', 'slice', 'replace'].map(key => ({...test, key}))
  )
)(
  '$name formats private digits without mutable $key',
  ({prepare, expected, key}) => {
    const value = prepare()
    const target = key === 'String' ? globalThis : String.prototype
    const original = Object.getOwnPropertyDescriptor(target, key)!
    let actual: string[] | undefined
    try {
      Object.defineProperty(target, key, {
        configurable: true,
        get() {
          throw new Error('Private formatting hook reached')
        },
      })
      actual = [value.toString(), value.toString({fractionalSecondDigits: 4})]
    } finally {
      Object.defineProperty(target, key, original)
    }
    expect(actual).toEqual(expected)
  }
)

it.each([0, 1, 1000, 1_000_000, 120_300_000, 999_999_999])(
  'matches independent serialization for every precision of fraction %s',
  fraction => {
    const milliseconds = Math.floor(fraction / 1_000_000)
    const microseconds = Math.floor(fraction / 1000) % 1000
    const nanoseconds = fraction % 1000
    const pairs = [
      [
        new Temporal.Instant(BigInt(fraction)),
        new reference.Instant(BigInt(fraction)),
      ],
      [
        new Temporal.PlainTime(
          0,
          0,
          0,
          milliseconds,
          microseconds,
          nanoseconds
        ),
        new reference.PlainTime(
          0,
          0,
          0,
          milliseconds,
          microseconds,
          nanoseconds
        ),
      ],
      [
        new Temporal.Duration(
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          milliseconds,
          microseconds,
          nanoseconds
        ),
        new reference.Duration(
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          milliseconds,
          microseconds,
          nanoseconds
        ),
      ],
    ] as const
    for (const fractionalSecondDigits of [
      'auto',
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
    ] as const)
      for (const [actual, expected] of pairs) {
        const options = {fractionalSecondDigits, roundingMode: 'trunc'} as const
        expect(actual.toString(options)).toBe(expected.toString(options))
      }
  }
)

it.each([
  [
    'fixed zone constructor',
    () => new Temporal.ZonedDateTime(0n, '+01:02').offsetNanoseconds,
    3_720_000_000_000,
  ],
  [
    'Instant offset',
    () =>
      Temporal.Instant.from('1970-01-01T00:00:00+01:02:03.000000004')
        .epochNanoseconds,
    -3_723_000_000_004n,
  ],
  [
    'PlainTime fraction',
    () => Temporal.PlainTime.from('12:34:56.000000007').nanosecond,
    7,
  ],
  [
    'PlainDateTime fraction',
    () =>
      Temporal.PlainDateTime.from('2000-01-01T12:34:56.000007008').microsecond,
    7,
  ],
  [
    'zoned fraction',
    () =>
      Temporal.ZonedDateTime.from('1970-01-01T00:00:00.000000009+00:00[UTC]')
        .epochNanoseconds,
    9n,
  ],
] as const)(
  'parses %s without private String.prototype.padEnd reads',
  (_name, run, expected) => {
    const original = Object.getOwnPropertyDescriptor(
      String.prototype,
      'padEnd'
    )!
    let actual: unknown
    try {
      Object.defineProperty(String.prototype, 'padEnd', {
        configurable: true,
        get() {
          throw new Error('Private fraction padding hook reached')
        },
      })
      actual = run()
    } finally {
      Object.defineProperty(String.prototype, 'padEnd', original)
    }
    expect(actual).toBe(expected)
  }
)

it.each([
  '',
  '1',
  '12',
  '123',
  '1234',
  '12345',
  '123456',
  '1234567',
  '12345678',
  '123456789',
  '000000001',
])(
  'preserves offset fraction width %s for both signs and decimal separators',
  digits => {
    for (const sign of ['+', '-'])
      for (const separator of digits ? ['.', ','] : ['']) {
        const text = `1970-01-01T00:00:00${sign}01:02:03${separator}${digits}`
        expect(Temporal.Instant.from(text).epochNanoseconds).toBe(
          reference.Instant.from(text).epochNanoseconds
        )
      }
  }
)

it.each([
  [
    'offset helper',
    'exec',
    () => parseOffsetNanoseconds('+23:59:59.999999999'),
    86_399_999_999_999n,
  ],
  [
    'offset helper',
    'test',
    () => parseOffsetNanoseconds('+23:59:59.999999999'),
    86_399_999_999_999n,
  ],
  [
    'fixed zone',
    'exec',
    () => new Temporal.ZonedDateTime(0n, '+02:03').timeZoneId,
    '+02:03',
  ],
  [
    'fixed zone',
    'test',
    () => new Temporal.ZonedDateTime(0n, '+02:03').timeZoneId,
    '+02:03',
  ],
  [
    'fixed zone',
    'String',
    () => new Temporal.ZonedDateTime(0n, '+02:03').timeZoneId,
    '+02:03',
  ],
  [
    'fixed zone',
    'padStart',
    () => new Temporal.ZonedDateTime(0n, '+02:03').timeZoneId,
    '+02:03',
  ],
] as const)('%s avoids private %s hooks', (_name, key, run, expected) => {
  const target =
    key === 'String'
      ? globalThis
      : key === 'padStart'
        ? String.prototype
        : RegExp.prototype
  const original = Object.getOwnPropertyDescriptor(target, key)!
  let actual: unknown
  try {
    Object.defineProperty(target, key, {
      configurable: true,
      get() {
        throw new Error('Private offset grammar hook reached')
      },
    })
    actual = run()
  } finally {
    Object.defineProperty(target, key, original)
  }
  expect(actual).toBe(expected)
})

it('matches the complete offset grammar at clock and fraction boundaries', () => {
  let count = 0
  const check = (text: string) => {
    const expected = -reference.Instant.from('1970-01-01T00:00:00' + text)
      .epochNanoseconds
    expect(isTimeZoneOffsetString(text), text).toBe(true)
    expect(parseOffsetNanoseconds(text), text).toBe(expected)
    count++
  }
  const pair = (value: number) => String(value).padStart(2, '0')
  for (const sign of ['+', '-'])
    for (const hour of [0, 9, 10, 23]) {
      check(sign + pair(hour))
      for (const separator of ['', ':'])
        for (const minute of [0, 9, 10, 59]) {
          const prefix = sign + pair(hour) + separator + pair(minute)
          check(prefix)
          for (const second of [0, 9, 10, 59]) {
            const base = prefix + separator + pair(second)
            check(base)
            for (const decimal of ['.', ','])
              for (const digits of [
                '0',
                '1',
                '000000001',
                '123456789',
                '999999999',
              ])
                check(base + decimal + digits)
          }
        }
    }
  expect(count).toBe(2888)
})

it.each([
  '',
  '+',
  '-',
  '+0',
  '00',
  'Z',
  'UTC',
  '  +01',
  '+01 ',
  '+01\n',
  '+01\u0000',
  '\u221201',
  '+\u0661\u0662',
  '+24',
  '-24',
  '+99',
  '+01:',
  '+010',
  '+01:0',
  '+0160',
  '+01:60',
  '+010260',
  '+01:02:60',
  '+0102:03',
  '+01:0203',
  '+01.5',
  '+01:02.5',
  '+010203.',
  '+01:02:03,',
  '+01:02:03.1234567890',
  '+01:02:03.1x',
  '+01:02:03.1\n',
  '+01:02:03.+1',
  '+01:02:03.\u0661',
  '+01[UTC]',
  '+01:02:03Z',
  '++01',
  '--01',
  '+01::02',
  '+01:02::03',
])('rejects an entire malformed UTCOffset %s', text => {
  expect(isTimeZoneOffsetString(text)).toBe(false)
  expect(() => parseOffsetNanoseconds(text)).toThrow(RangeError)
})

it('keeps minute-only timezone contexts separate from the full offset grammar', () => {
  for (const text of ['+00', '-00', '+23', '-2359', '+23:59'])
    expect(parseOffsetNanoseconds(text, true)).toBe(
      parseOffsetNanoseconds(text)
    )
  for (const text of [
    '+000000',
    '+00:00:00',
    '+010203.1',
    '+01:02:03,000000001',
  ]) {
    expect(isTimeZoneOffsetString(text)).toBe(true)
    expect(() => parseOffsetNanoseconds(text, true)).toThrow(RangeError)
    expect(() => new Temporal.ZonedDateTime(0n, text)).toThrow(RangeError)
  }
})

it.each(['0', '1', '2', '3', '19'])(
  'never reads inherited offset digit %s',
  key => {
    const original = Object.getOwnPropertyDescriptor(String.prototype, key)
    let actual: unknown
    try {
      Object.defineProperty(String.prototype, key, {
        configurable: true,
        get() {
          throw new Error('Out-of-bounds offset digit read')
        },
      })
      actual = [
        isTimeZoneOffsetString(''),
        isTimeZoneOffsetString('+'),
        isTimeZoneOffsetString('+0'),
        parseOffsetNanoseconds('+00'),
        parseOffsetNanoseconds('+23:59:59.999999999'),
      ]
    } finally {
      if (original) Object.defineProperty(String.prototype, key, original)
      else Reflect.deleteProperty(String.prototype, key)
    }
    expect(actual).toEqual([false, false, false, 0n, 86_399_999_999_999n])
  }
)

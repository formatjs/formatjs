import {
  parseCalendarString,
  parseISODateParts,
  parseShortDateString,
  parseTimeZoneString,
  parseZonedDateTimeString,
} from '#packages/temporal/instant-string.js'
import {nativeTemporal} from '#packages/temporal/native.js'
import strings from '#packages/temporal/tests/instant-strings.json' with {type: 'json'}
import {expect, it} from 'vitest'
import {Instant, Temporal} from '#packages/temporal/index.js'

it('coerces before reading newTarget.prototype, propagates abrupt completions', () => {
  const order: string[] = []
  const value = {
    [Symbol.toPrimitive](hint: string) {
      order.push(hint)
      return 1n
    },
  }
  const target = new Proxy(function () {}, {
    get(object, key, receiver) {
      if (key === 'prototype') order.push('prototype')
      return Reflect.get(object, key, receiver)
    },
  })
  Reflect.construct(Instant, [value], target)
  expect(order).toEqual(['number', 'prototype'])
  const failure = new Error('coercion failed')
  order.length = 0
  expect(() =>
    Reflect.construct(
      Instant,
      [
        {
          [Symbol.toPrimitive]() {
            throw failure
          },
        },
      ],
      target
    )
  ).toThrow(failure)
  expect(order).toEqual([])
})
it('keeps private slots off instances and rejects forged/proxied receivers', () => {
  const instant = new Instant(-1n)
  expect(Reflect.ownKeys(instant)).toEqual([])
  expect(instant.epochMilliseconds).toBe(-1)
  const getter = Object.getOwnPropertyDescriptor(
    Instant.prototype,
    'epochNanoseconds'
  )!.get!
  for (const value of [
    {epochNanoseconds: 1n},
    Object.create(Instant.prototype),
    new Proxy(instant, {}),
  ])
    expect(() => getter.call(value)).toThrow(TypeError)
  Object.freeze(instant)
  expect(instant.epochNanoseconds).toBe(-1n)
})
it('coerces numeric factories once and keeps results intrinsic', () => {
  let calls = 0
  const input = {
    [Symbol.toPrimitive](hint: string) {
      calls++
      expect(hint).toBe('number')
      return 2
    },
  }
  expect(Instant.fromEpochMilliseconds(input).epochNanoseconds).toBe(2_000_000n)
  expect(calls).toBe(1)
  class Child extends Instant {}
  const child = new Child(1n)
  expect(child).toBeInstanceOf(Child)
  expect(Child.fromEpochNanoseconds(1n)).not.toBeInstanceOf(Child)
  expect(() =>
    Instant.fromEpochMilliseconds({
      valueOf() {
        return 1n
      },
    })
  ).toThrow(TypeError)
})

it('parses ISO instants, preserves offsets and copies branded values', () => {
  expect(Instant.from('1970-01-01T00:00:00.000000001Z').epochNanoseconds).toBe(
    1n
  )
  expect(
    Instant.from('1970-01-01T00:00:00+00:00:00.000000001').epochNanoseconds
  ).toBe(-1n)
  const original = new Instant(1n)
  Object.defineProperty(original, 'epochNanoseconds', {
    get() {
      throw new Error('observable getter')
    },
  })
  const copy = Instant.from(original)
  expect(copy).not.toBe(original)
  expect(copy.equals(original)).toBe(true)
  for (const text of [
    '2023-02-29T00:00:00Z',
    '-000000-01-01T00:00:00Z',
    '1970-01-01T00:00:00+24:00',
    '1970-01-01T00:00:00.1234567890Z',
  ])
    expect(() => Instant.from(text)).toThrow(RangeError)
})

it('shares exact parser expectations with the Rust core', () => {
  for (const {input, epochNanoseconds} of strings.valid)
    expect(Instant.from(input).epochNanoseconds, input).toBe(
      BigInt(epochNanoseconds)
    )
  for (const input of strings.invalid)
    expect(() => Instant.from(input), input).toThrow(RangeError)
})

it('compares exact instants, coercing left before right', () => {
  const order: string[] = []
  const input = (name: string, text: string) => ({
    toString() {
      order.push(name)
      return text
    },
  })
  expect(
    Instant.compare(
      input('left', '1970-01-01T00Z'),
      input('right', '1970-01-01T00:00:00.000000001Z')
    )
  ).toBe(-1)
  expect(order).toEqual(['left', 'right'])
  expect(Instant.compare(new Instant(1n), new Instant(0n))).toBe(1)
  expect(Instant.compare('19700101T00Z', new Instant(0n))).toBe(0)
})

it('creates Temporal objects without mutable allocation or reflection helpers', () => {
  const cases: [string, () => {toString(): string}, string][] = [
    ['Instant constructor', () => new Instant(0n), '1970-01-01T00:00:00Z'],
    [
      'Instant.from',
      () => Instant.from('1970-01-01T00:00Z'),
      '1970-01-01T00:00:00Z',
    ],
    ['Duration constructor', () => new Temporal.Duration(0, 0, 0, 1), 'P1D'],
    ['Duration.from', () => Temporal.Duration.from('P1D'), 'P1D'],
    [
      'PlainDate constructor',
      () => new Temporal.PlainDate(2020, 2, 29),
      '2020-02-29',
    ],
    [
      'PlainDate.from',
      () => Temporal.PlainDate.from('2020-02-29'),
      '2020-02-29',
    ],
    [
      'PlainDateTime constructor',
      () => new Temporal.PlainDateTime(2020, 2, 29),
      '2020-02-29T00:00:00',
    ],
    [
      'PlainDateTime.from',
      () => Temporal.PlainDateTime.from('2020-02-29'),
      '2020-02-29T00:00:00',
    ],
    ['PlainTime constructor', () => new Temporal.PlainTime(12, 34), '12:34:00'],
    ['PlainTime.from', () => Temporal.PlainTime.from('12:34'), '12:34:00'],
    [
      'PlainYearMonth constructor',
      () => new Temporal.PlainYearMonth(2020, 2),
      '2020-02',
    ],
    [
      'PlainYearMonth.from',
      () => Temporal.PlainYearMonth.from('2020-02'),
      '2020-02',
    ],
    [
      'PlainMonthDay constructor',
      () => new Temporal.PlainMonthDay(2, 29),
      '02-29',
    ],
    ['PlainMonthDay.from', () => Temporal.PlainMonthDay.from('02-29'), '02-29'],
    [
      'ZonedDateTime constructor',
      () => new Temporal.ZonedDateTime(0n, 'UTC'),
      '1970-01-01T00:00:00+00:00[UTC]',
    ],
    [
      'ZonedDateTime.from',
      () => Temporal.ZonedDateTime.from('1970-01-01T00:00[UTC]'),
      '1970-01-01T00:00:00+00:00[UTC]',
    ],
  ]
  const failure = new Error('Mutable helper reached')
  const overrides: [string, () => () => void][] = [
    [
      'Object.create',
      () => {
        const original = Object.create
        Object.create = () => {
          throw failure
        }
        return () => {
          Object.create = original
        }
      },
    ],
    [
      'Reflect.get',
      () => {
        const original = Reflect.get
        Reflect.get = () => {
          throw failure
        }
        return () => {
          Reflect.get = original
        }
      },
    ],
  ]
  for (const [intrinsic, override] of overrides) {
    for (const [name, create, expected] of cases) {
      let result: {toString(): string} | undefined, error: unknown
      const restore = override()
      try {
        result = create()
      } catch (caught) {
        error = caught
      } finally {
        restore()
      }
      expect(error, `${intrinsic}: ${name}`).toBeUndefined()
      expect(result!.toString(), `${intrinsic}: ${name}`).toBe(expected)
    }
  }
})

it('reads locale options with their original receiver without mutable Reflect.get', () => {
  const value = new Temporal.PlainDate(2020, 2, 29)
  const expected = value.toLocaleString('en', {year: 'numeric'})
  let reads = 0,
    correctReceiver = false,
    result: string | undefined,
    error: unknown
  const options = {
    get year() {
      reads++
      correctReceiver = this === options
      return 'numeric' as const
    },
  }
  const original = Reflect.get
  try {
    Reflect.get = () => {
      throw new Error('Mutable Reflect.get reached')
    }
    result = value.toLocaleString('en', options)
  } catch (caught) {
    error = caught
  } finally {
    Reflect.get = original
  }
  expect(error).toBeUndefined()
  expect(result).toBe(expected)
  expect(correctReceiver).toBe(true)
  expect(reads).toBe(1)
})

it('keeps Temporal input and option coercion independent of mutable globals', () => {
  const key = Symbol.toPrimitive
  let numberHint: string | undefined, stringHint: string | undefined
  const input = {
    [key](hint: string) {
      numberHint = hint
      return 0n
    },
  }
  const overflow = {
    [key](hint: string) {
      stringHint = hint
      return 'reject'
    },
  }
  const originalApply = Reflect.apply,
    originalSymbol = Symbol,
    originalString = String
  const failure = new Error('Mutable coercion global reached')
  const poison = function () {
    throw failure
  }
  let instant: InstanceType<typeof Instant> | undefined,
    date: InstanceType<typeof Temporal.PlainDate> | undefined,
    error: unknown
  try {
    Reflect.apply = poison
    Reflect.set(globalThis, 'Symbol', poison)
    Reflect.set(globalThis, 'String', poison)
    instant = new Instant(input)
    date = Temporal.PlainDate.from('2020-02-29', {overflow})
  } catch (caught) {
    error = caught
  } finally {
    Reflect.apply = originalApply
    Reflect.set(globalThis, 'Symbol', originalSymbol)
    Reflect.set(globalThis, 'String', originalString)
  }
  expect(error).toBeUndefined()
  expect(instant!.epochNanoseconds).toBe(0n)
  expect(date!.day).toBe(29)
  expect(numberHint).toBe('number')
  expect(stringHint).toBe('string')
})

it.each([
  [
    'Instant UTC',
    () => new Temporal.Instant(-1n).toString(),
    '1969-12-31T23:59:59.999999999Z',
  ],
  [
    'Instant fixed offset',
    () => new Temporal.Instant(0n).toString({timeZone: '+01:30'}),
    '1970-01-01T01:30:00+01:30',
  ],
  ['PlainDate week', () => new Temporal.PlainDate(2021, 1, 1).weekOfYear, 53],
  [
    'PlainDateTime',
    () => new Temporal.PlainDateTime(2024, 2, 29, 12, 34, 56).toString(),
    '2024-02-29T12:34:56',
  ],
  [
    'PlainTime precision',
    () =>
      new Temporal.PlainTime(12, 34, 56, 123).toString({
        fractionalSecondDigits: 2,
      }),
    '12:34:56.12',
  ],
  [
    'PlainYearMonth',
    () => new Temporal.PlainYearMonth(2024, 2).toString(),
    '2024-02',
  ],
  [
    'PlainMonthDay',
    () => new Temporal.PlainMonthDay(2, 29).toString(),
    '02-29',
  ],
  [
    'ZonedDateTime',
    () => new Temporal.ZonedDateTime(0n, '+01:30').toString(),
    '1970-01-01T01:30:00+01:30[+01:30]',
  ],
] as const)(
  'keeps %s arithmetic independent of mutable Math.floor',
  (_name, run, expected) => {
    const original = Math.floor
    let actual: unknown
    try {
      Math.floor = function () {
        throw new Error('Mutable Math.floor reached')
      }
      actual = run()
    } finally {
      Math.floor = original
    }
    expect(actual).toBe(expected)
  }
)

it.each([
  ['Math.abs', () => Temporal.Duration.from('-PT1H').abs().hours, 1],
  [
    'Math.min',
    () =>
      new Temporal.Instant(0n).until(new Temporal.Instant(1_000_000_000n), {
        smallestUnit: 'second',
      }).seconds,
    1,
  ],
  ['Math.max', () => Temporal.PlainTime.from({hour: 25}).hour, 23],
  [
    'Math.trunc',
    () => new Temporal.PlainDate(2024.9, 2.9, 29.9).toString(),
    '2024-02-29',
  ],
  [
    'Math.sign',
    () =>
      Temporal.PlainDate.from('2024-02-29').until('2024-01-29', {
        largestUnit: 'month',
      }).months,
    -1,
  ],
  ['Number.isInteger', () => new Temporal.PlainDate(2024, 2, 29).day, 29],
  [
    'Number.isSafeInteger',
    () =>
      Temporal.PlainDate.from({
        calendar: 'hebrew',
        year: 5784,
        monthCode: 'M05L',
        day: 1,
      }).monthCode,
    'M05L',
  ],
  [
    'Number.isFinite',
    () =>
      new Temporal.Instant(1n).round({
        smallestUnit: 'second',
        roundingIncrement: 1,
      }).epochNanoseconds,
    0n,
  ],
  [
    'Number',
    () => new Temporal.Instant(-1n).toString(),
    '1969-12-31T23:59:59.999999999Z',
  ],
  [
    'BigInt',
    () => new Temporal.Instant(1n).add({nanoseconds: 1}).epochNanoseconds,
    2n,
  ],
] as const)(
  'keeps arithmetic independent of mutable %s',
  (name, run, expected) => {
    const parts = name.split('.')
    const owner =
      parts.length === 1 ? globalThis : parts[0] === 'Math' ? Math : Number
    const property = parts[parts.length - 1]
    const original = Object.getOwnPropertyDescriptor(owner, property)!
    let actual: unknown
    try {
      Object.defineProperty(owner, property, {
        ...original,
        value: function () {
          throw new Error('Mutable numeric intrinsic reached')
        },
      })
      actual = run()
    } finally {
      Object.defineProperty(owner, property, original)
    }
    expect(actual).toBe(expected)
  }
)

function checkIntrinsicError(
  name: 'TypeError' | 'RangeError',
  run: () => unknown
): void {
  const original = Object.getOwnPropertyDescriptor(globalThis, name)!
  const prototype = original.value.prototype
  const replacementFailure = {message: 'Mutable error constructor reached'}
  let caught: unknown
  try {
    Object.defineProperty(globalThis, name, {
      ...original,
      value: function () {
        throw replacementFailure
      },
    })
    try {
      run()
    } catch (error) {
      caught = error
    }
  } finally {
    Object.defineProperty(globalThis, name, original)
  }
  expect(Object.getPrototypeOf(caught)).toBe(prototype)
}

it.each([
  ['Instant', () => new Temporal.Instant(8_640_000_000_000_000_000_001n)],
  ['Duration', () => new Temporal.Duration(2 ** 32)],
  ['PlainDate', () => new Temporal.PlainDate(2024, 13, 1)],
  ['nonfinite integer', () => new Temporal.PlainDate(Infinity, 1, 1)],
  [
    'nonpositive truncated field',
    () => Temporal.PlainDate.from({year: 2024, month: 0.9, day: 1}),
  ],
  ['PlainDateTime', () => new Temporal.PlainDateTime(2024, 1, 1, 24)],
  ['PlainTime', () => new Temporal.PlainTime(24)],
  ['PlainYearMonth', () => new Temporal.PlainYearMonth(2024, 13)],
  ['PlainMonthDay', () => new Temporal.PlainMonthDay(2, 30)],
  [
    'ZonedDateTime',
    () => new Temporal.ZonedDateTime(8_640_000_000_000_000_000_001n, 'UTC'),
  ],
] as const)(
  'throws intrinsic RangeError for invalid %s construction',
  (_name, run) => {
    checkIntrinsicError('RangeError', run)
  }
)

it.each([
  'Instant',
  'Duration',
  'PlainDate',
  'PlainDateTime',
  'PlainTime',
  'PlainYearMonth',
  'PlainMonthDay',
  'ZonedDateTime',
] as const)('throws intrinsic TypeError for an invalid %s receiver', name => {
  checkIntrinsicError('TypeError', () =>
    Reflect.apply(Temporal[name].prototype.toString, {}, [])
  )
})

it.each([
  ['date', (value: any) => new Temporal.PlainDate(2024, 1, value).day],
  ['time', (value: any) => new Temporal.PlainTime(value).hour],
] as const)(
  'truncates %s constructor input with one numeric coercion',
  (_name, read) => {
    const hints: string[] = []
    const value = {
      [Symbol.toPrimitive](hint: string) {
        hints.push(hint)
        return 2.9
      },
    }
    expect(read(value)).toBe(2)
    expect(hints).toEqual(['number'])
    const failure = {}
    let caught: unknown
    try {
      read({
        valueOf() {
          throw failure
        },
      })
    } catch (error) {
      caught = error
    }
    expect(caught).toBe(failure)
    expect(() => read(2n)).toThrow(TypeError)
    expect(() => read(Symbol())).toThrow(TypeError)
  }
)

it.each(['every', 'some'] as const)(
  'does not call a replaced Array.prototype.%s for private Temporal lists',
  name => {
    const original = Object.getOwnPropertyDescriptor(Array.prototype, name)!
    const originalApply = Reflect.apply
    const failure = {message: 'Mutable array predicate reached'}
    let result: unknown
    try {
      Reflect.apply = function () {
        throw failure
      }
      Object.defineProperty(Array.prototype, name, {
        ...original,
        value: function () {
          throw failure
        },
      })
      result = [
        new Temporal.PlainDateTime(2000, 2, 29, 12, 34, 56).toString(),
        Temporal.Duration.from('P1DT2H').toString(),
        Temporal.Duration.compare({hours: 2}, {hours: 2}),
        new Temporal.PlainDate(2000, 1, 31).add({months: 1}).day,
      ]
    } finally {
      Reflect.apply = originalApply
      Object.defineProperty(Array.prototype, name, original)
    }
    expect(result).toEqual(['2000-02-29T12:34:56', 'P1DT2H', 0, 29])
  }
)

it.each([
  'minute',
  'second',
  'millisecond',
  'microsecond',
  'nanosecond',
] as const)(
  'ignores inherited %s when building a private noon record',
  name => {
    const original = Object.getOwnPropertyDescriptor(Object.prototype, name)
    let result: string
    try {
      Object.defineProperty(Object.prototype, name, {
        configurable: true,
        get() {
          throw new Error('Inherited private clock field reached')
        },
      })
      result = new Temporal.PlainDate(2024, 2, 29).toString()
    } finally {
      if (original) Object.defineProperty(Object.prototype, name, original)
      else Reflect.deleteProperty(Object.prototype, name)
    }
    expect(result!).toBe('2024-02-29')
  }
)

it('still reads inherited time fields from user field bags', () => {
  let reads = 0
  const fields = Object.assign(
    Object.create({
      get minute() {
        reads++
        return 34
      },
    }),
    {year: 2024, month: 2, day: 29, hour: 12}
  )
  expect(Temporal.PlainDateTime.from(fields).toString()).toBe(
    '2024-02-29T12:34:00'
  )
  expect(reads).toBe(1)
})

it.each([
  ['Instant', TypeError],
  ['ZonedDateTime', TypeError],
  ['PlainDate', RangeError],
  ['PlainDateTime', RangeError],
  ['PlainYearMonth', RangeError],
  ['PlainMonthDay', RangeError],
  ['PlainTime', undefined],
  ['Duration', undefined],
] as const)(
  'ignores inherited argument zero in %s construction',
  (name, ErrorType) => {
    const original = Object.getOwnPropertyDescriptor(Array.prototype, '0')
    const length = Object.getOwnPropertyDescriptor(Array.prototype, 'length')!
    const failure = {message: 'Inherited argument reached'}
    let result: unknown, caught: unknown
    try {
      Object.defineProperty(Array.prototype, '0', {
        configurable: true,
        get() {
          throw failure
        },
      })
      const value = Reflect.construct(Temporal[name], [])
      result = name === 'PlainTime' ? value.hour : value.years
    } catch (error) {
      caught = error
    } finally {
      if (original) Object.defineProperty(Array.prototype, '0', original)
      else Reflect.deleteProperty(Array.prototype, '0')
      Object.defineProperty(Array.prototype, 'length', length)
    }
    if (ErrorType) expect(caught).toBeInstanceOf(ErrorType)
    else {
      expect(caught).toBeUndefined()
      expect(result).toBe(0)
    }
  }
)

it.each([
  ['PlainDate', '3', () => new Temporal.PlainDate(2024, 2, 29).year, 2024],
  [
    'PlainDateTime',
    '9',
    () => new Temporal.PlainDateTime(2024, 2, 29, 12, 34, 56, 0, 0, 0).year,
    2024,
  ],
  ['PlainYearMonth', '2', () => new Temporal.PlainYearMonth(2024, 2).month, 2],
  [
    'PlainMonthDay',
    '2',
    () => new Temporal.PlainMonthDay(2, 29).monthCode,
    'M02',
  ],
] as const)(
  'ignores inherited calendar argument in %s',
  (_name, key, run, expected) => {
    const original = Object.getOwnPropertyDescriptor(Array.prototype, key)
    const length = Object.getOwnPropertyDescriptor(Array.prototype, 'length')!
    let actual: unknown
    try {
      Object.defineProperty(Array.prototype, key, {
        configurable: true,
        get() {
          throw new Error('Inherited calendar argument reached')
        },
      })
      actual = run()
    } finally {
      if (original) Object.defineProperty(Array.prototype, key, original)
      else Reflect.deleteProperty(Array.prototype, key)
      Object.defineProperty(Array.prototype, 'length', length)
    }
    expect(actual).toBe(expected)
  }
)

it.each(['get', 'apply'] as const)(
  'ignores inherited private Proxy %s traps',
  trap => {
    for (const [name, args] of [
      ['Instant', [0n]],
      ['ZonedDateTime', [0n, 'UTC']],
      ['PlainDate', [2024, 2, 29]],
      ['PlainDateTime', [2024, 2, 29]],
      ['PlainYearMonth', [2024, 2]],
      ['PlainMonthDay', [2, 29]],
      ['PlainTime', []],
      ['Duration', []],
    ] as const) {
      const Constructor = Temporal[name]
      const prototype = Constructor.prototype
      const original = Object.getOwnPropertyDescriptor(Object.prototype, trap)
      const restore = original && Object.assign(Object.create(null), original)
      const failure = {message: 'Inherited private Proxy trap reached'}
      let value: unknown, caught: unknown
      try {
        Object.defineProperty(Object.prototype, trap, {
          configurable: true,
          get() {
            throw failure
          },
        })
        if (trap === 'get') value = Reflect.construct(Constructor, args)
        else Reflect.apply(Constructor, undefined, args)
      } catch (error) {
        caught = error
      } finally {
        if (restore) Object.defineProperty(Object.prototype, trap, restore)
        else Reflect.deleteProperty(Object.prototype, trap)
      }
      if (trap === 'get') {
        expect(caught, name).toBeUndefined()
        expect(Object.getPrototypeOf(value), name).toBe(prototype)
      } else expect(caught, name).toBeInstanceOf(TypeError)
    }
  }
)

it('retains private Proxy allocation intrinsics for lazy locale formatting', () => {
  const originalProxy = Object.getOwnPropertyDescriptor(globalThis, 'Proxy')!
  const originalSetPrototypeOf = Object.setPrototypeOf
  const failure = {message: 'Mutable private Proxy intrinsic reached'}
  let actual: string
  try {
    Object.defineProperty(globalThis, 'Proxy', {
      ...originalProxy,
      value() {
        throw failure
      },
    })
    Object.setPrototypeOf = () => {
      throw failure
    }
    actual = new Temporal.PlainDate(2024, 2, 29).toLocaleString('en', {
      year: 'numeric',
    })
  } finally {
    Object.defineProperty(globalThis, 'Proxy', originalProxy)
    Object.setPrototypeOf = originalSetPrototypeOf
  }
  expect(actual!).toBe('2024')
})

it.each([
  [8_640_000_000_000_000_000_001n, undefined, undefined],
  [-8_640_000_000_000_000_000_001n, {}, undefined],
  [8_640_000_000_000_000_000_001n, 'UTC', {}],
] as const)(
  'validates ZonedDateTime epoch range before other arguments',
  (epoch, zone, calendar) => {
    expect(() =>
      Reflect.construct(Temporal.ZonedDateTime, [epoch, zone, calendar])
    ).toThrow(RangeError)
  }
)

it.each([
  ['prototype', Object.prototype, 'hasOwnProperty'],
  ['static', Object, 'hasOwn'],
] as const)(
  'retains %s own-property checks in public operations',
  (_name, owner, key) => {
    const original = Object.getOwnPropertyDescriptor(owner, key)!
    let actual: unknown
    try {
      Object.defineProperty(owner, key, {
        ...original,
        value() {
          throw new Error('Mutable own-property method reached')
        },
      })
      actual = [
        new Temporal.PlainDate(2024, 2, 29).toLocaleString('en', {
          year: 'numeric',
        }),
        new Temporal.Duration(0, 0, 0, 0, 1).total({unit: 'minute'}),
        new Temporal.Instant(1n).round('second').epochNanoseconds,
      ]
    } finally {
      Object.defineProperty(owner, key, original)
    }
    expect(actual).toEqual(['2024', 60, 0n])
  }
)

it.each(['includes', 'indexOf'] as const)(
  'uses private list searches without mutable Array.prototype.%s',
  name => {
    const original = Object.getOwnPropertyDescriptor(Array.prototype, name)!
    let actual: unknown
    try {
      Object.defineProperty(Array.prototype, name, {
        ...original,
        value() {
          throw new Error('Mutable private list search reached')
        },
      })
      actual = [
        new Temporal.PlainDate(2000, 2, 29).withCalendar('hebrew').calendarId,
        new Temporal.PlainTime(12, 34, 56).round('minute').toString(),
        new Temporal.Instant(1n).round('second').epochNanoseconds,
        Temporal.PlainDate.from('2000-05-06').toString(),
      ]
    } finally {
      Object.defineProperty(Array.prototype, name, original)
    }
    expect(actual).toEqual(['hebrew', '12:35:00', 0n, '2000-05-06'])
  }
)

const unitShorthandCases: readonly [string, () => () => unknown, unknown][] = [
  [
    'Instant.round',
    () => {
      const value = new Temporal.Instant(90_000_000_000n)
      return () => value.round('minute').epochNanoseconds
    },
    120_000_000_000n,
  ],
  [
    'PlainTime.round',
    () => {
      const value = new Temporal.PlainTime(12, 34, 45)
      return () => value.round('minute').toJSON()
    },
    '12:35:00',
  ],
  [
    'PlainDateTime.round',
    () => {
      const value = new Temporal.PlainDateTime(2000, 1, 2, 12, 34, 45)
      return () => value.round('minute').toJSON()
    },
    '2000-01-02T12:35:00',
  ],
  [
    'ZonedDateTime.round',
    () => {
      const value = Temporal.ZonedDateTime.from('2000-01-02T12:34:45Z[UTC]')
      return () => value.round('minute').epochNanoseconds
    },
    946_816_500_000_000_000n,
  ],
  [
    'Duration.round',
    () => {
      const value = new Temporal.Duration(0, 0, 0, 0, 1, 30)
      return () => value.round('hour').toJSON()
    },
    'PT2H',
  ],
  [
    'Duration.total',
    () => {
      const value = new Temporal.Duration(0, 0, 0, 0, 1, 30)
      return () => value.total('minute')
    },
    90,
  ],
]

it.each(unitShorthandCases)(
  '%s string shorthand never reads mutable Object.assign',
  (_name, prepare, expected) => {
    const run = prepare()
    const original = Object.getOwnPropertyDescriptor(Object, 'assign')!
    let actual: unknown
    try {
      Object.defineProperty(Object, 'assign', {
        configurable: true,
        get() {
          throw new Error('Mutable Object.assign reached')
        },
      })
      actual = run()
    } finally {
      Object.defineProperty(Object, 'assign', original)
    }
    expect(actual).toEqual(expected)
  }
)

it.each(unitShorthandCases)(
  '%s string shorthand ignores inherited option getters and setters',
  (_name, prepare, expected) => {
    const run = prepare()
    const names = [
      'smallestUnit',
      'unit',
      'largestUnit',
      'relativeTo',
      'roundingMode',
      'roundingIncrement',
    ]
    const original = names.map(name =>
      Object.getOwnPropertyDescriptor(Object.prototype, name)
    )
    let actual: unknown
    try {
      for (const name of names)
        Object.defineProperty(Object.prototype, name, {
          configurable: true,
          get() {
            throw new Error(`Inherited option Get ${name}`)
          },
          set() {
            throw new Error(`Inherited option Set ${name}`)
          },
        })
      actual = run()
    } finally {
      for (let index = 0; index < names.length; index++) {
        const descriptor = original[index]
        if (descriptor)
          Object.defineProperty(Object.prototype, names[index], descriptor)
        else Reflect.deleteProperty(Object.prototype, names[index])
      }
    }
    expect(actual).toEqual(expected)
  }
)

const indexedParserCases = [
  {
    name: 'public Instant',
    run: () =>
      Instant.from(
        '1970-01-01T00:00:00.000000001Z[!Made/Up][u-ca=unknown][x=Some-Value]'
      ).epochNanoseconds,
    expected: 1n,
    reject: () => Instant.from('1970-01-01T00Z[u-ca=iso8601][!u-ca=hebrew]'),
  },
  {
    name: 'public PlainTime',
    run: () => Temporal.PlainTime.from('00:00:00.000000001[UTC]').nanosecond,
    expected: 1,
    reject: () => Temporal.PlainTime.from('12:34[!x=abc]'),
  },
  {
    name: 'ISO fields',
    run: () => {
      const fields = parseISODateParts(
        '2000-02-29T12:34:56,123456789[UTC][u-ca=iso8601]'
      )
      return [
        fields.year,
        fields.month,
        fields.day,
        fields.hour,
        fields.minute,
        fields.second,
        fields.millisecond,
        fields.microsecond,
        fields.nanosecond,
        fields.calendar,
      ]
    },
    expected: [2000, 2, 29, 12, 34, 56, 123, 456, 789, 'iso8601'],
    reject: () => parseISODateParts('2000-02-30[UTC]'),
  },
  {
    name: 'short year-month',
    run: () => parseShortDateString('2000-02[u-ca=ISO8601]', 'year-month'),
    expected: {year: 2000, month: 2, day: 1, calendar: 'iso8601'},
    reject: () => parseShortDateString('2000-02[u-ca=hebrew]', 'year-month'),
  },
  {
    name: 'short month-day',
    run: () => parseShortDateString('--02-29[u-ca=iso8601]', 'month-day'),
    expected: {year: 1972, month: 2, day: 29, calendar: 'iso8601'},
    reject: () => parseShortDateString('--02-30', 'month-day'),
  },
  {
    name: 'calendar string',
    run: () => parseCalendarString('2000-02-29T12:34:56Z[u-ca=ISO8601]'),
    expected: 'ISO8601',
    reject: () => parseCalendarString('2000-02-29[x=]'),
  },
  {
    name: 'timezone string',
    run: () => parseTimeZoneString('2000-02-29T12:34:56Z[UTC]'),
    expected: 'UTC',
    reject: () => parseTimeZoneString('12:34Z'),
  },
  {
    name: 'zoned fields',
    run: () => {
      const parsed = parseZonedDateTimeString(
        '2000-02-29T12:34:56.000000001+00:00[UTC][u-ca=iso8601]'
      )
      return [
        parsed.fields.year,
        parsed.fields.nanosecond,
        parsed.timeZone,
        parsed.offset,
      ]
    },
    expected: [2000, 1, 'UTC', '+00:00'],
    reject: () => parseZonedDateTimeString('2000-01-01T00[u-ca=iso8601]'),
  },
]

it.each([
  [RegExp.prototype, 'exec'],
  [RegExp.prototype, 'test'],
  [String.prototype, 'slice'],
  [String.prototype, 'indexOf'],
  [String.prototype, 'includes'],
  [String.prototype, 'replace'],
  [String.prototype, 'toLowerCase'],
] as const)(
  'parses valid and invalid ISO strings without mutable %s.%s',
  (owner, key) => {
    expect(nativeTemporal()).toBeUndefined()
    const descriptor = Object.getOwnPropertyDescriptor(owner, key)!
    const sentinel = new Error('Observable ISO parser method')
    const actual: unknown[] = []
    const failures: unknown[] = []
    const rejected: unknown[] = []
    let hooks = 0
    try {
      Object.defineProperty(owner, key, {
        configurable: true,
        get() {
          hooks++
          throw sentinel
        },
      })
      for (let index = 0; index < indexedParserCases.length; index++) {
        try {
          actual.push(indexedParserCases[index].run())
        } catch (error) {
          failures.push(error)
        }
        try {
          indexedParserCases[index].reject()
          rejected.push(undefined)
        } catch (error) {
          rejected.push(error)
        }
      }
    } finally {
      Object.defineProperty(owner, key, descriptor)
    }
    expect(hooks).toBe(0)
    expect(failures).toEqual([])
    expect(actual).toEqual(indexedParserCases.map(entry => entry.expected))
    expect(rejected).toHaveLength(indexedParserCases.length)
    for (const error of rejected) expect(error).toBeInstanceOf(RangeError)
  }
)

it('preserves legacy RegExp state across valid and invalid ISO parser entrypoints', () => {
  expect(nativeTemporal()).toBeUndefined()
  ;/(ISO parser marker)/.exec('ISO parser marker')
  const expected = [RegExp.$1, RegExp.lastMatch, RegExp.input]
  const failures: unknown[] = []
  const rejected: unknown[] = []
  for (let index = 0; index < indexedParserCases.length; index++) {
    try {
      indexedParserCases[index].run()
    } catch (error) {
      failures.push(error)
    }
    try {
      indexedParserCases[index].reject()
      rejected.push(undefined)
    } catch (error) {
      rejected.push(error)
    }
  }
  const actual = [RegExp.$1, RegExp.lastMatch, RegExp.input]
  expect(actual).toEqual(expected)
  expect(failures).toEqual([])
  for (const error of rejected) expect(error).toBeInstanceOf(RangeError)
})

it.each([
  ['19700101T000000.123456790+000000.123456789', 1n],
  ['19691231T235959.876543210-000000.123456789', -1n],
] as const)(
  'cancels basic clock and offset fractions exactly for %s',
  (input, expected) => {
    expect(Instant.from(input).epochNanoseconds).toBe(expected)
  }
)

it('retains the first noncritical calendar when short-date policy consumes it', () => {
  expect(
    parseShortDateString('2000-02[u-ca=ISO8601][u-ca=hebrew]', 'year-month')
  ).toEqual({year: 2000, month: 2, day: 1, calendar: 'iso8601'})
  expect(() =>
    parseShortDateString('2000-02[u-ca=hebrew][u-ca=iso8601]', 'year-month')
  ).toThrow(RangeError)
})

it('validates a timezone body offset before an annotation takes precedence', () => {
  expect(parseTimeZoneString('2000-01-01T12+01[UTC]')).toBe('UTC')
  expect(() => parseTimeZoneString('2000-01-01T12+24[UTC]')).toThrow(RangeError)
})

it('accepts annotation key boundaries and requires nonempty value components', () => {
  expect(Instant.from('1970-01-01T00Z[_x-0=Ab9-C0]').epochNanoseconds).toBe(0n)
  for (const input of ['1970-01-01T00Z[_x-0=-Ab]', '1970-01-01T00Z[_x-0=Ab-]'])
    expect(() => Instant.from(input)).toThrow(RangeError)
})

it.each([
  ['1', 100_000_000n],
  ['00000001', 10n],
] as const)(
  'scales a %s clock fraction to exact nanoseconds',
  (fraction, expected) => {
    expect(
      Instant.from('1970-01-01T00:00:00.' + fraction + 'Z').epochNanoseconds
    ).toBe(expected)
  }
)

import assert from 'node:assert/strict'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

const directory = runfiles.resolve(process.argv[2])
const load = name => import(pathToFileURL(join(directory, name)).href)
const Native = Intl.DateTimeFormat
const date = {year: 'numeric', month: '2-digit', day: '2-digit'}
const time = {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  fractionalSecondDigits: 3,
  hourCycle: 'h23',
}
const cases = [
  {
    name: 'PlainDate',
    options: date,
    first: Date.UTC(2024, 0, 2, 12),
    last: Date.UTC(2024, 0, 3, 12),
    values: T => [new T.PlainDate(2024, 1, 2), new T.PlainDate(2024, 1, 3)],
  },
  {
    name: 'PlainDateTime',
    options: {...date, ...time},
    first: Date.UTC(2024, 0, 2, 3, 4, 5, 123),
    last: Date.UTC(2024, 0, 3, 3, 4, 5, 123),
    values: T => [
      new T.PlainDateTime(2024, 1, 2, 3, 4, 5, 123, 456, 789),
      new T.PlainDateTime(2024, 1, 3, 3, 4, 5, 123, 456, 789),
    ],
  },
  {
    name: 'PlainTime',
    options: time,
    first: Date.UTC(1970, 0, 1, 3, 4, 5, 123),
    last: Date.UTC(1970, 0, 1, 4, 4, 5, 123),
    values: T => [
      new T.PlainTime(3, 4, 5, 123, 456, 789),
      new T.PlainTime(4, 4, 5, 123, 456, 789),
    ],
  },
  {
    name: 'PlainYearMonth',
    options: {calendar: 'iso8601', year: 'numeric', month: '2-digit'},
    first: Date.UTC(2024, 0, 1, 12),
    last: Date.UTC(2024, 1, 1, 12),
    values: T => [new T.PlainYearMonth(2024, 1), new T.PlainYearMonth(2024, 2)],
  },
  {
    name: 'PlainMonthDay',
    options: {calendar: 'iso8601', month: '2-digit', day: '2-digit'},
    first: Date.UTC(1972, 0, 2, 12),
    last: Date.UTC(1972, 0, 3, 12),
    values: T => [new T.PlainMonthDay(1, 2), new T.PlainMonthDay(1, 3)],
  },
  {
    name: 'Instant',
    options: {...date, ...time},
    first: Date.UTC(2024, 0, 2, 3, 4, 5, 123),
    last: Date.UTC(2024, 0, 3, 3, 4, 5, 123),
    values: T => [
      T.Instant.from('2024-01-02T03:04:05.123456789Z'),
      T.Instant.from('2024-01-03T03:04:05.123456789Z'),
    ],
  },
  {
    name: 'Instant submillisecond',
    options: {...date, ...time},
    first: -1,
    last: 0,
    values: T => [new T.Instant(-1n), new T.Instant(1n)],
  },
].map(sample => {
  const options = {...sample.options, timeZone: 'UTC'}
  const formatter = new Native('en', options)
  return {
    ...sample,
    options,
    expected: {
      text: formatter.format(sample.first),
      parts: formatter.formatToParts(sample.first),
      range: formatter.formatRange(sample.first, sample.last),
      rangeParts: formatter.formatRangeToParts(sample.first, sample.last),
      fresh: formatter.format(sample.first),
    },
  }
})

const {Temporal} = await load('index.js')
// ECMA-402 §11.5.11 step 2.b: provider caching adds no public method calls.
{
  const value = new Temporal.ZonedDateTime(0n, 'UTC')
  const options = {year: 'numeric', month: 'numeric', day: 'numeric'}
  const expected = new Native('en', {...options, timeZone: 'UTC'}).format(0)
  assert.equal(value.toLocaleString('en', options), expected)
  const outcomes = []
  for (const [prototype, method, label] of [
    [Map.prototype, 'has', 'Map.has'],
    [Map.prototype, 'get', 'Map.get'],
    [WeakMap.prototype, 'get', 'WeakMap.get'],
  ]) {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, method)
    const sentinel = new Error(`Mutable zoned locale ${label}`)
    let calls = 0,
      actual,
      error
    try {
      Object.defineProperty(prototype, method, {
        ...descriptor,
        value() {
          calls++
          throw sentinel
        },
      })
      actual = value.toLocaleString('en', options)
    } catch (caught) {
      error = caught
    } finally {
      Object.defineProperty(prototype, method, descriptor)
    }
    outcomes.push({label, calls, actual, error})
  }
  assert.deepEqual(
    outcomes.map(({label, calls}) => [label, calls]),
    [
      ['Map.has', 0],
      ['Map.get', 0],
      ['WeakMap.get', 0],
    ],
    'Zoned locale cache ignores replaced collection methods'
  )
  for (const {label, actual, error} of outcomes) {
    assert.equal(error, undefined, label)
    assert.equal(actual, expected, label)
  }
}
const nativeFormatterMethods = [
  Native.prototype.resolvedOptions,
  Native.prototype.formatToParts,
  Native.prototype.formatRange,
  Native.prototype.formatRangeToParts,
  Object.getOwnPropertyDescriptor(Native.prototype, 'format').get,
  Object.getOwnPropertyDescriptor(Intl.NumberFormat.prototype, 'format').get,
]
await load('polyfill-force.js')
assert.notEqual(
  Intl.DateTimeFormat,
  Native,
  'Exercise installed native-Intl bridge'
)
{
  const minimum = -8_640_000_000_000_000
  const maximum = -minimum
  const day = 86_400_000
  const first = Temporal.PlainDate.from('-271821-04-19')
  const second = first.add({days: 1})
  const last = Temporal.PlainDate.from('+275760-09-13')
  const penultimate = last.subtract({days: 1})
  for (const calendar of ['islamic', 'islamic-rgsa']) {
    const options = {
      calendar,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      weekday: 'long',
      timeZone: 'UTC',
    }
    const utc = new Native('en', options)
    if (utc.resolvedOptions().calendar !== calendar) continue
    const west = new Native('en', {...options, timeZone: 'Etc/GMT+12'})
    const formatter = new Intl.DateTimeFormat('en', options)
    // Warm the ordinary PlainDate projection before exercising either edge.
    formatter.format(second)
    for (const [date, host, milliseconds] of [
      [first, west, minimum],
      [last, utc, maximum],
    ]) {
      assert.equal(formatter.format(date), host.format(milliseconds))
      assert.deepEqual(
        formatter.formatToParts(date),
        host.formatToParts(milliseconds)
      )
      assert.equal(
        date.toLocaleString('en', options),
        host.format(milliseconds)
      )
    }
    for (const [start, end, host, startMs, endMs] of [
      [first, second, west, minimum, minimum + day],
      [second, first, west, minimum + day, minimum],
      [penultimate, last, utc, maximum - day, maximum],
    ]) {
      assert.equal(
        formatter.formatRange(start, end),
        host.formatRange(startMs, endMs)
      )
      assert.deepEqual(
        formatter.formatRangeToParts(start, end),
        host.formatRangeToParts(startMs, endMs)
      )
    }
    for (const [start, end, startParts, endParts] of [
      [first, last, west.formatToParts(minimum), utc.formatToParts(maximum)],
      [last, first, utc.formatToParts(maximum), west.formatToParts(minimum)],
    ]) {
      const parts = formatter.formatRangeToParts(start, end)
      for (const [source, reference] of [
        ['startRange', startParts],
        ['endRange', endParts],
      ]) {
        assert.deepEqual(
          parts
            .filter(part => part.source === source)
            .map(({type, value}) => ({type, value})),
          reference
        )
      }
      assert.equal(
        formatter.formatRange(start, end),
        parts.map(part => part.value).join('')
      )
    }
  }
}
{
  const defineProperty = Object.defineProperty
  const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
  const originalBound = getOwnPropertyDescriptor(Object.prototype, 'bound')
  const [value] = cases[0].values(Temporal)
  const formatter = new Intl.DateTimeFormat('en', cases[0].options)
  const receiver = Object.create(Intl.DateTimeFormat.prototype)
  const probe = Object.create(Native.prototype)
  const chainSupported = Native.call(probe, 'en') === probe
  let bound, chained
  try {
    defineProperty(Object.prototype, 'bound', {
      configurable: true,
      get() {
        throw new Error('Unexpected inherited bound formatter')
      },
    })
    Object.defineProperty = () => {
      throw new Error('Unexpected mutable Object.defineProperty')
    }
    bound = formatter.format
    if (chainSupported)
      chained = Intl.DateTimeFormat.call(receiver, 'en', cases[0].options)
  } finally {
    Object.defineProperty = defineProperty
    if (originalBound) defineProperty(Object.prototype, 'bound', originalBound)
    else Reflect.deleteProperty(Object.prototype, 'bound')
  }
  assert.equal(bound, formatter.format, 'The bound formatter is cached')
  assert.equal(bound.name, '')
  assert.equal(bound.length, 1)
  assert.equal(bound(value), cases[0].expected.text)
  if (chainSupported) {
    assert.equal(chained, receiver)
    assert.equal(chained.format(value), cases[0].expected.text)
  }
}
{
  const hooks = [
    [Array.prototype, 'map'],
    [Array.prototype, 'find'],
    [Set.prototype, 'has'],
    [Map.prototype, 'get'],
    [Map.prototype, 'set'],
    [WeakMap.prototype, 'get'],
    [WeakMap.prototype, 'set'],
    [RegExp.prototype, 'exec'],
  ].map(([target, key]) => [
    target,
    key,
    Object.getOwnPropertyDescriptor(target, key),
  ])
  const [first, last] = cases[0].values(Temporal)
  for (const calendar of ['chinese', 'dangi']) {
    const options = {...cases[0].options, calendar}
    const reference = new Native('en', options)
    for (const method of ['formatRange', 'formatRangeToParts']) {
      const expected = reference[method](cases[0].first, cases[0].last)
      const formatter = new Intl.DateTimeFormat('en', options)
      let actual
      try {
        for (const [target, key, descriptor] of hooks) {
          Object.defineProperty(target, key, {
            ...descriptor,
            value() {
              throw new Error(`Unexpected calendar field hook ${key}`)
            },
          })
        }
        actual = formatter[method](first, last)
      } finally {
        for (const [target, key, descriptor] of hooks)
          Object.defineProperty(target, key, descriptor)
      }
      assert.deepEqual(actual, expected, `${calendar} ${method}`)
    }
  }
}
{
  for (const sample of [cases[0], cases[5]]) {
    const [first, last] = sample.values(Temporal)
    for (const [method, expected] of [
      ['formatRange', sample.expected.range],
      ['formatRangeToParts', sample.expected.rangeParts],
    ]) {
      for (const [key, kind] of [
        ['push', 'value'],
        ['0', 'set'],
      ]) {
        const formatter = new Intl.DateTimeFormat('en', sample.options)
        const original = Object.getOwnPropertyDescriptor(Array.prototype, key)
        let actual
        try {
          Object.defineProperty(Array.prototype, key, {
            configurable: true,
            [kind]() {
              throw new Error(`Unexpected Array.prototype[${key}] hook`)
            },
          })
          actual = formatter[method](first, last)
        } finally {
          if (original) Object.defineProperty(Array.prototype, key, original)
          else Reflect.deleteProperty(Array.prototype, key)
        }
        assert.deepEqual(actual, expected, `${sample.name} ${method} ${key}`)
      }
    }
  }
}
{
  const [first, last] = cases[1].values(Temporal)
  const formatter = new Intl.DateTimeFormat('en', cases[1].options)
  const style = new Temporal.PlainYearMonth(2024, 2, 'gregory')
  const operations = [
    () => formatter.format(first),
    () => formatter.formatToParts(first),
    () => formatter.formatRange(first, last),
    () => formatter.formatRangeToParts(first, last),
    () => new Intl.DateTimeFormat('en', cases[1].options).format(first),
    () => style.toLocaleString('en', {calendar: 'gregory', dateStyle: 'full'}),
  ]
  const expected = operations.map(run => run())
  try {
    for (const hook of nativeFormatterMethods) {
      Object.defineProperty(hook, 'call', {
        configurable: true,
        get() {
          throw new Error('Unexpected legacy formatter call lookup')
        },
      })
    }
    assert.deepEqual(
      operations.map(run => run()),
      expected
    )
  } finally {
    for (const hook of nativeFormatterMethods) delete hook.call
  }
}
{
  const value = new Temporal.ZonedDateTime(0n, 'UTC')
  const options = {year: 'numeric'}
  const operations = [
    () => value.toLocaleString('en', options),
    () => new Intl.DateTimeFormat('en', options).format(0),
    () => new Intl.DateTimeFormat('en', 0).format(0),
  ]
  const expected = operations.map(run => run())
  const OriginalObject = Object
  let actual
  try {
    globalThis.Object = new Proxy(OriginalObject, {
      apply() {
        throw new Error('Unexpected global Object call')
      },
    })
    actual = operations.map(run => run())
  } finally {
    globalThis.Object = OriginalObject
  }
  assert.deepEqual(actual, expected)
  const reads = []
  const conflictingZone = {
    get calendar() {
      reads.push('calendar')
      return 'iso8601'
    },
    get timeZone() {
      reads.push('timeZone')
      return 'UTC'
    },
    get hour() {
      reads.push('hour')
      return 'numeric'
    },
  }
  assert.throws(() => value.toLocaleString('a', conflictingZone), RangeError)
  assert.deepEqual(reads, [])
  assert.throws(() => value.toLocaleString('en', conflictingZone), TypeError)
  assert.deepEqual(reads, ['calendar', 'timeZone'])
}
let scenarios = 0
for (const sample of cases) {
  const [first, last] = sample.values(Temporal)
  for (const [prototype, method, label] of [
    [WeakMap.prototype, 'get', 'WeakMap.get'],
    [WeakMap.prototype, 'set', 'WeakMap.set'],
    [Map.prototype, 'get', 'Map.get'],
    [Map.prototype, 'set', 'Map.set'],
    [Reflect, 'apply', 'Reflect.apply'],
    [Reflect, 'construct', 'Reflect.construct'],
    [globalThis, 'Map', 'Map constructor'],
  ]) {
    for (const warm of [false, true]) {
      const create = () => new Intl.DateTimeFormat('en', sample.options)
      const formatter = create()
      if (warm) {
        formatter.formatToParts(first)
        formatter.formatToParts(last)
      }
      const descriptor = Object.getOwnPropertyDescriptor(prototype, method)
      let actual,
        error,
        observed,
        calls = 0
      try {
        Object.defineProperty(prototype, method, {
          value: function () {
            calls++
            observed = new Error(`Mutable ${label}`)
            throw observed
          },
        })
        actual = {
          text: formatter.format(first),
          parts: formatter.formatToParts(first),
          range: formatter.formatRange(first, last),
          rangeParts: formatter.formatRangeToParts(first, last),
          fresh: create().format(first),
        }
      } catch (caught) {
        error = caught
      } finally {
        Object.defineProperty(prototype, method, descriptor)
      }
      assert.equal(
        calls,
        0,
        `${sample.name} ${label} warm=${warm}: ${observed?.stack}`
      )
      assert.equal(
        error,
        undefined,
        `${sample.name} ${label} warm=${warm}: ${error?.stack}`
      )
      assert.deepEqual(
        actual,
        sample.expected,
        `${sample.name} ${label} warm=${warm}`
      )
      scenarios++
    }
  }
}
assert.equal(scenarios, 98)
console.log(
  '98 packaged Temporal/native-Intl private storage and dispatch controls'
)

// Proposal comparison §15.4.1 steps 45.b–c precede Temporal calendar matching.
// https://tc39.es/proposal-temporal/#sec-createdatetimeformat
{
  const japanese = new Temporal.PlainDate(2020, 1, 2, 'japanese')
  const reads = []
  assert.throws(
    () =>
      japanese.toLocaleString('en', {
        get calendar() {
          reads.push('calendar')
          return 'gregory'
        },
        get timeStyle() {
          reads.push('timeStyle')
          return 'short'
        },
      }),
    TypeError
  )
  assert.deepEqual(reads, ['calendar', 'timeStyle'])
  assert.throws(
    () =>
      japanese.toLocaleString('en', {calendar: 'gregory', dateStyle: 'full'}),
    RangeError
  )
}

// Style inference must not call replaceable Array methods or Object.keys.
{
  const date = new Temporal.PlainDate(2020, 1, 2)
  const expected = new Native('en', {
    dateStyle: 'full',
    timeZone: 'UTC',
  }).format(Date.UTC(2020, 0, 2, 12))
  for (const [target, key] of [
    [Array.prototype, 'map'],
    [Array.prototype, 'filter'],
    [Array.prototype, 'join'],
    [Object, 'keys'],
  ]) {
    const descriptor = Object.getOwnPropertyDescriptor(target, key)
    let calls = 0,
      actual,
      error
    try {
      Object.defineProperty(target, key, {
        ...descriptor,
        value() {
          calls++
          throw new Error('private style hook')
        },
      })
      try {
        actual = date.toLocaleString('en', {dateStyle: 'full'})
      } catch (caught) {
        error = caught
      }
    } finally {
      Object.defineProperty(target, key, descriptor)
    }
    assert.equal(error, undefined, `${key}: ${error?.stack}`)
    assert.equal(calls, 0, key)
    assert.equal(actual, expected, key)
  }
}

// Temporal §15.6.1 steps 1–5 use private field lists.
{
  const date = new Temporal.PlainDate(2020, 1, 2)
  const yearMonth = new Temporal.PlainYearMonth(2020, 1, 'gregory')
  const samples = [
    [date, {dateStyle: 'full'}, {dateStyle: 'full'}, 'style'],
    [
      yearMonth,
      {calendar: 'gregory', dateStyle: 'full'},
      {calendar: 'gregory', year: 'numeric', month: 'long'},
      'narrowed style',
    ],
    [
      date,
      {year: 'numeric', month: 'long'},
      {year: 'numeric', month: 'long'},
      'components',
    ],
    [
      date,
      undefined,
      {year: 'numeric', month: 'numeric', day: 'numeric'},
      'defaults',
    ],
  ].map(([value, options, reference, label]) => ({
    value,
    options,
    label,
    expected: new Native('en', {...reference, timeZone: 'UTC'}).format(
      Date.UTC(2020, 0, 2, 12)
    ),
  }))
  const iteratorPrototype = Object.getPrototypeOf([][Symbol.iterator]())
  for (const [target, key, label] of [
    [Array.prototype, Symbol.iterator, 'Array.iterator'],
    [iteratorPrototype, 'next', 'ArrayIterator.next'],
  ]) {
    const descriptor = Object.getOwnPropertyDescriptor(target, key)
    let calls = 0,
      actual,
      error
    try {
      Object.defineProperty(target, key, {
        ...descriptor,
        value() {
          calls++
          throw new Error('Mutable private option iterator')
        },
      })
      actual = []
      for (let index = 0; index < samples.length; index++) {
        const sample = samples[index]
        actual[index] = sample.value.toLocaleString('en', sample.options)
      }
    } catch (caught) {
      error = caught
    } finally {
      Object.defineProperty(target, key, descriptor)
    }
    assert.equal(error, undefined, `${label}: ${error?.stack}`)
    assert.equal(calls, 0, label)
    assert.deepEqual(
      actual,
      samples.map(sample => sample.expected),
      label
    )
  }
}

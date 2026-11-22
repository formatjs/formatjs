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

// Proposal comparison §15.4.1 steps 45.f–j: private option Lists have no iterators.
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
